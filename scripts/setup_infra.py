"""
Infrastructure Setup Script (Local / Standalone Runner)
When Docker Desktop is not available on the host machine, this script downloads and
runs standalone/portable versions of:
1. Mailpit (axllent/mailpit) -> SMTP on :1025, Web UI on :8025
2. PostgreSQL 15 (EnterpriseDB Portable Binaries) -> Database on :5432
   Initializes cluster, configures user 'cdp_admin' with 'cdp_secure_pass',
   creates database 'cdp_platform', and executes docker/init.sql.
"""

import os
import sys
import time
import zipfile
import urllib.request
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
INFRA_DIR = BASE_DIR / ".infra"
MAILPIT_DIR = INFRA_DIR / "mailpit"
PGSQL_DIR = INFRA_DIR / "pgsql"
PG_DATA_DIR = INFRA_DIR / "pgdata"

MAILPIT_URL = "https://github.com/axllent/mailpit/releases/latest/download/mailpit-windows-amd64.zip"
PGSQL_URL = "https://get.enterprisedb.com/postgresql/postgresql-15.10-1-windows-x64-binaries.zip"


def download_and_extract(url: str, dest_dir: Path, description: str):
    dest_dir.mkdir(parents=True, exist_ok=True)
    zip_path = dest_dir / "package.zip"
    print(f"Downloading {description} from {url}...")
    
    urllib.request.urlretrieve(url, zip_path)
    print(f"Extracting {description}...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(dest_dir)
    
    if zip_path.exists():
        zip_path.unlink()
    print(f"{description} ready in {dest_dir}.")


def setup_mailpit():
    mailpit_exe = MAILPIT_DIR / "mailpit.exe"
    if not mailpit_exe.exists():
        download_and_extract(MAILPIT_URL, MAILPIT_DIR, "Mailpit")
    
    print("Starting Mailpit (SMTP :1025, Web UI :8025)...")
    # Start mailpit as background process
    log_file = open(INFRA_DIR / "mailpit.log", "w")
    proc = subprocess.Popen(
        [str(mailpit_exe), "--smtp", "127.0.0.1:1025", "--listen", "127.0.0.1:8025"],
        stdout=log_file,
        stderr=log_file,
        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0
    )
    time.sleep(2)
    print(f"Mailpit process started with PID {proc.pid}.")
    return proc


def setup_postgresql():
    pg_bin_dir = PGSQL_DIR / "pgsql" / "bin"
    if not (pg_bin_dir / "postgres.exe").exists():
        download_and_extract(PGSQL_URL, PGSQL_DIR, "PostgreSQL 15 Binaries")

    initdb_exe = pg_bin_dir / "initdb.exe"
    pg_ctl_exe = pg_bin_dir / "pg_ctl.exe"
    psql_exe = pg_bin_dir / "psql.exe"

    if not (PG_DATA_DIR / "PG_VERSION").exists():
        print(f"Initializing database cluster in {PG_DATA_DIR}...")
        PG_DATA_DIR.mkdir(parents=True, exist_ok=True)
        # Create superuser cdp_admin with password cdp_secure_pass
        pw_file = INFRA_DIR / "pwfile.txt"
        pw_file.write_text("cdp_secure_pass\n")

        subprocess.run([
            str(initdb_exe),
            "-D", str(PG_DATA_DIR),
            "-U", "cdp_admin",
            "--pwfile", str(pw_file),
            "-E", "UTF8",
            "-A", "scram-sha-256"
        ], check=True)
        pw_file.unlink(missing_ok=True)

    print("Starting PostgreSQL server on port 5432...")
    pg_log = INFRA_DIR / "postgres.log"
    subprocess.run([
        str(pg_ctl_exe),
        "-D", str(PG_DATA_DIR),
        "-l", str(pg_log),
        "-o", "-p 5432",
        "start"
    ], check=True)

    time.sleep(3)

    # Check / create database cdp_platform
    print("Configuring database 'cdp_platform' and executing docker/init.sql...")
    env = os.environ.copy()
    env["PGPASSWORD"] = "cdp_secure_pass"

    # Create DB if not exists
    createdb_sql = "SELECT 'CREATE DATABASE cdp_platform' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'cdp_platform')\\gexec"
    subprocess.run([
        str(psql_exe),
        "-h", "localhost",
        "-p", "5432",
        "-U", "cdp_admin",
        "-d", "postgres",
        "-c", createdb_sql
    ], env=env, check=False)

    # Run database/init.sql
    init_sql_path = BASE_DIR / "database" / "init.sql"
    if not init_sql_path.exists():
        init_sql_path = BASE_DIR / "docker" / "init.sql"
    subprocess.run([
        str(psql_exe),
        "-h", "localhost",
        "-p", "5432",
        "-U", "cdp_admin",
        "-d", "cdp_platform",
        "-f", str(init_sql_path)
    ], env=env, check=True)

    print("PostgreSQL 15 and CDP schemas successfully initialized!")


if __name__ == "__main__":
    INFRA_DIR.mkdir(parents=True, exist_ok=True)
    setup_mailpit()
    setup_postgresql()
    print("\nInfrastructure services are live and ready:")
    print("  - PostgreSQL: localhost:5432 (user: cdp_admin, db: cdp_platform)")
    print("  - Mailpit SMTP: localhost:1025")
    print("  - Mailpit UI: http://localhost:8025")
