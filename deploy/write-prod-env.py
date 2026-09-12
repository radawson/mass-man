#!/usr/bin/env python3
"""Write production .env for Mass Man using the Kontado Postgres host. Does not print secrets."""
from __future__ import annotations

import os
import re
import secrets
from pathlib import Path
from urllib.parse import urlparse, urlunparse


def value(text: str, key: str) -> str | None:
    match = re.search(rf'^{key}="?([^"\n]+)"?', text, re.M)
    return match.group(1) if match else None


def main() -> None:
    finance = Path("/home/torvaldsl/finance/.env").read_text(encoding="utf-8")
    dest = Path("/home/torvaldsl/mass-man/.env")
    parsed = urlparse(value(finance, "DATABASE_URL") or "")
    if not parsed.hostname:
        raise SystemExit("could not parse finance DATABASE_URL")
    db_url = urlunparse(parsed._replace(path="/massman"))
    if "schema=" not in db_url:
        db_url += ("&" if parsed.query else "?") + "schema=public"

    secret = secrets.token_urlsafe(32)
    lines = [
        f'DATABASE_URL="{db_url}"',
        'NEXTAUTH_URL="https://mass.partridgecrossing.org"',
        f'NEXTAUTH_SECRET="{secret}"',
        "PORT=3004",
        'NEXT_PUBLIC_APP_URL="https://mass.partridgecrossing.org"',
        'DEFAULT_ADMIN_EMAIL="admin@massman.local"',
        'DEFAULT_ADMIN_PASSWORD="ChangeMe123!"',
        'DEFAULT_ADMIN_NAME="System Administrator"',
        "",
        "# Keycloak OIDC — dedicated ptx-mass-man client. Do not copy finance KEYCLOAK_*.",
        '# KEYCLOAK_ID="ptx-mass-man"',
        "# KEYCLOAK_SECRET=",
        '# KEYCLOAK_ISSUER="https://logon.partridgecrossing.org/realms/ptx"',
        "",
    ]
    dest.write_text("\n".join(lines), encoding="utf-8")
    os.chmod(dest, 0o600)
    print("wrote .env")


if __name__ == "__main__":
    main()
