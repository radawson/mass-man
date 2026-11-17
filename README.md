# Mezurilo

Personal body-mass and composition tracker. Log weight, optional scale body-fat %, and tape measurements; the dashboard averages same-day readings, estimates body fat when you want it, and tracks goals.

Regular users see only their own data. Administrators can create users and manage their profiles and measurements through **Users**. Measurements are stored as **kg** and **cm**; the UI can show **lb / in** or **kg / cm**.

Live site: `https://mass.partridgecrossing.org` (nginx on ptx-web02, HAProxy in front).

## Features

- Email/password accounts, optional Keycloak SSO
- Admin user creation, profile editing, and measurement entry for other household members
- Verified Keycloak email matching preserves an existing local profile and measurement history
- Measurement log with selectable date/time: weight, device body-fat %, neck through calves, notes
- Same-calendar-day readings (in the user’s timezone) collapsed to an arithmetic mean for charts and goals
- Body-fat source: **device**, **US Navy estimate**, or **auto** (device if present, otherwise Navy)
- Dashboard: KPI tiles, weight/waist trend, start-vs-current comparison, BMI and lean mass
- Goals on weight, body fat, waist, chest, hips, upper arm, or thigh, with 25 / 50 / 75 / 100% milestones
- Light, dark, and system themes (navy Material accent)
- Per-user units, timezone, height, and sex (sex + height required for the Navy estimate)

## Tech stack

- **App**: Next.js 16 (App Router), React 19, TypeScript 6.0.3
- **UI**: Tailwind CSS 4, Lucide, React Hot Toast
- **Database**: PostgreSQL, Prisma 7 (`@prisma/adapter-pg`)
- **Auth**: NextAuth 4 (credentials; Keycloak OIDC if env vars are set)
- **Numbers**: `decimal.js` for weights, lengths, and percents (no binary floats)
- **Dates**: `date-fns` + `@date-fns/tz`

There is no Socket.IO. The production process is a plain `next start` on `127.0.0.1:3004`.

## Prerequisites

- Node.js 20.19+, 22.12+, or 24+ (Prisma 7 / Next 16)
- npm 10+
- PostgreSQL 14+ (Docker Compose is enough for local)
- Keycloak (optional, SSO only)

TypeScript and its override are pinned to **6.0.3**. `ts-jest` 29.4.15 supports TypeScript `>=4.3 <7`, and `typescript-eslint` 8 supports `<6.1`, so TypeScript 7 must wait for both tools to support it.

ESLint stays on **9** because `eslint-config-next` 16's `eslint-plugin-react` dependency excludes ESLint 10 from its peer range. Prisma's CLI, client, and PostgreSQL adapter stay together on stable **7.10.1**; the registry's `latest` Prisma 8 tag currently points to a release candidate. Recheck these constraints before the next major upgrade; avoid forcing incompatible peers or installing prereleases.

## Quick start

```bash
git clone https://github.com/radawson/mass-man.git
cd mass-man
cp example.env .env
docker compose up -d
npm install
npx prisma migrate dev
npm run db:seed    # optional
npm run dev        # http://localhost:3004
```

`example.env` points Docker Postgres at host port **5433** so it can sit beside Kontado on 5432.

Seed admin (change after first login):

- Email: `admin@massman.local`
- Password: `ChangeMe123!`

Or register at `/register`. Then open **Settings**: set units, timezone, height, and sex before you expect Navy body-fat numbers.

## How tracking works

**Canonical storage** is always kg / cm. Display conversion happens at the edges.

**Daily averages** group rows by calendar date in `User.timeZone`. Multiple logs on that day become one chart/KPI point (mean of the values that were present).

**Body fat**

| Setting | What the dashboard uses |
|---|---|
| `DEVICE` | Scale / device `%` only |
| `ESTIMATED` | US Navy circumference formula (male: height, neck, waist; female: those plus hips) |
| `AUTO` (default) | Device `%` if logged, otherwise Navy |

Navy needs **Settings → sex and height**, plus neck and waist on the measurement (hips for female).

**Goals** are one per metric per user. Progress is from start value to target (decrease, increase, or maintain within 2%). Overall dashboard progress is the mean of those percents.

## Production (ptx-web02)

App directory: `/home/torvaldsl/mass-man`. Process manager: **systemd** (`mass-man.service`). Nginx vhost: `mass.conf` → `127.0.0.1:3004`. TLS and hostname routing belong on HAProxy (`10.10.13.1`).

### Clone or update

```bash
export PATH="$HOME/.nvm/versions/node/v22.21.1/bin:$PATH"

# first time
git clone https://github.com/radawson/mass-man.git ~/mass-man
cp ~/mass-man/example.env ~/mass-man/.env   # then edit; never commit

# later
cd ~/mass-man
git pull
npm ci
npx prisma migrate deploy
npm run build
sudo systemctl restart mass-man.service
```

Preserve `.env` across reclones. It is gitignored.

### Environment

Set at least:

```env
DATABASE_URL="postgresql://USER:PASS@HOST:5433/DBNAME?schema=massman"
NEXTAUTH_URL="https://mass.partridgecrossing.org"
NEXTAUTH_SECRET="openssl rand -base64 32"
PORT=3004
NEXT_PUBLIC_APP_URL="https://mass.partridgecrossing.org"
```

Use a dedicated database if the role has `CREATEDB`. Otherwise a **schema** on an existing database is fine: `?schema=massman`. Prisma sets `search_path` from that query param. Remote Postgres gets SSL unless `DATABASE_SSL=false`.

Leave `KEYCLOAK_*` unset for credentials-only. Client setup: [documents/KEYCLOAK.md](documents/KEYCLOAK.md).

