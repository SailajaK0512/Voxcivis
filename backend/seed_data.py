from datetime import datetime, date, timedelta
from app.database import engine, SessionLocal, Base
from app.models import User, Department, Complaint, ComplaintReport, Notification
from app.auth import get_password_hash
from app.config import DEFAULT_DEPARTMENTS
from app.services.priority import calculate_priority_score

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("Seeding departments...")
        dept_map = {}
        for d in DEFAULT_DEPARTMENTS:
            dept = db.query(Department).filter(Department.name == d["name"]).first()
            if not dept:
                dept = Department(
                    name=d["name"],
                    code=d["code"],
                    description=d["description"],
                    is_active=True
                )
                db.add(dept)
                db.commit()
                db.refresh(dept)
            dept_map[d["name"]] = dept

        print("Seeding administrative and staff users...")
        # 1. Admin
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                password_hash=get_password_hash("admin123"),
                id_number="GOV-ADM-001",
                date_of_birth=date(1985, 4, 12),
                phone_number="9876543210",
                state="Maharashtra",
                district="Pune",
                mandal="Central Haveli",
                sector="Sector 1",
                village_name="Shivaji Nagar",
                pincode="411005",
                address="Municipal Headquarters, Shivaji Nagar, Pune",
                role="admin"
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

        # 2. Workers for key departments
        roads_dept = dept_map.get("Roads & Pavements")
        worker_roads = db.query(User).filter(User.username == "worker_roads").first()
        if not worker_roads and roads_dept:
            worker_roads = User(
                username="worker_roads",
                password_hash=get_password_hash("worker123"),
                id_number="GOV-WRK-101",
                date_of_birth=date(1990, 8, 20),
                phone_number="9823001122",
                state="Maharashtra",
                district="Pune",
                mandal="Kothrud",
                sector="Sector 3",
                village_name="Kothrud",
                pincode="411038",
                address="PWD Field Office, Paud Road, Pune",
                role="worker",
                department_id=roads_dept.id
            )
            db.add(worker_roads)

        power_dept = dept_map.get("Electricity & Power")
        worker_power = db.query(User).filter(User.username == "worker_power").first()
        if not worker_power and power_dept:
            worker_power = User(
                username="worker_power",
                password_hash=get_password_hash("worker123"),
                id_number="GOV-WRK-102",
                date_of_birth=date(1988, 11, 15),
                phone_number="9823003344",
                state="Maharashtra",
                district="Pune",
                mandal="Shivajinagar",
                sector="Sector 2",
                village_name="Aundh",
                pincode="411007",
                address="Electricity Substation 4, Aundh, Pune",
                role="worker",
                department_id=power_dept.id
            )
            db.add(worker_power)

        water_dept = dept_map.get("Water Supply & Pipeline")
        worker_water = db.query(User).filter(User.username == "worker_water").first()
        if not worker_water and water_dept:
            worker_water = User(
                username="worker_water",
                password_hash=get_password_hash("worker123"),
                id_number="GOV-WRK-103",
                date_of_birth=date(1992, 3, 25),
                phone_number="9823005566",
                state="Maharashtra",
                district="Pune",
                mandal="Hadapsar",
                sector="Sector 5",
                village_name="Hadapsar",
                pincode="411028",
                address="Municipal Water Works, Hadapsar, Pune",
                role="worker",
                department_id=water_dept.id
            )
            db.add(worker_water)

        # 3. Citizens
        citizen1 = db.query(User).filter(User.username == "citizen1").first()
        if not citizen1:
            citizen1 = User(
                username="citizen1",
                password_hash=get_password_hash("citizen123"),
                id_number="CIT-992-441",
                date_of_birth=date(1996, 6, 14),
                phone_number="9811223344",
                state="Maharashtra",
                district="Pune",
                mandal="Kothrud",
                sector="Sector 4",
                village_name="Kothrud",
                pincode="411038",
                address="Flat 402, Green Meadows, Paud Road, Pune",
                role="citizen"
            )
            db.add(citizen1)

        citizen2 = db.query(User).filter(User.username == "citizen2").first()
        if not citizen2:
            citizen2 = User(
                username="citizen2",
                password_hash=get_password_hash("citizen123"),
                id_number="CIT-992-442",
                date_of_birth=date(1994, 9, 21),
                phone_number="9855667788",
                state="Maharashtra",
                district="Pune",
                mandal="Aundh",
                sector="Sector 2",
                village_name="Aundh",
                pincode="411007",
                address="Bungalow 12, IT Corridor, Aundh, Pune",
                role="citizen"
            )
            db.add(citizen2)

        db.commit()
        db.refresh(citizen1)

        # 4. Seed initial realistic civic complaints if table is empty
        if db.query(Complaint).count() == 0:
            print("Seeding initial civic complaints...")
            samples = [
                {
                    "text": "Dangerous live electrical wire snapped and sparking on the road after rain storm",
                    "dept": "Electricity & Power",
                    "is_severe": True,
                    "area_imp": 10,
                    "pincode": "411038",
                    "address": "Opposite Kothrud Bus Depot, Paud Road, Pune",
                    "status": "In Progress",
                    "days_ago": 1,
                    "reports": 3
                },
                {
                    "text": "Deep crater pothole in front of public hospital main ambulance gate",
                    "dept": "Roads & Pavements",
                    "is_severe": True,
                    "area_imp": 10,
                    "pincode": "411005",
                    "address": "Near Sassoon Hospital Gate 2, Pune",
                    "status": "Pending",
                    "days_ago": 3,
                    "reports": 4
                },
                {
                    "text": "Drinking water pipeline burst causing road flooding and complete pressure loss",
                    "dept": "Water Supply & Pipeline",
                    "is_severe": True,
                    "area_imp": 0,
                    "pincode": "411007",
                    "address": "Near Parihar Chowk, Aundh, Pune",
                    "status": "Pending",
                    "days_ago": 2,
                    "reports": 2
                },
                {
                    "text": "Overflowing garbage bin and stray animal nuisance near local vegetable market",
                    "dept": "Sanitation & Waste Management",
                    "is_severe": False,
                    "area_imp": 0,
                    "pincode": "411028",
                    "address": "Market Yard lane 3, Hadapsar, Pune",
                    "status": "Solved",
                    "days_ago": 5,
                    "reports": 1
                },
                {
                    "text": "Streetlight pole non-functional for past two weeks leaving lane completely dark",
                    "dept": "Street Lighting",
                    "is_severe": False,
                    "area_imp": 0,
                    "pincode": "411038",
                    "address": "Lane 4, Mayur Colony, Kothrud, Pune",
                    "status": "Pending",
                    "days_ago": 6,
                    "reports": 1
                },
                {
                    "text": "Open drainage manhole cover missing on busy pedestrian sidewalk near school",
                    "dept": "Drainage & Sewerage",
                    "is_severe": True,
                    "area_imp": 10,
                    "pincode": "411007",
                    "address": "Near DAV School Gate, Aundh, Pune",
                    "status": "In Progress",
                    "days_ago": 2,
                    "reports": 3
                }
            ]

            for s in samples:
                d_obj = dept_map.get(s["dept"]) or list(dept_map.values())[0]
                issue_dt = datetime.utcnow() - timedelta(days=s["days_ago"])
                res_dt = datetime.utcnow() if s["status"] == "Solved" else None

                p_score, p_class = calculate_priority_score(
                    is_severe=s["is_severe"],
                    area_importance=s["area_imp"],
                    number_of_reports=s["reports"],
                    issue_time=issue_dt,
                    status=s["status"],
                    resolved_at=res_dt
                )

                complaint = Complaint(
                    citizen_id=citizen1.id,
                    department_id=d_obj.id,
                    complaint_text=s["text"],
                    address=s["address"],
                    pincode=s["pincode"],
                    state="Maharashtra",
                    district="Pune",
                    area_importance=s["area_imp"],
                    is_severe=s["is_severe"],
                    priority_score=p_score,
                    priority_classification=p_class,
                    status=s["status"],
                    number_of_reports=s["reports"],
                    issue_time=issue_dt,
                    last_updated=datetime.utcnow(),
                    resolved_at=res_dt
                )
                db.add(complaint)
                db.commit()
                db.refresh(complaint)

                # Add report
                rep = ComplaintReport(
                    complaint_id=complaint.id,
                    reporting_citizen_id=citizen1.id,
                    report_text=s["text"],
                    reported_at=issue_dt
                )
                db.add(rep)

                # Add a sample notification for citizen1
                notif = Notification(
                    user_id=citizen1.id,
                    complaint_id=complaint.id,
                    message_type="status_change",
                    message=f"Complaint #{complaint.id} status is now {s['status']}.",
                    is_read=False,
                    created_at=datetime.utcnow() - timedelta(hours=3)
                )
                db.add(notif)
                db.commit()

        print("Seeding completed successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
