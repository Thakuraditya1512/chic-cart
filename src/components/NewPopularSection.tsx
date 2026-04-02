import { useState, useEffect, useRef } from "react";
import ProductCard from "@/components/ProductCard";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Product } from "@/types";
import gsap from "gsap";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Brand {
  id: string;
  name: string;
}

const NewPopularSection = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const brandsRef = collection(db, "brands");
      const brandSnapshot = await getDocs(brandsRef);
      const fetchedBrands = brandSnapshot.docs.map(
        (doc) => ({ id: doc.id, name: doc.data().name } as Brand)
      );
      setBrands(fetchedBrands);

      const productsRef = collection(db, "products");
      const productSnapshot = await getDocs(productsRef);
      const fetchedProducts = productSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            rating: doc.data().rating || 4.5,
          } as Product)
      );
      
      // Randomize the display order
      const shuffledProducts = [...fetchedProducts].sort(() => Math.random() - 0.5);
      setProducts(shuffledProducts);
    } catch (error) {
      console.error("Error fetching data:", error);
      setProducts([]);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const brandNames = ["All", ...brands.map((b) => b.name)];

  const filtered = products
    .filter(p => activeTab === "All" || brands.find((b) => b.id === p.brandId)?.name === activeTab)
    .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // GSAP tab switch animation
  useEffect(() => {
    if (tabsRef.current) {
      const buttons = tabsRef.current.querySelectorAll('button');
      gsap.fromTo(
        buttons,
        { scale: 0.95 },
        { scale: 1, duration: 0.2, ease: "power2.out" }
      );
    }
  }, [activeTab]);

  return (
    <section id="categories" ref={ref} className="py-10 sm:py-20 md:py-36 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-6 sm:mb-12">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-2 sm:mb-4 font-sans"
          >
            Browse Collection
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.8,
              delay: 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="font-display text-2xl sm:text-4xl md:text-6xl font-bold leading-[0.95]"
          >
            New & <span className="italic font-normal">Popular</span>
          </motion.h2>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 sm:mb-12">
          <motion.div
            ref={tabsRef}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex w-full sm:w-auto overflow-x-auto pb-2 scrollbar-hide px-1 -mx-1"
          >
            {brandNames.map((brand) => (
              <button
                key={brand}
                onClick={() => setActiveTab(brand)}
                className={`px-3 sm:px-6 py-1.5 sm:py-2.5 text-[8px] sm:text-[10px] font-sans font-medium uppercase tracking-[0.15em] rounded-full transition-all duration-300 whitespace-nowrap flex-shrink-0 mr-1.5 ${
                  activeTab === brand
                    ? "bg-foreground text-background"
                    : "bg-transparent border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {brand}
              </button>
            ))}
          </motion.div>

          {/* Search Input */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative w-full sm:w-64 flex-shrink-0"
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search shoes by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                }
              }}
              className="w-full pl-9 pr-4 py-2 bg-foreground/5 border border-foreground/10 rounded-full text-sm font-sans focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/50 transition-all"
            />
          </motion.div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-lg sm:rounded-xl bg-secondary/50 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <p className="text-muted-foreground font-sans text-sm">
              No products available for this brand.
            </p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  layout
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default NewPopularSection;
