
## Plan: Regeneración Automática de LLM Files y Selector de Audiencia en Blog Admin

### Problema identificado

1. **Regeneración LLM incompleta**: El trigger actual solo regenera el sitemap cuando se publica un post, pero NO notifica a las Edge Functions de LLM para que actualicen su caché.

2. **Creación manual de posts**: El formulario `/admin/blog/nuevo` no permite seleccionar la audiencia (inquilino/propietario), lo que significa que todos los posts manuales se crean como "inquilino" por defecto.

---

### Solución propuesta

#### Parte 1: Selector de Audiencia en Admin Blog New

Modificar `src/pages/admin/AdminBlogNew.tsx` para añadir:

1. **Campo de selección de audiencia** con dos opciones:
   - Inquilino (predeterminado)
   - Propietario

2. **Categorías dinámicas** según la audiencia seleccionada:
   - **Inquilino**: Cláusulas, Fianzas, Derechos, Subidas de renta, Legislación, Consejos
   - **Propietario**: Contratos, Impagos, Garantías, Normativa, Seguros, Gestión

3. **Campo audience en el INSERT** cuando se guarda el post

---

#### Parte 2: Crear Tabla de Caché para Archivos LLM

Crear una tabla `llm_files_cache` similar a `sitemap_cache`:

```sql
CREATE TABLE public.llm_files_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL UNIQUE,  -- 'llms.txt' o 'llms-full.txt'
  content TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Registros iniciales
INSERT INTO llm_files_cache (file_name, content) VALUES 
  ('llms.txt', ''),
  ('llms-full.txt', '');

-- RLS
ALTER TABLE llm_files_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read llm cache" ON llm_files_cache FOR SELECT USING (true);
CREATE POLICY "Admins can manage llm cache" ON llm_files_cache FOR ALL USING (has_role(auth.uid(), 'admin'));
```

---

#### Parte 3: Crear Edge Function para Regenerar LLM Files

Nueva función: `supabase/functions/regenerate-llm-files/index.ts`

Esta función:
1. Lee los posts publicados recientes de `blog_posts`
2. Genera el contenido actualizado de llms.txt y llms-full.txt
3. Guarda el contenido en la tabla `llm_files_cache`
4. Retorna confirmación de éxito

---

#### Parte 4: Modificar Edge Functions LLM para Usar Caché

Actualizar `supabase/functions/llms/index.ts` y `llms-full/index.ts`:

1. Intentar leer del caché primero
2. Si hay caché válido, servirlo inmediatamente
3. Si no hay caché, generar en tiempo real (fallback)

```typescript
// Intentar leer del caché
const { data: cache } = await supabase
  .from("llm_files_cache")
  .select("content, generated_at")
  .eq("file_name", "llms.txt")
  .single();

if (cache?.content) {
  return new Response(cache.content, { headers: corsHeaders });
}

// Fallback: generar en tiempo real
// ... código existente ...
```

---

#### Parte 5: Extender el Trigger para Regenerar LLM Files

Modificar la función SQL `trigger_sitemap_regeneration` para que TAMBIÉN llame a la nueva Edge Function:

```sql
CREATE OR REPLACE FUNCTION public.trigger_sitemap_regeneration()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'published') OR
     (TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.slug IS DISTINCT FROM NEW.slug)) OR
     (TG_OP = 'DELETE' AND OLD.status = 'published') THEN
    
    -- Regenerar sitemap (existente)
    PERFORM net.http_post(
      url := 'https://vmloiamemddwxyyunphz.supabase.co/functions/v1/regenerate-sitemap',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{}'::jsonb
    );
    
    -- NUEVO: Regenerar archivos LLM
    PERFORM net.http_post(
      url := 'https://vmloiamemddwxyyunphz.supabase.co/functions/v1/regenerate-llm-files',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{}'::jsonb
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

### Archivos a crear/modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/pages/admin/AdminBlogNew.tsx` | **Modificar** | Añadir selector de audiencia + categorías dinámicas |
| `supabase/functions/regenerate-llm-files/index.ts` | **Crear** | Nueva función para regenerar caché LLM |
| `supabase/functions/llms/index.ts` | **Modificar** | Leer del caché primero |
| `supabase/functions/llms-full/index.ts` | **Modificar** | Leer del caché primero |
| `supabase/config.toml` | **Modificar** | Añadir nueva función |
| Migración SQL | **Crear** | Tabla `llm_files_cache` + actualizar trigger |

---

### Flujo completo tras implementación

```text
Admin crea post manual
     │
     ├── Selecciona audiencia (Inquilino/Propietario)
     ├── Categorías se ajustan dinámicamente
     └── Guarda post
            │
            ▼
Post publicado en blog_posts
            │
            ▼
    Trigger se activa
            │
            ├──► Regenerar Sitemap ──► sitemap_cache actualizado
            │
            └──► Regenerar LLM Files ──► llm_files_cache actualizado
                        │
                        ▼
              ┌─────────────────────┐
              │ Edge Functions LLM  │
              │ sirven desde caché  │
              │ instantáneamente    │
              └─────────────────────┘
```

---

### UI del Selector de Audiencia

El formulario incluirá un selector visual con íconos:

- **Inquilino** (icono Users): Para artículos dirigidos a arrendatarios
- **Propietario** (icono Home): Para artículos dirigidos a arrendadores

Al cambiar la audiencia, las categorías disponibles se actualizarán automáticamente:

| Audiencia | Categorías disponibles |
|-----------|----------------------|
| Inquilino | Cláusulas, Fianzas, Derechos, Subidas de renta, Legislación, Consejos |
| Propietario | Contratos, Impagos, Garantías, Normativa, Seguros, Gestión |

---

### Resultado esperado

1. **Los posts manuales pueden ser de inquilino o propietario**: Con categorías específicas para cada audiencia
2. **Al publicar cualquier post, se regeneran sitemap Y archivos LLM**: Automáticamente
3. **Los archivos LLM se sirven desde caché**: Mejora el rendimiento
4. **Consistencia total**: El sitemap, llms.txt y llms-full.txt siempre reflejan el contenido más reciente
