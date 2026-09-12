# Production deployment

Mass Man on ptx-web02 lives in `/home/torvaldsl/mass-man`, speaks HTTP on `127.0.0.1:3004`, and is reverse-proxied by nginx. HAProxy at `10.10.13.1` terminates TLS for `mass.partridgecrossing.org`.

For local Docker Postgres and product behavior, see the [README](../README.md).

## Layout

| Piece | Where |
|---|---|
| Source | `git clone https://github.com/radawson/mass-man.git` |
| App dir | `/home/torvaldsl/mass-man` |
| Env | `/home/torvaldsl/mass-man/.env` (gitignored) |
| Process | PM2 app `mass-man` (`npm start`) |
| Node | nvm `v22.21.1` |
| Nginx | `/etc/nginx/sites-available/mass.conf` |
| Optional unit | `deploy/mass-man.service` (do not run beside PM2) |

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
pm2 start npm --name mass-man -- start
pm2 save
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
pm2 restart mass-man
```

Keep `.env` untracked. If you replace the directory, copy `.env` aside first.

## systemd instead of PM2

```bash
pm2 delete mass-man
pm2 save
sudo cp deploy/mass-man.service /etc/systemd/system/mass-man.service
sudo systemctl daemon-reload
sudo systemctl enable --now mass-man
```

Edit `WorkingDirectory`, `EnvironmentFile`, and `PATH` in the unit if the install path or Node version changes.

## Keycloak

Optional. Credentials work with `KEYCLOAK_*` unset. See [KEYCLOAK.md](KEYCLOAK.md).
