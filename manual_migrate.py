import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'backend', 'ems.db')

def add_column():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        print(f"Checking schema for {DB_PATH}...")
        cursor.execute("PRAGMA table_info(llm_settings)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'api_base' not in columns:
            print("Adding 'api_base' column...")
            cursor.execute("ALTER TABLE llm_settings ADD COLUMN api_base VARCHAR(255) DEFAULT 'http://localhost:11434/v1'")
            conn.commit()
            print("Column added successfully.")
        else:
            print("'api_base' column already exists.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_column()
