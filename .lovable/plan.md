
# Plan: Deteccion de Duplicados + Optimizacion RAG

## 1. Deteccion de documentos duplicados

### Problema actual
El sistema permite subir documentos con el mismo titulo o la misma URL sin ninguna verificacion. Esto podria generar chunks duplicados en la base de conocimiento, degradando la calidad del RAG.

### Solucion
Agregar validacion de duplicados en dos puntos:

**A. Frontend (AdminDocuments.tsx)** - Antes de insertar en `legal_documents`:
- Consultar si ya existe un documento con el mismo titulo (coincidencia exacta o muy similar)
- Si `source_type === "url"`, verificar si ya existe un documento con la misma `source_url`
- Si se detecta duplicado, mostrar un dialogo de confirmacion preguntando al usuario si quiere continuar o cancelar

**B. Edge Function (process-legal-document)** - Como segunda linea de defensa:
- Al inicio del procesamiento, verificar si ya existen chunks con contenido muy similar para ese documento
- Si el documento ya tiene chunks y NO es un resume, advertir en logs

### Cambios tecnicos

**`src/pages/admin/AdminDocuments.tsx`**:
- En `uploadDocument()`, antes del `insert`, ejecutar dos queries:
  1. `SELECT id, title FROM legal_documents WHERE LOWER(title) = LOWER(newDoc.title)`
  2. Si es URL: `SELECT id, title FROM legal_documents WHERE source_url = newDoc.source_url`
- Si hay resultado, mostrar toast de advertencia con opcion de cancelar

---

## 2. Optimizacion del RAG

### Problemas detectados

1. **Fase de analisis global eliminada**: El procesamiento actual extrae chunks pero ya no ejecuta la fase de analisis global (`buildAnalysisPrompt`). Esto significa que `ai_summary`, `keywords` y las relaciones entre documentos no se detectan durante el procesamiento individual. Solo se detectan via "Reconciliar relaciones".

2. **Busqueda RAG usa solo full-text search (tsvector)**: No hay busqueda semantica/vectorial. Para consultas complejas, el ranking por `ts_rank` puede no capturar bien la relevancia.

3. **No hay cache de busquedas frecuentes**: Cada analisis ejecuta las mismas queries RAG desde cero.

### Optimizaciones propuestas

**A. Restaurar fase de analisis global al finalizar el procesamiento**
- Cuando todos los bloques se procesan exitosamente (no `stoppedEarly`), ejecutar `buildAnalysisPrompt` con un resumen de los chunks extraidos
- Guardar `ai_summary` y `keywords` en `legal_documents`
- Detectar relaciones automaticamente y aplicar los efectos (deroga/modifica)
- Esto hace que el boton "Reconciliar relaciones" sea complementario, no el unico metodo

**B. Mejorar la funcion de busqueda SQL para mayor precision**
- Agregar busqueda por `semantic_category` cuando el tipo de clausula es conocido (ej: si se analiza una clausula de fianza, buscar chunks con `semantic_category = 'garantia'`)
- Pasar categorias semanticas relevantes desde `analyze-contract` a `search_legal_chunks_semantic`

**C. Optimizar el contexto enviado a la IA en el analisis**
- Limitar el texto de cada chunk a 1500 caracteres en el contexto RAG (actualmente puede ser hasta 2000)
- Priorizar chunks no superseded (ya se hace) y con match territorial

### Cambios tecnicos

**`supabase/functions/process-legal-document/index.ts`**:
- Restaurar bloque de analisis global despues del loop de bloques (lineas 747+)
- Usar modelo flash para el analisis global (rapido y barato)
- Llamar a `processRelations()` con las relaciones detectadas
- Guardar `ai_summary` y `keywords` en la tabla `legal_documents`

**`supabase/functions/analyze-contract/index.ts`**:
- En la busqueda RAG, pasar categorias semanticas relevantes basadas en los terminos clave del contrato
- Mapear terminos como "fianza" a categorias `["garantia", "obligacion"]`, "duracion" a `["plazo", "derecho"]`, etc.

---

## Resumen de archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/admin/AdminDocuments.tsx` | Validacion de duplicados antes de subir |
| `supabase/functions/process-legal-document/index.ts` | Restaurar analisis global + relaciones al completar |
| `supabase/functions/analyze-contract/index.ts` | Busqueda RAG con categorias semanticas |

## Orden de implementacion

1. Deteccion de duplicados en el frontend (rapido, sin riesgo)
2. Restaurar analisis global en process-legal-document
3. Optimizar busqueda RAG en analyze-contract con categorias semanticas
