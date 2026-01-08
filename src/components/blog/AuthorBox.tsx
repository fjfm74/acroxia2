import { Linkedin, Twitter } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import FadeIn from "@/components/animations/FadeIn";

interface Author {
  id: string;
  name: string;
  slug: string;
  role: string;
  bio: string;
  avatar_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  credentials: string[] | null;
}

interface AuthorBoxProps {
  author: Author;
}

const AuthorBox = ({ author }: AuthorBoxProps) => {
  const initials = author.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <FadeIn delay={0.45}>
      <div className="bg-muted rounded-2xl p-8 mt-12">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <Avatar className="w-20 h-20 flex-shrink-0 ring-4 ring-background shadow-lg">
            <AvatarImage src={author.avatar_url || undefined} alt={author.name} />
            <AvatarFallback className="text-xl font-serif font-semibold bg-foreground text-background">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Author Info */}
          <div className="flex-1">
            <div className="mb-3">
              <h4 className="font-serif text-xl font-semibold text-foreground">
                {author.name}
              </h4>
              <p className="text-sm text-muted-foreground">
                {author.role}
              </p>
            </div>

            {/* Credentials */}
            {author.credentials && author.credentials.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {author.credentials.map((credential, index) => (
                  <span
                    key={index}
                    className="text-xs bg-background text-foreground px-3 py-1 rounded-full"
                  >
                    {credential}
                  </span>
                ))}
              </div>
            )}

            {/* Bio */}
            <p className="text-muted-foreground leading-relaxed mb-4">
              {author.bio}
            </p>

            {/* Social Links */}
            {(author.linkedin_url || author.twitter_url) && (
              <div className="flex gap-3">
                {author.linkedin_url && (
                  <a
                    href={author.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-background rounded-full text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`LinkedIn de ${author.name}`}
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {author.twitter_url && (
                  <a
                    href={author.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-background rounded-full text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`Twitter de ${author.name}`}
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </FadeIn>
  );
};

export default AuthorBox;
