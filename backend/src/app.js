const express = require('express')
const cors = require('cors')
const path = require('path')
const routes = require('./routes')
const errorHandler = require('./middlewares/errorHandler')
const notFound = require('./middlewares/notFound')

const app = express()

const allowedOrigins = [
  'https://tiremax.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
]

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
app.use('/api', routes)
app.use(notFound)
app.use(errorHandler)

module.exports = app