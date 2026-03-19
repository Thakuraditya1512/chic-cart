import { useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const ShoeShowcase = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  // GSAP scroll animations
  useEffect(() => {
    if (!sectionRef.current || !imageRef.current) return;

    const triggers: ScrollTrigger[] = [];

    // Image parallax effect
    const imgTrigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top bottom",
      end: "bottom top",
      scrub: 1,
      onUpdate: (self) => {
        if (imageRef.current) {
          gsap.to(imageRef.current, {
            y: self.progress * -80,
            rotation: (self.progress - 0.5) * 6,
            scale: 0.9 + self.progress * 0.1,
            duration: 0.1,
          });
        }
      },
    });
    triggers.push(imgTrigger);

    // Text reveal
    if (textRef.current) {
      gsap.fromTo(
        textRef.current.children,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: textRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }

    return () => {
      triggers.forEach(t => t.kill());
    };
  }, []);

  return (
    <section
      id="showcase"
      ref={sectionRef}
      className="relative py-20 sm:py-24 md:py-40 bg-background text-foreground overflow-hidden noise-bg transition-colors duration-300"
    >
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] rounded-full bg-purple-500/10 blur-[80px] sm:blur-[120px] animate-glow-pulse" />
      <div className="absolute top-1/3 right-1/4 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] rounded-full bg-cyan-500/8 blur-[60px] sm:blur-[100px] animate-glow-pulse hidden sm:block" style={{ animationDelay: '1.5s' }} />

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 md:gap-20 items-center">
          {/* Left: Text */}
          <div ref={textRef}>
            <motion.p
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-[11px] sm:text-xs md:text-sm uppercase tracking-[0.35em] text-foreground/80 mb-3 sm:mb-4 font-sans font-bold"
            >
              Exclusive Release
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-[0.95] sm:leading-[0.95] mb-4 sm:mb-6"
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
              className="text-foreground/60 text-sm md:text-base max-w-md mb-6 sm:mb-8 leading-relaxed font-sans font-light"
            >
              Every stitch tells a story. Premium materials meet cutting-edge
              design in our most anticipated drop of the season.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8"
            >
              <a
                href="#new"
                className="btn-glow inline-flex items-center px-6 sm:px-8 py-3 sm:py-3.5 bg-foreground text-background font-sans font-semibold text-[10px] sm:text-xs uppercase tracking-[0.15em] hover:bg-foreground/90 transition-colors rounded-full"
              >
                Shop Now
              </a>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-background border-2 border-border flex items-center justify-center text-[9px] sm:text-[10px] text-foreground/60 font-sans"
                    >
                      {["A", "K", "J"][i - 1]}
                    </div>
                  ))}
                </div>
                <p className="text-foreground/60 text-xs sm:text-sm font-sans">
                  2.4k+ Reviews
                </p>
              </div>
            </motion.div>

            {/* Feature badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="mt-8 sm:mt-12 flex gap-4 sm:gap-6 md:gap-10"
            >
              {[
                { label: "Premium\nMaterials", value: "100%" },
                { label: "Comfort\nRating", value: "9.8" },
                { label: "Hand\nCrafted", value: "✓" },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <p className="text-xl sm:text-2xl md:text-3xl font-display font-bold text-foreground mb-1">
                    {item.value}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-foreground/50 uppercase tracking-wider font-sans whitespace-pre-line leading-tight">
                    {item.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Floating Shoe Image */}
          <motion.div
            ref={imageRef}
            className="relative flex items-center justify-center order-first md:order-last"
          >
            {/* Ambient ring */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[70%] sm:w-[80%] h-[70%] sm:h-[80%] rounded-full border border-foreground/10" />
              <div className="absolute w-[50%] sm:w-[60%] h-[50%] sm:h-[60%] rounded-full border border-foreground/10" />
            </div>

            <motion.div
              className="relative z-10 w-full max-w-sm sm:max-w-lg rounded-3xl overflow-hidden drop-shadow-2xl"
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
