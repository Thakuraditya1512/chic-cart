import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { toast } from "sonner";

interface WishlistContextType {
  wishlistItems: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_KEY = "luxe-wishlist";

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  useEffect(() => {
    if (user) {
      // Load from Firestore
      const fetchWishlist = async () => {
        try {
          const docRef = doc(db, "wishlists", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setWishlistItems(docSnap.data().items || []);
          } else {
            // Merge local to firestore once logged in if any exist
            const local = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
            if (local.length > 0) {
              await setDoc(docRef, { items: local, userEmail: user.email });
              setWishlistItems(local);
            }
          }
        } catch (error) {
          console.error("Error fetching wishlist:", error);
        }
      };
      fetchWishlist();
    } else {
      // Load from localStorage
      const local = localStorage.getItem(WISHLIST_KEY);
      if (local) {
        setWishlistItems(JSON.parse(local));
      } else {
        setWishlistItems([]);
      }
    }
  }, [user]);

  // Sync to localStorage as fallback
  useEffect(() => {
    if (!user) {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlistItems));
    }
  }, [wishlistItems, user]);

  const toggleWishlist = async (productId: string) => {
    let updated: string[];
    const exists = wishlistItems.includes(productId);
    
    if (exists) {
      updated = wishlistItems.filter((id) => id !== productId);
      toast.success("Removed from wishlist");
    } else {
      updated = [...wishlistItems, productId];
      toast.success("Added to wishlist");
    }

    setWishlistItems(updated);

    if (user) {
      try {
        await setDoc(doc(db, "wishlists", user.uid), { 
          items: updated, 
          userEmail: user.email,
          updatedAt: new Date()
        }, { merge: true });
      } catch (error) {
        console.error("Error updating wishlist:", error);
        toast.error("Failed to sync wishlist to cloud.");
      }
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlistItems.includes(productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlistItems, toggleWishlist, isInWishlist, isWishlistOpen, setIsWishlistOpen }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
};
