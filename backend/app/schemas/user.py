from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleOut(RoleBase):
    id: int

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str
    roles: Optional[List[str]] = ["Wildlife Researcher"]

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    roles: Optional[List[str]] = None
    status: Optional[str] = None

class UserOut(UserBase):
    id: int
    created_at: datetime
    last_login: Optional[datetime] = None
    status: Optional[str] = "Active"
    oauth_provider: Optional[str] = "Local"
    picture: Optional[str] = None
    roles: List[RoleOut] = []

    class Config:
        from_attributes = True
