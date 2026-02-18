import { useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoriesGrid from "@/components/CategoriesGrid";
import FeaturedProducts from "@/components/FeaturedProducts";
import SaleBanner from "@/components/SaleBanner";
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
        <HeroSection />
        <CategoriesGrid />
        <FeaturedProducts />
        <SaleBanner />
        <NewPopularSection />
        <Newsletter />
      </main>
      <Footer />
      <BottomNav onSearchOpen={() => setSearchOpen(true)} />
      <CartDrawer />
      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export default Index;
