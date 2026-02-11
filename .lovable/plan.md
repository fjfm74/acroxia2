

## Correccion SEO: Meta Descriptions y FAQPage Schema Completo

### Diagnostico

#### 1. Crawlers recibiendo 403
Esto NO es un problema del codigo. El `robots.txt` y los headers estan correctos. El 403 viene de la configuracion del CDN/hosting de Lovable, que puede estar bloqueando ciertos User-Agents. **Esto requiere configuracion en Lovable Cloud / dominio, no cambios de codigo.**

Lo que SI podemos hacer desde el codigo: nada directamente. Pero se recomienda verificar la configuracion del dominio en Lovable Settings > Domains.

#### 2. Meta descriptions "duplicadas" para crawlers sin JS
**Estado actual**: Cada pagina tiene su meta description unica via React Helmet. PERO los crawlers que no ejecutan JavaScript (DinoRank, SEMrush, algunos bots) solo ven la meta description del `index.html`:

```
"Detecta clausulas abusivas en tu contrato de alquiler en menos de 2 minutos con IA."
```

Esto NO se puede resolver con React Helmet en una SPA pura sin SSR/pre-rendering. Google si ejecuta JS y ve las metas correctas. Las herramientas SEO de terceros no.

**Accion**: No hay cambio de codigo necesario para este punto. Las meta descriptions ya son unicas para Google. Si herramientas como DinoRank las ven duplicadas, es porque no ejecutan JS.

#### 3. FAQPage schema incompleto en /faq
**Problema real**: El schema JSON-LD en `FAQ.tsx` solo incluye 10 de las 43 preguntas que hay en `FAQCategories.tsx`. Google no ve las 33 preguntas restantes en el structured data.

**Solucion**: Generar el schema FAQPage directamente desde el array `categories` de `FAQCategories.tsx`, exportandolo para que `FAQ.tsx` lo use al construir el JSON-LD con las 43 preguntas completas.

---

### Cambios a implementar

#### Archivo 1: `src/components/faq/FAQCategories.tsx`
- Exportar el array `categories` (actualmente es `const` local)
- Esto permite que `FAQ.tsx` lo importe para generar el schema

#### Archivo 2: `src/pages/FAQ.tsx`
- Importar `categories` desde `FAQCategories`
- Reemplazar el schema hardcodeado de 10 preguntas por uno generado dinamicamente con las 43 preguntas extraidas del array de categorias
- Formato:

```typescript
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": categories.flatMap(cat => 
    cat.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  )
};
```

Esto genera automaticamente el schema con las 43 preguntas sin duplicar datos.

---

### Resumen de impacto

| Punto | Estado | Accion |
|-------|--------|--------|
| 403 crawlers | Problema de hosting, no de codigo | Revisar config dominio en Lovable Settings |
| Meta descriptions | Ya son unicas (React Helmet). Solo duplicadas para bots sin JS | Sin cambio de codigo necesario |
| FAQPage schema | Solo 10 de 43 preguntas | Generar schema completo desde el array de categorias |

### Archivos a modificar
- `src/components/faq/FAQCategories.tsx` (exportar array)
- `src/pages/FAQ.tsx` (generar schema dinamico con 43 preguntas)

