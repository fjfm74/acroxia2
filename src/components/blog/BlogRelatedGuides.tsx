import { Link } from "react-router-dom";
import { BookOpen } from "lucide-react";

interface GuideLink {
  href: string;
  label: string;
}

const guidesByTopic: Record<string, GuideLink[]> = {
  fianza: [
    { href: "/devolucion-fianza-alquiler", label: "Guía: Devolución de fianza de alquiler" },
    { href: "/deposito-fianza-propietarios", label: "Guía propietarios: Depósito y fianza" },
  ],
  deposito: [
    { href: "/devolucion-fianza-alquiler", label: "Guía: Devolución de fianza de alquiler" },
    { href: "/deposito-fianza-propietarios", label: "Guía propietarios: Depósito y fianza" },
  ],
  garantia: [
    { href: "/devolucion-fianza-alquiler", label: "Guía: Devolución de fianza de alquiler" },
    { href: "/deposito-fianza-propietarios", label: "Guía propietarios: Depósito y fianza" },
  ],
  subida: [
    { href: "/subida-alquiler-2026", label: "Guía: Subida de alquiler y IRAV 2026" },
  ],
  irav: [
    { href: "/subida-alquiler-2026", label: "Guía: Subida de alquiler y IRAV 2026" },
  ],
  renta: [
    { href: "/subida-alquiler-2026", label: "Guía: Subida de alquiler y IRAV 2026" },
  ],
  clausula: [
    { href: "/clausulas-abusivas-alquiler", label: "Guía: Cláusulas abusivas en contratos de alquiler" },
  ],
  abusiv: [
    { href: "/clausulas-abusivas-alquiler", label: "Guía: Cláusulas abusivas en contratos de alquiler" },
  ],
  ilegal: [
    { href: "/clausulas-abusivas-alquiler", label: "Guía: Cláusulas abusivas en contratos de alquiler" },
  ],
  impago: [
    { href: "/impago-alquiler-propietarios", label: "Guía propietarios: Impago de alquiler" },
  ],
  desahucio: [
    { href: "/impago-alquiler-propietarios", label: "Guía propietarios: Impago y desahucio" },
  ],
  contrato: [
    { href: "/contrato-alquiler-propietarios", label: "Guía propietarios: Contrato de alquiler LAU 2026" },
    { href: "/clausulas-abusivas-alquiler", label: "Guía: Cláusulas abusivas en contratos de alquiler" },
  ],
  tensionada: [
    { href: "/zonas-tensionadas-propietarios", label: "Guía propietarios: Zonas tensionadas" },
  ],
  renovaci: [
    { href: "/fin-contrato-alquiler-propietarios", label: "Guía propietarios: Fin de contrato" },
  ],
  prorroga: [
    { href: "/fin-contrato-alquiler-propietarios", label: "Guía propietarios: Fin de contrato" },
  ],
};

interface BlogRelatedGuidesProps {
  title: string;
  content: string;
  category: string;
}

const BlogRelatedGuides = ({ title, content, category }: BlogRelatedGuidesProps) => {
  const searchText = `${title} ${category} ${content.slice(0, 500)}`.toLowerCase();

  // Collect unique guides matched by keywords
  const matched = new Map<string, GuideLink>();
  for (const [keyword, guides] of Object.entries(guidesByTopic)) {
    if (searchText.includes(keyword)) {
      for (const guide of guides) {
        if (!matched.has(guide.href)) {
          matched.set(guide.href, guide);
        }
      }
    }
  }

  const guides = Array.from(matched.values()).slice(0, 3);

  if (guides.length === 0) return null;

  return (
    <aside className="mt-10 p-6 bg-muted/40 rounded-2xl border border-border">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">Guías relacionadas</p>
      </div>
      <ul className="space-y-2">
        {guides.map((guide) => (
          <li key={guide.href}>
            <Link
              to={guide.href}
              className="text-sm text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors"
            >
              {guide.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default BlogRelatedGuides;
