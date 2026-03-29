import { useState } from "react";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import CinematicHero from "@/components/CinematicHero";
import BrandMarquee from "@/components/BrandMarquee";
import ShoeShowcase from "@/components/ShoeShowcase";
import EditorialLookbook from "@/components/EditorialLookbook";
import StatsBar from "@/components/StatsBar";
import FeaturedProducts from "@/components/FeaturedProducts";
import PremiumCTA from "@/components/PremiumCTA";
import NewPopularSection from "@/components/NewPopularSection";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import CartDrawer from "@/components/CartDrawer";
import SearchOverlay from "@/components/SearchOverlay";
import ChatBot from "@/components/ChatBot";
import { MessageCircle } from "lucide-react";

const Index = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header onSearchOpen={() => setSearchOpen(true)} />
      <main>
        {/* 1. Full-screen cinematic video hero */}
        <CinematicHero />

        {/* 3. 3D Shoe showcase — Apple-style dark section */}
        <ShoeShowcase />


        {/* 6. Featured products + horizontal scroll */}
        {/* <FeaturedProducts /> */}

        {/* 4. Editorial lookbook grid */}
        {/* <EditorialLookbook /> */}

        {/* 5. Social proof stats */}
        <StatsBar />

        {/* 6. Featured products + horizontal scroll
        <FeaturedProducts /> */}

        {/* 7. Premium CTA / Sale banner */}
        <PremiumCTA />

        {/* 8. New & Popular with brand filter tabs */}
        <NewPopularSection />

        {/* 9. Newsletter */}
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
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-24 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-[#6c5ce7] to-[#a855f7] flex items-center justify-center text-white shadow-2xl shadow-[#6c5ce7]/50 border border-white/20 group"
        >
          <MessageCircle className="w-6 h-6 transition-transform group-hover:rotate-12" />
        </motion.button>
      )}
    </div>
  );
};

export default Index;
