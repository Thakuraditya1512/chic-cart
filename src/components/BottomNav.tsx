import { Home, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const BottomNav = ({ onSearchOpen }: { onSearchOpen: () => void }) => {
  const { totalItems, setIsCartOpen } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around h-14">
        <button onClick={() => navigate("/")} className="flex flex-col items-center gap-0.5 text-foreground p-2">
          <Home size={20} />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button onClick={() => setIsCartOpen(true)} className="flex flex-col items-center gap-0.5 text-muted-foreground p-2 relative">
          <ShoppingBag size={20} />
          {totalItems > 0 && (
            <span className="absolute top-0.5 right-1 bg-badge text-badge-foreground text-[9px] font-bold min-w-[16px] h-[16px] flex items-center justify-center rounded-full">
              {totalItems}
            </span>
          )}
          <span className="text-[10px] font-medium">Cart</span>
        </button>
        <button
          onClick={() => {
            if (user) {
              navigate("/orders");
            } else {
              navigate("/login");
            }
          }}
          className="flex flex-col items-center gap-0.5 text-muted-foreground p-2"
        >
          <User size={20} />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
