

## Plan: FAQs con Schema FAQPage en Blog + Títulos Optimizados para SERP

### Resumen

Implementar dos optimizaciones críticas para SEO y AEO:
1. **FAQs en cada post del blog**: Generar automáticamente 3-5 preguntas frecuentes con schema FAQPage para capturar AI Overviews y Featured Snippets
2. **Títulos más cortos**: Limitar los títulos generados a máximo 55-60 caracteres para evitar truncamiento en SERPs

---

## Cambios a Realizar

### 1. Modificar la Generación de Posts para Incluir FAQs

#### Archivos afectados:
- `supabase/functions/generate-blog-post/index.ts`
- `supabase/functions/schedule-daily-post/index.ts`
- `supabase/functions/schedule-daily-post-landlord/index.ts`

#### Cambios en el prompt del sistema:

**Antes (formato JSON de respuesta):**
```json
{
  "title": "título",
  "excerpt": "resumen",
  "content": "contenido",
  "category": "categoría"
}
```

**Después (formato JSON ampliado):**
```json
{
  "title": "título (máx 55 caracteres)",
  "excerpt": "resumen (máx 160 caracteres)",
  "content": "contenido Markdown",
  "category": "categoría",
  "faqs": [
    {
      "question": "Pregunta frecuente 1",
      "answer": "Respuesta concisa (2-3 frases)"
    },
    {
      "question": "Pregunta frecuente 2",
      "answer": "Respuesta concisa"
    }
  ]
}
```

#### Instrucciones adicionales en el prompt:
```text
REGLAS DE TÍTULOS (OBLIGATORIO):
- Longitud máxima: 55 caracteres
- Si excede, acorta sin perder el significado

FAQs (OBLIGATORIO):
- Incluye 3-5 preguntas frecuentes relacionadas con el tema
- Las preguntas deben ser en primera persona ("¿Puedo...?", "¿Qué hago si...?")
- Las respuestas deben ser concisas (2-3 frases, máximo 300 caracteres)
- Deben ser preguntas que alguien haría a Google o a un asistente de IA
```

---

### 2. Modificar la Base de Datos

#### Nueva columna en `blog_posts`:
```sql
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]'::jsonb;
```

Esta columna almacenará las FAQs en formato:
```json
[
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."}
]
```

---

### 3. Modificar BlogPost.tsx para Mostrar FAQs con Schema

#### Ubicación en el artículo:
```text
[Contenido del artículo]
        ↓
[Sección FAQ con Accordion]
        ↓
[Disclaimer legal]
        ↓
[CTA "Analizar contrato"]
```

#### Componente visual:
```jsx
{/* Sección FAQ */}
{post.faqs && post.faqs.length > 0 && (
  <div className="mt-12 bg-muted/50 rounded-2xl p-8">
    <h2 className="font-serif text-2xl font-semibold mb-6">
      Preguntas frecuentes
    </h2>
    <Accordion type="single" collapsible>
      {post.faqs.map((faq, index) => (
        <AccordionItem key={index} value={`faq-${index}`}>
          <AccordionTrigger>{faq.question}</AccordionTrigger>
          <AccordionContent>{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </div>
)}
```

#### Schema JSON-LD adicional:
```jsx
const faqSchema = post.faqs && post.faqs.length > 0 ? {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": post.faqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
} : null;

// En <Helmet>:
{faqSchema && (
  <script type="application/ld+json">
    {JSON.stringify(faqSchema)}
  </script>
)}
```

---

### 4. Actualizar las Funciones de Generación

#### `schedule-daily-post/index.ts` y `schedule-daily-post-landlord/index.ts`:

**Cambios en el parsing:**
```typescript
interface PostData {
  title: string;
  excerpt: string;
  category: string;
  content: string;
  faqs?: Array<{ question: string; answer: string }>;
}

function parseAiResponse(content: string, fallbackCategory: string): PostData {
  // ... parsing existente ...
  
  // Extraer FAQs del JSON
  const faqs = parsed.faqs || [];
  
  return {
    title: parsed.title.substring(0, 60), // Truncar si excede
    excerpt: parsed.excerpt,
    category: parsed.category,
    content: parsed.content,
    faqs: faqs.slice(0, 5), // Máximo 5 FAQs
  };
}
```

**Cambios en el insert:**
```typescript
const { data: blogPost, error: insertError } = await supabase
  .from("blog_posts")
  .insert({
    title: post.title,
    slug: slug,
    content: post.content,
    excerpt: post.excerpt,
    category: post.category,
    image: imageUrl,
    status: "published",
    published_at: new Date().toISOString(),
    audience: "inquilino",
    read_time: `${Math.ceil(post.content.split(/\s+/).length / 200)} min`,
    faqs: post.faqs || [],  // ← Nueva línea
  })
  .select()
  .single();
```

---

### 5. Actualizar el Prompt de Títulos

**Cambios en las instrucciones de título:**

```text
TÍTULO (OBLIGATORIO):
- Máximo 55 caracteres (Google trunca a partir de ~60)
- Usa sentence case (solo primera letra mayúscula)
- Evita "Guía completa de..." - prefiere formatos concisos
- Ejemplos correctos:
  - "Cómo reclamar tu fianza paso a paso" (38 chars) ✓
  - "5 cláusulas abusivas en contratos" (34 chars) ✓
  - "Qué hacer si el casero no repara" (33 chars) ✓
- Ejemplos incorrectos (demasiado largos):
  - "La guía completa sobre cómo reclamar la fianza cuando el casero se niega a devolverla" (87 chars) ✗
```

---

## Resumen de Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| **Migración SQL** | Nueva columna `faqs JSONB` en `blog_posts` |
| `supabase/functions/schedule-daily-post/index.ts` | Añadir FAQs al prompt y parsing, limitar títulos a 55 chars |
| `supabase/functions/schedule-daily-post-landlord/index.ts` | Añadir FAQs al prompt y parsing, limitar títulos a 55 chars |
| `supabase/functions/generate-blog-post/index.ts` | Añadir FAQs al prompt y respuesta |
| `src/pages/BlogPost.tsx` | Renderizar FAQs con Accordion + Schema FAQPage |

---

## Impacto SEO/AEO Esperado

| Métrica | Antes | Después |
|---------|-------|---------|
| Títulos truncados en SERP | ~60% | ~5% |
| Featured Snippets potenciales | 0 | 100% de posts |
| AI Overviews eligibles | Bajo | Alto |
| Schema FAQPage | Solo en guías SEO | Todos los posts |

---

## Secuencia de Implementación

```text
1. Crear migración SQL (nueva columna faqs)
        ↓
2. Modificar schedule-daily-post/index.ts
   - Actualizar prompt con límite de título
   - Añadir FAQs al formato JSON
   - Parsear y guardar FAQs
        ↓
3. Modificar schedule-daily-post-landlord/index.ts
   - Mismos cambios
        ↓
4. Modificar generate-blog-post/index.ts
   - Añadir FAQs al formato de respuesta
        ↓
5. Modificar BlogPost.tsx
   - Renderizar sección FAQ con Accordion
   - Añadir schema FAQPage al <Helmet>
        ↓
6. Desplegar Edge Functions
```

---

## Notas Técnicas

- Los posts existentes tendrán `faqs: []` (array vacío) y no mostrarán la sección FAQ
- El schema FAQPage solo se genera si hay al menos 1 FAQ
- El límite de 55 caracteres se aplica en el parsing como fallback, pero el prompt instruye a la IA a respetar el límite
- Se usa el mismo patrón de Accordion que ya existe en las guías SEO (e.g., ClausulasAbusivas.tsx)

