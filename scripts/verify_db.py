"""
Compatibility wrapper for database/verify_db.py
"""

import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database.verify_db import verify_database

if __name__ == "__main__":
    sys.exit(verify_database())
