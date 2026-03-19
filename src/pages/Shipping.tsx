import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Truck, Clock, Package, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Shipping = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.shipping-animate',
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

  const deliveryInfo = [
    {
      icon: Clock,
      title: 'Standard Delivery',
      time: '3-7 Business Days',
      price: 'Free on orders over ₹5,000',
      description: 'Our standard shipping option for all orders across India.',
    },
    {
      icon: Truck,
      title: 'Express Delivery',
      time: '1-3 Business Days',
      price: '₹199',
      description: 'Faster delivery for when you need your kicks urgently.',
    },
    {
      icon: Package,
      title: 'Same Day Delivery',
      time: 'Same Day',
      price: '₹399',
      description: 'Available in select metro cities for orders before 12 PM.',
    },
  ];

  const cities = [
    'Delhi NCR', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 
    'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-background py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        {/* Back Button */}
        <Link
          to="/"
          className="shipping-animate inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-sans mb-6"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="shipping-animate text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 mb-4">
            <Truck size={16} className="text-foreground/70" />
            <span className="text-xs font-sans font-medium text-foreground/70 uppercase tracking-wider">
              Delivery Information
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
            Shipping & Delivery
          </h1>
          <p className="text-muted-foreground font-sans text-sm sm:text-base max-w-md mx-auto">
            Fast and reliable shipping across India. Track your order every step of the way.
          </p>
        </div>

        {/* Delivery Options */}
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-10 sm:mb-12">
          {deliveryInfo.map((option, index) => (
            <div
              key={index}
              className="shipping-animate bg-foreground/5 rounded-2xl p-5 sm:p-6"
            >
              <option.icon className="w-8 h-8 text-foreground/70 mb-4" />
              <h3 className="font-display text-base font-bold mb-1">
                {option.title}
              </h3>
              <p className="text-sm font-sans font-medium text-foreground/80 mb-2">
                {option.time}
              </p>
              <p className="text-xs text-muted-foreground font-sans mb-3">
                {option.price}
              </p>
              <p className="text-xs text-muted-foreground font-sans">
                {option.description}
              </p>
            </div>
          ))}
        </div>

        {/* Cities */}
        <div className="shipping-animate bg-foreground/5 rounded-2xl p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={18} className="text-foreground/70" />
            <h2 className="font-display text-lg font-bold">
              Major Cities We Serve
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {cities.map((city, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-background rounded-full text-xs font-sans text-muted-foreground"
              >
                {city}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground font-sans mt-4">
            And 15,000+ other pin codes across India
          </p>
        </div>

        {/* Policy Info */}
        <div className="shipping-animate space-y-4">
          <div className="bg-foreground/5 rounded-2xl p-6">
            <h3 className="font-display text-base font-bold mb-3">
              Order Processing
            </h3>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              All orders are processed within 24 hours (excluding Sundays and holidays). 
              You will receive a confirmation email and WhatsApp message once your order is shipped 
              with tracking details.
            </p>
          </div>

          <div className="bg-foreground/5 rounded-2xl p-6">
            <h3 className="font-display text-base font-bold mb-3">
              Tracking Your Order
            </h3>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              Once shipped, you can track your order through the "My Orders" section in your 
              account or directly through the tracking link sent to your email and WhatsApp.
            </p>
          </div>

          <div className="bg-foreground/5 rounded-2xl p-6">
            <h3 className="font-display text-base font-bold mb-3">
              Delivery Partners
            </h3>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              We partner with Delhivery, Blue Dart, and Ekart Logistics to ensure reliable 
              and timely delivery of your orders across India.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shipping;
