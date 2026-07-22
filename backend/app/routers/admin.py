from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.utils.demo_generator import seed_demo_data

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.post("/seed-demo")
def trigger_seed_demo_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        seed_demo_data(db, current_user.id)
        return {"message": "Indian Protected Areas and species demo dataset generated successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate demo dataset: {str(e)}"
        )
