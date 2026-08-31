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

app.get('/api/accounts/:id', (req, res) => {
  const account = load(ACCOUNTS_FILE).find(a => a.id === Number(req.params.id))
  account ? res.json(account) : res.status(404).json({ error: 'Not found' })
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

// User level update
app.post('/api/users/:id/level', (req, res) => {
  const { level } = req.body
  if (level === undefined) return res.status(400).json({ error: 'Missing level' })
  const users = load(USERS_FILE)
  const user = users.find(u => u.id === String(req.params.id))
  if (!user) return res.status(404).json({ error: 'User not found' })
  user.level = Number(level)
  save(USERS_FILE, users)
  res.json(user)
})

// Admin create order (grant rental)
app.post('/api/admin/orders', (req, res) => {
  const { user_id, account_id, hours } = req.body
  if (!user_id || !account_id || !hours) return res.status(400).json({ error: 'Missing fields' })

  const accounts = load(ACCOUNTS_FILE)
  const account = accounts.find(a => a.id === Number(account_id))
  if (!account) return res.status(404).json({ error: 'Account not found' })
  if (account.status === 'rented') return res.status(400).json({ error: 'Account already rented' })

  const pricePerHour = account.price_per_day / 24
  const totalPrice = Math.ceil(pricePerHour * hours)

  const orders = load(ORDERS_FILE)
  const order = {
    id: orders.length ? Math.max(...orders.map(o => o.id)) + 1 : 1,
    account_id: Number(account_id), game_id: account.game_id,
    game_name: '', game_slug: '', account_title: account.title,
    user_id: String(user_id), username: '', rental_days: Math.ceil(hours / 24),
    total_price: totalPrice, status: 'active',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + hours * 3600000).toISOString(),
    credentials: { login: `acc_${account.id}_login`, password: `pass_${account.id}_$ecure` },
  }
  orders.push(order)
  save(ORDERS_FILE, orders)

  // Mark account as rented
  account.status = 'rented'
  save(ACCOUNTS_FILE, accounts)

  res.status(201).json(order)
})

// User's listed accounts with rental info
app.get('/api/my-accounts/:userId', (req, res) => {
  const userId = String(req.params.userId)
  const listings = load(LISTINGS_FILE).filter(l => l.user_id === userId && l.status === 'approved')
  const accounts = load(ACCOUNTS_FILE)
  const orders = load(ORDERS_FILE)

  const result = listings.map(listing => {
    const account = accounts.find(a => a.owner_id === userId && a.title === listing.title && a.game_id === listing.game_id)
    const activeOrder = account ? orders.find(o => o.account_id === account.id && o.status === 'active') : null
    const completedOrders = account ? orders.filter(o => o.account_id === account.id && o.status === 'completed') : []
    const totalIncome = completedOrders.reduce((sum, o) => sum + (o.total_price || 0), 0)

    return {
      listing_id: listing.id,
      game_id: listing.game_id,
      game_name: listing.game_name,
      title: listing.title,
      price_per_day: listing.price_per_day,
      rank: listing.rank,
      account_id: account?.id || null,
      account_status: account?.status || 'unknown',
      is_rented: !!activeOrder,
      current_order: activeOrder ? {
        id: activeOrder.id,
        username: activeOrder.username,
        expires_at: activeOrder.expires_at,
        total_price: activeOrder.total_price,
      } : null,
      total_rentals: completedOrders.length + (activeOrder ? 1 : 0),
      total_income: totalIncome + (activeOrder ? activeOrder.total_price : 0),
    }
  })

  res.json(result)
})

// Game stats (available accounts count)
app.get('/api/games/stats', (req, res) => {
  const accounts = load(ACCOUNTS_FILE)
  const stats = {}
  accounts.forEach(a => {
    if (!stats[a.game_id]) stats[a.game_id] = { total: 0, available: 0 }
    stats[a.game_id].total++
    if (a.status === 'available') stats[a.game_id].available++
  })
  res.json(stats)
})

// Game password change links
const PASSWORD_LINKS = {
  1: { name: 'Valorant', url: 'https://account.riotgames.com/', instruction: 'Войдите → Настройки → Пароль → Изменить пароль' },
  2: { name: 'Fortnite', url: 'https://www.epicgames.com/account/password', instruction: 'Войдите → Изменить пароль' },
  3: { name: 'CS2', url: 'https://store.steampowered.com/account/', instruction: 'Войдите → Управление аккаунтом → Изменить пароль' },
}

// Auto-release expired rentals (run periodically)
function releaseExpiredRentals() {
  const orders = load(ORDERS_FILE)
  const accounts = load(ACCOUNTS_FILE)
  const listings = load(LISTINGS_FILE)
  let changed = false

  orders.forEach(order => {
    if (order.status === 'active' && new Date(order.expires_at) < new Date()) {
      order.status = 'completed'
      const account = accounts.find(a => a.id === order.account_id)
      if (account && account.owner_id) {
        account.status = 'password_update_needed'
        changed = true

        // Find listing for game info
        const listing = listings.find(l => l.user_id === account.owner_id && l.game_id === account.game_id && l.title === account.title)
        const gameInfo = PASSWORD_LINKS[account.game_id] || { name: listing?.game_name || 'Игра', url: '', instruction: 'Смените пароль от аккаунта' }

        // Notify owner
        const msg = `⚠️ АРЕНДА ЗАВЕРШЕНА\n\n🎮 ${gameInfo.name}\n💼 ${account.title}\n\n🔐 Необходимо сменить пароль!\n\nПредыдущий арендатор всё ещё может иметь доступ к аккаунту. Смените пароль как можно скорее.\n\n🔗 Ссылка для смены:\n${gameInfo.url}\n\n📝 Инструкция:\n${gameInfo.instruction}\n\nПосле смены пароля обновите его в разделе «Мои аккаунты» в приложении.`

        bot.sendMessage(account.owner_id, msg).catch(() => {})
      }
    }
  })

  if (changed) {
    save(ORDERS_FILE, orders)
    save(ACCOUNTS_FILE, accounts)
  }
}

// Check every minute
setInterval(releaseExpiredRentals, 60000)

// Update password for account
app.post('/api/accounts/:id/password', (req, res) => {
  const { password, owner_id } = req.body
  if (!password || !owner_id) return res.status(400).json({ error: 'Missing fields' })

  const accounts = load(ACCOUNTS_FILE)
  const account = accounts.find(a => a.id === Number(req.params.id))
  if (!account) return res.status(404).json({ error: 'Account not found' })
  if (account.owner_id !== String(owner_id)) return res.status(403).json({ error: 'Not your account' })

  // Update credentials in listings
  const listings = load(LISTINGS_FILE)
  const listing = listings.find(l => l.user_id === String(owner_id) && l.game_id === account.game_id && l.title === account.title)
  if (listing) {
    listing.credentials.password = password
    save(LISTINGS_FILE, listings)
  }

  // Re-enable account
  account.status = 'available'
  save(ACCOUNTS_FILE, accounts)

  res.json({ ok: true, account_status: 'available' })
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
