import { motion } from "framer-motion";
import heroBanner from "@/assets/hero-banner.jpg";

const HeroSection = () => {
  return (
    <section className="relative w-full h-[70vh] md:h-[85vh] overflow-hidden bg-secondary">
      <img
        src={heroBanner}
        alt="Hero fashion"
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />
      <div className="absolute inset-0 bg-[hsl(var(--overlay))]" />
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-sm md:text-base uppercase tracking-[0.3em] text-sale-foreground/80 mb-4"
        >
          New Season Collection
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-display text-4xl md:text-7xl font-bold text-sale-foreground mb-6 leading-tight"
        >
          Define Your
          <br />
          Style
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-sale-foreground/70 text-base md:text-lg mb-8 max-w-md"
        >
          Discover curated collections crafted for the modern individual
        </motion.p>
        <motion.a
          href="#categories"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="inline-flex items-center px-8 py-3.5 bg-sale-foreground text-foreground font-medium text-sm uppercase tracking-widest hover:opacity-90 transition-opacity rounded-sm"
        >
          Shop Now
        </motion.a>
      </div>
    </section>
  );
};

export default HeroSection;
