# Keycloak setup for Mass Man

Mass Man supports credentials (email/password) and optional Keycloak OIDC.

## Create a client

1. Open the Keycloak admin console.
2. Realm example: `ptx`
3. Clients → Create client
   - Client ID: `ptx-mass-man`
   - Client type: OpenID Connect
   - Client authentication: On
   - Standard flow: On
4. Login settings:
   - Valid redirect URIs: `https://<host>/api/auth/callback/keycloak`
   - Web origins: `https://<host>`
5. Copy the client secret into `.env`:

```
KEYCLOAK_ID="ptx-mass-man"
KEYCLOAK_SECRET="your-client-secret"
KEYCLOAK_ISSUER="https://logon.partridgecrossing.org/realms/ptx"
```

## Client roles

Create client roles `USER`, `ADMIN`, and `GUEST`. Roles are read from `resource_access[clientId].roles` on the access token (same mapping as Kontado). If Keycloak env vars are unset, only credentials login is shown.
