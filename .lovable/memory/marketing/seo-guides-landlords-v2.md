# Memory: marketing/seo-guides-landlords-v2
Updated: 2026-01-22

Guías SEO para Propietarios (v2): Implementadas 5 páginas optimizadas para búsquedas de arrendadores con breadcrumbs consistentes y mega-menú actualizado.

## URLs y Contenido

| URL | Tema | Contenido clave |
|-----|------|-----------------|
| `/contrato-alquiler-propietarios` | Requisitos LAU 2026 | Fianzas (máx 3 meses), zonas tensionadas, SERPAVI |
| `/impago-alquiler-propietarios` | Pasos ante impago | Burofax, desahucio express, seguros de impago |
| `/zonas-tensionadas-propietarios` | SERPAVI y límites | Límites de renta, bonificaciones fiscales, declaración obligatoria |
| `/deposito-fianza-propietarios` | Organismos por CCAA | INCASOL, IVIMA, plazos, sanciones, descuentos permitidos |
| `/fin-contrato-alquiler-propietarios` | Prórrogas y recuperación | Plazos LAU, preaviso 4 meses, recuperación por necesidad |

## Estructura Técnica

### Breadcrumbs
- Todos con enlace al hub `/propietarios` en el primer nivel
- Formato: Inicio → Propietarios → [Título específico]
- Schema.org BreadcrumbList con URLs válidas en todos los niveles

### Esquemas JSON-LD
- WebPage como entidad principal
- FAQPage separada para AI Overviews
- HowTo en páginas con pasos (impago, depósito, fin de contrato)

### CTAs
- Primario: `/propietarios` (ver planes)
- Secundario: `/analizar-gratis` (analizar contrato)

## Navegación

### Mega-menú Header (Desktop)
Dividido en 2 columnas:
- **Para Inquilinos**: Cláusulas abusivas, Devolución fianza, Subida alquiler 2026
- **Para Propietarios**: Impago, Zonas tensionadas, Depósito fianza, Fin de contrato

### Menú Móvil
Subsecciones separadas con títulos "Guías para Inquilinos" y "Guías para Propietarios"

### Iconos por guía
- Impago: AlertTriangle (red)
- Zonas tensionadas: MapPin (purple)
- Depósito fianza: Wallet (amber)
- Fin de contrato: Clock (slate)

## SEO y GEO

- Registradas en `sitemap.xml` con priority 0.8
- Documentadas en `llms-full.txt`:
  - Sección 2.5: Casos de uso para propietarios
  - Sección 8.4: Descripción detallada de cada guía
  - Sección 9: URLs completas
  - Sección 11: Ejemplos de respuesta para LLMs
