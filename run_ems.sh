#!/bin/bash

echo "Starting Employee Management System..."

# Start Backend in background
(cd backend && python3 -m uvicorn app.main:app --reload --port 8000) &
BACKEND_PID=$!

# Start Frontend in background
(cd frontend && npm run dev) &
FRONTEND_PID=$!

echo "Waiting for servers to start..."
sleep 5

# Open Browser (macOS uses 'open', Linux uses 'xdg-open')
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:5173
else
    xdg-open http://localhost:5173 || echo "Please open http://localhost:5173 in your browser."
fi

echo "EMS is running! 🚀"
echo "Press Ctrl+C to stop both servers."

# Wait for both processes
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