### systemd

Install and enable the unit after the first production build:

```bash
cd ~/mass-man
sudo install -m 644 deploy/mass-man.service /etc/systemd/system/mass-man.service
sudo systemctl daemon-reload
sudo systemctl enable --now mass-man.service
systemctl status mass-man.service --no-pager
journalctl -u mass-man.service -n 100 --no-pager
```

The unit loads `.env`, runs as `torvaldsl`, and selects the newest installed nvm Node. See [Deployment](documents/DEPLOYMENT.md) for migration from an older PM2 setup.

### Nginx

`deploy/nginx.conf` is the vhost. **Do not** add `real_ip_*` here; they already live in `/etc/nginx/nginx.conf`.

```bash
sudo /home/torvaldsl/mass-man/deploy/install-nginx.sh
# or:
sudo install -m 644 /home/torvaldsl/mass-man/deploy/nginx.conf /etc/nginx/sites-available/mass.conf
sudo ln -sfn /etc/nginx/sites-available/mass.conf /etc/nginx/sites-enabled/mass.conf
sudo nginx -t && sudo systemctl reload nginx
```

HAProxy should treat `mass.partridgecrossing.org` the same way as `finance.partridgecrossing.org` (HTTPS in front, HTTP to ptx-web02:80).

More detail: [documents/DEPLOYMENT.md](documents/DEPLOYMENT.md).

## Project structure

```
mass-man/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── app/                 # pages + route handlers
│   ├── components/
│   └── lib/                 # units, Navy BF, averages, goals, Prisma, auth
├── deploy/
│   ├── nginx.conf
│   ├── install-nginx.sh
│   ├── mass-man.service
│   ├── create-db.py
│   └── write-prod-env.py
├── documents/
├── docker-compose.yml       # Postgres 18 on host port 5433
└── example.env
```

## Data model

- **User** — credentials or Keycloak, units, theme, timezone, height, sex, body-fat source
- **Measurement** — `recordedAt`, `weightKg`, optional device BF% and tape fields (cm)
- **Goal** — one row per `(userId, metric)`

Queries filter by the signed-in account by default. Profile and measurement APIs accept an explicit `userId` for administrators; the server checks the current database role before allowing access to another account. Prisma client is generated to `src/generated/prisma/` (gitignored).

## API

All measurement/goal/dashboard routes require a session.

| Method | Path | Purpose |
|---|---|---|
| `GET/POST` | `/api/measurements` | List / create |
| `GET/PATCH/DELETE` | `/api/measurements/[id]` | One log |
| `GET` | `/api/measurements/daily` | Daily averages |
| `GET` | `/api/dashboard` | KPIs, chart, comparison |
| `GET/POST` | `/api/goals` | List / create |
| `PATCH/DELETE` | `/api/goals/[id]` | Update / delete |
| `GET/PATCH` | `/api/me` | Profile and display prefs |
| `POST` | `/api/auth/register` | Local signup |
| `*` | `/api/auth/[...nextauth]` | NextAuth |

## Scripts

```bash
npm run dev          # Next dev server, port 3004
npm run build
npm start            # 127.0.0.1:${PORT:-3004}
npm test
npm run lint
npx prisma generate
npx prisma migrate dev
npx prisma migrate deploy
npm run db:seed
npx prisma studio
```

`postinstall` already runs `prisma generate`.

## Troubleshooting

**Prisma / Node** — Use Node 20.19+. After pulling schema changes: `npx prisma generate`.

**TypeScript 7** — If `npm test` fails inside `ts-jest`, check `node_modules/typescript/package.json`. Keep both the direct dependency and the `overrides` field pinned to 6.0.3 until the test and lint tools support TypeScript 7.

**Empty body fat** — Set sex and height in Settings; log neck and waist (and hips if female); or log a device %.

**502 / no public hostname** — App healthy locally: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3004/login`. Then check nginx (`/var/log/nginx/massman_error.log`) and HAProxy/DNS for `mass.partridgecrossing.org`.

**Wrong Postgres schema** — Production uses `?schema=massman`. Migrating against `public` on a shared database will collide with other apps.

**Node PATH** — Non-interactive SSH does not load nvm. Prefix build and migration commands with `PATH=$HOME/.nvm/versions/node/v22.21.1/bin:$PATH`. The systemd unit selects Node from the installed nvm versions itself.

## Documentation

- [Deployment](documents/DEPLOYMENT.md)
- [Keycloak](documents/KEYCLOAK.md)

## Managing household members

Sign in as an **ADMIN**, choose **Users**, and create a person with their name and actual email address. The optional password enables local login; leave it blank if you will enter measurements for them until they use SSO. New people always start with the USER role.

Open **Profile & measurements** to edit their profile, log blood pressure and heart rate (weight is optional), correct or delete readings, and print/download their blood-pressure report. The heading identifies whose data you are editing, and measurement values use that person's units. Measurement date/time entry uses your browser's local time; the history displays the person's time zone.

On the first Keycloak login with a **verified** matching email (case-insensitive, ignoring surrounding whitespace on input), the existing user ID, profile, measurements, and goals are preserved. A permanent Keycloak subject link handles later email changes. Linking removes the old local password and SSO becomes the login method; roles follow Keycloak claims on SSO login. Disabled accounts cannot sign in, and an identity already linked to a different Keycloak subject cannot be reassigned automatically.

Deploy this change with `npx prisma migrate deploy` before starting the new build. The migration adds `keycloakSubject` and a case-insensitive email uniqueness index. Existing case-variant duplicate emails must be resolved before applying it; the migration deliberately fails rather than guessing how to merge two existing histories. See [Keycloak setup](documents/KEYCLOAK.md) for email claims.
