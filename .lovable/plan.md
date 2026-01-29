

## Auditoría SEO Completa - Estado Actual

### Resumen Ejecutivo

| Componente | Estado | Notas |
|------------|--------|-------|
| **robots.txt** | OK | Apunta al sitemap dinámico, documenta archivos LLM |
| **Sitemap (Edge Function)** | OK | 27 rutas estáticas + posts del blog |
| **Sitemap Cache** | PARCIAL | Le faltan 4 rutas de propietarios |
| **LLM Files Cache** | OK | Actualizado hoy (2026-01-29) |
| **LLM Edge Functions** | OK | Sirven desde caché correctamente |
| **Trigger de regeneración** | OK | Llama a sitemap y LLM al publicar posts |
| **Cron Jobs** | OK | Posts diarios a las 08:00 y 09:00 UTC |

---

### Problema Detectado: Rutas Faltantes en regenerate-sitemap

La Edge Function `regenerate-sitemap/index.ts` tiene **4 rutas de propietarios faltantes** que sí existen en `sitemap/index.ts`:

| Ruta | En `sitemap/` | En `regenerate-sitemap/` |
|------|---------------|--------------------------|
| `/impago-alquiler-propietarios` | Si | **NO** |
| `/zonas-tensionadas-propietarios` | Si | **NO** |
| `/deposito-fianza-propietarios` | Si | **NO** |
| `/fin-contrato-alquiler-propietarios` | Si | **NO** |

**Impacto**: Cuando el trigger regenera el caché del sitemap tras publicar un post, el caché resultante NO incluye estas 4 páginas SEO. Google está recibiendo un sitemap incompleto desde el caché.

---

### Solución Requerida

Sincronizar la lista de `staticRoutes` en `regenerate-sitemap/index.ts` con la de `sitemap/index.ts`:

```typescript
// Añadir las 4 rutas faltantes después de /contrato-alquiler-propietarios
{ loc: "/impago-alquiler-propietarios", priority: "0.8", changefreq: "monthly" },
{ loc: "/zonas-tensionadas-propietarios", priority: "0.8", changefreq: "monthly" },
{ loc: "/deposito-fianza-propietarios", priority: "0.8", changefreq: "monthly" },
{ loc: "/fin-contrato-alquiler-propietarios", priority: "0.8", changefreq: "monthly" },
```

---

### Estado Detallado por Componente

#### 1. robots.txt (public/robots.txt)
- Permite bots principales (Googlebot, Bingbot, Twitterbot, etc.)
- Bloquea rutas privadas (/dashboard, /admin/, /pro/)
- Apunta al sitemap dinámico: `https://vmloiamemddwxyyunphz.supabase.co/functions/v1/sitemap`
- Documenta archivos LLM (estáticos y dinámicos)

#### 2. Archivos LLM Estáticos (public/llms.txt y llms-full.txt)
- Contienen información básica de ACROXIA
- Incluyen link prominente a las versiones dinámicas
- Sirven como punto de descubrimiento para crawlers de LLMs

#### 3. Edge Functions LLM (llms/ y llms-full/)
- Implementan estrategia **cache-first**: leen de `llm_files_cache` primero
- Si no hay caché, generan en tiempo real
- El caché muestra fecha de hoy: `2026-01-29`
- Incluyen posts separados por audiencia (inquilinos/propietarios)

#### 4. Caché LLM (tabla llm_files_cache)
- Contenido actualizado: 2026-01-29
- Incluye los últimos posts del blog correctamente:
  - 5 posts de inquilinos
  - 5 posts de propietarios
- Se regenera automáticamente al publicar posts (trigger)

#### 5. Sitemap Edge Function (sitemap/)
- 27 rutas estáticas incluyendo TODAS las páginas de propietarios
- Añade dinámicamente los posts del blog publicados
- Usa estrategia cache-first desde `sitemap_cache`

#### 6. Regenerate Sitemap (regenerate-sitemap/)
- Genera y guarda el sitemap en `sitemap_cache`
- **PROBLEMA**: Solo tiene 23 rutas estáticas (faltan 4 de propietarios)
- Se ejecuta automáticamente al publicar posts

