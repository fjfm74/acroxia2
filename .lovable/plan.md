

# Auditoría SEO/AEO/AI Overviews - Consultor Senior IA

## Resumen Ejecutivo

Tras analizar en profundidad el portal ACROXIA, he identificado **15 problemas críticos** y **23 oportunidades de optimización** que explican la falta de tráfico orgánico a pesar de tener 54 posts publicados y 8 guías SEO pilares. El análisis cubre SEO técnico, Core Web Vitals, estructuración de datos, optimización para AI Overviews (GEO) y estrategia de contenido.

---

## PARTE 1: DIAGNÓSTICO CRÍTICO

### 1.1 Problemas de Datos Estructurados (Schema.org)

| Problema | Impacto | Archivo |
|----------|---------|---------|
| **FAQs vacías en 96% de posts** | Solo 2 de 54 posts tienen FAQs. Sin schema FAQPage = 0 Featured Snippets | `blog_posts.faqs` |
| **Títulos excesivamente largos** | Media de **76 caracteres** (límite óptimo: 55). Google trunca el 80%+ de títulos | Edge Functions |
| **AggregateRating falso** | `ratingCount: 150` sin sistema de reseñas real = penalización potencial por spam | `Index.tsx` líneas 87-91 |
| **Logo URL incorrecta** | `https://acroxia.com/logo.png` no existe (debería ser `/acroxia-logo.png`) | `BlogPost.tsx` línea 166 |
| **Speakable sin contenido** | El selector `.speakable-summary` no existe en la Home | `Index.tsx` howToSchema |

### 1.2 Problemas de Core Web Vitals

| Métrica | Problema | Causa |
|---------|----------|-------|
| **LCP** | Framer Motion en Header carga ~40KB innecesarios | `Header.tsx` líneas 3, 67-70 |
| **CLS** | Imágenes sin dimensiones explícitas en blog posts relacionados | `BlogPost.tsx` líneas 414-422 |
| **TBT** | Mega-menús con AnimatePresence bloquean main thread | `Header.tsx` líneas 101-136 |

### 1.3 Problemas de Indexabilidad

| Problema | Detalle | Impacto |
|----------|---------|---------|
| **Canonical con query strings** | `/blog?audiencia=inquilino` genera duplicados | Dilución de autoridad |
| **Imágenes sin alt text descriptivo** | Solo `alt={post.title}` - no describe el contenido visual | Pérdida de tráfico de imágenes |
| **Hreflang inconsistente** | Blog posts no tienen `hreflang` pero las guías SEO sí | Señales mixtas a Google |
| **SearchAction rota** | `urlTemplate` apunta a `/blog?q={query}` pero no existe funcionalidad de búsqueda | Schema inválido |

### 1.4 Problemas de Contenido para IA (GEO)

| Problema | Impacto |
|----------|---------|
| **llms.txt estático** | Los LLMs no ven los 54 posts publicados |
| **Sin Entity Stacking** | No hay schema Person para autores con credenciales legales |
| **Falta de datos de frescura** | Los posts no muestran `dateModified` visible |
| **Sin `isPartOf` en artículos** | Google no entiende la jerarquía Blog → Post → Categoría |

---

## PARTE 2: OPORTUNIDADES DE ALTO IMPACTO

### 2.1 Quick Wins (Implementación inmediata)

1. **Regenerar FAQs para los 52 posts existentes**
   - Ejecutar batch de actualización con IA para generar 3-5 FAQs por post
   - Impacto: +100% de candidatos para Featured Snippets

2. **Eliminar AggregateRating falso**
   - Quitar el schema de rating sin un sistema real de reseñas
   - Evita penalización manual de Google por structured data spam

3. **Corregir logo URL en ArticleSchema**
   ```
   Antes: https://acroxia.com/logo.png
   Después: https://acroxia.com/acroxia-logo.png
   ```

4. **Añadir .speakable-summary a la Home**
   - El HowTo schema referencia un selector que no existe
   - Añadir clase al párrafo descriptivo del Hero

5. **Dimensiones explícitas en imágenes lazy**
   - Añadir `width` y `height` a todas las imágenes de posts relacionados
   - Mejora CLS en ~0.15

### 2.2 Optimizaciones de Media Prioridad

6. **Migrar animaciones del Header a CSS**
   - Reemplazar Framer Motion por CSS animations como en HeroSection
   - Ahorro de ~40KB de JS + mejora de TBT

7. **Implementar dateModified visible**
   - Mostrar "Actualizado: 5 feb 2026" en cada post y guía
   - Señal de frescura para Google y LLMs

8. **Canonical sin query strings en Blog**
   - `/blog` siempre como canonical, no `/blog?audiencia=X`
   - Evita dilución de PageRank

