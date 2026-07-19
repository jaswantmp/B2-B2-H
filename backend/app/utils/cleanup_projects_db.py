# app/utils/cleanup_projects_db.py
import sys
import os

# Add parent directory to path so app can be imported
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from app.database import SessionLocal
from app.models.project import Project

def cleanup_projects():
    print("Connecting to database...")
    db = SessionLocal()
    try:
        projects = db.query(Project).all()
        print(f"Found {len(projects)} projects to inspect.")
        updated_count = 0
        
        for project in projects:
            if project.tech:
                original_tech = project.tech
                # Deduplicate tech list preserving order
                deduped_tech = list(dict.fromkeys(original_tech))
                if len(deduped_tech) != len(original_tech):
                    print(f"Project '{project.title}': Deduplicating tech from {original_tech} to {deduped_tech}")
                    project.tech = deduped_tech
                    updated_count += 1
            
            if project.open_roles:
                original_roles = project.open_roles
                # Deduplicate open_roles list preserving order
                deduped_roles = list(dict.fromkeys(original_roles))
                if len(deduped_roles) != len(original_roles):
                    print(f"Project '{project.title}': Deduplicating open_roles from {original_roles} to {deduped_roles}")
                    project.open_roles = deduped_roles
                    updated_count += 1
                    
        if updated_count > 0:
            db.commit()
            print(f"Successfully updated {updated_count} projects.")
        else:
            print("No projects required updating.")
            
    except Exception as e:
        print(f"Error during cleanup: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_projects()
