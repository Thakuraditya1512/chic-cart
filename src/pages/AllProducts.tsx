import React, { useEffect, useRef, useState, useMemo } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Grid3X3, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProductCard from '@/components/ProductCard';
import LoadingScreen from '@/components/LoadingScreen';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  brand: string;
  brandId?: string;
  price: number;
  originalPrice?: number;
  salePrice?: number;
  image: string;
  badge?: "new" | "sale" | "trending";
  rating: number;
  sizes?: string[];
  inStock?: boolean;
  createdAt?: any;
}

type SortOption = 'newest' | 'price-low' | 'price-high' | 'name-az' | 'name-za';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'price-low',  label: 'Price: Low → High' },
  { value: 'price-high', label: 'Price: High → Low' },
  { value: 'name-az',    label: 'Name: A → Z' },
  { value: 'name-za',    label: 'Name: Z → A' },
];

// Custom sliders icon (matches your brand icon)
const SortSlidersIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" xmlns="http://www.w3.org/2000/svg">
    <line x1="3" y1="5"  x2="21" y2="5"  />
    <circle cx="16" cy="5"  r="2.5" fill="currentColor" stroke="none" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <circle cx="8"  cy="12" r="2.5" fill="currentColor" stroke="none" />
    <line x1="3" y1="19" x2="21" y2="19" />
    <circle cx="15" cy="19" r="2.5" fill="currentColor" stroke="none" />
  </svg>
);

const ITEMS_PER_PAGE = 10;

