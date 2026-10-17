const prisma = require('../config/database');
const { getSettings, updateSettings } = require('./tenant.controller');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const r2Configured = Boolean(
  process.env.R2_ENDPOINT && process.env.R2_BUCKET &&
  process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_PUBLIC_URL
);
const r2 = r2Configured ? new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
}) : null;

const extensionByMimeType = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    let logoUrl;

    if (r2) {
      const extension = extensionByMimeType[req.file.mimetype];
      const key = `logos/${req.tenantId}/${require('crypto').randomUUID()}.${extension}`;
      await r2.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        CacheControl: 'public, max-age=31536000, immutable',
      }));
      logoUrl = `${process.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;
    } else if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ message: 'Armazenamento permanente de logos não configurado' });
    } else {
      logoUrl = `/uploads/${req.file.filename}`;
    }

    await prisma.tenant.update({ where: { id: req.tenantId }, data: { logo: logoUrl } });
    res.json({ logo: logoUrl });
  } catch (err) { next(err); }
};

module.exports = { get: getSettings, update: updateSettings, uploadLogo };
