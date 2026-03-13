import ProductCard from "@/components/ProductCard";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Product } from "@/types";

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsRef = collection(db, "products");
      const snapshot = await getDocs(productsRef);
      const fetchedProducts = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            rating: doc.data().rating || 4.5,
          } as Product)
      );
      setProducts(fetchedProducts);

      const featuredProducts = fetchedProducts.filter(
        (p) => (p as any).featured === true
      );
      setFeatured(featuredProducts.slice(0, 4));
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
      setFeatured([]);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 320, behavior: "smooth" });
  };

  const scrollLeftNav = () => {
    scrollContainerRef.current?.scrollBy({ left: -320, behavior: "smooth" });
  };

  const SkeletonGrid = ({ count }: { count: number }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="aspect-[3/4] rounded-xl bg-secondary/50 animate-pulse"
        />
      ))}
    </div>
  );

  return (
    <>
      {/* Featured Kicks Section */}
      <section ref={sectionRef} className="py-24 md:py-36 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-muted-foreground mb-4 font-sans"
            >
              Curated Selection
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl md:text-6xl font-bold leading-[0.95]"
            >
              Featured <span className="italic font-normal">Kicks</span>
            </motion.h2>
          </div>

          {loading ? (
            <SkeletonGrid count={4} />
          ) : featured.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground font-sans">
                No featured kicks yet. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featured.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    delay: 0.2 + i * 0.1,
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* All Products - Horizontal Scroll */}
      <section id="new" className="py-24 md:py-36 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-muted-foreground mb-3 font-sans">
                All Products
              </p>
              <h2 className="font-display text-3xl md:text-5xl font-bold leading-[0.95]">
                Explore <span className="italic font-normal">More</span>
              </h2>
            </div>

            {/* Scroll Controls */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={scrollLeftNav}
                disabled={!showLeftArrow}
                className="w-11 h-11 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={scrollRight}
                disabled={!showRightArrow}
                className="w-11 h-11 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="relative">
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {loading
                ? [...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-shrink-0 w-64 sm:w-72 aspect-[3/4] rounded-xl bg-secondary/50 animate-pulse"
                    />
                  ))
                : products.map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, x: 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.04 }}
                      className="flex-shrink-0 w-64 sm:w-72"
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
            </div>

            {/* Mobile indicator */}
            <div className="sm:hidden text-center mt-4">
              <p className="text-[10px] text-muted-foreground/60 font-sans uppercase tracking-wider">
                Swipe to explore →
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default FeaturedProducts;
