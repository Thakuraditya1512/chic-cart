import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const CinematicHero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.8], [0.3, 0.7]);

  // Handle intro sequence
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.8;
      // Force play to ensure videos start immediately on most browsers
      videoRef.current.play().catch(e => console.log("Autoplay prevented:", e));
    }

    // Hide intro after 2.5 seconds
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[100vh] overflow-hidden bg-black"
    >
      {/* Video Background - 100% visible and unblurred */}
      <motion.div style={{ scale: videoScale }} className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? "opacity-100" : "opacity-0"
            }`}
        >
          <source src="/bn.mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* Intro Sequence vs Content */}
      <AnimatePresence mode="wait">
        {showIntro ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          >
            <h1 className="font-cursive text-7xl sm:text-[8rem] md:text-[10rem] text-white leading-none font-normal drop-shadow-2xl">
              FlexTheKicks
            </h1>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            style={{ y: textY, opacity: textOpacity }}
            className="relative z-20 flex flex-col items-center justify-end h-full text-center px-4 pb-24"
          >
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center justify-center mb-6"
            >
              <h1 className="font-cursive text-5xl sm:text-6xl md:text-7xl text-white leading-none font-normal drop-shadow-2xl mb-4">
                FlexTheKicks
              </h1>
              <p className="text-xs md:text-sm uppercase tracking-[0.4em] text-white/80 font-sans font-medium drop-shadow-lg drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">
                Spring / Summer 2026 Collection
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll indicator */}
      {!showIntro && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        >
          <span className="text-white/60 drop-shadow-lg text-[10px] uppercase tracking-[0.3em] font-sans font-medium">
            Scroll
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown size={16} className="text-white/60 drop-shadow-lg" />
          </motion.div>
        </motion.div>
      )}
    </section>
  );
};

export default CinematicHero;
