"""Non-destructive schema verification for installations predating Milestone 2."""
import logging
from sqlalchemy import inspect, text

logger = logging.getLogger(__name__)

OBSERVATION_COLUMNS = {
    "behaviour": "TEXT",
    "individual_id": "VARCHAR(100)",
    "reidentification_confidence": "DOUBLE PRECISION",
    "previous_sightings": "INTEGER DEFAULT 0",
    "uploaded_image_id": "INTEGER",
    "uploaded_audio_id": "INTEGER",
    "animal_call_detected": "BOOLEAN DEFAULT FALSE",
    "animal_call_category": "VARCHAR(100)",
}

UPLOAD_COLUMNS = {
    "ai_summary": "TEXT",
    "animal_call_detected": "BOOLEAN DEFAULT FALSE",
    "animal_call_category": "VARCHAR(100)",
}
PREDICTION_COLUMNS = {
    "behaviour": "TEXT",
    "animal_call_detected": "BOOLEAN DEFAULT FALSE",
    "animal_call_category": "VARCHAR(100)",
}

def verify_milestone2_schema(engine):
    """Add only missing nullable columns. Existing rows and tables are untouched."""
    inspector = inspect(engine)
    with engine.begin() as connection:
        for table, columns in (("observations", OBSERVATION_COLUMNS), ("uploaded_images", UPLOAD_COLUMNS), ("uploaded_audios", UPLOAD_COLUMNS)):
            if table not in inspector.get_table_names():
                continue
            existing = {column["name"] for column in inspector.get_columns(table)}
            for name, definition in columns.items():
                if name not in existing:
                    logger.warning("Applying compatible schema update: %s.%s", table, name)
                    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {definition}"))
        existing = {column["name"] for column in inspector.get_columns("prediction_history")} if "prediction_history" in inspector.get_table_names() else set()
        for name, definition in PREDICTION_COLUMNS.items():
            if name not in existing:
                connection.execute(text(f"ALTER TABLE prediction_history ADD COLUMN {name} {definition}"))
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_observations_individual_id ON observations (individual_id)"))
