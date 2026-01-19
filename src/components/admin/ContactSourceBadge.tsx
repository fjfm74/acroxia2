import { User, Mail, Building2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type ContactSource = "cliente" | "newsletter" | "b2b" | "lead";

interface ContactSourceBadgeProps {
  source: ContactSource;
  showLabel?: boolean;
  size?: "sm" | "md";
}

const sourceConfig: Record<ContactSource, { icon: typeof User; label: string; bgColor: string; textColor: string; iconColor: string }> = {
  cliente: {
    icon: User,
    label: "Cliente",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    iconColor: "text-blue-600",
  },
  newsletter: {
    icon: Mail,
    label: "Newsletter",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    iconColor: "text-green-600",
  },
  b2b: {
    icon: Building2,
    label: "B2B",
    bgColor: "bg-orange-100",
    textColor: "text-orange-800",
    iconColor: "text-orange-600",
  },
  lead: {
    icon: Sparkles,
    label: "Lead",
    bgColor: "bg-purple-100",
    textColor: "text-purple-800",
    iconColor: "text-purple-600",
  },
};

export const ContactSourceBadge = ({ source, showLabel = true, size = "sm" }: ContactSourceBadgeProps) => {
  const config = sourceConfig[source];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        config.bgColor,
        config.textColor,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      <Icon className={cn(config.iconColor, size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
      {showLabel && config.label}
    </span>
  );
};

export const ContactSourceIcon = ({ source, className }: { source: ContactSource; className?: string }) => {
  const config = sourceConfig[source];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full p-1",
        config.bgColor,
        className
      )}
      title={config.label}
    >
      <Icon className={cn("h-3 w-3", config.iconColor)} />
    </span>
  );
};

export default ContactSourceBadge;
