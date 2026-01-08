import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ChatBubbleProps {
  isVisible: boolean;
  message: string;
  onClose: () => void;
  onClick: () => void;
}

const ChatBubble = ({ isVisible, message, onClose, onClick }: ChatBubbleProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="absolute bottom-full right-0 mb-3 mr-0"
        >
          <div className="relative bg-charcoal text-cream px-4 py-2.5 rounded-2xl rounded-br-sm shadow-lg max-w-[200px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-cream text-charcoal rounded-full flex items-center justify-center shadow-md hover:bg-muted transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
            <button
              onClick={onClick}
              className="text-sm font-medium text-left w-full"
            >
              {message}
            </button>
            {/* Triangle pointer */}
            <div className="absolute -bottom-1.5 right-3 w-3 h-3 bg-charcoal transform rotate-45" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatBubble;
