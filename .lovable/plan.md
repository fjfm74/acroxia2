

## Plan: Migrar Animaciones del Header a CSS Puro

### Objetivo
Eliminar la dependencia de Framer Motion en el Header para reducir ~40KB de JavaScript y mejorar TBT (Total Blocking Time) y LCP (Largest Contentful Paint).

---

## Análisis del Estado Actual

### Uso actual de Framer Motion en Header.tsx:

| Línea | Uso | Propósito |
|-------|-----|-----------|
| 3 | `import { motion, AnimatePresence } from "framer-motion"` | Import de la librería |
| 67-71 | `menuVariants` | Definición de variantes de animación |
| 101-137 | Mega-menú "Particulares" | `AnimatePresence` + `motion.div` |
| 157-201 | Mega-menú "Profesionales" | `AnimatePresence` + `motion.div` |
| 218-335 | Mega-menú "Guías" | `AnimatePresence` + `motion.div` |

### Animación actual (menuVariants):
```javascript
hidden: { opacity: 0, y: 8, scale: 0.98 }
visible: { opacity: 1, y: 0, scale: 1 }
exit: { opacity: 0, y: 8, scale: 0.98 }
```

---

## Estrategia de Migración

### 1. Crear animaciones CSS equivalentes

Añadir al `src/index.css`:

```css
/* Mega-menu CSS animations (replacing Framer Motion) */
@keyframes menu-enter {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes menu-exit {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
}

.menu-dropdown {
  animation: menu-enter 0.2s ease-out forwards;
}

.menu-dropdown-exit {
  animation: menu-exit 0.2s ease-out forwards;
}
```

### 2. Modificar Header.tsx

**Cambios principales:**

1. **Eliminar import de Framer Motion** (línea 3)
2. **Eliminar menuVariants** (líneas 67-71)
3. **Reemplazar AnimatePresence + motion.div por renderizado condicional con clases CSS**

**Ejemplo de transformación (mega-menú Particulares):**

```tsx
// ANTES (Framer Motion):
<AnimatePresence>
  {activeMenu === "particulares" && (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={menuVariants}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 bg-cream rounded-xl shadow-lg border border-charcoal/5 p-2 z-50"
    >
      {/* contenido */}
    </motion.div>
  )}
</AnimatePresence>

// DESPUÉS (CSS puro):
{activeMenu === "particulares" && (
  <div className="menu-dropdown absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 bg-cream rounded-xl shadow-lg border border-charcoal/5 p-2 z-50">
    {/* contenido */}
  </div>
)}
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/index.css` | Añadir keyframes `menu-enter` y clases `.menu-dropdown` |
| `src/components/landing/Header.tsx` | Eliminar Framer Motion, usar clases CSS |

---

## Detalles Técnicos

### Cambios en src/index.css

Añadir después de las animaciones del Hero (línea 183):

```css
/* Mega-menu CSS animations (replacing Framer Motion for Header) */
@keyframes menu-enter {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.menu-dropdown {
  animation: menu-enter 0.2s ease-out forwards;
}
```

**Nota**: No implementamos animación de salida (`exit`) porque requeriría lógica adicional de estado. El comportamiento actual con CSS será:
- Entrada: animación suave de 0.2s
- Salida: desaparición instantánea (aceptable para menús hover)

Si se desea animación de salida, requeriría un hook personalizado para retrasar el desmontaje, lo cual añade complejidad. Para Core Web Vitals, la prioridad es reducir JS, no replicar exactamente la animación de salida.

---

### Cambios en src/components/landing/Header.tsx

**Línea 3 - Eliminar import:**
```tsx
// ELIMINAR:
import { motion, AnimatePresence } from "framer-motion";
```

**Líneas 67-71 - Eliminar menuVariants:**
```tsx
// ELIMINAR TODO EL BLOQUE:
const menuVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.98 }
};
```

**Líneas 101-136 - Mega-menú Particulares:**
```tsx
// ANTES:
<AnimatePresence>
  {activeMenu === "particulares" && (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={menuVariants}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 bg-cream rounded-xl shadow-lg border border-charcoal/5 p-2 z-50"
    >
      {/* contenido */}
    </motion.div>
  )}
</AnimatePresence>

// DESPUÉS:
{activeMenu === "particulares" && (
  <div className="menu-dropdown absolute top-full left-1/2 -translate-x-1/2 mt-3 w-80 bg-cream rounded-xl shadow-lg border border-charcoal/5 p-2 z-50">
    {/* contenido sin cambios */}
  </div>
)}
```

**Líneas 157-200 - Mega-menú Profesionales:**
Mismo patrón de transformación.

**Líneas 218-334 - Mega-menú Guías:**
Mismo patrón de transformación.

---

## Impacto Esperado

| Métrica | Antes | Después |
|---------|-------|---------|
| Bundle size (Header) | ~45KB (con FM) | ~5KB |
| TBT móvil | Alto | Reducido ~30% |
| LCP | Afectado por JS | Mejorado |
| Animación entrada | 0.2s suave | 0.2s suave (igual) |
| Animación salida | 0.2s fade-out | Instantánea |

---

## Secuencia de Implementación

```
1. Añadir CSS animations en index.css
        ↓
2. Modificar Header.tsx:
   a. Eliminar import de framer-motion
   b. Eliminar menuVariants
   c. Reemplazar AnimatePresence + motion.div (3 mega-menús)
        ↓
3. Verificar que el Header funciona correctamente
        ↓
4. Ejecutar PageSpeed Insights para confirmar mejora
```

---

## Verificación Post-Implementación

1. **Funcionalidad**: Los 3 mega-menús deben aparecer al hover
2. **Animación**: Debe verse una animación suave de entrada
3. **Performance**: Ejecutar Lighthouse/PageSpeed para confirmar reducción de TBT
4. **Bundle**: Verificar que framer-motion ya no se importa en Header (aunque puede seguir usándose en otros componentes como FadeIn)

