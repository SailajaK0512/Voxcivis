import os
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_

from .config import DEFAULT_DEPARTMENTS, LOCATION_DATA
from .database import engine, get_db, Base
from .models import User, Department, Complaint, ComplaintReport, Notification
from .schemas import (
    UserRegister, UserLogin, UserOut, TokenResponse, DepartmentOut,
    ComplaintCreate, ComplaintStatusUpdate, DelayNotificationCreate,
    ComplaintOut, NotificationOut, DashboardMetrics, DepartmentDistribution, MonthlyTrend
)
from .auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, require_roles
)
from .ml.classifier import predict_department
from .ml.severity import detect_severity
from .ml.similarity import find_duplicate_complaint
from .services.priority import calculate_priority_score
from .services.notifier import notify_status_change, notify_delay
from .websocket import manager

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VoxCivis API",
    description="Municipal and Safe-City Citizen Complaint Management System",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Seed default departments if missing
    db = next(get_db())
    try:
        if db.query(Department).count() == 0:
            for dept in DEFAULT_DEPARTMENTS:
                db_dept = Department(
                    name=dept["name"],
                    code=dept["code"],
                    description=dept["description"],
                    is_active=True
                )
                db.add(db_dept)
            db.commit()
    finally:
        db.close()

# ==========================================
# PUBLIC / META ENDPOINTS
# ==========================================

@app.get("/api/meta/departments", response_model=List[DepartmentOut])
def get_departments(db: Session = Depends(get_db)):
    """Returns active municipal departments for selection."""
    return db.query(Department).filter(Department.is_active == True).all()

@app.get("/api/meta/locations")
def get_locations():
    """Returns official States and Districts for dropdown selection."""
    return LOCATION_DATA

# ==========================================
# AUTHENTICATION ENDPOINTS
# ==========================================

