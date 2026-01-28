

## Plan: Reintentos Automáticos para Generación de Blog

### Problema identificado

Cuando la IA devuelve un JSON malformado (caracteres de control, saltos de línea incorrectos), la función falla inmediatamente y envía la alerta. Pero un segundo intento con la misma llamada suele funcionar porque la IA genera una respuesta diferente.

**Error de hoy:**
```
Error: Could not parse JSON from AI response
```

---

### Solución: Sistema de reintentos inteligente

Implementar un bucle de reintentos que:
1. Intente generar el post hasta **3 veces** (1 original + 2 reintentos)
2. Espere **5 segundos** entre intentos
3. Mejore el parsing de JSON con sanitización más robusta
4. **Solo envíe la alerta si todos los intentos fallan**

---

### Cambios técnicos

#### Archivo 1: `supabase/functions/schedule-daily-post-landlord/index.ts`

Refactorizar la lógica principal para incluir reintentos:

```typescript
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 5000;

// Función auxiliar para esperar
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Función auxiliar para sanitizar JSON de forma más robusta
function sanitizeJsonString(rawContent: string): string {
  // Extraer el bloque JSON
  const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return '';
  
  let json = jsonMatch[0];
  
  // Eliminar caracteres de control problemáticos
  json = json.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Intentar arreglar newlines dentro de strings
  json = json.replace(/(?<!\\)\n(?=[^"]*"(?:[^"]*"[^"]*")*[^"]*$)/g, '\\n');
  
  return json;
}

// En el handler principal:
let lastError: Error | null = null;

for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
  try {
    if (attempt > 0) {
      console.log(`Retry attempt ${attempt} of ${MAX_RETRIES}...`);
      await sleep(RETRY_DELAY_MS);
    }
    
    // Llamar a la IA
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {...});
    
    const aiResponse = await response.json();
    const content = aiResponse.choices[0]?.message?.content;
    
    // Sanitizar y parsear
    const sanitizedJson = sanitizeJsonString(content);
    const postData = JSON.parse(sanitizedJson);
    
    // Si llegamos aquí, el parsing fue exitoso
    // Continuar con la creación del post...
    
    return successResponse; // Salir del bucle
    
  } catch (error) {
    lastError = error instanceof Error ? error : new Error(String(error));
    console.error(`Attempt ${attempt + 1} failed:`, lastError.message);
    
    // Si es el último intento, salir del bucle
    if (attempt === MAX_RETRIES) break;
  }
}

// Todos los intentos fallaron - enviar alerta
await sendErrorAlert(
  lastError?.message || 'Unknown error',
  { 
    attempts: MAX_RETRIES + 1,
    attempted_at: new Date().toISOString() 
  }
);
```

#### Archivo 2: `supabase/functions/schedule-daily-post/index.ts`

Aplicar la misma lógica de reintentos a la función de inquilinos.

---

### Mejoras adicionales de parsing

El parsing actual tiene fallos con JSONs complejos. Añadir un fallback con extracción por regex más robusta:

```typescript
function parseAiResponse(content: string, fallbackCategory: string): PostData {
  // Intento 1: JSON.parse directo tras sanitización
  try {
    const sanitized = sanitizeJsonString(content);
    return JSON.parse(sanitized);
  } catch (e) {
    console.log('Direct parse failed, trying regex extraction...');
  }
  
  // Intento 2: Extracción por regex campo a campo
  const titleMatch = content.match(/"title"\s*:\s*"([^"]+)"/);
  const excerptMatch = content.match(/"excerpt"\s*:\s*"([^"]+)"/);
  const categoryMatch = content.match(/"category"\s*:\s*"([^"]+)"/);
  
  // Para content, usar regex más flexible
  const contentMatch = content.match(/"content"\s*:\s*"([\s\S]*?)(?:"\s*[,}])/);
  
  if (!titleMatch) {
    throw new Error('Could not extract title from AI response');
  }
  
  return {
    title: titleMatch[1],
    excerpt: excerptMatch?.[1] || titleMatch[1],
    category: categoryMatch?.[1] || fallbackCategory,
    content: contentMatch?.[1]?.replace(/\\n/g, '\n').replace(/\\"/g, '"') || '',
  };
}
```

---

### Archivos a modificar

| Archivo | Cambios |
|---------|---------|
| `supabase/functions/schedule-daily-post-landlord/index.ts` | Añadir reintentos, mejorar parsing |
| `supabase/functions/schedule-daily-post/index.ts` | Añadir reintentos, mejorar parsing |

---

### Flujo final con reintentos

```text
Cron job ejecuta a las 09:00/10:00
        │
        ▼
┌───────────────────────────┐
│  Intento 1: Llamar IA     │
└───────────┬───────────────┘
            │
      ¿Éxito? ──────────────► SÍ ──► Crear post + Email aprobación
            │
           NO
            │
            ▼
      Esperar 5 segundos
            │
            ▼
┌───────────────────────────┐
│  Intento 2: Llamar IA     │
└───────────┬───────────────┘
            │
      ¿Éxito? ──────────────► SÍ ──► Crear post + Email aprobación
            │
           NO
            │
            ▼
      Esperar 5 segundos
            │
            ▼
┌───────────────────────────┐
│  Intento 3: Llamar IA     │
└───────────┬───────────────┘
            │
      ¿Éxito? ──────────────► SÍ ──► Crear post + Email aprobación
            │
           NO
            │
            ▼
┌───────────────────────────┐
│  ENVIAR ALERTA EMAIL      │
│  (todos los intentos      │
│   fallaron)               │
└───────────────────────────┘
```

---

### Resultado esperado

1. **Menos alertas falsas**: La mayoría de errores de parsing se resolverán en el 2º o 3º intento
2. **Email de alerta incluirá el número de intentos realizados**: Para que sepas que ya se intentó varias veces
3. **Parsing más robusto**: El fallback por regex capturará casos donde el JSON tiene errores menores
4. **Logging mejorado**: Verás en los logs cada intento y su resultado

---

### Notas técnicas

- El delay de 5 segundos es suficiente para que la IA genere una respuesta diferente
- El timeout total del edge function (60s por defecto) permite hasta 3 intentos cómodamente
- Si el error no es de parsing (ej: error de red, API caída), también reintentará

