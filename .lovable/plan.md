

## Optimizacion Integral del Sistema RAG Legal

### Problemas Identificados

**1. PDFs extensos fallan**: El sistema actual envia el PDF completo como base64 en una sola llamada a la IA. Para leyes extensas (LAU tiene ~100 paginas), esto causa timeouts o excede los limites de tokens.

**2. Solo soporta "reemplazar"**: La unica relacion entre documentos es `supersedes` (deroga/reemplaza). No hay soporte para: complementa, amplia, prorroga, modifica parcialmente, desarrolla reglamentariamente.

**3. Reprocesado costoso y en cascada**: Cuando un documento nuevo afecta a otros, hay que reprocesar todos. Sin un sistema inteligente, esto crece exponencialmente con el tamano del RAG.

**4. Solo acepta PDF**: No hay soporte para cargar contenido desde URL web ni EPUB, que son formatos mas limpios para texto legal.

**5. Modelo de IA**: Se usa `google/gemini-2.5-flash` (rapido pero menos preciso). Para procesamiento legal complejo, modelos mas avanzados como `google/gemini-2.5-pro` o `openai/gpt-5` ofrecen mejor comprension juridica.

---

### Solucion Propuesta

#### Parte 1: Soporte Multi-formato (URL + EPUB + PDF mejorado)

**Cambio en el formulario de subida (`AdminDocuments.tsx`)**:
- Anadir selector de tipo de fuente: "Archivo PDF", "Archivo EPUB", "URL web"
- Si es URL: campo de texto para pegar el enlace. El edge function descargara y extraera el texto.
- Si es EPUB: aceptar archivo `.epub` ademas de `.pdf`
- El formulario enviara un campo `source_type` al edge function

**Cambio en el Edge Function (`process-legal-document`)**:
- Nuevo parametro `source_type`: "pdf" | "epub" | "url"
- Para URL: usar `fetch()` para descargar el HTML y extraer el texto con regex/parsing
- Para EPUB: descomprimir (es un ZIP con HTML dentro) y extraer texto
- Para PDF: mantener el flujo actual pero con procesamiento por partes (ver Parte 2)

#### Parte 2: Procesamiento por Partes para Documentos Extensos

**Problema**: Un PDF de 100 paginas no cabe en una sola llamada a la IA.

**Solucion**: Procesamiento en dos fases:

```text
Fase 1 - Extraccion de texto
    PDF -> extractPdfText() (ya existe, mejorar)
    URL -> fetch + parse HTML
    EPUB -> unzip + parse HTML

Fase 2 - Chunking inteligente por la IA
    Dividir el texto en bloques de ~15.000 caracteres
    Enviar cada bloque a la IA por separado
    Fusionar los resultados (chunks + metadata)
    Una llamada final para el analisis global del documento
```

**Cambio en el Edge Function**:
- Extraer texto primero (sin IA) usando las funciones existentes mejoradas
- Dividir el texto en segmentos de ~15.000 caracteres respetando limites de articulos/secciones
- Enviar cada segmento a la IA para extraer chunks
- Llamada final con resumen de todos los chunks para generar `document_analysis` (supersedes, keywords, etc.)
- Actualizar `processing_status` con progreso: "processing (3/7 bloques)"

**Modelo de IA**: Cambiar de `google/gemini-2.5-flash` a `google/gemini-2.5-pro` para el procesamiento legal. Es mas lento pero significativamente mejor en comprension juridica, interpretacion de relaciones entre normas y extraccion precisa de entidades. El modelo flash se mantiene como fallback si pro falla.

#### Parte 3: Sistema de Relaciones entre Documentos

**Migracion SQL - Nueva tabla `document_relations`**:

```sql
CREATE TABLE document_relations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  source_document_id uuid REFERENCES legal_documents(id) ON DELETE CASCADE,
  target_document_id uuid REFERENCES legal_documents(id) ON DELETE CASCADE,
  relation_type text NOT NULL,
  -- 'deroga', 'modifica', 'complementa', 'amplia', 
  -- 'prorroga', 'desarrolla', 'interpreta'
  affected_articles text[],  -- articulos especificos afectados
  description text,          -- descripcion de la relacion
  detected_by text DEFAULT 'ai',  -- 'ai' o 'manual'
  created_at timestamptz DEFAULT now(),
  UNIQUE(source_document_id, target_document_id, relation_type)
);
```

