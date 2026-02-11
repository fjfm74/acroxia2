

## Mejora del Panel de Documentos Legales: Estado de Procesamiento en Tiempo Real

### Problema actual

El panel de documentos legales no proporciona feedback visual sobre el estado de procesamiento de los documentos. Cuando subes un PDF:
- No sabes si se esta procesando o ha terminado
- Si la funcion tarda mucho (PDFs grandes), el timeout genera "Failed to send a request to the Edge Function" sin mas informacion
- No hay indicador de progreso ni estado visible por documento
- El boton "Reprocesar" solo aparece si hay 0 fragmentos, pero no si hubo error parcial

---

### Solucion propuesta

Implementar un sistema de estado de procesamiento con feedback visual claro en 3 partes:

#### 1. Nuevo campo `processing_status` en la tabla `legal_documents`

Anadir una columna para rastrear el estado de procesamiento de cada documento:

```
processing_status: 'pending' | 'processing' | 'completed' | 'error'
processing_error: text (mensaje de error si fallo)
processing_started_at: timestamp
processing_completed_at: timestamp
```

#### 2. Flujo de procesamiento asincrono mejorado

Cambiar el flujo actual (sincrono, espera respuesta) a un flujo con estado:

```text
Subir documento
    |
    v
Crear registro en BD con status='pending'
    |
    v
Llamar Edge Function (fire-and-forget, sin esperar)
    |
    v
Edge Function actualiza status='processing' al inicio
    |
    v
Edge Function actualiza status='completed' o 'error' al final
    |
    v
Frontend hace polling cada 3s para ver el estado actualizado
```

#### 3. Mejoras visuales en el panel

- **Badge de estado** junto a cada documento: "Procesando..." (con spinner), "Completado", "Error"
- **Barra de progreso o indicador pulsante** mientras el estado es 'processing'
- **Mensaje de error visible** si el procesamiento fallo, con boton de reintentar
- **Boton Reprocesar siempre visible** (no solo cuando chunks=0)
- **Toast mejorado** al subir: "Documento subido. El procesamiento puede tardar 1-2 minutos..."

---

### Detalle tecnico de cambios

#### Migracion SQL
```sql
ALTER TABLE legal_documents 
ADD COLUMN processing_status text DEFAULT 'completed',
ADD COLUMN processing_error text,
ADD COLUMN processing_started_at timestamptz,
ADD COLUMN processing_completed_at timestamptz;

-- Marcar documentos existentes como completados
UPDATE legal_documents SET processing_status = 'completed' WHERE processing_status IS NULL;
```

#### `supabase/functions/process-legal-document/index.ts`
- Al inicio del procesamiento: actualizar `processing_status = 'processing'`, `processing_started_at = now()`
- Al completar con exito: actualizar `processing_status = 'completed'`, `processing_completed_at = now()`
- En caso de error: actualizar `processing_status = 'error'`, `processing_error = mensaje`
- Esto permite que aunque el cliente pierda la conexion (timeout), el estado se actualiza correctamente en BD

#### `src/pages/admin/AdminDocuments.tsx`
- **Badge de estado por documento**: Mostrar "Procesando..." con icono animado, "Error" con mensaje, "Listo" con checkmark
- **Polling automatico**: Mientras haya algun documento con status 'pending' o 'processing', hacer polling cada 3 segundos (`setInterval` con `fetchDocuments`)
- **Subida mejorada**: No esperar la respuesta de la edge function; usar `.invoke()` sin await en el resultado, solo verificar que el request se envio
- **Boton Reprocesar**: Visible siempre (no solo cuando chunks=0), con confirmacion
- **Toast informativo**: "Documento subido correctamente. El procesamiento tardara entre 30 segundos y 2 minutos..."
- **Mostrar error**: Si `processing_status === 'error'`, mostrar el `processing_error` en texto rojo debajo del titulo del documento

#### Interfaz del documento mejorada (por documento):

| Estado | Visual |
|--------|--------|
| pending | Badge gris "Pendiente" |
| processing | Badge azul con spinner "Procesando..." + tiempo transcurrido |
| completed | Badge verde "Procesado" + N fragmentos |
| error | Badge rojo "Error" + mensaje + boton Reintentar |

---

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| Migracion SQL | Nuevas columnas en `legal_documents` |
| `supabase/functions/process-legal-document/index.ts` | Actualizar estado al inicio/fin/error |
| `src/pages/admin/AdminDocuments.tsx` | Badges de estado, polling, UX mejorada |

### Resultado esperado

- Al subir un documento, se vera inmediatamente con estado "Procesando..." y un spinner
- Si el procesamiento tarda, el usuario ve que sigue trabajando (polling actualiza el estado)
- Si hay error, se muestra claramente con opcion de reintentar
- Nunca mas se queda el usuario sin saber que esta pasando

