
## Plan: Persistencia del Chat + Detección Inteligente de Perfil + Correcciones GSC

### Resumen de Problemas Detectados

| Problema | Causa Raíz | Impacto |
|----------|------------|---------|
| Chat se pierde al navegar | Componente se desmonta/remonta en cada ruta | UX pobre, conversaciones perdidas |
| Detección de perfil poco sutil | Solo quick replies sin preguntas inteligentes | Bot no sabe si es inquilino/propietario |
| Info propietarios faltante | `site_config` solo tiene info de inquilinos | Bot da info incorrecta a propietarios |
| Schemas incompletos (GSC) | Faltan campos requeridos en Product/Offer | Google no muestra rich snippets |
| Errores 4xx en crawling | Google intenta rastrear rutas SPA sin contenido | Páginas no indexadas |

---

### Parte 1: Persistencia del Chat entre Navegaciones

**Problema**: `ChatContainer` usa `useLocation()` que causa remount del componente cuando cambia la ruta.

**Solución**: Almacenar estado en `sessionStorage` y restaurarlo al abrir el chat.

**Archivos a modificar**:
- `src/components/chat/ChatAssistant.tsx`

**Cambios técnicos**:
1. Guardar `messages` y `isOpen` en `sessionStorage` cada vez que cambien
2. Restaurar estado desde `sessionStorage` al montar el componente
3. Mantener la conversación mientras dure la sesión del navegador
4. Solo limpiar al cerrar manualmente el chat con un botón explícito "Nueva conversación"

```typescript
// Constantes de storage
const STORAGE_KEY_MESSAGES = "acroxia_chat_messages";
const STORAGE_KEY_IS_OPEN = "acroxia_chat_is_open";

// En useEffect inicial, restaurar estado
useEffect(() => {
  const savedMessages = sessionStorage.getItem(STORAGE_KEY_MESSAGES);
  const savedIsOpen = sessionStorage.getItem(STORAGE_KEY_IS_OPEN);
  if (savedMessages) {
    setMessages(JSON.parse(savedMessages));
  }
  if (savedIsOpen === "true") {
    setIsOpen(true);
  }
}, []);

// Guardar al cambiar
useEffect(() => {
  sessionStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
}, [messages]);

useEffect(() => {
  sessionStorage.setItem(STORAGE_KEY_IS_OPEN, isOpen ? "true" : "false");
}, [isOpen]);
```

---

### Parte 2: Detección Sutil de Perfil de Usuario

**Problema**: El asistente actual no detecta si es inquilino o propietario de forma sutil.

**Solución**: Mejorar la lógica de detección y añadir "propietario" como perfil.

**Archivos a modificar**:
- `supabase/functions/chat-assistant/index.ts`

**Cambios técnicos**:

1. **Ampliar la detección de perfil** para incluir "propietario":

```typescript
function detectUserProfile(messages: Message[]): "inquilino" | "propietario" | "profesional" | "unknown" {
  const allText = messages.map(m => m.content.toLowerCase()).join(" ");
  
  const profesionalKeywords = [
    "inmobiliaria", "gestoría", "gestoria", "administrador", "api", "integración",
    "volumen", "empresa", "profesional", "múltiples", "clientes", "agencia", "despacho"
  ];
  
  const propietarioKeywords = [
    "soy propietario", "mi inquilino", "arrendador", "tengo una vivienda",
    "quiero alquilar", "generar contrato", "mi piso en alquiler", "casero",
    "zona tensionada", "impago", "desahucio", "no me paga"
  ];
  
  const inquilinoKeywords = [
    "soy inquilino", "mi contrato", "mi piso", "mi casero", "fianza",
    "arrendador me", "renovar", "firmé", "me quieren subir", "cláusula abusiva"
  ];
  
  const profesionalScore = profesionalKeywords.filter(k => allText.includes(k)).length;
  const propietarioScore = propietarioKeywords.filter(k => allText.includes(k)).length;
  const inquilinoScore = inquilinoKeywords.filter(k => allText.includes(k)).length;
  
  // Prioridad: profesional > propietario > inquilino
  if (profesionalScore > propietarioScore && profesionalScore > inquilinoScore && profesionalScore >= 2) {
    return "profesional";
  }
  if (propietarioScore > inquilinoScore && propietarioScore >= 1) {
    return "propietario";
  }
  if (inquilinoScore >= 1) {
    return "inquilino";
  }
  return "unknown";
}
```

2. **Añadir instrucciones para preguntar sutilmente**:

En el prompt del sistema, añadir:

```
DETECCIÓN DE PERFIL:
Si tras 2-3 mensajes no tienes claro si el usuario es inquilino, propietario o profesional,
haz una pregunta natural para averiguarlo. Por ejemplo:
- "Por cierto, ¿estás buscando revisar un contrato como inquilino o como propietario?"
- "¿Es un contrato que vas a firmar tú o uno que quieres ofrecer a un inquilino?"
NO preguntes directamente "¿eres inquilino o propietario?" - intégralo de forma natural en la conversación.
```

3. **Añadir perfilNote para propietarios**:

