import { isValidElement, type ReactNode } from "react";

/** Aplana recursivamente strings, números, arrays y elementos React a texto plano
 *  (equivalente a quitar las etiquetas HTML del encabezado, como hace TableOfContents). */
export function nodeToText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(nodeToText).join("");
  if (isValidElement(node)) return nodeToText((node.props as { children?: ReactNode }).children);
  return "";
}
