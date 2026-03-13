import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Menu, X, Sun, Moon, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

const Header = ({ onSearchOpen }: { onSearchOpen: () => void }) => {
  const navigate = useNavigate();
  const { totalItems, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = scrollY.getPrevious() ?? 0;
    setIsScrolled(latest > 50);
    setHidden(latest > prev && latest > 200);
  });

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
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-sm"
          : "bg-transparent border-b border-transparent"
          }`}
      >
        <div className="container mx-auto flex items-center justify-between h-16 md:h-[72px] px-4">
          {/* Left: Menu + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 -ml-2 text-foreground"
              aria-label="Menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link
              to="/"
              className={`font-cursive text-[1.25rem] leading-[2.5rem] md:text-[1.75rem] transition-colors duration-300 ${isScrolled ? "text-foreground" : "text-white"
                }`}
            >
              FlexTheKicks
            </Link>
          </div>

          {/* Center: Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.to}
                className={`text-xs font-sans font-medium uppercase tracking-[0.15em] transition-colors duration-300 hover:opacity-100 ${isScrolled
                  ? "text-muted-foreground hover:text-foreground"
                  : "text-white/60 hover:text-white"
                  }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-0.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 transition-colors duration-300 ${isScrolled
                ? "text-muted-foreground hover:text-foreground"
                : "text-white/60 hover:text-white"
                }`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
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
              className={`p-2.5 transition-colors duration-300 ${isScrolled
                ? "text-muted-foreground hover:text-foreground"
                : "text-white/60 hover:text-white"
                }`}
              aria-label="Profile"
            >
              <User size={18} />
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className={`p-2.5 transition-colors duration-300 relative ${isScrolled
                ? "text-muted-foreground hover:text-foreground"
                : "text-white/60 hover:text-white"
                }`}
              aria-label="Cart"
            >
              <ShoppingBag size={18} />
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 bg-white text-black text-[9px] font-sans font-bold min-w-[16px] h-[16px] flex items-center justify-center rounded-full"
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-background"
          >
            <nav className="flex flex-col items-start p-8 pt-24 gap-6">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.to}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => setMenuOpen(false)}
                  className="text-4xl font-display font-bold text-foreground hover:opacity-60 transition-opacity"
                >
                  {link.label}
                </motion.a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
