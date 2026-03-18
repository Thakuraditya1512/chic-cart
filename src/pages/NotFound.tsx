import { useLocation, Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { Home, Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // GSAP animation for the 404 text
  useEffect(() => {
    if (containerRef.current) {
      const text = containerRef.current.querySelector('.error-code');
      if (text) {
        gsap.fromTo(
          text,
          { scale: 0.5, opacity: 0, rotate: -10 },
          { scale: 1, opacity: 1, rotate: 0, duration: 0.8, ease: "back.out(1.7)" }
        );
      }
    }
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6">
      <div className="text-center max-w-md mx-auto">
        {/* 404 Code */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="error-code mb-4 sm:mb-6"
        >
          <span className="font-display text-7xl sm:text-8xl md:text-9xl font-bold text-foreground/10 select-none">
            404
          </span>
        </motion.div>

        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-4 sm:mb-6"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-secondary flex items-center justify-center">
            <Search className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 sm:mb-3"
        >
          Page Not Found
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-sm mx-auto"
        >
          The page you're looking for doesn't exist or has been moved.
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-foreground text-background text-sm font-semibold rounded-full hover:opacity-90 transition-opacity"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            to="/#categories"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border text-foreground text-sm font-semibold rounded-full hover:bg-secondary transition-colors"
          >
            Browse Products
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
