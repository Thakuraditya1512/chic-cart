import React, { useEffect, useRef, useState, useMemo } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Sparkles, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProductCard from '@/components/ProductCard';
import LoadingScreen from '@/components/LoadingScreen';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  salePrice?: number;
  image: string;
  badge?: "new" | "sale" | "trending";
  isNew?: boolean;
}

const NewDrops = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [shuffledProducts, setShuffledProducts] = useState<Product[]>([]);

  const { data: newProducts, isLoading } = useQuery({
    queryKey: ['newDrops'],
    queryFn: async () => {
      const q = query(
        collection(db, 'products'),
        where('isNew', '==', true),
        orderBy('createdAt', 'desc'),
        limit(20)
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
        '.newdrops-animate',
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
    if (newProducts) {
      setShuffledProducts([...newProducts].sort(() => Math.random() - 0.5));
    }
  }, [newProducts]);

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
          className="newdrops-animate inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-sans mb-6"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header & Search */}
        <div className="newdrops-animate flex flex-col items-center mb-10 sm:mb-14">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 mb-4">
              <Sparkles size={16} className="text-foreground/70" />
              <span className="text-xs font-sans font-medium text-foreground/70 uppercase tracking-wider">
                Just Arrived
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
              New Drops
            </h1>
            <p className="text-muted-foreground font-sans text-sm sm:text-base max-w-md mx-auto">
              Be the first to cop the freshest releases. Limited quantities available.
            </p>
          </div>

          <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search new drops by name..."
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
                className="newdrops-animate"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="newdrops-animate text-center py-16">
            <p className="text-muted-foreground font-sans">
              No new drops at the moment. Check back soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewDrops;
