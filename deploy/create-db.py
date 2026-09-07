#!/usr/bin/env python3
"""Ensure Mass Man has a Postgres namespace.
Prefers CREATE DATABASE massman; falls back to schema massman in the Kontado database.
Never prints connection secrets."""
from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import parse_qsl, unquote, urlencode, urlparse, urlunparse


def database_url(path: str) -> str:
    text = Path(path).read_text(encoding="utf-8")
    match = re.search(r'^DATABASE_URL="([^"]+)"', text, re.M)
    if not match:
        sys.exit("DATABASE_URL not found")
    return match.group(1)


def pg_env(parsed, database: str) -> dict[str, str]:
    return {
        "PGPASSWORD": unquote(parsed.password or ""),
        "PGHOST": parsed.hostname or "",
        "PGPORT": str(parsed.port or 5432),
        "PGUSER": unquote(parsed.username or ""),
        "PGDATABASE": database,
        "PATH": "/usr/bin:/bin",
    }


def psql(env: dict[str, str], sql: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["psql", "-v", "ON_ERROR_STOP=1", "-tAc", sql],
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )


def rewrite_env_schema(env_path: Path, db_name: str, schema: str) -> None:
    parsed = urlparse(database_url(str(env_path)))
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query["schema"] = schema
    new_url = urlunparse(parsed._replace(path=f"/{db_name}", query=urlencode(query)))
    text = env_path.read_text(encoding="utf-8")
    text = re.sub(r'^DATABASE_URL="[^"]+"', f'DATABASE_URL="{new_url}"', text, count=1, flags=re.M)
    env_path.write_text(text, encoding="utf-8")
    os.chmod(env_path, 0o600)


def main() -> None:
    finance_url = database_url("/home/torvaldsl/finance/.env")
    parsed = urlparse(finance_url)
    if not parsed.hostname or not parsed.username:
        sys.exit("invalid DATABASE_URL")
    current_db = (parsed.path or "/postgres").lstrip("/").split("?")[0] or "postgres"
    env_path = Path("/home/torvaldsl/mass-man/.env")

    createdb = psql(pg_env(parsed, "postgres"), "CREATE DATABASE massman")
    if createdb.returncode == 0:
        print("created database massman")
        rewrite_env_schema(env_path, "massman", "public")
        return
    if "already exists" in (createdb.stderr + createdb.stdout).lower():
        print("database massman already exists")
        rewrite_env_schema(env_path, "massman", "public")
        return

    schema = psql(pg_env(parsed, current_db), "CREATE SCHEMA IF NOT EXISTS massman")
    if schema.returncode != 0:
        sys.stderr.write(createdb.stderr)
        sys.stderr.write(schema.stderr)
        sys.exit(1)
    rewrite_env_schema(env_path, current_db, "massman")
    print("CREATE DATABASE denied; using schema massman in existing database")


if __name__ == "__main__":
    main()
