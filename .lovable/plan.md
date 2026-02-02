

## Plan: Publicación Automática de Posts del Blog

### Resumen del Cambio

Modificar las funciones de generación diaria de blog para que publiquen automáticamente los posts sin necesidad de aprobación manual, enviando un email de confirmación con el enlace al post publicado.

---

### Flujo Actual vs Nuevo Flujo

| Paso | Flujo Actual | Nuevo Flujo |
|------|--------------|-------------|
| 1 | Generar contenido con IA | Generar contenido con IA |
| 2 | Guardar como `draft` | Guardar como `published` |
| 3 | Crear registro `scheduled_posts` | (Opcional: mantener para registro) |
| 4 | Enviar email de aprobación | Enviar email de **confirmación** |
| 5 | Esperar clic del usuario | Enviar newsletter automáticamente |
| 6 | Tras aprobación: publicar + newsletter | - |

---

### Archivos a Modificar

#### 1. `supabase/functions/schedule-daily-post/index.ts` (Inquilinos)

**Cambios:**
- Cambiar `status: "draft"` → `status: "published"`
- Añadir `published_at: new Date().toISOString()`
- Reemplazar función `sendApprovalEmail` por `sendConfirmationEmail`
- Llamar a `send-blog-notification` automáticamente tras publicar
- Actualizar `scheduled_posts` con status `auto_published` en lugar de `pending_approval`

#### 2. `supabase/functions/schedule-daily-post-landlord/index.ts` (Propietarios)

**Cambios idénticos:**
- Publicar directamente
- Email de confirmación
- Newsletter automático

---

### Nuevo Email de Confirmación

El email cambiará de "aprobar/rechazar" a "confirmación de publicación":

**Antes (Aprobación):**
- Asunto: "📝 Nuevo post para aprobar: {título}"
- Botones: "Aprobar y Publicar" + "Editar Borrador"
- Mensaje: "Este post está guardado como borrador"

**Después (Confirmación):**
- Asunto: "✅ Post publicado: {título}"
- Botón: "Ver post publicado"
- Enlace secundario: "Editar en el panel de admin"
- Mensaje: "Este post ya está publicado y visible en el blog"

---

### Estructura del Email de Confirmación

```text
┌─────────────────────────────────────────┐
│             ACROXIA                      │
│   ✅ Post publicado automáticamente     │
├─────────────────────────────────────────┤
│                                         │
│  [Imagen destacada]                     │
│                                         │
│  Categoría: Legislación                 │
│  Título del post publicado              │
│  Extracto del contenido...              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     Ver post publicado          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Newsletter enviado a X suscriptores    │
│                                         │
│  [Editar en admin] (enlace secundario)  │
│                                         │
├─────────────────────────────────────────┤
│  Si encuentras algún error, puedes      │
│  editarlo desde el panel de admin.      │
└─────────────────────────────────────────┘
```

---

### Secuencia de Operaciones

```text
1. Generar contenido con IA
        ↓
2. Generar imagen con IA
        ↓
3. Insertar en blog_posts con:
   - status: "published"
   - published_at: now()
        ↓
4. Crear scheduled_posts con:
   - status: "auto_published"
   - approved_at: now()
        ↓
5. Llamar send-blog-notification
   → Envía newsletter a suscriptores
        ↓
6. Enviar email de confirmación
   → Incluye enlace al post
   → Incluye número de suscriptores notificados
```

---

### Consideraciones Técnicas

#### Tabla `scheduled_posts`
- Mantenemos el registro para auditoría
- Nuevo estado: `auto_published` (diferenciarlo de aprobación manual)
- Registro de cuántos newsletters se enviaron

#### Email de Confirmación
- Incluir enlace directo al post: `https://acroxia.com/blog/{slug}`
- Incluir estadísticas: "Newsletter enviado a X suscriptores"
- Mantener opción de editar si hay errores

#### Rollback (si lo necesitas)
- Si en el futuro quieres volver a aprobación manual, bastará con cambiar `status: "published"` → `status: "draft"` y restaurar la lógica de aprobación

---

### Cambios en Funciones

| Función | Modificación |
|---------|--------------|
| `schedule-daily-post/index.ts` | Publicar + confirmar + newsletter |
| `schedule-daily-post-landlord/index.ts` | Publicar + confirmar + newsletter |
| `approve-post/index.ts` | Sin cambios (para posts manuales) |
| `send-blog-notification/index.ts` | Sin cambios |

---

### Resultado Esperado

- Los posts se publican automáticamente a las 09:00 (inquilinos) y 10:00 (propietarios)
- Recibirás un email con el enlace al post ya publicado
- La newsletter se envía automáticamente a los suscriptores correspondientes
- Puedes revisar y editar el post a posteriori si es necesario

