import { useState } from "react";
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

const Index = () => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header onSearchOpen={() => setSearchOpen(true)} />
      <main>
        {/* 1. Full-screen cinematic video hero */}
        <CinematicHero />

        {/* 3. 3D Shoe showcase — Apple-style dark section */}
        <ShoeShowcase />

        {/* 4. Editorial lookbook grid */}
        <EditorialLookbook />

        {/* 5. Social proof stats */}
        <StatsBar />

        {/* 6. Featured products + horizontal scroll */}
        <FeaturedProducts />

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
    </div>
  );
};

export default Index;
