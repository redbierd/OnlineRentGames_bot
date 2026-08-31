import { Router } from 'express'
import { getDB } from '../db.js'

const router = Router()

router.get('/:gameId/accounts', (req, res) => {
  const db = getDB()
  const { gameId } = req.params
  const result = db.exec('SELECT * FROM accounts WHERE game_id = ?', [Number(gameId)])
  const columns = result[0]?.columns || []
  const rows = result[0]?.values || []
  const accounts = rows.map((row) => {
    const obj: Record<string, unknown> = {}
    columns.forEach((col, i) => (obj[col] = row[i]))
    return obj
  })
  res.json(accounts)
})

export default router
