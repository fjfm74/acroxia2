

## Auditoría SEO / AEO / GEO / AI Overviews - Febrero 2026

### Estado actual: Resumen ejecutivo

El proyecto tiene una base SEO solida con schemas JSON-LD, breadcrumbs, hreflang, FAQs en 59/62 posts, y archivos llms.txt para GEO. Sin embargo, existen problemas criticos y oportunidades de mejora significativas.

---

## PROBLEMAS CRITICOS (Prioridad Alta)

### 1. aggregateRating falso en Pricing.tsx (Riesgo de penalizacion Google)

La pagina de Precios incluye un schema `Product` con `aggregateRating` de 4.8/5 con 150 resenas que no existen realmente. Esto viola las politicas de datos estructurados de Google y puede resultar en una accion manual.

**Accion**: Eliminar el bloque `aggregateRating` del schema en `src/pages/Pricing.tsx` (lineas 23-29).

---

### 2. 30 posts sin meta_description (48% del blog)

30 de 62 posts publicados no tienen `meta_description`. Google generara snippets aleatorios del contenido, reduciendo el CTR organico.

**Accion**: Modificar la Edge Function `batch-update-blog-posts` para generar meta descriptions optimizadas (max 155 caracteres) para los posts que no la tienen.

---

### 3. 3 posts sin FAQs

Quedan 3 posts sin FAQs generadas, lo que les impide aparecer en AI Overviews con formato de pregunta-respuesta.

**Accion**: Ejecutar la batch function con filtro especifico para estos 3 posts.

---

### 4. Inconsistencia de direccion en schemas Organization vs Contact

- `Index.tsx` (Organization): `addressLocality: "Madrid"`
- `Contacto.tsx` (ContactPage): `addressLocality: "Barcelona"`, `telephone: "+34 900 000 000"` (numero generico)

**Accion**: Unificar la direccion y usar datos reales o eliminar datos ficticios.

---

## PROBLEMAS MEDIOS (Prioridad Media)

### 5. Blog.tsx sin schema JSON-LD

La pagina `/blog` (lista de articulos) no tiene ningun schema estructurado. Falta un schema `CollectionPage` o `Blog` que ayude a Google a entender la estructura jerarquica.

**Accion**: Anadir schema `CollectionPage` con `mainEntity` de tipo `Blog`.

---

### 6. Pagina /analizar-gratis sin meta tags completos

La pagina de conversion principal probablemente carece de OG tags, hreflang y schema especifico. Es la pagina mas importante del embudo.

**Accion**: Verificar y completar meta tags, anadir schema `WebApplication` con `potentialAction`.

---

### 7. FAQ.tsx no tiene hreflang

La pagina `/faq` no incluye etiquetas `hreflang` ni `html lang="es-ES"`.

**Accion**: Anadir `<html lang="es-ES" />`, `hreflang es-ES` y `x-default`.

---

### 8. llms.txt estatico desactualizado

El archivo `public/llms.txt` dice "Ultima actualizacion: Enero 2026" pero estamos en febrero. Ademas, la URL dinamica apunta al endpoint de Supabase directamente en lugar de una URL amigable.

**Accion**: Actualizar fecha a "Febrero 2026" y verificar que el enlace dinamico funciona.

---

### 9. Falta de dateModified visible en posts del blog

Aunque el schema `Article` incluye `dateModified`, no hay una fecha de "Ultima actualizacion" visible para el usuario en la pagina del post. Google valora la coherencia entre datos estructurados y contenido visible (E-E-A-T).

**Accion**: Mostrar "Actualizado: [fecha]" junto a la fecha de publicacion si `updated_at` es diferente a `published_at`.

---

### 10. Breadcrumbs del blog: categoria sin enlace

En `BlogPost.tsx`, el breadcrumb muestra `Blog > Audiencia > Categoria > Titulo` pero la Categoria no tiene `href`, lo que significa que no es navegable y el schema tiene una URL que no existe como pagina real.

