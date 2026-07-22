from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.monitoring import Survey
from app.models.user import User
from app.schemas.monitoring import SurveyOut, SurveyCreate, SurveyUpdate
from app.auth.dependencies import get_current_user, RoleChecker

router = APIRouter(prefix="/api/surveys", tags=["surveys"])

# Allowed roles to modify surveys
editor_check = RoleChecker(["Administrator", "Wildlife Researcher", "Forest Department Officer"])

@router.get("", response_model=List[SurveyOut])
def list_surveys(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Survey).all()

@router.get("/{survey_id}", response_model=SurveyOut)
def get_survey(survey_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    return survey

@router.post("", response_model=SurveyOut, status_code=status.HTTP_201_CREATED)
def create_survey(
    survey_in: SurveyCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(editor_check)
):
    survey = Survey(
        **survey_in.model_dump(),
        created_by=current_user.id
    )
    db.add(survey)
    db.commit()
    db.refresh(survey)
    return survey

@router.put("/{survey_id}", response_model=SurveyOut)
def update_survey(
    survey_id: int,
    survey_in: SurveyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(editor_check)
):
    print("Received Survey Update:", survey_in.model_dump())
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
        
    for field, value in survey_in.model_dump(exclude_unset=True).items():
        setattr(survey, field, value)
        
    db.commit()
    db.refresh(survey)
    return survey

@router.delete("/{survey_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_survey(
    survey_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(editor_check)
):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
        
    db.delete(survey)
    db.commit()
    return None
