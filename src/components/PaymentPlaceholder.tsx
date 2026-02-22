import WaitlistModal from "@/components/WaitlistModal";

interface PaymentPlaceholderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string;
}

const PaymentPlaceholder = ({ open, onOpenChange, analysisId }: PaymentPlaceholderProps) => {
  return (
    <WaitlistModal
      open={open}
      onOpenChange={onOpenChange}
      planName="Informe completo"
      source="payment_waitlist"
      analysisId={analysisId}
    />
  );
};

export default PaymentPlaceholder;
