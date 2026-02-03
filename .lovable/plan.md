

## Plan: Auditoría SEO/AEO/AI Overviews - Diagnóstico y Optimizaciones

### Resumen Ejecutivo

Tras analizar el código, la estructura del sitio, el sitemap, los archivos LLM y el contenido del blog, he identificado **múltiples problemas críticos** que explican por qué el tráfico no está llegando a pesar de tener 50 posts publicados y 8 guías SEO.

---

## Problemas Detectados

### 1. CRÍTICO: Blog sin URLs Indexables por Defecto

**Problema**: La página `/blog` muestra un selector de audiencia que requiere interacción del usuario antes de mostrar cualquier contenido. Los crawlers de Google ven una página vacía.

```text
┌─────────────────────────────────────────┐
│  Googlebot visita /blog                 │
│  ↓                                      │
│  Ve: "Selecciona tu perfil"             │
│  (sin artículos, sin enlaces)           │
│  ↓                                      │
│  No indexa ningún post                  │
└─────────────────────────────────────────┘
```

**Archivo afectado**: `src/pages/Blog.tsx` líneas 36-50
- La query solo se ejecuta si `selectedAudience` está definido
- Los bots no hacen clic, por lo que nunca ven contenido

**Impacto**: Los 50 posts del blog NO son descubribles por Google desde `/blog`.

---

### 2. CRÍTICO: Posts del Blog no están en el Sitemap

**Problema**: El sitemap dinámico genera URLs de posts pero la caché puede estar vacía o desactualizada. Además, la función `regenerate-sitemap` puede no estar ejecutándose automáticamente.

**Verificación**: El sitemap devuelve posts (confirmado), pero si la caché falla, el fallback dinámico podría tardar en actualizarse.

---

### 3. CRÍTICO: CTAs del Blog apuntan a "/" en lugar de "/analizar-gratis"

**Problema**: En `BlogPost.tsx` línea 314, el CTA "Analizar mi contrato gratis" enlaza a `/` (home) en lugar de `/analizar-gratis`.

```tsx
<Link to="/">
  Analizar mi contrato gratis
</Link>
```

**Impacto**: Los usuarios que leen el blog y quieren analizar su contrato llegan al home en lugar de la página de conversión directa.

---

### 4. IMPORTANTE: Artículos Relacionados sin Filtro por Audiencia

**Problema**: En `BlogPost.tsx` líneas 40-52, la query de posts relacionados NO filtra por audiencia ni categoría:

```tsx
const { data: relatedPosts = [] } = useQuery({
  queryFn: async () => {
    const { data } = await supabase
      .from('blog_posts')
      .eq('status', 'published')
      .neq('slug', slug!)
      .limit(2); // Sin filtro de audiencia ni categoría
```

**Impacto**: Un inquilino leyendo sobre fianzas puede ver artículos para propietarios, rompiendo la coherencia temática y la señal de autoridad tópica para Google.

---

### 5. IMPORTANTE: Falta de Internal Linking desde Home hacia Blog

**Problema**: La página principal (Index.tsx) no tiene ningún enlace visible al blog ni a las guías SEO. Las secciones HeroSection, StatsSection y HowItWorksSection no mencionan el contenido educativo.

**Impacto**: El "link juice" de la home no fluye hacia el contenido del blog, debilitando su autoridad SEO.

---

### 6. MODERADO: Títulos de Posts muy Largos para SERP

**Problema**: Los títulos de blog generados por IA son demasiado largos:
- "La comunicación de preaviso para finalizar el contrato: plazos y formas en 2026" (78 chars)
- "La inscripción obligatoria de los contratos de alquiler en los registros autonómicos en 2026" (91 chars)

**Límite recomendado**: 55-60 caracteres para evitar truncamiento en SERPs.

---

### 7. MODERADO: Solo 1 Suscriptor Confirmado al Newsletter

**Dato**: La tabla `blog_subscribers` tiene solo 1 suscriptor confirmado.

