import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";

const ShoeShowcase = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const imageRotate = useTransform(scrollYProgress, [0, 0.5, 1], [-5, 0, 5]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.9]);

  return (
    <section
      id="showcase"
      ref={sectionRef}
      className="relative py-24 md:py-40 bg-background text-foreground overflow-hidden noise-bg transition-colors duration-300"
    >
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-500/10 blur-[120px] animate-glow-pulse" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/8 blur-[100px] animate-glow-pulse" style={{ animationDelay: '1.5s' }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          {/* Left: Text */}
          <div>
            <motion.p
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-foreground/50 mb-4 font-sans"
            >
              Exclusive Release
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-[0.95] mb-6"
            >
              Crafted for
              <br />
              <span className="italic font-normal text-muted-foreground">
                Perfection
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-foreground/60 text-sm md:text-base max-w-md mb-8 leading-relaxed font-sans font-light"
            >
              Every stitch tells a story. Premium materials meet cutting-edge
              design in our most anticipated drop of the season.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center gap-8"
            >
              <a
                href="#new"
                className="btn-glow inline-flex items-center px-8 py-3.5 bg-foreground text-background font-sans font-semibold text-xs uppercase tracking-[0.15em] hover:bg-foreground/90 transition-colors rounded-full"
              >
                Shop Now
              </a>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-background border-2 border-border flex items-center justify-center text-[10px] text-foreground/60 font-sans"
                    >
                      {["A", "K", "J"][i - 1]}
                    </div>
                  ))}
                </div>
                <p className="text-foreground/60 text-xs font-sans">
                  2.4k+ Reviews
                </p>
              </div>
            </motion.div>

            {/* Feature badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-12 flex gap-6 md:gap-10"
            >
              {[
                { label: "Premium\nMaterials", value: "100%" },
                { label: "Comfort\nRating", value: "9.8" },
                { label: "Hand\nCrafted", value: "✓" },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
                    {item.value}
                  </p>
                  <p className="text-[10px] text-foreground/50 uppercase tracking-wider font-sans whitespace-pre-line leading-tight">
                    {item.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Floating Shoe Image */}
          <motion.div
            ref={imageRef}
            style={{ y: imageY, rotate: imageRotate, scale }}
            className="relative flex items-center justify-center"
          >
            {/* Ambient ring */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[80%] h-[80%] rounded-full border border-foreground/10" />
              <div className="absolute w-[60%] h-[60%] rounded-full border border-foreground/10" />
            </div>

            <motion.div
              className="relative z-10 w-full max-w-lg rounded-3xl overflow-hidden drop-shadow-2xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <video
                src="/wb.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-auto object-cover"
              />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ShoeShowcase;