@app.post("/api/auth/register", response_model=TokenResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Registers a citizen, worker, or administrator with full demographic details."""
    # Check if username exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    # Check if ID number exists
    if db.query(User).filter(User.id_number == user_data.id_number).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID Number already registered"
        )

    # Validate worker department
    if user_data.role == "worker" and not user_data.department_id:
        # Default to first department if worker didn't select one
        first_dept = db.query(Department).first()
        user_data.department_id = first_dept.id if first_dept else None

    user = User(
        username=user_data.username,
        password_hash=get_password_hash(user_data.password),
        id_number=user_data.id_number,
        date_of_birth=user_data.date_of_birth,
        phone_number=user_data.phone_number,
        state=user_data.state,
        district=user_data.district,
        mandal=user_data.mandal,
        sector=user_data.sector,
        village_name=user_data.village_name,
        pincode=user_data.pincode,
        address=user_data.address,
        role=user_data.role,
        department_id=user_data.department_id if user_data.role == "worker" else None
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.username, "role": user.role, "user_id": user.id})
    user_out = UserOut.from_orm(user)
    if user.department:
        user_out.department_name = user.department.name

    return {"access_token": token, "token_type": "bearer", "user": user_out}

@app.post("/api/auth/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Authenticates user and returns JWT access token."""
    user = db.query(User).filter(User.username == credentials.username).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({"sub": user.username, "role": user.role, "user_id": user.id})
    user_out = UserOut.from_orm(user)
    if user.department:
        user_out.department_name = user.department.name

    return {"access_token": token, "token_type": "bearer", "user": user_out}

@app.get("/api/auth/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Returns currently authenticated user profile."""
    user_out = UserOut.from_orm(current_user)
    if current_user.department:
        user_out.department_name = current_user.department.name
    return user_out

# ==========================================
# CITIZEN COMPLAINT SUBMISSION & TRACKING
# ==========================================

@app.post("/api/complaints", response_model=ComplaintOut)
async def submit_complaint(
    payload: ComplaintCreate,
    current_user: User = Depends(require_roles("citizen", "admin")),
    db: Session = Depends(get_db)
):
    """
    Submits a civic complaint:
    1. Duplicate check: searches existing unresolved complaints in same pincode.
    2. ML classification: predicts department from text.
    3. Severity detector: identifies hazards and public danger.
    4. Calculates priority score and tier.
    5. Saves and notifies connected WebSocket dashboards.
    """
    # 1. Duplicate Detection in the same pincode
    recent_complaints = db.query(Complaint).filter(
        Complaint.pincode == payload.pincode,
        Complaint.status != "Solved"
    ).all()

    candidates = [{"id": c.id, "text": c.complaint_text} for c in recent_complaints]
    duplicate_match = find_duplicate_complaint(payload.complaint_text, candidates)

    if duplicate_match:
        parent_id, sim_score = duplicate_match
        parent_complaint = db.query(Complaint).filter(Complaint.id == parent_id).first()
        if parent_complaint:
            # Register individual citizen report
            report = ComplaintReport(
                complaint_id=parent_complaint.id,
                reporting_citizen_id=current_user.id,
                report_text=payload.complaint_text,
                reported_at=datetime.utcnow()
            )
            db.add(report)
            parent_complaint.number_of_reports += 1

            # Recalculate priority with new report count
            sev_info = detect_severity(parent_complaint.complaint_text, parent_complaint.address)
            new_score, new_class = calculate_priority_score(
                is_severe=parent_complaint.is_severe,
                area_importance=parent_complaint.area_importance,
                number_of_reports=parent_complaint.number_of_reports,
                issue_time=parent_complaint.issue_time,
                status=parent_complaint.status,
                is_critical=sev_info["is_critical"],
                severity_bonus=sev_info["severity_bonus"]
            )
            parent_complaint.priority_score = new_score
            parent_complaint.priority_classification = new_class
            parent_complaint.last_updated = datetime.utcnow()
            db.commit()
            db.refresh(parent_complaint)

            # Broadcast update
            await manager.broadcast_event(
                event_type="COMPLAINT_UPDATED",
                payload={
                    "complaint_id": parent_complaint.id,
                    "number_of_reports": parent_complaint.number_of_reports,
                    "priority_score": parent_complaint.priority_score,
                    "priority_classification": parent_complaint.priority_classification
                },
                department_id=parent_complaint.department_id
            )

            res = ComplaintOut.from_orm(parent_complaint)
            res.citizen_username = parent_complaint.citizen.username if parent_complaint.citizen else "Citizen"
            res.department_name = parent_complaint.department.name if parent_complaint.department else ""
            return res

    # 2. ML Department Prediction
    predicted_dept_name, conf = predict_department(payload.complaint_text)
    dept = db.query(Department).filter(Department.name.ilike(f"%{predicted_dept_name}%")).first()
    if not dept:
        dept = db.query(Department).first()

    # 3. Severity & Hazard Analysis
    sev_info = detect_severity(payload.complaint_text, payload.address)
    is_severe = sev_info["is_severe"]
    is_critical = sev_info["is_critical"]
    severity_bonus = sev_info["severity_bonus"]

    # Area importance: user input or auto-detected landmark
    area_imp = payload.area_importance or 0
    if area_imp == 0 and sev_info["auto_important_area"]:
        area_imp = 10

    # 4. Priority Calculation
    priority_score, priority_class = calculate_priority_score(
        is_severe=is_severe,
        area_importance=area_imp,
        number_of_reports=1,
        issue_time=datetime.utcnow(),
        status="Pending",
        is_critical=is_critical,
        severity_bonus=severity_bonus
    )

    # 5. Persist complaint
    new_complaint = Complaint(
        citizen_id=current_user.id,
        department_id=dept.id,
        complaint_text=payload.complaint_text,
        address=payload.address,
        pincode=payload.pincode,
        state=payload.state or current_user.state,
        district=payload.district or current_user.district,
        area_importance=area_imp,
        is_severe=is_severe,
        priority_score=priority_score,
        priority_classification=priority_class,
        status="Pending",
        number_of_reports=1,
        issue_time=datetime.utcnow(),
        last_updated=datetime.utcnow()
    )
    db.add(new_complaint)
    db.commit()
    db.refresh(new_complaint)

    # Also log the primary citizen report in complaint_reports
    primary_report = ComplaintReport(
        complaint_id=new_complaint.id,
        reporting_citizen_id=current_user.id,
        report_text=payload.complaint_text,
        reported_at=datetime.utcnow()
    )
    db.add(primary_report)
    db.commit()

    # 6. WebSocket broadcast to Admin & Department worker
    await manager.broadcast_event(
        event_type="NEW_COMPLAINT",
        payload={
            "id": new_complaint.id,
            "department": dept.name,
            "department_id": dept.id,
            "priority_classification": priority_class,
            "priority_score": priority_score,
            "is_severe": is_severe,
            "status": "Pending",
            "pincode": new_complaint.pincode,
            "address": new_complaint.address
        },
        department_id=dept.id
    )

    res = ComplaintOut.from_orm(new_complaint)
    res.citizen_username = current_user.username
    res.department_name = dept.name
    return res

@app.get("/api/complaints/my", response_model=List[ComplaintOut])
def get_my_complaints(
    current_user: User = Depends(require_roles("citizen")),
    db: Session = Depends(get_db)
):
    """Citizens view only their own filed complaints."""
    # Find complaints where citizen is author or registered a duplicate report
    direct_complaints = db.query(Complaint).filter(Complaint.citizen_id == current_user.id).all()
    reported_complaint_ids = [r.complaint_id for r in db.query(ComplaintReport).filter(ComplaintReport.reporting_citizen_id == current_user.id).all()]
    all_complaints = db.query(Complaint).filter(
        or_(Complaint.citizen_id == current_user.id, Complaint.id.in_(reported_complaint_ids))
    ).order_by(desc(Complaint.issue_time)).all()

    output = []
    for c in all_complaints:
        item = ComplaintOut.from_orm(c)
        item.citizen_username = c.citizen.username if c.citizen else "Citizen"
        item.department_name = c.department.name if c.department else ""
        output.append(item)
    return output

@app.get("/api/notifications/my", response_model=List[NotificationOut])
def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetches user notifications (status changes, delays)."""
    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(desc(Notification.created_at)).all()

@app.patch("/api/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Marks a notification as read."""
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"status": "success"}

# ==========================================
# WORKER DEPARTMENT-SCOPED ENDPOINTS
# ==========================================

@app.get("/api/worker/complaints", response_model=List[ComplaintOut])
def get_worker_complaints(
    current_user: User = Depends(require_roles("worker")),
    db: Session = Depends(get_db)
):
    """
    Worker can ONLY access complaints assigned to their designated department.
    """
    if not current_user.department_id:
        return []

    complaints = db.query(Complaint).filter(
        Complaint.department_id == current_user.department_id
    ).order_by(desc(Complaint.priority_score), desc(Complaint.issue_time)).all()

    output = []
    for c in complaints:
        item = ComplaintOut.from_orm(c)
        item.citizen_username = c.citizen.username if c.citizen else "Citizen"
        item.department_name = c.department.name if c.department else ""
        output.append(item)
    return output

@app.patch("/api/complaints/{complaint_id}/status", response_model=ComplaintOut)
async def update_complaint_status(
    complaint_id: int,
    update_data: ComplaintStatusUpdate,
    current_user: User = Depends(require_roles("worker", "admin")),
    db: Session = Depends(get_db)
):
    """
    Worker or Admin updates complaint status (Pending, In Progress, Solved).
    Workers can only update complaints within their department.
    Notifies the citizen who filed the complaint in real-time.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    # Worker permission boundary: must belong to the complaint's department
    if current_user.role == "worker" and complaint.department_id != current_user.department_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Workers cannot modify complaints belonging to other departments."
        )

    old_status = complaint.status
    complaint.status = update_data.status
    complaint.last_updated = datetime.utcnow()

    if update_data.status == "Solved":
        complaint.resolved_at = datetime.utcnow()
    else:
        complaint.resolved_at = None

    # Recalculate priority
    sev_info = detect_severity(complaint.complaint_text, complaint.address)
    score, priority_class = calculate_priority_score(
        is_severe=complaint.is_severe,
        area_importance=complaint.area_importance,
        number_of_reports=complaint.number_of_reports,
        issue_time=complaint.issue_time,
        status=complaint.status,
        resolved_at=complaint.resolved_at,
        is_critical=sev_info["is_critical"],
        severity_bonus=sev_info["severity_bonus"]
    )
    complaint.priority_score = score
    complaint.priority_classification = priority_class
    db.commit()
    db.refresh(complaint)

    # Automatically notify citizen who filed this complaint
    await notify_status_change(
        db=db,
        complaint=complaint,
        old_status=old_status,
        new_status=update_data.status,
        worker=current_user,
        note=update_data.note
    )

    res = ComplaintOut.from_orm(complaint)
    res.citizen_username = complaint.citizen.username if complaint.citizen else "Citizen"
    res.department_name = complaint.department.name if complaint.department else ""
    return res

@app.post("/api/complaints/{complaint_id}/delay")
async def trigger_delay_notification(
    complaint_id: int,
    payload: DelayNotificationCreate,
    current_user: User = Depends(require_roles("worker", "admin")),
    db: Session = Depends(get_db)
):
    """
    Worker or Admin sends an explicit delay alert with justification to citizen.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    if current_user.role == "worker" and complaint.department_id != current_user.department_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Workers cannot send delay alerts for other departments."
        )

    notif = await notify_delay(
        db=db,
        complaint=complaint,
        worker=current_user,
        delay_reason=payload.message
    )

    return {"status": "success", "notification_id": notif.id}

