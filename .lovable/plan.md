
## Plan: Sistema de Alertas para Cron Jobs y Procesos Críticos

### Problema actual
Actualmente tienes 7+ cron jobs ejecutándose diariamente sin ningún sistema de notificación cuando fallan. Si algo sale mal, no te enteras hasta que verificas manualmente.

### Solución propuesta

Crear una **edge function centralizada de alertas** que envíe emails cuando cualquier proceso crítico falle, incluyendo:
- Los 2 generadores de blog diarios
- El monitor del BOE
- Los emails de nurturing
- Cualquier otro proceso crítico

---

## Arquitectura del Sistema

```text
┌─────────────────────┐
│   Cron Jobs         │
│   (pg_cron)         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐     En caso de ERROR
│   Edge Functions    │ ─────────────────────────┐
│   (procesos)        │                          │
└──────────┬──────────┘                          ▼
           │                          ┌─────────────────────┐
           ▼                          │  send-alert-email   │
┌─────────────────────┐               │  (nueva función)    │
│   Logs + Response   │               └──────────┬──────────┘
│   Status codes      │                          │
└─────────────────────┘                          ▼
                                      ┌─────────────────────┐
                                      │  Email a admin      │
                                      │  nuriafrancis@      │
                                      │  gmail.com          │
                                      └─────────────────────┘
```

---

## Fase 1: Crear edge function de alertas

### Nueva función: `supabase/functions/send-alert-email/index.ts`

Esta función centralizada recibirá alertas de cualquier proceso y enviará un email formateado con:

- Nombre del proceso que falló
- Hora del fallo
- Mensaje de error
- Detalles adicionales (contexto)
- Link al panel de administración

**Ejemplo de payload:**
```json
{
  "process": "schedule-daily-post-landlord",
  "error": "Could not parse JSON from AI response",
  "context": {
    "audience": "propietario",
    "attempted_at": "2026-01-26T09:00:00Z",
    "ai_response_length": 0
  }
}
```

---

## Fase 2: Modificar funciones existentes para enviar alertas

### 2.1 `schedule-daily-post/index.ts` (inquilinos)

Añadir función helper para enviar alertas:
```typescript
async function sendErrorAlert(error: string, context: Record<string, any>) {
  await fetch(`${supabaseUrl}/functions/v1/send-alert-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      process: 'schedule-daily-post',
      processName: 'Generación Blog Inquilinos',
      error,
      context: { ...context, audience: 'inquilino' }
    })
  });
}
```

Modificar el catch principal para:
```typescript
catch (error) {
  console.error("Error:", error);
  
  // Enviar alerta al admin
  await sendErrorAlert(
    error instanceof Error ? error.message : 'Unknown error',
    { attempted_at: new Date().toISOString() }
  );
  
  return new Response(JSON.stringify({ error: ... }), { status: 500 });
}
```

### 2.2 `schedule-daily-post-landlord/index.ts` (propietarios)

Mismo patrón con `audience: 'propietario'`.

### 2.3 `monitor-boe/index.ts`

Añadir alerta cuando falla el scraping o procesamiento del BOE.

### 2.4 `send-nurturing-emails/index.ts`

Alertar si hay errores críticos al enviar emails masivos.

---

## Fase 3: Resumen diario de ejecuciones (opcional pero recomendado)

Crear una tabla `cron_execution_logs` para registrar cada ejecución:

| id | job_name | executed_at | success | error_message | duration_ms |
|----|----------|-------------|---------|---------------|-------------|
| uuid | schedule-daily-post | 2026-01-26 08:00 | false | JSON parse error | 45000 |

Y un email de resumen diario a las 23:00 con:
- Jobs ejecutados correctamente hoy
- Jobs que fallaron hoy
- Siguiente ejecución programada

---

## Fase 4: Añadir reintentos automáticos

Implementar lógica de reintentos en las funciones de blog:

```typescript
const MAX_RETRIES = 2;
let lastError;

for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
  try {
    // Lógica de generación...
    return successResponse;
  } catch (error) {
    lastError = error;
    console.log(`Attempt ${attempt + 1} failed, retrying...`);
    await new Promise(r => setTimeout(r, 5000)); // Esperar 5 segundos
  }
}

// Si llegamos aquí, todos los reintentos fallaron
await sendErrorAlert(lastError.message, { attempts: MAX_RETRIES + 1 });
```

---

## Archivos a crear/modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `supabase/functions/send-alert-email/index.ts` | **CREAR** | Nueva función centralizada de alertas |
| `supabase/functions/schedule-daily-post/index.ts` | Modificar | Añadir envío de alertas en catch |
| `supabase/functions/schedule-daily-post-landlord/index.ts` | Modificar | Añadir envío de alertas en catch |
| `supabase/functions/monitor-boe/index.ts` | Modificar | Añadir envío de alertas |
| `supabase/functions/send-nurturing-emails/index.ts` | Modificar | Añadir envío de alertas |
| `supabase/config.toml` | Modificar | Añadir config para send-alert-email |

---

## Diseño del email de alerta

```text
┌─────────────────────────────────────────────────┐
│                   ACROXIA                        │
│           ⚠️ ALERTA DEL SISTEMA                 │
├─────────────────────────────────────────────────┤
│                                                  │
│  Ha fallado un proceso programado:              │
│                                                  │
│  ┌─────────────────────────────────────────┐    │
│  │ Proceso: Generación Blog Propietarios    │    │
│  │ Hora: 26/01/2026 09:00 CET               │    │
│  │ Error: Could not parse JSON from AI      │    │
│  └─────────────────────────────────────────┘    │
│                                                  │
│  Detalles adicionales:                          │
│  - AI response length: 0 caracteres             │
│  - Intentos realizados: 3                       │
│                                                  │
│  ┌─────────────────────────┐                    │
│  │   Ir al Panel Admin     │                    │
│  └─────────────────────────┘                    │
│                                                  │
│  ┌─────────────────────────┐                    │
│  │  Ejecutar Manualmente   │                    │
│  └─────────────────────────┘                    │
│                                                  │
├─────────────────────────────────────────────────┤
│  Este email se genera automáticamente.          │
│  No es necesaria ninguna acción si el proceso   │
│  se ha recuperado posteriormente.               │
└─────────────────────────────────────────────────┘
```

---

## Resultado esperado

Después de implementar este sistema:

1. **Recibirás un email inmediato** cuando cualquier cron job falle
2. El email incluirá **detalles del error** para diagnóstico rápido
3. Tendrás **links directos** al panel de admin y para ejecutar manualmente
4. Los procesos de blog intentarán **2 reintentos automáticos** antes de alertar
5. Opcional: Recibirás un **resumen diario** de todas las ejecuciones

---

## Prioridad de implementación

1. **Alta**: Crear `send-alert-email` y conectar a los 2 generadores de blog
2. **Media**: Añadir alertas a `monitor-boe` y `send-nurturing-emails`
3. **Baja**: Implementar reintentos automáticos
4. **Opcional**: Tabla de logs y resumen diario
