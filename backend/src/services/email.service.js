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
      from: FROM(),
      to: email,
      subject: `Bem-vindo ao TireMax ERP, ${name}! 🚀`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; background: #0f0f0f; color: #fff; padding: 40px;">
          <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 12px; overflow: hidden;">
            <div style="background: #f5c800; padding: 30px; text-align: center;">
              <h1 style="color: #000; margin: 0; font-size: 28px;">⚙️ TIREMAX ERP</h1>
              <p style="color: #000; margin: 8px 0 0; font-size: 14px;">BORRACHARIA</p>
            </div>
            <div style="padding: 40px;">
              <h2 style="color: #f5c800;">Olá, ${name}! 👋</h2>
              <p style="color: #ccc; line-height: 1.6;">
                Sua borracharia <strong style="color: #fff;">${tenantName}</strong> foi cadastrada com sucesso no TireMax ERP.
              </p>
              <div style="background: #252525; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #f5c800;">
                <p style="margin: 0; color: #f5c800; font-weight: bold;">🎁 Período de teste gratuito</p>
                <p style="margin: 8px 0 0; color: #ccc;">Seu trial expira em <strong style="color: #fff;">${trialDate}</strong></p>
              </div>
              <h3 style="color: #f5c800;">O que você pode fazer:</h3>
              <ul style="color: #ccc; line-height: 2;">
                <li>✅ Cadastrar clientes e veículos</li>
                <li>✅ Criar ordens de serviço</li>
                <li>✅ Controlar estoque de pneus</li>
                <li>✅ Gerenciar financeiro</li>
                <li>✅ Emitir relatórios</li>
              </ul>
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://tiremax.vercel.app" style="background: #f5c800; color: #000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                  Acessar o Sistema →
                </a>
              </div>
              <p style="color: #666; font-size: 13px; text-align: center;">
                Dúvidas? Responda este email ou entre em contato pelo WhatsApp.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    console.log('[Email] Boas-vindas enviado para:', email);
  } catch (err) {
    console.error('[Email] Erro ao enviar boas-vindas:', err.message);
  }
};

const sendTrialExpiring = async ({ name, email, tenantName, daysLeft }) => {
  const client = getResend();
  if (!client) return;
  try {
    await client.emails.send({
      from: FROM(),
      to: email,
      subject: `⚠️ Seu trial expira em ${daysLeft} dias - TireMax ERP`,
      html: `
        <body style="font-family: Arial, sans-serif; background: #0f0f0f; padding: 40px;">
          <div style="max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 12px; overflow: hidden;">
            <div style="background: #f5c800; padding: 30px; text-align: center;">
              <h1 style="color: #000; margin: 0;">⚙️ TIREMAX ERP</h1>
            </div>
            <div style="padding: 40px;">
              <h2 style="color: #ff6b35;">⚠️ Seu período gratuito está acabando!</h2>
              <p style="color: #ccc;">Olá ${name}, o trial da <strong>${tenantName}</strong> expira em <strong style="color: #f5c800;">${daysLeft} dias</strong>.</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://tiremax.vercel.app" style="background: #f5c800; color: #000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  Continuar usando →
                </a>
              </div>
            </div>
          </div>
        </body>
      `,
    });
  } catch (err) {
    console.error('[Email] Erro ao enviar aviso de trial:', err.message);
  }
};

module.exports = { sendWelcome, sendTrialExpiring };