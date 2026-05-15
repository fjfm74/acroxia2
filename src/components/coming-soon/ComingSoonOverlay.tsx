import { ReactNode, useState } from "react";
import { AudienceFlag, isAudienceEnabled } from "@/lib/features";
import ComingSoonModal from "./ComingSoonModal";

interface Props {
  audience: AudienceFlag;
  children: ReactNode;
}

const ComingSoonOverlay = ({ audience, children }: Props) => {
  const [open, setOpen] = useState(false);
  const enabled = isAudienceEnabled(audience);

  if (enabled) return <>{children}</>;

  return (
    <>
      {children}
      <ComingSoonModal
        audience={audience}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
};

export default ComingSoonOverlay;
