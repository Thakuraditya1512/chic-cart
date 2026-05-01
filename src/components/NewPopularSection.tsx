import { useState, useEffect, useRef } from "react";
import ProductCard from "@/components/ProductCard";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { Product } from "@/types";
import gsap from "gsap";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

interface Brand {
  id: string;
  name: string;
}

// Custom Sliders Icon — used for Sort By
const SortSlidersIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Top slider line */}
    <line x1="3" y1="5" x2="21" y2="5" />
    {/* Top slider circle handle - positioned at right */}
    <circle cx="16" cy="5" r="2.5" fill="currentColor" stroke="none" />
    <circle cx="16" cy="5" r="2.5" stroke="none" />
    {/* Cover left part of top line with bg - achieved via circle fill */}

    {/* Middle slider line */}
    <line x1="3" y1="12" x2="21" y2="12" />
    {/* Middle slider circle handle - positioned at left */}
    <circle cx="8" cy="12" r="2.5" fill="currentColor" stroke="none" />

    {/* Bottom slider line */}
    <line x1="3" y1="19" x2="21" y2="19" />
    {/* Bottom slider circle handle - positioned at center-right */}
    <circle cx="15" cy="19" r="2.5" fill="currentColor" stroke="none" />
  </svg>
);

const ITEMS_PER_PAGE = 8;

const NewPopularSection = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"default" | "price-low" | "price-high">("default");
  const [showSortPanel, setShowSortPanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const ref = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const brandsRef = collection(db, "brands");
      const brandSnapshot = await getDocs(brandsRef);
      const fetchedBrands = brandSnapshot.docs.map(
        (doc) => ({ id: doc.id, name: doc.data().name } as Brand)
      );
      setBrands(fetchedBrands);

      const productsRef = collection(db, "products");
      const q = query(productsRef, limit(40));
      const productSnapshot = await getDocs(q);
      const fetchedProducts = productSnapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
            rating: doc.data().rating || 4.5,
          } as Product)
      );

      const shuffledProducts = [...fetchedProducts].sort(() => Math.random() - 0.5);
      setProducts(shuffledProducts);
    } catch (error) {
      console.error("Error fetching data:", error);
      setProducts([]);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const brandNames = ["All", ...brands.map((b) => b.name)];

  const filtered = products
    .filter((p) => activeTab === "All" || brands.find((b) => b.id === p.brandId)?.name === activeTab)
    .filter((p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, sortBy]);

  useEffect(() => {
    if (tabsRef.current) {
      const buttons = tabsRef.current.querySelectorAll("button");
      gsap.fromTo(buttons, { scale: 0.95 }, { scale: 1, duration: 0.2, ease: "power2.out" });
    }
  }, [activeTab]);

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  return (
    <section id="categories" ref={ref} className="py-10 sm:py-20 md:py-36 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Heading */}
        <div className="text-center mb-6 sm:mb-12">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-muted-foreground mb-2 sm:mb-4 font-sans"
          >
            Browse Collection
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-2xl sm:text-4xl md:text-6xl font-bold leading-[0.95]"
          >
            New & <span className="italic font-normal">Popular</span>
          </motion.h2>
        </div>

        {/* Filter Tabs + Search + Sort */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 sm:mb-12">
          {/* Brand Tabs */}
          <motion.div
            ref={tabsRef}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex w-full sm:w-auto overflow-x-auto pb-2 scrollbar-hide px-1 -mx-1"
          >
            {brandNames.map((brand) => (
              <button
                key={brand}
                onClick={() => setActiveTab(brand)}
                className={`px-3 sm:px-6 py-1.5 sm:py-2.5 text-[8px] sm:text-[10px] font-sans font-medium uppercase tracking-[0.15em] rounded-full transition-all duration-300 whitespace-nowrap flex-shrink-0 mr-1.5 ${
                  activeTab === brand
                    ? "bg-foreground text-background"
                    : "bg-transparent border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {brand}
              </button>
            ))}
          </motion.div>

          {/* Right controls: Search + Filter icon + Sort */}
          <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
            {/* Search Input */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative flex-1 sm:w-64"
            >
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={14} className="text-muted-foreground" />
              </div>
              <input
                id="shoes-search-input"
                type="text"
                placeholder="Search shoes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                className="w-full pl-9 pr-4 py-2 bg-foreground/5 border border-foreground/10 rounded-full text-sm font-sans focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-foreground/50 transition-all"
              />
            </motion.div>

            {/* Sort Sliders Icon Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.4, delay: 0.35 }}
              onClick={() => setShowSortPanel((v) => !v)}
              title="Sort options"
              className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full border transition-all duration-200 ${
                showSortPanel || sortBy !== "default"
                  ? "bg-foreground text-background border-foreground"
                  : "bg-foreground/5 border-foreground/10 text-foreground hover:border-foreground/30 hover:bg-foreground/10"
              }`}
            >
              <SortSlidersIcon size={16} />
            </motion.button>
          </div>
        </div>

        {/* Sort Panel (slides in below controls) */}
        <AnimatePresence>
          {showSortPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden mb-6"
            >
              <div className="flex flex-wrap gap-2 p-4 rounded-2xl border border-foreground/10 bg-foreground/[0.03]">
                <p className="w-full text-[9px] uppercase tracking-widest text-muted-foreground mb-1 font-sans">
                  Sort by
                </p>
                {(
                  [
                    { value: "default", label: "Default" },
                    { value: "price-low", label: "Price: Low to High" },
                    { value: "price-high", label: "Price: High to Low" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setShowSortPanel(false);
                    }}
                    className={`px-4 py-1.5 text-[9px] sm:text-[10px] font-sans font-medium uppercase tracking-[0.15em] rounded-full border transition-all duration-200 ${
                      sortBy === opt.value
                        ? "bg-foreground text-background border-foreground"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View All Link */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-[10px] text-muted-foreground font-sans">
            {filtered.length > 0 && `${filtered.length} product${filtered.length !== 1 ? "s" : ""}`}
          </p>
          <Link
            to="/products"
            className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            View All Products →
          </Link>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-lg sm:rounded-xl bg-secondary/50 animate-pulse" />
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <p className="text-muted-foreground font-sans text-sm">No products found.</p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
            <AnimatePresence mode="popLayout">
              {paginated.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  layout
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── PAGINATION ── */}
        {!loading && totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center gap-1.5 mt-10 sm:mt-16"
          >
            {/* Prev */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full border border-border text-[10px] sm:text-xs font-sans font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <ChevronLeft size={13} />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, idx) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="w-8 h-8 flex items-center justify-center text-xs text-muted-foreground"
                  >
                    ···
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page as number)}
                    className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-[10px] sm:text-xs font-sans font-medium transition-all duration-200 ${
                      currentPage === page
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/5 border border-transparent hover:border-foreground/10"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            {/* Next */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full border border-border text-[10px] sm:text-xs font-sans font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={13} />
            </button>
          </motion.div>
        )}

        {/* Page info */}
        {!loading && totalPages > 1 && (
          <p className="text-center mt-3 text-[9px] uppercase tracking-widest text-muted-foreground font-sans">
            Page {currentPage} of {totalPages} · {filtered.length} products
          </p>
        )}
      </div>
    </section>
  );
};

export default NewPopularSection;