"""
Start Background Services Script
Starts PostgreSQL 15 and Mailpit as persistent background services.
Ensures cdp_platform database exists and applies docker/init.sql.
"""

import os
import sys
import time
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
INFRA_DIR = BASE_DIR / ".infra"
PG_BIN = INFRA_DIR / "pgsql" / "pgsql" / "bin"
PG_DATA = INFRA_DIR / "pgdata"
PG_LOG = INFRA_DIR / "postgres.log"
MAILPIT_EXE = INFRA_DIR / "mailpit" / "mailpit.exe"

DETACHED_FLAGS = 0x00000008 | 0x00000200 if sys.platform == "win32" else 0

def start():
    print("Starting PostgreSQL server...")
    subprocess.run([
        str(PG_BIN / "pg_ctl.exe"),
        "-D", str(PG_DATA),
        "-l", str(PG_LOG),
        "-o", "-p 5432",
        "start"
    ], check=True)

    print("Starting Mailpit daemon...")
    mailpit_log = open(INFRA_DIR / "mailpit.log", "a")
    subprocess.Popen(
        [str(MAILPIT_EXE), "--smtp", "127.0.0.1:1025", "--listen", "127.0.0.1:8025"],
        stdout=mailpit_log,
        stderr=mailpit_log,
        creationflags=DETACHED_FLAGS
    )

    time.sleep(2)

    env = os.environ.copy()
    env["PGPASSWORD"] = "cdp_secure_pass"

    print("Verifying database 'cdp_platform'...")
    res = subprocess.run([
        str(PG_BIN / "psql.exe"),
        "-h", "localhost",
        "-p", "5432",
        "-U", "cdp_admin",
        "-d", "postgres",
        "-tAc", "SELECT 1 FROM pg_database WHERE datname='cdp_platform'"
    ], env=env, capture_output=True, text=True)

    if "1" not in res.stdout:
        print("Creating 'cdp_platform' database...")
        subprocess.run([
            str(PG_BIN / "createdb.exe"),
            "-h", "localhost",
            "-p", "5432",
            "-U", "cdp_admin",
            "cdp_platform"
        ], env=env, check=True)
    else:
        print("Database 'cdp_platform' already exists.")

    print("Executing docker/init.sql on cdp_platform...")
    subprocess.run([
        str(PG_BIN / "psql.exe"),
        "-h", "localhost",
        "-p", "5432",
        "-U", "cdp_admin",
        "-d", "cdp_platform",
        "-f", str(BASE_DIR / "docker" / "init.sql")
    ], env=env, check=True)

    print("\n--- Background Services Status ---")
    print("PostgreSQL: localhost:5432 (cdp_platform / cdp_admin)")
    print("Mailpit SMTP: localhost:1025")
    print("Mailpit Web UI: http://localhost:8025")


if __name__ == "__main__":
    start()
