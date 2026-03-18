import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const CinematicHero = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const textRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

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
      videoRef.current.play().catch(e => console.log("Autoplay prevented:", e));
    }

    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // GSAP text reveal animation
  useEffect(() => {
    if (!showIntro && textRef.current) {
      gsap.fromTo(
        textRef.current,
        { opacity: 0, y: 60, scale: 0.95 },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          duration: 1.2, 
          ease: "power3.out",
          delay: 0.3
        }
      );
    }
  }, [showIntro]);

  // Scroll indicator bounce animation
  useEffect(() => {
    if (!showIntro && scrollIndicatorRef.current) {
      gsap.to(scrollIndicatorRef.current, {
        y: 8,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut"
      });
    }
  }, [showIntro]);

  return (
    <section
      ref={containerRef}
      className="relative w-full h-[100dvh] overflow-hidden bg-black"
    >
      {/* Hero Background - Video on Mobile, Image on Large Screens */}
      <motion.div style={{ scale: videoScale }} className="absolute inset-0">
        {/* Video for mobile/small screens */}
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          className={`md:hidden absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoaded ? "opacity-100" : "opacity-0"
          }`}
        >
          <source src="/bn.mp4" type="video/mp4" />
        </video>

        {/* Image for large screens */}
        <div 
          className="hidden md:block absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-opacity duration-1000 opacity-100"
          style={{ 
            backgroundImage: `url('https://images6.alphacoders.com/138/1381562.jpg')`,
          }}
        />
        
        <div className="absolute inset-0 bg-black/20 z-10" />
      </motion.div>

      {/* Intro Sequence vs Content */}
      <motion.div
        key={showIntro ? "intro" : "content"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
        className="relative z-20 flex flex-col items-center justify-end h-full text-center px-4 pb-24 sm:pb-32 md:pb-24"
      >
        {!showIntro && (
          <motion.div
            ref={textRef}
            style={{ y: textY, opacity: textOpacity }}
            className="flex flex-col items-center justify-center mb-6"
          >
            <h1 className="font-cursive text-[3rem] sm:text-[4.5rem] md:text-7xl text-white leading-none font-normal drop-shadow-2xl mb-4">
              FlexTheKicks
            </h1>
            <p className="text-[10px] sm:text-xs md:text-sm uppercase tracking-[0.4em] text-white/80 font-sans font-medium drop-shadow-lg max-w-xs sm:max-w-md">
              Spring / Summer 2026 Collection
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* Scroll indicator */}
      {!showIntro && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        >
          <span className="text-white/60 drop-shadow-lg text-[10px] uppercase tracking-[0.3em] font-sans font-medium">
            Scroll
          </span>
          <div ref={scrollIndicatorRef}>
            <ChevronDown size={16} className="text-white/60 drop-shadow-lg" />
          </div>
        </motion.div>
      )}
    </section>
  );
};

export default CinematicHero;
