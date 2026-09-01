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
const TRANSACTIONS_FILE = path.join(dataDir, 'transactions.json')

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
  const existing = users.find(x => x.id === String(u.id))
  if (!existing) {
    users.push({
      id: String(u.id), first_name: u.first_name || '', last_name: u.last_name || '',
      username: u.username || '', role: String(u.id) === ADMIN_ID ? 'ADMIN' : 'USER',
      level: 1, created_at: new Date().toISOString(), last_seen: new Date().toISOString(),
      activity: { opened_bot: true, accepted_terms: false, opened_miniapp: false, visited_profile: false, visited_rental: false, browsed_games: false, time_in_app_seconds: 0 }
    })
    save(USERS_FILE, users)
  } else {
    existing.last_seen = new Date().toISOString()
    if (String(u.id) === ADMIN_ID && existing.role !== 'ADMIN') existing.role = 'ADMIN'
    if (!existing.activity) existing.activity = { opened_bot: true, accepted_terms: false, opened_miniapp: false, visited_profile: false, visited_rental: false, browsed_games: false, time_in_app_seconds: 0 }
    existing.activity.opened_bot = true
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
  const user = users.find(u => u.id === String(uid))
  if (user) return user
  // Auto-create user if not exists (e.g. first visit without /start)
  const newUser = { id: String(uid), first_name: '', last_name: '', username: '', role: String(uid) === ADMIN_ID ? 'ADMIN' : 'USER', level: 1, created_at: new Date().toISOString(), last_seen: new Date().toISOString(), activity: { opened_bot: true, accepted_terms: false, opened_miniapp: false, visited_profile: false, visited_rental: false, browsed_games: false, time_in_app_seconds: 0 } }
  users.push(newUser)
  save(USERS_FILE, users)
  return newUser
}

function requireAuth(req, res, next) {
  const uid = req.headers['x-user-id']
  if (!uid) return res.status(401).json({ error: 'Unauthorized' })
  req.user = getUser(req)
  next()
}

function requireAdmin(req, res, next) {
  const uid = req.headers['x-user-id']
  if (uid === ADMIN_ID) { req.user = { id: ADMIN_ID, role: 'ADMIN' }; return next() }
  const user = getUser(req)
  if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' })
  req.user = user
  next()
}

// ── Level config ──
const LEVELS = [
  { level: 1, name: 'Новичок', xpRequired: 0, cashbackPercent: 1, commissionPercent: 15 },
  { level: 2, name: 'Игрок', xpRequired: 100, cashbackPercent: 2, commissionPercent: 14 },
  { level: 3, name: 'Опытный', xpRequired: 250, cashbackPercent: 3, commissionPercent: 13 },
  { level: 4, name: 'Профи', xpRequired: 500, cashbackPercent: 4, commissionPercent: 11 },
  { level: 5, name: 'Ветеран', xpRequired: 800, cashbackPercent: 5, commissionPercent: 10 },
  { level: 6, name: 'Эксперт', xpRequired: 1200, cashbackPercent: 6, commissionPercent: 9 },
  { level: 7, name: 'Мастер', xpRequired: 1800, cashbackPercent: 7, commissionPercent: 8 },
  { level: 8, name: 'Элита', xpRequired: 2500, cashbackPercent: 8, commissionPercent: 7 },
  { level: 9, name: 'Легенда', xpRequired: 3500, cashbackPercent: 9, commissionPercent: 6 },
  { level: 10, name: 'VIP', xpRequired: 5000, cashbackPercent: 10, commissionPercent: 5 },
]

function getLevelInfo(xp) {
  let level = 1
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) { level = LEVELS[i].level; break }
  }
  const current = LEVELS.find(l => l.level === level)
  const next = LEVELS.find(l => l.level === level + 1)
  return {
    level,
    levelName: current.name,
    xp,
    currentXp: xp - current.xpRequired,
    nextXp: next ? next.xpRequired - current.xpRequired : 0,
    cashbackPercent: current.cashbackPercent,
    commissionPercent: current.commissionPercent,
  }
}

