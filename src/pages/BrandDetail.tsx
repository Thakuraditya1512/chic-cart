import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (brandId) {
      fetchBrandAndProducts();
    }
  }, [brandId]);

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
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching brand details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading brand...</p>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl font-bold text-foreground mb-4">Brand Not Found</h1>
        <p className="text-gray-400 mb-8">The brand you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold transition-all"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header with Brand Info */}
      <div className="relative h-[250px] sm:h-[300px] md:h-[400px] overflow-hidden">
        <img
          src={brand.image}
          alt={brand.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background"></div>

        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 sm:top-6 left-4 sm:left-6 z-10 p-2 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Brand Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 z-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto"
          >
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-3">
              {brand.name}
            </h1>
            {brand.description && (
              <p className="text-sm sm:text-base text-gray-200 max-w-2xl">
                {brand.description}
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Products Section */}
      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
        {/* Section Header */}
        <div className="mb-8 sm:mb-12">
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">
            Our Collection
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {products.length} {products.length === 1 ? "shoe" : "shoes"} available
          </p>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              No Shoes Available
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-6">
              This brand doesn't have any shoes in stock yet.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm sm:text-base font-semibold transition-all"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandDetail;
