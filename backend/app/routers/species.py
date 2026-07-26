from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import json
import os
from pathlib import Path

from typing import List
from app.database.connection import get_db
from app.models.species import SpeciesProfile
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.schemas.species import SpeciesProfileOut

router = APIRouter(prefix="/api/species", tags=["species"])

@router.get("", response_model=List[SpeciesProfileOut])
def get_species_profiles(db: Session = Depends(get_db)):
    """
    Get all species profiles from the database.
    """
    return db.query(SpeciesProfile).all()

@router.post("/sync", status_code=status.HTTP_200_OK)
def sync_species_catalog(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Sync all species profiles from species_catalog.json into the PostgreSQL database.
    Does not duplicate existing entries.
    """
    catalog_path = Path(__file__).resolve().parents[2] / "data" / "species_catalog.json"
    if not catalog_path.exists():
        raise HTTPException(status_code=404, detail="species_catalog.json not found")
        
    try:
        with open(catalog_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        catalog_species = data.get("species", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read catalog: {str(e)}")
        
    added_count = 0
    updated_count = 0
    
    seen_commons = set()
    seen_scientifics = set()
    
    for entry in catalog_species:
        common_name = entry.get("common_name", "").strip()
        scientific_name = entry.get("scientific_name", "").strip()
        
        if not common_name or not scientific_name:
            continue
            
        norm_common = common_name.lower()
        norm_scientific = scientific_name.lower()
        
        # Skip duplicate entries in same catalog run
        if norm_common in seen_commons or norm_scientific in seen_scientifics:
            continue
            
        seen_commons.add(norm_common)
        seen_scientifics.add(norm_scientific)
        
        class_name = entry.get("class_name") or entry.get("class") or "Mammalia"
        
        # Safe truncation helper
        def truncate(s, limit):
            if not s:
                return ""
            return str(s).strip()[:limit]
            
        payload = {
            "common_name": truncate(common_name, 100),
            "scientific_name": truncate(scientific_name, 100),
            "kingdom": truncate(entry.get("kingdom") or "Animalia", 50),
            "phylum": truncate(entry.get("phylum") or "Chordata", 50),
            "class_name": truncate(class_name, 50),
            "order": truncate(entry.get("order") or "", 50),
            "family": truncate(entry.get("family") or "", 50),
            "genus": truncate(entry.get("genus") or "", 50),
            "species": truncate(entry.get("species") or scientific_name, 50),
            "iucn_status": truncate(entry.get("iucn_status") or "Least Concern", 50),
            "habitat": truncate(entry.get("habitat") or "", 100),
            "diet": truncate(entry.get("diet") or "", 50),
            "distribution": truncate(entry.get("distribution") or "", 255),
            "description": entry.get("description") or "",
        }
        
        try:
            with db.begin_nested():
                # Check if already exists in DB
                existing = db.query(SpeciesProfile).filter(
                    (SpeciesProfile.common_name.ilike(payload["common_name"])) | 
                    (SpeciesProfile.scientific_name.ilike(payload["scientific_name"]))
                ).first()
                
                if existing:
                    for key, val in payload.items():
                        setattr(existing, key, val)
                    updated_count += 1
                else:
                    db_sp = SpeciesProfile(**payload)
                    db.add(db_sp)
                    added_count += 1
                db.flush()
        except Exception as e:
            # Skip conflict
            continue
            
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database commit failed: {str(e)}")
        
    return {
        "success": True,
        "message": f"Successfully synchronized species catalog with database.",
        "added": added_count,
        "updated": updated_count,
        "total_catalog": len(catalog_species),
        "total_db": db.query(SpeciesProfile).count()
    }
