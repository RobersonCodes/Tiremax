const express = require('express')
const { authorize } = require('../middlewares/auth')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const settingsController = require('../controllers/settings.controller')

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `logo-${Date.now()}${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } })

router.get('/', settingsController.get)
router.put('/', authorize('ADMIN'), settingsController.update)
router.post('/logo', authorize('ADMIN'), upload.single('logo'), settingsController.uploadLogo)

module.exports = router
