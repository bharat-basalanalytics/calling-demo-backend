process.on('uncaughtException', (err) => {
  console.error({ err })
  process.exit(1)
})

require('module-alias/register')
if (process.env.NODE_ENV !== 'prod') {
  const dotenv = require('dotenv')
  dotenv.config({
    path: './.env'
  })
}

const { db } = require('./services')
db.init()

const app = require('./app')
const PORT = process.env.PORT || 8800

const server = app.listen(PORT, () => {
  if (process.env.NODE_ENV === 'dev') console.log(`Server up and running on http://localhost:${PORT}`)
})

process.on('unhandledRejection', (err) => {
  console.error({ err })
  server.close(() => {
    process.exit(1)
  })
})
