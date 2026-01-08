// Email Templates for ACROXIA
// Design System: Cream/Charcoal, Playfair Display, Editorial style

const baseStyles = `
  body { 
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #FAF8F5;
    margin: 0;
    padding: 0;
    color: #1F1D1B;
    line-height: 1.6;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    background-color: #FFFFFF;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(31, 29, 27, 0.08);
  }
  .header {
    background-color: #1F1D1B;
    padding: 32px;
    text-align: center;
  }
  .logo {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 28px;
    font-weight: 600;
    color: #FAF8F5;
    letter-spacing: 2px;
    margin: 0;
  }
  .content {
    padding: 48px 40px;
  }
  .title {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 28px;
    font-weight: 600;
    color: #1F1D1B;
    margin: 0 0 24px 0;
    text-align: center;
  }
  .text {
    font-size: 16px;
    color: #4A4745;
    margin: 0 0 16px 0;
  }
  .button-container {
    text-align: center;
    margin: 32px 0;
  }
  .button {
    display: inline-block;
    background-color: #1F1D1B;
    color: #FAF8F5 !important;
    padding: 16px 40px;
    border-radius: 50px;
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
    letter-spacing: 0.5px;
  }
  .button:hover {
    background-color: #3A3835;
  }
  .note {
    font-size: 14px;
    color: #7A7775;
    text-align: center;
    margin-top: 24px;
  }
  .divider {
    height: 1px;
    background-color: #E8E6E3;
    margin: 32px 0;
  }
  .footer {
    background-color: #F5F3F0;
    padding: 32px 40px;
    text-align: center;
  }
  .footer-text {
    font-size: 13px;
    color: #7A7775;
    margin: 0 0 8px 0;
  }
  .footer-link {
    color: #1F1D1B;
    text-decoration: none;
  }
  .check-icon {
    display: inline-block;
    width: 20px;
    height: 20px;
    background-color: #22C55E;
    border-radius: 50%;
    margin-right: 12px;
    vertical-align: middle;
  }
  .benefit-item {
    display: flex;
    align-items: center;
    margin: 12px 0;
    font-size: 15px;
  }
  .stats-box {
    background-color: #FAF8F5;
    border-radius: 12px;
    padding: 24px;
    margin: 24px 0;
    text-align: center;
  }
  .stat-number {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 36px;
    font-weight: 600;
    color: #1F1D1B;
  }
  .stat-label {
    font-size: 14px;
    color: #7A7775;
  }
  .warning-box {
    background-color: #FEF3C7;
    border-left: 4px solid #F59E0B;
    padding: 16px;
    border-radius: 0 8px 8px 0;
    margin: 24px 0;
  }
  .success-box {
    background-color: #DCFCE7;
    border-left: 4px solid #22C55E;
    padding: 16px;
    border-radius: 0 8px 8px 0;
    margin: 24px 0;
  }
`;

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@500;600&display=swap" rel="stylesheet">
  <style>${baseStyles}</style>
</head>
<body>
  <div style="padding: 40px 20px; background-color: #FAF8F5;">
    <div class="container">
      <div class="header">
        <h1 class="logo">ACROXIA</h1>
      </div>
      ${content}
      <div class="footer">
        <p class="footer-text">ACROXIA - Tu escudo legal para el alquiler</p>
        <p class="footer-text">
          <a href="mailto:hola@acroxia.com" class="footer-link">hola@acroxia.com</a> | Barcelona
        </p>
        <p class="footer-text" style="margin-top: 16px;">
          © 2026 ACROXIA. Todos los derechos reservados.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export interface EmailData {
  userName?: string;
  email?: string;
  confirmationUrl?: string;
  resetUrl?: string;
  analysisId?: string;
  contractName?: string;
  totalClauses?: number;
  illegalClauses?: number;
  riskLevel?: string;
  creditsRemaining?: number;
}

// Email: Confirmación de cuenta
export const confirmationEmail = (data: EmailData) => ({
  subject: "Confirma tu cuenta en ACROXIA",
  html: baseTemplate(`
    <div class="content">
      <h2 class="title">Bienvenido a ACROXIA</h2>
      <p class="text">Hola${data.userName ? ` ${data.userName}` : ''},</p>
      <p class="text">
        Gracias por registrarte. Solo falta un paso para activar tu cuenta y empezar a proteger tus contratos de alquiler.
      </p>
      <div class="button-container">
        <a href="${data.confirmationUrl}" class="button">Confirmar mi cuenta</a>
      </div>
      <p class="note">
        Este enlace expira en 24 horas. Si no solicitaste esta cuenta, puedes ignorar este email.
      </p>
    </div>
  `)
});

// Email: Bienvenida (después de confirmar)
export const welcomeEmail = (data: EmailData) => ({
  subject: "¡Tu primer análisis te espera!",
  html: baseTemplate(`
    <div class="content">
      <h2 class="title">Hola${data.userName ? ` ${data.userName}` : ''}, ya estás dentro 🎉</h2>
      <p class="text">
        Tu cuenta está activa y lista para proteger tus derechos como inquilino.
      </p>
      <div class="divider"></div>
      <p class="text" style="font-weight: 600; margin-bottom: 16px;">Tu cuenta incluye:</p>
      <div class="benefit-item">
        <span class="check-icon"></span>
        <span>1 análisis de contrato gratis</span>
      </div>
      <div class="benefit-item">
        <span class="check-icon"></span>
        <span>Detección de cláusulas ilegales con IA</span>
      </div>
      <div class="benefit-item">
        <span class="check-icon"></span>
        <span>Referencias legales específicas</span>
      </div>
      <div class="benefit-item">
        <span class="check-icon"></span>
        <span>Cartas de reclamación automáticas</span>
      </div>
      <div class="button-container">
        <a href="https://acroxia.com/dashboard" class="button">Analizar mi contrato</a>
      </div>
      <p class="note">
        ¿Tienes dudas? Responde a este email y te ayudamos.
      </p>
    </div>
  `)
});

