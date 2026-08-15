from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text

from app.database.connection import engine, Base, SessionLocal
from app.database.schema import verify_milestone2_schema
from app.models.user import Role, User
from app.auth.security import get_password_hash
from app.routers import auth, users, surveys, sites, camera_traps, audio_sensors, observations, dashboard, uploads, admin, audio, biodiversity, species, population, habitat, conservation, health, intelligence, notification, reports
from fastapi.staticfiles import StaticFiles
import os

def verify_and_seed_database():
    print("--------------------------------------------------")
    print("LOG: Starting database setup and verification...")
    
    # 1. Verify Database Connection
    db = SessionLocal()
    try:
        # Test connection using simple select query
        db.execute(text("SELECT 1"))
        print("LOG: Database connection successful.")
    except Exception as e:
        print(f"ERROR: Database connection failed: {e}")
        return
        
    # 2. Report Tables Creation
    try:
        Base.metadata.create_all(bind=engine)
        verify_milestone2_schema(engine)
        print("LOG: Database tables created/verified successfully.")
    except Exception as e:
        print(f"ERROR: Database tables creation failed: {e}")
        db.close()
        return

    # 2b. Idempotent schema migrations — add new columns to existing tables
    # safe to run every startup; ALTER TABLE errors if column exists are caught silently.
    try:
        db.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target_roles JSON"))
        db.commit()
        print("LOG: Notification target_roles column ensured.")
    except Exception:
        db.rollback()  # Column already exists or unsupported — harmless

    # 3. Seed Roles and Users
    try:
        # Seeding Roles
        roles_to_seed = [
            ("Administrator", "System Administrator with full access"),
            ("Wildlife Researcher", "Conducts surveys and analyzes observations"),
            ("Conservation Officer", "Manages monitoring sites and habitats"),
            ("Forest Department Officer", "Monitors camera traps, sensors, and patrol logs")
        ]
        
        role_objs = {}
        for role_name, description in roles_to_seed:
            role = db.query(Role).filter(Role.name == role_name).first()
            if not role:
                role = Role(name=role_name, description=description)
                db.add(role)
                db.commit()
                db.refresh(role)
                print(f"LOG: Seeded role '{role_name}'.")
            role_objs[role_name] = role

        # Seeding Users
        seeded_any = False
        default_pwd = "Admin@123"
        
        # Admin
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@wildlife.org",
                hashed_password=get_password_hash(default_pwd)
            )
            admin_user.roles.append(role_objs["Administrator"])
            db.add(admin_user)
            db.commit()
            print(f"LOG: Seeded user 'admin' (Password: {default_pwd})")
            seeded_any = True
        else:
            # Force update password to ensure it matches default_pwd
            admin_user.hashed_password = get_password_hash(default_pwd)
            db.commit()
            print(f"LOG: Updated user 'admin' password to default '{default_pwd}'")

        # Researcher
        researcher_user = db.query(User).filter(User.username == "researcher").first()
        if not researcher_user:
            researcher_user = User(
                username="researcher",
                email="researcher@wildlife.org",
                hashed_password=get_password_hash(default_pwd)
            )
            researcher_user.roles.append(role_objs["Wildlife Researcher"])
            db.add(researcher_user)
            db.commit()
            print(f"LOG: Seeded user 'researcher' (Password: {default_pwd})")
            seeded_any = True
        else:
            # Force update password to ensure it matches default_pwd
            researcher_user.hashed_password = get_password_hash(default_pwd)
            db.commit()
            print(f"LOG: Updated user 'researcher' password to default '{default_pwd}'")
            
        # Conservation Officer demo user
        officer_user = db.query(User).filter(User.username == "officer").first()
        if not officer_user:
            officer_user = User(
                username="officer",
                email="officer@wildlife.org",
                hashed_password=get_password_hash(default_pwd)
            )
            officer_user.roles.append(role_objs["Conservation Officer"])
            db.add(officer_user)
            db.commit()
            print(f"LOG: Seeded user 'officer' (Conservation Officer, Password: {default_pwd})")
            seeded_any = True
        else:
            officer_user.hashed_password = get_password_hash(default_pwd)
            db.commit()
            print(f"LOG: Updated user 'officer' password to default '{default_pwd}'")

        # Forest Department Officer demo user
        forester_user = db.query(User).filter(User.username == "forester").first()
        if not forester_user:
            forester_user = User(
                username="forester",
                email="forester@wildlife.org",
                hashed_password=get_password_hash(default_pwd)
            )
            forester_user.roles.append(role_objs["Forest Department Officer"])
            db.add(forester_user)
            db.commit()
            print(f"LOG: Seeded user 'forester' (Forest Department Officer, Password: {default_pwd})")
            seeded_any = True
        else:
            forester_user.hashed_password = get_password_hash(default_pwd)
            db.commit()
            print(f"LOG: Updated user 'forester' password to default '{default_pwd}'")

        if seeded_any:
            print("LOG: Database seeding completed successfully.")
        else:
            print("LOG: Database seeding skipped (Default data already seeded).")

        # 4. Seed Species Profiles
        from app.models.species import SpeciesProfile
        from app.utils.species_data import SPECIES_SEED_DATA

        species_count = db.query(SpeciesProfile).count()
        if species_count == 0:
            print("LOG: Seeding Species Profiles...")
            for sp_data in SPECIES_SEED_DATA:
                db_sp = SpeciesProfile(**sp_data)
                db.add(db_sp)
            db.commit()
            print(f"LOG: Seeded {len(SPECIES_SEED_DATA)} species profiles.")
        else:
            print(f"LOG: Species profiles already seeded. Total: {species_count}")

        # 5. Auto-seed demo monitoring/survey/observation data if DB is empty
        from app.models.monitoring import MonitoringSite
        from app.utils.demo_generator import seed_demo_data
        sites_count = db.query(MonitoringSite).count()
        if sites_count == 0:
            print("LOG: No monitoring sites found — auto-seeding demo dataset...")
            try:
                admin_id = db.query(User).filter(User.username == "admin").first().id
                seed_demo_data(db, admin_id)
                print("LOG: Demo dataset auto-seeded successfully.")
            except Exception as seed_err:
                print(f"WARNING: Demo dataset auto-seed failed: {seed_err}")
        else:
            print(f"LOG: Demo dataset already present ({sites_count} monitoring sites).")

        # 6. Report Number of Users Created
        user_count = db.query(User).count()
        print(f"LOG: Total registered users in database: {user_count}")
        print("--------------------------------------------------")
        
    except Exception as e:
        print(f"ERROR: Database seeding failed: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup database schema and seeds
    verify_and_seed_database()
    
    # Initialize YOLO Model once on startup
    from app.services.yolo_service import yolo_service
    try:
        yolo_service.initialize()
        
        # Self-validating taxonomy system
        from app.data.taxonomy import TAXONOMY_DATABASE, normalize_class_name
        
        yolo_classes = list(yolo_service._model.names.values())
        missing_classes = []
        
        print("=========================================")
        print(f"YOLO Classes Loaded : {len(yolo_classes)}")
        print(f"Taxonomy Entries    : {len(TAXONOMY_DATABASE)}")
        
        for name in yolo_classes:
            norm_name = normalize_class_name(name)
            if norm_name in TAXONOMY_DATABASE:
                print(f"✓ {name}")
            else:
                print(f"✗ {name} (Missing)")
                missing_classes.append(name)
                
        if missing_classes:
            print("=========================================")
            print("ERROR")
            print("Missing taxonomy for:")
            for m in missing_classes:
                print(f"  {m}")
            print("Application startup aborted.")
            print("=========================================")
            raise RuntimeError(f"Startup aborted due to missing taxonomy mappings for: {', '.join(missing_classes)}")
        else:
            print("Taxonomy Validation Passed")
            print("=========================================")
            
    except Exception as e:
        print(f"ERROR: Failed to initialize and validate YOLO model on startup: {e}")
        raise e
        
    yield

app = FastAPI(
    title="Wildlife Population Intelligence System API",
    description="Backend API foundation for wildlife surveys, monitoring sites, camera traps, audio sensors and observations.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for communication with React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Local development (Vite dev server)
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        # Docker / production deployment (nginx on port 80)
        "http://localhost",
        "http://localhost:80",
        "http://127.0.0.1",
        "http://127.0.0.1:80",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(surveys.router)
app.include_router(sites.router)
app.include_router(camera_traps.router)
app.include_router(audio_sensors.router)
app.include_router(observations.router)
app.include_router(dashboard.router)
app.include_router(uploads.router)
app.include_router(admin.router)
app.include_router(audio.router)
app.include_router(biodiversity.router)
app.include_router(species.router)
app.include_router(population.router)
app.include_router(habitat.router)
app.include_router(conservation.router)
app.include_router(health.router)
app.include_router(intelligence.router)
app.include_router(notification.router)
app.include_router(reports.router)

# Mount StaticFiles for uploaded media serving
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/api/health")
def health_check():
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}


@app.get("/")
def read_root():
    return {
        "message": "Welcome to Wildlife Population Intelligence System API",
        "milestone": 1,
        "docs_url": "/docs"
    }
