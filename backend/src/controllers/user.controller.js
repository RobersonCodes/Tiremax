const bcrypt = require('bcryptjs');
const prisma = require('../config/database');

const findAll = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, phone: true, active: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const findOne = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, role: true, phone: true, active: true },
    });
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { password, ...data } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { ...data, password: hashed },
      select: { id: true, name: true, email: true, role: true },
    });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { password, ...data } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, role: true, phone: true },
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.params.id },
      data: { active: false },
    });
    res.json({ message: 'Usuário desativado' });
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ message: 'Senha atual incorreta' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.params.id }, data: { password: hashed } });
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (err) {
    next(err);
  }
};

module.exports = { findAll, findOne, create, update, remove, changePassword };
