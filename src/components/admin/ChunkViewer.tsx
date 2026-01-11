import { useState, useEffect } from "react";
import { X, MapPin, Tag, FileText, Filter, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";

interface LegalChunk {
  id: string;
  content: string;
  article_reference: string | null;
  section_title: string | null;
  chunk_index: number;
  territorial_scope: string | null;
  affected_municipalities: string[] | null;
  affected_provinces: string[] | null;
  semantic_category: string | null;
  key_entities: string[] | null;
  applies_when: Record<string, string> | null;
}

interface DocumentInfo {
  id: string;
  title: string;
  ai_summary: string | null;
  keywords: string[] | null;
  superseded_by_id: string | null;
  supersedes_ids: string[] | null;
  expiration_date: string | null;
}

interface ChunkViewerProps {
  documentId: string | null;
  documentTitle: string;
  onClose: () => void;
}

const SEMANTIC_CATEGORY_LABELS: Record<string, { label: string; color: string; description: string }> = {
  definicion: { label: "Definición", color: "bg-blue-100 text-blue-800", description: "Define un concepto legal" },
  obligacion: { label: "Obligación", color: "bg-orange-100 text-orange-800", description: "Establece una obligación" },
  prohibicion: { label: "Prohibición", color: "bg-red-100 text-red-800", description: "Prohíbe algo expresamente" },
  limite_precio: { label: "Límite precio", color: "bg-purple-100 text-purple-800", description: "Límites de renta/precio" },
  plazo: { label: "Plazo", color: "bg-cyan-100 text-cyan-800", description: "Plazos y duraciones" },
  sancion: { label: "Sanción", color: "bg-rose-100 text-rose-800", description: "Sanciones por incumplimiento" },
  excepcion: { label: "Excepción", color: "bg-amber-100 text-amber-800", description: "Excepciones a reglas" },
  procedimiento: { label: "Procedimiento", color: "bg-indigo-100 text-indigo-800", description: "Procedimientos a seguir" },
  lista_entidades: { label: "Lista entidades", color: "bg-emerald-100 text-emerald-800", description: "Lista de municipios, zonas, etc." },
  requisito: { label: "Requisito", color: "bg-teal-100 text-teal-800", description: "Requisitos legales" },
  derecho: { label: "Derecho", color: "bg-green-100 text-green-800", description: "Derechos del inquilino/propietario" },
  actualizacion: { label: "Actualización", color: "bg-yellow-100 text-yellow-800", description: "Reglas de actualización de renta" },
  garantia: { label: "Garantía", color: "bg-pink-100 text-pink-800", description: "Fianzas y garantías" },
  otro: { label: "Otro", color: "bg-gray-100 text-gray-800", description: "No categorizado" },
};

const TERRITORIAL_SCOPE_LABELS: Record<string, string> = {
  estatal: "Estatal",
  autonomica: "Autonómica",
  provincial: "Provincial",
  municipal: "Municipal",
};

const ChunkViewer = ({ documentId, documentTitle, onClose }: ChunkViewerProps) => {
  const [chunks, setChunks] = useState<LegalChunk[]>([]);
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!documentId) return;

    const fetchData = async () => {
      setLoading(true);
      
      // Fetch document info
      const { data: docData } = await supabase
        .from("legal_documents")
        .select("id, title, ai_summary, keywords, superseded_by_id, supersedes_ids, expiration_date")
        .eq("id", documentId)
        .single();

      if (docData) {
        setDocumentInfo(docData as DocumentInfo);
      }

      // Fetch chunks
      const { data: chunksData, error } = await supabase
        .from("legal_chunks")
        .select("*")
        .eq("document_id", documentId)
        .order("chunk_index", { ascending: true });

      if (!error && chunksData) {
        setChunks(chunksData as LegalChunk[]);
      }
      setLoading(false);
    };

    fetchData();
  }, [documentId]);

  const filteredChunks = chunks.filter((chunk) => {
    const matchesCategory = filterCategory === "all" || chunk.semantic_category === filterCategory;
    const matchesSearch = searchTerm === "" || 
      chunk.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (chunk.key_entities || []).some(e => e.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (chunk.affected_municipalities || []).some(m => m.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Count chunks by category
  const categoryCounts = chunks.reduce((acc, chunk) => {
    const cat = chunk.semantic_category || "otro";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Collect all unique entities
  const allEntities = new Set<string>();
  chunks.forEach(chunk => {
    (chunk.key_entities || []).forEach(e => allEntities.add(e));
  });

  // Collect all municipalities
  const allMunicipalities = new Set<string>();
  chunks.forEach(chunk => {
    (chunk.affected_municipalities || []).forEach(m => allMunicipalities.add(m));
  });

  return (
    <Sheet open={!!documentId} onOpenChange={() => onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <SheetTitle className="font-serif text-lg">{documentTitle}</SheetTitle>
                <SheetDescription className="mt-1">
                  {chunks.length} fragmentos indexados
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <p className="text-muted-foreground">Cargando chunks...</p>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {/* Document Analysis Summary */}
                {documentInfo && (documentInfo.ai_summary || (documentInfo.keywords && documentInfo.keywords.length > 0)) && (
                  <div className="bg-muted rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" />
                      <h4 className="font-medium">Análisis del documento</h4>
                    </div>
                    
                    {documentInfo.ai_summary && (
                      <p className="text-sm text-muted-foreground">{documentInfo.ai_summary}</p>
                    )}
                    
                    {documentInfo.keywords && documentInfo.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {documentInfo.keywords.map((keyword, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {documentInfo.superseded_by_id && (
                      <div className="flex items-center gap-2 text-amber-600 text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Este documento ha sido reemplazado por uno más reciente</span>
                      </div>
                    )}

                    {documentInfo.supersedes_ids && documentInfo.supersedes_ids.length > 0 && (
                      <div className="text-sm text-green-600">
                        ✓ Este documento reemplaza {documentInfo.supersedes_ids.length} documento(s) anterior(es)
                      </div>
                    )}

                    {documentInfo.expiration_date && (
                      <div className="text-sm text-muted-foreground">
                        Caducidad: {documentInfo.expiration_date}
                      </div>
                    )}
                  </div>
                )}

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">Municipios detectados</div>
                    <div className="text-2xl font-semibold">{allMunicipalities.size}</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">Entidades clave</div>
                    <div className="text-2xl font-semibold">{allEntities.size}</div>
                  </div>
                </div>

                {/* Category distribution */}
                {Object.keys(categoryCounts).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Distribución por categoría</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(categoryCounts).map(([cat, count]) => (
                        <Tooltip key={cat}>
                          <TooltipTrigger asChild>
                            <Badge 
                              variant="outline" 
                              className={`cursor-pointer ${filterCategory === cat ? 'ring-2 ring-primary' : ''}`}
                              onClick={() => setFilterCategory(filterCategory === cat ? "all" : cat)}
                            >
                              <span className={`w-2 h-2 rounded-full mr-1.5 ${SEMANTIC_CATEGORY_LABELS[cat]?.color.split(' ')[0] || 'bg-gray-100'}`}></span>
                              {SEMANTIC_CATEGORY_LABELS[cat]?.label || cat} ({count})
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{SEMANTIC_CATEGORY_LABELS[cat]?.description || cat}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                )}

                {/* All entities preview */}
                {allEntities.size > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Tag className="h-3 w-3" />
                      Entidades clave extraídas
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(allEntities).slice(0, 20).map((entity) => (
                        <Badge key={entity} variant="outline" className="text-xs bg-primary/5">
                          {entity}
                        </Badge>
                      ))}
                      {allEntities.size > 20 && (
                        <Badge variant="outline" className="text-xs">
                          +{allEntities.size - 20} más
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* All municipalities preview */}
                {allMunicipalities.size > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      Municipios detectados ({allMunicipalities.size})
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {Array.from(allMunicipalities).slice(0, 30).map((mun) => (
                        <Badge key={mun} variant="secondary" className="text-xs">
                          {mun}
                        </Badge>
                      ))}
                      {allMunicipalities.size > 30 && (
                        <Badge variant="secondary" className="text-xs">
                          +{allMunicipalities.size - 30} más
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Filters */}
                <div className="flex gap-2">
                  <Input 
                    placeholder="Buscar en chunks..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {Object.entries(SEMANTIC_CATEGORY_LABELS).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Chunks list */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">
                    Fragmentos ({filteredChunks.length} de {chunks.length})
                  </h4>
                  
                  {filteredChunks.map((chunk) => (
                    <div key={chunk.id} className="border rounded-lg p-4 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">#{chunk.chunk_index + 1}</span>
                          {chunk.article_reference && (
                            <Badge variant="outline" className="text-xs">
                              {chunk.article_reference}
                            </Badge>
                          )}
                          {chunk.semantic_category && (
                            <Badge className={`text-xs ${SEMANTIC_CATEGORY_LABELS[chunk.semantic_category]?.color || 'bg-gray-100 text-gray-800'}`}>
                              {SEMANTIC_CATEGORY_LABELS[chunk.semantic_category]?.label || chunk.semantic_category}
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {TERRITORIAL_SCOPE_LABELS[chunk.territorial_scope || 'estatal']}
                        </Badge>
                      </div>

                      {/* Section title */}
                      {chunk.section_title && (
                        <div className="text-sm font-medium text-foreground/80">
                          {chunk.section_title}
                        </div>
                      )}

                      {/* Content */}
                      <p className="text-sm text-muted-foreground line-clamp-4">
                        {chunk.content}
                      </p>

                      {/* Key entities */}
                      {chunk.key_entities && chunk.key_entities.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          {chunk.key_entities.map((entity, i) => (
                            <Badge key={i} variant="outline" className="text-xs bg-primary/5">
                              {entity}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Applies when */}
                      {chunk.applies_when && Object.keys(chunk.applies_when).length > 0 && (
                        <div className="bg-muted/50 rounded p-2 text-xs space-y-1">
                          <span className="font-medium">Condiciones de aplicación:</span>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(chunk.applies_when).map(([key, value]) => (
                              value && (
                                <span key={key} className="text-muted-foreground">
                                  {key}: <span className="text-foreground">{value}</span>
                                </span>
                              )
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Municipalities */}
                      {chunk.affected_municipalities && chunk.affected_municipalities.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {chunk.affected_municipalities.slice(0, 10).map((mun, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {mun}
                            </Badge>
                          ))}
                          {chunk.affected_municipalities.length > 10 && (
                            <span className="text-xs text-muted-foreground">
                              +{chunk.affected_municipalities.length - 10} más
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {filteredChunks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No se encontraron chunks con los filtros aplicados
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChunkViewer;
