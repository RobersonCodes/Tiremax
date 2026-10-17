const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')
const routes = require('./routes')
const errorHandler = require('./middlewares/errorHandler')
const notFound = require('./middlewares/notFound')
const { apiLimiter } = require('./middlewares/rateLimit')

const app = express()

// O host roda atrás de um proxy reverso — sem isso, req.ip (e o rate limiter,
// que usa req.ip) veria o IP do proxy pra todo mundo igual.
app.set('trust proxy', 1)

const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ALLOWED_ORIGINS || '').split(',').map(origin => origin.trim()),
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean))

app.use(helmet({
  // Frontend e API usam origens diferentes; imagens da API precisam continuar
  // acessíveis pela interface.
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

const corsOptions = {
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Origem não autorizada pelo CORS'))
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}

app.use(cors(corsOptions))

app.options('*', cors(corsOptions))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' }))
app.use('/api', apiLimiter, routes)
app.use(notFound)
app.use(errorHandler)

module.exports = app
