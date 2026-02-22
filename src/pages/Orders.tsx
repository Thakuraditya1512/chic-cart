import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogOut, Truck, CheckCircle, Clock, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "sonner";

interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zipCode: string;
  items: any[];
  subtotal: number;
  codCharge: number;
  total: number;
  status: string;
  createdAt: any;
}

const statusOptions = ["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"];

const Orders = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("userId", "==", user?.uid));
      const snapshot = await getDocs(q);
      const fetchedOrders = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Order))
        .sort((a, b) => {
          const timeA = a.createdAt?.toDate?.() || new Date(0);
          const timeB = b.createdAt?.toDate?.() || new Date(0);
          return timeB.getTime() - timeA.getTime();
        });
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    fetchOrders();
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "confirmed":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/50";
      case "packed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
      case "shipped":
        return "bg-purple-500/20 text-purple-400 border-purple-500/50";
      case "out_for_delivery":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50";
      case "delivered":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-4 h-4" />;
      case "out_for_delivery":
        return <Truck className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDarkMode ? "bg-gray-900" : "bg-white"
      }`}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            Loading your orders...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-8 md:pt-12 pb-8 md:pb-12 px-4 transition-colors ${
      isDarkMode ? "bg-gray-900" : "bg-gray-50"
    }`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Truck className={`w-6 h-6 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
              <h1 className={`font-display text-3xl font-bold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}>My Orders</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-2 rounded-lg transition-all ${
                  isDarkMode
                    ? "bg-gray-800 text-yellow-400 hover:bg-gray-700"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                title="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <Button onClick={handleLogout} variant="outline" size="sm"
                className={isDarkMode ? "border-gray-700 text-gray-300 hover:bg-gray-800" : ""}
              >
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          </div>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            Track your purchases and deliveries
          </p>
        </motion.div>

        {/* User Info Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className={`p-6 rounded-lg border ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm mb-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}>Logged in as</p>
                <p className={`font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>{user?.email}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm mb-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}>Total Orders</p>
                <p className={`text-2xl font-bold ${
                  isDarkMode ? "text-blue-400" : "text-blue-600"
                }`}>{orders.length}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className={`p-12 rounded-lg border text-center ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}>
              <Truck className={`w-12 h-12 mx-auto mb-4 opacity-50 ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`} />
              <h3 className={`text-lg font-semibold mb-2 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}>No Orders Yet</h3>
              <p className={`mb-6 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}>You haven't placed any orders yet.</p>
              <Button onClick={() => navigate("/")} size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Shopping
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className={`cursor-pointer rounded-lg border transition-all ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                      : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() =>
                    setExpandedOrder(expandedOrder === order.id ? null : order.id)
                  }
                >
                  {/* Order Header */}
                  <div className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 border-b" style={{
                    borderColor: isDarkMode ? "#4b5563" : "#e5e7eb"
                  }}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className={`font-display font-bold ${
                          isDarkMode ? "text-blue-400" : "text-blue-600"
                        }`}>Order #{order.id.slice(0, 8)}</h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}>
                        {order.createdAt?.toDate?.()?.toLocaleDateString() || "Date unavailable"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm mb-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}>Order Total</p>
                      <p className={`text-2xl font-bold ${
                        isDarkMode ? "text-blue-400" : "text-blue-600"
                      }`}>${order.total.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedOrder === order.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`p-4 md:p-6 space-y-4 ${
                        isDarkMode ? "bg-gray-750" : "bg-gray-50"
                      }`}
                    >
                      {/* Items */}
                      <div>
                        <p className={`text-xs font-bold mb-3 ${
                          isDarkMode ? "text-blue-400" : "text-blue-600"
                        }`}>ITEMS ORDERED ({order.items.length})</p>
                        <div className="space-y-3">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className={`flex gap-4 p-3 rounded border transition-colors ${
                                isDarkMode
                                  ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                                  : "bg-white border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              {/* Product Image */}
                              {item.image && (
                                <div className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded overflow-hidden ${
                                  isDarkMode ? "bg-gray-700" : "bg-gray-200"
                                }`}>
                                  <img
                                    src={item.image}
                                    alt={item.productName}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              
                              {/* Product Details */}
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium truncate transition-colors ${
                                  isDarkMode ? "text-white hover:text-blue-400" : "text-gray-900 hover:text-blue-600"
                                }`}>
                                  {item.productName}
                                </p>
                                <p className={`text-xs mb-2 ${
                                  isDarkMode ? "text-gray-400" : "text-gray-600"
                                }`}>
                                  Quantity: {item.quantity} × ${item.price.toFixed(2)}
                                </p>
                                {item.size && (
                                  <p className={`text-xs mb-2 capitalize ${
                                    isDarkMode ? "text-gray-400" : "text-gray-600"
                                  }`}>
                                    Size: {item.size}
                                  </p>
                                )}
                                {item.category && (
                                  <p className={`text-xs mb-2 capitalize ${
                                    isDarkMode ? "text-gray-400" : "text-gray-600"
                                  }`}>
                                    Category: {item.category}
                                  </p>
                                )}
                                <div className={`text-sm font-semibold ${
                                  isDarkMode ? "text-blue-400" : "text-blue-600"
                                }`}>
                                  ${(item.price * item.quantity).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className={`p-3 rounded border space-y-2 text-sm ${
                        isDarkMode
                          ? "bg-gray-800 border-gray-700"
                          : "bg-white border-gray-200"
                      }`}>
                        <div className="flex justify-between">
                          <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Subtotal</span>
                          <span className={isDarkMode ? "text-white" : "text-gray-900"}>${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>COD Charge</span>
                          <span className={isDarkMode ? "text-white" : "text-gray-900"}>${order.codCharge.toFixed(2)}</span>
                        </div>
                        <div className={`flex justify-between font-bold pt-2 border-t ${
                          isDarkMode ? "border-gray-700" : "border-gray-200"
                        }`}>
                          <span className={isDarkMode ? "text-white" : "text-gray-900"}>Total</span>
                          <span className={`${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>${order.total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Delivery Address */}
                      <div>
                        <p className={`text-xs font-bold mb-2 ${
                          isDarkMode ? "text-blue-400" : "text-blue-600"
                        }`}>DELIVERY ADDRESS</p>
                        <div className={`p-3 rounded border text-sm ${
                          isDarkMode
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-gray-200"
                        }`}>
                          <p className={`font-medium ${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}>{order.customerName}</p>
                          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>{order.address}</p>
                          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                            {order.city}, {order.zipCode}
                          </p>
                          <p className={`mt-2 text-xs ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}>Phone: {order.phone}</p>
                        </div>
                      </div>

                      {/* Order Status - Read Only for Users */}
                      <div>
                        <p className={`text-xs font-bold mb-3 ${
                          isDarkMode ? "text-blue-400" : "text-blue-600"
                        }`}>ORDER STATUS</p>
                        <div className={`px-3 py-2 rounded border text-xs font-bold tracking-wider ${
                          order.status === "pending"
                            ? isDarkMode ? "bg-yellow-900/30 border-yellow-700 text-yellow-400" : "bg-yellow-50 border-yellow-300 text-yellow-700"
                            : order.status === "delivered"
                            ? isDarkMode ? "bg-green-900/30 border-green-700 text-green-400" : "bg-green-50 border-green-300 text-green-700"
                            : isDarkMode ? "bg-blue-900/30 border-blue-700 text-blue-400" : "bg-blue-50 border-blue-300 text-blue-700"
                        }`}>
                          {order.status.replace("_", " ").toUpperCase()}
                        </div>
                        <p className={`text-xs font-bold mb-3 mt-4 ${
                          isDarkMode ? "text-blue-400" : "text-blue-600"
                        }`}>ORDER TIMELINE</p>
                        <div className="space-y-2">
                          {["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"].map(
                            (statusStep) => (
                              <div key={statusStep} className="flex items-center gap-3 text-sm">
                                <div
                                  className={`w-3 h-3 rounded-full ${
                                    ["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"]
                                      .indexOf(statusStep) <=
                                    ["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"].indexOf(
                                      order.status
                                    )
                                      ? "bg-blue-500"
                                      : isDarkMode ? "bg-gray-700" : "bg-gray-300"
                                  }`}
                                />
                                <span
                                  className={
                                    ["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"].indexOf(
                                      statusStep
                                    ) <=
                                    ["pending", "confirmed", "packed", "shipped", "out_for_delivery", "delivered"].indexOf(
                                      order.status
                                    )
                                      ? isDarkMode ? "text-white" : "text-gray-900"
                                      : isDarkMode ? "text-gray-400" : "text-gray-600"
                                  }
                                >
                                  {statusStep.replace("_", " ").toUpperCase()}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Continue Shopping Button */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 text-center">
          <Button onClick={() => navigate("/")} size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Continue Shopping
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Orders;
