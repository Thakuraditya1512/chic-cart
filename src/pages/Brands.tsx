import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LoadingScreen from '@/components/LoadingScreen';

interface Brand {
  id: string;
  name: string;
  logo: string;
  description: string;
  productCount: number;
}

const Brands = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: brands, isLoading } = useQuery({
    queryKey: ['allBrands'],
    queryFn: async () => {
      const q = query(collection(db, 'brands'), orderBy('name'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Brand[];
    },
  });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.brands-animate',
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

  if (isLoading) return <LoadingScreen />;

  return (
    <div ref={containerRef} className="min-h-screen bg-background py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Back Button */}
        <Link
          to="/"
          className="brands-animate inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-sans mb-6"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="brands-animate text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 mb-4">
            <Building2 size={16} className="text-foreground/70" />
            <span className="text-xs font-sans font-medium text-foreground/70 uppercase tracking-wider">
              Premium Partners
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
            Our Brands
          </h1>
          <p className="text-muted-foreground font-sans text-sm sm:text-base max-w-md mx-auto">
            Discover the world's most iconic sneaker brands all in one place.
          </p>
        </div>

        {/* Brands Grid */}
        {brands && brands.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {brands.map((brand, index) => (
              <Link
                key={brand.id}
                to={`/brand/${brand.id}`}
                className="brands-animate group bg-foreground/5 rounded-2xl p-6 sm:p-8 hover:bg-foreground/10 transition-all duration-300"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="aspect-square rounded-xl bg-background flex items-center justify-center mb-4 overflow-hidden">
                  {brand.logo ? (
                    <img
                      src={brand.logo}
                      alt={brand.name}
                      className="w-3/4 h-3/4 object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <span className="font-display text-3xl font-bold text-foreground/20">
                      {brand.name.charAt(0)}
                    </span>
                  )}
                </div>
                <h3 className="font-display text-lg font-bold text-center mb-1">
                  {brand.name}
                </h3>
                <p className="text-xs text-muted-foreground font-sans text-center">
                  {brand.productCount || 0} products
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="brands-animate text-center py-16">
            <p className="text-muted-foreground font-sans">
              No brands available at the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Brands;