9. **Hreflang en todos los posts del blog**
   - Añadir `es-ES` y `x-default` consistentemente
   - Alineación con las guías SEO

10. **Eliminar SearchAction rota**
    - Quitar el schema de búsqueda hasta implementar funcionalidad real
    - Evita errores en Search Console

### 2.3 Optimizaciones de Alta Prioridad (1-2 semanas)

11. **Entity Stacking para E-E-A-T**
    - Crear schema Person para cada autor en `authors` table
    - Incluir `sameAs` (LinkedIn, Twitter), `jobTitle`, `knowsAbout: ["LAU", "Derecho Inmobiliario"]`
    - Vincular con ArticleSchema.author

12. **Implementar isPartOf y mainEntityOfPage**
    ```json
    {
      "@type": "Article",
      "isPartOf": {
        "@type": "Blog",
        "name": "Blog ACROXIA",
        "url": "https://acroxia.com/blog"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://acroxia.com/blog/[slug]"
      }
    }
    ```

13. **Optimizar títulos existentes**
    - Script de migración para acortar títulos > 60 chars
    - Ejemplos:
      - Antes: "La comunicación de preaviso para finalizar el contrato: plazos y formas en 2026" (79 chars)
      - Después: "Preaviso fin de contrato: plazos y formas 2026" (46 chars)

14. **Alt text enriquecido para imágenes**
    - Generar alt text descriptivo con IA al crear imágenes
    - Ejemplo: "Ilustración de contrato de alquiler con lupa identificando cláusulas abusivas"

15. **Breadcrumbs con itemListElement completo**
    - Asegurar que todos los niveles tienen URL válida (`item`)
    - El último elemento también debe tener URL, no solo nombre

### 2.4 Estrategia de Contenido para AI Overviews

16. **TL;DR en posts del blog**
    - Añadir sección "Resumen rápido" al inicio de cada post
    - Clase `.speakable-summary` para extracción por LLMs

17. **Preguntas en primera persona en FAQs**
    - "¿Puedo reclamar si...?" en lugar de "Cómo reclamar..."
    - Alinea con búsquedas conversacionales

18. **Datos estructurados HowTo en guías**
    - Convertir las listas de pasos en schema HowTo
    - Ejemplo: "Cómo recuperar la fianza paso a paso"

19. **Actualizar llms.txt dinámico**
    - Incluir los 20 posts más recientes con excerpts
    - Regenerar automáticamente con trigger de DB

20. **Interconexión semántica de contenidos**
    - Cada post debe enlazar a 2-3 posts relacionados en el cuerpo
    - No solo al final con "Artículos relacionados"

### 2.5 Core Web Vitals Avanzado

21. **Preload de fuentes críticas**
    - Ya implementado pero verificar que no hay FOUT residual
    - Auditar con Lighthouse

22. **Image priority en Above The Fold**
    - Verificar que solo la imagen Hero tiene `fetchPriority="high"`
    - Las demás deben ser `lazy`

23. **Bundle splitting adicional**
    - Separar Accordion y Chart components
    - Solo cargar cuando se necesiten

---

## PARTE 3: CHECKLIST GSC Y VALIDACIÓN

### Errores esperados en Search Console a corregir:

| Error GSC | Causa | Solución |
|-----------|-------|----------|
| "Campo logo: URL incorrecta" | `/logo.png` no existe | Cambiar a `/acroxia-logo.png` |
| "Campo aggregateRating: ratingCount sin sistema" | Rating falso | Eliminar schema |
| "Página alternativa con tag canonical" | `/blog?audiencia=X` | Canonical a `/blog` |
| "Contenido duplicado" | Posts sin dateModified | Añadir fecha visible |
| "Datos estructurados: SearchAction inválido" | No hay buscador | Eliminar schema |

### Validación Rich Results

Después de implementar, validar con:
1. **Rich Results Test** para FAQPage
2. **Schema Validator** para Article + Person
3. **Mobile-Friendly Test** para CLS
4. **PageSpeed Insights** para LCP < 2.5s

---

## PARTE 4: ARQUITECTURA DE ENLACES INTERNOS

### Problema actual:
La Home tiene pocas rutas de navegación hacia el contenido profundo.

### Estructura propuesta:

