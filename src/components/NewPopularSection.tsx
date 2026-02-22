import { useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import { motion } from "framer-motion";
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch brands
      const brandsRef = collection(db, "brands");
      const brandSnapshot = await getDocs(brandsRef);
      const fetchedBrands = brandSnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      } as Brand));
      setBrands(fetchedBrands);

      // Fetch products
      const productsRef = collection(db, "products");
      const productSnapshot = await getDocs(productsRef);
      const fetchedProducts = productSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        rating: doc.data().rating || 4.5,
      } as Product));
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("Error fetching data:", error);
      setProducts([]);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  // Get unique brand names from products for tabs
  const brandNames = ["All", ...brands.map((b) => b.name)];

  const filtered =
    activeTab === "All"
      ? products
      : products.filter(
          (p) =>
            brands.find((b) => b.id === p.brandId)?.name === activeTab
        );

  if (loading) {
    return (
      <section id="new" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              New & Popular
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Fresh arrivals and customer favorites
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-lg bg-secondary/50 animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="new" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            New & Popular
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Fresh arrivals and customer favorites
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide">
          {brandNames.map((brand) => (
            <button
              key={brand}
              onClick={() => setActiveTab(brand)}
              className={`px-5 py-2 text-xs font-medium uppercase tracking-wider rounded-full transition-colors whitespace-nowrap ${
                activeTab === brand
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {brand}
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No products available for this brand.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {filtered.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                layout
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

export default NewPopularSection;