// ── Users ──
app.get('/api/users/me', requireAuth, (req, res) => {
  const user = req.user
  const rentals = load(RENTALS_FILE)
  const accounts = load(ACCOUNTS_FILE)

  // Calculate XP from rental history
  const asRenter = rentals.filter(r => r.renter_id === user.id && r.status === 'completed')
  const asOwner = rentals.filter(r => r.owner_id === user.id && r.status === 'completed')
  const renterHours = asRenter.reduce((s, r) => s + (r.hours || 0), 0)
  const ownerHours = asOwner.reduce((s, r) => s + (r.hours || 0), 0)
  const xp = renterHours + ownerHours * 2

  // Calculate balance (mock - total spent as balance for now)
  const totalSpent = rentals.filter(r => r.renter_id === user.id).reduce((s, r) => s + (r.price || 0), 0)
  const totalEarned = rentals.filter(r => r.owner_id === user.id).reduce((s, r) => s + (r.price || 0), 0)
  const balance = totalEarned - totalSpent

  // Calculate cashback points
  const cashbackPoints = Math.floor(totalSpent * 0.01) // 1% default

  const levelInfo = getLevelInfo(xp)

  res.json({
    ...user,
    xp,
    level: levelInfo.level,
    levelName: levelInfo.levelName,
    currentXp: levelInfo.currentXp,
    nextXp: levelInfo.nextXp,
    cashbackPercent: levelInfo.cashbackPercent,
    commissionPercent: levelInfo.commissionPercent,
    balance: Math.max(0, balance),
    cashbackPoints,
    totalSpent,
    totalEarned,
    renterHours,
    ownerHours,
  })
})

app.get('/api/users', requireAdmin, (req, res) => res.json(load(USERS_FILE)))

app.post('/api/users/:id/level', requireAdmin, (req, res) => {
  const users = load(USERS_FILE)
  const u = users.find(x => x.id === req.params.id)
  if (!u) return res.status(404).json({ error: 'Not found' })
  u.level = Number(req.body.level)
  save(USERS_FILE, users)
  res.json(u)
})

// Activity tracking
app.post('/api/activity', requireAuth, (req, res) => {
  const { field, value } = req.body
  if (!field) return res.status(400).json({ error: 'Missing field' })
  const users = load(USERS_FILE)
  const u = users.find(x => x.id === req.user.id)
  if (u) {
    if (!u.activity) u.activity = { opened_bot: true, accepted_terms: false, opened_miniapp: false, visited_profile: false, visited_rental: false, browsed_games: false, time_in_app_seconds: 0 }
    u.activity[field] = value !== undefined ? value : true
    u.last_seen = new Date().toISOString()
    save(USERS_FILE, users)
  }
  res.json({ ok: true })
})

// ── Wallet & Transactions ──

function getWalletBalance(userId) {
  const txns = load(TRANSACTIONS_FILE).filter(t => t.user_id === userId)
  return txns.reduce((sum, t) => sum + t.amount, 0)
}

function getCashbackPoints(userId) {
  const txns = load(TRANSACTIONS_FILE).filter(t => t.user_id === userId && t.type === 'cashback')
  return txns.reduce((sum, t) => sum + Math.abs(t.amount), 0)
}

function addTransaction(userId, type, amount, description, relatedId) {
  const txns = load(TRANSACTIONS_FILE)
  txns.push({
    id: txns.length ? Math.max(...txns.map(t => t.id)) + 1 : 1,
    user_id: userId,
    type,
    amount,
    description,
    related_id: relatedId || null,
    created_at: new Date().toISOString(),
  })
  save(TRANSACTIONS_FILE, txns)
}

app.get('/api/wallet', requireAuth, (req, res) => {
  const userId = req.user.id
  const balance = getWalletBalance(userId)
  const cashbackPoints = getCashbackPoints(userId)
  const txns = load(TRANSACTIONS_FILE).filter(t => t.user_id === userId)
  res.json({ balance, cashbackPoints, transactions: txns.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) })
})

