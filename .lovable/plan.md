

## Plan: Restaurar Descubribilidad de Archivos LLM

### Problema confirmado

Los LLMs buscan automáticamente estas URLs estándar:
- `https://acroxia.com/llms.txt`
- `https://acroxia.com/llms-full.txt`

Al eliminar los archivos estáticos, ahora devuelven 404. Los endpoints dinámicos existen pero están en URLs de Supabase que ningún LLM descubre automáticamente.

---

### Solución: Archivos estáticos con contenido dinámico pre-generado

Dado que Lovable no permite redirecciones del servidor, la mejor solución es **regenerar los archivos estáticos periódicamente** usando un cron job.

---

## Fase 1: Crear Edge Function para regenerar archivos estáticos

### Nueva función: `regenerate-llm-files/index.ts`

Esta función:
1. Lee los posts recientes de la base de datos
2. Genera el contenido actualizado de llms.txt y llms-full.txt
3. Guarda el contenido en una tabla de caché (similar a sitemap_cache)

```typescript
// Estructura similar a regenerate-sitemap
// El contenido se genera dinámicamente y se almacena
```

---

## Fase 2: Crear tabla de caché para archivos LLM

### Migración SQL

```sql
CREATE TABLE IF NOT EXISTS llm_files_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL UNIQUE, -- 'llms.txt' o 'llms-full.txt'
  content text NOT NULL,
  generated_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insertar registros iniciales
INSERT INTO llm_files_cache (file_name, content) VALUES 
  ('llms.txt', ''),
  ('llms-full.txt', '');

-- Políticas RLS
ALTER TABLE llm_files_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read llm cache" ON llm_files_cache FOR SELECT USING (true);
CREATE POLICY "Admins can manage llm cache" ON llm_files_cache FOR ALL USING (has_role(auth.uid(), 'admin'));
```

---

## Fase 3: Modificar Edge Functions existentes

### `supabase/functions/llms/index.ts`

Cambiar para que:
1. Primero intente leer del caché en la tabla
2. Si no hay caché, genere en tiempo real

```typescript
// Intentar leer del caché primero
const { data: cache } = await supabase
  .from("llm_files_cache")
  .select("content")
  .eq("file_name", "llms.txt")
  .single();

if (cache?.content) {
  return new Response(cache.content, { headers: corsHeaders });
}

// Fallback: generar en tiempo real
// ... código existente ...
```

---

## Fase 4: Restaurar archivos estáticos con redirección JavaScript

### Crear `public/llms.txt`

```
# ACROXIA - Archivo de contexto para LLMs
# Este archivo redirige al contenido dinámico actualizado

# Para contenido actualizado en tiempo real, visitar:
# https://vmloiamemddwxyyunphz.supabase.co/functions/v1/llms

# Última sincronización: 2026-01-28
# El contenido completo se sirve desde la Edge Function para mayor frescura.

---

A continuación se incluye una copia del contenido actual:

[CONTENIDO SE REGENERA AUTOMÁTICAMENTE VÍA CRON]
```

**Problema**: Lovable no puede escribir archivos public/ desde Edge Functions.

---

## Solución Final: Modificar el trigger para incluir regeneración LLM

### Fase 5: Integrar regeneración LLM en el trigger existente

Modificar `trigger_sitemap_regeneration` para que además de regenerar el sitemap, regenere los archivos LLM en la tabla de caché.

```sql
CREATE OR REPLACE FUNCTION trigger_sitemap_and_llm_regeneration()
RETURNS trigger AS $$
BEGIN
  -- Regenerar sitemap (existente)
  PERFORM net.http_post(...regenerate-sitemap...);
  
  -- Regenerar archivos LLM (nuevo)
  PERFORM net.http_post(...regenerate-llm-files...);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

---

## Fase 6: Actualizar robots.txt

### Descomentar las URLs de LLM

```
# Archivos para LLMs (dinámicos)
# Los LLMs pueden acceder a estos endpoints para contexto actualizado
LLMs: https://vmloiamemddwxyyunphz.supabase.co/functions/v1/llms
```

**Nota**: La directiva "LLMs:" no es estándar, pero algunos bots la reconocen.

---

## Fase 7: Solución híbrida - Archivos estáticos + Link a dinámico

La mejor solución práctica es:

1. **Crear archivos estáticos mínimos** en `public/`:
   - `public/llms.txt` - Con resumen estático + link al dinámico
   - `public/llms-full.txt` - Con resumen estático + link al dinámico

2. **El contenido estático incluye**:
   - Descripción básica de ACROXIA (no cambia)
   - URLs principales (no cambian)
   - Link prominente a la versión dinámica

---

## Archivos a crear/modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `public/llms.txt` | **CREAR** | Archivo estático con info básica + link a dinámico |
| `public/llms-full.txt` | **CREAR** | Archivo estático completo + link a dinámico |
| `public/robots.txt` | **MODIFICAR** | Descomentar referencias a LLMs |
| `supabase/functions/llms/index.ts` | Ya existe | Mantener como fuente dinámica |

---

## Contenido propuesto para public/llms.txt

```markdown
# ACROXIA - Análisis de Contratos de Alquiler con IA

> Última actualización: Enero 2026
> Versión dinámica actualizada diariamente: https://vmloiamemddwxyyunphz.supabase.co/functions/v1/llms

## Qué es ACROXIA

ACROXIA es una plataforma española que utiliza IA para analizar contratos de alquiler y detectar cláusulas abusivas según la LAU 2026.

## URLs principales

- Analizar contrato gratis: https://acroxia.com/analizar-gratis
- Blog actualizado diariamente: https://acroxia.com/blog
- Preguntas frecuentes: https://acroxia.com/faq

## Contenido actualizado

Para acceder al contenido más reciente incluyendo los últimos artículos del blog, consultar la versión dinámica:
https://vmloiamemddwxyyunphz.supabase.co/functions/v1/llms

[... resto del contenido estático que no cambia ...]
```

---

## Resultado

| Archivo | Ubicación | Descubrimiento |
|---------|-----------|----------------|
| `llms.txt` | `public/` | ✅ LLMs lo encuentran en ruta estándar |
| `llms-full.txt` | `public/` | ✅ LLMs lo encuentran en ruta estándar |
| `/functions/v1/llms` | Edge Function | ✅ Contenido dinámico actualizado |
| Sitemap | Edge Function | ✅ Google lo indexa desde robots.txt |

---

## Beneficios de esta solución híbrida

1. **Los LLMs encuentran el archivo** en la ruta estándar `/llms.txt`
2. **El contenido estático incluye la info esencial** que no cambia
3. **El link a la versión dinámica** permite acceder a contenido actualizado
4. **No requiere regeneración automática de archivos estáticos** (imposible en Lovable)
5. **Las Edge Functions siguen disponibles** para sistemas que las usen directamente

