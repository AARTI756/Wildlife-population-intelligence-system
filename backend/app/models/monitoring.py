from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class MonitoringSite(Base):
    __tablename__ = "monitoring_sites"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    location = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(String(500), nullable=True)
    protected_area = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    camera_traps = relationship("CameraTrap", back_populates="site", cascade="all, delete-orphan")
    audio_sensors = relationship("AudioSensor", back_populates="site", cascade="all, delete-orphan")

class CameraTrap(Base):
    __tablename__ = "camera_traps"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False) # Camera Name
    camera_id = Column(String(100), unique=True, nullable=True, index=True) # Camera ID (serial key)
    status = Column(String(50), default="Active")  # Active, Inactive, Maintenance
    battery_level = Column(Integer, default=100)
    location_id = Column(Integer, ForeignKey("monitoring_sites.id", ondelete="CASCADE"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    model = Column(String(100), nullable=True)
    installation_date = Column(Date, nullable=False)
    
    site = relationship("MonitoringSite", back_populates="camera_traps")

class AudioSensor(Base):
    __tablename__ = "audio_sensors"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False) # Sensor Name
    sensor_id = Column(String(100), unique=True, nullable=True, index=True) # Sensor ID (serial key)
    status = Column(String(50), default="Active")  # Active, Inactive, Maintenance
    battery_level = Column(Integer, default=100)
    location_id = Column(Integer, ForeignKey("monitoring_sites.id", ondelete="CASCADE"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    model = Column(String(100), nullable=True)
    installation_date = Column(Date, nullable=False)
    
    site = relationship("MonitoringSite", back_populates="audio_sensors")

class Survey(Base):
    __tablename__ = "surveys"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    date = Column(Date, nullable=False)
    monitoring_location = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    habitat_type = Column(String(100), nullable=False)
    monitoring_device = Column(String(100), nullable=False)  # Camera Trap, Audio Sensor, Visual, etc.
    protected_area = Column(Boolean, default=False)
    description = Column(String(500), nullable=True)
    
    monitoring_site_id = Column(Integer, ForeignKey("monitoring_sites.id", ondelete="SET NULL"), nullable=True)
    
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    site = relationship("MonitoringSite")
    observations = relationship("Observation", back_populates="survey", cascade="all, delete-orphan")
