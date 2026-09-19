"""
CDP Infrastructure Service Daemon
Runs PostgreSQL 15 and Mailpit as persistent foreground child processes
for the background daemon runner.
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


def main():
    print("=== Starting CDP Infrastructure Service Daemon ===")
    
    # 1. Start Postgres process directly
    postgres_cmd = [
        str(PG_BIN / "postgres.exe"),
        "-D", str(PG_DATA),
        "-p", "5432"
    ]
    print(f"Launching PostgreSQL: {' '.join(postgres_cmd)}")
    pg_proc = subprocess.Popen(postgres_cmd)

    # 2. Start Mailpit process directly
    mailpit_cmd = [
        str(MAILPIT_EXE),
        "--smtp", "127.0.0.1:1025",
        "--listen", "127.0.0.1:8025"
    ]
    print(f"Launching Mailpit: {' '.join(mailpit_cmd)}")
    mp_proc = subprocess.Popen(mailpit_cmd)

    print("Services spawned. Monitoring...")
    try:
        while True:
            time.sleep(1)
            if pg_proc.poll() is not None:
                print(f"PostgreSQL exited with code {pg_proc.returncode}")
                break
            if mp_proc.poll() is not None:
                print(f"Mailpit exited with code {mp_proc.returncode}")
                break
    except (KeyboardInterrupt, SystemExit):
        print("Stopping services...")
    finally:
        if pg_proc.poll() is None:
            pg_proc.terminate()
        if mp_proc.poll() is None:
            mp_proc.terminate()


if __name__ == "__main__":
    main()
