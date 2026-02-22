import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";
import BrandDetail from "./pages/BrandDetail";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";

const queryClient = new QueryClient();

/* ---------------- PROTECTED ROUTE ---------------- */

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (!isAdmin) return <Navigate to="/" replace />;

  return children;
};

const AppRoutes = () => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/brand/:brandId" element={<BrandDetail />} />

      {/* If already logged in, prevent going back to login */}
      <Route
        path="/login"
        element={user ? <Navigate to={isAdmin ? "/admin" : "/"} /> : <Login />}
      />

      <Route
        path="/signup"
        element={user ? <Navigate to="/" /> : <Signup />}
      />

      <Route path="/checkout" element={<Checkout />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/orders/:id" element={<Orders />} />

      {/* Admin Route */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        }
      />

      {/* Unknown pages → Redirect to Home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </CartProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;