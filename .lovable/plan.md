

## Plan: Corregir Generación Manual de Posts en Admin

### Problemas identificados

| Problema | Ubicación | Impacto |
|----------|-----------|---------|
| **No se envía la audiencia** | `AdminBlogNew.tsx` línea 102-108 | El post siempre se genera para inquilinos |
| **Categorías hardcodeadas para inquilinos** | `generate-blog-post/index.ts` líneas 10-17 | Solo usa Cláusulas, Fianzas, Derechos... |
| **Prompt hardcodeado para inquilinos** | `generate-blog-post/index.ts` línea 104 | "útiles para inquilinos" |
| **No genera imagen automáticamente** | `generate-blog-post/index.ts` línea 271 | Siempre devuelve `image: ""` |
| **Categoría generada no se sincroniza con UI** | `AdminBlogNew.tsx` línea 113-123 | La categoría generada puede no existir en la audiencia seleccionada |

---

## Archivos a modificar

### 1. `src/pages/admin/AdminBlogNew.tsx`

**Cambios necesarios:**

```typescript
// Línea 102-108: Añadir audience al body de la petición
const response = await supabase.functions.invoke("generate-blog-post", {
  body: {
    mode,
    prompt: mode === "custom" ? customPrompt : undefined,
    existingPosts: existingPosts || [],
    audience: audience,  // ← AÑADIR ESTO
  },
});
```

```typescript
// Línea 113-123: Sincronizar la audiencia con la generada
const generated = response.data;

// Si el post generado tiene una categoría válida para la audiencia actual, usarla
// Si no, cambiar la audiencia para que coincida con las categorías
const tenantCategories = ["Cláusulas", "Fianzas", "Derechos", "Subidas de renta", "Legislación", "Consejos"];
const landlordCategories = ["Contratos", "Impagos", "Garantías", "Normativa", "Seguros", "Gestión"];

// Determinar la audiencia correcta basada en la categoría generada
let detectedAudience = audience;
if (tenantCategories.includes(generated.category)) {
  detectedAudience = "inquilino";
} else if (landlordCategories.includes(generated.category)) {
  detectedAudience = "propietario";
}

// Actualizar la audiencia si es diferente
if (detectedAudience !== audience) {
  setAudience(detectedAudience);
}
```

---

### 2. `supabase/functions/generate-blog-post/index.ts`

**Cambios necesarios:**

```typescript
// Línea 10-17: Definir categorías por audiencia
const TENANT_CATEGORIES = [
  "Cláusulas", "Fianzas", "Derechos", "Subidas de renta", "Legislación", "Consejos"
];

const LANDLORD_CATEGORIES = [
  "Contratos", "Impagos", "Garantías", "Normativa", "Seguros", "Gestión"
];
```

```typescript
// Línea 55: Recibir audience del body
const { mode, prompt, existingPosts = [], audience = "inquilino" } = await req.json();

// Seleccionar categorías según audiencia
const ALL_CATEGORIES = audience === "propietario" ? LANDLORD_CATEGORIES : TENANT_CATEGORIES;
```

```typescript
// Línea 86-104: Adaptar el prompt según la audiencia
const targetAudience = audience === "propietario" 
  ? "propietarios y arrendadores" 
  : "inquilinos";

const audienceContext = audience === "propietario"
  ? `Tu audiencia son PROPIETARIOS que quieren:
- Redactar contratos de alquiler seguros y válidos
- Protegerse ante impagos y morosos
- Conocer sus derechos y obligaciones según la LAU
- Gestionar correctamente fianzas y garantías adicionales`
  : `Tu audiencia son INQUILINOS que quieren:
- Entender su contrato de alquiler
- Conocer sus derechos ante cláusulas abusivas
- Saber cómo reclamar ante problemas con el casero
- Estar informados sobre límites de subida de renta`;

let systemPrompt = `Eres un experto redactor de contenido legal inmobiliario en España.

...

Tu tarea es escribir artículos de blog profesionales, informativos y útiles para ${targetAudience}.

${audienceContext}

...`;
```

```typescript
// Línea 164-189: Adaptar el userPrompt para propietarios
if (mode === "auto") {
  if (audience === "propietario") {
    userPrompt = `Escribe un artículo ORIGINAL para PROPIETARIOS sobre un tema actual del alquiler en España.
    
Temas sugeridos para propietarios:
- Cómo redactar un contrato de alquiler seguro en ${currentYear}
- Qué hacer ante un impago del inquilino
- Cláusulas imprescindibles para proteger tu vivienda
- Gestión de la fianza y garantías adicionales
- Normativa de zonas tensionadas para propietarios
- Seguros de impago: cuándo contratarlos
...`;
  } else {
    userPrompt = `Escribe un artículo ORIGINAL para INQUILINOS sobre un tema actual del alquiler en España.
...`;
  }
}
```

---

### 3. Generación automática de imagen

**Opción A: Generar imagen dentro de `generate-blog-post`**

Añadir la lógica de generación de imagen directamente en la Edge Function después de generar el contenido. Esto haría el proceso más lento pero integrado.

```typescript
// Después de parsear el blogPost
if (blogPost.title && blogPost.excerpt) {
  try {
    const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });
    
    // ... procesar y subir imagen a storage
    blogPost.image = uploadedImageUrl;
  } catch (imageError) {
    console.error("Error generating image:", imageError);
    blogPost.image = "";
  }
}
```

**Opción B: Llamar automáticamente a `regenerateImage` en el frontend**

Después de que se genere el post en `AdminBlogNew.tsx`, llamar automáticamente a `regenerateImage()`:

```typescript
// En generateWithAI, después de setPost:
setPost({ ... });

// Auto-generar imagen si el post se generó correctamente
if (generated.title && !generated.image) {
  regenerateImage();
}
```

**Recomendación**: Opción A es más robusta porque garantiza que el post siempre llegue con imagen.

---

## Flujo corregido

```text
Admin abre /admin/blog/nuevo
         │
         ├── Selecciona audiencia: "Propietario"
         │
         ▼
    Click "Generar Automático"
         │
         ▼
    Frontend envía a generate-blog-post:
    {
      mode: "auto",
      audience: "propietario",  ← NUEVO
      existingPosts: [...]
    }
         │
         ▼
    Edge Function genera:
    - Prompt adaptado a propietarios
    - Categorías de propietarios
    - Imagen con IA (automática)
         │
         ▼
    Retorna JSON con:
    - title, excerpt, content
    - category: "Contratos" (de propietarios)
    - image: "https://..." (generada)
         │
         ▼
    Frontend muestra post completo
    con imagen y categoría correctas
```

---

## Resumen de cambios

| Archivo | Cambios |
|---------|---------|
| `AdminBlogNew.tsx` | Enviar `audience` en el body de la petición |
| `generate-blog-post/index.ts` | Recibir `audience`, usar categorías correctas, adaptar prompts, generar imagen automáticamente |

---

## Resultado esperado

1. Al seleccionar "Propietario" y generar, se genera un post CON:
   - Categoría de propietarios (Contratos, Impagos, Garantías...)
   - Contenido dirigido a arrendadores
   - Imagen generada automáticamente
   
2. La categoría generada será válida para la audiencia seleccionada

3. El selector de categorías mostrará la categoría correcta

