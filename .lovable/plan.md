

## Plan: Alertar siempre sobre requisitos documentales obligatorios

### Problema
El prompt del motor de analisis ya menciona la cedula de habitabilidad y el certificado energetico en la seccion 13, pero no tiene una instruccion explicita que obligue a la IA a generar una clausula/alerta cuando estos documentos **no se mencionan** en el contrato. La IA lo trata como informacion de contexto, no como un check obligatorio.

### Solucion
Modificar el prompt del sistema en `supabase/functions/analyze-contract/index.ts` para incluir una regla de oro adicional que fuerce a la IA a verificar siempre la presencia de estos requisitos documentales y generar alertas si faltan.

### Cambios

**Archivo:** `supabase/functions/analyze-contract/index.ts`

1. **Agregar regla 10 en "REGLAS DE ORO"** (tras la linea 545):
   - Nueva regla que instruya a la IA a verificar SIEMPRE si el contrato menciona la cedula de habitabilidad y el certificado energetico.
   - Si el contrato NO los menciona, debe generar una clausula de tipo `suspicious` o `illegal` con categoria "ESTADO DE LA VIVIENDA E INVENTARIO", explicando que son requisitos legales obligatorios y que su ausencia es un riesgo.
   - Referencia legal: Art. 25.2 LAU y normativa autonomica aplicable para la cedula; RD 235/2013 para el certificado energetico.

2. **Reforzar la seccion 13 del prompt** (lineas 460-464):
   - Hacer mas explicita la obligatoriedad, indicando que la ausencia de mencion a estos documentos debe generar alerta automatica.

### Detalle tecnico del texto a insertar

En las REGLAS DE ORO (linea 544-545), se anadira:

```
10. VERIFICACION OBLIGATORIA DE REQUISITOS DOCUMENTALES: Comprueba SIEMPRE si el contrato 
    menciona la cedula de habitabilidad (o licencia de primera/segunda ocupacion segun CCAA) 
    y el certificado de eficiencia energetica. Si NO aparecen mencionados en el contrato, 
    DEBES generar una clausula con category "ESTADO DE LA VIVIENDA E INVENTARIO", 
    type "suspicious", risk_level 7, explicando que son documentos legalmente obligatorios 
    que el arrendador debe entregar antes de la firma. Referencias: Art. 25.2 LAU (cedula), 
    RD 235/2013 (certificado energetico).
```

### Impacto
- Todos los analisis (inquilino, propietario y publico) usaran esta regla, ya que comparten el mismo prompt base.
- No requiere cambios en frontend ni en base de datos.
