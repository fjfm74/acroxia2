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
