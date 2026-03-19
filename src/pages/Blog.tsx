import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowLeft, Calendar, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Blog = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.blog-animate',
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

  const posts = [
    {
      title: 'Top 10 Sneaker Trends for 2025',
      excerpt: 'Discover the hottest styles that are dominating the streets this year.',
      date: 'Mar 15, 2025',
      category: 'Trends',
      readTime: '5 min read',
    },
    {
      title: 'How to Spot Fake Sneakers',
      excerpt: 'A comprehensive guide to identifying authentic kicks from counterfeits.',
      date: 'Mar 10, 2025',
      category: 'Guides',
      readTime: '8 min read',
    },
    {
      title: 'The History of Air Jordan',
      excerpt: 'From the banned shoe to a cultural icon - the story behind the legend.',
      date: 'Mar 5, 2025',
      category: 'History',
      readTime: '6 min read',
    },
    {
      title: 'Sneaker Care 101: Keep Them Fresh',
      excerpt: 'Expert tips on cleaning, storing, and maintaining your collection.',
      date: 'Feb 28, 2025',
      category: 'Care',
      readTime: '4 min read',
    },
    {
      title: 'Investment Guide: Sneakers as Assets',
      excerpt: 'Which releases hold their value and how to build a valuable collection.',
      date: 'Feb 20, 2025',
      category: 'Investment',
      readTime: '7 min read',
    },
    {
      title: 'Behind the Design: Limited Editions',
      excerpt: 'What goes into creating those ultra-rare collaborative releases.',
      date: 'Feb 15, 2025',
      category: 'Design',
      readTime: '5 min read',
    },
  ];

  return (
    <div ref={containerRef} className="min-h-screen bg-background py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
        {/* Back Button */}
        <Link
          to="/"
          className="blog-animate inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-sans mb-6"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="blog-animate text-center mb-10 sm:mb-14">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold mb-3">
            FlexTheKicks Blog
          </h1>
          <p className="text-muted-foreground font-sans text-sm sm:text-base max-w-lg mx-auto">
            Stories, guides, and insights from the world of sneakers.
          </p>
        </div>

        {/* Featured Post */}
        <div className="blog-animate bg-foreground/5 rounded-2xl p-6 sm:p-8 mb-8 sm:mb-10">
          <span className="inline-block px-3 py-1 rounded-full bg-foreground/10 text-xs font-sans font-medium mb-4">
            Featured
          </span>
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-3">
            The Ultimate Sneaker Collection Guide
          </h2>
          <p className="text-muted-foreground font-sans text-sm mb-4 leading-relaxed">
            Building the perfect sneaker collection takes time, knowledge, and passion. 
            Whether you're just starting out or looking to expand your existing collection, 
            this comprehensive guide covers everything from storage solutions to authentication tips.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-sans">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              Mar 18, 2025
            </span>
            <span>12 min read</span>
          </div>
        </div>

        {/* Blog Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {posts.map((post, index) => (
            <article
              key={index}
              className="blog-animate group bg-foreground/5 rounded-xl p-5 sm:p-6 hover:bg-foreground/10 transition-all cursor-pointer"
            >
              <span className="inline-block px-2 py-1 rounded-full bg-foreground/10 text-[10px] font-sans font-medium uppercase tracking-wider mb-3">
                {post.category}
              </span>
              <h3 className="font-display text-base sm:text-lg font-bold mb-2 group-hover:text-foreground/80 transition-colors">
                {post.title}
              </h3>
              <p className="text-muted-foreground font-sans text-xs sm:text-sm mb-4 line-clamp-2">
                {post.excerpt}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-sans">
                  <span>{post.date}</span>
                  <span>{post.readTime}</span>
                </div>
                <ArrowUpRight
                  size={16}
                  className="text-muted-foreground group-hover:text-foreground transition-colors"
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Blog;