const AllProducts = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const initialSearch = new URLSearchParams(location.search).get('search') || '';

  const [searchQuery, setSearchQuery]       = useState(initialSearch);
  const [sortBy, setSortBy]                 = useState<SortOption>('newest');
  const [showSortPanel, setShowSortPanel]   = useState(false);
  const [filterOnSale, setFilterOnSale]     = useState(false);
  const [filterInStock, setFilterInStock]   = useState(false);
  const [currentPage, setCurrentPage]       = useState(1);

  // ── Fetch ALL products (no limit) ──────────────────────────────────────────
  const { data: products, isLoading } = useQuery({
    queryKey: ['allProducts'],
    queryFn: async () => {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Product[];
    },
  });

  // GSAP entrance
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.products-animate',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // Sync search from URL
  useEffect(() => {
    const s = new URLSearchParams(location.search).get('search');
    if (s !== null) setSearchQuery(s);
  }, [location.search]);

  // ── Filter + Sort ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!products) return [];
    let out = products.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filterOnSale)   out = out.filter(p => p.badge === 'sale' || (p.originalPrice && p.originalPrice > p.price));
    if (filterInStock)  out = out.filter(p => p.inStock !== false);

    switch (sortBy) {
      case 'price-low':  out.sort((a, b) => a.price - b.price); break;
      case 'price-high': out.sort((a, b) => b.price - a.price); break;
      case 'name-az':    out.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-za':    out.sort((a, b) => b.name.localeCompare(a.name)); break;
    }
    return out;
  }, [products, searchQuery, sortBy, filterOnSale, filterInStock]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, sortBy, filterOnSale, filterInStock]);

  const getPageNumbers = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '...')[] = [1];
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const activeChips = [
    filterOnSale  && { label: '🏷️ On Sale',  clear: () => setFilterOnSale(false) },
    filterInStock && { label: '✅ In Stock',  clear: () => setFilterInStock(false) },
    sortBy !== 'newest' && { label: `↕ ${SORT_OPTIONS.find(o => o.value === sortBy)?.label}`, clear: () => setSortBy('newest') },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const clearAll = () => {
    setSearchQuery('');
    setFilterOnSale(false);
    setFilterInStock(false);
    setSortBy('newest');
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <div ref={containerRef} className="min-h-screen bg-background py-12 sm:py-16">
      <Helmet>
        <title>All Premium Sneakers - Flex The Kicks</title>
        <meta name="description" content="Browse our entire collection of premium sneakers." />
      </Helmet>

      <div className="container mx-auto px-4 sm:px-6">

        {/* Back */}
        <Link to="/" className="products-animate inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-sans mb-6">
          <ArrowLeft size={16} /> Back to Home
        </Link>

        {/* ── Header ── */}
        <div className="products-animate mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 mb-3">
            <Grid3X3 size={14} className="text-foreground/70" />
            <span className="text-[10px] font-sans font-medium text-foreground/70 uppercase tracking-widest">Full Collection</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold">All Products</h1>
              <p className="text-muted-foreground font-sans text-xs mt-1">
                {filtered.length} of {products?.length || 0} items
                {currentPage > 0 && totalPages > 1 && ` · Page ${currentPage} of ${totalPages}`}
              </p>
            </div>
          </div>
        </div>

        {/* ── Controls Bar ── */}
        <div className="products-animate flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">

          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={14} className="text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search shoes by name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                const url = new URL(window.location.href);
                e.target.value ? url.searchParams.set('search', e.target.value) : url.searchParams.delete('search');
                window.history.replaceState({}, '', url);
              }}
              className="w-full pl-9 pr-4 py-2.5 bg-foreground/5 border border-foreground/10 rounded-full text-sm font-sans focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/40 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setFilterOnSale(v => !v)}
              className={`px-3 sm:px-4 py-2 rounded-full text-[10px] sm:text-xs font-sans font-medium border transition-all duration-200 whitespace-nowrap ${
                filterOnSale
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
              }`}
            >
              🏷️ On Sale
            </button>
            <button
              onClick={() => setFilterInStock(v => !v)}
              className={`px-3 sm:px-4 py-2 rounded-full text-[10px] sm:text-xs font-sans font-medium border transition-all duration-200 whitespace-nowrap ${
                filterInStock
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
              }`}
            >
              ✅ In Stock
            </button>

            {/* Sort icon button */}
            <button
              onClick={() => setShowSortPanel(v => !v)}
              title="Sort options"
              className={`w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-200 flex-shrink-0 ${
                showSortPanel || sortBy !== 'newest'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-foreground/5 border-foreground/10 text-foreground hover:border-foreground/30 hover:bg-foreground/10'
              }`}
            >
              <SortSlidersIcon size={15} />
            </button>
          </div>
        </div>

        {/* ── Sort Panel ── */}
        <AnimatePresence>
          {showSortPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden mb-5"
            >
              <div className="flex flex-wrap gap-2 p-4 rounded-2xl border border-foreground/10 bg-foreground/[0.03]">
                <p className="w-full text-[9px] uppercase tracking-widest text-muted-foreground mb-1 font-sans">Sort by</p>
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortBy(opt.value); setShowSortPanel(false); }}
                    className={`px-4 py-1.5 text-[9px] sm:text-[10px] font-sans font-medium uppercase tracking-[0.15em] rounded-full border transition-all duration-200 ${
                      sortBy === opt.value
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Active chips ── */}
        <AnimatePresence>
          {activeChips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex flex-wrap gap-2 mb-5"
            >
              {activeChips.map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foreground/5 text-[10px] font-medium text-foreground/70 border border-foreground/10"
                >
                  {chip.label}
                  <button onClick={chip.clear} className="hover:text-foreground transition-colors">
                    <X size={10} />
                  </button>
                </span>
              ))}
              <button
                onClick={clearAll}
                className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 ml-1"
              >
                Clear all
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Products Grid ── */}
        {paginated.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4 md:gap-5"
          >
            <AnimatePresence mode="popLayout">
              {paginated.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.025, duration: 0.35 }}
                  layout
                  className="products-animate"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="products-animate text-center py-20">
            <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-4">
              <Search size={22} className="text-muted-foreground/30" />
            </div>
            <p className="text-foreground font-semibold mb-1">No products found</p>
            <p className="text-muted-foreground font-sans text-sm mb-5">Try adjusting your search or filters</p>
            <button
              onClick={clearAll}
              className="text-xs font-bold uppercase tracking-wider text-foreground underline underline-offset-4"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="flex items-center justify-center gap-1.5 mt-12 sm:mt-16"
            >
              {/* Prev */}
              <button
                onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={currentPage === 1}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full border border-border text-[10px] sm:text-xs font-sans font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft size={13} />
                <span className="hidden sm:inline">Prev</span>
              </button>

              {/* Numbers */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, idx) =>
                  page === '...' ? (
                    <span key={`e-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground">···</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => { setCurrentPage(page as number); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-[10px] sm:text-xs font-sans font-medium transition-all duration-200 ${
                        currentPage === page
                          ? 'bg-foreground text-background'
                          : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5 border border-transparent hover:border-foreground/10'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              {/* Next */}
              <button
                onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full border border-border text-[10px] sm:text-xs font-sans font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={13} />
              </button>
            </motion.div>

            <p className="text-center mt-3 text-[9px] uppercase tracking-widest text-muted-foreground font-sans">
              Page {currentPage} of {totalPages} · {filtered.length} products
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AllProducts;