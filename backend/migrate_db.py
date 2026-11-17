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
    ("topic_dependencies", "TEXT DEFAULT '[]'")
]

for db_path in paths:
    if os.path.exists(db_path):
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='candidate_profiles'")
        if cursor.fetchone():
            cursor.execute("PRAGMA table_info(candidate_profiles)")
            existing_cols = [row[1] for row in cursor.fetchall()]
            print(f"Checking {db_path}...")
            for col_name, col_def in new_cols:
                if col_name not in existing_cols:
                    print(f"  Adding column: {col_name}")
                    cursor.execute(f"ALTER TABLE candidate_profiles ADD COLUMN {col_name} {col_def}")
            conn.commit()
            print(f"Migrated {db_path} successfully!")
        else:
            print(f"Skipping {db_path} (no candidate_profiles table)")
        conn.close()
