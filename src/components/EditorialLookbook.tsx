import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const EditorialLookbook = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  const cards = [
    {
      image: "/shoe-hero.png",
      title: "Urban Edge",
      subtitle: "Street-ready performance",
      span: "md:col-span-2 md:row-span-2",
      aspect: "aspect-[4/5] md:aspect-auto md:h-full",
    },
    {
      image: "/shoe-dark.png",
      title: "Midnight Run",
      subtitle: "Stealth meets comfort",
      span: "",
      aspect: "aspect-square",
    },
    {
      image: "/shoe-editorial.png",
      title: "Dual Tone",
      subtitle: "Light & shadow collection",
      span: "",
      aspect: "aspect-square",
    },
  ];

  return (
    <section ref={sectionRef} className="py-24 md:py-36 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 md:mb-24">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-[10px] md:text-xs uppercase tracking-[0.4em] text-muted-foreground mb-4 font-sans"
          >
            Editorial
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-[0.95]"
          >
            The
            <span className="italic font-normal"> Lookbook</span>
          </motion.h2>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-4 gap-3 md:gap-4 md:grid-rows-2 md:auto-rows-[300px]">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.8,
                delay: 0.2 + i * 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`group relative overflow-hidden rounded-xl cursor-pointer ${card.span} ${card.aspect}`}
            >
              <img
                src={card.image}
                alt={card.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-1 font-sans">
                  {card.subtitle}
                </p>
                <h3 className="text-xl md:text-2xl font-display font-bold text-white">
                  {card.title}
                </h3>
              </div>

              {/* Hover reveal line */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EditorialLookbook;
