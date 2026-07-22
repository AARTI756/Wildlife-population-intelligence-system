import bcrypt
from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from app.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # bcrypt requires bytes
        plain_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        
        # Bcrypt has a 72-byte limit. Truncate if plain password is longer.
        if len(plain_bytes) > 72:
            plain_bytes = plain_bytes[:72]
            
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception as e:
        print(f"Error verifying password: {e}")
        return False

def get_password_hash(password: str) -> str:
    # bcrypt requires bytes
    pwd_bytes = password.encode('utf-8')
    
    # Bcrypt has a 72-byte limit. Truncate if plain password is longer.
    if len(pwd_bytes) > 72:
        pwd_bytes = pwd_bytes[:72]
        
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
