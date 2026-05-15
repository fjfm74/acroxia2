/**
 * Feature flags temporales para lanzamiento escalonado.
 * Cambiar a true cuando cada audiencia esté lista.
 * Tras flipear: enviar email a waitlist_audiences correspondiente.
 */
export const FEATURES = {
  PROPIETARIO_ENABLED: false,
  PROFESIONAL_INMOBILIARIAS_ENABLED: false,
  PROFESIONAL_GESTORIAS_ENABLED: false,
} as const;

export type AudienceFlag =
  | "propietario"
  | "profesional_inmobiliarias"
  | "profesional_gestorias";

export function isAudienceEnabled(audience: AudienceFlag): boolean {
  switch (audience) {
    case "propietario":
      return FEATURES.PROPIETARIO_ENABLED;
    case "profesional_inmobiliarias":
      return FEATURES.PROFESIONAL_INMOBILIARIAS_ENABLED;
    case "profesional_gestorias":
      return FEATURES.PROFESIONAL_GESTORIAS_ENABLED;
  }
}

export function getAudienceLabel(audience: AudienceFlag): string {
  switch (audience) {
    case "propietario":
      return "propietarios";
    case "profesional_inmobiliarias":
      return "inmobiliarias";
    case "profesional_gestorias":
      return "gestorías";
  }
}
