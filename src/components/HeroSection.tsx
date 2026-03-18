import { motion } from "framer-motion";
import heroShoes from "@/assets/hero-shoes.jpg";

const ticker = ["New Season", "Fresh Drops", "Every Brand", "Every Style", "Step Into Greatness"];

const HeroSection = () => {
  return (
    <section className="relative w-full h-[52vh] md:h-[68vh] overflow-hidden bg-black">
      {/* Background – video with image fallback */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-80"
        autoPlay
        loop
        muted
        playsInline
        poster={heroShoes}
      >
        {/* drop a real video src here; poster shows while loading / if unsupported */}
        <source src="/hero-reel.mp4" type="video/mp4" />
        <img
          src={heroShoes}
          alt="Premium sneaker collection"
          className="absolute inset-0 w-full h-full object-cover"
          loading="eager"
        />
      </video>

      {/* Cinematic vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

      {/* Thin top rule */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-0 left-0 right-0 h-[1px] bg-white/20 origin-left"
      />

      {/* Corner label – top right */}
      <motion.p
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="absolute top-4 right-4 text-[9px] uppercase tracking-[0.35em] text-white/40 font-mono"
      >
        SS&apos;25 Collection
      </motion.p>

      {/* Main copy */}
      <div className="relative z-10 flex flex-col justify-end h-full pb-10 md:pb-14 px-5 md:px-12 max-w-5xl">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-[10px] md:text-xs uppercase tracking-[0.45em] text-white/50 mb-3 font-mono"
        >
          New Season Drops
        </motion.p>

        {/* Split headline */}
        <div className="overflow-hidden mb-1">
          <motion.h1
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[clamp(2.6rem,10vw,6rem)] font-black text-white leading-[0.9] tracking-tight"
          >
            Step Into
          </motion.h1>
        </div>
        <div className="overflow-hidden mb-5">
          <motion.h1
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[clamp(2.6rem,10vw,6rem)] font-black text-white leading-[0.9] tracking-tight italic"
          >
            Greatness.
          </motion.h1>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="text-white/55 text-sm md:text-base max-w-xs md:max-w-sm leading-relaxed"
        >
          Every brand. Every drop. The freshest kicks curated for you.
        </motion.p>
      </div>

      {/* Scrolling ticker strip */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-white/5 backdrop-blur-sm py-2 overflow-hidden">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="flex whitespace-nowrap"
        >
          {[...ticker, ...ticker].map((t, i) => (
            <span
              key={i}
              className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-mono px-6"
            >
              {t}
              <span className="mx-4 text-white/20">✦</span>
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;