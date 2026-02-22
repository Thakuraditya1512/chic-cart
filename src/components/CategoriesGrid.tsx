import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

interface Brand {
  id: string;
  name: string;
  image: string;
  description?: string;
}

const CategoriesGrid = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const brandsRef = collection(db, "brands");
      const snapshot = await getDocs(brandsRef);
      const fetchedBrands = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Brand));
      setBrands(fetchedBrands);
    } catch (error) {
      console.error("Error fetching brands:", error);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section id="categories" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Shop by Brand
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Loading your favorite sneaker brands...
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
            {[...Array(6)].map((_, i) => (
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

  if (brands.length === 0) {
    return (
      <section id="categories" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Shop by Brand
            </h2>
            <p className="text-muted-foreground text-sm md:text-base">
              No brands available yet. Check back soon!
            </p>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section id="categories" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Shop by Brand
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Your favorite sneaker brands, all in one place
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {brands.map((brand, i) => (
            <motion.div
              key={brand.id}
              onClick={() => navigate(`/brand/${brand.id}`)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer"
            >
              <img
                src={brand.image}
                alt={brand.name}
                className="absolute inset-0 w-full h-full object-cover image-zoom group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0,0%,0%/0.6)] to-transparent" />
              <div className="absolute bottom-0 left-0 p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-semibold text-sale-foreground">
                  {brand.name}
                </h3>
                {brand.description && (
                  <p className="text-sale-foreground/70 text-xs md:text-sm mt-1">
                    {brand.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesGrid;
