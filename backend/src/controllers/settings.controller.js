const prisma = require('../config/database')
const path = require('path')
const fs = require('fs')

const get = async (req, res, next) => {
  try {
    // Lê do arquivo settings.json local (simples, sem tabela extra)
    const settingsPath = path.join(__dirname, '../../settings.json')
    if (!fs.existsSync(settingsPath)) {
      return res.json({
        name: 'TireMax Borracharia',
        tagline: 'Gestão Automotiva Inteligente',
        phone: '',
        whatsapp: '',
        email: '',
        address: '',
        city: '',
        state: '',
        openHours: 'Seg - Sáb: 08:00 às 18:00',
        logo: null,
        primaryColor: '#f5c800',
        cnpj: '',
      })
    }
    const data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    res.json(data)
  } catch (err) { next(err) }
}

const update = async (req, res, next) => {
  try {
    const settingsPath = path.join(__dirname, '../../settings.json')
    let current = {}
    if (fs.existsSync(settingsPath)) {
      current = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    }
    const updated = { ...current, ...req.body }
    fs.writeFileSync(settingsPath, JSON.stringify(updated, null, 2))
    res.json(updated)
  } catch (err) { next(err) }
}

const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo enviado' })
    const logoUrl = `/uploads/${req.file.filename}`
    const settingsPath = path.join(__dirname, '../../settings.json')
    let current = {}
    if (fs.existsSync(settingsPath)) {
      current = JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
    }
    current.logo = logoUrl
    fs.writeFileSync(settingsPath, JSON.stringify(current, null, 2))
    res.json({ logo: logoUrl })
  } catch (err) { next(err) }
}

module.exports = { get, update, uploadLogo }
