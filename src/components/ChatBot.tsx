import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Headphones, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  createSupportChat,
  addChatMessage,
  getChatMessages,
  subscribeToChatMessages,
  getBotResponse,
  flagForHumanHelp,
  notifyAdminForChat,
  updateChatStatus,
  SupportChat,
  ChatMessage,
} from "@/lib/chat";

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatBot({ isOpen, onClose }: ChatBotProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatStatus, setChatStatus] = useState<SupportChat["status"]>("active");
  const [isHumanMode, setIsHumanMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Initialize or load chat
  useEffect(() => {
    if (!isOpen || !user) {
      if (isOpen && !user) {
        toast.error("Please login to use live support");
      }
      return;
    }

    const initChat = async () => {
      try {
        setIsLoading(true);
        // Check for existing active sessions first would be better, but for now we create/load
        const newChatId = await createSupportChat(
          user.uid,
          user.displayName || "User",
          user.email || "No email",
          "Customer Support Session"
        );
        setChatId(newChatId);
        
        // Subscribe to messages
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
        
        unsubscribeRef.current = subscribeToChatMessages(newChatId, (updatedMessages) => {
          setMessages(updatedMessages);
          // Check if any message is from admin to flip human mode
          if (updatedMessages.some(m => m.sender === "admin")) {
            setIsHumanMode(true);
            setChatStatus("active");
          }
        });
      } catch (error) {
        console.error("Init chat error:", error);
        toast.error("Failed to start support session");
      } finally {
        setIsLoading(false);
      }
    };

    initChat();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [isOpen, user]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    if (!user) {
      toast.error("Please login to send messages");
      return;
    }

    if (!chatId) {
      toast.error("Session not initialized. Please wait...");
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      // Add user message to Firestore
      await addChatMessage(chatId, "user", userMessage);

      // If in human mode, don't auto-respond with bot
      if (isHumanMode || chatStatus === "pending_admin") {
        setIsLoading(false);
        return;
      }

      // Get bot response
      const { response, needsHuman } = getBotResponse(userMessage);

      // Small delay to make it feel natural
      await new Promise(resolve => setTimeout(resolve, 800));

      // Add bot response to Firestore
      await addChatMessage(chatId, "bot", response);

      // If needs human help, flag it
      if (needsHuman) {
        await flagForHumanHelp(chatId);
        setIsHumanMode(true);
        setChatStatus("pending_admin");
        
        // Notify admin
        await notifyAdminForChat(chatId, user.displayName || "User", userMessage);
        
        // Add a system message locally/in DB
        await addChatMessage(chatId, "bot", "System: Waiting to connect you with a human agent... please stay online.");
      }
    } catch (error: any) {
      console.error("Failed to send message:", error);
      toast.error("Message failed to send. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const requestHuman = async () => {
    if (!chatId) return;
    
    try {
      setIsLoading(true);
      await flagForHumanHelp(chatId);
      setIsHumanMode(true);
      setChatStatus("pending_admin");
      
      await addChatMessage(chatId, "bot", "Waiting to connect you with a human agent... an admin will be with you shortly.");
      
      if (user) {
        await notifyAdminForChat(chatId, user.displayName || "User", "User requested human support");
      }
      
      toast.success("Connecting to human support...");
    } catch (error) {
      toast.error("Failed to request human support");
    } finally {
      setIsLoading(false);
    }
  };

  const closeSession = async () => {
    if (!chatId) return;
    try {
      setIsLoading(true);
      await updateChatStatus(chatId, "resolved");
      setChatStatus("resolved");
      toast.success("Support session closed");
      onClose();
    } catch (error) {
      toast.error("Failed to close session");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  if (!user) return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-24 right-4 sm:right-8 z-50 w-[calc(100vw-2rem)] sm:w-80 p-6 bg-[#0d0d18] rounded-2xl border border-white/10 shadow-2xl text-center"
      >
        <div className="w-12 h-12 rounded-full bg-[#6c5ce7]/10 flex items-center justify-center mx-auto mb-4">
          <User className="w-6 h-6 text-[#6c5ce7]" />
        </div>
        <h3 className="text-white font-bold mb-2">Login Required</h3>
        <p className="text-xs text-white/40 mb-4 leading-relaxed">Please login to your account to start a live support session with our team.</p>
        <button 
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#6c5ce7] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#7c6cf7] transition-all"
        >
          Close
        </button>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-24 right-4 sm:right-8 z-50 w-[calc(100vw-2rem)] sm:w-96 max-h-[600px] bg-[#0d0d18] rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#6c5ce7] to-[#a855f7] border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              {isHumanMode ? (
                <Headphones className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {isHumanMode ? "Human Support" : "Chic Bot"}
              </h3>
              <p className="text-[10px] text-white/70">
                {isHumanMode ? "Agent will join soon" : "AI Assistant"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-4 py-2 bg-[#0a0a12] border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              chatStatus === "active" ? "bg-green-400" : 
              chatStatus === "pending_admin" ? "bg-amber-400" : "bg-white/30"
            }`} />
            <span className="text-[10px] text-white/40 uppercase tracking-wider">
              {chatStatus === "active" ? "Bot Active" : 
               chatStatus === "pending_admin" ? "Agent Connecting..." : "Resolved"}
            </span>
          </div>
          {chatStatus === "active" && !isHumanMode ? (
            <button
              onClick={requestHuman}
              disabled={isLoading}
              className="text-[10px] text-[#a78bfa] hover:text-white font-medium transition-colors"
            >
              Talk to Human →
            </button>
          ) : chatStatus !== "resolved" ? (
            <button
              onClick={closeSession}
              disabled={isLoading}
              className="text-[10px] text-red-400/60 hover:text-red-400 font-medium transition-colors"
            >
              End Session
            </button>
          ) : null}
        </div>

        {/* Waiting Overlay for Human Connection */}
        {chatStatus === "pending_admin" && (
          <div className="absolute inset-0 top-[88px] bottom-[72px] bg-[#0d0d18]/90 z-10 flex flex-col items-center justify-center p-8 text-center">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full border-2 border-[#6c5ce7]/20 border-t-[#6c5ce7] animate-spin" />
              <Headphones className="absolute inset-0 m-auto w-6 h-6 text-[#6c5ce7]" />
            </div>
            <h4 className="text-white font-bold mb-2">Connecting to Agent</h4>
            <p className="text-xs text-white/40 leading-relaxed">Please wait a moment while we connect you with a member of our support team. 👟</p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[350px] min-h-[200px]">
          {messages.map((msg, index) => (
            <motion.div
              key={msg.id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex items-start gap-2 max-w-[85%] ${
                msg.sender === "user" ? "flex-row-reverse" : ""
              }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.sender === "user" 
                    ? "bg-[#6c5ce7]" 
                    : msg.sender === "admin"
                    ? "bg-emerald-500"
                    : "bg-white/10"
                }`}>
                  {msg.sender === "user" ? (
                    <User className="w-3.5 h-3.5 text-white" />
                  ) : msg.sender === "admin" ? (
                    <Headphones className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
                <div className={`px-3 py-2 rounded-xl text-sm ${
                  msg.sender === "user"
                    ? "bg-[#6c5ce7] text-white rounded-br-md"
                    : msg.sender === "admin"
                    ? "bg-emerald-500/20 text-emerald-100 border border-emerald-500/30 rounded-bl-md"
                    : "bg-white/5 text-white/90 border border-white/10 rounded-bl-md"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span className="text-[9px] opacity-50 mt-1 block">
                    {msg.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || 
                     new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
                <Loader2 className="w-4 h-4 text-white/50 animate-spin" />
                <span className="text-xs text-white/50">Typing...</span>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-[#0a0a12] border-t border-white/10">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isHumanMode ? "Type your message..." : "Ask me anything..."}
              disabled={isLoading || chatStatus === "resolved"}
              className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#6c5ce7]/50 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim() || chatStatus === "resolved"}
              className="p-2 rounded-xl bg-[#6c5ce7] hover:bg-[#7c6cf7] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[9px] text-white/20 text-center mt-2">
            {isHumanMode 
              ? "An agent will respond shortly" 
              : "Type 'help' to see what I can do, or 'human' for live support"}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
