import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";

const PremiumCTA = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <section
      ref={sectionRef}
      className="relative py-32 md:py-48 overflow-hidden bg-black text-white"
    >
      {/* Background Image with Parallax */}
      <motion.div style={{ y: bgY }} className="absolute inset-0">
        <img
          src="/shoe-editorial.png"
          alt="Premium collection"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
      </motion.div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

      {/* Grain texture */}
      <div className="absolute inset-0 grain-overlay" />

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl">
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-white/40 mb-6 font-sans"
          >
            Limited Time Offer
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.8,
              delay: 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="font-display text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.9] mb-6"
          >
            Up to
            <br />
            <span className="italic font-normal text-white/80">40% Off</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/40 text-sm md:text-base max-w-md mb-10 font-sans font-light leading-relaxed"
          >
            Don't miss our seasonal sale. Iconic kicks from top brands
            at prices that won't last. Grab yours before they're gone.
          </motion.p>

          <motion.a
            href="#new"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ scale: 1.03, x: 5 }}
            whileTap={{ scale: 0.97 }}
            className="btn-glow inline-flex items-center gap-3 px-10 py-4 bg-white text-black font-sans font-semibold text-xs uppercase tracking-[0.15em] rounded-full group"
          >
            Shop the Sale
            <ArrowRight
              size={14}
              className="transition-transform group-hover:translate-x-1"
            />
          </motion.a>
        </div>
      </div>
    </section>
  );
};

export default PremiumCTA;
