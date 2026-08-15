import os
import sys

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend")))

from app.database.connection import SessionLocal
from app.services.report_service import compile_report_dataset

def test_report_generation():
    db = SessionLocal()
    try:
        report_types = [
            "Wildlife Survey Report",
            "Species Population Report",
            "Biodiversity Report",
            "Habitat Assessment Report",
            "Conservation Report",
            "Wildlife Health Report",
            "Executive Summary Report"
        ]
        
        for rt in report_types:
            print(f"Testing compilation of: {rt} ...")
            try:
                # Test with no filters
                dataset = compile_report_dataset(db, rt, {})
                print(f"  Unfiltered: Success. Keys: {list(dataset.keys())}")
                
                # Test with conservation status filter
                dataset_filtered = compile_report_dataset(db, rt, {"conservation_status": "Endangered"})
                print(f"  Filtered by status: Success. Keys: {list(dataset_filtered.keys())}")
            except Exception as e:
                import traceback
                print(f"  FAILED: {e}")
                traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_report_generation()
