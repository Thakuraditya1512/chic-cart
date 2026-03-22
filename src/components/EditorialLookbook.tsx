import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const EditorialLookbook = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-60px" });

  const cards = [
    {
      image: "https://pub-6d3ad6ea0d07489482b17f729ac3c4a8.r2.dev/shoe-hero.png",
      title: "Urban Edge",
      subtitle: "Street-ready performance",
      tag: "01",
      // Desktop: large hero card spanning 2 cols × 2 rows
      gridClass: "md:col-span-2 md:row-span-2",
      mobileOrder: "order-1",
    },
    {
      image: "https://pub-6d3ad6ea0d07489482b17f729ac3c4a8.r2.dev/shoe-dark.png",
      title: "Midnight Run",
      subtitle: "Stealth meets comfort",
      tag: "02",
      gridClass: "",
      mobileOrder: "order-2",
    },
    {
      image: "https://pub-6d3ad6ea0d07489482b17f729ac3c4a8.r2.dev/shoe-editorial.png",
      title: "Dual Tone",
      subtitle: "Light & shadow collection",
      tag: "03",
      gridClass: "",
      mobileOrder: "order-3",
    },
    // {
    //   image: "/shoe-white.png",
    //   title: "Clean Break",
    //   subtitle: "Minimal. Timeless.",
    //   tag: "04",
    //   gridClass: "md:col-span-2",
    //   mobileOrder: "order-4",
    // },
  ];

  return (
    <section ref={sectionRef} className="py-20 md:py-36 bg-background overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-20">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55 }}
              className="text-[10px] uppercase tracking-[0.45em] text-muted-foreground mb-3 font-mono"
            >
              Editorial · SS&apos;25
            </motion.p>
            <div className="overflow-hidden">
              <motion.h2
                initial={{ y: "100%" }}
                animate={isInView ? { y: 0 } : {}}
                transition={{ duration: 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="font-display text-[clamp(2.8rem,8vw,6.5rem)] font-black leading-[0.92] tracking-tight"
              >
                The
                <span className="italic font-light"> Lookbook</span>
              </motion.h2>
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-muted-foreground text-sm max-w-[22ch] leading-relaxed md:text-right hidden md:block"
          >
            Curated drops for those who move differently.
          </motion.p>
        </div>

        {/* ── Mobile: horizontal scroll strip ── */}
        <div className="flex md:hidden gap-3 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-none">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, x: 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex-none w-[72vw] aspect-[3/4] rounded-2xl overflow-hidden snap-start cursor-pointer group"
            >
              <img
                src={card.image}
                alt={card.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

              {/* Tag chip */}
              <span className="absolute top-4 left-4 text-[9px] font-mono uppercase tracking-[0.35em] text-white/50 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full">
                {card.tag}
              </span>

              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-[9px] uppercase tracking-[0.35em] text-white/50 mb-1 font-mono">
                  {card.subtitle}
                </p>
                <h3 className="text-xl font-display font-black text-white leading-tight">
                  {card.title}
                </h3>
              </div>

              {/* Hover rule */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            </motion.div>
          ))}
        </div>

        {/* ── Desktop: asymmetric grid ── */}
        <div className="hidden md:grid md:grid-cols-4 md:grid-rows-[380px_220px] gap-4">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 60 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.85,
                delay: 0.15 + i * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ scale: 1.015 }}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer ${card.gridClass}`}
            >
              <img
                src={card.image}
                alt={card.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />

              {/* Base gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-500" />

              {/* Side accent line */}
              <div className="absolute top-6 bottom-6 left-0 w-[2px] bg-white/0 group-hover:bg-white/30 transition-colors duration-500 rounded-r-full" />

              {/* Tag chip */}
              <span className="absolute top-5 left-5 text-[9px] font-mono uppercase tracking-[0.35em] text-white/60 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
                {card.tag}
              </span>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 translate-y-1 group-hover:translate-y-0 transition-transform duration-500">
                <p className="text-[9px] uppercase tracking-[0.4em] text-white/45 mb-1.5 font-mono">
                  {card.subtitle}
                </p>
                <h3 className="text-xl md:text-2xl font-display font-black text-white leading-tight">
                  {card.title}
                </h3>
              </div>

              {/* Bottom rule reveal */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </motion.div>
          ))}
        </div>

        {/* ── Footer row ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-10 md:mt-14 flex items-center justify-between border-t border-border pt-6"
        >
          <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-mono">
            {cards.length} Styles
          </p>
          <button className="text-[10px] uppercase tracking-[0.4em] text-foreground font-mono flex items-center gap-2 group hover:opacity-60 transition-opacity">
            View All
            <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default EditorialLookbook;