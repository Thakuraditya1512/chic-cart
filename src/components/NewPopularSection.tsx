import { useState, useEffect, useRef } from "react";
import ProductCard from "@/components/ProductCard";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Product } from "@/types";

interface Brand {
  id: string;
  name: string;
}

const NewPopularSection = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
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
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching data:", error);
      setProducts([]);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const brandNames = ["All", ...brands.map((b) => b.name)];

  const filtered =
    activeTab === "All"
      ? products
      : products.filter(
          (p) => brands.find((b) => b.id === p.brandId)?.name === activeTab
        );

  return (
    <section id="categories" ref={ref} className="py-24 md:py-36 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-muted-foreground mb-4 font-sans"
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
            className="font-display text-4xl md:text-6xl font-bold leading-[0.95]"
          >
            New & <span className="italic font-normal">Popular</span>
          </motion.h2>
        </div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center gap-2 mb-12 overflow-x-auto pb-2 scrollbar-hide"
        >
          {brandNames.map((brand) => (
            <button
              key={brand}
              onClick={() => setActiveTab(brand)}
              className={`px-6 py-2.5 text-[10px] font-sans font-medium uppercase tracking-[0.15em] rounded-full transition-all duration-300 whitespace-nowrap ${
                activeTab === brand
                  ? "bg-foreground text-background"
                  : "bg-transparent border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {brand}
            </button>
          ))}
        </motion.div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-xl bg-secondary/50 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-sans">
              No products available for this brand.
            </p>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6"
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
