

## Plan: Validar Schemas + Edge Function para Regenerar FAQs y Títulos

### Parte 1: Validación de Schemas JSON-LD

Para validar los schemas, utilizaré el **Rich Results Test de Google** con las URLs del proyecto:

**URLs a validar:**
- Home: `https://acroxia.com/` (4 schemas: Organization, WebSite, SoftwareApplication, HowTo)
- Blog post con FAQs: `https://acroxia.com/blog/alquiler-en-2026-puedo-negociar-la-renta-inicial` (2 schemas: Article, FAQPage)

Los schemas que he verificado en el código están correctos tras las correcciones anteriores:
- Logo URL: `/acroxia-logo.png` ✓
- No hay aggregateRating falso ✓
- No hay SearchAction roto ✓
- isPartOf y mainEntityOfPage en artículos ✓
- hreflang configurado ✓

Sin embargo, la validación real debe hacerse en Google Rich Results Test (https://search.google.com/test/rich-results) - esta herramienta no está disponible mediante API, por lo que te recomiendo validar manualmente estas URLs.

---

### Parte 2: Edge Function para Regenerar FAQs y Títulos

#### Estadísticas actuales:
| Métrica | Valor |
|---------|-------|
| Total posts publicados | 55 |
| Posts sin FAQs | **52** (95%) |
| Posts con título > 60 chars | **37** (67%) |
| Media longitud título | 75 caracteres |

#### Nueva Edge Function: `batch-update-blog-posts`

Esta función procesará los posts existentes para:
1. Generar 3-5 FAQs por post usando IA
2. Acortar títulos a máximo 55 caracteres
3. Actualizar la base de datos

---

## Arquitectura de la Edge Function

```
┌──────────────────────────────────────────────────────────────┐
│                  batch-update-blog-posts                     │
├──────────────────────────────────────────────────────────────┤
│  1. Query posts sin FAQs o título > 60 chars                │
│  2. Para cada post (batch de 5):                            │
│     a. Enviar título + excerpt + content a IA               │
│     b. Generar FAQs + título optimizado                     │
│     c. Actualizar DB                                        │
│  3. Retornar estadísticas                                   │
└──────────────────────────────────────────────────────────────┘
```

---

## Detalles Técnicos

### Archivo: `supabase/functions/batch-update-blog-posts/index.ts`

```typescript
// Estructura de la función
interface UpdateRequest {
  dryRun?: boolean;       // Si true, no actualiza DB
  limit?: number;         // Límite de posts a procesar (default: 10)
  postIds?: string[];     // IDs específicos (opcional)
}

interface PostUpdate {
  id: string;
  originalTitle: string;
  newTitle: string;
  titleChanged: boolean;
  faqsGenerated: number;
  success: boolean;
  error?: string;
}

interface UpdateResponse {
  processed: number;
  updated: number;
  errors: number;
  details: PostUpdate[];
}
```

### Prompt de IA para generar FAQs y optimizar títulos:

```
TAREA: Optimizar título y generar FAQs para un artículo existente.

ARTÍCULO:
Título actual: "${post.title}"
Extracto: "${post.excerpt}"
Contenido (primeros 2000 chars): "${post.content.substring(0, 2000)}"

INSTRUCCIONES:

1. TÍTULO OPTIMIZADO (OBLIGATORIO):
   - Máximo 55 caracteres
   - Mantén el significado original
   - Usa sentence case
   - Si el título actual ya cumple, devuelve el mismo
   
2. FAQs (OBLIGATORIO):
   - Genera 3-5 preguntas frecuentes basadas en el contenido
   - Preguntas en primera persona: "¿Puedo...?", "¿Qué hago si...?"
   - Respuestas concisas (2-3 frases, máx 300 chars)

Responde SOLO con JSON:
{
  "title": "título optimizado (máx 55 chars)",
  "faqs": [
    {"question": "...", "answer": "..."}
  ]
}
```

### Rate Limiting y Batching:

- Procesar en batches de 5 posts
- 2 segundos de delay entre llamadas a la IA
- Timeout de 120 segundos para la función
- Retry logic con MAX_RETRIES = 2

### Endpoint y Seguridad:

```typescript
// Solo admins pueden ejecutar
const authHeader = req.headers.get('Authorization');
const { data: { user } } = await supabase.auth.getUser(token);
const isAdmin = await checkIsAdmin(user.id);

if (!isAdmin) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
}
```

---

## Configuración en config.toml

```toml
[functions.batch-update-blog-posts]
verify_jwt = false  # Validamos manualmente
```

---

## Uso de la Edge Function

### Dry Run (ver qué cambiaría sin modificar):
```bash
POST /functions/v1/batch-update-blog-posts
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "dryRun": true,
  "limit": 5
}
```

### Ejecución real (batches de 10):
```bash
POST /functions/v1/batch-update-blog-posts
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "dryRun": false,
  "limit": 10
}
```

### Respuesta esperada:
```json
{
  "processed": 10,
  "updated": 9,
  "errors": 1,
  "details": [
    {
      "id": "abc123",
      "originalTitle": "La comunicación de preaviso para finalizar el contrato: plazos...",
      "newTitle": "Preaviso de fin de contrato: plazos 2026",
      "titleChanged": true,
      "faqsGenerated": 4,
      "success": true
    }
  ]
}
```

---

## Ejecución por Fases

Para procesar los 52 posts, recomiendo ejecutar en fases:

| Fase | Posts | Tiempo estimado |
|------|-------|-----------------|
| 1 | 10 posts (dry run) | 2 min |
| 2 | 10 posts (real) | 3 min |
| 3 | 10 posts (real) | 3 min |
| 4 | 10 posts (real) | 3 min |
| 5 | 10 posts (real) | 3 min |
| 6 | 12 posts (real) | 4 min |

Total: ~18 minutos para procesar todos los posts.

---

## Secuencia de Implementación

1. Crear `supabase/functions/batch-update-blog-posts/index.ts`
2. Añadir configuración en `supabase/config.toml`
3. Desplegar la función
4. Ejecutar dry run con limit=5 para verificar
5. Ejecutar en batches de 10 hasta completar todos los posts
6. Validar FAQs generadas en Rich Results Test

---

## Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `supabase/functions/batch-update-blog-posts/index.ts` | **Crear** |
| `supabase/config.toml` | Añadir configuración de la nueva función |

---

## Validación Post-Implementación

Después de ejecutar el batch:
1. Verificar en DB que todos los posts tienen FAQs
2. Verificar que todos los títulos tienen ≤60 caracteres
3. Probar un post con FAQs en Rich Results Test
4. Confirmar que el schema FAQPage aparece correctamente

