import { createApp } from './app.js'

const port = Number(process.env.PORT ?? 4000)
const dbFile = process.env.DATABASE_URL ?? 'data/trumpet.db'
const { app } = createApp({ dbFile })

/**
 * Starts the HTTP API server for local development.
 */
const startServer = () => {
  app.listen(port, () => {
    console.log(`Trumpet API listening on http://localhost:${port}`)
  })
}

startServer()
