// Full sync + deploy script
// Run: node deploy.mjs

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const botUsersFile = path.join(__dirname, 'bot', 'users.json')
const destFile = path.join(__dirname, 'client', 'src', 'botUsers.json')
const clientDir = path.join(__dirname, 'client')

// Step 1: Sync users
if (!fs.existsSync(botUsersFile)) {
  console.log('No bot/users.json found. Bot may not be running or no users yet.')
  console.log('Creating empty file...')
  fs.writeFileSync(botUsersFile, '[]')
}

const botUsers = JSON.parse(fs.readFileSync(botUsersFile, 'utf-8'))
let existingData = []
try { existingData = JSON.parse(fs.readFileSync(destFile, 'utf-8')) } catch {}

const merged = botUsers.map(botUser => {
  const existing = existingData.find(e => e.id === botUser.id)
  return {
    ...botUser,
    opened_miniapp: existing?.opened_miniapp || botUser.opened_miniapp || false,
    accepted_terms: existing?.accepted_terms || botUser.accepted_terms || false,
    browsed_menu: existing?.browsed_menu || botUser.browsed_menu || false,
    time_in_app_seconds: existing?.time_in_app_seconds || botUser.time_in_app_seconds || 0,
  }
})

fs.writeFileSync(destFile, JSON.stringify(merged, null, 2))
console.log(`[1/3] Synced ${merged.length} users`)

// Step 2: Git commit
try {
  execSync('git add -A', { cwd: clientDir, stdio: 'pipe' })
  execSync(`git commit -m "sync: update users data (${merged.length} users)"`, { cwd: clientDir, stdio: 'pipe' })
  console.log('[2/3] Committed')
} catch (e) {
  console.log('[2/3] No changes to commit')
}

// Step 3: Git push
try {
  execSync('git push', { cwd: clientDir, stdio: 'pipe' })
  console.log('[3/3] Pushed to GitHub')
  console.log('Vercel will auto-redeploy in ~1 minute.')
} catch (e) {
  console.log('[3/3] Push failed:', e.message)
}
