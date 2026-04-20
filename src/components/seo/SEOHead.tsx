import { useEffect } from "react";

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

// Helper: upsert meta tag by name or property
const setMeta = (attr: "name" | "property", key: string, value: string) => {
  let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
};

const setLink = (rel: string, href: string, hreflang?: string) => {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (hreflang) el.setAttribute("hreflang", hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

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
  const robotsContent = robots ?? (noindex === true ? "noindex, follow" : "index, follow");

  useEffect(() => {
    document.documentElement.lang = "es-ES";
    document.title = title;

    setMeta("name", "description", description);
    setMeta("name", "robots", robotsContent);
    setMeta("name", "googlebot", robotsContent);
    if (keywords) setMeta("name", "keywords", keywords);

    setLink("canonical", canonical);
    setLink("alternate", canonical, "es-ES");
    setLink("alternate", canonical, "x-default");

    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:image", ogImage);
    setMeta("property", "og:image:width", "1200");
    setMeta("property", "og:image:height", "630");
    setMeta("property", "og:locale", "es_ES");
    setMeta("property", "og:site_name", "ACROXIA");

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:site", "@acroxia");
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", ogImage);

    if (articleMeta?.author) setMeta("property", "article:author", articleMeta.author);
    if (articleMeta?.datePublished) setMeta("property", "article:published_time", articleMeta.datePublished);
    if (articleMeta?.dateModified) setMeta("property", "article:modified_time", articleMeta.dateModified);
    if (articleMeta?.section) setMeta("property", "article:section", articleMeta.section);

    document.querySelectorAll('script[data-seo-ld="true"]').forEach((s) => s.remove());
    const jsonLdArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
    jsonLdArray.forEach((schema) => {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-seo-ld", "true");
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    document.querySelectorAll('meta[property="article:tag"]').forEach((m) => m.remove());
    articleMeta?.tags?.forEach((tag) => {
      const m = document.createElement("meta");
      m.setAttribute("property", "article:tag");
      m.setAttribute("content", tag);
      document.head.appendChild(m);
    });
  }, [title, description, canonical, ogImage, ogType, robotsContent, keywords, articleMeta, jsonLd]);

  return null;
};

export default SEOHead;
