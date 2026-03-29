import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { subscribeToNotifications, markNotificationAsRead } from "@/lib/notification";
import { Notification } from "@/types";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  isNotificationRead: (notificationId: string) => boolean;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [localReadNotifs, setLocalReadNotifs] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("read_notifications");
    if (stored) {
      try {
        setLocalReadNotifs(JSON.parse(stored));
      } catch (e) {
        // ignore JSON parse error
      }
    }
  }, []);

  const saveLocalRead = (id: string) => {
    setLocalReadNotifs((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      localStorage.setItem("read_notifications", JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    setLoading(true);
    // User can be logged in or unauthenticated.
    // We pass "unauthenticated" as the ID for anonymous users, fetching global ones.
    const targetUserId = user ? user.uid : "unauthenticated";
    
    const unsubscribe = subscribeToNotifications(targetUserId, (newNotifications) => {
      // Filter for active notifications
      // All users see only active ones. Admin sees all when in Admin panel (handled there)
      setNotifications(newNotifications.filter(n => n.isActive !== false));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => {
    if (!user) {
      return !localReadNotifs.includes(n.id);
    }
    if (n.target === "all") {
      return !n.readBy?.includes(user.uid);
    }
    return !n.isRead;
  }).length;

  const markAsRead = async (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    if (!user) {
      // Unauthenticated users track read status locally
      saveLocalRead(notificationId);
      return;
    }

    const isGlobal = notification.target === "all";
    
    // We can confidently mark read in Firebase if user is logged in
    try {
      await markNotificationAsRead(notificationId, user.uid, isGlobal);
    } catch (err) {
      console.error("Failed to mark notification as read in Firebase", err);
    }
  };

  const isNotificationRead = (notificationId: string) => {
    const n = notifications.find(notif => notif.id === notificationId);
    if (!n) return false;
    if (!user) {
      return localReadNotifs.includes(notificationId);
    }
    if (n.target === "all") {
      return !!n.readBy?.includes(user.uid);
    }
    return !!n.isRead;
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        isNotificationRead,
        loading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};
