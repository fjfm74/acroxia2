# Mejoras Guía de Negociación

Implementar 3 mejoras coordinadas para visibilizar y enriquecer la guía de negociación generada tras el análisis.

## Cambio 1 — Pricing B2C (frontend puro)

Editar `src/components/pricing/B2CPricing.tsx`:
- Reemplazar arrays `features` de los 3 planes con los nuevos copys.
- Añadir indicador visual: las 3 features nuevas del plan "Análisis Único" (guía PDF, email, burofax) llevan icono `Sparkles` (lucide-react) en lugar de `Check`.
- Feature negativa "Sin guía de negociación" en Escaneo Rápido: render con `text-muted-foreground line-through` y un icono `X`.
- Actualizar precio Pack Comparador a 59,99€ (subPrice "19,99€ por análisis").

## Cambio 2 — Teaser en FreeResultPreview

Crear `src/components/analyze/NegotiationGuideTeaser.tsx`:
- Props: `generatedLetter: string`, `problematicClausesCount: number`, `perspective: 'tenant' | 'landlord'`, `onUnlock: () => void`, `price: string`.
- Card destacada (border-primary/30, bg gradient sutil cream → muted).
- Header: icono `FileText` (charcoal bg circle) + título Playfair "Tu Guía de Negociación está lista".
- Sub: "Hemos preparado N puntos específicos para [reclamar a tu propietario / consensuar con tu inquilino]".
- Preview: primeros ~300 chars del `generatedLetter` legibles, resto con `filter: blur(4px)` + degradado white→transparent superpuesto.
- Overlay central: `Lock` icon + "Desbloquea la guía completa + email + burofax".
- CTA grande full-width: "Desbloquear por {price}€".
- Trust signals abajo en flex: "Descarga inmediata · PDF + email + burofax · Pago seguro Paddle".

Editar `src/pages/FreeResultPreview.tsx`:
- Importar y renderizar `<NegotiationGuideTeaser>` justo antes del paywall existente.
- Solo renderizar si `analysis.full_report?.generated_letter` existe.
- Pasar `perspective` desde el análisis (default 'tenant') y `price` (29 landlord / 34,99 tenant).

## Cambio 3 — Edge functions + migration + AnalysisResult

### Migration

Detectar tabla destino. Los campos `generated_letter` actuales viven dentro de `analysis_results.full_report` (jsonb) y `anonymous_analyses.analysis_result` (jsonb). NO necesita ALTER — guardar `generated_email` y `generated_burofax` dentro del mismo jsonb `full_report` / `analysis_result`. Esto evita la migración SQL y mantiene compatibilidad total.

(Decisión: guardar en jsonb existente — más simple que opción A propuesta y zero-risk. Confirmar con el usuario en chat tras el plan.)

### Edge functions

`supabase/functions/analyze-contract/index.ts` y `analyze-contract-public/index.ts`:
- Reemplazar `buildNegotiationGuidePrompt()` por nueva versión que:
  - Recibe `perspective`, `overall_risk`, `problematicClauses[]`.
  - Adapta tono según perspective (tenant firme/conciliador, landlord colaborativo).
  - Adapta firmeza según risk (low educativo, medium firme, high asertivo).
  - Inyecta cláusulas reales (texto + problema + severidad) en el prompt.
  - Pide JSON estructurado con 3 campos: `informative_guide`, `email_draft`, `burofax_draft`.
- Parsear respuesta del LLM (regex strip markdown code blocks, fallback robusto).
- Guardar los 3 campos en `full_report` (en analyze-contract: `analysis_results.full_report`; en analyze-contract-public: `anonymous_analyses.analysis_result`).
- Mantener `generated_letter` apuntando a `informative_guide` para no romper consumidores actuales.

### AnalysisResult.tsx

En la sección actual del botón "Descargar guía de negociación":
- Renombrar bloque a "Documentos para actuar" (h3 Playfair).
- Botón 1 (existente): "Descargar guía de negociación" + icono `FileText` → PDF de `generated_letter`.
- Botón 2 (nuevo, si `generated_email` existe): "Copiar borrador de email" + icono `Mail` → `navigator.clipboard.writeText` + `toast.success("Copiado al portapapeles")`.
- Botón 3 (nuevo, si `generated_burofax` existe): "Descargar burofax" + icono `FileWarning` → PDF jsPDF.
- Layout: grid responsive (1 col mobile, 3 col desktop) en card destacada.

## Detalles técnicos

- Los 3 botones de AnalysisResult requieren leer `full_report.generated_email` y `full_report.generated_burofax` del análisis ya cargado.
- Mantener PDF generation existente (jsPDF) y replicar para burofax.
- No tocar precios ni planes más allá del Cambio 1.
- No añadir paquetes — usar lucide-react, jsPDF y sonner ya presentes.

## Riesgos

- Edge function: el LLM puede devolver JSON inválido. Implementar fallback: si falla parse, intentar regex de los 3 bloques; si no, guardar respuesta cruda como `generated_letter` y omitir email/burofax.
- Coste/latencia: una sola llamada que devuelve 3 docs es más barato que 3 llamadas. Mantener temperatura baja (0.4) para JSON consistente.
