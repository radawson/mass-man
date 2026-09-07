#!/usr/bin/env python3
"""Create the massman database on the same Postgres host as Kontado.
Never prints connection secrets."""
from __future__ import annotations

import re
import subprocess
import sys
from urllib.parse import unquote, urlparse


def database_url(path: str) -> str:
    text = open(path, encoding="utf-8").read()
    match = re.search(r'^DATABASE_URL="([^"]+)"', text, re.M)
    if not match:
        sys.exit("DATABASE_URL not found")
    return match.group(1)


def main() -> None:
    parsed = urlparse(database_url("/home/torvaldsl/finance/.env"))
    if not parsed.hostname or not parsed.username:
        sys.exit("invalid DATABASE_URL")

    env = {
        "PGPASSWORD": unquote(parsed.password or ""),
        "PGHOST": parsed.hostname,
        "PGPORT": str(parsed.port or 5432),
        "PGUSER": unquote(parsed.username),
        "PGDATABASE": "postgres",
        "PATH": "/usr/bin:/bin",
    }

    exists = subprocess.run(
        ["psql", "-tAc", "SELECT 1 FROM pg_database WHERE datname='massman'"],
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    if exists.returncode != 0:
        sys.stderr.write(exists.stderr)
        sys.exit(exists.returncode)
    if exists.stdout.strip() == "1":
        print("database massman already exists")
        return

    created = subprocess.run(
        ["psql", "-v", "ON_ERROR_STOP=1", "-c", "CREATE DATABASE massman"],
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    if created.returncode != 0:
        sys.stderr.write(created.stderr)
        sys.exit(created.returncode)
    print("created database massman")


if __name__ == "__main__":
    main()
