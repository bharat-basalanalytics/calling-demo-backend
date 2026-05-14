const path = require('path')
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const compression = require('compression')
const helmet = require('helmet')
const fileUpload = require('express-fileupload')

const { AppError } = require('@/utils')

const app = express()

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 1000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for'] || req.socket.remoteAddress
  },
  handler: (req, res, next) => {
    next(new AppError('Too many request, Try again after 10 minutes', 429))
  }
})

app.use(limiter)

app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }
  })
)

if (process.env.NODE_ENV === 'dev') {
  app.use(morgan('dev'))
}

app.use(cookieParser())
app.use(
  cors({
    credentials: true,
    origin: [
      'http://localhost:3000'
    ]
  })
)

app.options(
  '*',
  cors({
    credentials: true,
    origin: [
      'http://localhost:3000'
    ]
  })
)

app.use(helmet(require('@/utils/helmetHeaders')))

app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ limit: '5mb', extended: true }))

app.use(mongoSanitize())
app.use(xss())
app.use(compression())

const { bullboard } = require('@/services')
app.use('/admin/queues', bullboard.getRouter())

app.use(require('./routes'))

app.use('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl}`, 404))
})

app.use(require('./controller').error)

module.exports = app
