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
    keywords: ["order", "track", "tracking", "where is my order", "status", "shipment"],
    response: "You can track your order in real-time by visiting the 'My Orders' section in your account dashboard. Simply click on your order ID to see the current shipping status and expected delivery date. 👟"
  },
  {
    keywords: ["return", "refund", "exchange", "money back", "replace"],
    response: "We offer a hassle-free 7-day return policy. Items must be in their original, unworn condition with all tags attached. You can initiate a return or exchange request directly from the 'My Orders' page. Refunds are processed within 5-7 business days of checking the returned item."
  },
  {
    keywords: ["size", "fitting", "fit", "too big", "too small", "measurement", "guide"],
    response: "Our sneakers generally follow standard international sizing. We highly recommend checking the 'Size Guide' button on each product page for specific measurements. If you're between sizes, we usually suggest going half a size up for maximum comfort!"
  },
  {
    keywords: ["coupon", "discount", "code", "promo", "offer", "sale", "deal"],
    response: "Looking for a deal? Check our 'Sale' section for up to 50% off! You can enter valid promo codes at the final step of the checkout process. Note: Coupons cannot be combined with already discounted sale items."
  },
  {
    keywords: ["payment", "pay", "card", "upi", "failed", "transaction", "cash on delivery", "cod"],
    response: "We accept all major Credit/Debit cards, UPI (Google Pay, PhonePe), and Net Banking. Currently, we only offer secure prepaid transactions to ensure the fastest delivery. If your payment failed, it will usually be auto-refunded by your bank within 48 hours."
  },
  {
    keywords: ["delivery", "shipping", "ship", "time", "how long", "when will", "arrival"],
    response: "Standard shipping takes approximately 3-5 business days across India. Once your order ships, we'll send you a tracking link via email and SMS. We strive to get your kicks to your doorstep as fast as possible!"
  },
  {
    keywords: ["cancel", "cancellation", "stop order", "incorrect address"],
    response: "Orders can be cancelled within 1 hour of placement, provided they haven't been processed by our warehouse. Please head to your Orders page to see if your order is still eligible for cancellation."
  },
  {
    keywords: ["contact", "phone", "call", "number", "email", "reach", "whatsapp", "address"],
    response: "Our dedicated support team is available Monday to Friday, 9 AM - 6 PM. You can email us at support@ftk.com or WhatsApp us at +91 9398415366. We're always here to help!"
  },
  {
    keywords: ["authenticity", "original", "real", "fake", "legit", "genuine"],
    response: "Authenticity is our top priority. Every pair of sneakers at FTK support is 100% genuine and sourced directly from authorized distributors. We guarantee the quality and legitimacy of every product we sell."
  },
  {
    keywords: ["hi", "hello", "hey", "good morning", "good evening", "good afternoon", "hola"],
    response: "Hello! 👋 Welcome to FTK support's Premium Virtual Assistant. I'm here to help you find the perfect pair of kicks or answer any service questions. How can I make your shopping experience better today?"
  },
  {
    keywords: ["bye", "goodbye", "thank", "thanks", "awesome", "perfect"],
    response: "You're very welcome! 😊 It was a pleasure assisting you. Feel free to reach out anytime you need more help. Happy shopping!"
  },
  {
    keywords: ["help", "what can you do", "commands", "options"],
    response: "I can assist you with the following topics:\n• 📦 Tracking your Order status\n• 🔁 Returns, Refunds & Exchanges\n• 📏 Sizing & Fitting recommendations\n• 💰 Coupon & Payment information\n• 🚚 Shipping & Delivery estimates\n• ✅ Authenticity & Product details\n\nSimply type a keyword like 'Order' or 'Size' to get started, or ask for a 'human' to speak with our live team!"
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

// Create or retrieve an active support chat
export async function createSupportChat(
  userId: string,
  userName: string,
  userEmail: string,
  subject: string = "General Inquiry"
): Promise<string> {
  // Check for existing active/pending chat first
  const q = query(
    collection(db, "supportChats"),
    where("userId", "==", userId),
    where("status", "in", ["active", "pending_admin"]),
    limit(1)
  );
  
  const existingSnap = await getDocs(q);
  if (!existingSnap.empty) {
    return existingSnap.docs[0].id;
  }

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
  
  // Add initial bot welcome
  await addChatMessage(docRef.id, "bot", `Hello ${userName}! 👋 Welcome to FTK support. How can I help you today?`);
  
  return docRef.id;
}

// Add message to chat
export async function addChatMessage(
  chatId: string,
  sender: "user" | "bot" | "admin",
  text: string
): Promise<void> {
  try {
    console.log("Adding message:", { chatId, sender, text: text.substring(0, 50) });
    
    const messageData: Omit<ChatMessage, "id"> = {
      chatId,
      sender,
      text,
      timestamp: serverTimestamp(),
      read: sender === "user", // User's own messages are marked read
    };
    
    const docRef = await addDoc(collection(db, "chatMessages"), messageData);
    console.log("Message added with ID:", docRef.id);
    
    // Update chat's last message and timestamp
    await updateDoc(doc(db, "supportChats", chatId), {
      lastMessage: text,
      updatedAt: serverTimestamp(),
      unreadCount: sender === "user" ? 1 : 0,
    });
    console.log("Chat updated successfully");
  } catch (error: any) {
    console.error("Error in addChatMessage:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    throw error;
  }
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
