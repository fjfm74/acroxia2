// Campaign email templates for ACROXIA marketing
// Design system: Cream (#FAF8F5) / Charcoal (#1F1D1B), Playfair Display

export interface CampaignTemplate {
  id: string;
  name: string;
  audience: "inquilino" | "propietario" | "profesional";
  subject: string;
  htmlContent: string;
}

const baseStyles = `
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #FAF8F5; margin: 0; padding: 0; color: #1F1D1B; line-height: 1.6; }
  .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(31,29,27,0.08); }
  .header { background-color: #1F1D1B; padding: 32px; text-align: center; }
  .logo { font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 600; color: #FAF8F5; letter-spacing: 2px; margin: 0; }
  .content { padding: 48px 40px; }
  .title { font-family: 'Playfair Display', Georgia, serif; font-size: 28px; font-weight: 600; color: #1F1D1B; margin: 0 0 24px 0; text-align: center; }
  .text { font-size: 16px; color: #4A4745; margin: 0 0 16px 0; }
  .button-container { text-align: center; margin: 32px 0; }
  .button { display: inline-block; background-color: #1F1D1B; color: #FAF8F5 !important; padding: 16px 40px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 0.5px; }
  .divider { height: 1px; background-color: #E8E6E3; margin: 32px 0; }
  .footer { background-color: #F5F3F0; padding: 32px 40px; text-align: center; }
  .footer-text { font-size: 13px; color: #7A7775; margin: 0 0 8px 0; }
  .footer-link { color: #1F1D1B; text-decoration: none; }
  .stats-box { background-color: #FAF8F5; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center; }
  .check-icon { display: inline-block; width: 20px; height: 20px; background-color: #22C55E; border-radius: 50%; margin-right: 12px; vertical-align: middle; }
  .benefit-item { display: flex; align-items: center; margin: 12px 0; font-size: 15px; }
  .warning-box { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0; }
  .success-box { background-color: #DCFCE7; border-left: 4px solid #22C55E; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0; }
`;

