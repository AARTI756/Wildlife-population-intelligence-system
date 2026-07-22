from pydantic import BaseModel
from typing import Optional
from app.schemas.user import UserOut

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class GoogleToken(BaseModel):
    token: str
    role: Optional[str] = None

class GoogleLoginResponse(BaseModel):
    access_token: Optional[str] = None
    token_type: Optional[str] = None
    user: Optional[UserOut] = None
    registration_incomplete: Optional[bool] = False
    email: Optional[str] = None

class ProfileUpdate(BaseModel):
    username: Optional[str] = None
    picture: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
