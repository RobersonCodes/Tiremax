const express = require('express')
const { authorize } = require('../middlewares/auth')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const settingsController = require('../controllers/settings.controller')

const uploadsDir = path.join(__dirname, '../../uploads')
const r2Configured = Boolean(
  process.env.R2_ENDPOINT && process.env.R2_BUCKET &&
  process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_PUBLIC_URL
)

if (process.env.NODE_ENV !== 'production') fs.mkdirSync(uploadsDir, { recursive: true })

const storage = process.env.NODE_ENV === 'production' || r2Configured
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadsDir),
      filename: (req, file, cb) => cb(null, `logo-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
    })

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) return cb(new Error('Envie uma imagem PNG, JPEG ou WebP'))
    cb(null, true)
  },
})

router.get('/', settingsController.get)
router.put('/', authorize('ADMIN'), settingsController.update)
router.post('/logo', authorize('ADMIN'), upload.single('logo'), settingsController.uploadLogo)

module.exports = router
