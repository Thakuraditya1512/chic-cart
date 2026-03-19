import { Home, ShoppingBag, User, LayoutDashboard } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const BottomNav = ({ onSearchOpen }: { onSearchOpen: () => void }) => {
  const { totalItems, setIsCartOpen } = useCart();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!isAdmin) return null;

  return (
    <nav className="md:hidden fixed bottom-1 left-0 right-0 z-50 bg-background/0 backdrop-blur-none border-t-0 pointer-events-none">
      <div className="container mx-auto px-4 flex justify-end pb-4">
        <button 
          onClick={() => navigate("/admin")} 
          className="pointer-events-auto flex flex-col items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 animate-pulse border-2 border-primary-foreground/20"
        >
          <LayoutDashboard size={16} />
          <span className="text-[8px] font-bold uppercase tracking-tighter">Admin</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
