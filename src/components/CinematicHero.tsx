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

  // Intro timer — only on mobile
  useEffect(() => {
    if (!isMobile) return;
    const timer = setTimeout(() => setShowIntro(false), 2200);
    return () => clearTimeout(timer);
  }, [isMobile]);

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

  if (!isMobile) {
    return null;
  }

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden bg-black"
      style={{ height: "85dvh" }}
    >
      <motion.div
        style={{ scale: videoScale }}
        className="absolute inset-0 will-change-transform"
      >
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          x-webkit-airplay="deny"
          onLoadedData={() => setVideoLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: videoLoaded ? 1 : 0,
            transition: "opacity 0.8s ease",
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <source
            src="https://pub-6d3ad6ea0d07489482b17f729ac3c4a8.r2.dev/bn.mp4"
            type="video/mp4"
          />
        </video>

        <div
          className="absolute inset-0 z-10"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.55) 100%)",
          }}
        />
      </motion.div>

      <motion.div
        key={showIntro ? "intro" : "content"}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.9 }}
        className="relative z-20 flex flex-col items-center justify-end h-full text-center px-4 pb-16"
      >
        {!showIntro && (
          <motion.div
            ref={textRef}
            style={{ y: textY, opacity: textOpacity }}
            className="flex flex-col items-center mb-6"
          >
            <h1
              className="text-white leading-none font-normal drop-shadow-2xl mb-3"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(2.2rem, 10vw, 4rem)",
                letterSpacing: "-0.01em",
                textShadow: "0 4px 24px rgba(0,0,0,0.45)",
              }}
            >
              FlexTheKicks
            </h1>
            <p
              className="text-white/80 font-medium drop-shadow-lg"
              style={{
                fontSize: "clamp(9px, 2.5vw, 11px)",
                letterSpacing: "0.42em",
                textTransform: "uppercase",
                fontFamily: "'DM Sans', sans-serif",
                textShadow: "0 2px 10px rgba(0,0,0,0.4)",
              }}
            >
              Spring / Summer 2026 Collection
            </p>
          </motion.div>
        )}
      </motion.div>

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