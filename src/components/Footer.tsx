import { Instagram, Twitter, Facebook, ArrowUpRight, Mail } from "lucide-react";
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
        { label: "Contact Us", href: "/support" },
        { label: "Shipping Policy", href: "/shipping" },
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
    <footer ref={footerRef} className="relative bg-background text-foreground pt-10 sm:pt-24 pb-24 sm:pb-12 overflow-hidden border-t border-border/50">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] translate-y-1/2 pointer-events-none" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6">

        {/* Top: Newsletter / CTA */}
        {/* <div className="footer-animate bg-card/30 backdrop-blur-sm border border-border/50 rounded-2xl sm:rounded-3xl p-4 sm:p-10 mb-8 sm:mb-16 md:p-14 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="text-center lg:text-left max-w-xl">
            <h3 className="font-display text-xl sm:text-3xl font-bold mb-2">Join the Kicks Club</h3>
            <p className="text-muted-foreground text-xs sm:text-base leading-relaxed">
              Subscribe to get exclusive access to limited drops, early sale access, and member-only rewards.
            </p>
          </div>
          <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3 w-full lg:max-w-md">
            <div className="relative flex-1">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full h-10 sm:h-14 pl-12 pr-4 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <button className="h-10 sm:h-14 px-6 bg-foreground text-background font-semibold text-xs sm:text-sm rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div> */}

        {/* Middle: Brand & Links */}
        <div className="footer-animate grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-16 mb-8 sm:mb-16">
          {/* Brand Info */}
          <div className="md:col-span-5 lg:col-span-4">
            <Link to="/" className="font-display text-3xl sm:text-5xl font-black tracking-tight inline-block mb-3 sm:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              FTK
            </Link>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-4 sm:mb-8 md:max-w-sm">
              FlexTheKicks is your ultimate destination for premium sneakers. We bring you the most exclusive drops, rare finds, and everyday classics.
            </p>
            <div className="flex gap-4">
              {[{ Icon: Instagram, label: "Instagram", href: "#" },
              { Icon: Twitter, label: "Twitter", href: "#" },
              { Icon: Facebook, label: "Facebook", href: "#" }
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 rounded-full bg-secondary text-foreground flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-300 transform hover:-translate-y-1"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Grid */}
          <div className="md:col-span-7 lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-4 md:gap-8">
            {footerLinks.map((group) => (
              <div key={group.title}>
                <h4 className="font-semibold text-xs sm:text-sm uppercase tracking-wider mb-3 sm:mb-6 text-foreground">
                  {group.title}
                </h4>
                <ul className="space-y-2 sm:space-y-4">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground hover:translate-x-1 inline-block transition-all duration-200"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Legal */}
        <div className="footer-animate pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
          <p className="text-sm text-muted-foreground order-2 md:order-1 text-center md:text-left">
            © {currentYear} FlexTheKicks. All rights reserved.
          </p>
          <div className="flex items-center gap-4 sm:gap-6 text-sm text-muted-foreground order-1 md:order-2">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <span className="w-1 h-1 rounded-full bg-border" />
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
