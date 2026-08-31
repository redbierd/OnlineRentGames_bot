import express from 'express'
import cors from 'cors'
import { initDB } from './db.js'
import gamesRouter from './routes/games.js'
import accountsRouter from './routes/accounts.js'
import ordersRouter from './routes/orders.js'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

app.use('/api/games', gamesRouter)
app.use('/api/games', accountsRouter)
app.use('/api/orders', ordersRouter)

async function start() {
  await initDB()
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

start()
