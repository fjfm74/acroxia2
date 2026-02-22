

# Plan: Mejora de captacion de leads y CTR

## Diagnostico actual

El sitio tiene un problema doble:

1. **CTR organico muy bajo (0.45%)**: 3,550 impresiones pero solo 16 clics. Los title tags y meta descriptions no generan suficiente curiosidad/urgencia para que el usuario haga clic.
2. **0 leads capturados**: De los pocos usuarios que llegan, ninguno deja su email. El modal de captura solo aparece tras 45 segundos en la pagina de resultados (y casi nadie llega ahi). No hay ningun otro mecanismo de captura en todo el sitio.

## Acciones propuestas

### 1. Mejorar CTR con mejores titles y descriptions (SEO on-page)

Reescribir los meta tags de las paginas clave para hacerlos mas atractivos en los SERPs, usando numeros, urgencia y beneficio directo:

| Pagina | Title actual | Title propuesto |
|--------|-------------|-----------------|
| Home | "ACROXIA - Analiza tu Contrato de Alquiler con IA \| Detecta Clausulas Abusivas" | "Analiza tu Contrato de Alquiler con IA en 2 min \| ACROXIA" |
| /analizar-gratis | "Analiza tu Contrato de Alquiler Gratis con IA \| ACROXIA" | "Analiza tu Contrato Gratis: Detecta Clausulas Ilegales en 2 min" |
| /propietarios | Revisar y optimizar | "Propietarios: Verifica que tu Contrato Cumple la LAU 2026 \| ACROXIA" |
| Guias SEO | Revisar titles para incluir fechas (2026) y datos concretos | Anadir "[Actualizado 2026]" y cifras concretas |

Las descriptions se reescribiran con formato: **beneficio + dato + CTA**.

### 2. Exit-intent popup para captar emails antes de que se vayan

Crear un componente `ExitIntentCapture` que detecte cuando el raton sale de la ventana (desktop) o tras 30s de inactividad (movil):

- Se muestra solo 1 vez por sesion (controlado con sessionStorage)
- Copy directo: "Antes de irte... Tu contrato podria tener clausulas ilegales"
- Solo pide email + consentimiento
- Guarda el lead en la tabla `leads` con source = "exit_intent"
- Se incluye en las paginas de blog, guias SEO y la Home

### 3. CTA flotante en paginas de blog y guias SEO

Anadir un banner sticky en la parte inferior de los posts de blog y guias:

- Aparece tras hacer scroll del 40% del contenido
- Copy: "Tiene tu contrato clausulas como estas? Analizalo gratis"
- Boton directo a `/analizar-gratis`
- Se puede cerrar y no vuelve a aparecer en esa sesion

### 4. Lead magnet en la sidebar del blog

Anadir un formulario de email en la sidebar de los posts que ofrezca algo concreto:

- "Recibe nuestra guia: 5 clausulas ilegales mas comunes en 2026"
- Solo pide email
- Guarda en `leads` con source = "blog_lead_magnet"

### 5. Reducir friccion en el LeadCaptureModal existente

El modal actual pide demasiados datos y tarda 45s en aparecer:

- Reducir el delay de 45s a 15s
- Hacer que el campo "situacion" sea opcional (no bloquee el envio)
- Mejorar el copy del boton: de "Activar recordatorio" a "Enviar mi resumen gratis"

### 6. CTA inline contextual en la Home (seccion Stats)

Tras la seccion de estadisticas, anadir un CTA intermedio antes de "Como funciona":

- "Unete a los +2,800 inquilinos que ya analizaron su contrato"
- Input de email inline + boton "Analizar gratis"
- Al hacer submit, guarda email como lead y redirige a `/analizar-gratis`

---

## Detalle tecnico

### Archivos a crear
- `src/components/ExitIntentCapture.tsx` - Popup de exit-intent con deteccion de mouseout/inactividad
- `src/components/blog/StickyBottomCTA.tsx` - Banner sticky para blog/guias

### Archivos a modificar
- `src/pages/Index.tsx` - Mejorar SEO title/description, anadir ExitIntentCapture y CTA inline
- `src/pages/AnalyzePublic.tsx` - Mejorar meta tags
- `src/pages/Propietarios.tsx` - Mejorar meta tags
- `src/pages/FreeResultPreview.tsx` - Reducir delay del modal de 45s a 15s
- `src/components/LeadCaptureModal.tsx` - Hacer contract_status opcional, mejorar CTA text
- `src/pages/BlogPost.tsx` - Anadir ExitIntentCapture y StickyBottomCTA
- `src/components/landing/HeroSection.tsx` - Anadir micro-texto de urgencia
- `src/components/blog/BlogSidebar.tsx` - Anadir lead magnet form
- Varias paginas SEO - Actualizar titles con "[2026]"

### Base de datos
- Sin cambios de schema necesarios. La tabla `leads` ya soporta los campos `source`, `email`, `utm_*`

### Metricas esperadas
- CTR: de 0.45% a 1.5-2.5% con mejores titles
- Leads: de 0 a capturas recurrentes con 4 puntos de contacto nuevos (exit-intent, sticky CTA, sidebar, modal mejorado)

