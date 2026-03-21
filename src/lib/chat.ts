import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  limit,
} from "firebase/firestore";

// Types
export interface ChatMessage {
  id?: string;
  chatId: string;
  sender: "user" | "bot" | "admin";
  text: string;
  timestamp: any;
  read: boolean;
}

export interface SupportChat {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: "active" | "pending_admin" | "resolved" | "closed";
  subject: string;
  createdAt: any;
  updatedAt: any;
  lastMessage?: string;
  unreadCount: number;
  assignedTo?: string; // admin user ID
  needsHumanHelp: boolean;
  botHandled: boolean;
}

// Auto-response templates for common questions
const BOT_RESPONSES: { keywords: string[]; response: string }[] = [
  {
    keywords: ["order", "track", "tracking", "where is my order", "shipment"],
    response: "You can track your order by going to 'My Orders' in your profile. If you need more help, I can connect you with our support team."
  },
  {
    keywords: ["return", "refund", "exchange", "money back"],
    response: "We offer easy returns within 7 days of delivery. Products must be unworn with original tags. Initiate a return from 'My Orders' or I can connect you with support."
  },
  {
    keywords: ["size", "fitting", "fit", "too big", "too small", "measurement"],
    response: "Each product page has a size guide. For specific sizing questions, I can connect you with our support team who can help you find the perfect fit!"
  },
  {
    keywords: ["coupon", "discount", "code", "promo", "offer", "sale"],
    response: "You can apply coupon codes at checkout. Check our homepage for current promotions! Need a specific coupon? I can connect you with support."
  },
  {
    keywords: ["payment", "pay", "card", "upi", "failed", "transaction"],
    response: "We accept all major cards, UPI, and wallets. If your payment failed, please try again or use a different method. For payment issues, I can connect you with support."
  },
  {
    keywords: ["delivery", "shipping", "ship", "time", "how long", "when will"],
    response: "Standard delivery takes 3-7 business days. Express delivery (1-3 days) available for select locations. You can check delivery options at checkout!"
  },
  {
    keywords: ["cancel", "cancellation", "stop order"],
    response: "Orders can be cancelled within 1 hour of placement or before they are shipped. Go to 'My Orders' to cancel if eligible."
  },
  {
    keywords: ["contact", "phone", "call", "number", "email", "reach"],
    response: "You can reach us at chiccart@gmail.com. For immediate assistance, use this chat or WhatsApp us at +91 9999999999!"
  },
  {
    keywords: ["product", "stock", "available", "in stock", "out of stock"],
    response: "Product availability is shown on each product page. If an item is out of stock, you can sign up for restock notifications!"
  },
  {
    keywords: ["account", "login", "sign in", "password", "forgot"],
    response: "Use the 'Login' button to access your account. If you forgot your password, click 'Forgot Password' on the login page."
  },
  {
    keywords: ["wishlist", "save", "favorite", "heart"],
    response: "Click the heart icon on any product to add it to your wishlist! Access your wishlist from your profile."
  },
  {
    keywords: ["hi", "hello", "hey", "good morning", "good evening", "good afternoon"],
    response: "Hello! 👋 Welcome to Chic Cart support! I'm here to help with your orders, returns, sizing, or any questions. How can I assist you today?"
  },
  {
    keywords: ["bye", "goodbye", "thank", "thanks"],
    response: "You're welcome! 😊 Have a great day! If you need any more help, feel free to chat with us anytime."
  }
];

const FALLBACK_RESPONSES = [
  "I'm not sure I understand. Could you rephrase that? Or type 'help' to see what I can assist with.",
  "I don't have an answer for that yet. Let me connect you with a human support agent who can help better!",
  "That's a great question! Our support team can help you with this. Let me notify them to join this chat.",
  "I'm still learning! For complex queries like this, our human support team is better equipped to help. Let me connect you!"
];

// Get bot response based on user message
export function getBotResponse(message: string): { response: string; needsHuman: boolean } {
  const lowerMsg = message.toLowerCase();
  
  // Check for matching keywords
  for (const item of BOT_RESPONSES) {
    if (item.keywords.some(keyword => lowerMsg.includes(keyword))) {
      return { response: item.response, needsHuman: false };
    }
  }
  
  // Check for help command
  if (lowerMsg.includes("help") || lowerMsg.includes("what can you do")) {
    return {
      response: `I can help you with:
• Order tracking and status
• Returns and refunds
• Size and fitting questions
• Coupon and discount info
• Payment issues
• Delivery information
• Account questions
• Product availability

Type your question or say 'human' to chat with our support team!`,
      needsHuman: false
    };
  }
  
  // Check for human/agent request
  if (lowerMsg.includes("human") || lowerMsg.includes("agent") || lowerMsg.includes("support team") || lowerMsg.includes("real person")) {
    return {
      response: "I'll connect you with our support team right away! An agent will join this chat shortly. Please wait a moment...",
      needsHuman: true
    };
  }
  
  // Fallback response
  const randomResponse = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
  return { response: randomResponse, needsHuman: randomResponse.includes("support team") || randomResponse.includes("human") };
}

// Create a new support chat
export async function createSupportChat(
  userId: string,
  userName: string,
  userEmail: string,
  subject: string = "General Inquiry"
): Promise<string> {
  const chatData: Omit<SupportChat, "id"> = {
    userId,
    userName,
    userEmail,
    status: "active",
    subject,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    unreadCount: 0,
    needsHumanHelp: false,
    botHandled: true,
  };
  
  const docRef = await addDoc(collection(db, "supportChats"), chatData);
  return docRef.id;
}

