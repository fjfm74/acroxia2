import { useState } from "react";
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
  CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  ContractConfig, 
  defaultContractConfig, 
  COMUNIDADES_AUTONOMAS,
  DURACIONES_CONTRATO,
  DIAS_PAGO,
  MESES_FIANZA,
  MESES_GARANTIAS
} from "@/utils/contractTemplateConfig";
import { generateContractDocx } from "@/utils/generateContractTemplate";

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

  const updateConfig = (updates: Partial<ContractConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!config.propertyType;
      case 2:
        return !!config.comunidadAutonoma && !!config.municipio;
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
                <Label className="text-sm">Comunidad Autónoma</Label>
                <Select
                  value={config.comunidadAutonoma}
                  onValueChange={(value) => updateConfig({ comunidadAutonoma: value })}
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
                <Label htmlFor="municipio" className="text-sm">Municipio</Label>
                <Input
                  id="municipio"
                  placeholder="Nombre del municipio"
                  value={config.municipio}
                  onChange={(e) => updateConfig({ municipio: e.target.value })}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-xl bg-muted/30">
              <div className="space-y-1">
                <Label htmlFor="zonaTensionada" className="font-medium">
                  ¿Es zona de mercado tensionado?
                </Label>
                <p className="text-sm text-muted-foreground">
                  Limita la renta según normativa vigente
                </p>
              </div>
              <Switch
                id="zonaTensionada"
                checked={config.isZonaTensionada}
                onCheckedChange={(checked) => updateConfig({ isZonaTensionada: checked })}
              />
            </div>

            {config.isZonaTensionada && (
              <Alert className="border-amber-500/50 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  En zonas tensionadas, la renta inicial está limitada. La plantilla incluirá las 
                  advertencias legales correspondientes y el enlace al sistema de precios de referencia.
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
                Suministros (agua, luz, gas...)
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
                  <Label htmlFor="suministros_incluidos" className="cursor-pointer">Incluidos en renta</Label>
                </div>
                <div className={cn(
                  "flex items-center space-x-2 p-3 border rounded-xl cursor-pointer transition-colors",
                  config.suministros === 'arrendatario' ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                )}>
                  <RadioGroupItem value="arrendatario" id="suministros_arrendatario" />
                  <Label htmlFor="suministros_arrendatario" className="cursor-pointer">A cargo del inquilino</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base font-medium">Cláusulas adicionales</Label>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-4 border rounded-xl">
                  <Switch
                    id="mascotas"
                    checked={config.prohibicionMascotas}
                    onCheckedChange={(checked) => updateConfig({ prohibicionMascotas: checked })}
                  />
                  <div>
                    <Label htmlFor="mascotas" className="font-medium cursor-pointer">
                      Prohibición de mascotas
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Incluye nota sobre limitaciones legales de esta cláusula
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-xl">
                  <Switch
                    id="fumar"
                    checked={config.prohibicionFumar}
                    onCheckedChange={(checked) => updateConfig({ prohibicionFumar: checked })}
                  />
                  <div>
                    <Label htmlFor="fumar" className="font-medium cursor-pointer">
                      Prohibición de fumar
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Permite retención de fianza para limpieza si se incumple
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-xl">
                  <Switch
                    id="obrasReformas"
                    checked={config.clausulaObrasReformas}
                    onCheckedChange={(checked) => updateConfig({ clausulaObrasReformas: checked })}
                  />
                  <div>
                    <Label htmlFor="obrasReformas" className="font-medium cursor-pointer">
                      Obras y reformas
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Regula las condiciones para realizar modificaciones en el inmueble
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-xl">
                  <Switch
                    id="subarriendo"
                    checked={config.clausulaSubarriendo}
                    onCheckedChange={(checked) => updateConfig({ clausulaSubarriendo: checked })}
                  />
                  <div>
                    <Label htmlFor="subarriendo" className="font-medium cursor-pointer">
                      Cesión y subarriendo
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Prohíbe expresamente el subarriendo sin autorización
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-xl">
                  <Switch
                    id="accesoVisitas"
                    checked={config.clausulaAccesoVisitas}
                    onCheckedChange={(checked) => updateConfig({ clausulaAccesoVisitas: checked })}
                  />
                  <div>
                    <Label htmlFor="accesoVisitas" className="font-medium cursor-pointer">
                      Acceso para visitas
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Regula el derecho del propietario a mostrar el inmueble a futuros inquilinos
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-xl">
                  <Switch
                    id="penalizacionImpago"
                    checked={config.clausulaPenalizacionImpago}
                    onCheckedChange={(checked) => updateConfig({ clausulaPenalizacionImpago: checked })}
                  />
                  <div>
                    <Label htmlFor="penalizacionImpago" className="font-medium cursor-pointer">
                      Penalización por impago
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Intereses de demora conforme al interés legal del dinero
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-xl">
                  <Switch
                    id="inventario"
                    checked={config.incluyeInventario}
                    onCheckedChange={(checked) => updateConfig({ incluyeInventario: checked })}
                  />
                  <div>
                    <Label htmlFor="inventario" className="font-medium cursor-pointer">
                      Incluir anexo de inventario
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tabla para listar mobiliario y enseres
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-4 border rounded-xl">
                  <Switch
                    id="certificado"
                    checked={config.incluyeCertificadoEnergetico}
                    onCheckedChange={(checked) => updateConfig({ incluyeCertificadoEnergetico: checked })}
                  />
                  <div>
                    <Label htmlFor="certificado" className="font-medium cursor-pointer">
                      Certificado de eficiencia energética
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Obligatorio para vivienda habitual
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="bg-muted/50 p-4 rounded-xl space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Resumen de la plantilla
                </h4>
                <div className="text-sm space-y-2 text-muted-foreground">
                  <p>• Tipo: {config.propertyType === 'vivienda_habitual' ? 'Vivienda habitual' : 'Uso distinto'}</p>
                  <p>• Ubicación: {config.municipio}, {config.comunidadAutonoma}</p>
                  <p>• Renta: {config.rentaMensual.toLocaleString('es-ES')} €/mes</p>
                  <p>• Duración: {config.duracionAnios} {config.duracionAnios === 1 ? 'año' : 'años'}</p>
                  <p>• Fianza: {config.mesesFianza} {config.mesesFianza === 1 ? 'mes' : 'meses'}</p>
                  {config.isZonaTensionada && <p>• ⚠️ Zona tensionada</p>}
                </div>
              </div>
            </div>

            <Alert className="border-amber-500/50 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Aviso legal:</strong> Esta plantilla es orientativa y está basada en la LAU vigente 
                en 2026. No constituye asesoramiento jurídico profesional. Se recomienda su revisión por 
                un abogado antes de la firma.
              </AlertDescription>
            </Alert>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="disclaimer"
                checked={disclaimerAccepted}
                onCheckedChange={(checked) => setDisclaimerAccepted(checked === true)}
              />
              <Label htmlFor="disclaimer" className="text-sm leading-relaxed cursor-pointer">
                He leído y acepto que esta plantilla es orientativa y no sustituye el asesoramiento 
                legal profesional. Entiendo que debo revisar y adaptar el documento antes de su uso.
              </Label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Stepper */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex justify-between min-w-[600px]">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center relative">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                  isActive ? "bg-foreground text-background" : 
                  isCompleted ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                <span className={cn(
                  "text-xs mt-2 text-center max-w-[80px]",
                  isActive ? "font-medium text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </span>
                {index < STEPS.length - 1 && (
                  <div className={cn(
                    "absolute top-5 left-[60px] w-[calc(100%-20px)] h-0.5",
                    isCompleted ? "bg-green-500" : "bg-muted"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <Card className="rounded-2xl shadow-lg border-0 bg-background">
        <CardHeader>
          <CardTitle className="text-xl font-medium">
            {STEPS[currentStep - 1].title}
          </CardTitle>
          <CardDescription>
            Paso {currentStep} de {STEPS.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepContent()}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            {currentStep < 6 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-full px-6"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={!disclaimerAccepted || isGenerating}
                className="gap-2 bg-foreground text-background hover:bg-foreground/90 rounded-full px-6"
              >
                <Download className="h-4 w-4" />
                {isGenerating ? "Generando..." : "Descargar plantilla"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractTemplateWizard;
