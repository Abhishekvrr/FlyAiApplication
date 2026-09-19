"""
Flyy AI Backend Runner Script
Starts the FastAPI Privacy Gateway with live auto-reload enabled.
Can be executed from project root (python backend/run.py) or from backend directory.
"""

import sys
import uvicorn
from pathlib import Path

# Ensure backend directory and project root are in sys.path
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(1, str(PROJECT_ROOT))

if __name__ == "__main__":
    print("==========================================================")
    print(" Flyy AI Privacy Gateway — Starting Development Server")
    print(" API Documentation: http://localhost:8000/docs")
    print(" Health Endpoint:   http://localhost:8000/health")
    print("==========================================================")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        app_dir=str(BACKEND_DIR)
    )
