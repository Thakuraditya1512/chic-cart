import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Menu, X, Sun, Moon, User, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import gsap from "gsap";

const Header = ({ onSearchOpen }: { onSearchOpen: () => void }) => {
  const navigate = useNavigate();
  const { totalItems, setIsCartOpen } = useCart();
  const { user, isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = scrollY.getPrevious() ?? 0;
    setIsScrolled(latest > 50);
    setHidden(latest > prev && latest > 200);
  });

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // GSAP menu animation
  useEffect(() => {
    if (menuOpen && menuRef.current) {
      gsap.fromTo(
        menuRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }
      );
      
      gsap.fromTo(
        menuItemsRef.current.filter(Boolean),
        { opacity: 0, x: -30 },
        { 
          opacity: 1, 
          x: 0, 
          duration: 0.5, 
          stagger: 0.08, 
          ease: "power3.out",
          delay: 0.1 
        }
      );
    }
  }, [menuOpen]);

  const navLinks = [
    { label: "New In", to: "/#new" },
    { label: "Brands", to: "/#categories" },
    { label: "Trending", to: "/#new" },
    { label: "Sale", to: "/#sale" },
  ];

  return (
    <>
      <motion.header
        initial={{ y: 0 }}
        animate={{ y: hidden ? -100 : 0 }}
        transition={{ duration: 0.3, ease: [0.33, 1, 0.68, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isDark ? "bg-black/90 border-white/5" : "bg-white/90 border-black/[0.06]"
        } backdrop-blur-xl border-b shadow-sm`}
      >
        <div className="container mx-auto flex items-center justify-between h-16 md:h-[72px] px-4 lg:px-6">
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 -ml-2 text-foreground tap-highlight-transparent"
              aria-label="Menu"
            >
              <AnimatePresence mode="wait">
                {menuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X size={18} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu size={18} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
            <Link
              to="/"
              className="font-cursive text-[1.35rem] leading-[2.5rem] md:text-[1.75rem] text-foreground transition-opacity hover:opacity-80"
            >
              FlexTheKicks
            </Link>
          </div>

          {/* Center: Nav - Desktop */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.to}
                className="text-xs font-sans font-medium uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground transition-colors duration-300 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-foreground group-hover:w-full transition-all duration-300" />
              </a>
            ))}
            {isAdmin && (
              <Link
                  to="/admin"
                className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] px-3 py-1.5 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-all border border-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.3)]"
              >
                Admin Panel
              </Link>
            )}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-0.5 md:gap-1">
            {/* Search - Desktop */}
            <button
              onClick={onSearchOpen}
              className="hidden md:flex p-2.5 text-muted-foreground hover:text-foreground transition-colors duration-300"
              aria-label="Search"
            >
              <Search size={16} />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 text-muted-foreground hover:text-foreground transition-colors duration-300"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Profile / Orders button */}
            <button
              onClick={() => {
                if (user) {
                  navigate("/orders");
                } else {
                  navigate("/login");
                }
              }}
              className="p-2.5 text-muted-foreground hover:text-foreground transition-colors duration-300"
              aria-label="Profile"
            >
              <User size={16} />
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-2.5 text-muted-foreground hover:text-foreground transition-colors duration-300 relative"
              aria-label="Cart"
            >
              <ShoppingBag size={16} />
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute -top-0.5 -right-0.5 ${isDark ? "bg-white text-black" : "bg-black text-white"} text-[9px] font-sans font-bold min-w-[16px] h-[16px] flex items-center justify-center rounded-full`}
                >
                  {totalItems}
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`fixed inset-0 z-40 ${isDark ? "bg-black/98" : "bg-white/98"} backdrop-blur-xl md:hidden`}
          >
            {/* Header inside menu */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-border/50">
              <span className="font-cursive text-[1.35rem] text-foreground">FlexTheKicks</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-2 text-foreground"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex flex-col items-start p-6 pt-8 gap-1">
              {navLinks.map((link, i) => (
                <a
                  key={link.label}
                  ref={(el) => { menuItemsRef.current[i] = el; }}
                  href={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-2xl sm:text-3xl font-display font-bold text-foreground hover:opacity-60 transition-opacity py-3 border-b border-border/30 flex items-center justify-between group"
                >
                  {link.label}
                  <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity -rotate-45" />
                </a>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="w-full text-2xl sm:text-3xl font-display font-bold text-primary hover:opacity-60 transition-opacity py-3 border-b border-border/30 flex items-center justify-between group"
                >
                  Admin Panel
                  <ArrowRight size={16} className="opacity-100 -rotate-45" />
                </Link>
              )}
            </nav>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
