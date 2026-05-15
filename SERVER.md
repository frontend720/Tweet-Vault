# Tweet Vault — Server Troubleshooting

## Architecture

- **Frontend + API**: Express server on `apple-server` (MacBook Pro), port 4500
- **Database**: SQLite at `/Volumes/Home/Tweet-Vault/server/data/vault.sqlite`
- **Access URL**: `http://apple-server.tail8168ce.ts.net:4500`
- **Process manager**: PM2 (auto-restarts on crash, survives reboots)

---

## SSH into the server

```bash
ssh jahanthony@apple-server.tail8168ce.ts.net
```

---

## Common issues

### App returns 500 errors / won't load

Check if the node process is actually running:

```bash
pm2 status
```

If `tweet-vault` shows `errored` or `stopped`, restart it:

```bash
pm2 restart tweet-vault
pm2 logs tweet-vault --lines 20
```

### Vite dev server (Mac) can't reach the API

The Vite proxy in `vite.config.js` should point to:

```
http://apple-server.tail8168ce.ts.net:4500
```

Not the HTTPS address. If it was changed back, fix it and restart `npm run dev`.

### DB shows all zeros on startup

The `.env` in `server/` is missing or `DATA_DIR` is wrong. Check:

```bash
cat /Volumes/Home/Tweet-Vault/server/.env
```

Should contain at minimum:

```
VENICE_API_KEY=...
GOOGLE_APPLICATION_CREDENTIALS=/Volumes/Home/serviceAccountKey.json
FIREBASE_DATABASE_URL=https://bate-mates-default-rtdb.firebaseio.com
```

The root `.env` (for frontend build) must also include:

```
VITE_FUNCTION_URL=http://apple-server.tail8168ce.ts.net:4500
VITE_TWITTER_API_KEY=...
```

### Firebase auth/invalid-api-key

The frontend was built without the root `.env`. Make sure `/Volumes/Home/Tweet-Vault/.env` exists with all `VITE_FIREBASE_*` vars, then rebuild:

```bash
cd /Volumes/Home/Tweet-Vault && npm run build && pm2 restart tweet-vault
```

### dist/index.html not found

The `dist/` folder needs to be built on the server — it's gitignored and won't come from `git pull`:

```bash
cd /Volumes/Home/Tweet-Vault && npm run build
```

---

## Deploying updates

```bash
ssh jahanthony@apple-server.tail8168ce.ts.net
cd /Volumes/Home/Tweet-Vault
git pull origin main
npm run build           # only needed if frontend changed
cd server && npm install  # only needed if server deps changed
pm2 restart tweet-vault
pm2 logs tweet-vault --lines 10
```

---

## Migrating data from Firebase → SQLite

Only needed once (or to re-sync). Requires both `.env` files to be present.

```bash
cd /Volumes/Home/Tweet-Vault/server
node migrate.js
```

---

## Verify DB record counts

```bash
pm2 logs tweet-vault --lines 5
```

Look for the startup line:

```
DB: { bookmarks: 6532, photos: 984, personas: 40, chats: 15 }
```

---

## PM2 reference

| Command | What it does |
|---|---|
| `pm2 status` | Show all processes |
| `pm2 restart tweet-vault` | Restart the server |
| `pm2 logs tweet-vault --lines 20` | Tail recent logs |
| `pm2 save` | Persist process list across reboots |
| `pm2 startup` | Re-register auto-start after Node upgrade |
