import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface LoadingScreenProps {
  variant?: 'default' | 'product';
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ variant = 'default' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ftkRef = useRef<HTMLDivElement>(null);
  const shoeRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Create timeline for orchestrated animation
      const tl = gsap.timeline();

      // FTK letters animation - 3D flip reveal
      const letters = ftkRef.current?.querySelectorAll('.ftk-letter');
      if (letters) {
        gsap.set(letters, { 
          opacity: 0, 
          rotateY: -90,
          transformOrigin: "center center",
          transformPerspective: 1000 
        });
        
        tl.to(letters, {
          opacity: 1,
          rotateY: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: 'back.out(1.4)',
        }, 0.3);
      }

      // Sneaker parts animation
      const shoeParts = shoeRef.current?.querySelectorAll('.shoe-part');
      if (shoeParts) {
        gsap.set(shoeParts, { opacity: 0, x: -20 });
        
        tl.to(shoeParts, {
          opacity: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: 'power3.out',
        }, 0);
      }

      // Shoe container entrance
      if (shoeRef.current) {
        gsap.fromTo(
          shoeRef.current,
          { scale: 0, rotation: -180 },
          {
            scale: 1,
            rotation: 0,
            duration: 0.8,
            ease: 'back.out(1.7)',
          }
        );

        // Continuous float animation
        gsap.to(shoeRef.current, {
          y: -12,
          rotation: 5,
          duration: 1.2,
          ease: 'power1.inOut',
          yoyo: true,
          repeat: -1,
          delay: 1,
        });
      }

      // Progress bar animation
      if (progressRef.current) {
        gsap.fromTo(
          progressRef.current,
          { scaleX: 0, transformOrigin: 'left center' },
          {
            scaleX: 1,
            duration: 2.5,
            ease: 'power2.inOut',
            delay: 0.8,
          }
        );
      }

      // Particles animation
      const particles = particlesRef.current?.querySelectorAll('.particle');
      if (particles) {
        particles.forEach((particle, i) => {
          gsap.to(particle, {
            y: -30 - Math.random() * 20,
            x: (Math.random() - 0.5) * 40,
            opacity: 0,
            scale: 0,
            duration: 1 + Math.random(),
            repeat: -1,
            delay: i * 0.2,
            ease: 'power2.out',
          });
        });
      }

      // Product variant rotation
      if (variant === 'product' && shoeRef.current) {
        gsap.to(shoeRef.current, {
          rotation: 360,
          duration: 2,
          ease: 'none',
          repeat: -1,
          delay: 1.5,
        });
      }
    }, containerRef);

    return () => ctx.revert();
  }, [variant]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background overflow-hidden"
    >
      {/* Background gradient orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-foreground/5 rounded-full blur-3xl" />

      {/* Floating Particles */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="particle absolute w-2 h-2 bg-foreground/30 rounded-full"
            style={{
              left: `${45 + (i % 3) * 5}%`,
              top: `${40 + Math.floor(i / 3) * 10}%`,
            }}
          />
        ))}
      </div>

      {/* Sneaker Icon - Multi-part animated SVG */}
      <div ref={shoeRef} className="relative mb-6">
        <svg
          viewBox="0 0 120 80"
          className="w-28 h-20 sm:w-36 sm:h-24 text-foreground"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Sole */}
          <path 
            className="shoe-part"
            d="M10 55 Q10 65 20 65 L95 65 Q110 65 115 55 Q118 50 115 45 L110 42" 
            fill="currentColor"
            fillOpacity="0.1"
          />
          {/* Midsole stripe */}
          <path 
            className="shoe-part"
            d="M12 58 L112 58" 
            strokeWidth="2"
            opacity="0.5"
          />
          {/* Upper body */}
          <path 
            className="shoe-part"
            d="M20 55 L25 35 Q28 25 40 25 L65 25 Q75 25 80 30 L95 42 L110 42 Q115 42 115 48 L115 52" 
            fill="currentColor"
            fillOpacity="0.05"
          />
          {/* Toe cap */}
          <path 
            className="shoe-part"
            d="M95 42 Q110 42 115 48 L115 55 Q110 62 95 62 L90 62 L90 42 Z" 
            fill="currentColor"
            fillOpacity="0.15"
          />
          {/* Heel counter */}
          <path 
            className="shoe-part"
            d="M20 55 L22 40 Q23 35 28 35 L35 35 L35 55" 
            fill="currentColor"
            fillOpacity="0.2"
          />
          {/* Laces area */}
          <path 
            className="shoe-part"
            d="M40 25 L45 40 L70 40 L65 25" 
            fill="currentColor"
            fillOpacity="0.1"
          />
          {/* Laces */}
          <line className="shoe-part" x1="48" y1="28" x2="52" y2="38" strokeWidth="2" />
          <line className="shoe-part" x1="55" y1="28" x2="59" y2="38" strokeWidth="2" />
          <line className="shoe-part" x1="62" y1="28" x2="66" y2="38" strokeWidth="2" />
          {/* Swoosh/Logo line */}
          <path 
            className="shoe-part"
            d="M45 45 Q60 50 75 42 Q85 38 90 45" 
            strokeWidth="2.5"
            opacity="0.8"
          />
        </svg>

        {/* Glow effects */}
        <div className="absolute inset-0 blur-2xl bg-foreground/10 rounded-full scale-125 -z-10" />
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-20 h-3 bg-foreground/20 rounded-full blur-md" />
      </div>

      {/* FTK Text - Modern Kinetic Typography */}
      <div
        ref={ftkRef}
        className="relative flex items-center gap-0.5 sm:gap-1 font-display font-black tracking-tighter"
        style={{ perspective: '1000px' }}
      >
        <span className="ftk-letter inline-block text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
          F
        </span>
        <span className="ftk-letter inline-block text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/50">
          T
        </span>
        <span className="ftk-letter inline-block text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
          K
        </span>
        
        {/* Decorative dot */}
        <span className="ftk-letter inline-block w-2 h-2 sm:w-3 sm:h-3 bg-foreground rounded-full mt-4 sm:mt-6" />
      </div>

      {/* Brand tagline */}
      <div className="mt-2 overflow-hidden">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.4em] text-muted-foreground font-sans font-medium">
          Flex The Kicks
        </p>
      </div>

      {/* Progress bar */}
      <div className="mt-8 sm:mt-10 w-36 sm:w-48 h-1 bg-secondary/50 rounded-full overflow-hidden">
        <div
          ref={progressRef}
          className="h-full bg-gradient-to-r from-foreground via-foreground/80 to-foreground rounded-full"
        />
      </div>

      {/* Loading status text */}
      <div className="mt-4 h-5">
        <p className="text-xs text-muted-foreground/60 font-sans animate-pulse">
          {variant === 'product' ? 'Loading product...' : 'Loading experience...'}
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