app.post('/api/wallet/topup', requireAuth, (req, res) => {
  const { amount } = req.body
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' })
  addTransaction(req.user.id, 'topup', Number(amount), `Пополнение ${amount}₽`, null)
  res.json({ ok: true, balance: getWalletBalance(req.user.id) })
})

app.post('/api/activity/time', requireAuth, (req, res) => {
  const { seconds } = req.body
  const users = load(USERS_FILE)
  const u = users.find(x => x.id === req.user.id)
  if (u) {
    if (!u.activity) u.activity = { opened_bot: true, accepted_terms: false, opened_miniapp: false, visited_profile: false, visited_rental: false, browsed_games: false, time_in_app_seconds: 0 }
    u.activity.time_in_app_seconds = (u.activity.time_in_app_seconds || 0) + (seconds || 0)
    u.last_seen = new Date().toISOString()
    save(USERS_FILE, users)
  }
  res.json({ ok: true })
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
app.get('/api/rentals/all', requireAdmin, (req, res) => {
  res.json(load(RENTALS_FILE))
})

app.get('/api/rentals', requireAuth, (req, res) => {
  const userId = req.user.id
  let rentals = load(RENTALS_FILE)
  // Users see only their own rentals (as renter or owner)
  rentals = rentals.filter(r => r.renter_id === userId || r.owner_id === userId)
  res.json(rentals)
})

app.get('/api/rentals/:id', (req, res) => {
  const r = load(RENTALS_FILE).find(x => x.id === Number(req.params.id))
  if (!r) return res.status(404).json({ error: 'Not found' })
  res.json(r)
})

// Create rental (wallet payment)
app.post('/api/rentals', requireAuth, (req, res) => {
  const { account_id, hours } = req.body
  if (!account_id || !hours) return res.status(400).json({ error: 'Missing fields' })

  const accounts = load(ACCOUNTS_FILE)
  const acc = accounts.find(a => a.id === Number(account_id))
  if (!acc) return res.status(404).json({ error: 'Account not found' })
  if (acc.status !== 'available') return res.status(400).json({ error: 'Account not available' })
  if (acc.owner_id === req.user.id) return res.status(400).json({ error: 'Cannot rent your own account' })

  const price = Math.ceil(acc.price_per_hour * hours)
  const balance = getWalletBalance(req.user.id)
  if (balance < price) return res.status(400).json({ error: 'Недостаточно средств на балансе', balance, needed: price })

  // Deduct from renter
  addTransaction(req.user.id, 'rental_payment', -price, `Аренда: ${acc.title} (${hours}ч)`, null)

  // Cashback for renter
  const users = load(USERS_FILE)
  const renter = users.find(u => u.id === req.user.id)
  const xp = (renter?.xp || 0) + hours
  const levelInfo = getLevelInfo(xp)
  const cashback = Math.floor(price * levelInfo.cashbackPercent / 100)
  if (cashback > 0) addTransaction(req.user.id, 'cashback', cashback, `Кэшбэк ${levelInfo.cashbackPercent}% за аренду`, null)

  // Update renter XP
  if (renter) { renter.xp = xp; renter.level = levelInfo.level; save(USERS_FILE, users) }

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
    price,
    status: 'active',
    started_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + hours * 3600000).toISOString(),
    created_at: new Date().toISOString(),
    ten_min_warning: false,
    payment_source: 'wallet',
    credentials: { login: acc.login || '', password: acc.password || '' },
  }
  rentals.push(rental)
  save(RENTALS_FILE, rentals)

  // Notify owner
  bot.sendMessage(acc.owner_id, `📢 Ваш аккаунт арендован!\n\n🎮 ${acc.game_name}\n💼 ${acc.title}\n\n⏱ ${hours}ч · 💰 ${price}₽`).catch(() => {})

  res.status(201).json({ ...rental, cashback })
})

