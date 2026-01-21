import { ReactNode } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import FadeIn from "@/components/animations/FadeIn";

interface ProLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const ProLayout = ({ children, title, subtitle }: ProLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-muted">
      <Header />
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-6">
          {(title || subtitle) && (
            <FadeIn>
              <div className="mb-8">
                {title && (
                  <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className="text-muted-foreground mt-2">{subtitle}</p>
                )}
              </div>
            </FadeIn>
          )}
          {children}
        </div>
      </main>
      <Footer hideSubscription />
    </div>
  );
};

export default ProLayout;
