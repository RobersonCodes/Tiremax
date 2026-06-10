const prisma = require('../config/database');
const { getSettings, updateSettings } = require('./tenant.controller');

const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    const logoUrl = `/uploads/${req.file.filename}`;
    await prisma.tenant.update({ where: { id: req.tenantId }, data: { logo: logoUrl } });
    res.json({ logo: logoUrl });
  } catch (err) { next(err); }
};

module.exports = { get: getSettings, update: updateSettings, uploadLogo };
