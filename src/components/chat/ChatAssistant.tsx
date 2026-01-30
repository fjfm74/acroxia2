import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatMessage from "./ChatMessage";
import ChatBubble from "./ChatBubble";
import ChatContactForm from "./ChatContactForm";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AssistantConfig {
  welcome_message?: string;
  bubble_message?: string;
  quick_replies_initial?: string[];
  contact_trigger_phrases?: string[];
  contact_success_message?: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`;

// Storage keys for persistence
const STORAGE_KEY_MESSAGES = "acroxia_chat_messages";
const STORAGE_KEY_IS_OPEN = "acroxia_chat_is_open";

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY_IS_OPEN);
    return saved === "true";
  });
  const [showBubble, setShowBubble] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY_MESSAGES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [config, setConfig] = useState<AssistantConfig>({
    bubble_message: "¿Tienes alguna duda sobre ACROXIA?",
    quick_replies_initial: ["🏠 Soy inquilino", "🏡 Soy propietario", "🏢 Soy profesional"],
    contact_trigger_phrases: ["ponerte en contacto", "contactar con nuestro equipo"],
    contact_success_message: "¡Perfecto! Hemos recibido tu mensaje. Nuestro equipo te contactará pronto.",
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bubbleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch assistant config
  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase
        .from("site_config")
        .select("value")
        .eq("key", "assistant_config")
        .single();

      if (data?.value) {
        setConfig(data.value as AssistantConfig);
      }
    };

    fetchConfig();
  }, []);

  // Persist messages to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
  }, [messages]);

  // Persist isOpen to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY_IS_OPEN, isOpen ? "true" : "false");
  }, [isOpen]);

  // Show bubble after 10 seconds
  useEffect(() => {
    const hasSeenBubble = sessionStorage.getItem("chat-bubble-dismissed");
    
    if (!hasSeenBubble && !isOpen) {
      bubbleTimerRef.current = setTimeout(() => {
        setShowBubble(true);
      }, 10000);
    }

    return () => {
      if (bubbleTimerRef.current) {
        clearTimeout(bubbleTimerRef.current);
      }
    };
  }, [isOpen]);

  // Helper function to scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, showQuickReplies, scrollToBottom]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initialize with welcome message (only if no persisted messages)
  useEffect(() => {
    if (isOpen && messages.length === 0 && config.welcome_message) {
      setMessages([{ role: "assistant", content: config.welcome_message }]);
      setShowQuickReplies(true);
    }
  }, [isOpen, config.welcome_message, messages.length]);

  // Start new conversation
  const handleNewConversation = () => {
    setMessages([]);
    setShowQuickReplies(true);
    setShowContactForm(false);
    sessionStorage.removeItem(STORAGE_KEY_MESSAGES);
    // Re-add welcome message
    if (config.welcome_message) {
      setMessages([{ role: "assistant", content: config.welcome_message }]);
    }
  };

  const handleOpenChat = () => {
    setIsOpen(true);
    setShowBubble(false);
    sessionStorage.setItem("chat-bubble-dismissed", "true");
  };

  const handleCloseBubble = () => {
    setShowBubble(false);
    sessionStorage.setItem("chat-bubble-dismissed", "true");
  };

  const streamChat = useCallback(
    async (userMessages: Message[]) => {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: userMessages }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al procesar la solicitud");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantSoFar = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
              // Scroll while streaming
              requestAnimationFrame(() => {
                const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
                if (viewport) {
                  viewport.scrollTop = viewport.scrollHeight;
                }
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Check if the response suggests contact
      const triggerPhrases = config.contact_trigger_phrases || [];
      const shouldShowContact = triggerPhrases.some((phrase) =>
        assistantSoFar.toLowerCase().includes(phrase.toLowerCase())
      );

      if (shouldShowContact) {
        setTimeout(() => setShowContactForm(true), 500);
      }
    },
    [config.contact_trigger_phrases]
  );

  const handleSend = async (messageContent?: string) => {
    const content = messageContent || input.trim();
    if (!content || isLoading) return;

    const userMessage: Message = { role: "user", content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setShowContactForm(false);
    setShowQuickReplies(false);

    try {
      await streamChat(newMessages);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (reply: string) => {
    handleSend(reply);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleContactSuccess = () => {
    setShowContactForm(false);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: config.contact_success_message || "¡Perfecto! Hemos recibido tu mensaje. Nuestro equipo te contactará pronto.",
      },
    ]);
  };

  const quickReplies = config.quick_replies_initial || [];

  return (
    <div className="fixed bottom-20 right-4 z-50">
      {/* Chat bubble */}
      <ChatBubble
        isVisible={showBubble && !isOpen}
        message={config.bubble_message || "¿Tienes alguna duda sobre ACROXIA?"}
        onClose={handleCloseBubble}
        onClick={handleOpenChat}
      />

      {/* Chat toggle button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenChat}
            className="w-14 h-14 rounded-full bg-charcoal text-cream shadow-lg flex items-center justify-center hover:bg-charcoal/90 transition-colors"
            aria-label="Abrir asistente"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-0 right-0 w-[380px] max-w-[calc(100vw-2rem)] bg-cream rounded-2xl shadow-2xl overflow-hidden border border-charcoal/5"
          >
            {/* Header */}
            <div className="bg-charcoal text-cream px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cream/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-sm">Asistente ACROXIA</p>
                  <p className="text-xs text-cream/70">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-cream hover:bg-cream/10"
                  onClick={handleNewConversation}
                  title="Nueva conversación"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-cream hover:bg-cream/10"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="h-[350px] p-4" ref={scrollRef}>
              <div className="space-y-1">
                {messages.map((msg, i) => (
                  <ChatMessage key={i} role={msg.role} content={msg.content} />
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <ChatMessage role="assistant" content="" isTyping />
                )}
              </div>

              {/* Quick Replies */}
              {showQuickReplies && quickReplies.length > 0 && messages.length === 1 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-wrap gap-2 mt-3"
                >
                  {quickReplies.map((reply, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickReply(reply)}
                      className="px-4 py-2 text-sm rounded-full border border-charcoal/20 bg-background hover:bg-muted transition-colors text-charcoal"
                    >
                      {reply}
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Contact form */}
              {showContactForm && (
                <div className="mt-3">
                  <ChatContactForm
                    onClose={() => setShowContactForm(false)}
                    onSuccess={handleContactSuccess}
                  />
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="p-3 border-t border-charcoal/5">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe tu pregunta..."
                  className="flex-1 h-10 bg-muted border-charcoal/10 rounded-full px-4"
                  maxLength={500}
                  disabled={isLoading}
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="h-10 w-10 rounded-full bg-charcoal text-cream hover:bg-charcoal/90 p-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Información orientativa · No constituye asesoría legal
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatAssistant;
