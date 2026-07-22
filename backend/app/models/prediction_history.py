from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class PredictionHistory(Base):
    __tablename__ = "prediction_history"
    
    id = Column(Integer, primary_key=True, index=True)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    species_predicted = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)
    inference_time = Column(Float, nullable=False)  # in ms
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    date = Column(DateTime, default=datetime.utcnow)
    prediction_type = Column(String(50), nullable=False)  # Image / Audio
    linked_observation_id = Column(Integer, ForeignKey("observations.id", ondelete="SET NULL"), nullable=True)
    threshold_used = Column(Float, default=0.50)  # Configurable threshold used for inference
    is_unknown = Column(Boolean, default=False)
    is_endangered = Column(Boolean, default=False)
    behaviour = Column(Text, nullable=True)
    animal_call_detected = Column(Boolean, default=False, nullable=True)
    animal_call_category = Column(String(100), nullable=True)
    
    user = relationship("User")
    observation = relationship("Observation")
