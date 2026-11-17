# Production deployment

Mezurilo on ptx-web02 lives in `/home/torvaldsl/mass-man`, speaks HTTP on `127.0.0.1:3004`, and is reverse-proxied by nginx. HAProxy at `10.10.13.1` terminates TLS for `mass.partridgecrossing.org`.

For local Docker Postgres and product behavior, see the [README](../README.md).

## Layout

| Piece | Where |
|---|---|
| Source | `git clone https://github.com/radawson/mass-man.git` |
| App dir | `/home/torvaldsl/mass-man` |
| Env | `/home/torvaldsl/mass-man/.env` (gitignored) |
| Process | systemd `mass-man.service` |
| Node | Newest installed nvm version (unit); examples below use `v22.21.1` |
| Nginx | `/etc/nginx/sites-available/mass.conf` |
| Unit | `deploy/mass-man.service` → `/etc/systemd/system/mass-man.service` |

## Database

Prefer a dedicated database named `massman` (schema `public`). `DATABASE_URL` should look like:

```env
DATABASE_URL="postgresql://massman:PASS@10.10.13.50:5433/massman?schema=public"
```

Do not `SET search_path` in migrations; that hides `public._prisma_migrations` and `prisma migrate deploy` fails with P1014.

If you must share a cluster, use a schema on an existing database (`?schema=massman`) and keep Prisma’s migrations table in that same schema.

Remote hosts enable SSL unless `DATABASE_SSL=false`.

## First install

```bash
export PATH="$HOME/.nvm/versions/node/v22.21.1/bin:$PATH"
git clone https://github.com/radawson/mass-man.git ~/mass-man
cd ~/mass-man
# write .env (NEXTAUTH_URL, secret, DATABASE_URL, PORT=3004)
# deploy/write-prod-env.py can scaffold it; review before using
npm ci
npx prisma migrate deploy
# optional: npm run db:seed   then change the seed password
npm run build
sudo install -m 644 deploy/mass-man.service /etc/systemd/system/mass-man.service
sudo systemctl daemon-reload
sudo systemctl enable --now mass-man.service
```

Confirm the app before nginx:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3004/login
```

## Nginx

`deploy/nginx.conf` must **not** set `real_ip_header` / `set_real_ip_from`; those are already in `/etc/nginx/nginx.conf`. Duplicating them fails `nginx -t`.

```bash
sudo /home/torvaldsl/mass-man/deploy/install-nginx.sh
```

Logs: `/var/log/nginx/massman_access.log`, `/var/log/nginx/massman_error.log`.

## HAProxy and DNS

On the edge box (`10.10.13.1`), add `mass.partridgecrossing.org` the same way as `finance.partridgecrossing.org`: HTTPS frontend, backend to ptx-web02 port 80, `Host` preserved. Point DNS at that VIP.

## Updates

```bash
export PATH="$HOME/.nvm/versions/node/v22.21.1/bin:$PATH"
cd ~/mass-man
git pull
npm ci
npx prisma migrate deploy
npm run build
sudo systemctl restart mass-man.service
systemctl is-active mass-man.service
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3004/login
```

Keep `.env` untracked. If you replace the directory, copy `.env` aside first.

## Service management

```bash
systemctl status mass-man.service --no-pager
systemctl is-enabled mass-man.service
journalctl -u mass-man.service -n 100 --no-pager
sudo systemctl restart mass-man.service
```

The unit loads `.env` on every start and runs Next directly on `127.0.0.1:3004` as `torvaldsl`. After changing the installed unit, run `sudo systemctl daemon-reload` and restart the service. After changing only `.env`, restart the service.

## Migrate an older PM2 installation

Only for a host still running the app under PM2: after building the app, remove its PM2 entry before enabling systemd so both managers do not compete for port 3004. Leave other PM2 apps alone.

```bash
pm2 delete mass-man
pm2 save
sudo install -m 644 deploy/mass-man.service /etc/systemd/system/mass-man.service
sudo systemctl daemon-reload
sudo systemctl enable --now mass-man.service
```

Edit `WorkingDirectory`, `EnvironmentFile`, and the nvm path in `ExecStart` if the install location or service user changes. Node version upgrades within the existing nvm directory are picked up on service restart.

## Keycloak

Optional. Credentials work with `KEYCLOAK_*` unset. See [KEYCLOAK.md](KEYCLOAK.md).

## Admin-user / SSO-link migration

Before applying `20261117170000_admin_users_sso_link`, check for existing case-variant duplicate emails in the app's database/schema:

```sql
SELECT LOWER(email), COUNT(*)
FROM users
GROUP BY LOWER(email)
HAVING COUNT(*) > 1;
```

If this returns rows, resolve those duplicates explicitly before deployment; do not discard either person's measurements. The migration preserves all existing user IDs and adds a unique Keycloak subject plus case-insensitive email uniqueness. Apply migrations before starting the updated app. No Keycloak accounts or users are created by deployment.
