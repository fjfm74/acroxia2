

## Plan: Automatización Completa de Archivos SEO

### Problema actual

Tienes 3 niveles de archivos SEO y solo 1 está automatizado:

| Archivo | Estado actual | Problema |
|---------|--------------|----------|
| Sitemap dinámico | ✅ Automatizado | Funciona bien vía trigger |
| `public/sitemap.xml` | ❌ Estático | Se quedó en enero, no refleja posts nuevos |
| `llms.txt` / `llms-full.txt` | ❌ Estáticos | Nunca mencionan los posts del blog |

### Solución propuesta

Crear un sistema que regenere TODOS los archivos SEO automáticamente cuando:
1. Se publique un nuevo post del blog
2. Se apruebe un post generado por IA
3. Se modifique el estado de un post existente

---

## Fase 1: Eliminar archivo sitemap estático

El archivo `public/sitemap.xml` es **redundante** porque:
- `robots.txt` ya apunta al sitemap dinámico
- Google usa el sitemap dinámico

**Acción**: Eliminar `public/sitemap.xml` para evitar confusión y posibles conflictos de caché.

---

## Fase 2: Crear Edge Function para regenerar archivos LLM

### Nueva función: `regenerate-llm-files/index.ts`

Esta función se encargará de generar versiones actualizadas de `llms.txt` y `llms-full.txt` que incluyan:

1. **Lista de posts recientes del blog** (últimos 10-20)
2. **Fecha de última actualización real**
3. **URLs de posts destacados**

**Estructura propuesta para llms.txt:**

```markdown
# ACROXIA - Análisis de Contratos de Alquiler con IA

> Última actualización automática: 2026-01-28

## Artículos recientes del blog

### Para inquilinos
- Cláusulas de prórroga voluntaria: acroxia.com/blog/tu-contrato-de-alquiler-...
- Depósito de garantía adicional: acroxia.com/blog/deposito-de-garantia-...

### Para propietarios
- IPC o IRAV en 2026: acroxia.com/blog/ipc-o-irav-la-verdad-...
- Guía de alquiler 2026: acroxia.com/blog/alquiler-en-2026-...

[... resto del contenido estático ...]
```

**Problema técnico**: Los archivos `public/` son estáticos y no se pueden modificar desde Edge Functions. 

**Solución**: Servir los archivos LLM de forma dinámica mediante Edge Functions, similar al sitemap.

---

## Fase 3: Edge Functions dinámicas para LLM files

### Opción A: Edge Functions que sirven el contenido (Recomendado)

Crear 2 nuevas Edge Functions:
- `supabase/functions/llms/index.ts` - Sirve `llms.txt` dinámico
- `supabase/functions/llms-full/index.ts` - Sirve `llms-full.txt` dinámico

El contenido se genera dinámicamente incluyendo los posts más recientes de la base de datos.

**Configuración en robots.txt:**
```
# Archivos para LLMs
Sitemap: https://vmloiamemddwxyyunphz.supabase.co/functions/v1/sitemap
LLMs: https://vmloiamemddwxyyunphz.supabase.co/functions/v1/llms
```

**Ventajas:**
- Siempre actualizado en tiempo real
- No depende de archivos estáticos
- Se puede cachear en Edge para rendimiento

### Opción B: Caché en base de datos (Similar al sitemap)

Crear tablas `llms_cache` similar a `sitemap_cache`:
- El contenido se regenera cuando cambian los posts
- Se sirve desde caché para velocidad

---

## Fase 4: Integrar con el trigger existente

Modificar la función `trigger_sitemap_regeneration` para que también llame a las nuevas Edge Functions:

```sql
-- Además de regenerar sitemap, regenerar archivos LLM
PERFORM net.http_post(
  url := '.../functions/v1/regenerate-llms',
  headers := '{"Content-Type": "application/json"}'::jsonb,
  body := '{}'::jsonb
);
```

O crear un trigger adicional que solo se ejecute para posts publicados.

---

## Archivos a crear/modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `public/sitemap.xml` | **ELIMINAR** | Redundante con el dinámico |
| `supabase/functions/llms/index.ts` | **CREAR** | Sirve llms.txt dinámico |
| `supabase/functions/llms-full/index.ts` | **CREAR** | Sirve llms-full.txt completo dinámico |
| `supabase/config.toml` | Modificar | Añadir config para nuevas functions |
| `public/robots.txt` | Modificar | Añadir referencia a archivos LLM dinámicos |
| Trigger SQL | Modificar | Incluir llamada a regenerar LLMs |

---

## Flujo final automatizado

```text
Post aprobado / publicado / modificado
              │
              ▼
    Trigger en blog_posts
              │
              ├──► Regenerar Sitemap (ya funciona)
              │
              └──► Regenerar archivos LLM (nuevo)
                        │
                        ▼
              ┌─────────────────┐
              │ Edge Functions  │
              │ sirven archivos │
              │ actualizados    │
              └─────────────────┘
```

---

## Contenido dinámico de llms.txt

La nueva versión incluirá automáticamente:

1. **Fecha de última actualización** (real, no hardcodeada)
2. **Sección de posts recientes** con los últimos 10 artículos del blog
3. **Categorización por audiencia** (inquilinos vs propietarios)
4. **Todo el contenido estático actual** (servicios, precios, URLs, etc.)

---

## Beneficios

1. **SEO mejorado**: Los LLMs verán contenido fresco con fechas actualizadas
2. **Sin mantenimiento manual**: Todo se actualiza automáticamente
3. **Consistencia**: Sitemap y archivos LLM siempre sincronizados
4. **Mejor indexación**: Posts nuevos aparecen inmediatamente en contexto para IAs

---

## Resultado esperado

Cada vez que se publique un post:
1. El sitemap dinámico se regenera (ya funciona)
2. Los archivos `llms.txt` y `llms-full.txt` se actualizan con el nuevo post
3. La fecha de "última actualización" refleja la fecha real
4. Los LLMs que consulten estos archivos verán el contenido más reciente

