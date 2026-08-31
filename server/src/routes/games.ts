import { Router } from 'express'
import { getDB } from '../db.js'

const router = Router()

router.get('/', (_req, res) => {
  const db = getDB()
  const result = db.exec('SELECT * FROM games')
  const columns = result[0]?.columns || []
  const rows = result[0]?.values || []
  const games = rows.map((row) => {
    const obj: Record<string, unknown> = {}
    columns.forEach((col, i) => (obj[col] = row[i]))
    return obj
  })
  res.json(games)
})

export default router
