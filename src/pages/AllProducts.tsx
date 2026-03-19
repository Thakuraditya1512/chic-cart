import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Grid3X3, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
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
  badge?: string;
}

const AllProducts = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ['allProducts'],
    queryFn: async () => {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
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
        '.products-animate',
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
          className="products-animate inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-sans mb-6"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="products-animate flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 mb-3">
              <Grid3X3 size={16} className="text-foreground/70" />
              <span className="text-xs font-sans font-medium text-foreground/70 uppercase tracking-wider">
                Full Collection
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold">
              All Products
            </h1>
            <p className="text-muted-foreground font-sans text-sm mt-1">
              {products?.length || 0} items available
            </p>
          </div>

          <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-foreground/20 rounded-lg text-sm font-sans hover:bg-foreground/5 transition-colors">
            <Filter size={16} />
            Filter
          </button>
        </div>

        {/* Products Grid */}
        {products && products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="products-animate"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="products-animate text-center py-16">
            <p className="text-muted-foreground font-sans">
              No products available at the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllProducts;
