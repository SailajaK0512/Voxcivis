from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, validator
import re

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    id_number: str = Field(..., min_length=3, max_length=50)
    date_of_birth: date
    phone_number: str = Field(..., min_length=7, max_length=20)
    state: str
    district: str
    mandal: str
    sector: str
    village_name: str
    pincode: str = Field(..., min_length=3, max_length=10)
    address: str
    role: str = Field(default="citizen") # citizen, admin, worker
    department_id: Optional[int] = None

    @validator("password")
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must contain at least 6 characters.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number.")
        return v

    @validator("role")
    def validate_role(cls, v):
        allowed = {"citizen", "admin", "worker"}
        if v.lower() not in allowed:
            raise ValueError(f"Role must be one of {allowed}")
        return v.lower()

class UserLogin(BaseModel):
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    id_number: str
    date_of_birth: date
    phone_number: str
    state: str
    district: str
    mandal: str
    sector: str
    village_name: str
    pincode: str
    address: str
    role: str
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class DepartmentOut(BaseModel):
    id: int
    name: str
    code: str
    description: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class ComplaintCreate(BaseModel):
    complaint_text: str = Field(..., min_length=10)
    address: str = Field(..., min_length=5)
    pincode: str = Field(..., min_length=3, max_length=10)
    state: Optional[str] = None
    district: Optional[str] = None
    area_importance: Optional[int] = 0

class ComplaintStatusUpdate(BaseModel):
    status: str # Pending, In Progress, Solved
    note: Optional[str] = None

class DelayNotificationCreate(BaseModel):
    message: str = Field(..., min_length=5)

class NotificationOut(BaseModel):
    id: int
    complaint_id: int
    message_type: str
    message: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintOut(BaseModel):
    id: int
    citizen_id: int
    citizen_username: Optional[str] = None
    department_id: int
    department_name: Optional[str] = None
    complaint_text: str
    address: str
    pincode: str
    state: Optional[str] = None
    district: Optional[str] = None
    area_importance: int
    is_severe: bool
    priority_score: int
    priority_classification: str
    status: str
    number_of_reports: int
    parent_complaint_id: Optional[int] = None
    issue_time: datetime
    last_updated: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DashboardMetrics(BaseModel):
    total_cases: int
    critical_severe_cases: int
    pending_cases: int
    solved_cases: int
    in_progress_cases: int

class DepartmentDistribution(BaseModel):
    department: str
    count: int

class MonthlyTrend(BaseModel):
    period: str
    area: str
    count: int
