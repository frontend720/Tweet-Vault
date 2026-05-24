# Tweet-Vault / Vault Auth — Troubleshooting Guide

## Architecture Quick Reference

| Service | Port | PM2 Name | Files |
|---------|------|----------|-------|
| Tweet-Vault server | 4500 | `tweet-vault` | `/Volumes/Home/Tweet-Vault/server/` |
| Vault auth server | 4501 | `vault-auth` | `/Volumes/Home/jah-cloud/server/` |
| Vault auth (legacy name) | 4501 | `jah-cloud-auth` | same as above |
| Vault viewer | — | `vault-viewer` | `/Volumes/Home/` |

**Key rule:** All `pm2` and `sqlite3` commands must run directly on apple-server, never from the MacBook via the SMB mount at `/Volumes/Home/`.

---

## PM2

### `pm2 restart` doesn't pick up .env changes

Symptom: server restarts (uptime resets) but env vars from `.env` are still stale.

```bash
pm2 restart <name> --update-env
```

If that still doesn't work (uptime stays suspiciously high after restart):

```bash
lsof -ti:4501 | xargs kill -9   # or :4500 for tweet-vault
cd /Volumes/Home/jah-cloud/server && pm2 start index.js --name vault-auth
```

### Duplicate processes after `pm2 start -f`

Using `-f` (force) on an already-running process creates a second instance. Both compete for the same port — one will fail silently.

```
│ 0  │ tweet-vault  │ fork │ 44 │ online  │ 72.0mb  │  ← old, holding port
│ 6  │ tweet-vault  │ fork │  0 │ online  │ 792.0kb │  ← new, can't bind
```

Fix: delete the old one, restart the new one.

```bash
pm2 delete 0       # remove old by id
pm2 restart 6      # new one can now bind the port
pm2 save
```

### Checking which file a process is actually running

```bash
pm2 show <name> | grep "script path"
```

---

## Vault Auth Server (port 4501)

### `secretOrPrivateKey must have a value`

The server started without `JWT_ACCESS_SECRET` in its environment. The `.env` file exists but wasn't loaded (process started before the var was added, or `pm2 restart` didn't reload env).

```bash
# Verify the var is in .env
grep JWT_ACCESS_SECRET /Volumes/Home/jah-cloud/server/.env

# Restart and force env reload
pm2 restart vault-auth --update-env

# If that doesn't work, kill and restart fresh
lsof -ti:4501 | xargs kill -9
cd /Volumes/Home/jah-cloud/server && pm2 start index.js --name vault-auth
```

To generate a new secret if needed:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

The same secret must be in **both** `/Volumes/Home/jah-cloud/server/.env` and `/Volumes/Home/Tweet-Vault/server/.env`.

### `[auth] TLS certs not found — running plain HTTP`

TLS cert paths in `.env` are relative. The server resolves them from its working directory, which may not be what you expect. Use absolute paths:

```
TLS_CERT=/Volumes/Home/jah-cloud/server/apple-server.tail8168ce.ts.net.crt
TLS_KEY=/Volumes/Home/jah-cloud/server/apple-server.tail8168ce.ts.net.key
```

### CORS errors on all requests

Two root causes seen in practice:

1. **`CLIENT_URL` not set in `.env`** — old config used exact-origin matching. If the env var is missing, the origin check throws, error handler runs without CORS headers, browser sees a blocked response. Current config uses `origin: true` (reflects all origins) which avoids this. If you ever revert to strict origin checking, make sure `CLIENT_URL=https://apple-server.tail8168ce.ts.net:4500` is in the Vault server `.env`.

2. **Error handler missing CORS headers** — if any middleware throws before the CORS headers are set, the error response won't have them. The `errorHandler.js` manually sets `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials` for this reason.

---

## Tweet-Vault Server (port 4500)

### `"Invalid or expired token"` on all API requests

Despite the name, this usually means the JWT secret is **undefined**, not that the token is actually invalid. The server was started before `JWT_ACCESS_SECRET` was added to `.env`.

Verify with a direct curl test:
```bash
TOKEN=$(curl -sk -X POST "https://apple-server.tail8168ce.ts.net:4501/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "carter@gmail.com", "password": "Premio12!!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['accessToken'])")

curl -sk "https://apple-server.tail8168ce.ts.net:4500/api/bookmarks?limit=1" \
  -H "Authorization: Bearer $TOKEN"
```

If it still returns `"Invalid or expired token"`, the process doesn't have the secret:
```bash
lsof -ti:4500 | xargs kill -9
cd /Volumes/Home/Tweet-Vault/server && pm2 start index.js --name tweet-vault
```

