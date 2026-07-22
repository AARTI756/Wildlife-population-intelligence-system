from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Float
from sqlalchemy.orm import relationship, object_session
from datetime import datetime
from app.database.connection import Base

class Observation(Base):
    __tablename__ = "observations"
    
    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id", ondelete="CASCADE"), nullable=False)
    monitoring_site_id = Column(Integer, ForeignKey("monitoring_sites.id", ondelete="SET NULL"), nullable=True)
    species_name = Column(String(100), nullable=True, index=True) # nullable for now
    count = Column(Integer, default=1)
    timestamp = Column(DateTime, default=datetime.utcnow)
    observation_type = Column(String(50), nullable=False)  # Visual, Camera Trap, Audio Sensor
    device_id = Column(String(100), nullable=True)  # Camera/Audio sensor ID or name
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="Pending Analysis")  # default status
    is_unknown = Column(Boolean, default=False)
    is_endangered = Column(Boolean, default=False)
    behaviour = Column(Text, nullable=True)  # Future: feeding, resting, flying, hunting, etc.
    animal_call_detected = Column(Boolean, default=False, nullable=True)
    animal_call_category = Column(String(100), nullable=True)
    # Reserved for future visual re-identification.  These remain nullable until
    # a reviewed individual-identification model is introduced.
    individual_id = Column(String(100), nullable=True, index=True)
    reidentification_confidence = Column(Float, nullable=True)
    previous_sightings = Column(Integer, default=0, nullable=True)
    
    # Uploaded image and audio relations
    uploaded_image_id = Column(Integer, ForeignKey("uploaded_images.id", ondelete="SET NULL"), nullable=True)
    uploaded_audio_id = Column(Integer, ForeignKey("uploaded_audios.id", ondelete="SET NULL"), nullable=True)
    
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    survey = relationship("Survey", back_populates="observations")
    site = relationship("MonitoringSite")
    uploaded_image = relationship("UploadedImage")
    uploaded_audio = relationship("UploadedAudio")

    @property
    def species(self):
        return self.species_name

    @property
    def method(self):
        return self.observation_type

    @property
    def observation_datetime(self):
        return self.timestamp

    @property
    def monitoring_site(self):
        return self.site

    @property
    def image_upload(self):
        return self.uploaded_image

    @property
    def audio_upload(self):
        return self.uploaded_audio

    @property
    def camera_trap(self):
        if self.observation_type == "Camera Trap" and self.device_id:
            from app.models.monitoring import CameraTrap
            session = object_session(self)
            if session:
                return session.query(CameraTrap).filter(CameraTrap.camera_id == self.device_id).first()
            else:
                from app.database.connection import SessionLocal
                db = SessionLocal()
                try:
                    return db.query(CameraTrap).filter(CameraTrap.camera_id == self.device_id).first()
                finally:
                    db.close()
        return None

    @property
    def audio_sensor(self):
        if self.observation_type == "Audio Sensor" and self.device_id:
            from app.models.monitoring import AudioSensor
            session = object_session(self)
            if session:
                return session.query(AudioSensor).filter(AudioSensor.sensor_id == self.device_id).first()
            else:
                from app.database.connection import SessionLocal
                db = SessionLocal()
                try:
                    return db.query(AudioSensor).filter(AudioSensor.sensor_id == self.device_id).first()
                finally:
                    db.close()
        return None
