

## Plan: Generar FAQs para Posts y Regenerar Sitemap

### Problema Actual
La Edge Function `batch-update-blog-posts` requiere autenticación de admin, lo cual es correcto para seguridad pero impide la ejecución automatizada. Necesitamos una opción adicional para ejecutarla de forma segura sin login.

---

## Cambios Propuestos

### 1. Modificar Edge Function para Permitir Clave Interna

Añadir una opción de autenticación alternativa usando un header secreto para tareas de mantenimiento:

```typescript
// Verificar si viene con service key interno (para tareas automatizadas)
const internalKey = req.headers.get("X-Internal-Key");
const expectedInternalKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (internalKey && internalKey === expectedInternalKey) {
  // Autenticación interna válida, continuar sin verificar admin
  console.log("Internal authentication accepted");
} else {
  // Verificación de admin normal para usuarios
  const authHeader = req.headers.get("Authorization");
  // ... resto de la lógica actual
}
```

---

### 2. Secuencia de Ejecución

Una vez modificada la función:

```
Fase 1: 10 posts → ~3 min
Fase 2: 10 posts → ~3 min  
Fase 3: 10 posts → ~3 min
Fase 4: 10 posts → ~3 min
Fase 5: 10 posts → ~3 min
Fase 6: 2 posts → ~1 min
─────────────────────────
Total: 52 posts → ~16 min
```

---

### 3. Regenerar Sitemap

Después de generar FAQs, llamar a la función `regenerate-sitemap` para actualizar el cache del sitemap que lee Google Search Console:

```bash
POST /functions/v1/regenerate-sitemap
```

Esto actualizará:
- Todas las URLs de posts con sus fechas `lastmod`
- El sitemap en cache de la tabla `sitemap_cache`

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/batch-update-blog-posts/index.ts` | Añadir autenticación alternativa con X-Internal-Key |

---

## Post-Implementación

1. Ejecutar la función en 6 fases para procesar los 52 posts
2. Llamar a `regenerate-sitemap` para actualizar el cache
3. Verificar en DB que todos los posts tienen FAQs
4. Confirmar que el sitemap incluye todas las URLs con `lastmod` actualizado

