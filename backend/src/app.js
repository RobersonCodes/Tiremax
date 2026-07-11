const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')
const routes = require('./routes')
const errorHandler = require('./middlewares/errorHandler')
const notFound = require('./middlewares/notFound')
const { apiLimiter } = require('./middlewares/rateLimit')

const app = express()

// Railway roda atrás de um proxy reverso — sem isso, req.ip (e o rate
// limiter, que usa req.ip) veria o IP do proxy pra todo mundo igual.
app.set('trust proxy', 1)

const allowedOrigins = [
  'https://tiremax.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
]

app.use(helmet({
  // Frontend (Vercel) e backend (Railway) são origens diferentes de propósito
  // — CORP same-origin (padrão do helmet) bloquearia o navegador de exibir
  // logo/imagens servidas em /uploads a partir do frontend.
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(null, true) // permite tudo por ora, mudar para false em produção final
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}))

app.options('*', cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' }))
app.use('/api', apiLimiter, routes)
app.use(notFound)
app.use(errorHandler)

module.exports = app