```typescript
const profileNote = userProfile === "profesional"
  ? "NOTA: Este usuario parece ser un PROFESIONAL (inmobiliaria, gestoría, etc). Enfócate en los planes B2B."
  : userProfile === "propietario"
  ? "NOTA: Este usuario parece ser un PROPIETARIO particular. Enfócate en los planes para propietarios (49€, 99€/año, 149€/año) y la página /propietarios."
  : userProfile === "inquilino"
  ? "NOTA: Este usuario parece ser un INQUILINO particular. Enfócate en los planes B2C y el análisis individual (39€)."
  : "NOTA: No tenemos claro el perfil del usuario. Trata de averiguarlo sutilmente.";
```

---

### Parte 3: Actualizar site_config con Información de Propietarios

**Problema**: `site_config` no tiene info de propietarios.

**Acción**: Actualizar las siguientes claves en la BD:

1. **`b2c_plans`**: Añadir planes de propietarios (Propietario Único 49€, Múltiple 99€/año, Cartera Premium 149€/año)
2. **`platform_info`**: Añadir página /propietarios y SEO pages de propietarios
3. **`faq_summary`**: Añadir FAQs para propietarios
4. **`assistant_config`**: Añadir quick reply "🏠 Soy propietario"

---

### Parte 4: Corregir Schemas de Productos (GSC)

**Errores reportados**:

| Schema | Campo Faltante | Tipo |
|--------|---------------|------|
| Product (offers) | priceValidUntil | Recomendado |
| Product (offers) | availability | Recomendado |
| Product (offers) | review | Recomendado |
| Product | aggregateRating | Recomendado |
| LocalBusiness | image | CRÍTICO |
| LocalBusiness (offers) | hasMerchantReturnPolicy | Recomendado |
| LocalBusiness (offers) | shippingDetails | Recomendado |

**Archivos a modificar**:
- `src/pages/Pricing.tsx` - Schema Product
- `src/pages/Index.tsx` - Schema Organization/SoftwareApplication
- `src/pages/Propietarios.tsx` - Schema Service

**Cambios en Pricing.tsx**:

```typescript
const pricingSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "ACROXIA - Análisis de Contratos de Alquiler",
  "description": "Servicio de análisis de contratos de alquiler con IA...",
  "image": "https://acroxia.com/og-image.jpg",
  "brand": {
    "@type": "Brand",
    "name": "ACROXIA"
  },
  "offers": [
    {
      "@type": "Offer",
      "name": "Análisis Único",
      "price": "39",
      "priceCurrency": "EUR",
      "priceValidUntil": "2026-12-31",
      "availability": "https://schema.org/InStock",
      "url": "https://acroxia.com/precios"
    },
    // ... más offers
  ]
};
```

**Cambios en Index.tsx** (Organization):

```typescript
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "ACROXIA",
  "url": "https://acroxia.com",
  "logo": "https://acroxia.com/acroxia-logo.png",
  "image": "https://acroxia.com/og-image.jpg",  // AÑADIR
  // ... resto
};
```

**Nota sobre campos de comerciante**: `hasMerchantReturnPolicy` y `shippingDetails` son para productos físicos. ACROXIA es un servicio digital, por lo que estos campos no aplican. Podemos ignorar estas advertencias o cambiar el schema a `Service` en lugar de `Product`.

---

### Parte 5: Investigar Errores 4xx en GSC

**URLs afectadas**:
- /propietarios
- /analizar-gratis
- /blog
- /precios

**Posibles causas**:
1. Googlebot rastreó antes de que existieran las rutas
2. SPA no pre-renderiza contenido para bots

**Acción**: Las rutas existen y funcionan. Google debe re-rastrear. No hay error real en el código.

**Recomendación**: Solicitar re-indexación manual en GSC para estas 4 URLs.

---

### Resumen de Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/chat/ChatAssistant.tsx` | Persistencia en sessionStorage |
| `supabase/functions/chat-assistant/index.ts` | Detección de propietario + pregunta sutil |
| `src/pages/Pricing.tsx` | Añadir campos schema (priceValidUntil, availability, image) |
| `src/pages/Index.tsx` | Añadir campo image a Organization |
| `src/pages/Propietarios.tsx` | Añadir campos schema a Service/Offers |

**Migración SQL** (actualizar site_config):
- Añadir planes propietarios a b2c_plans
- Añadir página propietarios a platform_info
- Añadir quick reply propietarios a assistant_config

---

### Orden de Implementación

1. **Persistencia del chat** (ChatAssistant.tsx)
2. **Detección de perfil mejorada** (chat-assistant/index.ts)
3. **Actualizar site_config** (migración SQL)
4. **Corregir schemas SEO** (Pricing.tsx, Index.tsx, Propietarios.tsx)
5. **Desplegar edge function** (chat-assistant)

---

### Resultado Esperado

| Funcionalidad | Antes | Después |
|---------------|-------|---------|
| Chat entre páginas | Se pierde | Persiste en sessionStorage |
| Detección de perfil | Solo inquilino/profesional | Inquilino/propietario/profesional |
| Pregunta de perfil | No pregunta | Pregunta sutilmente si no lo sabe |
| Info propietarios | No disponible | Completa en site_config |
| Schemas GSC | Advertencias | Campos completos |
