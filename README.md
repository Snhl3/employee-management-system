# Employee Management System

An open-source Employee Management System built with a robust monorepo architecture. 

## Tech Stack

- **Backend**: Python + FastAPI
- **Database**: MySQL with SQLAlchemy (ORM)
- **Migrations**: Alembic
- **Frontend**: React + TypeScript (Vite)
- **Authentication**: JWT

## Architecture Overview

The project is structured as a monorepo:

- `/backend`: FastAPI application, database models, and migration scripts.
- `/frontend`: React client application with TypeScript.

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- MySQL Server

### Backend Setup

1. Navigate to `/backend`.
2. Create a virtual environment: `python -m venv venv`.
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`.
5. Copy `.env.example` to `.env` and update your database credentials.
6. Run migrations: `alembic upgrade head`.
7. Start the server: `uvicorn app.main:app --reload`.

### Frontend Setup

1. Navigate to `/frontend`.
2. Install dependencies: `npm install`.
3. Copy `.env.example` to `.env` and update API base URL.
4. Start the development server: `npm run dev`.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
