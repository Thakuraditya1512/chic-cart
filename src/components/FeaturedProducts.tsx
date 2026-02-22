import ProductCard from "@/components/ProductCard";
import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Product } from "@/types";

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const productsRef = collection(db, "products");
      const snapshot = await getDocs(productsRef);
      const fetchedProducts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        rating: doc.data().rating || 4.5,
      } as Product));
      setProducts(fetchedProducts);

      // Get featured products (marked as featured in Firestore)
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
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 320,
        behavior: "smooth",
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return;
    const distance = startX - e.clientX;
    scrollContainerRef.current.scrollLeft += distance;
    setStartX(e.clientX);
    handleScroll();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return;
    const distance = startX - e.touches[0].clientX;
    scrollContainerRef.current.scrollLeft += distance;
    setStartX(e.touches[0].clientX);
    handleScroll();
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <>
      {/* Featured Kicks Section */}
      <section className="py-16 md:py-24 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Featured Kicks
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Handpicked sneakers for your rotation
            </p>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] rounded-lg bg-secondary/50 animate-pulse"
                />
              ))}
            </div>
          ) : featured.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No featured kicks yet. Mark shoes as featured in the admin panel.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featured.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Addition Section - Horizontal Scroll */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Featured Addition
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Explore more fresh kicks
            </p>
          </div>

          {/* Horizontal Scroll Container */}
          <div className="relative">
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 cursor-grab active:cursor-grabbing"
              style={{
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {products.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex-shrink-0 w-64 sm:w-72"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>

            {/* Scroll Arrow - Right Only */}
            {showRightArrow && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={scrollRight}
                className="absolute -right-6 md:right-0 top-1/2 -translate-y-1/2 p-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg transition-all hover:shadow-purple-500/50 z-10 hidden sm:flex items-center justify-center"
                title="Scroll right"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            )}

            {/* Mobile Scroll Indicator */}
            <div className="sm:hidden text-center mt-4">
              <p className="text-xs text-muted-foreground">Swipe left to explore more →</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default FeaturedProducts;