**Accion**: Eliminar la categoria del breadcrumb o crear paginas de categoria reales.

---

## OPORTUNIDADES DE MEJORA (Prioridad Baja)

### 11. Falta schema WebPage en paginas SEO pilares

Las guias SEO (clausulas abusivas, devolucion fianza, etc.) usan schemas `Article` con `speakable`, pero podrian beneficiarse de un schema `WebPage` adicional con `mainEntity` para Entity Stacking.

---

### 12. Imagen OG generica para todas las paginas

La mayoria de paginas usan `og-image.jpg` como imagen por defecto. Las guias SEO podrian tener imagenes OG especificas con el titulo de la guia para mejorar CTR en redes sociales.

---

### 13. Falta rel="nofollow" en enlaces externos

Si hay enlaces externos en el contenido del blog (a BOE, organismos oficiales, etc.), deberian llevar `rel="nofollow noopener"` para no dispersar autoridad innecesariamente.

---

### 14. Sitemap: falta lastmod dinamico real en rutas estaticas

Las rutas estaticas del sitemap tienen fechas hardcodeadas (ej: `2026-02-01`). Idealmente deberian actualizarse cuando el contenido de esas paginas cambia.

---

### 15. Precios en schema inconsistentes

El schema de Pricing dice "Pack Comparador" a 79EUR pero la description dice "desde 9.99EUR" en el OG meta. Verificar coherencia.

---

## PLAN DE IMPLEMENTACION PROPUESTO

### Fase 1 - Criticos (inmediato)

| # | Tarea | Archivo |
|---|-------|---------|
| 1 | Eliminar aggregateRating falso | `src/pages/Pricing.tsx` |
| 2 | Generar meta descriptions para 30 posts | Edge Function `batch-update-blog-posts` |
| 3 | Generar FAQs para 3 posts restantes | Edge Function `batch-update-blog-posts` |
| 4 | Unificar direccion en schemas | `src/pages/Index.tsx`, `src/pages/Contacto.tsx` |

### Fase 2 - Medios (semana 1)

| # | Tarea | Archivo |
|---|-------|---------|
| 5 | Anadir schema CollectionPage en Blog.tsx | `src/pages/Blog.tsx` |
| 6 | Completar meta tags /analizar-gratis | `src/pages/AnalyzePublic.tsx` |
| 7 | Anadir hreflang a FAQ.tsx | `src/pages/FAQ.tsx` |
| 8 | Actualizar llms.txt | `public/llms.txt` |
| 9 | Mostrar dateModified visible en posts | `src/pages/BlogPost.tsx` |
| 10 | Limpiar breadcrumbs categoria blog | `src/pages/BlogPost.tsx` |

### Fase 3 - Optimizaciones (semana 2-3)

| # | Tarea | Archivo |
|---|-------|---------|
| 11 | Entity Stacking en guias SEO | Guias en `src/pages/seo/` |
| 12-15 | Mejoras menores | Varios |

---

## Seccion tecnica: Detalle de cambios por archivo

### `src/pages/Pricing.tsx`
- Eliminar lineas 23-29 (bloque `aggregateRating`)

### `src/pages/Blog.tsx`
- Anadir schema `CollectionPage` en el Helmet

### `src/pages/BlogPost.tsx`
- Mostrar fecha de actualizacion si `updated_at > published_at + 1 dia`
- Eliminar la categoria del array de breadcrumbs (no hay pagina real)

### `src/pages/FAQ.tsx`
- Anadir `<html lang="es-ES" />`, hreflang y x-default

### `src/pages/Index.tsx` y `src/pages/Contacto.tsx`
- Unificar `addressLocality` y eliminar telefono generico

### `public/llms.txt`
- Actualizar "Enero 2026" a "Febrero 2026"

### Edge Function `batch-update-blog-posts`
- Anadir logica para generar `meta_description` (155 chars max) cuando esta vacia
- Procesar los 3 posts restantes sin FAQs
- Procesar los 30 posts sin meta description

