# Keycloak setup for Mezurilo

Mezurilo uses its **own** Keycloak client, `ptx-mass-man`. Do not reuse Kontado’s `ptx-finance` client, secret, or client roles.

The login page shows **Sign in with SSO** only when `KEYCLOAK_ID`, `KEYCLOAK_SECRET`, and `KEYCLOAK_ISSUER` are all set. Leave them unset for credentials-only (typical local Docker).

Issuer: `https://logon.partridgecrossing.org/realms/ptx`.

NextAuth sends this OAuth callback (from `NEXTAUTH_URL`). It must be listed on **this** client:

`https://mass.partridgecrossing.org/api/auth/callback/keycloak`

## Create client `ptx-mass-man`

1. Clients → Create client
   - Client ID: `ptx-mass-man`
   - Client type: OpenID Connect
   - Client authentication: **On**
   - Standard flow: **On**
2. Login settings:
   - Valid redirect URIs: `https://mass.partridgecrossing.org/api/auth/callback/keycloak`
   - Web origins: `https://mass.partridgecrossing.org`
3. Credentials tab → copy the client secret into `/home/torvaldsl/mass-man/.env` only:

```env
KEYCLOAK_ID="ptx-mass-man"
KEYCLOAK_SECRET="paste-from-keycloak"
KEYCLOAK_ISSUER="https://logon.partridgecrossing.org/realms/ptx"
```

Do not copy `KEYCLOAK_ID` or `KEYCLOAK_SECRET` from finance.

4. Client roles: create `USER`, `ADMIN`, and `GUEST`. Assign users under Users → Role mapping → Filter by clients → **ptx-mass-man**.

Roles are read from `resource_access[ptx-mass-man].roles` on the access token. Alternative admin names: `admin`, `administrator`, `it_admin`.

## After changing `.env`

```bash
export PATH="$HOME/.nvm/versions/node/v22.21.1/bin:$PATH"
pm2 restart mass-man --update-env
curl -sS http://127.0.0.1:3004/api/auth/providers
```

You should see a `keycloak` provider. Reload `/login` and **Sign in with SSO** should appear.