**Impacto**: El sistema de newsletter está configurado pero sin audiencia. Los posts se publican pero nadie los recibe.

---

### 8. MODERADO: Chat Assistant Limitado a Rutas Específicas

**Problema**: En `ChatContainer.tsx`, el chat solo aparece en rutas hardcodeadas. Los posts del blog (`/blog/:slug`) están cubiertos, pero nuevas rutas podrían quedar excluidas.

---

### 9. TÉCNICO: Blog sin Pre-renderizado para Crawlers

**Problema**: Al ser una SPA, los crawlers que no ejecutan JavaScript (algunos bots de IA, DinoRank, etc.) no ven el contenido del blog.

---

### 10. TÉCNICO: Falta BreadcrumbSchema con URL en Último Nivel

**Verificado**: El componente Breadcrumbs genera esquema correcto. No hay problema aquí.

---

## Plan de Corrección

### Fase 1: Correcciones Críticas (Impacto Inmediato)

#### 1.1 Hacer el Blog Indexable sin Interacción

**Cambio**: Modificar `Blog.tsx` para mostrar una selección de posts recientes de AMBAS audiencias cuando no hay filtro, permitiendo que Googlebot descubra todos los posts.

```text
Estado actual:      → sin audiencia = página vacía
Estado propuesto:   → sin audiencia = muestra 6 posts recientes (3 inquilino + 3 propietario)
```

#### 1.2 Corregir CTA del Blog a /analizar-gratis

**Archivo**: `BlogPost.tsx` línea 314
```tsx
// Antes
<Link to="/">
// Después
<Link to="/analizar-gratis">
```

#### 1.3 Filtrar Posts Relacionados por Audiencia

**Archivo**: `BlogPost.tsx` líneas 40-52
```tsx
// Añadir filtro
.eq('audience', post.audience)
.eq('category', post.category)
```

---

### Fase 2: Mejoras de Linking Interno

#### 2.1 Añadir Sección "Últimos Artículos" en Home

Crear una nueva sección en `Index.tsx` después de HowItWorksSection que muestre 4-6 posts recientes con enlaces al blog.

#### 2.2 Añadir Enlaces a Guías SEO en Footer

Incluir links a las 8 guías SEO principales en el footer para distribuir link equity.

---

### Fase 3: Optimizaciones AEO/AI Overviews

#### 3.1 Añadir Sección FAQ en Posts del Blog

Cada post debería tener un bloque de FAQs al final con schema FAQPage para capturar AI Overviews.

#### 3.2 Actualizar llms-full.txt con URLs Dinámicas

El archivo estático no se actualiza con nuevos posts. Asegurar que la Edge Function `/llms-full` incluya los últimos 20 posts.

---

### Fase 4: Pre-renderizado para Crawlers

#### 4.1 Implementar Detección de Bot y SSR Condicional

Configurar una Edge Function que detecte User-Agents de bots y sirva HTML pre-renderizado.

---

## Métricas Objetivo Post-Implementación

| Métrica | Actual | Objetivo (30 días) |
|---------|--------|-------------------|
| Posts indexados en GSC | ~0 | 50+ |
| Impresiones en Search | ~0 | 500+ |
| CTR en guías SEO | N/A | >2% |
| Suscriptores newsletter | 1 | 50+ |

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Blog.tsx` | Mostrar posts sin selección de audiencia |
| `src/pages/BlogPost.tsx` | CTA → /analizar-gratis, posts relacionados por audiencia |
| `src/pages/Index.tsx` | Nueva sección "Últimos Artículos" |
| `src/components/landing/Footer.tsx` | Enlaces a guías SEO |
| `supabase/functions/schedule-daily-post/index.ts` | Títulos más cortos |

---

## Prioridad de Implementación

1. **Urgente** (hoy): Corrección 1.1 + 1.2 + 1.3 → El blog debe ser indexable
2. **Alta** (esta semana): Fase 2 → Linking interno
3. **Media** (próxima semana): Fase 3 → AEO optimizations
4. **Baja** (mes): Fase 4 → Pre-rendering

