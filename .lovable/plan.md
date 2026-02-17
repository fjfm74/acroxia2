# Panel de Campanas de Email Marketing

## Resumen

Crear un sistema completo de campañas de email marketing dentro del panel de administracion, accesible desde `/admin/marketing/campañas`. Incluye creacion de campañas con plantillas segmentadas (inquilino, propietario, profesional), editor visual, programacion de envios y metricas basicas de apertura/clicks.

## Arquitectura

### 1. Base de datos - Nuevas tablas

**Tabla `email_campaigns**`

- `id` (uuid, PK)
- `name` (text) - Nombre interno de la campana
- `subject` (text) - Asunto del email
- `html_content` (text) - Contenido HTML del email
- `target_audience` (text) - "inquilino", "propietario", "profesional", "all"
- `target_segment` (text, nullable) - Filtro adicional: "gestoria", "inmobiliaria", etc.
- `status` (text) - "draft", "scheduled", "sending", "sent", "cancelled"
- `scheduled_for` (timestamptz, nullable)
- `sent_at` (timestamptz, nullable)
- `total_recipients` (int, default 0)
- `total_sent` (int, default 0)
- `total_opened` (int, default 0)
- `total_clicked` (int, default 0)
- `total_bounced` (int, default 0)
- `created_at`, `updated_at` (timestamptz)

RLS: Solo admins pueden gestionar (`has_role(auth.uid(), 'admin')`).

**Tabla `email_campaign_events**`

- `id` (uuid, PK)
- `campaign_id` (uuid, FK -> email_campaigns)
- `event_type` (text) - "sent", "opened", "clicked", "bounced", "unsubscribed"
- `recipient_email` (text)
- `metadata` (jsonb, nullable) - URL clickeada, user agent, etc.
- `created_at` (timestamptz)

RLS: Solo admins lectura. Insercion publica (para webhooks de tracking).

### 2. Plantillas predefinidas

Se crearan 6 plantillas base almacenadas en el codigo (no en BD) como constantes:

**Inquilino (2 plantillas):**

- "Bienvenida al blog" - Presentacion de ACROXIA y link al analisis gratuito
- "Tip semanal" - Consejo legal con CTA a analizar contrato

**Propietario (2 plantillas):**

- "Novedades LAU 2026" - Actualizaciones normativas relevantes
- "Herramientas para propietarios" - Presentacion de funcionalidades

**Profesional (2 plantillas):**

- "Primer contacto B2B" - Email informativo no publicitario presentando ACROXIA
- "Oferta profesional" - Ventajas del plan Pro para gestorias/inmobiliarias

Todas seguiran el design system de email existente (cream/charcoal, Playfair Display).

### 3. Componentes frontend

**Pagina principal: `AdminCampaigns.tsx**`

- Listado de campanas con estado, fecha, metricas rapidas
- Botones para crear nueva campana
- Filtros por estado y audiencia

**Editor: `AdminCampaignEdit.tsx**`

- Selector de audiencia objetivo (inquilino/propietario/profesional/todos)
- Selector de plantilla base (las 6 predefinidas)
- Editor de asunto
- Editor de contenido HTML con preview en tiempo real
- Selector de segmento B2B (gestoria, inmobiliaria, etc.)
- Programacion: enviar ahora o programar fecha/hora
- Preview del email renderizado
- Contador de destinatarios estimados

**Componente de metricas: `CampaignMetrics.tsx**`

- Open rate, click rate, bounce rate
- Grafico de barras con recharts
- Timeline de envios

### 4. Edge function: `send-campaign`

- Recibe `campaign_id`
- Valida que el usuario es admin
- Consulta destinatarios segun audiencia y segmento:
  - Inquilinos: `blog_subscribers` con audience="inquilino" + `profiles` con user_type="inquilino" y marketing_consent=true
  - Propietarios: idem con audience="propietario"
  - Profesionales: `marketing_contacts` no unsubscribed, filtrado por segmento
  - Todos: union de los tres
- Envia en lotes de 10 con delays de 500ms entre lotes
- Registra eventos en `email_campaign_events`
- Actualiza contadores en `email_campaigns`
- Incluye link de baja en cada email

### 5. Edge function: `track-email-event`

- Endpoint publico (sin auth) para tracking de aperturas y clicks
- Apertura: pixel de tracking 1x1 en el HTML del email
- Click: wrapper de URLs que registra el click y redirige
- Registra en `email_campaign_events`

### 6. Navegacion

- Anadir tab "Campanas" dentro de la pagina `/admin/marketing` usando Tabs de Radix
- Tab 1: CRM Contactos (contenido actual)
- Tab 2: Campanas de Email (nuevo)

Esto evita crear rutas nuevas y mantiene todo el marketing centralizado.

## Secuencia de implementacion

1. Migracion de base de datos (2 tablas + RLS)
2. Plantillas de email predefinidas (constantes en codigo)
3. Edge function `send-campaign` para envio masivo
4. Edge function `track-email-event` para metricas
5. Componentes frontend (listado, editor, metricas)
6. Integracion con tabs en AdminContactsCRM
7. Registro en `supabase/config.toml`

## Detalles tecnicos

- Las plantillas reutilizan los estilos base de `_shared/email-templates.ts`
- El tracking de apertura usa un pixel transparente: `<img src="https://...track-email-event?type=open&cid=X&email=Y" width="1" height="1" />`
- El tracking de clicks wrappea cada link: `https://...track-email-event?type=click&cid=X&email=Y&url=ENCODED_URL` que hace redirect
- El envio respeta el limite de Resend (plan Pro: 50k/mes)
- Preview de destinatarios: query en tiempo real que cuenta los contactos elegibles segun los filtros seleccionados