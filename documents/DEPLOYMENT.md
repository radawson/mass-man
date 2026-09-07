# Mass Man

Body-mass and composition tracker. Each signed-in user has isolated measurements, goals, and settings.

## Stack

Next.js 16, Prisma 7, PostgreSQL, Tailwind v4, NextAuth (credentials + optional Keycloak).

## Local development

```bash
cp example.env .env
docker compose up -d
npm install
npx prisma migrate dev --name init
npm run db:seed   # optional default admin
npm run dev       # http://localhost:3004
```

Default seed admin (change after first login):

- Email: `admin@massman.local`
- Password: `ChangeMe123!`

Docker Postgres uses host port **5433** so it can run beside Kontado on 5432.

## Tests

```bash
npm test
```

## Production (systemd)

1. Copy the app to `/opt/mass-man` (or your chosen path).
2. Set production values in `.env` (`DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, Keycloak if used).
3. `npm ci && npm run build && npx prisma migrate deploy`
4. Install the unit:

```bash
sudo cp deploy/mass-man.service /etc/systemd/system/mass-man.service
# edit WorkingDirectory / EnvironmentFile if needed
sudo systemctl daemon-reload
sudo systemctl enable --now mass-man
```

5. Reverse-proxy with nginx using `deploy/nginx.conf`.

The app listens on `127.0.0.1:3004` (`PORT` in `.env`). There is no PM2 or Socket.IO.

See [documents/KEYCLOAK.md](documents/KEYCLOAK.md) for SSO.
