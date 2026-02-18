import { motion } from "framer-motion";

const SaleBanner = () => {
  return (
    <section id="sale" className="py-16 md:py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs md:text-sm uppercase tracking-[0.4em] mb-4 opacity-70">
            Limited Time Only
          </p>
          <h2 className="font-display text-4xl md:text-6xl font-bold mb-4">
            Up to 40% Off
          </h2>
          <p className="text-base md:text-lg opacity-80 mb-8 max-w-lg mx-auto">
            Don't miss our seasonal sneaker sale. Iconic kicks at unbeatable prices.
          </p>
          <a
            href="#new"
            className="inline-flex items-center px-8 py-3.5 bg-primary-foreground text-primary font-medium text-sm uppercase tracking-widest hover:opacity-90 transition-opacity rounded-sm"
          >
            Shop Sale
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default SaleBanner;
