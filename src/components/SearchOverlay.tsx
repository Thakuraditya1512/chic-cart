import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { products } from "@/data/products";
import { Product } from "@/types";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const SearchOverlay = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    if (query.trim()) {
      const q = query.toLowerCase();
      setResults(products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)));
    } else {
      setResults([]);
    }
  }, [query]);

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <Search size={20} className="text-muted-foreground flex-shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="flex-1 text-base bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
            <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {query && results.length === 0 && (
              <p className="text-muted-foreground text-sm text-center mt-8">No results for "{query}"</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {results.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  onClick={onClose}
                  className="group"
                >
                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-secondary mb-2">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground line-clamp-2">{product.name}</h3>
                  <p className="text-sm font-semibold text-foreground mt-0.5">₹{product.price.toLocaleString('en-IN')}</p>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay;
