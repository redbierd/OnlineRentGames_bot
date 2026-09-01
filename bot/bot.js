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
const ACCOUNTS_FILE = path.join(dataDir, 'accounts.json')
const RENTALS_FILE = path.join(dataDir, 'rentals.json')

const TOKEN = process.env.BOT_TOKEN || '8860618629:AAFvQJ39Vz9mLsC6VxRbz8INWJ1k8AU-mSQ'
const ADMIN_ID = process.env.ADMIN_ID || '864525792'
const PORT = process.env.PORT || 3001
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`

function load(f) { try { return JSON.parse(fs.readFileSync(f, 'utf-8')) } catch { return [] } }
function save(f, d) { fs.writeFileSync(f, JSON.stringify(d, null, 2)) }

const GAME_LINKS = {
  1: { name: 'Valorant', url: 'https://account.riotgames.com/', instruction: 'Войдите → Настройки → Пароль → Изменить' },
  2: { name: 'Fortnite', url: 'https://www.epicgames.com/account/password', instruction: 'Войдите → Изменить пароль' },
  3: { name: 'CS2', url: 'https://store.steampowered.com/account/', instruction: 'Войдите → Управление аккаунтом → Изменить пароль' },
}

// ── Telegram Bot ──
const bot = new TelegramBot(TOKEN, { polling: true })
bot.setChatMenuButton({ menu_button: { type: 'web_app', text: 'Открыть магазин', web_app: { url: BASE_URL } } }).catch(() => {})

bot.onText(/\/start/, (msg) => {
  const u = msg.from
  const users = load(USERS_FILE)
  if (!users.find(x => x.id === String(u.id))) {
    users.push({ id: String(u.id), first_name: u.first_name || '', last_name: u.last_name || '', username: u.username || '', role: 'USER', level: 1, created_at: new Date().toISOString(), last_seen: new Date().toISOString() })
    save(USERS_FILE, users)
  }
  bot.sendMessage(msg.chat.id, '🎮 Добро пожаловать в GameRent!\n\nАрендуй аккаунты или сдавайте свои:', {
    reply_markup: { inline_keyboard: [[{ text: '🎮 Открыть магазин', web_app: { url: BASE_URL } }]] }
  })
})

console.log('Bot started')

// ── Express ──
const app = express()
app.use(cors())
app.use(express.json())

const distDir = path.join(__dirname, '..', 'client', 'dist')
if (fs.existsSync(distDir)) app.use(express.static(distDir))

// Helper: get user from request header
function getUser(req) {
  const uid = req.headers['x-user-id']
  if (!uid) return null
  const users = load(USERS_FILE)
  return users.find(u => u.id === String(uid)) || null
}

function requireAuth(req, res, next) {
  const user = getUser(req)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  req.user = user
  next()
}

function requireAdmin(req, res, next) {
  const user = getUser(req)
  if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' })
  req.user = user
  next()
}

// ── Users ──
app.get('/api/users/me', requireAuth, (req, res) => res.json(req.user))

app.get('/api/users', requireAdmin, (req, res) => res.json(load(USERS_FILE)))

app.post('/api/users/:id/level', requireAdmin, (req, res) => {
  const users = load(USERS_FILE)
  const u = users.find(x => x.id === req.params.id)
  if (!u) return res.status(404).json({ error: 'Not found' })
  u.level = Number(req.body.level)
  save(USERS_FILE, users)
  res.json(u)
})

// ── Accounts (catalog) ──
app.get('/api/accounts', (req, res) => {
  let accounts = load(ACCOUNTS_FILE)
  if (req.query.game_id) accounts = accounts.filter(a => a.game_id === Number(req.query.game_id))
  if (req.query.status) accounts = accounts.filter(a => a.status === req.query.status)
  // Only show available accounts to regular users
  if (!req.headers['x-admin']) accounts = accounts.filter(a => a.status === 'available')
  res.json(accounts)
})

app.get('/api/accounts/:id', (req, res) => {
  const a = load(ACCOUNTS_FILE).find(x => x.id === Number(req.params.id))
  a ? res.json(a) : res.status(404).json({ error: 'Not found' })
})

// My accounts (owner view)
app.get('/api/my-accounts', requireAuth, (req, res) => {
  const userId = req.user.id
  const accounts = load(ACCOUNTS_FILE).filter(a => a.owner_id === userId)
  const rentals = load(RENTALS_FILE)

  const result = accounts.map(acc => {
    const activeRental = rentals.find(r => r.account_id === acc.id && r.status === 'active')
    const completedRentals = rentals.filter(r => r.account_id === acc.id && r.status === 'completed')
    const totalIncome = completedRentals.reduce((s, r) => s + r.price, 0) + (activeRental ? activeRental.price : 0)

    return {
      ...acc,
      is_rented: !!activeRental,
      active_rental: activeRental ? {
        id: activeRental.id,
        renter_username: activeRental.renter_username,
        expires_at: activeRental.expires_at,
        hours: activeRental.hours,
        price: activeRental.price,
      } : null,
      total_rentals: completedRentals.length + (activeRental ? 1 : 0),
      total_income: totalIncome,
    }
  })

  res.json(result)
})

// Update password (owner confirms change)
app.post('/api/accounts/:id/update-password', requireAuth, (req, res) => {
  const accounts = load(ACCOUNTS_FILE)
  const acc = accounts.find(a => a.id === Number(req.params.id))
  if (!acc) return res.status(404).json({ error: 'Not found' })
  if (acc.owner_id !== req.user.id) return res.status(403).json({ error: 'Not your account' })
  if (acc.status !== 'waiting_password_change') return res.status(400).json({ error: 'Account not waiting for password change' })

  acc.password = req.body.password
  acc.status = 'available'
  save(ACCOUNTS_FILE, accounts)
  res.json({ ok: true })
})

// Game stats
app.get('/api/games/stats', (req, res) => {
  const accounts = load(ACCOUNTS_FILE)
  const stats = {}
  accounts.forEach(a => {
    if (!stats[a.game_id]) stats[a.game_id] = { total: 0, available: 0, min_price: Infinity }
    stats[a.game_id].total++
    if (a.status === 'available') {
      stats[a.game_id].available++
      if (a.price_per_hour < stats[a.game_id].min_price) stats[a.game_id].min_price = a.price_per_hour
    }
  })
  Object.values(stats).forEach(s => { if (s.min_price === Infinity) s.min_price = 0 })
  res.json(stats)
})

// ── Moderation (listing applications) ──
app.post('/api/accounts/submit', requireAuth, (req, res) => {
  const d = req.body
  if (!d.game_id || !d.title || !d.login || !d.password || !d.price_per_hour) return res.status(400).json({ error: 'Missing fields' })

  const accounts = load(ACCOUNTS_FILE)
  const acc = {
    id: accounts.length ? Math.max(...accounts.map(a => a.id)) + 1 : 1,
    owner_id: req.user.id,
    owner_username: req.user.username || '',
    game_id: Number(d.game_id),
    game_name: d.game_name || '',
    title: d.title,
    description: d.description || '',
    extra_info: d.extra_info || '',
    rank: d.rank || '',
    login: d.login,
    password: d.password,
    price_per_hour: Number(d.price_per_hour),
    status: 'pending_moderation',
    created_at: new Date().toISOString(),
  }
  accounts.push(acc)
  save(ACCOUNTS_FILE, accounts)

  bot.sendMessage(ADMIN_ID,
    `🔔 НОВАЯ ЗАЯВКА\n\n🎮 ${acc.game_name}\n👤 @${acc.owner_username || '—'}\n🆔 ${acc.owner_id}\n\n💼 ${acc.title}\n💰 ${acc.price_per_hour}₽/час\n\n🕐 ${new Date().toLocaleString('ru-RU')}`
  ).catch(() => {})

  res.status(201).json(acc)
})

app.get('/api/moderation', requireAdmin, (req, res) => {
  let accounts = load(ACCOUNTS_FILE)
  if (req.query.status) accounts = accounts.filter(a => a.status === req.query.status)
  res.json(accounts)
})

app.post('/api/moderation/:id/approve', requireAdmin, (req, res) => {
  const accounts = load(ACCOUNTS_FILE)
  const acc = accounts.find(a => a.id === Number(req.params.id))
  if (!acc) return res.status(404).json({ error: 'Not found' })
  acc.status = 'available'
  acc.approved_at = new Date().toISOString()
  save(ACCOUNTS_FILE, accounts)

  bot.sendMessage(acc.owner_id, `✅ Аккаунт одобрен!\n\n🎮 ${acc.game_name}\n💼 ${acc.title}\n\nТеперь он доступен для аренды.`).catch(() => {})
  res.json(acc)
})

app.post('/api/moderation/:id/reject', requireAdmin, (req, res) => {
  const accounts = load(ACCOUNTS_FILE)
  const acc = accounts.find(a => a.id === Number(req.params.id))
  if (!acc) return res.status(404).json({ error: 'Not found' })
  acc.status = 'rejected'
  acc.rejection_reason = req.body.reason || ''
  acc.admin_comment = req.body.comment || ''
  save(ACCOUNTS_FILE, accounts)

  bot.sendMessage(acc.owner_id, `❌ Заявка отклонена\n\n🎮 ${acc.game_name}\n💼 ${acc.title}\n\nПричина: ${acc.rejection_reason}${acc.admin_comment ? `\nКомментарий: ${acc.admin_comment}` : ''}\n\nВы можете исправить и отправить повторно.`).catch(() => {})
  res.json(acc)
})

// ── Rentals ──
app.get('/api/rentals', requireAuth, (req, res) => {
  const userId = req.user.id
  let rentals = load(RENTALS_FILE)
  // Users see only their own rentals (as renter or owner)
  rentals = rentals.filter(r => r.renter_id === userId || r.owner_id === userId)
  res.json(rentals)
})

app.get('/api/rentals/:id', requireAuth, (req, res) => {
  const r = load(RENTALS_FILE).find(x => x.id === Number(req.params.id))
  if (!r) return res.status(404).json({ error: 'Not found' })
  if (r.renter_id !== req.user.id && r.owner_id !== req.user.id && req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' })
  res.json(r)
})

// Create rental (mock payment)
app.post('/api/rentals', requireAuth, (req, res) => {
  const { account_id, hours } = req.body
  if (!account_id || !hours) return res.status(400).json({ error: 'Missing fields' })

  const accounts = load(ACCOUNTS_FILE)
  const acc = accounts.find(a => a.id === Number(account_id))
  if (!acc) return res.status(404).json({ error: 'Account not found' })
  if (acc.status !== 'available') return res.status(400).json({ error: 'Account not available' })
  if (acc.owner_id === req.user.id) return res.status(400).json({ error: 'Cannot rent your own account' })

  // Atomic: check and update
  acc.status = 'rented'
  save(ACCOUNTS_FILE, accounts)

  const rentals = load(RENTALS_FILE)
  const rental = {
    id: rentals.length ? Math.max(...rentals.map(r => r.id)) + 1 : 1,
    account_id: acc.id,
    owner_id: acc.owner_id,
    renter_id: req.user.id,
    renter_username: req.user.username || '',
    game_id: acc.game_id,
    game_name: acc.game_name,
    account_title: acc.title,
    hours: Number(hours),
    price: Math.ceil(acc.price_per_hour * hours),
    status: 'active',
    started_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + hours * 3600000).toISOString(),
    created_at: new Date().toISOString(),
    ten_min_warning: false,
    payment_source: 'mock',
  }
  rentals.push(rental)
  save(RENTALS_FILE, rentals)

  // Notify owner
  bot.sendMessage(acc.owner_id, `📢 Ваш аккаунт арендован!\n\n🎮 ${acc.game_name}\n💼 ${acc.title}\n\n⏱ ${hours}ч · 💰 ${rental.price}₽`).catch(() => {})

  res.status(201).json(rental)
})

// Extend rental
app.post('/api/rentals/:id/extend', requireAuth, (req, res) => {
  const { hours } = req.body
  if (!hours) return res.status(400).json({ error: 'Missing hours' })

  const rentals = load(RENTALS_FILE)
  const rental = rentals.find(r => r.id === Number(req.params.id))
  if (!rental) return res.status(404).json({ error: 'Not found' })
  if (rental.renter_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
  if (rental.status !== 'active') return res.status(400).json({ error: 'Rental not active' })

  const accounts = load(ACCOUNTS_FILE)
  const acc = accounts.find(a => a.id === rental.account_id)
  const additionalCost = Math.ceil((acc?.price_per_hour || 0) * hours)

  rental.hours += Number(hours)
  rental.price += additionalCost
  rental.expires_at = new Date(new Date(rental.expires_at).getTime() + hours * 3600000).toISOString()
  save(RENTALS_FILE, rentals)

  // Notify owner
  bot.sendMessage(rental.owner_id, `⏱ Аренда продлена\n\n🎮 ${rental.game_name}\n💼 ${rental.account_title}\n\n+${hours}ч · +${additionalCost}₽\nДо: ${new Date(rental.expires_at).toLocaleString('ru-RU')}`).catch(() => {})

  res.json(rental)
})

// Admin: complete rental
app.post('/api/rentals/:id/complete', requireAdmin, (req, res) => {
  const rentals = load(RENTALS_FILE)
  const rental = rentals.find(r => r.id === Number(req.params.id))
  if (!rental) return res.status(404).json({ error: 'Not found' })

  rental.status = 'completed'
  rental.ended_at = new Date().toISOString()
  rental.ended_by = 'admin'
  rental.end_reason = req.body.reason || 'admin_manual'
  save(RENTALS_FILE, rentals)

  const accounts = load(ACCOUNTS_FILE)
  const acc = accounts.find(a => a.id === rental.account_id)
  if (acc) { acc.status = 'waiting_password_change'; save(ACCOUNTS_FILE, accounts) }

  const gl = GAME_LINKS[rental.game_id] || { name: rental.game_name, url: '', instruction: 'Смените пароль' }
  bot.sendMessage(rental.owner_id, `⏰ Аренда завершена\n\n🎮 ${rental.game_name}\n💼 ${rental.account_title}\n\nПожалуйста, смените пароль:\n🔗 ${gl.url}\n📝 ${gl.instruction}`).catch(() => {})
  bot.sendMessage(rental.renter_id, `ℹ️ Аренда завершена\n\n🎮 ${rental.game_name}\n💼 ${rental.account_title}\n\nСрок аренды истёк.`).catch(() => {})

  res.json(rental)
})

// ── Auto-expire rentals ──
function checkExpiredRentals() {
  const rentals = load(RENTALS_FILE)
  const accounts = load(ACCOUNTS_FILE)
  let changed = false

  rentals.forEach(r => {
    if (r.status !== 'active') return

    // 10-minute warning
    if (!r.ten_min_warning) {
      const expiresAt = new Date(r.expires_at).getTime()
      const tenMinBefore = expiresAt - 10 * 60 * 1000
      if (Date.now() >= tenMinBefore && Date.now() < expiresAt) {
        r.ten_min_warning = true
        changed = true

        bot.sendMessage(r.renter_id, `⚠️ Аренда скоро закончится\n\n🎮 ${r.game_name}\n💼 ${r.account_title}\n\nДо окончания: 10 минут\n\nХотите продолжить?`).catch(() => {})
        bot.sendMessage(r.owner_id, `⚠️ Аренда заканчивается\n\n🎮 ${r.game_name}\n💼 ${r.account_title}\n\nДо окончания: 10 минут\n\nПосле завершения потребуется сменить пароль.`).catch(() => {})
      }
    }

    // Expired
    if (new Date(r.expires_at) <= new Date()) {
      r.status = 'completed'
      r.ended_at = new Date().toISOString()
      r.ended_by = 'system'
      r.end_reason = 'expired'
      changed = true

      const acc = accounts.find(a => a.id === r.account_id)
      if (acc) { acc.status = 'waiting_password_change' }

      const gl = GAME_LINKS[r.game_id] || { name: r.game_name, url: '', instruction: 'Смените пароль' }
      bot.sendMessage(r.owner_id, `⏰ Аренда завершена\n\n🎮 ${r.game_name}\n💼 ${r.account_title}\n\nПожалуйста, смените пароль:\n🔗 ${gl.url}\n📝 ${gl.instruction}\n\nПосле смены подтвердите в «Мои аккаунты».`).catch(() => {})
      bot.sendMessage(r.renter_id, `ℹ️ Аренда завершена\n\n🎮 ${r.game_name}\n💼 ${r.account_title}\n\nСрок аренды истёк.`).catch(() => {})
    }
  })

  if (changed) {
    save(RENTALS_FILE, rentals)
    save(ACCOUNTS_FILE, accounts)
  }
}
setInterval(checkExpiredRentals, 30000)

// SPA fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' })
  const idx = path.join(distDir, 'index.html')
  fs.existsSync(idx) ? res.sendFile(idx) : res.status(404).send('Not built')
})

app.listen(PORT, () => console.log(`Server on port ${PORT}`))
