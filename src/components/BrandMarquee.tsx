import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

interface Brand {
  id: string;
  name: string;
  image: string;
}

const BrandMarquee = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const brandsRef = collection(db, "brands");
      const snapshot = await getDocs(brandsRef);
      const fetched = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Brand)
      );
      setBrands(fetched);
    } catch (e) {
      console.error("Error fetching brands:", e);
    } finally {
      setLoading(false);
    }
  };

  // Fallback brand names if no brands loaded from Firestore
  const fallbackBrands = [
    "NIKE", "ADIDAS", "JORDAN", "NEW BALANCE", "PUMA",
    "CONVERSE", "REEBOK", "VANS",
  ];

  const displayNames =
    brands.length > 0
      ? brands.map((b) => b.name.toUpperCase())
      : fallbackBrands;

  // Double the array for seamless loop
  const marqueeItems = [...displayNames, ...displayNames];

  return (
    <section className="py-6 md:py-8 bg-background border-y border-border overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap">
        {marqueeItems.map((name, i) => (
          <div
            key={`${name}-${i}`}
            onClick={() => {
              const brand = brands.find(
                (b) => b.name.toUpperCase() === name
              );
              if (brand) navigate(`/brand/${brand.id}`);
            }}
            className="flex items-center gap-6 md:gap-10 mx-6 md:mx-10 cursor-pointer group"
          >
            <span className="text-xl md:text-3xl font-display font-bold tracking-tight text-muted-foreground/40 group-hover:text-foreground transition-colors duration-300 whitespace-nowrap">
              {name}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20 flex-shrink-0" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default BrandMarquee;