// Admin: create rental for any user
app.post('/api/admin/rentals', requireAdmin, (req, res) => {
  const { user_id, account_id, hours } = req.body
  if (!user_id || !account_id || !hours) return res.status(400).json({ error: 'Missing fields' })

  const accounts = load(ACCOUNTS_FILE)
  const acc = accounts.find(a => a.id === Number(account_id))
  if (!acc) return res.status(404).json({ error: 'Account not found' })
  if (acc.status !== 'available') return res.status(400).json({ error: 'Account not available' })

  acc.status = 'rented'
  save(ACCOUNTS_FILE, accounts)

  const rentals = load(RENTALS_FILE)
  const rental = {
    id: rentals.length ? Math.max(...rentals.map(r => r.id)) + 1 : 1,
    account_id: acc.id,
    owner_id: acc.owner_id || '',
    renter_id: String(user_id),
    renter_username: '',
    game_id: acc.game_id,
    game_name: acc.game_name || '',
    account_title: acc.title,
    hours: Number(hours),
    price: Math.ceil(acc.price_per_hour * hours),
    status: 'active',
    started_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + hours * 3600000).toISOString(),
    created_at: new Date().toISOString(),
    ten_min_warning: false,
    payment_source: 'admin',
    credentials: { login: acc.login || '', password: acc.password || '' },
  }
  rentals.push(rental)
  save(RENTALS_FILE, rentals)

  bot.sendMessage(String(user_id), `✅ Вам выдана аренда!\n\n🎮 ${acc.game_name || ''}\n💼 ${acc.title}\n\n⏱ ${hours}ч`).catch(() => {})

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

  // Credit owner (minus commission)
  const users = load(USERS_FILE)
  const owner = users.find(u => u.id === rental.owner_id)
  const ownerXp = (owner?.xp || 0) + rental.hours * 2
  const ownerLevelInfo = getLevelInfo(ownerXp)
  const commission = Math.ceil(rental.price * ownerLevelInfo.commissionPercent / 100)
  const ownerEarning = rental.price - commission
  addTransaction(rental.owner_id, 'rental_income', ownerEarning, `Доход от аренды: ${rental.account_title} (${rental.hours}ч)`, rental.id)
  if (owner) { owner.xp = ownerXp; owner.level = ownerLevelInfo.level; save(USERS_FILE, users) }

  const gl = GAME_LINKS[rental.game_id] || { name: rental.game_name, url: '', instruction: 'Смените пароль' }
  bot.sendMessage(rental.owner_id, `⏰ Аренда завершена\n\n🎮 ${rental.game_name}\n💼 ${rental.account_title}\n\n💰 Доход: ${ownerEarning}₽ (комиссия ${commission}₽)\n\nПожалуйста, смените пароль:\n🔗 ${gl.url}\n📝 ${gl.instruction}`).catch(() => {})
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

      // Credit owner
      const users = load(USERS_FILE)
      const owner = users.find(u => u.id === r.owner_id)
      const ownerXp = (owner?.xp || 0) + r.hours * 2
      const ownerLevelInfo = getLevelInfo(ownerXp)
      const commission = Math.ceil(r.price * ownerLevelInfo.commissionPercent / 100)
      const ownerEarning = r.price - commission
      addTransaction(r.owner_id, 'rental_income', ownerEarning, `Доход: ${r.account_title} (${r.hours}ч)`, r.id)
      if (owner) { owner.xp = ownerXp; owner.level = ownerLevelInfo.level; save(USERS_FILE, users) }

      const gl = GAME_LINKS[r.game_id] || { name: r.game_name, url: '', instruction: 'Смените пароль' }
      bot.sendMessage(r.owner_id, `⏰ Аренда завершена\n\n🎮 ${r.game_name}\n💼 ${r.account_title}\n\n💰 Доход: ${ownerEarning}₽ (комиссия ${commission}₽)\n\nПожалуйста, смените пароль:\n🔗 ${gl.url}\n📝 ${gl.instruction}\n\nПосле смены подтвердите в «Мои аккаунты».`).catch(() => {})
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
