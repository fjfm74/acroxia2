import SEOHead from "@/components/seo/SEOHead";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";

interface LegalPageLayoutProps {
  title: string;
  metaDescription: string;
  lastUpdated: string;
  children: React.ReactNode;
  allowIndex?: boolean;
}

const LegalPageLayout = ({ title, metaDescription, lastUpdated, children, allowIndex = false }: LegalPageLayoutProps) => {
  return (
    <>
      <SEOHead
        title={`${title} | ACROXIA`}
        description={metaDescription}
        canonical={`https://acroxia.com/${title.toLowerCase().replace(/\s+/g, '-')}`}
        noindex={!allowIndex}
      />
      
      <Header />
      
      <main className="min-h-screen bg-background pt-28 pb-20">
        <div className="container mx-auto px-6">
          <FadeIn>
            <div className="max-w-4xl mx-auto">
              <header className="mb-12">
                <h1 className="font-serif text-4xl md:text-5xl font-semibold text-foreground mb-4">
                  {title}
                </h1>
                <p className="text-muted-foreground text-sm">
                  Última actualización: {lastUpdated}
                </p>
              </header>
              
              <article className="text-foreground leading-relaxed">
                {children}
              </article>
            </div>
          </FadeIn>
        </div>
      </main>
      
      <Footer />
    </>
  );
};

export default LegalPageLayout;
