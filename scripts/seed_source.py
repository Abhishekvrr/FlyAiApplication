"""
Compatibility wrapper for database/seed_source.py
"""

import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from database.seed_source import seed_database

if __name__ == "__main__":
    count = seed_database()
    if count >= 50:
        print(f"SUCCESS: {count} customer records verified in source_store.customers.")
    else:
        print(f"WARNING: Expected at least 50 records, found {count}.", file=sys.stderr)
        sys.exit(1)
