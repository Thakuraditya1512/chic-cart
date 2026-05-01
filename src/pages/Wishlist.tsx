import { useWishlist } from "@/contexts/WishlistContext";
import { useEffect, useState, useRef } from "react";
import { Product } from "@/types";
import { db } from "@/lib/firebase";
import { collection, query, where, documentId, getDocs } from "firebase/firestore";
import Header from "@/components/Header";

import SearchOverlay from "@/components/SearchOverlay";
import ProductCard from "@/components/ProductCard";
import LoadingScreen from "@/components/LoadingScreen";
import { Heart, ArrowRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Helmet } from "react-helmet-async";

const Wishlist = () => {
  const { wishlistItems } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (wishlistItems.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const chunks = [];
        for (let i = 0; i < wishlistItems.length; i += 10) {
          chunks.push(wishlistItems.slice(i, i + 10));
        }

        let fetchedProducts: Product[] = [];
        for (const chunk of chunks) {
          const q = query(collection(db, "products"), where(documentId(), "in", chunk));
          const snap = await getDocs(q);
          const chunkProducts = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Product[];
          fetchedProducts = [...fetchedProducts, ...chunkProducts];
        }

        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching wishlist products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlistProducts();
  }, [wishlistItems]);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background">
      <Helmet>
        <title>Curated Wishlist | FTK - Flex The Kicks</title>
        <meta name="description" content="Your personal curation of premium sneakers and high-end streetwear." />
      </Helmet>

      <Header onSearchOpen={() => setSearchOpen(true)} />

      <main ref={sectionRef} className="pt-24 pb-32 md:pt-40 md:pb-48">
        <div className="container mx-auto px-4 md:px-8">

          {/* ── Editorial Header ── */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16 md:mb-24">
            <div className="relative">
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6 }}
                className="text-[10px] md:text-[11px] uppercase tracking-[0.5em] text-muted-foreground mb-4 font-mono font-bold"
              >
                Personal Collection · Vol. 01
              </motion.p>
              <div className="overflow-hidden">
                <motion.h1
                  initial={{ y: "110%" }}
                  animate={isInView ? { y: 0 } : {}}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[clamp(3.5rem,10vw,8.5rem)] font-black leading-[0.85] tracking-tighter uppercase"
                >
                  My <span className="italic font-light text-muted-foreground/30">Vault</span>
                </motion.h1>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 1, delay: 0.5 }}
              className="max-w-[280px] md:text-right"
            >
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed mb-6">
                A highly curated selection of your most wanted archival pieces and new drops.
              </p>
              <div className="flex items-center md:justify-end gap-3 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
                <span className="w-8 h-px bg-border" />
                {products.length} {products.length === 1 ? 'item' : 'items'} saved
              </div>
            </motion.div>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center">
              <LoadingScreen />
            </div>
          ) : products.length > 0 ? (
            /* ── WearComet Editorial Grid ── */
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 md:gap-x-8 md:gap-y-16">
              {products.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    duration: 0.8,
                    delay: 0.1 + (i % 4) * 0.1,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  className={i % 5 === 0 ? "lg:col-span-1" : ""}
                >
                  <div className="relative group/editorial">
                    {/* Index Number */}
                    <span className="absolute -top-6 -left-2 text-[40px] font-black text-foreground/[0.03] select-none pointer-events-none group-hover/editorial:text-foreground/5 transition-colors duration-500">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <ProductCard product={product} />
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* ── Empty State ── */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-32 md:py-48 text-center border border-dashed border-border/40 rounded-[2.5rem] bg-muted/5 backdrop-blur-sm"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-8">
                <Heart size={32} className="text-muted-foreground/20" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">Your vault is currently empty</h2>
              <p className="text-muted-foreground text-sm mb-10 max-w-sm leading-relaxed mx-auto">
                Discover the latest collections and add pieces to your personal vault to track their availability.
              </p>
              <Link
                to="/products"
                className="group relative px-10 py-4 bg-foreground text-background font-black uppercase tracking-[0.2em] text-xs rounded-full overflow-hidden transition-all hover:scale-105"
              >
                <div className="relative z-10 flex items-center gap-3">
                  Start Curation <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </Link>
            </motion.div>
          )}

          {/* ── Footer Stats ── */}
          {products.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 1 }}
              className="mt-24 md:mt-40 border-t border-border pt-10 flex flex-col md:flex-row justify-between items-center gap-6"
            >
              <div className="flex gap-12">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1 font-bold">Total Value</p>
                  <p className="text-xl font-bold tracking-tight">₹{products.reduce((acc, p) => acc + p.price, 0).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1 font-bold">Status</p>
                  <p className="text-xl font-bold tracking-tight text-emerald-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </p>
                </div>
              </div>

              <Link to="/products" className="text-xs font-bold uppercase tracking-widest flex items-center gap-4 group">
                Continue Shopping <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </motion.div>
          )}
        </div>
      </main>


      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export default Wishlist;
