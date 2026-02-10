@echo off
echo Starting Employee Management System...

:: Start Backend
start cmd /k "echo Starting Backend... && cd backend && python -m uvicorn app.main:app --reload --port 8000"

:: Start Frontend
start cmd /k "echo Starting Frontend... && cd frontend && npm run dev"

echo Waiting for servers to start...
timeout /t 5 /nobreak > nul

:: Open Browser
start http://localhost:5173

echo EMS is running! 🚀
echo Close the individual terminal windows to stop the servers.
