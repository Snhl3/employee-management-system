import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'backend', 'ems.db')

def migrate_users():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print(f"Checking schema for 'users' table in {DB_PATH}...")
        cursor.execute("PRAGMA table_info(users)")
        columns = [row[1] for row in cursor.fetchall()]
        
        # Add 'name' column
        if 'name' not in columns:
            print("Adding 'name' column...")
            cursor.execute("ALTER TABLE users ADD COLUMN name VARCHAR(255)")
            conn.commit()
            print("'name' column added.")
        else:
            print("'name' column already exists.")
            
        # Add 'created_at' column
        if 'created_at' not in columns:
            print("Adding 'created_at' column...")
            # Use a constant default for SQLite compatibility when adding columns
            cursor.execute("ALTER TABLE users ADD COLUMN created_at DATETIME")
            cursor.execute(f"UPDATE users SET created_at = '{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}' WHERE created_at IS NULL")
            conn.commit()
            print("'created_at' column added and populated.")
        else:
            print("'created_at' column already exists.")
            
        # Add 'updated_at' column
        if 'updated_at' not in columns:
            print("Adding 'updated_at' column...")
            cursor.execute("ALTER TABLE users ADD COLUMN updated_at DATETIME")
            cursor.execute(f"UPDATE users SET updated_at = '{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}' WHERE updated_at IS NULL")
            conn.commit()
            print("'updated_at' column added and populated.")
        else:
            print("'updated_at' column already exists.")
            
        print("Migration completed successfully.")
            
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_users()
