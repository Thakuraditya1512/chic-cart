import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Briefcase, MapPin, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const Careers = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.careers-animate',
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

  const openings = [
    {
      title: 'Customer Support Specialist',
      location: 'Remote',
      type: 'Full-time',
      department: 'Support',
    },
    {
      title: 'Social Media Manager',
      location: 'Mumbai',
      type: 'Full-time',
      department: 'Marketing',
    },
    {
      title: 'Warehouse Operations Associate',
      location: 'Delhi',
      type: 'Full-time',
      department: 'Operations',
    },
    {
      title: 'Content Writer',
      location: 'Remote',
      type: 'Part-time',
      department: 'Marketing',
    },
  ];

  const benefits = [
    'Competitive salary packages',
    'Health insurance coverage',
    'Flexible work arrangements',
    'Employee discount on products',
    'Learning & development budget',
    'Paid time off',
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-background py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        {/* Back Button */}
        <Link
          to="/"
          className="careers-animate inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-sans mb-6"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="careers-animate text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-foreground/5 mb-4">
            <Briefcase size={16} className="text-foreground/70" />
            <span className="text-xs font-sans font-medium text-foreground/70 uppercase tracking-wider">
              Join Our Team
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
            Careers at FlexTheKicks
          </h1>
          <p className="text-muted-foreground font-sans text-sm sm:text-base max-w-lg mx-auto">
            Be part of India's fastest-growing sneaker community. We're always looking for passionate people.
          </p>
        </div>

        {/* Benefits */}
        <div className="careers-animate bg-foreground/5 rounded-2xl p-6 sm:p-8 mb-8 sm:mb-10">
          <h2 className="font-display text-lg sm:text-xl font-bold mb-4">
            Why Work With Us?
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground font-sans">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Open Positions */}
        <div className="careers-animate">
          <h2 className="font-display text-lg sm:text-xl font-bold mb-4">
            Open Positions
          </h2>
          <div className="space-y-3">
            {openings.map((job, index) => (
              <div
                key={index}
                className="bg-foreground/5 rounded-xl p-5 sm:p-6 hover:bg-foreground/10 transition-colors group cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-bold mb-1 group-hover:text-foreground/80 transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-sans">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {job.type}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-foreground/10">
                        {job.department}
                      </span>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-foreground text-background text-xs font-sans font-semibold rounded-lg hover:bg-foreground/90 transition-colors">
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="careers-animate mt-10 text-center">
          <p className="text-sm text-muted-foreground font-sans">
            Don't see a role that fits? Send your resume to{' '}
            <a
              href="mailto:careers@flexthekicks.com"
              className="text-foreground font-medium hover:underline"
            >
              careers@flexthekicks.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Careers;
