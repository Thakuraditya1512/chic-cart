import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { useEffect, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ReactGA from "react-ga4";

import Index from "./pages/Index";
import LoadingScreen from "./components/LoadingScreen";
import ScrollToTop from "./components/ScrollToTop";
import BackToTop from "@/components/BackToTop";
import { useTheme } from "./hooks/useTheme";
import { toast } from "sonner";

// ── Lazy-loaded pages (code splitting) ──────────────────────────────────────
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const BrandDetail = lazy(() => import("./pages/BrandDetail"));
const Admin = lazy(() => import("./pages/Admin"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const Support = lazy(() => import("./pages/Support"));
const NewDrops = lazy(() => import("./pages/NewDrops"));
const Brands = lazy(() => import("./pages/Brands"));
const Sale = lazy(() => import("./pages/Sale"));
const AllProducts = lazy(() => import("./pages/AllProducts"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const Careers = lazy(() => import("./pages/Careers"));
const Blog = lazy(() => import("./pages/Blog"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Shipping = lazy(() => import("./pages/Shipping"));
const Returns = lazy(() => import("./pages/Returns"));
const SizeGuide = lazy(() => import("./pages/SizeGuide"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));

// ── Initialize GA4 once ──────────────────────────────────────────────────────
ReactGA.initialize("G-PG4JCWXQ3M");

const queryClient = new QueryClient();

// ── Page tracking hook ───────────────────────────────────────────────────────
const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    ReactGA.send({
      hitType: "pageview",
      page: location.pathname + location.search,
    });
  }, [location]);
};

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

  // ── Track every page navigation ──────────────────────────────────────────
  usePageTracking();

  return (
    <>
      {/* Sunny Effect in Light Mode */}
      {!isDark && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Main Sun Glow */}
          <div
            className="absolute -top-24 -right-24 w-96 h-96 bg-orange-200/20 blur-[120px] rounded-full animate-pulse"
            style={{ animationDuration: "8s" }}
          />
          {/* Secondary Warmth */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-100/5 via-transparent to-transparent" />
        </div>
      )}

      <ScrollToTop />
      <BackToTop />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route
            path="/"
            element={
              loading ? (
                <LoadingScreen />
              ) : user && isAdmin ? (
                <Navigate to="/admin" replace />
              ) : (
                <Index />
              )
            }
          />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/brand/:brandId" element={<BrandDetail />} />

          {/* If already logged in, prevent going back to login */}
          <Route
            path="/login"
            element={
              loading ? (
                <LoadingScreen />
              ) : user ? (
                <Navigate to={isAdmin ? "/admin" : "/"} />
              ) : (
                <Login />
              )
            }
          />

          <Route
            path="/signup"
            element={
              loading ? <LoadingScreen /> : user ? <Navigate to="/" /> : <Signup />
            }
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />

          {/* Footer Pages */}
          <Route path="/support" element={<Support />} />
          <Route path="/new-drops" element={<NewDrops />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/sale" element={<Sale />} />
          <Route path="/products" element={<AllProducts />} />
          <Route path="/wishlist" element={<Wishlist />} />
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
          <Route
            path="/admin/flexthekicks"
            element={<Navigate to="/admin" replace />}
          />

          {/* Unknown pages → Redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <WishlistProvider>
            <TooltipProvider>
              <CartProvider>
                <Toaster />
                <Sonner duration={2000} closeButton position="top-right" />
                <BrowserRouter>
                  <AppRoutes />
                </BrowserRouter>
              </CartProvider>
            </TooltipProvider>
          </WishlistProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;