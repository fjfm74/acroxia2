
## Plan: Auditoría y Optimización SEO Completa

### Resumen de Hallazgos

Tras revisar todas las páginas públicas del sitio, he identificado **18 áreas de mejora** organizadas en 5 categorías de prioridad.

---

### Hallazgos Críticos

| Problema | Impacto SEO | Páginas Afectadas |
|----------|-------------|-------------------|
| Página 404 sin meta tags ni estructura | Alto | `/not-found` |
| Páginas sin `canonical` | Alto | Login, Registro, Perfil, AnalyzePublic, Dashboard, etc. |
| Falta `og:image` en mayoría de páginas | Medio | 25+ páginas |
| Páginas legales con `noindex` incorrecto | Bajo | Aviso Legal, Privacidad, Términos, Cookies |

---

### Parte 1: Página 404 Optimizada

**Problema actual**: La página 404 es muy básica, en inglés y sin ningún meta tag.

**Archivo**: `src/pages/NotFound.tsx`

**Mejoras**:
- Traducir a español
- Añadir Helmet con título y meta description
- Añadir `noindex, nofollow`
- Incluir enlaces útiles (Home, Blog, FAQ, Contacto)
- Mejorar diseño con el branding ACROXIA
- Añadir schema WebPage

---

### Parte 2: Canonical Tags Faltantes

**Problema**: 10+ páginas públicas no tienen `rel="canonical"`.

**Archivos a modificar**:

| Archivo | Canonical URL |
|---------|---------------|
| `Login.tsx` | `https://acroxia.com/login` |
| `Register.tsx` | `https://acroxia.com/registro` |
| `AnalyzePublic.tsx` | `https://acroxia.com/analizar-gratis` |
| `Contacto.tsx` | Ya tiene (verificar) |
| `Profile.tsx` | `noindex` (privada) |
| `BlogPost.tsx` | Ya tiene (verificar) |

---

### Parte 3: Open Graph Meta Tags

**Problema**: Solo `BlogPost.tsx` y algunas páginas tienen `og:image`. La mayoría carece de OG completo.

**Páginas que necesitan og:image y og:type**:
- `AnalyzePublic.tsx`
- `Login.tsx`
- `Register.tsx`
- `FAQ.tsx`
- `Contacto.tsx`
- Todas las guías SEO de inquilinos
- `Blog.tsx` (lista de blog)

**Valor por defecto**: `https://acroxia.com/og-image.jpg`

---

### Parte 4: Páginas Legales - Revisar noindex

**Estado actual**: Todas las páginas legales tienen `noindex, follow` a través de `LegalPageLayout.tsx`.

**Análisis**:
- `Aviso Legal`: Debería ser indexable (requisito legal visible)
- `Privacidad`: Debería ser indexable (transparencia)
- `Términos`: Puede permanecer noindex
- `Cookies`: Debería ser indexable
- `Accesibilidad`: Debería ser indexable

**Solución**: Añadir prop opcional `allowIndex` a `LegalPageLayout` que cambie robots a `index, follow` para las páginas que lo requieran.

---

### Parte 5: Mejoras Técnicas Avanzadas

#### 5.1 Schema JSON-LD faltantes

| Página | Schema Recomendado |
|--------|-------------------|
| `Contacto.tsx` | Mejorar ContactPage con Organization completo |
| `Blog.tsx` | Añadir ItemList para lista de artículos |
| `Register.tsx` / `Login.tsx` | WebPage básico |

#### 5.2 llms.txt - Sincronización con precios reales

**Problema**: Los precios en `llms-full.txt` no coinciden con los reales del sitio.

**Discrepancias detectadas**:
- llms.txt dice "Análisis completo: 9,90€" → Real: 39€
- llms.txt dice "Pack 5 análisis: 39€" → No existe
- Falta información de planes propietarios

**Solución**: Actualizar `public/llms.txt` y `public/llms-full.txt` con precios correctos.

#### 5.3 Sitemap - Verificar lastmod

**Problema potencial**: El sitemap usa la fecha del día actual para todas las rutas estáticas en lugar de fechas reales de modificación.

**Mejora**: Para guías SEO, usar fechas hardcodeadas de última modificación (enero 2026) en lugar de `today`.

---

### Parte 6: Mejoras Menores Adicionales

| Mejora | Archivo | Descripción |
|--------|---------|-------------|
| hreflang en más páginas | Guías propietarios | Añadir `hreflang="es-ES"` y `x-default` |
| Twitter Card meta tags | Páginas principales | Añadir `twitter:card`, `twitter:title`, `twitter:description` |
| Meta author | Todas | Añadir `<meta name="author" content="ACROXIA">` |
| Fechas actualizadas | Schemas | Asegurar `dateModified` refleja enero 2026 |

---

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/NotFound.tsx` | Rediseño completo con SEO |
| `src/pages/Login.tsx` | Añadir canonical + og tags |
| `src/pages/Register.tsx` | Añadir canonical + og tags + noindex |
| `src/pages/AnalyzePublic.tsx` | Añadir canonical + og tags |
| `src/pages/FAQ.tsx` | Añadir og:image + og:type |
| `src/pages/Contacto.tsx` | Añadir og:image |
| `src/pages/Blog.tsx` | Añadir og:image + ItemList schema |
| `src/pages/Profile.tsx` | Añadir noindex |
| `src/components/legal/LegalPageLayout.tsx` | Añadir prop `allowIndex` |
| `src/pages/legal/AvisoLegal.tsx` | Usar `allowIndex={true}` |
| `src/pages/legal/Privacidad.tsx` | Usar `allowIndex={true}` |
| `src/pages/legal/Cookies.tsx` | Usar `allowIndex={true}` |
| `src/pages/legal/Accesibilidad.tsx` | Usar `allowIndex={true}` |
| `src/pages/seo/ImpagoAlquilerPropietarios.tsx` | Añadir hreflang |
| `src/pages/seo/ZonasTensionadasPropietarios.tsx` | Añadir hreflang |
| `src/pages/seo/DepositoFianzaPropietarios.tsx` | Añadir hreflang |
| `src/pages/seo/FinContratoAlquilerPropietarios.tsx` | Añadir hreflang |
| `src/pages/seo/ContratoAlquilerPropietarios.tsx` | Añadir hreflang |
| `public/llms.txt` | Actualizar precios correctos |
| `public/llms-full.txt` | Actualizar precios + info propietarios |
| `supabase/functions/sitemap/index.ts` | Mejorar lastmod con fechas reales |

---

### Orden de Implementación

1. **Página 404** (impacto en UX y crawling)
2. **Canonicals faltantes** (evitar duplicados en Google)
3. **Open Graph tags** (compartir en redes sociales)
4. **Páginas legales indexables** (E-E-A-T y transparencia)
5. **llms.txt actualizado** (GEO - AI engines)
6. **hreflang en guías propietarios** (internacionalización)
7. **Sitemap mejorado** (crawling preciso)

---

### Resultado Esperado

| Métrica | Antes | Después |
|---------|-------|---------|
| Páginas con canonical | ~17 | 27+ |
| Páginas con og:image | ~5 | 27+ |
| Páginas legales indexadas | 0 | 4 |
| Página 404 optimizada | No | Sí |
| llms.txt sincronizado | No | Sí |
| hreflang en guías | 3 inquilinos | 8 (todas) |

---

### Notas Técnicas

- Las páginas de dashboard/admin ya tienen `noindex, nofollow` correctamente
- El `robots.txt` ya bloquea rutas privadas
- El sitemap dinámico ya incluye todas las guías SEO
- Los schemas Article con `speakable` ya están en las guías principales

