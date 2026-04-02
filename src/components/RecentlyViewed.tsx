import { useState, useEffect, useRef } from "react";
import { collection, query, where, documentId, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product } from "@/types";
import ProductCard from "./ProductCard";
import { motion, useInView } from "framer-motion";
import { Clock } from "lucide-react";

const RecentlyViewed = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });

  const fetchRecent = async () => {
    try {
      const stored = localStorage.getItem("recentlyViewed");
      if (!stored) {
        setProducts([]);
        return;
      }

      const ids: string[] = JSON.parse(stored);
      if (!Array.isArray(ids) || ids.length === 0) {
        setProducts([]);
        return;
      }

      setLoading(true);
      const fetchIds = ids.slice(0, 8);
      
      const q = query(collection(db, "products"), where(documentId(), "in", fetchIds));
      const snap = await getDocs(q);
      
      const items = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        rating: d.data().rating || 4.5
      } as Product));

      const sorted = items.sort((a, b) => fetchIds.indexOf(a.id) - fetchIds.indexOf(b.id));
      setProducts(sorted);
    } catch (err) {
      console.error("RecentlyViewed Error:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecent();
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "recentlyViewed") fetchRecent();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section ref={ref} id="recently-viewed" className="py-12 sm:py-24 bg-card/10 border-y border-border/50 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-3 mb-8 sm:mb-12">
          <div className="w-10 h-10 rounded-2xl bg-foreground/5 flex items-center justify-center">
            <Clock size={16} className="text-muted-foreground" />
          </div>
          <div>
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              className="font-display text-2xl sm:text-4xl font-bold"
            >
              Recently <span className="italic font-normal opacity-70">Viewed</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.2 }}
              className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mt-1"
            >
              Finish your checkout
            </motion.p>
          </div>
        </div>

        {loading && products.length === 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[3/4] bg-foreground/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 md:grid md:grid-cols-4 md:mx-0 md:px-0 md:gap-8">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.05 }}
                className="flex-shrink-0 w-48 sm:w-64 md:w-auto"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentlyViewed;
