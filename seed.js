// One-time seed: creates your account in Vault's auth.db using your Firebase UID.
// Runs on MacBook — calls the Vault admin API remotely, no native deps needed.
//
// Usage:
//   node seed.js --uid YOUR_FIREBASE_UID --email you@example.com --password yourpassword
//
// Get your Firebase UID by running this on apple-server:
//   sqlite3 ~/data/vault.sqlite "SELECT DISTINCT user_id FROM bookmarks LIMIT 1"
//
// VAULT_URL defaults to https://apple-server.tail8168ce.ts.net:4501
// ADMIN_TOKEN is read from VAULT_ADMIN_TOKEN env var or --token arg

const https = require('https')

const args = process.argv.slice(2)
function getArg(name) {
  const i = args.indexOf(`--${name}`)
  return i !== -1 ? args[i + 1] : null
}

const uid      = getArg('uid')
const email    = getArg('email')
const password = getArg('password')
const token    = getArg('token') || process.env.VAULT_ADMIN_TOKEN
const vaultUrl = getArg('url')  || process.env.VAULT_URL || 'https://apple-server.tail8168ce.ts.net:4501'

if (!uid || !email || !password || !token) {
  console.error(`
Usage: node seed.js --uid FIREBASE_UID --email you@example.com --password yourpassword --token ADMIN_TOKEN

  --uid      Your Firebase UID (from vault.sqlite)
  --email    Your email address
  --password Password to set for the new account
  --token    Vault ADMIN_TOKEN (from /Users/jahanthony/jah-cloud/server/.env)
  --url      Vault base URL (default: https://apple-server.tail8168ce.ts.net:4501)
`)
  process.exit(1)
}

const body = JSON.stringify({ id: uid, email, password, isVerified: true })
const url  = new URL('/admin/users', vaultUrl)

const options = {
  hostname: url.hostname,
  port: url.port || 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'x-admin-token': token,
  },
  // Trust self-signed / local certs for the Tailscale hostname
  rejectUnauthorized: false,
}

const req = https.request(options, (res) => {
  let data = ''
  res.on('data', chunk => { data += chunk })
  res.on('end', () => {
    try {
      const json = JSON.parse(data)
      if (res.statusCode === 201) {
        console.log(`✓ Account created.`)
        console.log(`  id:    ${json.id}`)
        console.log(`  email: ${json.email}`)
        console.log(`\nYou can now sign in at the app with these credentials.`)
      } else {
        console.error(`✗ Failed (${res.statusCode}):`, json.error || data)
        process.exit(1)
      }
    } catch {
      console.error(`✗ Unexpected response (${res.statusCode}):`, data)
      process.exit(1)
    }
  })
})

req.on('error', (err) => {
  console.error('✗ Request failed:', err.message)
  if (err.code === 'ECONNREFUSED') {
    console.error('  Is the Vault server running? Start it on apple-server: pm2 start index.js --name vault-auth')
  }
  process.exit(1)
})

req.write(body)
req.end()
