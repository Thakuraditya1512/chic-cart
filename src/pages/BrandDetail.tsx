import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ArrowLeft, ShoppingCart, Search } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types";
import LoadingScreen from "@/components/LoadingScreen";

gsap.registerPlugin(ScrollTrigger);

interface Brand {
  id: string;
  name: string;
  image: string;
  description?: string;
}

const BrandDetail = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const productsGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (brandId) {
      fetchBrandAndProducts();
    }
  }, [brandId]);

  // GSAP animations for products
  useEffect(() => {
    if (productsGridRef.current && products.length > 0) {
      const cards = productsGridRef.current.querySelectorAll('.brand-product-card');
      const triggers: ScrollTrigger[] = [];
      
      cards.forEach((card, index) => {
        const trigger = ScrollTrigger.create({
          trigger: card,
          start: "top 85%",
          onEnter: () => {
            gsap.fromTo(
              card,
              { opacity: 0, y: 40, scale: 0.95 },
              { 
                opacity: 1, 
                y: 0, 
                scale: 1,
                duration: 0.5, 
                ease: "power3.out",
                delay: index * 0.08
              }
            );
          },
          once: true
        });
        triggers.push(trigger);
      });

      return () => {
        triggers.forEach(t => t.kill());
      };
    }
  }, [products.length]);

  const fetchBrandAndProducts = async () => {
    try {
      setLoading(true);

      // Fetch brand details
      const brandsRef = collection(db, "brands");
      const brandSnapshot = await getDocs(brandsRef);
      const brandDoc = brandSnapshot.docs.find((doc) => doc.id === brandId);

      if (brandDoc) {
        setBrand({
          id: brandDoc.id,
          ...brandDoc.data(),
        } as Brand);
      }

      // Fetch products for this brand
      const productsRef = collection(db, "products");
      const q = query(productsRef, where("brandId", "==", brandId));
      const snapshot = await getDocs(q);
      const fetchedProducts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        rating: doc.data().rating || 4.5,
      } as Product));
      // Randomize the display order
      const shuffledProducts = [...fetchedProducts].sort(() => Math.random() - 0.5);
      setProducts(shuffledProducts);
    } catch (error) {
      console.error("Error fetching brand details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen variant="product" />;
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Brand Not Found</h1>
        <p className="text-sm sm:text-base text-gray-400 mb-8">The brand you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate("/")}
          className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm sm:text-base font-semibold transition-all"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-20">
      {/* Header with Brand Info */}
      <div className="relative h-[200px] sm:h-[280px] md:h-[360px] lg:h-[400px] overflow-hidden">
        <img
          src={brand.image}
          alt={brand.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background"></div>

        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-3 sm:top-6 left-3 sm:left-6 z-10 p-2 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Brand Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 md:p-8 z-5">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-5xl mx-auto"
          >
            <h1 className="font-display text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-1 sm:mb-3">
              {brand.name}
            </h1>
            {brand.description && (
              <p className="text-xs sm:text-sm md:text-base text-gray-200 max-w-2xl line-clamp-2 sm:line-clamp-none">
                {brand.description}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Products Section */}
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12 md:py-16">
        {/* Section Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-10 md:mb-12">
          <div>
            <h2 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-1 sm:mb-2">
              Our Collection
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
              {products.length} {products.length === 1 ? "shoe" : "shoes"} available
            </p>
          </div>
          
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-muted-foreground mr-2" />
            </div>
            <input
              type="text"
              placeholder="Search in brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-foreground/5 border border-foreground/10 rounded-full text-sm font-sans focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/50 transition-all"
            />
          </div>
        </div>

        {/* Products Grid */}
        {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
          <div className="text-center py-10 sm:py-16">
            <ShoppingCart className="w-10 h-10 sm:w-16 sm:h-16 text-muted-foreground/50 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-xl font-semibold text-foreground mb-2">
              No Shoes Available
            </h3>
            <p className="text-xs sm:text-base text-muted-foreground mb-4 sm:mb-6">
              This brand doesn't have any shoes in stock yet.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm sm:text-base font-semibold transition-all"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div ref={productsGridRef} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((product) => (
              <div
                key={product.id}
                className="brand-product-card"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandDetail;
