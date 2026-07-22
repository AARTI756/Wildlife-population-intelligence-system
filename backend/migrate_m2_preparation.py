"""Apply the same non-destructive Milestone 2 verification used at startup."""
from app.database.connection import engine
from app.database.schema import verify_milestone2_schema

def migrate():
    verify_milestone2_schema(engine)
    print("Milestone 2 schema verified; no tables or observation data were recreated.")

if __name__ == "__main__":
    migrate()
