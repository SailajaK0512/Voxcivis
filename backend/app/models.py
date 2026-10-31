from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Date
)
from sqlalchemy.orm import relationship
from .database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    code = Column(String(30), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)

    users = relationship("User", back_populates="department")
    complaints = relationship("Complaint", back_populates="department")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    id_number = Column(String(50), unique=True, nullable=False, index=True)
    date_of_birth = Column(Date, nullable=False)
    phone_number = Column(String(20), nullable=False)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    mandal = Column(String(100), nullable=False)
    sector = Column(String(100), nullable=False)
    village_name = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False, index=True)
    address = Column(Text, nullable=False)
    role = Column(String(20), nullable=False, index=True)  # 'citizen', 'admin', 'worker'
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    department = relationship("Department", back_populates="users")
    complaints = relationship("Complaint", back_populates="citizen", foreign_keys="Complaint.citizen_id")
    reports = relationship("ComplaintReport", back_populates="citizen")
    notifications = relationship("Notification", back_populates="user")

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False, index=True)
    complaint_text = Column(Text, nullable=False)
    address = Column(Text, nullable=False)
    pincode = Column(String(10), nullable=False, index=True)
    state = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    area_importance = Column(Integer, default=0)  # 10 if important area, 0 otherwise
    is_severe = Column(Boolean, default=False)
    priority_score = Column(Integer, default=10, index=True)
    priority_classification = Column(String(20), default="Low", index=True) # Critical, High, Medium, Low
    status = Column(String(30), default="Pending", index=True) # Pending, In Progress, Solved
    number_of_reports = Column(Integer, default=1)
    parent_complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=True)
    
    issue_time = Column(DateTime, default=datetime.utcnow, index=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    citizen = relationship("User", back_populates="complaints", foreign_keys=[citizen_id])
    department = relationship("Department", back_populates="complaints")
    reports = relationship("ComplaintReport", back_populates="complaint", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="complaint", cascade="all, delete-orphan")
    child_complaints = relationship("Complaint", backref="parent_complaint", remote_side=[id])

class ComplaintReport(Base):
    __tablename__ = "complaint_reports"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False, index=True)
    reporting_citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    report_text = Column(Text, nullable=False)
    reported_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="reports")
    citizen = relationship("User", back_populates="reports")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False, index=True)
    message_type = Column(String(50), default="status_change") # status_change, delay_alert
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
    complaint = relationship("Complaint", back_populates="notifications")
