import os
import sys
from sqlalchemy import create_engine, text

# Add backend directory to path to import connection details
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.config import settings

def run_migration():
    DATABASE_URL = f"postgresql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
    print(f"Connecting to database to run migration...")
    engine = create_engine(DATABASE_URL)
    
    queries = [
        "ALTER TABLE observations ADD COLUMN IF NOT EXISTS is_unknown BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE observations ADD COLUMN IF NOT EXISTS is_endangered BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE prediction_history ADD COLUMN IF NOT EXISTS is_unknown BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE prediction_history ADD COLUMN IF NOT EXISTS is_endangered BOOLEAN DEFAULT FALSE;"
    ]
    
    with engine.connect() as conn:
        trans = conn.begin()
        try:
            for query in queries:
                print(f"Executing: {query}")
                conn.execute(text(query))
            trans.commit()
            print("Migration completed successfully!")
        except Exception as e:
            trans.rollback()
            print(f"Error executing migration: {e}")
            sys.exit(1)

if __name__ == "__main__":
    run_migration()
