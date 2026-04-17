import { Helmet } from "react-helmet-async";

interface ArticleMeta {
  author?: string;
  datePublished?: string;
  dateModified?: string;
  section?: string;
  tags?: string[];
}

interface SEOHeadProps {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  robots?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  articleMeta?: ArticleMeta;
  keywords?: string;
}

const SEOHead = ({
  title,
  description,
  canonical,
  ogImage = "https://acroxia.com/og-image.jpg",
  ogType = "website",
  noindex = false,
  robots,
  jsonLd,
  articleMeta,
  keywords,
}: SEOHeadProps) => {
  // Prioridad: prop `robots` explícita > flag `noindex` > default "index, follow"
  const robotsContent = robots ?? (noindex === true ? "noindex, follow" : "index, follow");
  const jsonLdArray = jsonLd
    ? Array.isArray(jsonLd) ? jsonLd : [jsonLd]
    : [];

  return (
    <Helmet>
      <html lang="es-ES" />
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={robotsContent} />
      <link rel="canonical" href={canonical} />
      <link rel="alternate" hrefLang="es-ES" href={canonical} />
      <link rel="alternate" hrefLang="x-default" href={canonical} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="es_ES" />
      <meta property="og:site_name" content="ACROXIA" />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@acroxia" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Article meta */}
      {articleMeta?.author && <meta property="article:author" content={articleMeta.author} />}
      {articleMeta?.datePublished && <meta property="article:published_time" content={articleMeta.datePublished} />}
      {articleMeta?.dateModified && <meta property="article:modified_time" content={articleMeta.dateModified} />}
      {articleMeta?.section && <meta property="article:section" content={articleMeta.section} />}
      {articleMeta?.tags?.map((tag, i) => (
        <meta key={i} property="article:tag" content={tag} />
      ))}

      {/* JSON-LD */}
      {jsonLdArray.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEOHead;