#### 7. Trigger de Base de Datos
- Nombre: `on_blog_post_change_regenerate_sitemap`
- Función: `trigger_sitemap_regeneration`
- Se activa en INSERT/UPDATE/DELETE de posts publicados
- Llama a AMBAS Edge Functions: `regenerate-sitemap` y `regenerate-llm-files`

#### 8. Cron Jobs Activos
| Job ID | Función | Horario (UTC) |
|--------|---------|---------------|
| 8 | schedule-daily-post (inquilinos) | 08:00 diario |
| 9 | schedule-daily-post-landlord | 09:00 diario |
| 3 | send-nurturing-emails | 10:00 diario |
| 4,5,6 | monitor-boe | 09:00, 12:00, 22:00 |
| 7 | cleanup-contracts | 03:00 diario |

---

### Resumen de Posts en Blog

| Audiencia | Posts Publicados |
|-----------|------------------|
| Inquilinos | 25 |
| Propietarios | 15 |
| **Total** | **40** |

---

### Acciones a Implementar

1. **Sincronizar rutas en regenerate-sitemap**: Añadir las 4 rutas de propietarios faltantes
2. **Forzar regeneración del sitemap**: Una vez desplegada la corrección, invocar manualmente `regenerate-sitemap` para actualizar el caché

---

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/regenerate-sitemap/index.ts` | Añadir 4 rutas de propietarios faltantes (líneas 21-22) |

---

### Código Exacto del Cambio

En `supabase/functions/regenerate-sitemap/index.ts`, modificar la constante `staticRoutes` (líneas 11-34) para que incluya las rutas faltantes:

```typescript
const staticRoutes = [
  { loc: "/", priority: "1.0", changefreq: "weekly" },
  { loc: "/precios", priority: "0.8", changefreq: "monthly" },
  { loc: "/faq", priority: "0.7", changefreq: "monthly" },
  { loc: "/blog", priority: "0.9", changefreq: "daily" },
  { loc: "/contacto", priority: "0.7", changefreq: "monthly" },
  { loc: "/clausulas-abusivas-alquiler", priority: "0.9", changefreq: "monthly" },
  { loc: "/devolucion-fianza-alquiler", priority: "0.9", changefreq: "monthly" },
  { loc: "/subida-alquiler-2026", priority: "0.9", changefreq: "monthly" },
  { loc: "/propietarios", priority: "0.9", changefreq: "monthly" },
  { loc: "/contrato-alquiler-propietarios", priority: "0.8", changefreq: "monthly" },
  { loc: "/impago-alquiler-propietarios", priority: "0.8", changefreq: "monthly" },      // AÑADIR
  { loc: "/zonas-tensionadas-propietarios", priority: "0.8", changefreq: "monthly" },   // AÑADIR
  { loc: "/deposito-fianza-propietarios", priority: "0.8", changefreq: "monthly" },     // AÑADIR
  { loc: "/fin-contrato-alquiler-propietarios", priority: "0.8", changefreq: "monthly" }, // AÑADIR
  { loc: "/profesionales/inmobiliarias", priority: "0.8", changefreq: "monthly" },
  { loc: "/profesionales/gestorias", priority: "0.8", changefreq: "monthly" },
  { loc: "/analizar-gratis", priority: "0.9", changefreq: "weekly" },
  { loc: "/login", priority: "0.3", changefreq: "yearly" },
  { loc: "/registro", priority: "0.3", changefreq: "yearly" },
  { loc: "/aviso-legal", priority: "0.2", changefreq: "yearly" },
  { loc: "/privacidad", priority: "0.2", changefreq: "yearly" },
  { loc: "/terminos", priority: "0.2", changefreq: "yearly" },
  { loc: "/cookies", priority: "0.2", changefreq: "yearly" },
  { loc: "/accesibilidad", priority: "0.2", changefreq: "yearly" },
  { loc: "/desistimiento", priority: "0.2", changefreq: "yearly" },
  { loc: "/transparencia-ia", priority: "0.2", changefreq: "yearly" },
];
```

---

### Resultado Esperado

Tras implementar el cambio:
- El sitemap cacheado incluirá las 27 rutas estáticas (igual que sitemap/)
- Google recibirá todas las páginas SEO de propietarios
- La próxima publicación de post regenerará el caché correctamente

