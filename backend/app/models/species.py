from sqlalchemy import Column, Integer, String, Text
from app.database.connection import Base

class SpeciesProfile(Base):
    __tablename__ = "species_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    common_name = Column(String(100), nullable=False, unique=True, index=True)
    scientific_name = Column(String(100), nullable=False, unique=True, index=True)
    
    # Taxonomy
    kingdom = Column(String(50), default="Animalia")
    phylum = Column(String(50), default="Chordata")
    class_name = Column(String(50), default="Mammalia")  # class is a reserved word in python
    order = Column(String(50), nullable=True)
    family = Column(String(50), nullable=True)
    genus = Column(String(50), nullable=True)
    species = Column(String(50), nullable=True)
    
    # Metadata
    iucn_status = Column(String(50), nullable=True)
    habitat = Column(String(100), nullable=True)
    diet = Column(String(50), nullable=True)
    distribution = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
