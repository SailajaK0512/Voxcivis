from datetime import datetime
from sqlalchemy.orm import Session
from ..models import Notification, Complaint, User
from ..websocket import manager

async def notify_status_change(
    db: Session,
    complaint: Complaint,
    old_status: str,
    new_status: str,
    worker: User,
    note: str = None
) -> Notification:
    """
    Creates a notification for the citizen when complaint status changes,
    and sends a real-time event.
    """
    message = f"Your complaint #{complaint.id} ('{complaint.complaint_text[:40]}...') status has been updated from '{old_status}' to '{new_status}' by {worker.username}."
    if note:
        message += f" Note: {note}"

    notif = Notification(
        user_id=complaint.citizen_id,
        complaint_id=complaint.id,
        message_type="status_change",
        message=message,
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    # Real-time WebSocket push
    await manager.broadcast_event(
        event_type="STATUS_CHANGED",
        payload={
            "notification_id": notif.id,
            "complaint_id": complaint.id,
            "old_status": old_status,
            "new_status": new_status,
            "message": message,
            "updated_at": complaint.last_updated.isoformat() if complaint.last_updated else datetime.utcnow().isoformat()
        },
        department_id=complaint.department_id,
        user_id=complaint.citizen_id
    )

    return notif

async def notify_delay(
    db: Session,
    complaint: Complaint,
    worker: User,
    delay_reason: str
) -> Notification:
    """
    Creates a delay notification for the citizen explaining resolution delays.
    """
    message = f"Notice of Delay for complaint #{complaint.id}: '{delay_reason}'. We are actively working to resolve it as promptly as possible."

    notif = Notification(
        user_id=complaint.citizen_id,
        complaint_id=complaint.id,
        message_type="delay_alert",
        message=message,
        is_read=False,
        created_at=datetime.utcnow()
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)

    # Real-time WebSocket push
    await manager.broadcast_event(
        event_type="DELAY_ALERT",
        payload={
            "notification_id": notif.id,
            "complaint_id": complaint.id,
            "message": message,
            "worker_name": worker.username,
            "created_at": notif.created_at.isoformat()
        },
        department_id=complaint.department_id,
        user_id=complaint.citizen_id
    )

    return notif
