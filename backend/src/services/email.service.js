let resend = null;

function getResend() {
  if (!resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.warn('[Email] RESEND_API_KEY não configurada — emails desativados');
      return null;
    }
    const { Resend } = require('resend');
    resend = new Resend(key);
  }
  return resend;
}

const FROM = () => process.env.EMAIL_FROM || 'TireMax ERP <onboarding@resend.dev>';

const sendWelcome = async ({ name, email, tenantName, trialEndsAt }) => {
  const client = getResend();
  if (!client) return;
  const trialDate = new Date(trialEndsAt).toLocaleDateString('pt-BR');
  try {
    await client.emails.send({
      from: FROM(), to: email,
      subject: `Bem-vindo ao TireMax ERP, ${name}! 🚀`,
      html: `<p>Olá ${name}, sua borracharia <b>${tenantName}</b> foi criada! Trial expira em ${trialDate}.</p>`,
    });
    console.log('[Email] Boas-vindas enviado para:', email);
  } catch (err) {
    console.error('[Email] Erro:', err.message);
  }
};

const sendTrialExpiring = async ({ name, email, tenantName, daysLeft }) => {
  const client = getResend();
  if (!client) return;
  try {
    await client.emails.send({
      from: FROM(), to: email,
      subject: `⚠️ Seu trial expira em ${daysLeft} dias - TireMax ERP`,
      html: `<p>Olá ${name}, o trial da ${tenantName} expira em ${daysLeft} dias.</p>`,
    });
  } catch (err) {
    console.error('[Email] Erro:', err.message);
  }
};

module.exports = { sendWelcome, sendTrialExpiring };