import { z } from "zod";

export const emailSchema = z
  .string()
  .min(1, "El email es obligatorio")
  .email("Introduce un email válido")
  .max(255, "El email es demasiado largo")
  .transform((email) => email.toLowerCase().trim());

export const passwordSchema = z
  .string()
  .min(6, "La contraseña debe tener al menos 6 caracteres")
  .max(100, "La contraseña es demasiado larga");

export const fullNameSchema = z
  .string()
  .min(2, "El nombre debe tener al menos 2 caracteres")
  .max(100, "El nombre es demasiado largo")
  .transform((name) => name.trim());

export const phoneSchema = z
  .string()
  .regex(
    /^(\+?\d{1,3})?[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}$/,
    "Introduce un teléfono válido"
  )
  .optional()
  .or(z.literal(""))
  .transform((phone) => phone?.trim() || "");

export const userTypeSchema = z.enum(["inquilino", "propietario", "profesional"], {
  required_error: "Selecciona tu perfil",
});
