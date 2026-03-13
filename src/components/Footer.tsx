import { Instagram, Twitter, Facebook, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "Shop",
      links: [
        { label: "New Drops", href: "#new" },
        { label: "Brands", href: "#categories" },
        { label: "Sale", href: "#sale" },
        { label: "All Products", href: "#new" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "#" },
        { label: "Contact", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Blog", href: "#" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "FAQ", href: "#" },
        { label: "Shipping", href: "#" },
        { label: "Returns", href: "#" },
        { label: "Size Guide", href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-foreground text-background py-16 md:py-24 pb-28 md:pb-24">
      <div className="container mx-auto px-4">
        {/* Top: Logo + CTA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 md:mb-20 pb-10 border-b border-background/10">
          <div>
            <Link
              to="/"
              className="font-display text-3xl md:text-4xl font-bold tracking-tight block mb-3"
            >
              WALK IN STYLE
            </Link>
            <p className="text-background/40 text-sm font-sans font-light max-w-xs">
              Your destination for premium sneakers. Every brand, every drop.
            </p>
          </div>
          <a
            href="#"
            className="mt-6 md:mt-0 inline-flex items-center gap-2 px-8 py-3.5 border border-background/20 rounded-full text-xs font-sans font-semibold uppercase tracking-[0.15em] hover:bg-background hover:text-foreground transition-all duration-300 group"
          >
            Visit Store
            <ArrowUpRight
              size={14}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </a>
        </div>

        {/* Middle: Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16 md:mb-20">
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="font-sans font-semibold text-xs uppercase tracking-[0.2em] mb-5 text-background/70">
                {group.title}
              </h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-background/40 hover:text-background transition-colors font-sans"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social */}
          <div>
            <h4 className="font-sans font-semibold text-xs uppercase tracking-[0.2em] mb-5 text-background/70">
              Social
            </h4>
            <div className="flex items-center gap-3">
              {[
                { Icon: Instagram, label: "Instagram" },
                { Icon: Twitter, label: "Twitter" },
                { Icon: Facebook, label: "Facebook" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-10 h-10 rounded-full border border-background/10 flex items-center justify-center text-background/40 hover:text-background hover:border-background/30 transition-all duration-300"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-background/10">
          <p className="text-[11px] text-background/30 font-sans mb-3 md:mb-0">
            © {currentYear} WALK IN STYLE. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-[11px] text-background/30 font-sans">
            <a href="#" className="hover:text-background/60 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-background/60 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-background/60 transition-colors">
              Cookie Settings
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
