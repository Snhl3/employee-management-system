from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .models import base  # Ensures all models are registered
from .api import employees, dashboard, settings, auth, users

app = FastAPI(title="Employee Management System API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(employees.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(settings.router, prefix="/api")

@app.get("/")
async def root():
    return {"message": "Welcome to the Employee Management System API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
