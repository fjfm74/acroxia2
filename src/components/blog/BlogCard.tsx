import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import FadeIn from "@/components/animations/FadeIn";

interface BlogCardProps {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  image: string;
  featured?: boolean;
  index?: number;
}

const BlogCard = ({ slug, title, excerpt, category, readTime, date, image, featured = false, index = 0 }: BlogCardProps) => {
  if (featured) {
    return (
      <FadeIn>
        <Link 
          to={`/blog/${slug}`} 
          className="group block bg-background border border-border rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300"
        >
          <div className="aspect-[16/9] relative overflow-hidden">
            <img 
              src={image} 
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <span className="inline-block bg-background text-foreground text-xs font-medium px-3 py-1.5 rounded-full">
                {category}
              </span>
            </div>
          </div>
          <div className="p-8">
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span>{date}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {readTime}
              </span>
            </div>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors">
              {title}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {excerpt}
            </p>
            <span className="inline-flex items-center gap-2 text-foreground font-medium group-hover:gap-3 transition-all">
              Leer artículo
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </Link>
      </FadeIn>
    );
  }

  return (
    <FadeIn delay={index * 0.1}>
      <Link 
        to={`/blog/${slug}`} 
        className="group block bg-background border border-border rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300"
      >
        <div className="aspect-[16/10] relative overflow-hidden">
          <img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/40 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <span className="inline-block bg-background text-foreground text-xs font-medium px-3 py-1 rounded-full">
              {category}
            </span>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
            <span>{date}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {readTime}
            </span>
          </div>
          <h3 className="font-serif text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
            {excerpt}
          </p>
        </div>
      </Link>
    </FadeIn>
  );
};

export default BlogCard;
