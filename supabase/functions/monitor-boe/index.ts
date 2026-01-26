import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to send error alerts
async function sendErrorAlert(error: string, context: Record<string, any>): Promise<void> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  try {
    await fetch(`${supabaseUrl}/functions/v1/send-alert-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        process: "monitor-boe",
        processName: "Monitor BOE",
        error,
        context,
      }),
    });
    console.log("Alert email sent for monitor-boe error");
  } catch (alertError) {
    console.error("Failed to send alert email:", alertError);
  }
}

// Términos de búsqueda por defecto (se pueden configurar en site_config)
const DEFAULT_SEARCH_TERMS = [
  "arrendamiento", "alquiler", "vivienda", "LAU", "fianza", 
  "inquilino", "arrendatario", "arrendador", "renta", "desahucio"
];

const DEFAULT_SECTIONS = ["I", "III"];
const DEFAULT_NOTIFICATION_EMAIL = "nuriafrancis@gmail.com";

interface BOEItem {
  id: string;
  titulo: string;
  urlPdf?: string;
  urlHtml?: string;
  seccion?: string;
  departamento?: string;
  fechaPublicacion?: string;
}

interface BOEPublication {
  boe_id: string;
  title: string;
  publication_date: string;
  pdf_url: string | null;
  boe_url: string | null;
  section: string | null;
  department: string | null;
  summary: string | null;
}

interface MonitoringConfig {
  enabled: boolean;
  notification_emails: string[];
  search_terms: string[];
  sections: string[];
}

// Formatear fecha para la API del BOE (aaaammdd)
function formatDateForBOE(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// Verificar si el contenido es relevante según los términos de búsqueda
function isRelevant(text: string, searchTerms: string[]): boolean {
  const normalizedText = text.toLowerCase();
  return searchTerms.some(term => normalizedText.includes(term.toLowerCase()));
}

// Consultar el sumario del BOE para una fecha específica
async function fetchBOESummary(date: string): Promise<any> {
  const url = `https://www.boe.es/datosabiertos/api/boe/sumario/${date}`;
  console.log(`Fetching BOE summary from: ${url}`);
  
  const response = await fetch(url, {
    headers: { 
      "Accept": "application/json",
      "User-Agent": "ACROXIA-BOE-Monitor/1.0"
    }
  });
  
  if (!response.ok) {
    throw new Error(`BOE API error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

// Buscar en legislación consolidada
async function fetchLegislationSearch(query: string): Promise<any> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.boe.es/datosabiertos/api/legislacion-consolidada?query=${encodedQuery}&limit=50`;
  console.log(`Fetching legislation search from: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: { 
        "Accept": "application/json",
        "User-Agent": "ACROXIA-BOE-Monitor/1.0"
      }
    });
    
    if (!response.ok) {
      console.warn(`Legislation search error: ${response.status}`);
      return { data: [] };
    }
    
    return response.json();
  } catch (error) {
    console.warn("Legislation search failed:", error);
    return { data: [] };
  }
}

// Extraer publicaciones del sumario del BOE
function extractPublicationsFromSummary(
  summaryData: any, 
  searchTerms: string[], 
  sections: string[]
): BOEPublication[] {
  const publications: BOEPublication[] = [];
  
  try {
    const data = summaryData?.data?.sumario;
    if (!data) {
      console.log("No summary data found");
      return publications;
    }
    
    const metaInfo = data.metaInfo || {};
    const publicationDate = metaInfo.fechaPublicacion || new Date().toISOString().split('T')[0];
    
    // Recorrer secciones del sumario
    const diario = data.diario || [];
    for (const seccion of diario) {
      const seccionId = seccion.seccion?.codigo || "";
      
      // Filtrar por secciones configuradas
      if (sections.length > 0 && !sections.includes(seccionId)) {
        continue;
      }
      
      const items = seccion.items || seccion.departamentos || [];
      for (const item of items) {
        const subItems = item.items || item.epigrafes || [item];
        
        for (const subItem of subItems) {
          const entries = subItem.items || [subItem];
          
          for (const entry of entries) {
            const titulo = entry.titulo || entry.title || "";
            const id = entry.id || entry.identificador || "";
            
            if (!titulo || !id) continue;
            
            // Verificar relevancia
            if (isRelevant(titulo, searchTerms)) {
              publications.push({
                boe_id: id,
                title: titulo,
                publication_date: publicationDate,
                pdf_url: entry.urlPdf || `https://www.boe.es/boe/dias/${publicationDate.replace(/-/g, '/')}/pdfs/${id}.pdf`,
                boe_url: entry.urlHtml || `https://www.boe.es/diario_boe/txt.php?id=${id}`,
                section: seccionId,
                department: item.departamento || entry.departamento || null,
                summary: entry.control || entry.titulo?.substring(0, 500) || null
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error extracting publications:", error);
  }
  
  return publications;
}

// Generar HTML del email de notificación
function generateEmailHTML(publications: BOEPublication[], date: string): string {
  const publicationsList = publications.map((pub, index) => `
    <tr style="border-bottom: 1px solid #E5E2DE;">
      <td style="padding: 20px;">
        <div style="font-size: 12px; color: #8B8680; margin-bottom: 8px;">
          ${pub.boe_id} · ${pub.section ? `Sección ${pub.section}` : 'Sin sección'} · ${pub.department || 'Sin departamento'}
        </div>
        <h3 style="font-family: 'Playfair Display', Georgia, serif; font-size: 18px; color: #1F1D1B; margin: 0 0 12px 0; line-height: 1.4;">
          ${pub.title}
        </h3>
        ${pub.summary ? `<p style="font-size: 14px; color: #5C5752; margin: 0 0 16px 0; line-height: 1.5;">${pub.summary.substring(0, 200)}...</p>` : ''}
        <div style="display: flex; gap: 12px;">
          ${pub.pdf_url ? `
            <a href="${pub.pdf_url}" style="display: inline-block; background-color: #1F1D1B; color: #FAF8F5; padding: 10px 20px; border-radius: 50px; text-decoration: none; font-size: 14px; font-weight: 500;">
              📄 Descargar PDF
            </a>
          ` : ''}
          ${pub.boe_url ? `
            <a href="${pub.boe_url}" style="display: inline-block; background-color: transparent; color: #1F1D1B; padding: 10px 20px; border-radius: 50px; text-decoration: none; font-size: 14px; font-weight: 500; border: 1px solid #1F1D1B;">
              Ver en BOE
            </a>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #F5F3F0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #FAF8F5;">
        <!-- Header -->
        <div style="background-color: #1F1D1B; padding: 32px; text-align: center;">
          <h1 style="font-family: 'Playfair Display', Georgia, serif; color: #FAF8F5; font-size: 24px; margin: 0; font-weight: 500;">
            ACROXIA
          </h1>
          <p style="color: #A8A49E; font-size: 12px; margin: 8px 0 0 0; letter-spacing: 2px;">
            ALERTA BOE
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 32px;">
          <div style="background-color: #E8F5E9; border-left: 4px solid #22C55E; padding: 16px 20px; margin-bottom: 24px;">
            <p style="margin: 0; color: #1F1D1B; font-size: 16px;">
              <strong>${publications.length}</strong> ${publications.length === 1 ? 'nueva publicación encontrada' : 'nuevas publicaciones encontradas'}
            </p>
            <p style="margin: 4px 0 0 0; color: #5C5752; font-size: 14px;">
              Fecha de consulta: ${date}
            </p>
          </div>
          
          <table style="width: 100%; border-collapse: collapse;">
            ${publicationsList}
          </table>
          
          <div style="margin-top: 32px; padding: 20px; background-color: #F5F3F0; border-radius: 12px;">
            <p style="margin: 0; font-size: 14px; color: #5C5752; text-align: center;">
              Revisa estas publicaciones y decide si deben procesarse para la base de conocimiento legal de ACROXIA.
            </p>
            <div style="text-align: center; margin-top: 16px;">
              <a href="https://acroxia.com/admin/boe" style="display: inline-block; background-color: #1F1D1B; color: #FAF8F5; padding: 12px 24px; border-radius: 50px; text-decoration: none; font-size: 14px; font-weight: 500;">
                Ir al Panel de Administración
              </a>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #F5F3F0; padding: 24px; text-align: center;">
          <p style="margin: 0; font-size: 12px; color: #8B8680;">
            Este email fue generado automáticamente por el sistema de monitorización del BOE de ACROXIA.
          </p>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #8B8680;">
            © 2026 ACROXIA. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  let source = "manual";
  try {
    const body = await req.json();
    source = body.source || "manual";
  } catch {
    // No body provided
  }
  
  console.log(`BOE Monitor started - Source: ${source}`);
  
  const logEntry: any = {
    source,
    success: false,
    publications_found: 0,
    new_publications: 0,
    retry_pending: false
  };
  
  try {
    // 1. Obtener configuración desde site_config
    const { data: configData } = await supabase
      .from("site_config")
      .select("value")
      .eq("key", "boe_monitoring_config")
      .single();
    
    const config: MonitoringConfig = configData?.value || {
      enabled: true,
      notification_emails: [DEFAULT_NOTIFICATION_EMAIL],
      search_terms: DEFAULT_SEARCH_TERMS,
      sections: DEFAULT_SECTIONS
    };
    
    if (!config.enabled) {
      console.log("BOE monitoring is disabled");
      logEntry.success = true;
      logEntry.error_message = "Monitoring disabled in config";
      await supabase.from("boe_monitoring_logs").insert(logEntry);
      return new Response(JSON.stringify({ message: "Monitoring disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // 2. Consultar el sumario del BOE para hoy
    const today = new Date();
    const dateForBOE = formatDateForBOE(today);
    const dateFormatted = today.toISOString().split('T')[0];
    
    console.log(`Checking BOE for date: ${dateForBOE}`);
    
    let summaryData;
    try {
      summaryData = await fetchBOESummary(dateForBOE);
    } catch (error) {
      // Si falla, intentar con el día anterior (el sumario de hoy puede no estar disponible todavía)
      console.log("Today's summary not available, trying yesterday...");
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      summaryData = await fetchBOESummary(formatDateForBOE(yesterday));
    }
    
    // 3. Extraer publicaciones relevantes
    const publications = extractPublicationsFromSummary(
      summaryData, 
      config.search_terms, 
      config.sections
    );
    
    console.log(`Found ${publications.length} relevant publications`);
    logEntry.publications_found = publications.length;
    
    // 4. También buscar en legislación consolidada
    const legislationResults = await fetchLegislationSearch("arrendamiento urbano vivienda");
    // Procesar resultados de legislación si es necesario
    
    // 5. Filtrar publicaciones que ya existen en la base de datos
    const existingBoeIds = await supabase
      .from("boe_publications")
      .select("boe_id")
      .in("boe_id", publications.map(p => p.boe_id));
    
    const existingIds = new Set((existingBoeIds.data || []).map(r => r.boe_id));
    const newPublications = publications.filter(p => !existingIds.has(p.boe_id));
    
    console.log(`${newPublications.length} are new publications`);
    logEntry.new_publications = newPublications.length;
    
    // 6. Insertar nuevas publicaciones
    if (newPublications.length > 0) {
      const { error: insertError } = await supabase
        .from("boe_publications")
        .insert(newPublications.map(pub => ({
          ...pub,
          status: "pending_review"
        })));
      
      if (insertError) {
        console.error("Error inserting publications:", insertError);
        throw insertError;
      }
      
      // 7. Enviar email de notificación usando fetch a Resend directamente
      if (resendApiKey) {
        const emailHtml = generateEmailHTML(newPublications, dateFormatted);
        const subject = `🔔 BOE Alert: ${newPublications.length} ${newPublications.length === 1 ? 'nueva publicación' : 'nuevas publicaciones'} sobre arrendamiento - ${dateFormatted}`;
        
        for (const email of config.notification_emails) {
          try {
            const emailResponse = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${resendApiKey}`
              },
              body: JSON.stringify({
                from: "ACROXIA BOE Monitor <alertas@acroxia.com>",
                to: [email],
                reply_to: "contacto@acroxia.com",
                subject: subject,
                html: emailHtml
              })
            });
            
            if (emailResponse.ok) {
              console.log(`Email sent to ${email}`);
            } else {
              const errorData = await emailResponse.text();
              console.error(`Failed to send email to ${email}:`, errorData);
            }
          } catch (emailError) {
            console.error(`Failed to send email to ${email}:`, emailError);
          }
        }
        
        // Actualizar notified_at para las publicaciones insertadas
        await supabase
          .from("boe_publications")
          .update({ notified_at: new Date().toISOString() })
          .in("boe_id", newPublications.map(p => p.boe_id));
      } else {
        console.warn("RESEND_API_KEY not configured, skipping email notification");
      }
    }
    
    logEntry.success = true;
    
    // 8. Registrar log de monitorización
    await supabase.from("boe_monitoring_logs").insert(logEntry);
    
    return new Response(JSON.stringify({
      success: true,
      date: dateFormatted,
      publications_found: publications.length,
      new_publications: newPublications.length,
      message: newPublications.length > 0 
        ? `Found ${newPublications.length} new publications` 
        : "No new publications found"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
    
  } catch (error: any) {
    console.error("BOE Monitor error:", error);
    
    logEntry.error_message = error.message || "Unknown error";
    logEntry.retry_pending = true;
    
    // Programar reintento en la siguiente ejecución
    const nextRetry = new Date();
    nextRetry.setHours(nextRetry.getHours() + 3); // Reintentar en 3 horas
    logEntry.next_retry_at = nextRetry.toISOString();
    
    await supabase.from("boe_monitoring_logs").insert(logEntry);
    
    // Send alert email to admin
    await sendErrorAlert(error.message || "Unknown error", {
      attempted_at: new Date().toISOString(),
      retry_scheduled_at: logEntry.next_retry_at,
      source,
    });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      retry_scheduled: true
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}

serve(handler);