# ==========================================
# ADMIN ANALYTICS & CENTRAL REGISTRY
# ==========================================

@app.get("/api/admin/metrics", response_model=DashboardMetrics)
def get_admin_metrics(
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    """Admin dashboard summary metrics."""
    total = db.query(Complaint).count()
    critical_severe = db.query(Complaint).filter(
        or_(Complaint.is_severe == True, Complaint.priority_classification == "Critical")
    ).count()
    pending = db.query(Complaint).filter(Complaint.status == "Pending").count()
    in_progress = db.query(Complaint).filter(Complaint.status == "In Progress").count()
    solved = db.query(Complaint).filter(Complaint.status == "Solved").count()

    return {
        "total_cases": total,
        "critical_severe_cases": critical_severe,
        "pending_cases": pending,
        "in_progress_cases": in_progress,
        "solved_cases": solved
    }

@app.get("/api/admin/dept-distribution", response_model=List[DepartmentDistribution])
def get_dept_distribution(
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    """Department-wise complaint distribution for pie chart."""
    results = db.query(
        Department.name, func.count(Complaint.id)
    ).outerjoin(Complaint, Department.id == Complaint.department_id)\
     .group_by(Department.name).all()

    return [{"department": r[0], "count": r[1]} for r in results]

@app.get("/api/admin/monthly-trends", response_model=List[MonthlyTrend])
def get_monthly_trends(
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    """Monthly complaint trends by district/area."""
    # Group by district and date/period
    results = db.query(
        Complaint.district,
        func.count(Complaint.id)
    ).group_by(Complaint.district).all()

    # Form trend entries
    current_month_name = datetime.utcnow().strftime("%b %Y")
    trends = []
    for area, cnt in results:
        trends.append({
            "period": current_month_name,
            "area": area or "Urban Central",
            "count": cnt
        })

    if not trends:
        trends.append({"period": current_month_name, "area": "Metro Zone", "count": 0})

    return trends

@app.get("/api/complaints", response_model=List[ComplaintOut])
def get_all_complaints(
    status: Optional[str] = None,
    department_id: Optional[int] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    """Admin central complaint database with full filtering & search."""
    query = db.query(Complaint)

    if status and status != "All":
        query = query.filter(Complaint.status == status)

    if department_id:
        query = query.filter(Complaint.department_id == department_id)

    if priority and priority != "All":
        query = query.filter(Complaint.priority_classification == priority)

    if search:
        query = query.filter(
            or_(
                Complaint.complaint_text.ilike(f"%{search}%"),
                Complaint.address.ilike(f"%{search}%"),
                Complaint.pincode.ilike(f"%{search}%")
            )
        )

    complaints = query.order_by(desc(Complaint.priority_score), desc(Complaint.issue_time)).all()

    output = []
    for c in complaints:
        item = ComplaintOut.from_orm(c)
        item.citizen_username = c.citizen.username if c.citizen else "Citizen"
        item.department_name = c.department.name if c.department else ""
        output.append(item)
    return output

@app.get("/api/admin/users", response_model=List[UserOut])
def get_all_users(
    current_user: User = Depends(require_roles("admin")),
    db: Session = Depends(get_db)
):
    """Admin views registered users."""
    users = db.query(User).order_by(desc(User.created_at)).all()
    out = []
    for u in users:
        uo = UserOut.from_orm(u)
        if u.department:
            uo.department_name = u.department.name
        out.append(uo)
    return out

# ==========================================
# REAL-TIME WEBSOCKET SUBSCRIPTION
# ==========================================

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, channel: str = Query("all")):
    """
    Subscribes client to real-time events.
    Channel options: 'admin', 'all', 'dept_{id}', 'user_{id}'
    """
    await manager.connect(websocket, channel)
    try:
        while True:
            # Keep-alive heartbeat listener
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, channel)
    except Exception:
        manager.disconnect(websocket, channel)
