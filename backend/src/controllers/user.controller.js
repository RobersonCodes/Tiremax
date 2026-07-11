const bcrypt = require('bcryptjs');
const prisma = require('../config/database');

const findAll = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { tenantId: req.tenantId },
      select: { id: true, name: true, email: true, role: true, phone: true, active: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) { next(err); }
};

const findOne = async (req, res, next) => {
  try {
    const user = await prisma.user.findFirst({
      where: { id: req.params.id, tenantId: req.tenantId },
      select: { id: true, name: true, email: true, role: true, phone: true, active: true },
    });
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    res.json(user);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { tenantId: req.tenantId, name, email, password: hashed, role, phone },
      select: { id: true, name: true, email: true, role: true, phone: true, active: true },
    });
    res.status(201).json(user);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { password, ...data } = req.body;
    if (password) data.password = await bcrypt.hash(password, 10);
    const result = await prisma.user.updateMany({ where: { id: req.params.id, tenantId: req.tenantId }, data });
    if (!result.count) return res.status(404).json({ message: 'Usuário não encontrado' });
    res.json(await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, name: true, email: true, role: true, phone: true, active: true } }));
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await prisma.user.updateMany({ where: { id: req.params.id, tenantId: req.tenantId }, data: { active: false } });
    res.json({ message: 'Usuário desativado' });
  } catch (err) { next(err); }
};

module.exports = { findAll, findOne, create, update, remove };
