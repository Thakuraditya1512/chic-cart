import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import CinematicHero from "@/components/CinematicHero";
import ShoeShowcase from "@/components/ShoeShowcase";
import NewPopularSection from "@/components/NewPopularSection";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import CartDrawer from "@/components/CartDrawer";
import SearchOverlay from "@/components/SearchOverlay";
import ChatBot from "@/components/ChatBot";
// import RecentlyViewed from "@/components/RecentlyViewed";

const Index = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-foreground/20 overflow-x-hidden">
      <Helmet>
        <title>Flex The Kicks - The Ultimate Sneaker Destination</title>
        <meta name="description" content="Shop the latest trends in sneakers, hype shoes, premium kicks at Flex The Kicks. Find limited drops and everyday classics." />
        <meta name="keywords" content="Sneakers, Shoes, Footwear, Fashion, Hype, Premium, Drops, Jordan, Nike" />
      </Helmet>

      <Header onSearchOpen={() => setSearchOpen(true)} />
      <main>
        {/* 1. Full-screen cinematic video hero */}
        <CinematicHero />

        {/* 2. 3D Shoe showcase — Apple-style dark section */}
        <ShoeShowcase />

        {/* 3. New & Popular with brand filter tabs */}
        <NewPopularSection />

        {/* 4. Recently Viewed products */}
        {/* <RecentlyViewed /> */}

        {/* 5. Newsletter */}
        <Newsletter />
      </main>
      <Footer />
      <BottomNav onSearchOpen={() => setSearchOpen(true)} />
      <CartDrawer />
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* ChatBot Section */}
      <ChatBot 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />
      
      {/* Floating Chat Trigger */}
      {!isChatOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-24 right-5 sm:right-8 z-[100] w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-[#6c5ce7] to-[#a855f7] flex items-center justify-center text-white shadow-[0_20px_40px_-10px_rgba(108,92,231,0.5)] border border-white/20 group overflow-hidden"
        >
          {/* Animated Glow Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          <div className="relative flex flex-col items-center">
            {/* Custom Shoe Icon (derived from sneakers) */}
            <svg viewBox="0 0 24 24" className="w-7 h-7 sm:w-8 sm:h-8 fill-current transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110" xmlns="http://www.w3.org/2000/svg">
              <path d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5Z" opacity="0.2"/>
              <path d="M4.5,16.5V9L12,5.25L19.5,9V16.5L12,20.25L4.5,16.5Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12,5.25V20.25M19.5,9L12,12.75L4.5,9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              {/* Laces/Sneaker Vibes */}
              <path d="M8,11L11,13M8,13L11,15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="text-[7px] font-black uppercase tracking-widest mt-1 opacity-60 group-hover:opacity-100 transition-opacity">Support</span>
          </div>

          {/* Pulse Effect */}
          <div className="absolute inset-0 rounded-2xl bg-[#6c5ce7] animate-ping opacity-20 pointer-events-none" />
        </motion.button>
      )}
    </div>
  );
};

export default Index;
