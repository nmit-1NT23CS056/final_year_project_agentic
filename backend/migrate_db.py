import sqlite3
import os

paths = [
    os.path.join(os.path.dirname(__file__), "career_agent.db"),
    os.path.join(os.path.dirname(__file__), "..", "career_agent.db")
]

new_cols = [
    ("persona", "TEXT DEFAULT 'student'"),
    ("target_role", "TEXT DEFAULT ''"),
    ("available_hours_per_week", "INTEGER DEFAULT 15"),
    ("github_link", "TEXT DEFAULT ''"),
    ("online_courses", "TEXT DEFAULT '[]'"),
    ("human_goal", "TEXT DEFAULT ''"),
    ("domain_marks", "TEXT DEFAULT '{}'"),
    ("adaptive_duration", "TEXT DEFAULT ''"),
    ("topic_dependencies", "TEXT DEFAULT '[]'"),
    ("technical_identity", "TEXT DEFAULT ''"),
    ("executive_summary", "TEXT DEFAULT ''"),
    ("architectural_pillars", "TEXT DEFAULT '[]'"),
    ("growth_milestones", "TEXT DEFAULT '[]'")
]

job_new_cols = [
    ("job_url", "TEXT DEFAULT ''"),
    ("source_portal", "TEXT DEFAULT 'LinkedIn'"),
    ("location", "TEXT DEFAULT 'Remote / Hybrid'"),
    ("employment_type", "TEXT DEFAULT 'Full-time'"),
    ("salary_range", "TEXT DEFAULT 'Competitive'"),
    ("experience_level", "TEXT DEFAULT 'Fresher / 0-2 yrs'"),
    ("matching_skills", "TEXT DEFAULT '[]'"),
    ("missing_skills", "TEXT DEFAULT '[]'"),
    ("application_status", "TEXT DEFAULT 'Saved'"),
    ("applied_at", "TEXT DEFAULT ''")
]

for db_path in paths:
    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 1. candidate_profiles
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='candidate_profiles'")
        if cursor.fetchone():
            cursor.execute("PRAGMA table_info(candidate_profiles)")
            existing_cols = [row[1] for row in cursor.fetchall()]
            for col_name, col_def in new_cols:
                if col_name not in existing_cols:
                    print(f"  Adding candidate_profiles column: {col_name}")
                    cursor.execute(f"ALTER TABLE candidate_profiles ADD COLUMN {col_name} {col_def}")

        # 2. job_matches
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='job_matches'")
        if cursor.fetchone():
            cursor.execute("PRAGMA table_info(job_matches)")
            existing_cols = [row[1] for row in cursor.fetchall()]
            for col_name, col_def in job_new_cols:
                if col_name not in existing_cols:
                    print(f"  Adding job_matches column: {col_name}")
                    cursor.execute(f"ALTER TABLE job_matches ADD COLUMN {col_name} {col_def}")
                    
        conn.commit()
        print(f"Migrated {db_path} successfully!")
        conn.close()
