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
  const [isMobile, setIsMobile] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  // Detect mobile on mount
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Video playback — only on mobile
  useEffect(() => {
    if (!isMobile) return;

    const vid = videoRef.current;
    if (!vid) return;

    vid.playbackRate = 0.85;

    const tryPlay = () => {
      vid.play().catch((e) => console.log("Autoplay prevented:", e));
    };

    if (vid.readyState >= 3) {
      tryPlay();
    } else {
      vid.addEventListener("canplaythrough", tryPlay, { once: true });
    }

    return () => vid.removeEventListener("canplaythrough", tryPlay);
  }, [isMobile]);

  // Intro timer — all devices
  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  // GSAP text reveal — mobile only
  useEffect(() => {
    if (!isMobile || showIntro || !textRef.current) return;

    gsap.fromTo(
      textRef.current,
      { opacity: 0, y: 50, scale: 0.96 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.1,
        ease: "power3.out",
        delay: 0.2,
        clearProps: "all",
      }
    );
  }, [showIntro, isMobile]);

  // Scroll indicator bounce — mobile only
  useEffect(() => {
    if (!isMobile || showIntro || !scrollIndicatorRef.current) return;

    const anim = gsap.to(scrollIndicatorRef.current, {
      y: 7,
      duration: 0.9,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut",
    });

    return () => { anim.kill(); };
  }, [showIntro, isMobile]);

  // if (!isMobile) {
  //   return null;
  // }

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden bg-black h-screen"
    >
      <motion.div
        style={{ scale: videoScale }}
        className="absolute inset-0 will-change-transform"
      >
        {isMobile ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: videoLoaded ? 1 : 0,
              transition: "opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            onLoadedData={() => setVideoLoaded(true)}
          >
            <source
              src="https://pub-6d3ad6ea0d07489482b17f729ac3c4a8.r2.dev/bn.mp4"
              type="video/mp4"
            />
          </video>
        ) : (
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center"
            style={{ 
              backgroundImage: 'url("https://th.bing.com/th/id/R.63bb611cf511fd604dd6b5cb7bcbcc23?rik=E8ov2QAILw%2bAfw&riu=http%3a%2f%2fwallpapercave.com%2fwp%2ftjeKBs2.jpg&ehk=6rhUYwTn8J9n5nX1oADbKnVyGedq7Q6lgD45H3Taz6I%3d&risl=&pid=ImgRaw&r=0")',
              filter: 'brightness(0.6)'
            }}
          />
        )}

        {/* Cinematic Overlays */}
        <div className="absolute inset-0 z-10 bg-black/20" />
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
      </motion.div>

      <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4">
        {!showIntro && (
          <motion.div
            ref={textRef}
            className="flex flex-col items-center max-w-[90vw]"
            style={{ y: textY, opacity: textOpacity }}
          >
            {/* Unique character-by-character reveal for Brand name */}
            {/* <h1 className="flex flex-wrap justify-center mb-4 sm:mb-8 overflow-hidden">
              {"FlexTheKicks".split("").map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ y: 200, opacity: 0, filter: "blur(20px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  transition={{ 
                    duration: 1.2, 
                    delay: index * 0.05, 
                    ease: [0.16, 1, 0.3, 1] 
                  }}
                  className="text-white inline-block font-normal"
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: "clamp(3.5rem, 18vw, 12rem)",
                    letterSpacing: "-0.05em",
                    textShadow: "0 20px 80px rgba(0,0,0,0.8)",
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </h1> */}
            
            <motion.div 
              initial={{ opacity: 0, letterSpacing: "0.2em" }}
              animate={{ opacity: 1, letterSpacing: "0.6em" }}
              transition={{ duration: 2, delay: 1, ease: "easeOut" }}
              className="relative mb-12"
            >
              <p
                className="text-white/80 font-black uppercase"
                style={{
                  fontSize: "clamp(9px, 1.2vw, 12px)",
                  fontFamily: "'DM Sans', sans-serif",
                  textShadow: "0 4px 10px rgba(0,0,0,0.4)",
                }}
              >
                The Ultimate Sneaker Destination
              </p>
              <motion.div 
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-[2px] bg-white/30" 
                initial={{ width: 0 }}
                animate={{ width: 48 }}
                transition={{ duration: 1, delay: 1.5 }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1, ease: "easeOut" }}
              className="mt-12"
            >
              <button 
                onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-3.5 bg-white text-black font-bold uppercase tracking-widest text-[11px] rounded-full hover:bg-white/90 hover:scale-105 transition-all duration-300 shadow-[0_20px_40px_-10px_rgba(255,255,255,0.3)]"
              >
                Explore Collection
              </button>
            </motion.div>
          </motion.div>
        )}
      </div>

      {!showIntro && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.9 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5"
        >
          <span
            className="text-white/55 drop-shadow-lg"
            style={{
              fontSize: "9px",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Scroll
          </span>
          <div ref={scrollIndicatorRef}>
            <ChevronDown size={14} className="text-white/55 drop-shadow-lg" />
          </div>
        </motion.div>
      )}
    </section>
  );
};

export default CinematicHero;