# Plan: Unificar configuracion de emails de aprobacion

## Objetivo

Modificar la funcion `schedule-daily-post-landlord` para que use exactamente la misma configuracion de email que `schedule-daily-post` (inquilinos).

---

## Cambios en `supabase/functions/schedule-daily-post-landlord/index.ts`

### 1. Corregir la funcion `sendApprovalEmail`

**Cambios a realizar:**

| Aspecto | Antes (propietarios) | Despues (unificado) |
|---------|---------------------|---------------------|
| Remitente | `ACROXIA Blog <blog@acroxia.es>` | `ACROXIA <noreply@acroxia.com>` |
| Destinatario | `david@acroxia.es` | `nuriafrancis@gmail.com` |
| URL de aprobacion | `/aprobar-post?token=${token}&action=approve` | `/aprobar-post/${token}` |
| Asunto | `[PROPIETARIOS] Nuevo post...` | `Nuevo post para aprobar: ${post.title}` |

### 2. Codigo a modificar

En la funcion `sendApprovalEmail` dentro de `schedule-daily-post-landlord/index.ts`:

```typescript
// ANTES:
const approveUrl = `${siteUrl}/aprobar-post?token=${token}&action=approve`;
// ...
body: JSON.stringify({
  from: "ACROXIA Blog <blog@acroxia.es>",
  to: ["david@acroxia.es"],
  subject: `[PROPIETARIOS] Nuevo post para aprobar: ${post.title}`,
  html: emailHtml,
}),

// DESPUES:
const approveUrl = `${siteUrl}/aprobar-post/${token}`;
// ...
body: JSON.stringify({
  from: "ACROXIA <noreply@acroxia.com>",
  to: ["nuriafrancis@gmail.com"],
  subject: `Nuevo post para aprobar: ${post.title}`,
  html: emailHtml,
}),
```

### 3. Actualizar el template HTML del email

Copiar el mismo template HTML usado en `schedule-daily-post` para mantener consistencia visual:

- Mismo header con logo ACROXIA
- Misma estructura de preview (imagen, categoria, titulo, excerpt)
- Mismos botones de accion (Aprobar y Publicar, Editar Borrador)
- Mismo footer informativo

---

## Resumen de cambios

| Archivo | Accion |
|---------|--------|
| `supabase/functions/schedule-daily-post-landlord/index.ts` | Actualizar `sendApprovalEmail` con la configuracion unificada |

---

## Resultado esperado

Cuando se genere automaticamente un post para propietarios:
1. Se guardara como borrador (igual que ahora)
2. Se enviara email de aprobacion a `nuriafrancis@gmail.com`
3. Desde `noreply@acroxia.com` (dominio verificado)
4. Con URL de aprobacion correcta: `/aprobar-post/{token}`
5. El flujo de aprobacion funcionara identico al de inquilinos

---

## Nota adicional

Opcionalmente, podriamos anadir un indicador `[PROPIETARIOS]` en el asunto o en el cuerpo del email para diferenciar de que audiencia es el post, sin cambiar la configuracion tecnica. Esto facilitaria identificar rapidamente el tipo de post al revisar el email.