---

## SQLite

### Can't open vault.sqlite via SMB

WAL-mode SQLite requires file locking that SMB doesn't support. Opening `/Volumes/Home/data/vault.sqlite` from the MacBook will fail with exit code 14.

Always run `sqlite3` commands directly on apple-server:
```bash
sqlite3 /Volumes/Home/data/vault.sqlite "SELECT DISTINCT user_id FROM bookmarks LIMIT 5"
sqlite3 /Volumes/Home/jah-cloud/server/data/auth.db "SELECT id, email FROM users"
```

---

## `better-sqlite3` / Native Module Errors

### Architecture mismatch (`arch=x64` on arm64)

Running `npm install` from the MacBook (arm64) into a path on the SMB volume builds x64 binaries. apple-server is arm64 — those binaries won't load.

**Never `npm install` for server packages from the MacBook.** SSH into apple-server and run it there:
```bash
cd /Volumes/Home/jah-cloud/server && npm install
```

### `C++20 or later required` build error

This happens when building `better-sqlite3` against a very new Node.js version (v24+) with an old Xcode Command Line Tools. Either:
- Downgrade Node to LTS (v20 or v22) via nvm
- Or copy pre-built `node_modules` from a working environment via rsync (excluding `better-sqlite3` and rebuilding it in place on the target machine)

---

## Auth Account Management

### User account seeding (preserving Firebase UID)

All data in `vault.sqlite` is keyed to the Firebase UID. If you create a Vault account through the normal signup flow, it gets a random UUID — your bookmarks/personas won't load.

Always seed via the admin API with the explicit `id` field:

```bash
curl -k -X POST "https://apple-server.tail8168ce.ts.net:4501/admin/users" \
  -H "Content-Type: application/json" \
  -H "x-admin-token: $(grep ADMIN_TOKEN /Volumes/Home/jah-cloud/server/.env | cut -d= -f2)" \
  -d '{
    "id": "82cHRGjVFqMINh9aFHvITm7zuNt2",
    "email": "carter@gmail.com",
    "password": "YourPassword1",
    "isVerified": true
  }'
```

To find the correct Firebase UID (run on apple-server):
```bash
sqlite3 /Volumes/Home/data/vault.sqlite "SELECT DISTINCT user_id FROM bookmarks LIMIT 1"
```

### Inspecting and managing accounts

```bash
ADMIN_TOKEN="$(grep ADMIN_TOKEN /Volumes/Home/jah-cloud/server/.env | cut -d= -f2)"

# List all users
curl -sk "https://apple-server.tail8168ce.ts.net:4501/admin/users" \
  -H "x-admin-token: $ADMIN_TOKEN"

# Delete a user by ID
curl -sk -X DELETE "https://apple-server.tail8168ce.ts.net:4501/admin/users/<ID>" \
  -H "x-admin-token: $ADMIN_TOKEN"

# View recent auth events
curl -sk "https://apple-server.tail8168ce.ts.net:4501/admin/audit?limit=20" \
  -H "x-admin-token: $ADMIN_TOKEN"
```

### Audit log shows `user_id: null` on failed login

This means the server couldn't find the email at all — not that the password was wrong. The browser may be autofilling a stale email from saved credentials. Check what email is actually being submitted vs. what exists in auth.db.

### `/auth/refresh 401` on every page load

Expected behavior on first load when there's no session cookie. It becomes a problem if it also fires right after signing in.

Most common cause: the browser has a **stale refresh cookie** from a deleted/replaced account. The server sees it's revoked, revokes all sessions for that user, and clears the cookie. Signing in again creates a fresh session.

Fix: clear cookies for `apple-server.tail8168ce.ts.net` in DevTools → Application → Cookies, then sign in fresh.

---

## rsync / File Sync

### `link_stat ... No such file or directory`

The Vault source files are at `/Volumes/Home/jah-cloud/server/` (on the SMB volume), not at `~/jahs-projects/Vault/server/` or `~/jah-cloud/server/`.

Correct rsync from MacBook to apple-server (if needed):
```bash
# This syncs FROM the SMB mount TO apple-server's local disk — not typically needed
# since /Volumes/Home IS apple-server's disk

# If syncing local dev changes to the server:
rsync -av --exclude node_modules \
  /Users/jahanthony/jahs-projects/Vault/packages/ \
  /Volumes/Home/jah-cloud/packages/
```

Remember: `/Volumes/Home` on the MacBook = apple-server's external volume. Editing files there edits them in place on the server.