// Add message to chat
export async function addChatMessage(
  chatId: string,
  sender: "user" | "bot" | "admin",
  text: string
): Promise<void> {
  const messageData: Omit<ChatMessage, "id"> = {
    chatId,
    sender,
    text,
    timestamp: serverTimestamp(),
    read: sender === "user", // User's own messages are marked read
  };
  
  await addDoc(collection(db, "chatMessages"), messageData);
  
  // Update chat's last message and timestamp
  await updateDoc(doc(db, "supportChats", chatId), {
    lastMessage: text,
    updatedAt: serverTimestamp(),
    unreadCount: sender === "user" ? 1 : 0,
  });
}

// Get chat messages
export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  const q = query(
    collection(db, "chatMessages"),
    where("chatId", "==", chatId),
    orderBy("timestamp", "asc")
  );
  
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
}

// Subscribe to chat messages (real-time)
export function subscribeToChatMessages(
  chatId: string,
  callback: (messages: ChatMessage[]) => void
) {
  const q = query(
    collection(db, "chatMessages"),
    where("chatId", "==", chatId),
    orderBy("timestamp", "asc")
  );
  
  return onSnapshot(q, 
    (snap) => {
      const messages = snap.docs.map(d => {
        const data = d.data() as any;
        return { id: d.id, ...data } as ChatMessage;
      });
      callback(messages);
    },
    (error) => {
      console.error("Error in subscribeToChatMessages:", error);
      // Fallback: fetch without orderBy if index doesn't exist
      const fallbackQ = query(
        collection(db, "chatMessages"),
        where("chatId", "==", chatId)
      );
      return onSnapshot(fallbackQ, (fallbackSnap) => {
        const messages = fallbackSnap.docs
          .map(d => {
            const data = d.data() as any;
            return { id: d.id, ...data } as ChatMessage;
          })
          .sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));
        callback(messages);
      });
    }
  );
}

// Get user's active chats
export async function getUserChats(userId: string): Promise<SupportChat[]> {
  const q = query(
    collection(db, "supportChats"),
    where("userId", "==", userId),
    orderBy("updatedAt", "desc")
  );
  
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data() as any;
    return { id: d.id, ...data };
  });
}

// Subscribe to user's chats (real-time)
export function subscribeToUserChats(
  userId: string,
  callback: (chats: SupportChat[]) => void
) {
  const q = query(
    collection(db, "supportChats"),
    where("userId", "==", userId),
    orderBy("updatedAt", "desc")
  );
  
  return onSnapshot(q, (snap) => {
    const chats = snap.docs.map(d => ({ id: d.id, ...d.data() } as SupportChat));
    callback(chats);
  });
}

// Get all active chats for admin
export async function getAllSupportChats(status?: string): Promise<SupportChat[]> {
  let q;
  if (status) {
    q = query(
      collection(db, "supportChats"),
      where("status", "==", status),
      orderBy("updatedAt", "desc")
    );
  } else {
    q = query(
      collection(db, "supportChats"),
      orderBy("updatedAt", "desc"),
      limit(50)
    );
  }
  
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data() as any;
    return { id: d.id, ...data };
  });
}

// Subscribe to all chats for admin (real-time)
export function subscribeToAllChats(callback: (chats: SupportChat[]) => void) {
  const q = query(
    collection(db, "supportChats"),
    orderBy("updatedAt", "desc"),
    limit(100)
  );
  
  return onSnapshot(q, 
    (snap) => {
      const chats = snap.docs.map(d => {
        const data = d.data() as any;
        return { id: d.id, ...data } as SupportChat;
      });
      callback(chats);
    },
    (error) => {
      console.error("Error in subscribeToAllChats:", error);
      // Fallback: fetch without orderBy if index doesn't exist
      const fallbackQ = query(collection(db, "supportChats"), limit(100));
      return onSnapshot(fallbackQ, (fallbackSnap) => {
        const chats = fallbackSnap.docs
          .map(d => {
            const data = d.data() as any;
            return { id: d.id, ...data } as SupportChat;
          })
          .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0));
        callback(chats);
      });
    }
  );
}

// Update chat status
export async function updateChatStatus(
  chatId: string,
  status: SupportChat["status"],
  assignedTo?: string
): Promise<void> {
  const update: any = { status, updatedAt: serverTimestamp() };
  if (assignedTo) update.assignedTo = assignedTo;
  
  await updateDoc(doc(db, "supportChats", chatId), update);
}

// Mark messages as read
export async function markMessagesAsRead(chatId: string, sender: "user" | "admin"): Promise<void> {
  const q = query(
    collection(db, "chatMessages"),
    where("chatId", "==", chatId),
    where("sender", "!=", sender),
    where("read", "==", false)
  );
  
  const snap = await getDocs(q);
  const promises = snap.docs.map(d => updateDoc(d.ref, { read: true }));
  await Promise.all(promises);
  
  // Reset unread count
  await updateDoc(doc(db, "supportChats", chatId), { unreadCount: 0 });
}

// Flag chat for human help
export async function flagForHumanHelp(chatId: string): Promise<void> {
  await updateDoc(doc(db, "supportChats", chatId), {
    needsHumanHelp: true,
    status: "pending_admin",
    updatedAt: serverTimestamp(),
  });
}

// Send email notification to admin (simulated - would connect to backend/email service)
export async function notifyAdminForChat(chatId: string, userName: string, message: string): Promise<void> {
  // In production, this would call a cloud function or API to send email
  // For now, we'll add a notification document that admin can check
  await addDoc(collection(db, "adminNotifications"), {
    type: "chat_support",
    chatId,
    title: `New Support Chat: ${userName}`,
    message: `Customer needs help: "${message.substring(0, 100)}${message.length > 100 ? "..." : ""}"`,
    createdAt: serverTimestamp(),
    read: false,
    link: `/admin?tab=chats&chatId=${chatId}`,
  });
}
