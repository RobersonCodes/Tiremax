const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/database');
const { sendPasswordReset } = require('../services/email.service');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email e senha são obrigatórios' });

    const user = await prisma.user.findFirst({
      where: { email, active: true },
      include: { tenant: true },
    });

    if (!user) return res.status(401).json({ message: 'Credenciais inválidas' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: 'Credenciais inválidas' });

    if (user.tenant.status === 'SUSPENDED') {
      return res.status(403).json({ message: 'Conta suspensa. Entre em contato com o suporte.' });
    }

    if (user.tenant.plan === 'TRIAL' && user.tenant.trialEndsAt && new Date() > user.tenant.trialEndsAt) {
      return res.status(403).json({ message: 'Período de teste encerrado. Assine um plano para continuar.' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
      tenant: { id: user.tenant.id, name: user.tenant.name, logo: user.tenant.logo, primaryColor: user.tenant.primaryColor, plan: user.tenant.plan, trialEndsAt: user.tenant.trialEndsAt },
    });
  } catch (err) { next(err); }
};

const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, avatar: true, phone: true, tenantId: true },
    });
    res.json(user);
  } catch (err) { next(err); }
};

const refresh = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token não fornecido' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id }, include: { tenant: true } });
    if (!user || !user.active) return res.status(401).json({ message: 'Usuário inativo' });
    res.json({ token: generateToken(user) });
  } catch (err) { next(err); }
};

const logout = async (req, res) => res.json({ message: 'Logout realizado com sucesso' });

// Sempre responde com sucesso genérico, mesmo se o e-mail não existir,
// para não permitir enumeração de usuários cadastrados.
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'E-mail é obrigatório' });

    const genericResponse = { message: 'Se este e-mail estiver cadastrado, você receberá um link de redefinição.' };

    const user = await prisma.user.findFirst({ where: { email, active: true } });
    if (!user) return res.json(genericResponse);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashedToken, resetTokenExpiry },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/redefinir-senha?token=${rawToken}`;
    await sendPasswordReset({ name: user.name, email: user.email, resetUrl });

    res.json(genericResponse);
  } catch (err) { next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token e nova senha são obrigatórios' });
    if (password.length < 6) return res.status(400).json({ message: 'A senha deve ter no mínimo 6 caracteres' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await prisma.user.findFirst({
      where: { resetToken: hashedToken, resetTokenExpiry: { gt: new Date() } },
    });

    if (!user) return res.status(400).json({ message: 'Link inválido ou expirado. Solicite uma nova redefinição.' });

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, resetToken: null, resetTokenExpiry: null },
    });

    res.json({ message: 'Senha redefinida com sucesso. Faça login com a nova senha.' });
  } catch (err) { next(err); }
};

module.exports = { login, me, refresh, logout, forgotPassword, resetPassword };