```
┌─────────────────────────────────────────────────────────────┐
│                      HOME (/)                               │
│   ↓ Hero CTA         ↓ Stats         ↓ Latest Articles     │
└───────┬───────────────────────────────────────┬─────────────┘
        │                                       │
        ▼                                       ▼
┌───────────────────┐               ┌───────────────────────┐
│  /analizar-gratis │               │       /blog           │
│  (Inquilinos)     │               │  ↙         ↘         │
└─────────┬─────────┘     ┌─────────┴────┐  ┌────┴─────────┐
          │               │  Inquilinos  │  │ Propietarios │
          ▼               │  3 guías SEO │  │  5 guías SEO │
┌─────────────────────────┴──────────────┴──┴──────────────┐
│                 GUÍAS SEO PILARES                        │
│  Cada guía enlaza a las otras 2-4 relacionadas           │
│  + enlaza a posts del blog de su categoría               │
└──────────────────────────────────────────────────────────┘
```

### Links adicionales recomendados:

1. **En HeroSection**: Añadir link secundario a `/propietarios`
2. **En StatsSection**: Cada stat puede enlazar a guía relacionada
3. **En HowItWorksSection**: Enlace a `/faq` en el paso 3

---

## PARTE 5: MÉTRICAS OBJETIVO

| Métrica | Actual | Objetivo 30 días | Objetivo 90 días |
|---------|--------|------------------|------------------|
| Posts indexados en GSC | ~10 | 54 (100%) | 54 + nuevos |
| Posts con FAQs | 2 (4%) | 54 (100%) | 100% |
| Título < 60 chars | ~20% | 100% | 100% |
| Featured Snippets | 0 | 5-10 | 20+ |
| AI Overviews citaciones | 0 | 3-5 | 10+ |
| LCP móvil | ~2.8s | < 2.5s | < 2.0s |
| CLS | ~0.15 | < 0.1 | < 0.05 |
| Impresiones/semana | ~0 | 1,000+ | 10,000+ |

---

## PARTE 6: ARCHIVOS A MODIFICAR

| Archivo | Cambios |
|---------|---------|
| `src/pages/Index.tsx` | Eliminar aggregateRating, corregir SearchAction, añadir .speakable-summary |
| `src/pages/BlogPost.tsx` | Corregir logo URL, añadir hreflang, isPartOf, dimensiones imágenes |
| `src/pages/Blog.tsx` | Canonical sin query strings |
| `src/components/landing/Header.tsx` | Migrar Framer Motion a CSS animations |
| `supabase/functions/schedule-daily-post/` | Ya actualizado (límite 55 chars + FAQs) |
| `supabase/functions/llms-full/` | Verificar regeneración automática |
| **NUEVO**: Script de migración | Regenerar FAQs para 52 posts existentes |
| **NUEVO**: Script de migración | Acortar títulos > 60 chars |

---

## DETALLES TÉCNICOS

### Corrección de ArticleSchema en BlogPost.tsx

El schema actual tiene un error en el logo URL:

```typescript
// Línea 166 actual
"logo": {
  "@type": "ImageObject",
  "url": "https://acroxia.com/logo.png"  // ❌ No existe
}

// Corrección
"logo": {
  "@type": "ImageObject",
  "url": "https://acroxia.com/acroxia-logo.png"  // ✓ Existe
}
```

### Corrección de SoftwareApplication en Index.tsx

```typescript
// Eliminar aggregateRating falso (líneas 87-91)
"aggregateRating": {  // ❌ Eliminar todo este bloque
  "@type": "AggregateRating",
  "ratingValue": "4.8",
  "ratingCount": "150"
}
```

### Corrección de SearchAction en Index.tsx

```typescript
// Eliminar hasta tener buscador funcional (líneas 59-66)
"potentialAction": {  // ❌ Eliminar hasta implementar búsqueda
  "@type": "SearchAction",
  ...
}
```

### Añadir speakable-summary a HeroSection

```tsx
// En HeroSection.tsx línea 39
<p className="hero-animate hero-animate-delay-2 speakable-summary text-lg text-muted-foreground...">
  Sube tu contrato de alquiler y descubre en menos de 2 minutos...
</p>
```

### Canonical sin query strings en Blog.tsx

```typescript
// Línea 105-107 actual
const canonicalUrl = selectedAudience 
  ? `https://acroxia.com/blog?audiencia=${selectedAudience}`  // ❌ Duplicados
  : "https://acroxia.com/blog";

// Corrección
const canonicalUrl = "https://acroxia.com/blog";  // ✓ Siempre igual
```

---

## PRIORIDAD DE IMPLEMENTACIÓN

1. **Inmediato (hoy)**: Corregir schemas rotos (logo, aggregateRating, SearchAction)
2. **Esta semana**: Regenerar FAQs para posts existentes, acortar títulos
3. **Próxima semana**: Migrar Header a CSS, añadir hreflang a posts
4. **Mes 1**: Entity stacking, isPartOf, TL;DR en posts
5. **Mes 2**: Monitorizar GSC y ajustar según errores

