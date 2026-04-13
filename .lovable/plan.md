

## Plan: Corregir textos engañosos y alinear con el flujo real

### Problema
Varios textos dicen "Sin registro" o "Sin suscripción" cuando en realidad el flujo requiere registro obligatorio para acceder al informe completo. Además, tras la compra no se añade al usuario a la newsletter según su perfil.

### Cambios de texto

| Archivo | Texto actual | Texto nuevo |
|---|---|---|
| `src/pages/FreeResultPreview.tsx` (l.362) | "Pago único · Sin suscripción" | "Pago único · Incluye registro gratuito" |
| `src/components/landing/HeroSection.tsx` (l.53) | "✓ Preview gratuito sin registro" | "✓ Preview gratuito en 2 minutos" |
| `src/components/landing/InlineLeadCTA.tsx` (l.86) | "Sin registro previo · 100% confidencial" | "100% confidencial · Basado en la LAU 2026" |
| `src/components/propietarios/PropietariosCTA.tsx` (l.17) | "Preview gratuito sin registro." | "Preview gratuito en 2 minutos." |
| `src/pages/AnalyzePublic.tsx` SEO description | "...sin registro." | "...100% confidencial." |
| `src/pages/AnalyzePublic.tsx` badge (l.286) | "100% Gratuito · Sin registro" | "100% Gratuito · Resultado en 2 min" |
| `src/pages/AnalyzePublic.tsx` schema (l.268) | "Análisis preview gratuito sin registro" | "Análisis preview gratuito en 2 minutos" |
| `src/pages/Index.tsx` SEO description (l.89) | "...Sin registro." | "...100% confidencial." |
| `src/pages/Pricing.tsx` schema (l.39) | "...Sin registro." | "...100% confidencial." |
| `src/components/pricing/LandlordPricing.tsx` (l.14) | "Pago único por contrato" | "Pago único · Incluye cuenta gratuita" |

### Newsletter automática post-registro

Modificar el flujo de registro (`src/pages/Register.tsx`) para que, tras crear la cuenta, se inserte automáticamente al usuario en `blog_subscribers` con la audiencia correspondiente a su `user_type` (inquilino/propietario/profesional), activando el doble opt-in igual que el formulario de suscripción del blog.

### Archivos a modificar
1. **Textos**: `FreeResultPreview.tsx`, `HeroSection.tsx`, `InlineLeadCTA.tsx`, `PropietariosCTA.tsx`, `AnalyzePublic.tsx`, `Index.tsx`, `Pricing.tsx`, `LandlordPricing.tsx`
2. **Newsletter**: `src/pages/Register.tsx` - añadir inserción en `blog_subscribers` tras registro exitoso

