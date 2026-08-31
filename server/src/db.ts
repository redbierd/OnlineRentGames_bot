import initSqlJs, { Database } from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '..', 'data.db')

let db: Database

export async function initDB(): Promise<Database> {
  const SQL = await initSqlJs()

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      image_url TEXT DEFAULT ''
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      price_per_day REAL NOT NULL,
      rank TEXT DEFAULT '',
      status TEXT DEFAULT 'available',
      FOREIGN KEY (game_id) REFERENCES games(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      user_id TEXT,
      username TEXT,
      rental_days INTEGER NOT NULL,
      total_price REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    )
  `)

  // Seed if empty
  const result = db.exec('SELECT COUNT(*) as cnt FROM games')
  const count = result[0]?.values[0]?.[0] as number

  if (count === 0) {
    db.run("INSERT INTO games (name, slug) VALUES ('Valorant', 'valorant')")
    db.run("INSERT INTO games (name, slug) VALUES ('Fortnite', 'fortnite')")
    db.run("INSERT INTO games (name, slug) VALUES ('CS2', 'cs2')")

    // Valorant
    db.run("INSERT INTO accounts (game_id, title, description, price_per_day, rank) VALUES (1, 'Diamond 2 | Все агенты', 'Полный доступ ко всем агентам, множество скинов оружия, боевой пропуск Act 5', 150, 'Diamond 2')")
    db.run("INSERT INTO accounts (game_id, title, description, price_per_day, rank) VALUES (1, 'Immortal 1 | Премиум скины', 'Редкие скины Reaver, Prime, RGX. Высокий рейтинг', 350, 'Immortal 1')")
    db.run("INSERT INTO accounts (game_id, title, description, price_per_day, rank) VALUES (1, 'Gold 3 | Стартовый', 'Базовый набор агентов, подходит для рейтинговых игр', 50, 'Gold 3')")
    db.run("INSERT INTO accounts (game_id, title, description, price_per_day, rank) VALUES (1, 'Radiant | Топ аккаунт', 'Элитный аккаунт с эксклюзивными скинами и Radiant рангом', 500, 'Radiant')")

    // Fortnite
    db.run("INSERT INTO accounts (game_id, title, description, price_per_day, rank) VALUES (2, 'Champion League | 200+ скинов', 'Огромная коллекция скинов, включая Renegade Raider и OG Skull Trooper', 250, 'Champion')")
    db.run("INSERT INTO accounts (game_id, title, description, price_per_day, rank) VALUES (2, 'Diamond Arena | Баттлпасс', 'Текущий баттлпасс, 80+ скинов, множество эмоций', 100, 'Diamond')")
    db.run("INSERT INTO accounts (game_id, title, description, price_per_day, rank) VALUES (2, 'Unreal | Полная коллекция', 'Все сезонные скины с 1 главы, редкие эксклюзивы', 450, 'Unreal')")
    db.run("INSERT INTO accounts (game_id, title, description, price_per_day, rank) VALUES (2, 'Elite | Средний набор', 'Хороший набор скинов и эмоций, актуальный баттлпасс', 80, 'Elite')")

    // CS2
    db.run("INSERT INTO accounts (game_id, title, description, price_per_day, rank) VALUES (3, 'Global Elite | Инвентарь 5000$', 'Дорогой инвентарь: ножи, перчатки, скины оружия', 400, 'Global Elite')")
    db.run("INSERT INTO accounts (game_id, title, description, price_per_day, rank) VALUES (3, 'Supreme | Средний инвентарь', 'Хороший набор скинов, высокий рейтинг', 200, 'Supreme')")
    db.run("INSERT INTO accounts (game_id, title, description, price_per_day, rank) VALUES (3, 'Gold Nova IV | Базовый', 'Базовые скины, подходит для катки с друзьями', 60, 'Gold Nova IV')")
    db.run("INSERT INTO accounts (game_id, title, description, price_per_day, rank) VALUES (3, 'Legendary Eagle | Премиум', 'Премиум инвентарь с ножом и перчатками', 300, 'Legendary Eagle')")

    saveDB()
    console.log('Database seeded with sample data')
  }

  return db
}

export function saveDB() {
  if (db) {
    const data = db.export()
    fs.writeFileSync(dbPath, Buffer.from(data))
  }
}

export function getDB(): Database {
  return db
}