export const wrapInBaseTemplate = (content: string, unsubscribeUrl?: string): string => `
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
          <a href="mailto:contacto@acroxia.com" class="footer-link">contacto@acroxia.com</a> | Barcelona
        </p>
        <p class="footer-text" style="margin-top: 16px;">© 2026 ACROXIA. Todos los derechos reservados.</p>
        ${unsubscribeUrl ? `<p class="footer-text" style="margin-top: 12px;"><a href="${unsubscribeUrl}" style="color: #7A7775; font-size: 12px;">Darme de baja</a></p>` : ''}
      </div>
    </div>
  </div>
</body>
</html>
`;

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  // Inquilino templates
  {
    id: "inquilino_bienvenida",
    name: "Bienvenida al blog",
    audience: "inquilino",
    subject: "Bienvenido a ACROXIA: tu escudo legal para el alquiler",
    htmlContent: `
      <div class="content">
        <h2 class="title">Protege tus derechos como inquilino</h2>
        <p class="text">Hola,</p>
        <p class="text">
          Gracias por unirte a la comunidad ACROXIA. Somos una plataforma de inteligencia legal que analiza contratos de alquiler con IA para detectar cláusulas abusivas y proteger tus derechos.
        </p>
        <p class="text" style="font-weight: 600;">¿Sabías que el 67% de los contratos de alquiler contienen cláusulas ilegales?</p>
        <div class="button-container">
          <a href="https://acroxia.com/analizar-gratis" class="button">Analiza tu contrato gratis</a>
        </div>
        <div class="divider"></div>
        <p class="text" style="font-weight: 600; margin-bottom: 16px;">Con ACROXIA puedes:</p>
        <div class="benefit-item"><span class="check-icon"></span><span>Detectar cláusulas ilegales en minutos</span></div>
        <div class="benefit-item"><span class="check-icon"></span><span>Obtener referencias legales específicas</span></div>
        <div class="benefit-item"><span class="check-icon"></span><span>Generar cartas de reclamación automáticas</span></div>
        <p class="text" style="margin-top: 24px;">Si tienes alguna duda, responde a este email y te ayudamos.</p>
      </div>
    `,
  },
  {
    id: "inquilino_tip_semanal",
    name: "Tip semanal inquilino",
    audience: "inquilino",
    subject: "3 cláusulas que siempre debes revisar antes de firmar",
    htmlContent: `
      <div class="content">
        <h2 class="title">Tip legal de la semana</h2>
        <p class="text">Hola,</p>
        <p class="text">
          Esta semana queremos compartirte las 3 cláusulas más problemáticas que encontramos en contratos de alquiler:
        </p>
        <div class="stats-box" style="text-align: left;">
          <p style="margin: 0 0 12px 0; font-weight: 600;">1. Penalización por desistimiento</p>
          <p style="margin: 0; font-size: 14px; color: #4A4745;">El límite legal es 1 mes por año pendiente. Si tu contrato dice otra cosa, es ilegal.</p>
        </div>
        <div class="stats-box" style="text-align: left;">
          <p style="margin: 0 0 12px 0; font-weight: 600;">2. Actualización de renta</p>
          <p style="margin: 0; font-size: 14px; color: #4A4745;">En 2026, el límite es el IRAV (máximo 2-3%). Subidas del IPC+2% son ilegales.</p>
        </div>
        <div class="stats-box" style="text-align: left;">
          <p style="margin: 0 0 12px 0; font-weight: 600;">3. Reparaciones</p>
          <p style="margin: 0; font-size: 14px; color: #4A4745;">Las reparaciones estructurales son obligación del propietario. Si tu contrato dice lo contrario, reclama.</p>
        </div>
        <div class="button-container">
          <a href="https://acroxia.com/analizar-gratis" class="button">Analiza tu contrato ahora</a>
        </div>
      </div>
    `,
  },
  // Propietario templates
  {
    id: "propietario_novedades_lau",
    name: "Novedades LAU 2026",
    audience: "propietario",
    subject: "Cambios legales 2026 que afectan a tu contrato de alquiler",
    htmlContent: `
      <div class="content">
        <h2 class="title">Novedades legales para propietarios</h2>
        <p class="text">Hola,</p>
        <p class="text">
          La normativa de alquiler evoluciona constantemente. Te resumimos los cambios más relevantes de 2026 que pueden afectar a tus contratos:
        </p>
        <div class="warning-box">
          <p style="margin: 0; font-size: 14px;">
            <strong>Nuevo índice IRAV:</strong> Sustituye al IPC como referencia para actualizar rentas. El límite se mantiene en torno al 2-3%.
          </p>
        </div>
        <div class="stats-box" style="text-align: left;">
          <p style="margin: 0 0 12px 0; font-weight: 600;">Zonas tensionadas</p>
          <p style="margin: 0; font-size: 14px; color: #4A4745;">Se amplían las zonas declaradas tensionadas. Verifica si tu inmueble está afectado y qué implica para la renta.</p>
        </div>
        <div class="stats-box" style="text-align: left;">
          <p style="margin: 0 0 12px 0; font-weight: 600;">Grandes tenedores</p>
          <p style="margin: 0; font-size: 14px; color: #4A4745;">Nuevas obligaciones para propietarios con 5+ viviendas en zonas tensionadas.</p>
        </div>
        <div class="button-container">
          <a href="https://acroxia.com/blog" class="button">Leer más en el blog</a>
        </div>
      </div>
    `,
  },
  {
    id: "propietario_herramientas",
    name: "Herramientas para propietarios",
    audience: "propietario",
    subject: "Gestiona tus contratos de alquiler con ACROXIA",
    htmlContent: `
      <div class="content">
        <h2 class="title">Tu panel de propietario en ACROXIA</h2>
        <p class="text">Hola,</p>
        <p class="text">
          ACROXIA no solo es para inquilinos. Como propietario, tienes acceso a herramientas diseñadas para gestionar tus contratos de forma profesional y conforme a la ley:
        </p>
        <div class="benefit-item"><span class="check-icon"></span><span>Análisis de contratos para verificar cumplimiento legal</span></div>
        <div class="benefit-item"><span class="check-icon"></span><span>Generador de contratos con plantillas actualizadas</span></div>
        <div class="benefit-item"><span class="check-icon"></span><span>Gestión de fianzas y recordatorios de vencimiento</span></div>
        <div class="benefit-item"><span class="check-icon"></span><span>Alertas sobre cambios normativos relevantes</span></div>
        <div class="button-container">
          <a href="https://acroxia.com/propietarios" class="button">Descubrir funcionalidades</a>
        </div>
        <p class="text" style="text-align: center; margin-top: 16px;">
          ¿Prefieres que te lo expliquemos? <a href="https://acroxia.com/contacto" style="color: #1F1D1B;">Contacta con nosotros</a>.
        </p>
      </div>
    `,
  },
  // Profesional templates
  {
    id: "profesional_primer_contacto",
    name: "Primer contacto B2B",
    audience: "profesional",
    subject: "Inteligencia legal automatizada para profesionales del alquiler",
    htmlContent: `
      <div class="content">
        <h2 class="title">Automatiza el análisis legal de contratos</h2>
        <p class="text">Estimados profesionales,</p>
        <p class="text">
          Somos ACROXIA, una plataforma de inteligencia legal que utiliza IA para analizar contratos de alquiler y detectar cláusulas problemáticas en segundos.
        </p>
        <p class="text">
          Nuestro objetivo es compartir con vosotros información relevante sobre la normativa de alquiler y cómo la tecnología puede optimizar el trabajo de gestorías, inmobiliarias y administradores de fincas.
        </p>
        <div class="divider"></div>
        <p class="text" style="font-weight: 600;">¿Qué ofrecemos a profesionales?</p>
        <div class="benefit-item"><span class="check-icon"></span><span>Análisis masivo de contratos con marca blanca</span></div>
        <div class="benefit-item"><span class="check-icon"></span><span>Base legal actualizada (LAU, decretos autonómicos, BOE)</span></div>
        <div class="benefit-item"><span class="check-icon"></span><span>API de integración con vuestros sistemas</span></div>
        <div class="benefit-item"><span class="check-icon"></span><span>Informes personalizados con vuestra marca</span></div>
        <div class="button-container">
          <a href="https://acroxia.com/profesionales/gestorias" class="button">Más información</a>
        </div>
        <p class="text" style="font-size: 14px; color: #7A7775; text-align: center;">
          Este email es meramente informativo. Podéis daros de baja en cualquier momento.
        </p>
      </div>
    `,
  },
  {
    id: "profesional_oferta",
    name: "Oferta profesional",
    audience: "profesional",
    subject: "Plan Pro ACROXIA: análisis ilimitados para tu despacho",
    htmlContent: `
      <div class="content">
        <h2 class="title">Plan Profesional ACROXIA</h2>
        <p class="text">Hola,</p>
        <p class="text">
          Sabemos que la revisión manual de contratos consume horas de trabajo. Con el Plan Pro de ACROXIA, tu equipo puede analizar contratos en segundos:
        </p>
        <div class="stats-box" style="background: linear-gradient(135deg, #1F1D1B 0%, #3A3835 100%); color: #FAF8F5; padding: 32px;">
          <p style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.8;">Plan Profesional</p>
          <p style="margin: 0 0 4px 0; font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 600;">Desde 49€/mes</p>
          <p style="margin: 0; opacity: 0.7; font-size: 14px;">Análisis ilimitados · Marca blanca · Soporte prioritario</p>
        </div>
        <div class="benefit-item"><span class="check-icon"></span><span>Análisis ilimitados de contratos</span></div>
        <div class="benefit-item"><span class="check-icon"></span><span>Informes con tu logo y marca</span></div>
        <div class="benefit-item"><span class="check-icon"></span><span>Gestión de clientes integrada</span></div>
        <div class="benefit-item"><span class="check-icon"></span><span>Soporte técnico prioritario</span></div>
        <div class="button-container">
          <a href="https://acroxia.com/precios" class="button">Ver planes y precios</a>
        </div>
      </div>
    `,
  },
];

export const getTemplatesByAudience = (audience: string): CampaignTemplate[] => {
  if (audience === "all") return CAMPAIGN_TEMPLATES;
  return CAMPAIGN_TEMPLATES.filter((t) => t.audience === audience);
};
