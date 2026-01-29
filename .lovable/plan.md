

## Plan: Arreglar Auto-Scroll y Mejorar Inteligencia del Asistente

### Problema 1: Auto-Scroll no Funciona

**Causa raíz**: El componente `ScrollArea` de Radix UI tiene una estructura anidada:

```text
┌─────────────────────────────────────────┐
│ ScrollAreaPrimitive.Root ← ref actual   │
│   ┌─────────────────────────────────┐   │
│   │ Viewport ← donde está el scroll │   │
│   │   [contenido]                   │   │
│   └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

El `scrollRef.current.scrollTop` no funciona porque `scrollRef` apunta al `Root`, no al `Viewport` interno que es el elemento scrolleable.

**Solución**: Usar `scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]')` para acceder al viewport real, o cambiar a un div nativo con `overflow-y-auto`.

---

### Problema 2: Asistente "Stackeholdeado"

**Estado actual**:
- Modelo: `google/gemini-3-flash-preview` (correcto, es el más reciente)
- `max_tokens: 500` (limitado)
- `temperature: 0.7` (bastante conservador)
- Prompt largo pero muy estructurado con reglas rígidas

**Mejoras propuestas**:
1. Aumentar `max_tokens` a 800 para respuestas más completas
2. Subir `temperature` a 0.8 para respuestas más naturales
3. Reformular el prompt para ser menos "robótico" y más conversacional
4. Añadir instrucciones para que sea empático y fluido

---

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/chat/ChatAssistant.tsx` | Arreglar auto-scroll accediendo al viewport real |
| `supabase/functions/chat-assistant/index.ts` | Mejorar prompt y parámetros del modelo |

---

### Cambios Técnicos Detallados

#### 1. ChatAssistant.tsx - Arreglar Auto-Scroll

Modificar el efecto de scroll (líneas 79-84):

```typescript
// ANTES - No funciona
useEffect(() => {
  if (scrollRef.current) {
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }
}, [messages, showQuickReplies]);

// DESPUÉS - Accede al viewport real
useEffect(() => {
  if (scrollRef.current) {
    const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }
}, [messages, showQuickReplies]);
```

Además, añadir scroll durante el streaming para que se vea el texto mientras se escribe:

```typescript
// En streamChat, después de actualizar el mensaje
if (content) {
  assistantSoFar += content;
  setMessages((prev) => {
    // ... actualización existente ...
  });
  // Scroll mientras se escribe
  requestAnimationFrame(() => {
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  });
}
```

#### 2. chat-assistant/index.ts - Mejorar IA

**Cambios en parámetros** (líneas 390-399):

```typescript
// ANTES
max_tokens: 500,
temperature: 0.7,

// DESPUÉS
max_tokens: 800,
temperature: 0.85,
```

**Mejorar las reglas del prompt** (líneas 300-314):

```typescript
// ANTES
REGLAS DE RESPUESTA (OBLIGATORIAS)
1. Respuestas CORTAS: 2-4 frases máximo. Sé directo.
...

// DESPUÉS - Más natural y empático
ESTILO DE COMUNICACIÓN
- Sé cercano y natural, como un compañero de trabajo que ayuda.
- Usa un tono cálido pero profesional.
- Puedes hacer preguntas de seguimiento si ayudan a entender mejor qué necesita el usuario.
- Adapta la longitud de la respuesta a la complejidad de la pregunta: breve para consultas simples, más detallada si el usuario necesita orientación.
- Usa emojis con moderación (máximo 1-2 por respuesta) para dar calidez.
- Si el usuario parece frustrado o confundido, muestra empatía antes de dar la información.
- Cuando des precios, usa formato claro: "El análisis completo cuesta **39€** (pago único)".
- Evita sonar robótico o repetitivo. Varía tus respuestas.
```

---

### Resultado Esperado

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Auto-scroll** | No funciona, hay que scrollear manualmente | Se mueve automáticamente al escribir mensajes |
| **Scroll durante streaming** | No se ve el texto mientras se genera | Se ve el texto en tiempo real mientras aparece |
| **Tono del asistente** | Rígido, formulaico | Natural, empático, conversacional |
| **Longitud de respuestas** | Siempre 2-4 frases | Adapta según complejidad |

---

### Notas Adicionales

- El modelo `google/gemini-3-flash-preview` ya es el más avanzado disponible en Lovable AI
- Aumentar `temperature` hará las respuestas menos predecibles pero más naturales
- El auto-scroll se ejecutará tanto al añadir mensajes como durante el streaming

