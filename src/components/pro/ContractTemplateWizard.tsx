import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  MapPin, 
  Euro, 
  Calendar as CalendarIcon, 
  Receipt,
  Settings,
  Download,
  AlertTriangle,
  Info,
  CheckCircle2,
  Loader2,
  MapPinCheck,
  MapPinOff
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  ContractConfig, 
  defaultContractConfig, 
  COMUNIDADES_AUTONOMAS,
  PROVINCIAS_POR_CCAA,
  DURACIONES_CONTRATO,
  DIAS_PAGO,
  MESES_FIANZA,
  MESES_GARANTIAS
} from "@/utils/contractTemplateConfig";
import { generateContractDocx } from "@/utils/generateContractTemplate";
import { supabase } from "@/integrations/supabase/client";

const STEPS = [
  { id: 1, title: "Tipo de inmueble", icon: FileText },
  { id: 2, title: "Ubicación", icon: MapPin },
  { id: 3, title: "Condiciones económicas", icon: Euro },
  { id: 4, title: "Duración", icon: CalendarIcon },
  { id: 5, title: "Gastos", icon: Receipt },
  { id: 6, title: "Cláusulas opcionales", icon: Settings },
];

const ContractTemplateWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<ContractConfig>(defaultContractConfig);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCheckingZona, setIsCheckingZona] = useState(false);
  const [zonaTensionadaChecked, setZonaTensionadaChecked] = useState(false);
  const [availableProvincias, setAvailableProvincias] = useState<string[]>([]);

  // Actualizar provincias cuando cambia la comunidad autónoma
  useEffect(() => {
    if (config.comunidadAutonoma) {
      const provincias = PROVINCIAS_POR_CCAA[config.comunidadAutonoma] || [];
      setAvailableProvincias(provincias);
      // Si solo hay una provincia, seleccionarla automáticamente
      if (provincias.length === 1) {
        updateConfig({ provincia: provincias[0] });
      } else if (!provincias.includes(config.provincia)) {
        updateConfig({ provincia: '' });
      }
    } else {
      setAvailableProvincias([]);
    }
  }, [config.comunidadAutonoma]);

  // Verificar zona tensionada cuando cambia el municipio
  useEffect(() => {
    const checkZonaTensionada = async () => {
      if (!config.municipio || config.municipio.length < 3) {
        setZonaTensionadaChecked(false);
        return;
      }

      setIsCheckingZona(true);
      try {
        // Buscar en la base de datos de chunks legales si el municipio está en zonas tensionadas
        const { data, error } = await supabase
          .from('legal_chunks')
          .select('id, affected_municipalities')
          .eq('semantic_category', 'lista_entidades')
          .not('affected_municipalities', 'is', null);

        if (error) {
          console.error('Error checking zona tensionada:', error);
          setZonaTensionadaChecked(true);
          return;
        }

        // Normalizar el municipio para comparar
        const normalizedMunicipio = config.municipio.toLowerCase().trim();
        
        // Buscar si el municipio está en algún array de affected_municipalities
        const isZonaTensionada = data?.some(chunk => {
          if (!chunk.affected_municipalities) return false;
          return chunk.affected_municipalities.some((m: string) => 
            m.toLowerCase().trim() === normalizedMunicipio ||
            m.toLowerCase().trim().includes(normalizedMunicipio) ||
            normalizedMunicipio.includes(m.toLowerCase().trim())
          );
        }) || false;

        updateConfig({ isZonaTensionada });
        setZonaTensionadaChecked(true);
      } catch (err) {
        console.error('Error checking zona tensionada:', err);
        setZonaTensionadaChecked(true);
      } finally {
        setIsCheckingZona(false);
      }
    };

    // Debounce para no hacer demasiadas consultas
    const timeoutId = setTimeout(checkZonaTensionada, 500);
    return () => clearTimeout(timeoutId);
  }, [config.municipio]);

  const updateConfig = (updates: Partial<ContractConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!config.propertyType;
      case 2:
        return !!config.comunidadAutonoma && !!config.provincia && !!config.municipio && zonaTensionadaChecked;
      case 3:
        return config.rentaMensual > 0 && config.mesesFianza > 0;
      case 4:
        return !!config.fechaInicio && config.duracionAnios > 0;
      case 5:
        return true;
      case 6:
        return disclaimerAccepted;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleGenerate = async () => {
    if (!disclaimerAccepted) {
      toast.error("Debes aceptar el aviso legal para continuar");
      return;
    }

    setIsGenerating(true);
    try {
      await generateContractDocx(config);
      toast.success("Documento Word generado correctamente", {
        description: "El archivo .docx se ha descargado a tu dispositivo"
      });
    } catch (error) {
      console.error("Error generando plantilla:", error);
      toast.error("Error al generar la plantilla", {
        description: "Por favor, inténtalo de nuevo"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium mb-4 block">
                ¿Qué tipo de inmueble se va a arrendar?
              </Label>
              <RadioGroup
                value={config.propertyType}
                onValueChange={(value: 'vivienda_habitual' | 'uso_distinto') => 
                  updateConfig({ propertyType: value })
                }
                className="space-y-3"
              >
                <div className="flex items-start space-x-3 p-4 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="vivienda_habitual" id="vivienda_habitual" className="mt-1" />
                  <div>
                    <Label htmlFor="vivienda_habitual" className="font-medium cursor-pointer">
                      Vivienda habitual
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Destinada a residencia permanente del inquilino. Aplica la LAU con todas sus protecciones.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-4 border rounded-xl hover:bg-muted/50 transition-colors cursor-pointer">
                  <RadioGroupItem value="uso_distinto" id="uso_distinto" className="mt-1" />
                  <div>
                    <Label htmlFor="uso_distinto" className="font-medium cursor-pointer">
                      Uso distinto de vivienda
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Temporada, vacacional, profesional u otros usos. Régimen más flexible.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="propertyDescription" className="text-sm">
                Descripción del inmueble (opcional)
              </Label>
              <Input
                id="propertyDescription"
                placeholder="Ej: Piso de 80m² con 3 dormitorios y 2 baños"
                value={config.propertyDescription || ''}
                onChange={(e) => updateConfig({ propertyDescription: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-sm">Comunidad Autónoma *</Label>
                <Select
                  value={config.comunidadAutonoma}
                  onValueChange={(value) => updateConfig({ comunidadAutonoma: value, provincia: '', municipio: '' })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecciona..." />
                  </SelectTrigger>
                  <SelectContent>
                    {COMUNIDADES_AUTONOMAS.map((ca) => (
                      <SelectItem key={ca} value={ca}>{ca}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Provincia *</Label>
                <Select
                  value={config.provincia}
                  onValueChange={(value) => updateConfig({ provincia: value, municipio: '' })}
                  disabled={!config.comunidadAutonoma}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder={config.comunidadAutonoma ? "Selecciona..." : "Primero selecciona CC.AA."} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProvincias.map((prov) => (
                      <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="municipio" className="text-sm">Municipio *</Label>
              <Input
                id="municipio"
                placeholder="Escribe el nombre del municipio"
                value={config.municipio}
                onChange={(e) => {
                  updateConfig({ municipio: e.target.value });
                  setZonaTensionadaChecked(false);
                }}
                className="mt-2"
                disabled={!config.provincia}
              />
            </div>

            {/* Estado de verificación de zona tensionada */}
            <div className="p-4 border rounded-xl bg-muted/30">
              <div className="flex items-center gap-3">
                {isCheckingZona ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Verificando zona tensionada...</span>
                  </>
                ) : zonaTensionadaChecked ? (
                  config.isZonaTensionada ? (
                    <>
                      <MapPinCheck className="h-5 w-5 text-amber-600" />
                      <div className="flex-1">
                        <p className="font-medium text-amber-800">Zona de mercado tensionado</p>
                        <p className="text-sm text-muted-foreground">
                          La renta estará limitada según normativa vigente
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-amber-50 border-amber-300 text-amber-800">
                        Tensionada
                      </Badge>
                    </>
                  ) : (
                    <>
                      <MapPinOff className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium">Zona no tensionada</p>
                        <p className="text-sm text-muted-foreground">
                          No hay limitaciones especiales de renta
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-muted">
                        Normal
                      </Badge>
                    </>
                  )
                ) : config.municipio ? (
                  <>
                    <Info className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Escribe el municipio completo para verificar la zona
                    </span>
                  </>
                ) : (
                  <>
                    <Info className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Introduce el municipio para verificar si es zona tensionada
                    </span>
                  </>
                )}
              </div>
            </div>

            {config.isZonaTensionada && zonaTensionadaChecked && (
              <Alert className="border-amber-500/50 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  La renta inicial no podrá exceder de la última renta del contrato anterior. 
                  Consulta el <a href="https://serpavi.mivau.gob.es/" target="_blank" rel="noopener noreferrer" className="underline font-medium">Sistema de Precios de Referencia</a> para más información.
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="renta" className="text-sm">Renta mensual (€)</Label>
                <Input
                  id="renta"
                  type="number"
                  min="0"
                  step="50"
                  placeholder="850"
                  value={config.rentaMensual || ''}
                  onChange={(e) => updateConfig({ rentaMensual: parseFloat(e.target.value) || 0 })}
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-sm">Día de pago</Label>
                <Select
                  value={config.diaPago.toString()}
                  onValueChange={(value) => updateConfig({ diaPago: parseInt(value) })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAS_PAGO.map((dia) => (
                      <SelectItem key={dia.value} value={dia.value.toString()}>
                        {dia.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm">Fianza legal</Label>
              <Select
                value={config.mesesFianza.toString()}
                onValueChange={(value) => updateConfig({ mesesFianza: parseInt(value) })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESES_FIANZA.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value.toString()}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {config.rentaMensual > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Importe: {(config.rentaMensual * config.mesesFianza).toLocaleString('es-ES')} €
                </p>
              )}
            </div>

            <div className="space-y-4 p-4 border rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="garantiasAdicionales" className="font-medium">
                    Garantías adicionales
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Aval bancario o depósito extra
                  </p>
                </div>
                <Switch
                  id="garantiasAdicionales"
                  checked={config.tieneGarantiasAdicionales}
                  onCheckedChange={(checked) => updateConfig({ tieneGarantiasAdicionales: checked })}
                />
              </div>

              {config.tieneGarantiasAdicionales && (
                <div>
                  <Label className="text-sm">Meses de garantía adicional</Label>
                  <Select
                    value={(config.mesesGarantiasAdicionales || 1).toString()}
                    onValueChange={(value) => updateConfig({ mesesGarantiasAdicionales: parseInt(value) })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MESES_GARANTIAS.map((mes) => (
                        <SelectItem key={mes.value} value={mes.value.toString()}>
                          {mes.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {config.rentaMensual > 0 && config.mesesGarantiasAdicionales && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Importe: {(config.rentaMensual * config.mesesGarantiasAdicionales).toLocaleString('es-ES')} €
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-sm">Fecha de inicio del contrato</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-2",
                      !config.fechaInicio && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {config.fechaInicio 
                      ? format(config.fechaInicio, "PPP", { locale: es })
                      : "Selecciona una fecha"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={config.fechaInicio}
                    onSelect={(date) => date && updateConfig({ fechaInicio: date })}
                    locale={es}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="text-sm">Duración inicial del contrato</Label>
              <Select
                value={config.duracionAnios.toString()}
                onValueChange={(value) => updateConfig({ duracionAnios: parseInt(value) })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURACIONES_CONTRATO.map((dur) => (
                    <SelectItem key={dur.value} value={dur.value.toString()}>
                      {dur.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {config.propertyType === 'vivienda_habitual' && config.duracionAnios < 5 && (
              <Alert className="border-blue-500/50 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Recuerda que para vivienda habitual, el inquilino tiene derecho a prórrogas 
                  anuales obligatorias hasta completar 5 años (o 7 si el arrendador es persona jurídica).
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/30">
              <div className="space-y-1">
                <Label htmlFor="renovacion" className="font-medium">
                  Renovación automática
                </Label>
                <p className="text-sm text-muted-foreground">
                  Al finalizar, prórrogas anuales hasta 3 años más
                </p>
              </div>
              <Switch
                id="renovacion"
                checked={config.renovacionAutomatica}
                onCheckedChange={(checked) => updateConfig({ renovacionAutomatica: checked })}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium mb-3 block">
                Gastos de comunidad
              </Label>
              <RadioGroup
                value={config.gastosComunidad}
                onValueChange={(value: 'arrendador' | 'arrendatario') => 
                  updateConfig({ gastosComunidad: value })
                }
                className="grid grid-cols-2 gap-3"
              >
                <div className={cn(
                  "flex items-center space-x-2 p-3 border rounded-xl cursor-pointer transition-colors",
                  config.gastosComunidad === 'arrendador' ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}>
                  <RadioGroupItem value="arrendador" id="comunidad_arrendador" />
                  <Label htmlFor="comunidad_arrendador" className="cursor-pointer">Arrendador</Label>
                </div>
                <div className={cn(
                  "flex items-center space-x-2 p-3 border rounded-xl cursor-pointer transition-colors",
                  config.gastosComunidad === 'arrendatario' ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}>
                  <RadioGroupItem value="arrendatario" id="comunidad_arrendatario" />
                  <Label htmlFor="comunidad_arrendatario" className="cursor-pointer">Arrendatario</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base font-medium mb-3 block">
                IBI (Impuesto sobre Bienes Inmuebles)
              </Label>
              <RadioGroup
                value={config.ibi}
                onValueChange={(value: 'arrendador' | 'arrendatario') => 
                  updateConfig({ ibi: value })
                }
                className="grid grid-cols-2 gap-3"
              >
                <div className={cn(
                  "flex items-center space-x-2 p-3 border rounded-xl cursor-pointer transition-colors",
                  config.ibi === 'arrendador' ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}>
                  <RadioGroupItem value="arrendador" id="ibi_arrendador" />
                  <Label htmlFor="ibi_arrendador" className="cursor-pointer">Arrendador</Label>
                </div>
                <div className={cn(
                  "flex items-center space-x-2 p-3 border rounded-xl cursor-pointer transition-colors",
                  config.ibi === 'arrendatario' ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}>
                  <RadioGroupItem value="arrendatario" id="ibi_arrendatario" />
                  <Label htmlFor="ibi_arrendatario" className="cursor-pointer">Arrendatario</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base font-medium mb-3 block">
                Suministros (agua, luz, gas)
              </Label>
              <RadioGroup
                value={config.suministros}
                onValueChange={(value: 'incluidos' | 'arrendatario') => 
                  updateConfig({ suministros: value })
                }
                className="grid grid-cols-2 gap-3"
              >
                <div className={cn(
                  "flex items-center space-x-2 p-3 border rounded-xl cursor-pointer transition-colors",
                  config.suministros === 'incluidos' ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}>
                  <RadioGroupItem value="incluidos" id="suministros_incluidos" />
                  <Label htmlFor="suministros_incluidos" className="cursor-pointer">Incluidos</Label>
                </div>
                <div className={cn(
                  "flex items-center space-x-2 p-3 border rounded-xl cursor-pointer transition-colors",
                  config.suministros === 'arrendatario' ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}>
                  <RadioGroupItem value="arrendatario" id="suministros_arrendatario" />
                  <Label htmlFor="suministros_arrendatario" className="cursor-pointer">Arrendatario</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between p-4 border rounded-xl">
                <Label htmlFor="mascotas" className="cursor-pointer">Prohibición de mascotas</Label>
                <Switch
                  id="mascotas"
                  checked={config.prohibicionMascotas}
                  onCheckedChange={(checked) => updateConfig({ prohibicionMascotas: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-xl">
                <Label htmlFor="fumar" className="cursor-pointer">Prohibición de fumar</Label>
                <Switch
                  id="fumar"
                  checked={config.prohibicionFumar}
                  onCheckedChange={(checked) => updateConfig({ prohibicionFumar: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-xl">
                <Label htmlFor="inventario" className="cursor-pointer">Incluir inventario</Label>
                <Switch
                  id="inventario"
                  checked={config.incluyeInventario}
                  onCheckedChange={(checked) => updateConfig({ incluyeInventario: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-xl">
                <Label htmlFor="certificado" className="cursor-pointer">Certificado energético</Label>
                <Switch
                  id="certificado"
                  checked={config.incluyeCertificadoEnergetico}
                  onCheckedChange={(checked) => updateConfig({ incluyeCertificadoEnergetico: checked })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Cláusulas adicionales</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id="obras"
                    checked={config.clausulaObrasReformas}
                    onCheckedChange={(checked) => updateConfig({ clausulaObrasReformas: !!checked })}
                  />
                  <Label htmlFor="obras" className="cursor-pointer flex-1">
                    Cláusula de obras y reformas
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id="subarriendo"
                    checked={config.clausulaSubarriendo}
                    onCheckedChange={(checked) => updateConfig({ clausulaSubarriendo: !!checked })}
                  />
                  <Label htmlFor="subarriendo" className="cursor-pointer flex-1">
                    Prohibición de subarriendo
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id="visitas"
                    checked={config.clausulaAccesoVisitas}
                    onCheckedChange={(checked) => updateConfig({ clausulaAccesoVisitas: !!checked })}
                  />
                  <Label htmlFor="visitas" className="cursor-pointer flex-1">
                    Acceso para visitas (últimos meses)
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id="impago"
                    checked={config.clausulaPenalizacionImpago}
                    onCheckedChange={(checked) => updateConfig({ clausulaPenalizacionImpago: !!checked })}
                  />
                  <Label htmlFor="impago" className="cursor-pointer flex-1">
                    Penalización por impago
                  </Label>
                </div>
              </div>
            </div>

            <div className="p-4 border-2 border-dashed rounded-xl bg-muted/20 space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="disclaimer"
                  checked={disclaimerAccepted}
                  onCheckedChange={(checked) => setDisclaimerAccepted(!!checked)}
                />
                <Label htmlFor="disclaimer" className="text-sm cursor-pointer leading-relaxed">
                  Entiendo que este documento es una plantilla orientativa basada en la LAU vigente y 
                  que debo revisar y personalizar todos los campos antes de su firma. La plantilla 
                  no incluye datos personales y deberán cumplimentarse manualmente.
                </Label>
              </div>
            </div>

            {disclaimerAccepted && (
              <Alert className="border-green-500/50 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Todo listo. Pulsa "Generar contrato" para descargar el documento Word (.docx)
                </AlertDescription>
              </Alert>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="font-serif text-2xl">Generador de contrato de alquiler</CardTitle>
        <CardDescription>
          Crea una plantilla de contrato actualizada a la LAU 2026. Paso {currentStep} de 6.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  "flex flex-col items-center",
                  isActive && "scale-110"
                )}>
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    isCompleted ? "bg-green-100 text-green-600" :
                    isActive ? "bg-primary text-primary-foreground" :
                    "bg-muted text-muted-foreground"
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs mt-2 hidden sm:block max-w-[80px] text-center",
                    isActive ? "font-medium" : "text-muted-foreground"
                  )}>
                    {step.title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "w-8 sm:w-12 h-0.5 mx-2",
                    currentStep > step.id ? "bg-green-500" : "bg-muted"
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="min-h-[320px]">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>

          {currentStep < 6 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={!disclaimerAccepted || isGenerating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generar contrato
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ContractTemplateWizard;