import { categories } from "@/data/products";
import { motion } from "framer-motion";

const CategoriesGrid = () => {
  return (
    <section id="categories" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Shop by Category
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Explore our curated collections
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
          {categories.map((cat, i) => (
            <motion.a
              key={cat.id}
              href={`#${cat.id}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer"
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover image-zoom group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0,0%,0%/0.6)] to-transparent" />
              <div className="absolute bottom-0 left-0 p-4 md:p-6">
                <h3 className="text-lg md:text-xl font-semibold text-sale-foreground">
                  {cat.name}
                </h3>
                <p className="text-sale-foreground/70 text-xs md:text-sm mt-1">
                  {cat.count} items
                </p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesGrid;
