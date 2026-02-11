import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine
from app.models.user import User, UserRole
from app.api.auth_utils import get_password_hash
from app.models.base import Base

def seed_admins():
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        admins = [
            {
                "email": "snehal.lawande@neosoftmail.com",
                "password": "admin123",
                "role": UserRole.ADMIN
            },
            {
                "email": "kishor.parida@neosofttech.com",
                "password": "admin123",
                "role": UserRole.ADMIN
            }
        ]

        for admin_data in admins:
            user = db.query(User).filter(User.email == admin_data["email"]).first()
            if not user:
                new_admin = User(
                    email=admin_data["email"],
                    hashed_password=get_password_hash(admin_data["password"]),
                    role=admin_data["role"],
                    is_active=True
                )
                db.add(new_admin)
                print(f"Created admin: {admin_data['email']}")
            else:
                # Force update password hash and role
                user.hashed_password = get_password_hash(admin_data["password"])
                user.role = admin_data["role"]
                user.is_active = True
                print(f"Updated admin: {admin_data['email']}")
        
        db.commit()
        print("Admin seeding completed successfully!")
    except Exception as e:
        print(f"Error seeding admins: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_admins()
