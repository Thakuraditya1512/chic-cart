import React, { useEffect, useRef, useState, useMemo } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Percent, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProductCard from '@/components/ProductCard';
import LoadingScreen from '@/components/LoadingScreen';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  salePrice: number;
  image: string;
  badge?: "new" | "sale" | "trending";
}

const Sale = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [shuffledProducts, setShuffledProducts] = useState<Product[]>([]);

  const { data: saleProducts, isLoading } = useQuery({
    queryKey: ['saleProducts'],
    queryFn: async () => {
      const q = query(
        collection(db, 'products'),
        where('salePrice', '>', 0),
        orderBy('salePrice'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[];
    },
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.sale-animate',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (saleProducts) {
      setShuffledProducts([...saleProducts].sort(() => Math.random() - 0.5));
    }
  }, [saleProducts]);

  const filteredProducts = useMemo(() => {
    return shuffledProducts.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [shuffledProducts, searchQuery]);

  if (isLoading) return <LoadingScreen />;

  return (
    <div ref={containerRef} className="min-h-screen bg-background py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Back Button */}
        <Link
          to="/"
          className="sale-animate inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-sans mb-6"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header & Search */}
        <div className="sale-animate flex flex-col items-center mb-10 sm:mb-14">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 mb-4">
              <Percent size={16} className="text-red-500" />
              <span className="text-xs font-sans font-medium text-red-500 uppercase tracking-wider">
                Limited Time
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
              Sale
            </h1>
            <p className="text-muted-foreground font-sans text-sm sm:text-base max-w-md mx-auto">
              Grab these deals before they're gone. Up to 50% off on selected items.
            </p>
          </div>

          <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search sale items by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-foreground/5 border border-foreground/10 rounded-full text-sm font-sans focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/50 transition-all"
            />
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts && filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className="sale-animate"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="sale-animate text-center py-16">
            <p className="text-muted-foreground font-sans">
              No sale items at the moment. Check back later!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sale;
