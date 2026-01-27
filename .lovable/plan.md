
## Plan de Optimización PageSpeed Mobile (57 → 85+)

### Diagnóstico actual

| Métrica | Valor actual | Objetivo |
|---------|--------------|----------|
| FCP | 7.7s | < 2.5s |
| LCP | 11.5s | < 2.5s |
| Speed Index | 8.0s | < 3.5s |
| TBT | 70ms | OK |
| CLS | 0 | OK |

Los problemas principales son **FCP** y **LCP**, ambos relacionados con recursos que bloquean el renderizado.

---

## Fase 1: Optimización de recursos críticos (Mayor impacto)

### 1.1 Precargar la imagen LCP
La imagen del hero (`hero-professional.webp`) es el elemento LCP pero no tiene preload.

**Archivo: `index.html`**
- Añadir `<link rel="preload">` para la imagen hero antes de cualquier script
- Mover el preload de fuentes DESPUÉS del preload de la imagen

### 1.2 Diferir Google Fonts (render-blocking)
Actualmente las fuentes bloquean el renderizado. Cambiar la estrategia:

**Archivo: `index.html`**
- Convertir los `<link rel="stylesheet">` de fuentes a carga asíncrona con un fallback
- Usar `media="print" onload="this.media='all'"` para carga no bloqueante
- Mantener los preconnects pero eliminar los preloads redundantes

### 1.3 Diferir GTM y GA4
Los scripts de analytics no deberían bloquear el FCP.

**Archivo: `index.html`**
- Mover GTM al final del body o cargarlo después del evento DOMContentLoaded
- Añadir `defer` o cargar GA4 de forma asíncrona real

---

## Fase 2: Code Splitting y Lazy Loading

### 2.1 Lazy load de rutas no críticas
La mayoría de las 60+ rutas se importan síncronamente en App.tsx.

**Archivo: `src/App.tsx`**
- Convertir todas las rutas excepto `Index` a `React.lazy()`:
  ```tsx
  const Blog = lazy(() => import("./pages/Blog"));
  const Pricing = lazy(() => import("./pages/Pricing"));
  // etc.
  ```
- Envolver las rutas con `<Suspense fallback={...}>`
- La página Index NO debe ser lazy (es la landing principal)

### 2.2 Lazy load de componentes pesados
**Archivos a modificar:**
- `ChatContainer.tsx`: El chat assistant se carga en todas las páginas públicas pero no es crítico
- `CookieBanner.tsx`: Tiene un delay de 500ms, perfecto para lazy load
- `Footer.tsx`: Está below the fold, puede cargarse diferido

### 2.3 Eliminar Framer Motion del critical path
Framer Motion es grande (~60KB gzip). El componente `FadeIn` se usa en el Hero.

**Archivo: `src/components/landing/HeroSection.tsx`**
- Para el contenido above-the-fold, usar CSS animations en lugar de Framer Motion
- Crear una versión "light" del componente FadeIn para el Hero

---

## Fase 3: Optimización de imágenes

### 3.1 Añadir dimensiones explícitas a la imagen hero
**Archivo: `src/components/landing/HeroSection.tsx`**
- Añadir `width` y `height` explícitos para evitar CLS y ayudar al browser
- Considerar usar `srcset` para diferentes tamaños de pantalla

### 3.2 Optimizar imágenes de Unsplash en HowItWorksSection
**Archivo: `src/components/landing/HowItWorksSection.tsx`**
- Las imágenes actuales son de alta resolución (2070px)
- Reducir el tamaño solicitado: `w=800` en lugar de `w=2070`
- Añadir `width` y `height` explícitos

---

## Fase 4: Optimización del Service Worker

### 4.1 Precachear la imagen hero
**Archivo: `public/sw.js`**
- Añadir `/images/hero-professional.webp` a `STATIC_ASSETS` para precarga

---

## Archivos a modificar

| Archivo | Cambios | Prioridad |
|---------|---------|-----------|
| `index.html` | Preload LCP, diferir fuentes, diferir GTM | Alta |
| `src/App.tsx` | Code splitting con React.lazy | Alta |
| `src/components/landing/HeroSection.tsx` | CSS animations, dimensiones img | Alta |
| `src/components/landing/HowItWorksSection.tsx` | Optimizar URLs Unsplash | Media |
| `public/sw.js` | Precachear hero image | Media |
| `src/components/chat/ChatContainer.tsx` | Lazy load ChatAssistant | Baja |
| `src/components/CookieBanner.tsx` | Ya tiene delay, considerar lazy | Baja |

---

## Impacto estimado

| Optimización | Impacto FCP | Impacto LCP |
|--------------|-------------|-------------|
| Preload imagen hero | - | -3s |
| Diferir fuentes | -2s | - |
| Diferir GTM/GA4 | -1s | - |
| Code splitting | -1s | -1s |
| Optimizar imágenes | - | -0.5s |

**Puntuación esperada**: 80-90 en móvil (actualmente 57)

---

## Detalles técnicos

### Cambios en index.html

```html
<!-- ANTES de cualquier script -->
<link rel="preload" href="/images/hero-professional.webp" as="image" fetchpriority="high">

<!-- Fuentes sin bloqueo de render -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=..." 
      rel="stylesheet" 
      media="print" 
      onload="this.media='all'">
<noscript>
  <link href="https://fonts.googleapis.com/css2?family=..." rel="stylesheet">
</noscript>

<!-- GTM diferido -->
<script>
  window.addEventListener('load', function() {
    // Cargar GTM después del load
  });
</script>
```

### Estructura de lazy loading en App.tsx

```tsx
import { Suspense, lazy } from "react";

// Componente crítico (no lazy)
import Index from "./pages/Index";

// Componentes lazy
const Blog = lazy(() => import("./pages/Blog"));
const Pricing = lazy(() => import("./pages/Pricing"));
// ... resto de páginas

// Fallback mínimo
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin h-8 w-8 border-2 border-foreground border-t-transparent rounded-full" />
  </div>
);

// En las rutas
<Route path="/blog" element={
  <Suspense fallback={<PageLoader />}>
    <Blog />
  </Suspense>
} />
```

### CSS animation para Hero (reemplazar FadeIn)

```css
/* En index.css */
@keyframes hero-fade-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-animate {
  animation: hero-fade-up 0.6s ease-out forwards;
}

.hero-animate-delay-1 { animation-delay: 0.1s; opacity: 0; }
.hero-animate-delay-2 { animation-delay: 0.2s; opacity: 0; }
```

---

## Notas importantes

1. **No romper la funcionalidad**: El código splitting debe probarse cuidadosamente con todas las rutas protegidas
2. **Mantener SEO**: Las optimizaciones no deben afectar al contenido visible para crawlers
3. **Fallbacks**: Siempre incluir fallbacks para fuentes y scripts diferidos
4. **Testing**: Verificar con PageSpeed después de cada fase para medir el impacto real
