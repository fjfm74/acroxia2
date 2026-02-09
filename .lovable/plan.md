

## Fase 3: Entity Stacking y Mejoras Menores en Guias SEO

### Objetivo
Reforzar la jerarquia de entidades (Entity Stacking) en las 8 guias SEO pilares mediante vinculacion bidireccional WebPage-Article, y aplicar mejoras menores pendientes.

---

### 1. Entity Stacking: Vinculacion bidireccional WebPage - Article

**Problema actual**: Los schemas `WebPage` y `Article` existen por separado sin vincularse mutuamente. Google no entiende que el Article es el contenido principal del WebPage.

**Solucion**: Anadir `mainEntity` al schema WebPage apuntando al Article, y asegurar que el Article tiene `mainEntityOfPage` apuntando al WebPage. Esto crea un grafo de entidades conectado.

**Cambio en cada WebPage schema**:
```typescript
// Anadir al schema WebPage existente:
"mainEntity": {
  "@type": "Article",
  "@id": "https://acroxia.com/[slug]#article"
}
```

**Cambio en cada Article schema**:
```typescript
// Anadir @id al Article y mainEntityOfPage si falta:
"@id": "https://acroxia.com/[slug]#article",
"mainEntityOfPage": {
  "@type": "WebPage",
  "@id": "https://acroxia.com/[slug]"
}
```

---

### 2. Actualizar dateModified a febrero 2026

Todas las guias tienen `dateModified: "2026-01-23"` o `"2026-01-25"`. Al hacer cambios en los schemas, actualizar a `"2026-02-09"` para reflejar la fecha real de modificacion.

---

### 3. Paginas afectadas (8 archivos)

| Archivo | WebPage mainEntity | Article @id + mainEntityOfPage | dateModified |
|---------|-------------------|-------------------------------|--------------|
| `ClausulasAbusivas.tsx` | Anadir | Existe parcial, completar @id | Actualizar |
| `DevolucionFianza.tsx` | Anadir | Existe parcial, completar @id | Actualizar |
| `SubidaAlquiler2026.tsx` | Anadir | Existe parcial, completar @id | Actualizar |
| `ContratoAlquilerPropietarios.tsx` | Anadir | Falta mainEntityOfPage, anadir @id | Actualizar |
| `ImpagoAlquilerPropietarios.tsx` | Anadir | Falta mainEntityOfPage, anadir @id | Actualizar |
| `ZonasTensionadasPropietarios.tsx` | Anadir | Falta mainEntityOfPage, anadir @id | Actualizar |
| `DepositoFianzaPropietarios.tsx` | Anadir | Falta mainEntityOfPage, anadir @id | Actualizar |
| `FinContratoAlquilerPropietarios.tsx` | Anadir | Falta mainEntityOfPage, anadir @id | Actualizar |

---

### 4. Mejoras menores adicionales

**4a. Anadir `publisher` faltante en WebPage schemas de propietarios**
Las 5 guias de propietarios no tienen `publisher` en el WebPage schema (las de inquilinos si lo tienen). Unificar anadiendo:
```typescript
"publisher": {
  "@type": "Organization",
  "name": "ACROXIA",
  "url": "https://acroxia.com"
}
```

**4b. Anadir `datePublished` faltante en WebPage schemas de propietarios**
Las guias de propietarios no incluyen `datePublished` en el WebPage. Anadir para consistencia.

**4c. Actualizar `public/llms.txt`**
Cambiar "Enero 2026" a "Febrero 2026" si no se actualizo ya.

---

### Seccion tecnica: Ejemplo de schema final (Entity Stacking completo)

```typescript
// WebPage schema (con Entity Stacking)
const pageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": "https://acroxia.com/clausulas-abusivas-alquiler",
  "name": "Clausulas Abusivas en Contratos de Alquiler - Guia 2026",
  "description": "...",
  "url": "https://acroxia.com/clausulas-abusivas-alquiler",
  "datePublished": "2026-01-01",
  "dateModified": "2026-02-09",
  "inLanguage": "es-ES",
  "publisher": { "@type": "Organization", "name": "ACROXIA", "url": "https://acroxia.com" },
  "isPartOf": { "@type": "WebSite", "name": "ACROXIA", "url": "https://acroxia.com" },
  "mainEntity": { "@type": "Article", "@id": "https://acroxia.com/clausulas-abusivas-alquiler#article" }
};

// Article schema (con vinculacion inversa)
const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": "https://acroxia.com/clausulas-abusivas-alquiler#article",
  "headline": "...",
  "datePublished": "2026-01-01",
  "dateModified": "2026-02-09",
  "mainEntityOfPage": { "@type": "WebPage", "@id": "https://acroxia.com/clausulas-abusivas-alquiler" },
  "speakable": { "@type": "SpeakableSpecification", "cssSelector": ["h1", ".speakable-summary"] },
  // ... resto
};
```

---

### Resultado esperado

- Google Knowledge Graph entiende la relacion jerarquica WebPage - Article
- Mejora la elegibilidad para AI Overviews al tener entidades interconectadas
- Schemas consistentes en las 8 guias con fechas actualizadas
- Mayor probabilidad de rich snippets al tener publisher uniforme

