import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

def create_database_if_not_exists():
    try:
        # Connect to default postgres DB to check and create target database
        conn = psycopg2.connect(
            dbname="postgres",
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            host=settings.DB_HOST,
            port=settings.DB_PORT
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if DB exists
        cursor.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{settings.DB_NAME}'")
        exists = cursor.fetchone()
        if not exists:
            print(f"Database '{settings.DB_NAME}' does not exist. Creating database...")
            cursor.execute(f"CREATE DATABASE {settings.DB_NAME}")
            print(f"Database '{settings.DB_NAME}' created successfully.")
        else:
            print(f"Database '{settings.DB_NAME}' already exists.")
            
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Warning: Could not verify/create database '{settings.DB_NAME}': {e}")
        print("Will attempt direct connection.")

# Run database creation check
create_database_if_not_exists()

DATABASE_URL = f"postgresql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
