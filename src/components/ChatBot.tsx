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
    if (!isOpen || !user) return;

    const initChat = async () => {
      try {
        // Check for existing active chat
        // For simplicity, we'll create a new chat each time for now
        // In production, you'd want to resume existing active chats
        const newChatId = await createSupportChat(
          user.uid,
          user.displayName || "Guest User",
          user.email || "No email",
          "General Support"
        );
        setChatId(newChatId);
        
        // Add welcome message
        const welcomeMsg: ChatMessage = {
          id: "welcome",
          chatId: newChatId,
          sender: "bot",
          text: "Hello! 👋 Welcome to Chic Cart support! I'm here to help with your orders, returns, sizing, or any questions. How can I assist you today?",
          timestamp: new Date(),
          read: true,
        };
        setMessages([welcomeMsg]);
        
        // Subscribe to messages
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
        
        unsubscribeRef.current = subscribeToChatMessages(newChatId, (updatedMessages) => {
          setMessages(updatedMessages);
        });
      } catch (error) {
        toast.error("Failed to start chat");
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
    if (!input.trim() || !chatId || isLoading) {
      console.log("Cannot send:", { input: input.trim(), chatId, isLoading });
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      console.log("Sending message to chat:", chatId);
      // Add user message
      await addChatMessage(chatId, "user", userMessage);
      console.log("Message sent successfully");

      // If in human mode, don't auto-respond
      if (isHumanMode) {
        // Notify admin that user sent a message
        if (user) {
          await notifyAdminForChat(chatId, user.displayName || "User", userMessage);
        }
        setIsLoading(false);
        return;
      }

      // Get bot response
      const { response, needsHuman } = getBotResponse(userMessage);

      // Small delay to make it feel natural
      await new Promise(resolve => setTimeout(resolve, 500));

      // Add bot response
      await addChatMessage(chatId, "bot", response);

      // If needs human help, flag it
      if (needsHuman) {
        await flagForHumanHelp(chatId);
        setIsHumanMode(true);
        setChatStatus("pending_admin");
        
        // Notify admin
        if (user) {
          await notifyAdminForChat(chatId, user.displayName || "User", userMessage);
        }
        
        toast.info("Connecting you to a human agent...");
      }
    } catch (error: any) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message: " + (error.message || "Unknown error"));
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
      
      await addChatMessage(chatId, "bot", "I'll connect you with our support team right away! An agent will join this chat shortly. Please wait a moment...");
      
      if (user) {
        await notifyAdminForChat(chatId, user.displayName || "User", "User requested human support");
      }
      
      toast.success("Human support requested!");
    } catch (error) {
      toast.error("Failed to request human support");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

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
               chatStatus === "pending_admin" ? "Waiting for Agent" : "Resolved"}
            </span>
          </div>
          {!isHumanMode && (
            <button
              onClick={requestHuman}
              disabled={isLoading}
              className="text-[10px] text-[#a78bfa] hover:text-white font-medium transition-colors"
            >
              Talk to Human →
            </button>
          )}
        </div>

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
