import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, Query, CollectionReference } from "firebase/firestore";

export interface FirebaseProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  category: string;
  image: string;
  rating?: number;
  reviews?: number;
  inStock?: boolean;
  createdAt?: string;
}

export const useFirebaseProducts = (filterCategory?: string) => {
  const [products, setProducts] = useState<FirebaseProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const productsRef = collection(db, "products");
        const q: CollectionReference | Query = filterCategory
          ? query(productsRef, where("category", "==", filterCategory))
          : productsRef;

        const snapshot = await getDocs(q);
        const fetchedProducts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as FirebaseProduct));

        setProducts(fetchedProducts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch products");
        console.error("Error fetching products from Firebase:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filterCategory]);

  return { products, loading, error };
};
