from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database.connection import get_db
from app.models.user import User, Role
from app.schemas.auth import Token, GoogleToken, GoogleLoginResponse, ProfileUpdate, PasswordChange
from app.schemas.user import UserCreate, UserOut
from app.auth.security import verify_password, get_password_hash, create_access_token
from app.auth.dependencies import get_current_user
from app.auth.google_auth import verify_google_token
from app.config import settings
import uuid

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered"
        )
    
    # Hash password
    hashed_pwd = get_password_hash(user_in.password)
    
    # Create user
    new_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_pwd
    )
    
    # Assign roles
    if user_in.roles:
        for role_name in user_in.roles:
            role = db.query(Role).filter(Role.name == role_name).first()
            if role:
                new_user.roles.append(role)
            else:
                # If role doesn't exist, create it (seeding on the fly)
                new_role = Role(name=role_name, description=f"{role_name} Role")
                db.add(new_role)
                db.commit()
                db.refresh(new_role)
                new_user.roles.append(new_role)
    else:
        # Default role
        researcher_role = db.query(Role).filter(Role.name == "Wildlife Researcher").first()
        if not researcher_role:
            researcher_role = Role(name="Wildlife Researcher", description="Wildlife Researcher Role")
            db.add(researcher_role)
            db.commit()
            db.refresh(researcher_role)
        new_user.roles.append(researcher_role)
        
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Auth via username
    user = db.query(User).filter(User.username == form_data.username).first()
    
    # If not found by username, try by email
    if not user:
        user = db.query(User).filter(User.email == form_data.username).first()
        
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if user.status != "Active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive. Please contact your administrator."
        )
        
    # Update last login time
    from datetime import datetime
    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.username, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "user": user}

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/google-login", response_model=GoogleLoginResponse)
def google_login(google_data: GoogleToken, db: Session = Depends(get_db)):
    try:
        idinfo = verify_google_token(google_data.token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    email = idinfo.get("email")
    name = idinfo.get("name", "Google User")
    picture = idinfo.get("picture", "")
    google_id = idinfo.get("sub")
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google token did not contain an email address"
        )
        
    user = db.query(User).filter(User.email == email).first()
    
    if user:
        # Update user to link Google account if not linked
        if not user.google_id:
            user.google_id = google_id
            user.oauth_provider = "Google"
            user.picture = picture
        
        if user.status != "Active":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive. Please contact your administrator."
            )
    else:
        # User does not exist. Check if a role was selected.
        if not google_data.role:
            return {"registration_incomplete": True, "email": email}
            
        allowed_roles = ["Wildlife Researcher", "Conservation Officer", "Forest Department Officer"]
        if google_data.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role selected for registration"
            )
            
        # Create new user
        base_username = email.split('@')[0]
        unique_username = base_username
        counter = 1
        while db.query(User).filter(User.username == unique_username).first():
            unique_username = f"{base_username}{counter}"
            counter += 1
            
        dummy_password = f"!google_oauth_{uuid.uuid4().hex}"
        hashed_pwd = get_password_hash(dummy_password)
        
        user = User(
            username=unique_username,
            email=email,
            hashed_password=hashed_pwd,
            oauth_provider="Google",
            google_id=google_id,
            picture=picture
        )
        
        selected_role = db.query(Role).filter(Role.name == google_data.role).first()
        if not selected_role:
            selected_role = Role(name=google_data.role, description=f"{google_data.role} Role")
            db.add(selected_role)
            db.commit()
            db.refresh(selected_role)
            
        user.roles.append(selected_role)
        db.add(user)

    # Common for both existing and new users
    from datetime import datetime
    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.username, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
        "registration_incomplete": False
    }

@router.put("/profile", response_model=UserOut)
def update_profile(
    profile_in: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if profile_in.username:
        username = profile_in.username.strip()
        if len(username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
        dup = db.query(User).filter(User.username == username, User.id != current_user.id).first()
        if dup:
            raise HTTPException(status_code=400, detail="Username is already taken")
        current_user.username = username
        
    if profile_in.picture is not None:
        current_user.picture = profile_in.picture
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/change-password")
def change_password(
    pwd_in: PasswordChange,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.oauth_provider == "Google":
        raise HTTPException(
            status_code=400,
            detail="This account uses Google Sign-In. Password changes must be performed through your Google account."
        )
        
    if not verify_password(pwd_in.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    import re
    new_pwd = pwd_in.new_password
    if len(new_pwd) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if not re.search(r"[a-z]", new_pwd):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter")
    if not re.search(r"[A-Z]", new_pwd):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
    if not re.search(r"\d", new_pwd):
        raise HTTPException(status_code=400, detail="Password must contain at least one digit")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", new_pwd):
        raise HTTPException(status_code=400, detail="Password must contain at least one special character")
        
    current_user.hashed_password = get_password_hash(new_pwd)
    db.commit()
    return {"message": "Password changed successfully"}

