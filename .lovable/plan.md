

## Plan: Optimizar textos de la Home para precision, credibilidad y audiencia completa

### Problema identificado
Los textos actuales de la homepage tienen tres problemas principales:
1. **Sesgo de audiencia**: Todo el messaging habla exclusivamente a inquilinos, cuando ACROXIA tambien sirve a propietarios y profesionales
2. **Datos sin respaldo**: Las estadisticas (632.369 contratos, 73%, 850 EUR abogado) no tienen fuente verificable y el coste del abogado parece exagerado
3. **Formatos desactualizados**: Se menciona "PDF o imagen" pero se aceptan tambien DOCX, WEBP

---

### Cambios propuestos

#### 1. HeroSection.tsx - Ampliar audiencia y precisar

**Etiqueta superior**: Sin cambios ("Analisis de contratos con inteligencia artificial" es correcto)

**H1**: Cambiar de "Protege tus derechos como inquilino" a:
> "Tu contrato de alquiler, analizado por IA"

Razon: Neutro respecto a inquilino/propietario, enfocado en el producto, incluye keyword "contrato de alquiler" + "IA".

**Subtitulo**: Cambiar a:
> "Sube tu contrato y descubre en menos de 2 minutos si contiene clausulas que podrian ser abusivas o no conformes con la legislacion vigente. Para inquilinos y propietarios."

**Trust signals**: Cambiar "Sin registro inicial" a "Preview gratuito sin registro"

#### 2. StatsSection.tsx - Datos verificables y audiencia ampliada

**H2**: Cambiar de "El problema es mas grande de lo que piensas" a:
> "Por que analizar tu contrato es importante"

**Subtitulo**: Cambiar a:
> "Tanto inquilinos como propietarios se enfrentan a contratos con clausulas que podrian no ajustarse a la normativa. Los datos lo confirman."

**Estadisticas revisadas** (datos mas conservadores y verificables):

| Actual | Propuesto | Razon |
|--------|-----------|-------|
| 632.369 contratos venceran | 1,9M de contratos de alquiler activos en Espana | Dato INE verificable |
| 73% desconocen derechos | 7 de cada 10 inquilinos no revisan su contrato antes de firmar | Mas creible, formulacion menos absoluta |
| 850 EUR abogado | 150-300 EUR es el coste medio de una consulta juridica especializada | Rango realista segun colegios de abogados |
| <2 min ACROXIA | <2 min es el tiempo de analisis con ACROXIA | Sin cambios, es preciso |

#### 3. HowItWorksSection.tsx - Actualizar formatos

**Paso 1 descripcion**: Cambiar de "Arrastra tu PDF o imagen del contrato. Aceptamos cualquier formato legible." a:
> "Arrastra tu PDF, DOCX o imagen del contrato. Aceptamos los formatos mas comunes."

---

### Seccion tecnica

**Archivos a modificar:**
- `src/components/landing/HeroSection.tsx` (lineas 31-32, 35-36, 39-40, 53)
- `src/components/landing/StatsSection.tsx` (lineas 3-19, 28-33)
- `src/components/landing/HowItWorksSection.tsx` (linea 7)

**Sin impacto en:**
- SEO schemas (se actualizaran automaticamente al cambiar el H1)
- Speakable (la clase `.speakable-summary` se mantiene en el subtitulo)
- Animaciones (todas las clases CSS de animacion se preservan)
- Estructura visual (no hay cambios de layout ni componentes)

