import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, LogOut, Truck, CheckCircle, Clock } from "lucide-react";
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

const Orders = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, where("userId", "==", user.uid));
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-8 md:pt-12 pb-8 md:pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Truck className="w-6 h-6 text-primary" />
              <h1 className="font-display text-3xl font-bold">My Orders</h1>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
          <p className="text-muted-foreground">Track your purchases and deliveries</p>
        </motion.div>

        {/* User Info Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Logged in as</p>
                  <p className="font-semibold">{user?.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-primary">{orders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="pt-12 text-center">
                <Truck className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
                <p className="text-muted-foreground mb-6">You haven't placed any orders yet.</p>
                <Button onClick={() => navigate("/")} size="lg">
                  Start Shopping
                </Button>
              </CardContent>
            </Card>
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
                <Card
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() =>
                    setExpandedOrder(expandedOrder === order.id ? null : order.id)
                  }
                >
                  {/* Order Header */}
                  <div className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-display font-bold text-primary">Order #{order.id.slice(0, 8)}</h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.createdAt?.toDate?.()?.toLocaleDateString() || "Date unavailable"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Order Total</p>
                      <p className="text-2xl font-bold text-primary">${order.total.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedOrder === order.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-border/50 bg-secondary/30 p-4 md:p-6 space-y-4"
                    >
                      {/* Items */}
                      <div>
                        <p className="text-xs font-bold text-primary mb-3">ITEMS ORDERED ({order.items.length})</p>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between text-sm p-2 bg-background/50 rounded border border-border/50"
                            >
                              <div>
                                <p className="font-medium truncate">{item.productName}</p>
                                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                              </div>
                              <p className="font-semibold text-primary">
                                ${(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Pricing */}
                      <div className="bg-background/50 p-3 rounded border border-border/50 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">COD Charge</span>
                          <span>${order.codCharge.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t border-border/50 pt-2">
                          <span>Total</span>
                          <span className="text-primary">${order.total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Delivery Address */}
                      <div>
                        <p className="text-xs font-bold text-primary mb-2">DELIVERY ADDRESS</p>
                        <div className="p-3 bg-background/50 rounded border border-border/50 text-sm">
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-muted-foreground">{order.address}</p>
                          <p className="text-muted-foreground">
                            {order.city}, {order.zipCode}
                          </p>
                          <p className="text-muted-foreground mt-2 text-xs">Phone: {order.phone}</p>
                        </div>
                      </div>

                      {/* Status Timeline */}
                      <div>
                        <p className="text-xs font-bold text-primary mb-3">ORDER TIMELINE</p>
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
                                      ? "bg-primary"
                                      : "bg-muted"
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
                                      ? "text-foreground"
                                      : "text-muted-foreground"
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
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Continue Shopping Button */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 text-center">
          <Button onClick={() => navigate("/")} variant="outline" size="lg">
            Continue Shopping
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Orders;
