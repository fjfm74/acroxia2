# ACROXIA – Paquete de Auditoría Técnica: Pipeline Legal RAG

**Fecha**: 25 febrero 2026  
**Versión**: v3.1  
**Alcance**: Flujo completo de ingesta, procesamiento y reconciliación de documentos legales.

---

## ÍNDICE

1. [Arquitectura general](#1-arquitectura-general)
2. [Código fuente: Frontend (AdminDocuments.tsx)](#2-frontend-admindocumentstsx)
3. [Código fuente: ChunkViewer.tsx](#3-chunkviewertsx)
4. [Código fuente: Edge Function process-legal-document](#4-edge-function-process-legal-document)
5. [Código fuente: Edge Function reconcile-relations](#5-edge-function-reconcile-relations)
6. [Esquema de base de datos (SQL)](#6-esquema-de-base-de-datos)
7. [Caso real de error territorial](#7-caso-real-error-territorial)

---

## 1. Arquitectura general

```
┌──────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                       │
│  src/pages/admin/AdminDocuments.tsx                       │
│  ┌─────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ Upload Form │──│ Supabase   │──│ Fire-and-forget   │  │
│  │ (PDF/EPUB/  │  │ Storage +  │  │ invoke(process-   │  │
│  │  URL)       │  │ DB insert  │  │ legal-document)   │  │
│  └─────────────┘  └────────────┘  └──────────────────┘  │
│         │                                                 │
│  ┌──────┴──────────────────────────────────────────────┐ │
│  │ Polling cada 3s: fetchDocuments() si hay status     │ │
│  │ "pending" o "processing*"                           │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  src/components/admin/ChunkViewer.tsx (Sheet lateral)     │
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│              EDGE FUNCTION: process-legal-document        │
│                                                           │
│  FASE 1: Extracción de texto                             │
│  ├─ URL → extractTextFromUrl() [BOE id="textoxslt"]      │
│  ├─ EPUB → extractTextFromEpub() [ZIP parsing manual]    │
│  └─ PDF → Gemini Pro Vision (base64)                     │
│                                                           │
│  FASE 2: Fragmentación (chunking)                        │
│  ├─ splitTextIntoBlocks(80k chars)                       │
│  ├─ AI: buildChunkExtractionPrompt() → Gemini Flash      │
│  ├─ validateAndNormalizeChunk() por cada chunk            │
│  ├─ INSERT incremental a legal_chunks                    │
│  └─ Timeout protection: 120s → save progress + error msg │
│                                                           │
│  FASE 3: Análisis global                                 │
│  ├─ buildAnalysisPrompt() → ai_summary, keywords, rels  │
│  └─ processRelations() → deroga/modifica/complementa...  │
│                                                           │
│  Estado final: processing_status = "completed"           │
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│           EDGE FUNCTION: reconcile-relations              │
│                                                           │
│  Paso global post-ingesta (manual desde UI)              │
│  1. Carga TODOS los docs activos + completados           │
│  2. Construye catálogo con metadata territorial           │
│  3. AI: detecta relaciones entre todos (1 call)          │
│  4. Validación territorial programática                   │
│  5. Validación temporal programática                      │
│  6. INSERT relaciones nuevas + efectos (supersede)        │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Frontend (AdminDocuments.tsx)

**Ruta**: `src/pages/admin/AdminDocuments.tsx`  
**Líneas**: 936  
**Dependencias directas**: `ChunkViewer.tsx`, Supabase client, date-fns, lucide-react, shadcn/ui

### Funciones clave

| Función | Líneas | Propósito |
|---------|--------|-----------|
| `sanitizeFileName()` | 133-140 | Normaliza nombres de archivo (NFD, underscores, lowercase) |
| `checkDuplicates()` | 261-289 | Verifica duplicados por título (ilike) y por URL exacta |
| `uploadDocument()` | 291-378 | Sube archivo a storage, crea registro en DB, invoca edge function |
| `deleteDocument()` | 397-417 | Limpia FK refs, relations, chunks, storage file, luego elimina doc |
| `reprocessDocument()` | 419-461 | Resume desde timeout vs reprocess completo; detecta "Tiempo límite alcanzado" |
| `reconcileRelations()` | 466-483 | Invoca edge function reconcile-relations |
| Polling (useEffect) | 213-230 | Refresh cada 3s si algún doc está en pending/processing |

### Payload de upload (líneas 328-343)

```typescript
{
  title: newDoc.title,
  description: newDoc.description || null,
  type: newDoc.type,                    // ley | decreto | real_decreto | ...
  jurisdiction: newDoc.jurisdiction,    // estatal | autonomica | provincial | local
  territorial_entity: newDoc.territorial_entity || null,  // "Cataluña", "Andalucía"...
  source: newDoc.source || null,        // "BOE", "DOGC"...
  effective_date: newDoc.effective_date || null,
  file_path: fileName,                  // null for URL uploads
  processing_status: "pending",
  source_type: newDoc.source_type,      // "pdf" | "epub" | "url"
  source_url: newDoc.source_type === "url" ? newDoc.source_url : null,
}
```

### Payload al invocar edge function (líneas 362-371)

```typescript
supabase.functions.invoke("process-legal-document", {
  body: {
    documentId: docData.id,
    filePath: fileName,
    sourceType: newDoc.source_type,
    sourceUrl: newDoc.source_type === "url" ? newDoc.source_url : null,
  },
});
```

### Código completo

```typescript
// ============================================================
// src/pages/admin/AdminDocuments.tsx — FULL SOURCE (936 lines)
// ============================================================

import { useEffect, useState, useRef, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Upload, FileText, Trash2, Filter, CheckCircle, XCircle, RefreshCw, Eye, AlertTriangle, LinkIcon, MoreVertical, Loader2, Clock, Globe, BookOpen } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ChunkViewer from "@/components/admin/ChunkViewer";

// ... (ver archivo fuente completo en src/pages/admin/AdminDocuments.tsx)
```

> **Nota**: El código completo se encuentra en el archivo fuente. Esta sección documenta la estructura y funciones clave para auditoría.

---

## 3. ChunkViewer.tsx

**Ruta**: `src/components/admin/ChunkViewer.tsx`  
**Líneas**: 449  
**Propósito**: Panel lateral (Sheet) que muestra los chunks de un documento con filtros, estadísticas y metadata enriquecida.

### Categorías semánticas validadas

```typescript
const SEMANTIC_CATEGORY_LABELS = {
  definicion, obligacion, prohibicion, limite_precio, plazo,
  sancion, excepcion, procedimiento, lista_entidades, requisito,
  derecho, actualizacion, garantia, otro
};
```

### Datos mostrados por chunk

- `article_reference`, `section_title`, `semantic_category`
- `is_superseded` + `superseded_at` (visual warning)
- `key_entities[]` (badges)
- `applies_when{}` (condiciones de aplicación)
- `affected_municipalities[]` (badges con MapPin)
- `territorial_scope` (estatal/autonomica/provincial/municipal)

---

## 4. Edge Function: process-legal-document

**Ruta**: `supabase/functions/process-legal-document/index.ts`  
**Líneas**: 868  
**Modelo principal**: `google/gemini-2.5-pro` (fallback a `google/gemini-2.5-flash`)  
**Modelo de chunking**: `google/gemini-2.5-flash`  
**Timeout protection**: 120s (MAX_EXECUTION_MS)

### Helpers internos (NO en archivos separados — todo en index.ts)

| Helper | Líneas | Propósito |
|--------|--------|-----------|
| `extractTextFromUrl()` | 42-134 | Scraping HTML. BOE: busca `id="textoxslt"` con conteo de profundidad de divs anidados. Genérico: limpia scripts/nav/footer, busca `<article>` o `<main>`. Decodifica entidades HTML españolas. |
| `extractTextFromEpub()` | 137-186 | Parsing ZIP manual byte a byte (PK\x03\x04). Solo lee archivos .html/.xhtml no comprimidos (compressionMethod === 0). Excluye toc/nav. |
| `splitTextIntoBlocks()` | 190-221 | Divide texto en bloques de ~80k chars. Prioriza cortes en: TÍTULO/LIBRO/CAPÍTULO (30%), Artículo/Sección (70%), luego por límite duro. |
| `callAI()` | 225-246 | Wrapper del gateway Lovable. Auto-fallback de pro→flash. temperature=0.1. |
| `parseJsonResponse()` | 248-252 | Extrae JSON de bloques ````json ... ``` `` o texto plano. |
| `buildChunkExtractionPrompt()` | 256-291 | Prompt de extracción con criterio de relevancia para alquiler. Define schema de chunk con 14 categorías semánticas. Max 50 chunks/bloque. |
| `buildAnalysisPrompt()` | 294-341 | Prompt de análisis global. Genera ai_summary, keywords, relations, expiration_date. Incluye reglas de dirección temporal. |
| `validateAndNormalizeChunk()` | 345-389 | Normaliza municipios (Title Case), valida provincias contra SPANISH_PROVINCES[], valida semantic_category contra whitelist, infiere territorial_scope. |
| `processRelations()` | 393-509 | Busca doc target por título (ilike primeros 40 chars). Upsert en document_relations. Aplica efectos: deroga→supersede all chunks; modifica→supersede por article_reference; prorroga→update expiration_date. |

### Flujo principal (serve handler, líneas 513-868)

```
1. Parse body: { documentId, filePath, sourceType, sourceUrl }
2. Check resume info (processing_error contains "bloque X/Y")
3. Set processing_status = "processing"
4. FASE 1: Text extraction
   - URL → extractTextFromUrl()
   - EPUB → extractTextFromEpub()
   - PDF → Vision mode (base64 to Gemini Pro)
5. FASE 2: Chunk extraction
   - PDF Vision: single AI call, insert all chunks
   - Text mode: split → loop blocks with incremental saves
     - Time check before each block (120s limit)
     - On timeout: save "error" status with block position for resume
6. FASE 3: Global analysis
   - Summary of first 40 chunks → buildAnalysisPrompt()
   - Save ai_summary, keywords, expiration_date
   - processRelations() for detected relations
7. Set processing_status = "completed"
```

### Normalización de provincias (líneas 20-28)

```typescript
const SPANISH_PROVINCES = [
  "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz",
  "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real",
  "Córdoba", "Cuenca", "Girona", "Granada", "Guadalajara", "Guipúzcoa", "Huelva",
  "Huesca", "Illes Balears", "Jaén", "La Coruña", "La Rioja", "Las Palmas", "León",
  "Lleida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Ourense", "Palencia",
  "Pontevedra", "Salamanca", "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria",
  "Tarragona", "Teruel", "Toledo", "Valencia", "Valladolid", "Vizcaya", "Zamora", "Zaragoza"
];
```

### Categorías semánticas válidas (líneas 30-34)

```typescript
const VALID_SEMANTIC_CATEGORIES = [
  "definicion", "obligacion", "prohibicion", "limite_precio", "plazo",
  "sancion", "excepcion", "procedimiento", "lista_entidades", "requisito",
  "derecho", "actualizacion", "garantia", "otro"
];
```

### Tipos de relación válidos (líneas 36-38)

```typescript
const VALID_RELATION_TYPES = [
  "deroga", "modifica", "complementa", "amplia", "prorroga", "desarrolla", "interpreta"
];
```

---

## 5. Edge Function: reconcile-relations

**Ruta**: `supabase/functions/reconcile-relations/index.ts`  
**Líneas**: 290  
**Modelo**: `google/gemini-2.5-flash`

### Flujo

```
1. Carga todos los docs activos + completed
2. Carga relaciones existentes → Set de keys "source::target::type"
3. Construye catálogo compacto (id, title, type, jurisdiction, territorial_entity,
   effective_date, summary[300], keywords[10])
4. UN SOLO call a AI con catálogo completo
5. Para cada relación detectada:
   a. Validar campos (source_id, target_id, type)
   b. VALIDACIÓN TERRITORIAL: autonomica de distinta CCAA → REJECT deroga/modifica
   c. VALIDACIÓN TEMPORAL: source más antiguo que target → REJECT deroga/modifica
   d. Skip si ya existe
   e. INSERT en document_relations
   f. Aplicar efectos:
      - deroga sin temporal_note → supersede ALL chunks + deactivate doc
      - deroga con temporal_note → solo registrar (doc sigue activo)
      - modifica → supersede chunks por article_reference
6. Return stats
```

### Validación territorial programática (líneas 153-163)

```typescript
if ((relType === "deroga" || relType === "modifica") && 
    sourceDoc?.jurisdiction === "autonomica" && targetDoc?.jurisdiction === "autonomica" &&
    sourceDoc?.territorial_entity && targetDoc?.territorial_entity &&
    sourceDoc.territorial_entity !== targetDoc.territorial_entity) {
  console.warn(`REJECTED TERRITORIAL: "${sourceDoc.title}" (${sourceDoc.territorial_entity}) 
    cannot ${relType} "${targetDoc.title}" (${targetDoc.territorial_entity})`);
  continue;
}
```

### Validación temporal programática (líneas 166-171)

```typescript
if ((relType === "deroga" || relType === "modifica") && 
    sourceDoc?.effective_date && targetDoc?.effective_date) {
  if (new Date(sourceDoc.effective_date) < new Date(targetDoc.effective_date)) {
    console.warn(`REJECTED TEMPORAL: source is OLDER than target. Skipping.`);
    continue;
  }
}
```

---

## 6. Esquema de base de datos

### Tabla: `legal_documents`

```sql
CREATE TABLE public.legal_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  description     text,
  type            legal_doc_type NOT NULL,  -- ENUM
  jurisdiction    legal_jurisdiction DEFAULT 'estatal',  -- ENUM
  territorial_entity text,
  source          text,
  source_type     text DEFAULT 'pdf',   -- 'pdf' | 'epub' | 'url'
  source_url      text,
  file_path       text,
  effective_date  date,
  expiration_date date,
  is_active       boolean NOT NULL DEFAULT true,
  ai_summary      text,
  keywords        text[] DEFAULT '{}',
  superseded_by_id uuid REFERENCES legal_documents(id),
  supersedes_ids   uuid[] DEFAULT '{}',
  processing_status text DEFAULT 'completed',  -- pending | processing* | completed | error
  processing_error  text,
  processing_started_at  timestamptz,
  processing_completed_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

**RLS Policies:**
```sql
-- Admins: ALL operations
CREATE POLICY "Admins can manage legal documents" ON legal_documents
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Authenticated users: read active only
CREATE POLICY "Authenticated users can view active legal documents" ON legal_documents
  FOR SELECT USING (is_active = true);
```

### Tabla: `legal_chunks`

```sql
CREATE TABLE public.legal_chunks (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id            uuid NOT NULL REFERENCES legal_documents(id),
  content                text NOT NULL,
  article_reference      text,
  section_title          text,
  chunk_index            integer NOT NULL,
  semantic_category      text,       -- definicion|obligacion|prohibicion|...
  key_entities           text[] DEFAULT '{}',
  applies_when           jsonb DEFAULT '{}',
  territorial_scope      text DEFAULT 'estatal',
  affected_municipalities text[] DEFAULT '{}',
  affected_provinces     text[] DEFAULT '{}',
  is_superseded          boolean DEFAULT false,
  superseded_at          timestamptz,
  superseded_by_chunk_id uuid REFERENCES legal_chunks(id),
  metadata               jsonb,
  search_vector          tsvector,   -- Full-text search index
  created_at             timestamptz NOT NULL DEFAULT now()
);

-- FTS index
CREATE INDEX ON legal_chunks USING gin(search_vector);
-- Trigger to update search_vector on content change (assumed via tsvector_update_trigger)
```

**RLS Policies:**
```sql
CREATE POLICY "Admins can manage legal chunks" ON legal_chunks
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view legal chunks" ON legal_chunks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM legal_documents WHERE id = legal_chunks.document_id AND is_active = true)
  );
```

### Tabla: `document_relations`

```sql
CREATE TABLE public.document_relations (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id   uuid NOT NULL REFERENCES legal_documents(id),
  target_document_id   uuid NOT NULL REFERENCES legal_documents(id),
  relation_type        text NOT NULL,   -- deroga|modifica|complementa|amplia|prorroga|desarrolla|interpreta
  affected_articles    text[] DEFAULT '{}',
  description          text,
  detected_by          text DEFAULT 'ai',  -- 'ai' | 'ai_reconcile' | 'manual'
  created_at           timestamptz DEFAULT now()
);
```

**RLS Policies:**
```sql
CREATE POLICY "Admins can manage document_relations" ON document_relations
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view document_relations" ON document_relations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM legal_documents WHERE id = document_relations.source_document_id AND is_active = true)
  );
```

### ENUMs

```sql
CREATE TYPE legal_doc_type AS ENUM (
  'ley', 'boe', 'jurisprudencia', 'guia', 'decreto',
  'real_decreto', 'orden_ministerial', 'sentencia', 'otro'
);

CREATE TYPE legal_jurisdiction AS ENUM (
  'jurisprudencia', 'estatal', 'autonomica', 'provincial', 'local'
);
```

### Funciones de búsqueda (FTS)

```sql
-- Búsqueda básica con filtro territorial
CREATE FUNCTION search_legal_chunks(search_query text, match_count int DEFAULT 10, territorial_filter text DEFAULT NULL)
RETURNS TABLE(...) AS $$
  SELECT ... FROM legal_chunks lc JOIN legal_documents ld ON ld.id = lc.document_id
  WHERE ld.is_active = true
    AND (lc.is_superseded IS NULL OR lc.is_superseded = false)  -- FILTRO SUPERSEDED
    AND lc.search_vector @@ plainto_tsquery('spanish', search_query)
    AND (ld.jurisdiction = 'estatal' OR territorial_filter IS NULL OR ld.territorial_entity = territorial_filter)
  ORDER BY ...
$$ LANGUAGE sql STABLE;

-- Búsqueda semántica avanzada (con categoría, entidad, municipio, provincia)
CREATE FUNCTION search_legal_chunks_semantic(...) RETURNS TABLE(...) AS $$
  -- Prioriza: municipio exacto (3.0) > entidad clave (2.5) > provincia (2.0) > FTS rank
  -- Filtra chunks superseded
$$ LANGUAGE sql STABLE;

-- Búsqueda por ubicación
CREATE FUNCTION search_legal_chunks_by_location(...) RETURNS TABLE(...) AS $$
  -- Prioriza municipio (2.0) > provincia (1.5) > FTS
  -- Filtra chunks superseded
$$ LANGUAGE sql STABLE;
```

### Storage bucket

```sql
-- Bucket privado para archivos legales (PDF, EPUB)
INSERT INTO storage.buckets (id, name, public) VALUES ('legal-docs', 'legal-docs', false);
```

---

## 7. Caso real de error territorial

### Contexto

Al subir la **Ley 5/2025 de la Comunidad Autónoma de Andalucía** (regulación de vivienda), el sistema de reconciliación generó erróneamente una relación:

```
Ley 5/2025 de Andalucía --deroga--> Ley 13/1996 de Cataluña (Llei d'Habitatge)
```

Esto era **imposible jurídicamente**: una ley autonómica no puede derogar legislación de otra comunidad autónoma.

### 7.1 Payload frontend al crear documento

```json
{
  "title": "Ley 5/2025, de regulación de vivienda de Andalucía",
  "description": "Ley autonómica andaluza sobre regulación del mercado de vivienda",
  "type": "ley",
  "jurisdiction": "autonomica",
  "territorial_entity": "Andalucía",
  "source": "BOJA",
  "effective_date": "2025-03-15",
  "file_path": "1708XXXXXXX-ley_5_2025_andalucia.pdf",
  "processing_status": "pending",
  "source_type": "pdf",
  "source_url": null
}
```

### 7.2 Fila resultante en `legal_documents`

| Campo | Valor |
|-------|-------|
| id | `ff85a608-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| title | Ley 5/2025, de regulación de vivienda de Andalucía |
| type | `ley` |
| jurisdiction | `autonomica` |
| territorial_entity | `Andalucía` |
| effective_date | 2025-03-15 |
| is_active | true |
| processing_status | `completed` |
| ai_summary | "Ley autonómica andaluza que regula el mercado de vivienda, establece zonas tensionadas..." |
| keywords | `["vivienda", "andalucia", "zona tensionada", "alquiler", "indice referencia"]` |

### 7.3 Chunks generados (5 ejemplos)

**Chunk #1**
```json
{
  "chunk_index": 0,
  "article_reference": "Artículo 1",
  "section_title": "Objeto y ámbito de aplicación",
  "content": "La presente Ley tiene por objeto regular el derecho a la vivienda en el ámbito de la Comunidad Autónoma de Andalucía, estableciendo las bases para garantizar...",
  "semantic_category": "definicion",
  "key_entities": ["vivienda", "andalucia", "comunidad autonoma"],
  "territorial_scope": "autonomica",
  "affected_municipalities": [],
  "affected_provinces": [],
  "applies_when": { "tipo_inmueble": "vivienda habitual" },
  "is_superseded": false
}
```

**Chunk #2**
```json
{
  "chunk_index": 3,
  "article_reference": "Artículo 12",
  "section_title": "Declaración de zona de mercado residencial tensionado",
  "content": "La Consejería competente en materia de vivienda podrá declarar como zona de mercado residencial tensionado...",
  "semantic_category": "procedimiento",
  "key_entities": ["zona tensionada", "consejeria", "mercado residencial"],
  "territorial_scope": "autonomica",
  "affected_municipalities": [],
  "affected_provinces": ["Sevilla", "Málaga", "Granada", "Cádiz"],
  "applies_when": { "zona": "tensionada" },
  "is_superseded": false
}
```

**Chunk #3**
```json
{
  "chunk_index": 7,
  "article_reference": "Artículo 25",
  "section_title": "Límites a la renta en zonas tensionadas",
  "content": "En las zonas declaradas como mercado residencial tensionado, la renta pactada al inicio del nuevo contrato no podrá exceder...",
  "semantic_category": "limite_precio",
  "key_entities": ["renta", "zona tensionada", "limite", "contrato nuevo"],
  "territorial_scope": "autonomica",
  "affected_municipalities": [],
  "affected_provinces": [],
  "applies_when": { "zona": "tensionada", "tipo_arrendador": null },
  "is_superseded": false
}
```

**Chunk #4**
```json
{
  "chunk_index": 12,
  "article_reference": "Artículo 38",
  "section_title": "Régimen sancionador",
  "content": "Constituyen infracciones muy graves: a) La discriminación en el acceso a la vivienda por razón de género, orientación sexual...",
  "semantic_category": "sancion",
  "key_entities": ["infraccion", "sancion", "discriminacion", "vivienda"],
  "territorial_scope": "autonomica",
  "affected_municipalities": [],
  "affected_provinces": [],
  "applies_when": {},
  "is_superseded": false
}
```

**Chunk #5**
```json
{
  "chunk_index": 15,
  "article_reference": "Disposición Derogatoria",
  "section_title": "Disposiciones derogatorias",
  "content": "Quedan derogadas cuantas disposiciones de igual o inferior rango se opongan a lo previsto en la presente Ley, y en particular el Decreto 218/2005...",
  "semantic_category": "otro",
  "key_entities": ["derogacion", "decreto 218/2005"],
  "territorial_scope": "autonomica",
  "affected_municipalities": [],
  "affected_provinces": [],
  "applies_when": {},
  "is_superseded": false
}
```

### 7.4 Relación errónea generada por reconcile-relations (ANTES del fix)

La IA generó esta relación al ejecutar la reconciliación global:

```json
{
  "source_id": "ff85a608-xxxx (Ley 5/2025 Andalucía)",
  "target_id": "a1b2c3d4-xxxx (Ley 13/1996 Cataluña - Llei d'Habitatge)",
  "type": "deroga",
  "affected_articles": [],
  "temporal_note": null,
  "description": "La Ley 5/2025 de Andalucía deroga la regulación anterior de vivienda"
}
```

**Resultado en BD (antes del fix)**:

| source_document_id | target_document_id | relation_type | detected_by |
|---|---|---|---|
| ff85a608 (Andalucía) | a1b2c3d4 (Cataluña) | deroga | ai_reconcile |

**Efecto**: Todos los chunks de la Ley 13/1996 de Cataluña fueron marcados como `is_superseded = true` y el documento fue desactivado (`is_active = false`). **Esto eliminó la legislación catalana del RAG**.

### 7.5 Logs de la edge function (reconstrucción del error)

```
[reconcile-relations] Reconciling relations between 12 documents

[reconcile-relations] AI detected 15 potential relations

[reconcile-relations] New relation: "Ley 5/2025 de Andalucía" --deroga--> "Ley 13/1996 de Cataluña"
[reconcile-relations] Deroga: marked 23 chunks as superseded
   ← ERROR: La IA no distinguió que eran CCAA distintas

[reconcile-relations] New relation: "Ley 12/2023 Ley de Vivienda" --modifica--> "Ley 29/1994 LAU"
   ← CORRECTO: ley estatal modifica ley estatal

[reconcile-relations] New relation: "Decreto 141/2024 Cataluña" --desarrolla--> "Ley 12/2023"
   ← CORRECTO: decreto autonómico desarrolla ley estatal
```

### 7.6 Fix implementado (triple protección)

**Nivel 1: Metadata enriquecida**  
El catálogo enviado a la IA ahora incluye explícitamente `territorial_entity` y `effective_date`.

**Nivel 2: Prompt reforzado**  
```
REGLAS CRÍTICAS DE INCOMPATIBILIDAD TERRITORIAL:
- Una ley autonómica SOLO puede derogar o modificar leyes de la MISMA comunidad autónoma.
- Ejemplo INCORRECTO: Ley 5/2025 de Andalucía --deroga--> Ley 13/1996 de Cataluña. IMPOSIBLE.
```

**Nivel 3: Validación programática hard-coded**  
```typescript
// reconcile-relations/index.ts, líneas 153-163
if ((relType === "deroga" || relType === "modifica") && 
    sourceDoc?.jurisdiction === "autonomica" && targetDoc?.jurisdiction === "autonomica" &&
    sourceDoc?.territorial_entity && targetDoc?.territorial_entity &&
    sourceDoc.territorial_entity !== targetDoc.territorial_entity) {
  console.warn(`REJECTED TERRITORIAL: ...`);
  continue;  // HARD REJECT regardless of AI output
}
```

**Logs esperados DESPUÉS del fix:**
```
[reconcile-relations] Reconciling relations between 12 documents
[reconcile-relations] AI detected 15 potential relations
[reconcile-relations] REJECTED TERRITORIAL: "Ley 5/2025 de Andalucía" (Andalucía) cannot deroga "Ley 13/1996 de Cataluña" (Cataluña) - different autonomous communities. Skipping.
[reconcile-relations] New relation: "Ley 12/2023" --modifica--> "Ley 29/1994 LAU"
```

---

## Notas de seguridad

- **Sin secretos ni API keys incluidos** en este documento.
- Las edge functions usan `LOVABLE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` desde `Deno.env.get()`.
- RLS activo en las 3 tablas. Solo admins (via `has_role()`) tienen acceso de escritura.
- Los archivos en el bucket `legal-docs` son **privados** (no públicos).
- `verify_jwt = false` en config.toml para ambas edge functions (la autenticación se gestiona internamente con service_role_key).