// Email: Recuperación de contraseña
export const passwordResetEmail = (data: EmailData) => ({
  subject: "Restablece tu contraseña",
  html: baseTemplate(`
    <div class="content">
      <h2 class="title">Restablecer contraseña</h2>
      <p class="text">Hola${data.userName ? ` ${data.userName}` : ''},</p>
      <p class="text">
        Recibimos una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón para crear una nueva:
      </p>
      <div class="button-container">
        <a href="${data.resetUrl}" class="button">Crear nueva contraseña</a>
      </div>
      <div class="warning-box">
        <p style="margin: 0; font-size: 14px;">
          <strong>Este enlace expira en 1 hora.</strong><br>
          Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña seguirá siendo la misma.
        </p>
      </div>
    </div>
  `)
});

// Email: Contraseña cambiada
export const passwordChangedEmail = (data: EmailData) => ({
  subject: "Tu contraseña ha sido actualizada",
  html: baseTemplate(`
    <div class="content">
      <h2 class="title">Contraseña actualizada</h2>
      <div class="success-box">
        <p style="margin: 0; font-size: 14px;">
          ✅ Tu contraseña ha sido cambiada correctamente.
        </p>
      </div>
      <p class="text">Hola${data.userName ? ` ${data.userName}` : ''},</p>
      <p class="text">
        Te confirmamos que la contraseña de tu cuenta ha sido actualizada el ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.
      </p>
      <div class="warning-box">
        <p style="margin: 0; font-size: 14px;">
          <strong>¿No fuiste tú?</strong><br>
          Si no realizaste este cambio, contacta con nosotros inmediatamente respondiendo a este email.
        </p>
      </div>
      <div class="button-container">
        <a href="https://acroxia.com/login" class="button">Ir a mi cuenta</a>
      </div>
    </div>
  `)
});

// Email: Análisis completado
export const analysisCompletedEmail = (data: EmailData) => ({
  subject: "Tu informe está listo",
  html: baseTemplate(`
    <div class="content">
      <h2 class="title">Análisis completado ✅</h2>
      <p class="text">Hola${data.userName ? ` ${data.userName}` : ''},</p>
      <p class="text">
        Hemos terminado de analizar tu contrato${data.contractName ? ` "${data.contractName}"` : ''}.
      </p>
      <div class="stats-box">
        <div style="display: inline-block; margin: 0 24px;">
          <div class="stat-number">${data.totalClauses || 0}</div>
          <div class="stat-label">Cláusulas analizadas</div>
        </div>
        <div style="display: inline-block; margin: 0 24px;">
          <div class="stat-number" style="color: ${(data.illegalClauses || 0) > 0 ? '#DC2626' : '#22C55E'};">
            ${data.illegalClauses || 0}
          </div>
          <div class="stat-label">Cláusulas ilegales</div>
        </div>
      </div>
      ${(data.illegalClauses || 0) > 0 ? `
        <div class="warning-box">
          <p style="margin: 0; font-size: 14px;">
            <strong>Hemos detectado ${data.illegalClauses} cláusula${data.illegalClauses !== 1 ? 's' : ''} potencialmente ilegal${data.illegalClauses !== 1 ? 'es' : ''}.</strong><br>
            Revisa el informe completo y genera tu carta de reclamación automática.
          </p>
        </div>
      ` : `
        <div class="success-box">
          <p style="margin: 0; font-size: 14px;">
            <strong>¡Buenas noticias!</strong><br>
            No hemos detectado cláusulas ilegales en tu contrato.
          </p>
        </div>
      `}
      <div class="button-container">
        <a href="https://acroxia.com/analisis/${data.analysisId}" class="button">Ver informe completo</a>
      </div>
    </div>
  `)
});

// Email: Recordatorio de créditos bajos
export const lowCreditsEmail = (data: EmailData) => ({
  subject: "Te quedan pocos análisis",
  html: baseTemplate(`
    <div class="content">
      <h2 class="title">Tus créditos se agotan</h2>
      <p class="text">Hola${data.userName ? ` ${data.userName}` : ''},</p>
      <div class="stats-box">
        <div class="stat-number">${data.creditsRemaining || 0}</div>
        <div class="stat-label">análisis restantes</div>
      </div>
      <p class="text">
        Para seguir protegiendo tus contratos, considera ampliar tu plan o comprar análisis adicionales.
      </p>
      <div class="button-container">
        <a href="https://acroxia.com/precios" class="button">Ver planes</a>
      </div>
    </div>
  `)
});

export const getEmailTemplate = (type: string, data: EmailData) => {
  switch (type) {
    case 'confirmation':
      return confirmationEmail(data);
    case 'welcome':
      return welcomeEmail(data);
    case 'password_reset':
      return passwordResetEmail(data);
    case 'password_changed':
      return passwordChangedEmail(data);
    case 'analysis_completed':
      return analysisCompletedEmail(data);
    case 'low_credits':
      return lowCreditsEmail(data);
    default:
      throw new Error(`Unknown email type: ${type}`);
  }
};
