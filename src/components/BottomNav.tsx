import { Home, ShoppingBag, User, LayoutDashboard } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const BottomNav = ({ onSearchOpen }: { onSearchOpen: () => void }) => {
  const { totalItems, setIsCartOpen } = useCart();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 pointer-events-none">
      <div className="flex items-center justify-between gap-2 max-w-md mx-auto pointer-events-auto">
        <div className="flex items-center justify-between w-full bg-black/80 dark:bg-zinc-900/90 backdrop-blur-2xl px-6 py-3 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.3)]">
          <button 
            onClick={() => navigate("/")} 
            className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors"
          >
            <Home size={20} />
            <span className="text-[8px] font-bold uppercase tracking-widest">Home</span>
          </button>

          <button 
            onClick={onSearchOpen} 
            className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors"
          >
            <Search size={20} />
            <span className="text-[8px] font-bold uppercase tracking-widest">Search</span>
          </button>

          {/* Floating Central Action */}
          <button 
            onClick={() => setIsCartOpen(true)} 
            className="relative -mt-10 w-14 h-14 bg-white dark:bg-zinc-100 text-black rounded-full flex items-center justify-center shadow-2xl border-4 border-black/80 dark:border-zinc-900/90 active:scale-90 transition-transform"
          >
            <ShoppingBag size={22} strokeWidth={2.5} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                {totalItems}
              </span>
            )}
          </button>

          <button 
            onClick={() => user ? navigate("/orders") : navigate("/login")} 
            className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors"
          >
            <User size={20} />
            <span className="text-[8px] font-bold uppercase tracking-widest">Profile</span>
          </button>

          {isAdmin && (
            <button 
              onClick={() => navigate("/admin")} 
              className="flex flex-col items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <LayoutDashboard size={20} />
              <span className="text-[8px] font-bold uppercase tracking-widest">Admin</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
