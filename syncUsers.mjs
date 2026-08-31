// Sync script: reads bot/users.json and merges with frontend activity data
// Run: node syncUsers.mjs

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const botUsersFile = path.join(__dirname, 'bot', 'users.json')
const destFile = path.join(__dirname, 'client', 'src', 'botUsers.json')

if (!fs.existsSync(botUsersFile)) {
  console.log('bot/users.json not found. Start the bot first.')
  process.exit(0)
}

const botUsers = JSON.parse(fs.readFileSync(botUsersFile, 'utf-8'))

// Read existing frontend data to preserve activity
let existingData = []
try { existingData = JSON.parse(fs.readFileSync(destFile, 'utf-8')) } catch {}

// Merge: bot users are primary, preserve activity fields from existing data
const merged = botUsers.map(botUser => {
  const existing = existingData.find(e => e.id === botUser.id)
  return {
    ...botUser,
    // Preserve activity data if exists
    opened_miniapp: existing?.opened_miniapp || botUser.opened_miniapp || false,
    accepted_terms: existing?.accepted_terms || botUser.accepted_terms || false,
    browsed_menu: existing?.browsed_menu || botUser.browsed_menu || false,
    time_in_app_seconds: existing?.time_in_app_seconds || botUser.time_in_app_seconds || 0,
  }
})

fs.writeFileSync(destFile, JSON.stringify(merged, null, 2))
console.log(`Synced ${merged.length} users to client/src/botUsers.json`)
