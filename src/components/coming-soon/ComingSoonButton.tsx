import { ReactNode, useState } from "react";
import { Link } from "react-router-dom";
import { Button, ButtonProps } from "@/components/ui/button";
import { AudienceFlag, isAudienceEnabled } from "@/lib/features";
import ComingSoonModal from "./ComingSoonModal";
import { cn } from "@/lib/utils";

interface Props extends Omit<ButtonProps, "children"> {
  audience: AudienceFlag;
  children: ReactNode;
  /** Si la audiencia está activa, navega aquí (Link asChild). */
  originalHref?: string;
  /** Si la audiencia está activa, ejecuta esto en onClick. */
  originalOnClick?: () => void;
  /** Texto a mostrar cuando audiencia disabled (override). */
  comingSoonLabel?: string;
  showBadge?: boolean;
}

const ComingSoonButton = ({
  audience,
  children,
  originalHref,
  originalOnClick,
  comingSoonLabel = "Avísame cuando esté disponible",
  showBadge = true,
  className,
  ...buttonProps
}: Props) => {
  const [open, setOpen] = useState(false);
  const enabled = isAudienceEnabled(audience);

  if (enabled) {
    if (originalHref) {
      return (
        <Button asChild className={className} {...buttonProps}>
          <Link to={originalHref}>{children}</Link>
        </Button>
      );
    }
    return (
      <Button
        onClick={originalOnClick}
        className={className}
        {...buttonProps}
      >
        {children}
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("relative", className)}
        {...buttonProps}
      >
        <span>{comingSoonLabel}</span>
        {showBadge && (
          <span className="ml-2 inline-flex items-center bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-medium rounded-full">
            Próximamente
          </span>
        )}
      </Button>
      <ComingSoonModal
        audience={audience}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
};

export default ComingSoonButton;
