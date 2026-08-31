import TelegramBot from 'node-telegram-bot-api'
import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const USERS_FILE = path.join(dataDir, 'users.json')
const LISTINGS_FILE = path.join(dataDir, 'listings.json')
const ORDERS_FILE = path.join(dataDir, 'orders.json')
const ACCOUNTS_FILE = path.join(dataDir, 'accounts.json')

const TOKEN = process.env.BOT_TOKEN || '8860618629:AAFvQJ39Vz9mLsC6VxRbz8INWJ1k8AU-mSQ'
const ADMIN_ID = process.env.ADMIN_ID || '864525792'
const PORT = process.env.PORT || 3001
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`

function load(file) { try { return JSON.parse(fs.readFileSync(file, 'utf-8')) } catch { return [] } }
function save(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)) }

// ── Telegram Bot ──

const bot = new TelegramBot(TOKEN, { polling: true })

bot.setChatMenuButton({
  menu_button: { type: 'web_app', text: 'Открыть магазин', web_app: { url: BASE_URL } }
}).then(() => console.log('Menu button set')).catch(console.error)

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id
  const user = msg.from
  const users = load(USERS_FILE)
  const existing = users.find(u => u.id === String(user.id))
  if (existing) {
    existing.last_seen = new Date().toISOString()
    existing.start_count = (existing.start_count || 0) + 1
  } else {
    users.push({
      id: String(user.id), first_name: user.first_name || '', last_name: user.last_name || '',
      username: user.username || '', photo_url: user.photo_url || '',
      registered_at: new Date().toISOString(), last_seen: new Date().toISOString(),
      start_count: 1, opened_miniapp: false, accepted_terms: false,
      browsed_menu: false, time_in_app_seconds: 0, level: 1,
    })
  }
  save(USERS_FILE, users)
  bot.sendMessage(chatId, '🎮 Добро пожаловать в GameRent!\n\nАрендуй аккаунты в любимых играх:', {
    reply_markup: { inline_keyboard: [[{ text: '🎮 Открыть магазин', web_app: { url: BASE_URL } }]] }
  })
})

console.log('Bot started')

// ── Express API ──

const app = express()
app.use(cors())
app.use(express.json())

// Serve frontend
const distDir = path.join(__dirname, '..', 'client', 'dist')
if (fs.existsSync(distDir)) app.use(express.static(distDir))

// Users
app.get('/api/users', (req, res) => res.json(load(USERS_FILE)))

// Listings
app.get('/api/listings', (req, res) => {
  let listings = load(LISTINGS_FILE)
  if (req.query.user_id) listings = listings.filter(l => l.user_id === req.query.user_id)
  if (req.query.status) listings = listings.filter(l => l.status === req.query.status)
  res.json(listings)
})

app.get('/api/listings/:id', (req, res) => {
  const listing = load(LISTINGS_FILE).find(l => l.id === Number(req.params.id))
  listing ? res.json(listing) : res.status(404).json({ error: 'Not found' })
})

app.post('/api/listings', (req, res) => {
  const d = req.body
  if (!d.user_id || !d.game_id || !d.title || !d.login || !d.password || !d.price_per_day) {
    return res.status(400).json({ error: 'Missing fields' })
  }
  const listings = load(LISTINGS_FILE)
  const listing = {
    id: listings.length ? Math.max(...listings.map(l => l.id)) + 1 : 1,
    user_id: String(d.user_id), username: d.username || '', game_id: d.game_id,
    game_name: d.game_name || '', title: d.title, description: d.description || '',
    extra_info: d.extra_info || '', price_per_day: Number(d.price_per_day), rank: d.rank || '',
    credentials: { login: d.login, password: d.password },
    status: 'pending', rejection_reason: '', admin_comment: '',
    created_at: new Date().toISOString(), reviewed_at: '', reviewed_by: '',
  }
  listings.push(listing)
  save(LISTINGS_FILE, listings)

  bot.sendMessage(ADMIN_ID,
    `🔔 НОВАЯ ЗАЯВКА НА МОДЕРАЦИЮ\n\n🎮 Игра: ${d.game_name}\n👤 @${d.username || '—'}\n🆔 ${d.user_id}\n\n💼 ${d.title}\n💰 ${d.price_per_day}₽/день\n\n🕐 ${new Date().toLocaleString('ru-RU')}`
  ).catch(() => {})

  res.status(201).json(listing)
})

app.post('/api/listings/:id/approve', (req, res) => {
  const listings = load(LISTINGS_FILE)
  const l = listings.find(x => x.id === Number(req.params.id))
  if (!l) return res.status(404).json({ error: 'Not found' })
  l.status = 'approved'; l.reviewed_at = new Date().toISOString()
  save(LISTINGS_FILE, listings)

  // Add account to catalog
  const accounts = load(ACCOUNTS_FILE)
  accounts.push({
    id: accounts.length ? Math.max(...accounts.map(a => a.id)) + 1 : 1,
    game_id: l.game_id, title: l.title, description: l.description,
    price_per_day: l.price_per_day, rank: l.rank, status: 'available',
    owner_id: l.user_id, owner_type: 'user',
  })
  save(ACCOUNTS_FILE, accounts)

  bot.sendMessage(l.user_id, `✅ Аккаунт одобрен!\n\n🎮 ${l.game_name}\n💼 ${l.title}\n\nТеперь он доступен в каталоге.`).catch(() => {})
  res.json(l)
})

app.post('/api/listings/:id/reject', (req, res) => {
  const { reason, comment } = req.body
  const listings = load(LISTINGS_FILE)
  const l = listings.find(x => x.id === Number(req.params.id))
  if (!l) return res.status(404).json({ error: 'Not found' })
  l.status = 'rejected'; l.rejection_reason = reason || ''; l.admin_comment = comment || ''
  l.reviewed_at = new Date().toISOString()
  save(LISTINGS_FILE, listings)
  bot.sendMessage(l.user_id, `❌ Заявка отклонена\n\n🎮 ${l.game_name}\n💼 ${l.title}\n\nПричина: ${reason || 'Не указана'}${comment ? `\nКомментарий: ${comment}` : ''}`).catch(() => {})
  res.json(l)
})

app.post('/api/listings/:id/suspend', (req, res) => {
  const listings = load(LISTINGS_FILE)
  const l = listings.find(x => x.id === Number(req.params.id))
  if (!l) return res.status(404).json({ error: 'Not found' })
  l.status = 'suspended'; l.admin_comment = req.body.reason || ''
  l.reviewed_at = new Date().toISOString()
  save(LISTINGS_FILE, listings)
  bot.sendMessage(l.user_id, `⚠️ Аккаунт приостановлен\n\n🎮 ${l.game_name}\n💼 ${l.title}\n\nПричина: ${req.body.reason || 'Не указана'}`).catch(() => {})
  res.json(l)
})

// Orders
app.get('/api/orders', (req, res) => res.json(load(ORDERS_FILE)))
app.post('/api/orders', (req, res) => {
  const orders = load(ORDERS_FILE)
  const order = { id: orders.length ? Math.max(...orders.map(o => o.id)) + 1 : 1, ...req.body, status: 'active', created_at: new Date().toISOString() }
  orders.push(order); save(ORDERS_FILE, orders)
  res.status(201).json(order)
})

// Accounts (catalog)
app.get('/api/accounts', (req, res) => {
  let accounts = load(ACCOUNTS_FILE)
  if (req.query.game_id) accounts = accounts.filter(a => a.game_id === Number(req.query.game_id))
  res.json(accounts)
})

app.post('/api/accounts', (req, res) => {
  const accounts = load(ACCOUNTS_FILE)
  const account = {
    id: accounts.length ? Math.max(...accounts.map(a => a.id)) + 1 : 1,
    ...req.body, status: req.body.status || 'available',
  }
  accounts.push(account)
  save(ACCOUNTS_FILE, accounts)
  res.status(201).json(account)
})

// Activity
app.post('/api/activity', (req, res) => {
  const { user_id, field } = req.body
  if (user_id && field) {
    const users = load(USERS_FILE)
    const u = users.find(x => x.id === String(user_id))
    if (u) { u[field] = true; u.last_seen = new Date().toISOString(); save(USERS_FILE, users) }
  }
  res.json({ ok: true })
})

app.post('/api/activity/time', (req, res) => {
  const { user_id, seconds } = req.body
  if (user_id) {
    const users = load(USERS_FILE)
    const u = users.find(x => x.id === String(user_id))
    if (u) { u.time_in_app_seconds = (u.time_in_app_seconds || 0) + (seconds || 0); u.last_seen = new Date().toISOString(); save(USERS_FILE, users) }
  }
  res.json({ ok: true })
})

app.post('/api/terms/accept', (req, res) => {
  const { user_id } = req.body
  if (user_id) {
    const users = load(USERS_FILE)
    const u = users.find(x => x.id === String(user_id))
    if (u) { u.accepted_terms = true; u.last_seen = new Date().toISOString(); save(USERS_FILE, users) }
  }
  res.json({ ok: true })
})

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' })
  const idx = path.join(distDir, 'index.html')
  fs.existsSync(idx) ? res.sendFile(idx) : res.status(404).send('Not built')
})

app.listen(PORT, () => console.log(`Server on port ${PORT}`))
