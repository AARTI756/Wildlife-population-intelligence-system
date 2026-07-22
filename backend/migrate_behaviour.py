"""
Migration script: Add 'behaviour' column to observations table.
Run once to update the existing database schema.
"""
import psycopg2

DB_CONFIG = {
    "dbname": "wildlife_db",
    "user": "postgres",
    "password": "Aarti",
    "host": "localhost",
    "port": "5432"
}

def migrate():
    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = True
    cur = conn.cursor()
    
    # Add behaviour column if it doesn't exist
    cur.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'observations' AND column_name = 'behaviour'
            ) THEN
                ALTER TABLE observations ADD COLUMN behaviour TEXT;
                RAISE NOTICE 'Added behaviour column to observations table.';
            ELSE
                RAISE NOTICE 'behaviour column already exists.';
            END IF;
        END
        $$;
    """)
    
    print("Migration complete: behaviour column verified on observations table.")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    migrate()
