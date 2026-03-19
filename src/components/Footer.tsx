import { Instagram, Twitter, Facebook, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect } from "react";
import gsap from "gsap";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const footerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(footerRef, { once: true, margin: "-100px" });

  const footerLinks = [
    {
      title: "Shop",
      links: [
        { label: "New Drops", href: "/new-drops" },
        { label: "Brands", href: "/brands" },
        { label: "Sale", href: "/sale" },
        { label: "All Products", href: "/products" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Blog", href: "/blog" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "FAQ", href: "/faq" },
        { label: "Contact", href: "/support" },
        { label: "Shipping", href: "/shipping" },
        { label: "Returns", href: "/returns" },
        { label: "Size Guide", href: "/size-guide" },
      ],
    },
  ];

  // GSAP reveal animation
  useEffect(() => {
    if (isInView && footerRef.current) {
      const elements = footerRef.current.querySelectorAll('.footer-animate');
      gsap.fromTo(
        elements,
        { opacity: 0, y: 30 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.6, 
          stagger: 0.1, 
          ease: "power3.out" 
        }
      );
    }
  }, [isInView]);

  return (
    <footer ref={footerRef} className="bg-background border-t border-foreground/10 text-foreground py-12 sm:py-16 md:py-24 pb-24 sm:pb-28 md:pb-24">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Top: Logo + CTA */}
        <div className="footer-animate flex flex-col md:flex-row justify-between items-start md:items-center mb-10 sm:mb-16 md:mb-20 pb-8 sm:pb-10 border-b border-foreground/10">
          <div>
            <Link
              to="/"
              className="font-cursive text-3xl sm:text-4xl md:text-5xl block mb-2 sm:mb-3"
            >
              FlexTheKicks
            </Link>
            <p className="text-foreground/50 text-xs sm:text-sm font-sans font-light max-w-xs leading-relaxed">
              Your destination for premium sneakers. Every brand, every drop.
            </p>
          </div>
          <a
            href="#"
            className="mt-5 sm:mt-6 md:mt-0 inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 border border-foreground/20 rounded-full text-[10px] sm:text-xs font-sans font-semibold uppercase tracking-[0.15em] hover:bg-foreground hover:text-background transition-all duration-300 group"
          >
            Visit Store
            <ArrowUpRight
              size={14}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </a>
        </div>

        {/* Middle: Links */}
        <div className="footer-animate grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12 mb-10 sm:mb-16 md:mb-20">
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="font-sans font-semibold text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-4 sm:mb-5 text-foreground/60">
                {group.title}
              </h4>
              <ul className="space-y-2.5 sm:space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-xs sm:text-sm text-foreground/50 hover:text-foreground transition-colors font-sans"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social */}
          <div className="col-span-2 sm:col-span-1 md:col-span-1">
            <h4 className="font-sans font-semibold text-[10px] sm:text-xs uppercase tracking-[0.2em] mb-4 sm:mb-5 text-foreground/60">
              Social
            </h4>
            <div className="flex items-center gap-3">
              {[
                { Icon: Instagram, label: "Instagram" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-foreground/20 flex items-center justify-center text-foreground/50 hover:text-foreground hover:border-foreground/40 transition-all duration-300"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="footer-animate flex flex-col sm:flex-row items-center justify-between pt-6 sm:pt-8 border-t border-foreground/10 gap-3 sm:gap-0">
          <p className="text-[10px] sm:text-[11px] text-foreground/40 font-sans text-center sm:text-left">
            © {currentYear} WALK IN STYLE. All rights reserved.
          </p>
          <div className="flex items-center gap-4 sm:gap-6 text-[10px] sm:text-[11px] text-foreground/40 font-sans">
            <Link to="/privacy" className="hover:text-foreground/70 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-foreground/70 transition-colors">
              Terms of Service
            </Link>
            <span className="hidden sm:inline text-foreground/40">
              Cookie Settings
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
