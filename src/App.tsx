import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";

import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import BrandDetail from "./pages/BrandDetail";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Support from "./pages/Support";
import NewDrops from "./pages/NewDrops";
import Brands from "./pages/Brands";
import Sale from "./pages/Sale";
import AllProducts from "./pages/AllProducts";
import AboutUs from "./pages/AboutUs";
import Careers from "./pages/Careers";
import Blog from "./pages/Blog";
import FAQ from "./pages/FAQ";
import Shipping from "./pages/Shipping";
import Returns from "./pages/Returns";
import SizeGuide from "./pages/SizeGuide";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import LoadingScreen from "./components/LoadingScreen";
import ScrollToTop from "./components/ScrollToTop";
import { useTheme } from "./hooks/useTheme";
import { toast } from "sonner";

const queryClient = new QueryClient();

/* ---------------- PROTECTED ROUTE ---------------- */

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    toast.error("Access Denied", {
      description: "You do not have administrator privileges to access the admin panel.",
    });
    return <Navigate to="/" replace />;
  }

  return children;
};

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) return <Navigate to="/login" replace />;

  return children;
};

const AppRoutes = () => {
  const { user, isAdmin, loading } = useAuth();
  const { isDark } = useTheme();

  return (
    <>
      {/* Sunny Effect in Light Mode */}
      {!isDark && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Main Sun Glow */}
          <div 
            className="absolute -top-24 -right-24 w-96 h-96 bg-orange-200/20 blur-[120px] rounded-full animate-pulse"
            style={{ animationDuration: '8s' }}
          />
          {/* Secondary Warmth */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-100/5 via-transparent to-transparent" />
        </div>
      )}
      
      <ScrollToTop />
      <Routes>
        <Route 
          path="/" 
          element={loading ? <LoadingScreen /> : (user && isAdmin ? <Navigate to="/admin" replace /> : <Index />)} 
        />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/brand/:brandId" element={<BrandDetail />} />

        {/* If already logged in, prevent going back to login */}
        <Route
          path="/login"
          element={loading ? <LoadingScreen /> : user ? <Navigate to={isAdmin ? "/admin" : "/"} /> : <Login />}
        />

        <Route
          path="/signup"
          element={loading ? <LoadingScreen /> : user ? <Navigate to="/" /> : <Signup />}
        />

        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        
        {/* Footer Pages */}
        <Route path="/support" element={<Support />} />
        <Route path="/new-drops" element={<NewDrops />} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/sale" element={<Sale />} />
        <Route path="/products" element={<AllProducts />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/shipping" element={<Shipping />} />
        <Route path="/returns" element={<Returns />} />
        <Route path="/size-guide" element={<SizeGuide />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
        <Route path="/admin/flexthekicks" element={<Navigate to="/admin" replace />} />

        {/* Unknown pages → Redirect to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationProvider>
        <TooltipProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </CartProvider>
        </TooltipProvider>
      </NotificationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;