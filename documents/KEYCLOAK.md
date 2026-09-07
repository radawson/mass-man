# Keycloak setup for Mass Man

Mass Man shows **Sign in with SSO** only when `KEYCLOAK_ID`, `KEYCLOAK_SECRET`, and `KEYCLOAK_ISSUER` are all set. Leave them unset for credentials-only (typical local Docker).

Issuer for this site: `https://logon.partridgecrossing.org/realms/ptx`.

## Fast path (same client as Kontado)

Reuse `ptx-finance` so existing SSO users keep their roles. In Keycloak:

1. Clients → **ptx-finance** → Settings
2. **Valid redirect URIs** — add:
   `https://mass.partridgecrossing.org/api/auth/callback/keycloak`
3. **Web origins** — add:
   `https://mass.partridgecrossing.org`
4. Save

Copy `KEYCLOAK_ID`, `KEYCLOAK_SECRET`, and `KEYCLOAK_ISSUER` from the finance `.env` into `/home/torvaldsl/mass-man/.env`, then `pm2 restart mass-man`.

## Dedicated client (`ptx-mass-man`)

Use this if Mass Man should have its own client roles.

1. Clients → Create client
   - Client ID: `ptx-mass-man`
   - Client type: OpenID Connect
   - Client authentication: **On**
   - Standard flow: **On**
2. Login settings:
   - Valid redirect URIs: `https://mass.partridgecrossing.org/api/auth/callback/keycloak`
   - Web origins: `https://mass.partridgecrossing.org`
3. Credentials tab → copy the client secret into `.env`:

```env
KEYCLOAK_ID="ptx-mass-man"
KEYCLOAK_SECRET="paste-from-keycloak"
KEYCLOAK_ISSUER="https://logon.partridgecrossing.org/realms/ptx"
```

4. Client roles: create `USER`, `ADMIN`, and `GUEST` (same names as Kontado). Assign users under Users → Role mapping → Filter by clients → **ptx-mass-man**.

Roles are read from `resource_access[clientId].roles` on the access token. Alternative admin names: `admin`, `administrator`, `it_admin`.

## After changing `.env`

```bash
export PATH="$HOME/.nvm/versions/node/v22.21.1/bin:$PATH"
pm2 restart mass-man
curl -sS http://127.0.0.1:3004/api/auth/providers
```

You should see a `keycloak` provider. Reload `/login` and **Sign in with SSO** should appear.
