import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Target, Users, Zap, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.about-animate',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const stats = [
    { icon: Users, value: '50K+', label: 'Happy Customers' },
    { icon: Award, value: '100+', label: 'Premium Brands' },
    { icon: Zap, value: '24h', label: 'Fast Delivery' },
    { icon: Target, value: '99%', label: 'Satisfaction' },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-background py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        {/* Back Button */}
        <Link
          to="/"
          className="about-animate inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-sans mb-6"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="about-animate text-center mb-12 sm:mb-16">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            About FlexTheKicks
          </h1>
          <p className="text-muted-foreground font-sans text-sm sm:text-base max-w-lg mx-auto">
            Your premium destination for authentic sneakers from the world's most coveted brands.
          </p>
        </div>

        {/* Stats */}
        <div className="about-animate grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-foreground/5 rounded-2xl p-6 text-center"
            >
              <stat.icon className="w-6 h-6 mx-auto mb-3 text-foreground/70" />
              <p className="font-display text-2xl sm:text-3xl font-bold mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground font-sans">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Story Sections */}
        <div className="space-y-8 sm:space-y-10">
          <div className="about-animate bg-foreground/5 rounded-2xl p-6 sm:p-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold mb-3">
              Our Story
            </h2>
            <p className="text-muted-foreground font-sans text-sm leading-relaxed">
              Founded in 2024, FlexTheKicks started with a simple mission: make premium sneakers 
              accessible to everyone in India. What began as a small passion project has grown into 
              one of the country's most trusted sneaker destinations. We believe everyone deserves 
              to walk in style, and we're here to make that happen.
            </p>
          </div>

          <div className="about-animate bg-foreground/5 rounded-2xl p-6 sm:p-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold mb-3">
              Our Mission
            </h2>
            <p className="text-muted-foreground font-sans text-sm leading-relaxed">
              We partner directly with authorized distributors to bring you 100% authentic products 
              at competitive prices. Our team of sneaker enthusiasts carefully curates every collection, 
              ensuring you get access to the latest drops, classic favorites, and exclusive releases 
              all in one place.
            </p>
          </div>

          <div className="about-animate bg-foreground/5 rounded-2xl p-6 sm:p-8">
            <h2 className="font-display text-xl sm:text-2xl font-bold mb-3">
              Why Choose Us?
            </h2>
            <ul className="space-y-3 text-muted-foreground font-sans text-sm">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 mt-2" />
                <span>100% Authentic products with verified sources</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 mt-2" />
                <span>Competitive pricing and regular sales</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 mt-2" />
                <span>Fast shipping across India</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 mt-2" />
                <span>Dedicated customer support team</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 mt-2" />
                <span>Easy returns and exchanges</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
