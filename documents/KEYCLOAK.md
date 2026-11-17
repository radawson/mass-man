# Keycloak setup for Mezurilo

Production on ptx-web02 uses its **own** Keycloak client, `ptx-mass` (`KEYCLOAK_ID`). If another installation uses a different client ID, substitute that ID throughout these instructions. Do not reuse Kontado’s `ptx-finance` client, secret, or client roles.

The login page shows **Sign in with SSO** only when `KEYCLOAK_ID`, `KEYCLOAK_SECRET`, and `KEYCLOAK_ISSUER` are all set. Leave them unset for credentials-only (typical local Docker).

Issuer: `https://logon.partridgecrossing.org/realms/ptx`.

NextAuth sends this OAuth callback (from `NEXTAUTH_URL`). It must be listed on **this** client:

`https://mass.partridgecrossing.org/api/auth/callback/keycloak`

## Create client `ptx-mass`

1. Clients → Create client
   - Client ID: `ptx-mass`
   - Client type: OpenID Connect
   - Client authentication: **On**
   - Standard flow: **On**
2. Login settings:
   - Valid redirect URIs: `https://mass.partridgecrossing.org/api/auth/callback/keycloak`
   - Web origins: `https://mass.partridgecrossing.org`
3. Credentials tab → copy the client secret into `/home/torvaldsl/mass-man/.env` only:

```env
KEYCLOAK_ID="ptx-mass"
KEYCLOAK_SECRET="paste-from-keycloak"
KEYCLOAK_ISSUER="https://logon.partridgecrossing.org/realms/ptx"
```

Do not copy `KEYCLOAK_ID` or `KEYCLOAK_SECRET` from finance.

4. Client roles: create `USER`, `ADMIN`, and `GUEST`. Assign users under Users → Role mapping → Filter by clients → **ptx-mass**.

Roles are read from `resource_access[KEYCLOAK_ID].roles` (production: `resource_access[ptx-mass].roles`) on the access token, as well as realm roles. Alternative admin names: `admin`, `administrator`, `it_admin`.

## After changing `.env`

```bash
sudo systemctl restart mass-man.service
curl -sS http://127.0.0.1:3004/api/auth/providers
```

You should see a `keycloak` provider. Reload `/login` and **Sign in with SSO** should appear.

## Linking a household member created by an admin

An admin can create a local profile from **Users** using the person's email before their first SSO login. Keycloak must supply `sub`, `email`, and `email_verified: true` through the `openid email profile` scopes. Use Keycloak's email verification flow or mark the known household member's email verified in the Keycloak user settings.

The first verified email match attaches the Keycloak subject to the existing local user ID. Existing profile settings, goals, and measurements stay attached. Subsequent logins resolve by subject, so an email change does not create another profile. A conflicting email or a subject already linked to another person is rejected. Local passwords are cleared when linking, and the person's app role follows the Keycloak role mappings above.

## Missing Users menu

The Users menu requires an ADMIN role in the sign-in session; the admin pages and APIs additionally verify the current database role. Assign the person's ADMIN client role under the client matching the app's `KEYCLOAK_ID` (production: `ptx-mass`). A role assigned only under a different client, such as `ptx-mass-man`, does not grant access to this app.

After changing Keycloak role mappings, sign out of Mezurilo and sign back in through SSO. The app updates its stored role and issues a new session at login. Check `/api/me` while signed in: `role` should be `ADMIN`. If it remains USER, verify that the issued Keycloak token includes the role for the configured client or a recognized realm role (`admin`, `administrator`, or `it_admin`). A manual database role change alone will be replaced by Keycloak claims at the next SSO login.
