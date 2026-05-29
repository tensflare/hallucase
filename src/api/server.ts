import express from 'express'
import cors from 'cors'
import { createRouter } from './router.js'
import { SqliteRegistryStore } from '../registry/sqlite.js'
import { RegistryStore } from '../registry/index.js'

export async function createApp(store?: RegistryStore): Promise<{ app: express.Application; store: RegistryStore }> {
  const resolvedStore = store ?? new SqliteRegistryStore(process.env.DATABASE_PATH ?? './hallucase.db')
  await resolvedStore.initialize()

  const app = express()
  app.use(cors())
  app.use(express.json())

  const router = createRouter(resolvedStore)
  app.use('/api', router)

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  return { app, store: resolvedStore }
}

if (process.argv[1]?.endsWith('server.ts') || process.argv[1]?.endsWith('server.js')) {
  const port = parseInt(process.env.PORT ?? '3457', 10)
  createApp()
    .then(({ app, store }) => {
      const server = app.listen(port, () => {
        console.log(`HalluCase API server running on http://localhost:${port}`)
        console.log(`API docs at http://localhost:${port}/api/schema`)
      })

      const shutdown = () => {
        console.log('\nShutting down...')
        server.close(() => {
          store.close()
          process.exit(0)
        })
      }
      process.on('SIGTERM', shutdown)
      process.on('SIGINT', shutdown)
    })
    .catch((err) => {
      console.error('Failed to start server:', err)
      process.exit(1)
    })
}
