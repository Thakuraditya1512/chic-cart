import { useWishlist } from "@/contexts/WishlistContext";
import { useEffect, useState } from "react";
import { Product } from "@/types";
import { db } from "@/lib/firebase";
import { collection, query, where, documentId, getDocs } from "firebase/firestore";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import SearchOverlay from "@/components/SearchOverlay";
import ProductCard from "@/components/ProductCard";
import LoadingScreen from "@/components/LoadingScreen";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

const Wishlist = () => {
  const { wishlistItems } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (wishlistItems.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Query products that match the IDs in wishlistItems
        // Firestore 'in' query supports up to 10 items at a time. For simplicity, we assume < 10 or chunk if needed.
        // If wishlistItems > 10, chunking is required. Let's do a basic loop or chunking.
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
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>My Wishlist | FTK - Flex The Kicks</title>
        <meta name="description" content="View your wishlisted premium sneakers and hype shoes on Flex The Kicks." />
      </Helmet>
      
      <Header onSearchOpen={() => setSearchOpen(true)} />
      
      <main className="container mx-auto px-4 py-24 sm:py-32">
        <div className="flex items-center gap-3 mb-8 sm:mb-12">
          <Heart size={28} className="text-sale fill-sale/10" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold">My Wishlist</h1>
        </div>

        {loading ? (
          <LoadingScreen />
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border/50 rounded-2xl bg-card/20">
            <Heart size={48} className="text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-bold mb-2">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Discover the latest drops and add your favorite kicks to your wishlist to keep track of them.
            </p>
            <Link
              to="/products"
              className="px-8 py-3 bg-foreground text-background font-semibold uppercase tracking-wider text-sm rounded-xl hover:opacity-90 transition-opacity"
            >
              Explore Sneakers
            </Link>
          </div>
        )}
      </main>

      <BottomNav onSearchOpen={() => setSearchOpen(true)} />
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export default Wishlist;
