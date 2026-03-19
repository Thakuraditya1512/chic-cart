import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Ruler, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const SizeGuide = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.size-animate',
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

  const sizeChart = [
    { us: '6', uk: '5.5', eu: '38.5', cm: '24' },
    { us: '6.5', uk: '6', eu: '39', cm: '24.5' },
    { us: '7', uk: '6', eu: '40', cm: '25' },
    { us: '7.5', uk: '6.5', eu: '40.5', cm: '25.5' },
    { us: '8', uk: '7', eu: '41', cm: '26' },
    { us: '8.5', uk: '7.5', eu: '42', cm: '26.5' },
    { us: '9', uk: '8', eu: '42.5', cm: '27' },
    { us: '9.5', uk: '8.5', eu: '43', cm: '27.5' },
    { us: '10', uk: '9', eu: '44', cm: '28' },
    { us: '10.5', uk: '9.5', eu: '44.5', cm: '28.5' },
    { us: '11', uk: '10', eu: '45', cm: '29' },
    { us: '11.5', uk: '10.5', eu: '45.5', cm: '29.5' },
    { us: '12', uk: '11', eu: '46', cm: '30' },
  ];

  const tips = [
    {
      title: 'Measure Your Feet',
      description: 'Stand on a piece of paper and trace your foot. Measure from heel to longest toe.',
    },
    {
      title: 'Check Width',
      description: 'Measure the widest part of your foot. Some brands offer wide sizes.',
    },
    {
      title: 'Consider Socks',
      description: 'Measure while wearing the type of socks you plan to wear with the shoes.',
    },
    {
      title: 'Time of Day',
      description: 'Feet swell during the day. Measure in the evening for the best fit.',
    },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-background py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        {/* Back Button */}
        <Link
          to="/"
          className="size-animate inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-sans mb-6"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="size-animate text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 mb-4">
            <Ruler size={16} className="text-foreground/70" />
            <span className="text-xs font-sans font-medium text-foreground/70 uppercase tracking-wider">
              Find Your Fit
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
            Size Guide
          </h1>
          <p className="text-muted-foreground font-sans text-sm sm:text-base max-w-md mx-auto">
            Find your perfect fit with our comprehensive size chart and measuring tips.
          </p>
        </div>

        {/* Size Chart */}
        <div className="size-animate bg-foreground/5 rounded-2xl p-6 sm:p-8 mb-8 overflow-x-auto">
          <h2 className="font-display text-lg font-bold mb-4">Men's Size Chart</h2>
          <table className="w-full min-w-[400px]">
            <thead>
              <tr className="border-b border-foreground/10">
                <th className="text-left py-3 px-2 text-xs font-sans font-semibold text-foreground/70 uppercase">US</th>
                <th className="text-left py-3 px-2 text-xs font-sans font-semibold text-foreground/70 uppercase">UK</th>
                <th className="text-left py-3 px-2 text-xs font-sans font-semibold text-foreground/70 uppercase">EU</th>
                <th className="text-left py-3 px-2 text-xs font-sans font-semibold text-foreground/70 uppercase">CM</th>
              </tr>
            </thead>
            <tbody>
              {sizeChart.map((size, index) => (
                <tr key={index} className="border-b border-foreground/5 last:border-0">
                  <td className="py-3 px-2 text-sm font-sans">{size.us}</td>
                  <td className="py-3 px-2 text-sm font-sans text-muted-foreground">{size.uk}</td>
                  <td className="py-3 px-2 text-sm font-sans text-muted-foreground">{size.eu}</td>
                  <td className="py-3 px-2 text-sm font-sans text-muted-foreground">{size.cm}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Measuring Tips */}
        <div className="size-animate grid sm:grid-cols-2 gap-4 mb-8">
          {tips.map((tip, index) => (
            <div key={index} className="bg-foreground/5 rounded-xl p-5">
              <h3 className="font-display text-sm font-bold mb-2">{tip.title}</h3>
              <p className="text-xs text-muted-foreground font-sans">{tip.description}</p>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="size-animate flex items-start gap-3 bg-blue-500/10 rounded-xl p-4">
          <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground font-sans">
            Note: Sizing may vary slightly between brands. If you are between sizes, we recommend 
            sizing up for a comfortable fit. For specific brand sizing, check the product description.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SizeGuide;
