import { Link } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumbs = ({ items, className = "" }: BreadcrumbsProps) => {
  // Schema markup for breadcrumbs
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": "https://acroxia.com/"
      },
      ...items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 2,
        "name": item.label,
        ...(item.href && { "item": `https://acroxia.com${item.href}` })
      }))
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <nav 
        aria-label="Breadcrumb" 
        className={`bg-muted pt-24 pb-6 ${className}`}
      >
        <div className="container mx-auto px-6">
          <ol className="flex items-center gap-2 text-sm text-muted-foreground/70 flex-wrap">
            <li>
              <Link 
                to="/" 
                className="hover:text-foreground transition-colors"
              >
                Inicio
              </Link>
            </li>
            <li aria-hidden="true" className="text-muted-foreground/40">
              /
            </li>
            {items.map((item, index) => (
              <li key={index} className="flex items-center gap-2">
                {item.href ? (
                  <>
                    <Link 
                      to={item.href} 
                      className="hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                    <span aria-hidden="true" className="text-muted-foreground/40">/</span>
                  </>
                ) : (
                  <span className="text-foreground">{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>
    </>
  );
};

export default Breadcrumbs;
