import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'backend', 'ems.db')

def check_user():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, email, name, role, is_active FROM users")
        users = cursor.fetchall()
        if users:
            print(f"Found {len(users)} users:")
            for u in users:
                print(f"ID={u[0]}, Email={u[1]}, Name={u[2]}, Role={u[3]}, Active={u[4]}")
        else:
            print("No users found.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_user()
