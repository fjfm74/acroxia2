

## Plan: Corregir inconsistencias de perspectiva y botones

### Problemas detectados

1. **Análisis gratuito siempre asume perspectiva de inquilino**: La Edge Function `analyze-contract-public` tiene un prompt fijo que evalúa cláusulas "perjudiciales para el inquilino". Cuando un propietario usa `/analizar-gratis`, recibe un informe orientado al inquilino.

2. **Página de Propietarios lleva al flujo de inquilino**: El botón "Analizar mi contrato" en `/propietarios` redirige a `/analizar-gratis` (flujo inquilino). Debería ofrecer la perspectiva de propietario.

3. **Botones inconsistentes en páginas de profesionales**:
   - **Inmobiliarias**: Todos los botones van a `/registro`
   - **Gestorías**: Todos los botones van a `/contacto`
   - Deberían ser consistentes y llevar al checkout de Paddle (como hace `B2BPricing`).

### Solución

#### 1. Añadir selector de perspectiva en `/analizar-gratis`
- Añadir un selector "¿Quién eres?" (Inquilino / Propietario) antes de subir el archivo.
- Pasar la `perspective` al edge function `analyze-contract-public`.

#### 2. Actualizar Edge Function `analyze-contract-public`
- Aceptar parámetro `perspective` ("tenant" | "landlord").
- Adaptar el prompt del sistema: si es landlord, evaluar cumplimiento LAU desde la perspectiva del arrendador (fianzas suficientes, cláusulas protectoras, etc.).

#### 3. Adaptar `FreeResultPreview` según perspectiva
- Mostrar el precio correcto en el CTA de desbloqueo: 14,99€ para inquilinos, 29€ para propietarios.
- Usar el `priceId` correspondiente: `analisis_unico_price` vs `propietario_unico_price`.
- Ajustar la `successUrl` según perspectiva.

#### 4. Propietarios: botón "Analizar mi contrato" con perspectiva
- Cambiar el enlace en `PropietariosHero` y `PropietariosCTA` a `/analizar-gratis?perspectiva=propietario` para preseleccionar la perspectiva.

#### 5. Unificar botones de profesionales
- **Gestorías**: Cambiar todos los botones de `/contacto` a `/registro` (igual que Inmobiliarias).
- Ambas páginas llevarán al registro, que es el paso previo necesario para contratar un plan profesional con Paddle.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/AnalyzePublic.tsx` | Añadir selector de perspectiva, pasar al edge function |
| `supabase/functions/analyze-contract-public/index.ts` | Aceptar `perspective`, prompt dinámico |
| `src/pages/FreeResultPreview.tsx` | Precio y priceId dinámico según perspectiva |
| `src/components/propietarios/PropietariosHero.tsx` | URL con `?perspectiva=propietario` |
| `src/components/propietarios/PropietariosCTA.tsx` | URL con `?perspectiva=propietario` |
| `src/pages/profesionales/Gestorias.tsx` | Cambiar `/contacto` por `/registro` |

