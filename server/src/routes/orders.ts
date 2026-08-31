import { Router } from 'express'
import { getDB, saveDB } from '../db.js'

const router = Router()

router.post('/', (req, res) => {
  const db = getDB()
  const { account_id, user_id, username, rental_days, total_price } = req.body

  if (!account_id || !rental_days || !total_price) {
    res.status(400).json({ error: 'Missing required fields' })
    return
  }

  db.run(
    'INSERT INTO orders (account_id, user_id, username, rental_days, total_price) VALUES (?, ?, ?, ?, ?)',
    [account_id, user_id || '', username || '', rental_days, total_price]
  )

  saveDB()

  const result = db.exec('SELECT last_insert_rowid() as id')
  const orderId = result[0]?.values[0]?.[0]

  const orderResult = db.exec('SELECT * FROM orders WHERE id = ?', [orderId as number])
  const columns = orderResult[0]?.columns || []
  const row = orderResult[0]?.values[0] || []
  const order: Record<string, unknown> = {}
  columns.forEach((col, i) => (order[col] = row[i]))

  res.status(201).json(order)
})

export default router
