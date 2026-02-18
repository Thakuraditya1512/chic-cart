import { useState } from "react";
import { products } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import { motion } from "framer-motion";

const tabs = ["All", "Nike", "Adidas", "Jordan", "New Balance", "Puma", "Converse"];

const NewPopularSection = () => {
  const [activeTab, setActiveTab] = useState("All");

  const tabToCategory: Record<string, string> = { "New Balance": "newbalance" };
  const filtered = activeTab === "All"
    ? products
    : products.filter((p) => p.category === (tabToCategory[activeTab] || activeTab.toLowerCase()));

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
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 text-xs font-medium uppercase tracking-wider rounded-full transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Grid */}
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
      </div>
    </section>
  );
};

export default NewPopularSection;
