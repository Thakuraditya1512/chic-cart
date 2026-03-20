import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingBag, Menu, X, Sun, Moon, User, ArrowRight, Bell, Check, Info, Tag as TagIcon, BellOff } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import { useTheme } from "@/hooks/useTheme";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import gsap from "gsap";

const Header = ({ onSearchOpen }: { onSearchOpen: () => void }) => {
  const navigate = useNavigate();
  const { totalItems, setIsCartOpen } = useCart();
  const { user, isAdmin } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotification();
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
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

  // Close notifications on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

            {/* Notifications */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="p-2.5 text-muted-foreground hover:text-foreground transition-colors duration-300 relative"
                  aria-label="Notifications"
                >
                  <Bell size={16} className={notifOpen ? "text-foreground" : ""} />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-sans font-bold min-w-[16px] h-[16px] flex items-center justify-center rounded-full"
                    >
                      {unreadCount}
                    </motion.span>
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={`absolute right-0 mt-3 w-80 md:w-96 max-h-[480px] overflow-hidden rounded-2xl border ${
                        isDark ? "bg-black/95 border-white/10" : "bg-white border-black/10"
                      } shadow-2xl backdrop-blur-xl z-[60]`}
                    >
                      <div className="p-4 border-b border-border/50 flex items-center justify-between">
                        <h3 className="font-display font-bold text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-sans font-medium bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full">
                            {unreadCount} New
                          </span>
                        )}
                      </div>

                      <div className="overflow-y-auto max-h-[400px] py-1 custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="py-12 px-4 text-center">
                            <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-3">
                              <BellOff size={20} className="text-muted-foreground/50" />
                            </div>
                            <p className="text-sm text-muted-foreground">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notif) => {
                            const isRead = notif.target === "all" 
                              ? notif.readBy?.includes(user.uid) 
                              : notif.isRead;
                            
                            return (
                              <div
                                key={notif.id}
                                onClick={() => {
                                  if (!isRead) markAsRead(notif.id);
                                  if (notif.link) navigate(notif.link);
                                  setNotifOpen(false);
                                }}
                                className={`px-4 py-4 border-b border-border/30 last:border-0 cursor-pointer transition-colors ${
                                  isRead ? "opacity-60" : isDark ? "bg-white/5" : "bg-black/5"
                                } hover:${isDark ? "bg-white/10" : "bg-black/10"}`}
                              >
                                <div className="flex gap-3">
                                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    notif.type === 'coupon' ? 'bg-emerald-500/10 text-emerald-500' :
                                    notif.type === 'update' ? 'bg-blue-500/10 text-blue-500' :
                                    'bg-amber-500/10 text-amber-500'
                                  }`}>
                                    {notif.type === 'coupon' ? <TagIcon size={14} /> :
                                     notif.type === 'update' ? <Info size={14} /> :
                                     <Bell size={14} />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                      <h4 className={`text-sm font-semibold truncate ${!isRead ? "text-foreground" : "text-muted-foreground"}`}>
                                        {notif.title}
                                      </h4>
                                      {!isRead && <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 ml-2" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                      {notif.message}
                                    </p>
                                    <span className="text-[10px] text-muted-foreground/60 font-medium">
                                      {notif.createdAt?.toDate ? 
                                        new Intl.DateTimeFormat('en-IN', {
                                          day: 'numeric',
                                          month: 'short',
                                          hour: 'numeric',
                                          minute: 'numeric'
                                        }).format(notif.createdAt.toDate()) : 
                                        'Just now'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
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