**Tipos de relacion soportados**:

| Tipo | Significado | Efecto en RAG |
|------|------------|---------------|
| deroga | Reemplaza completamente | Marcar chunks como `is_superseded` |
| modifica | Cambia articulos especificos | Marcar solo chunks afectados como `is_superseded` |
| complementa | Anade informacion nueva | Vincular chunks con referencia cruzada |
| amplia | Extiende el alcance | Vincular chunks, anadir scope ampliado |
| prorroga | Extiende vigencia temporal | Actualizar `expiration_date` del documento original |
| desarrolla | Reglamento que desarrolla una ley | Vincular como detalle de implementacion |
| interpreta | Jurisprudencia que interpreta | Vincular como interpretacion autoritativa |

**Cambio en el prompt de la IA (process-legal-document)**:
- Ampliar la seccion de "DOCUMENTOS DEROGADOS/MODIFICADOS" para detectar todos los tipos de relacion
- El prompt pedira un array de relaciones con tipo, no solo `supersedes`
- Formato de respuesta ampliado:

```json
{
  "document_analysis": {
    "ai_summary": "...",
    "keywords": [],
    "relations": [
      {
        "type": "modifica",
        "target_title": "Ley 29/1994",
        "affected_articles": ["Art. 36", "Art. 20"],
        "description": "Modifica los limites de garantias adicionales"
      },
      {
        "type": "complementa",
        "target_title": "Real Decreto 7/2019",
        "description": "Desarrolla las zonas de mercado tensionado"
      }
    ],
    "expiration_date": null
  }
}
```

**Logica de procesamiento de relaciones**:
- `deroga`: Marcar documento/chunks como superseded (logica actual)
- `modifica`: Marcar solo los chunks con `article_reference` coincidente como superseded
- `complementa/amplia/desarrolla/interpreta`: Crear la relacion en `document_relations` sin marcar nada como obsoleto. Esto permite que el RAG devuelva ambos documentos cuando se busca un tema.
- `prorroga`: Actualizar `expiration_date` del documento target

#### Parte 4: Reprocesado Inteligente (No Reprocesar Todo)

**Problema**: Si subo un documento que "complementa" la LAU, no necesito reprocesar la LAU entera.

**Solucion**: Solo reprocesar cuando la relacion es `deroga` o `modifica`. Para el resto, basta con crear la relacion y los nuevos chunks.

**Logica**:
1. Al procesar un documento nuevo, la IA detecta relaciones
2. Para cada relacion detectada:
   - `deroga/modifica` -> marcar chunks afectados como superseded (sin reprocesar el documento)
   - `complementa/amplia/prorroga/desarrolla/interpreta` -> solo crear la relacion en `document_relations`
3. El motor de busqueda RAG (`search_legal_chunks`) ya filtra chunks superseded, asi que los cambios son automaticos

**Cambio en las funciones de busqueda RAG**: Modificar `search_legal_chunks_semantic` para que tambien devuelva chunks de documentos relacionados (complementarios, que desarrollan, etc.) cuando son relevantes.

#### Parte 5: Mejoras Visuales en AdminDocuments

- Mostrar relaciones entre documentos en la interfaz (icono de enlace)
- Al ver un documento, mostrar "Relacionado con: LAU (complementa), RD 7/2019 (modifica)"
- Progreso de procesamiento mas detallado: "Procesando bloque 3 de 7..."
- Indicador de formato de origen (PDF/URL/EPUB)

---

### Detalle tecnico de archivos a modificar

| Archivo | Cambios |
|---------|---------|
| Migracion SQL | Crear tabla `document_relations` con RLS |
| `supabase/functions/process-legal-document/index.ts` | Multi-formato, chunking por bloques, relaciones ampliadas, modelo gemini-2.5-pro |
| `src/pages/admin/AdminDocuments.tsx` | Selector de formato (PDF/EPUB/URL), visualizacion de relaciones, progreso detallado |

### Orden de implementacion

1. Migracion SQL (tabla `document_relations`)
2. Edge Function: soporte URL + EPUB + procesamiento por bloques + relaciones
3. Frontend: formulario multi-formato + visualizacion de relaciones

