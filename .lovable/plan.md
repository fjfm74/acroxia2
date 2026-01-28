

## Plan: Enviar Notificaciones de Newsletter al Publicar Posts Manualmente

### Problema identificado

Las notificaciones de newsletter **solo se envían cuando un post pasa por el flujo de aprobación** (`approve-post`). Cuando se publica directamente desde el panel de administración, no se notifica a los suscriptores.

---

### Flujo actual

```text
┌─────────────────────────────────────────────────────────────┐
│ POSTS AUTOMÁTICOS (cron)                                    │
├─────────────────────────────────────────────────────────────┤
│ generate-blog-post → scheduled_posts (borrador)             │
│        ↓                                                    │
│ Admin aprueba via approve-post                              │
│        ↓                                                    │
│ approve-post → publica + send-blog-notification ✅          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ POSTS MANUALES (AdminBlogNew)                               │
├─────────────────────────────────────────────────────────────┤
│ Admin crea post → click "Publicar"                          │
│        ↓                                                    │
│ INSERT directo a blog_posts con status='published'          │
│        ↓                                                    │
│ Trigger regenera sitemap y LLM                              │
│        ↓                                                    │
│ ❌ NO se llama a send-blog-notification                     │
└─────────────────────────────────────────────────────────────┘
```

---

### Solución propuesta

Añadir la llamada a `send-blog-notification` en el frontend después de publicar exitosamente un post manual.

---

### Archivo a modificar

#### `src/pages/admin/AdminBlogNew.tsx`

En la función `savePost`, después de insertar el post con `status: 'published'`, llamar a la Edge Function `send-blog-notification`:

```typescript
const savePost = async (publish: boolean) => {
  // ... validaciones existentes ...
  
  try {
    const { data, error } = await supabase.from("blog_posts").insert({
      // ... campos existentes ...
      status: publish ? "published" : "draft",
    }).select("id").single();  // ← Obtener el ID del post insertado

    if (error) throw error;

    // NUEVO: Si se publica, enviar notificaciones a suscriptores
    if (publish && data?.id) {
      try {
        await supabase.functions.invoke("send-blog-notification", {
          body: { postId: data.id }
        });
        console.log("Newsletter notifications triggered for post:", data.id);
      } catch (notifyError) {
        // No bloquear la publicación si falla la notificación
        console.error("Error sending newsletter notifications:", notifyError);
      }
    }

    toast({
      title: publish ? "Post publicado" : "Borrador guardado",
      description: publish 
        ? "El post ya está visible en el blog y se ha notificado a los suscriptores" 
        : "Puedes continuar editándolo más tarde",
    });

    navigate("/admin/blog");
  } catch (error) {
    // ... manejo de error existente ...
  }
};
```

---

### También verificar: AdminBlogEdit.tsx

Revisar si existe una página de edición de posts y si permite cambiar el estado de borrador a publicado. Si es así, añadir la misma lógica allí.

---

### Resultado esperado

| Acción | Antes | Después |
|--------|-------|---------|
| Publicar post manual para **inquilinos** | No notifica | Notifica a suscriptores de inquilinos ✅ |
| Publicar post manual para **propietarios** | No notifica | Notifica a suscriptores de propietarios ✅ |
| Publicar vía flujo de aprobación | Notifica ✅ | Sin cambios ✅ |

---

### Beneficios de esta solución

1. **No modifica la base de datos**: Solo cambios en frontend
2. **Mantiene consistencia**: Misma lógica que approve-post
3. **No bloquea la publicación**: Si falla la notificación, el post se publica igual
4. **Respeta la audiencia**: Los emails solo van a suscriptores de la audiencia del post

