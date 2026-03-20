import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  updateDoc, 
  doc, 
  arrayUnion,
  onSnapshot,
  Timestamp
} from "firebase/firestore";
import { Notification } from "@/types";

export const sendNotification = async (notification: Omit<Notification, "id" | "createdAt">) => {
  try {
    // Remove any undefined fields that Firestore doesn't like
    const cleanedData = JSON.parse(JSON.stringify(notification));
    
    const docRef = await addDoc(collection(db, "notifications"), {
      ...cleanedData,
      createdAt: serverTimestamp(),
      readBy: [],
    });
    return docRef.id;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string, userId: string, isGlobal: boolean) => {
  try {
    const docRef = doc(db, "notifications", notificationId);
    if (isGlobal) {
      await updateDoc(docRef, {
        readBy: arrayUnion(userId)
      });
    } else {
      await updateDoc(docRef, {
        isRead: true
      });
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

export const subscribeToNotifications = (userId: string, callback: (notifications: Notification[]) => void) => {
  // Query for global notifications and user-specific notifications
  const q = query(
    collection(db, "notifications"),
    where("target", "in", ["all", userId]),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notification));
    callback(notifications);
  });
};
