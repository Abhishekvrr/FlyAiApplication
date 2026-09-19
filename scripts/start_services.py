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
    pid_file = PG_DATA / "postmaster.pid"
    if pid_file.exists():
        try:
            pid_file.unlink()
        except Exception:
            pass

    pg_log_file = open(PG_LOG, "a")
    subprocess.Popen(
        [str(PG_BIN / "postgres.exe"), "-D", str(PG_DATA), "-p", "5432"],
        stdout=pg_log_file,
        stderr=pg_log_file,
        creationflags=DETACHED_FLAGS
    )

    print("Starting Mailpit daemon...")
    mailpit_log = open(INFRA_DIR / "mailpit.log", "a")
    subprocess.Popen(
        [str(MAILPIT_EXE), "--smtp", "127.0.0.1:1025", "--listen", "127.0.0.1:8025"],
        stdout=mailpit_log,
        stderr=mailpit_log,
        creationflags=DETACHED_FLAGS
    )

    print("Waiting for PostgreSQL to be ready...")
    for _ in range(15):
        time.sleep(1)
        res = subprocess.run([
            str(PG_BIN / "pg_isready.exe"),
            "-h", "localhost",
            "-p", "5432"
        ], capture_output=True, text=True)
        if res.returncode == 0:
            print("PostgreSQL is ready.")
            break
    else:
        print("Warning: PostgreSQL took long to start.")

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

    init_sql_path = BASE_DIR / "database" / "init.sql"
    if not init_sql_path.exists():
        init_sql_path = BASE_DIR / "docker" / "init.sql"

    print(f"Executing {init_sql_path.name} on cdp_platform...")
    subprocess.run([
        str(PG_BIN / "psql.exe"),
        "-h", "localhost",
        "-p", "5432",
        "-U", "cdp_admin",
        "-d", "cdp_platform",
        "-f", str(init_sql_path)
    ], env=env, check=True)

    print("\n--- Background Services Status ---")
    print("PostgreSQL: localhost:5432 (cdp_platform / cdp_admin)")
    print("Mailpit SMTP: localhost:1025")
    print("Mailpit Web UI: http://localhost:8025")
    print("Services are running actively.")

    try:
        while True:
            time.sleep(3600)
    except KeyboardInterrupt:
        print("Stopping services...")


if __name__ == "__main__":
    start()

