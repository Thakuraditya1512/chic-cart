import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ArrowRight, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

// Standard WhatsApp Icon SVG
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.svg.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items: cartItems, clearCart, totalPrice } = useCart();

  const [step, setStep] = useState("customer"); // customer, address, review
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [customerData, setCustomerData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [addressData, setAddressData] = useState({
    address: "",
    city: "",
    zipCode: "",
  });

  // Redirect if no items in cart
  useEffect(() => {
    if (cartItems.length === 0 && step === "customer") {
      toast.error("Your cart is empty");
      navigate("/");
    }
  }, [cartItems, navigate, step]);

  const WHATSAPP_NUMBER = "1234567890"; // REPLACE WITH ACTUAL PHONE NUMBER WITH COUNTRY CODE

  const handleWhatsAppCheckout = () => {
    if (cartItems.length === 0) return;

    let message = "Hello, I would like to order the following items:\n\n";

    cartItems.forEach(item => {
      message += `Product: ${item.product.name}\n`;
      message += `Quantity: ${item.quantity}\n`;
      message += `Price: $${item.product.price.toFixed(2)}\n\n`;
    });

    const currentTotal = totalPrice + (totalPrice > 1000 ? 0 : 50);

    message += `Total: $${currentTotal.toFixed(2)}\n\n`;
    message += "Please confirm the order.";

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

    window.open(whatsappUrl, "_blank");
  };

  // Pre-fill email if user is logged in
  useEffect(() => {
    if (user?.email) {
      setCustomerData((prev) => ({
        ...prev,
        email: user.email || "",
      }));
    }
  }, [user]);

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!customerData.fullName.trim()) {
      setError("Full name is required");
      return;
    }
    if (!customerData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
      setError("Valid email is required");
      return;
    }
    if (!customerData.phone.trim() || customerData.phone.length < 10) {
      setError("Valid phone number is required");
      return;
    }

    setStep("address");
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!addressData.address.trim()) {
      setError("Address is required");
      return;
    }
    if (!addressData.city.trim()) {
      setError("City is required");
      return;
    }
    if (!addressData.zipCode.trim()) {
      setError("Zip code is required");
      return;
    }

    setStep("review");
  };

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      setError("");

      const orderData = {
        userId: user?.uid || "guest",
        customerName: customerData.fullName,
        email: customerData.email,
        phone: customerData.phone,
        address: addressData.address,
        city: addressData.city,
        zipCode: addressData.zipCode,
        items: cartItems.map((item) => {
          const itemData: any = {
            productId: item.product.id,
            productName: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
            image: item.product.image,
          };
          // Only add optional fields if they exist
          if (item.product.category) itemData.category = item.product.category;
          if ((item as any).size) itemData.size = (item as any).size;
          return itemData;
        }),
        subtotal: totalPrice,
        codCharge: totalPrice > 1000 ? 0 : 50, // Free COD for orders > $1000
        total: totalPrice + (totalPrice > 1000 ? 0 : 50),
        paymentMethod: "COD",
        status: "pending",
        createdAt: serverTimestamp(),
      };

      const ordersRef = collection(db, "orders");
      const docRef = await addDoc(ordersRef, orderData);

      toast.success("Order placed successfully!");
      clearCart();
      navigate(`/orders/${docRef.id}`);
    } catch (err) {
      console.error("Error placing order:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to place order";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <Card className="border border-border/50 backdrop-blur-xl bg-background/50">
            <CardHeader className="text-center">
              <CardTitle>Please Log In</CardTitle>
              <CardDescription>You need to be logged in to checkout</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sign in to your account or create a new one to proceed with checkout.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => navigate("/login")} className="flex-1">
                  Log In
                </Button>
                <Button onClick={() => navigate("/signup")} variant="outline" className="flex-1">
                  Sign Up
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-8 md:pt-12 pb-8 md:pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="w-6 h-6 text-primary" />
            <h1 className="font-display text-3xl font-bold">Checkout</h1>
          </div>
          <p className="text-muted-foreground">Complete your purchase</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert className="bg-destructive/10 border-destructive/50">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">{error}</AlertDescription>
              </Alert>
            )}

            {/* Customer Info Step */}
            {step === "customer" && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>1. Customer Information</CardTitle>
                    <CardDescription>Enter your contact details</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCustomerSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Full Name *</label>
                        <Input
                          placeholder="Name"
                          value={customerData.fullName}
                          onChange={(e) =>
                            setCustomerData({ ...customerData, fullName: e.target.value })
                          }
                          className="bg-muted/50 border-border/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email *</label>
                        <Input
                          type="email"
                          placeholder="Email"
                          value={customerData.email}
                          onChange={(e) =>
                            setCustomerData({ ...customerData, email: e.target.value })
                          }
                          className="bg-muted/50 border-border/50"
                          disabled
                        />
                        <p className="text-xs text-muted-foreground mt-1">From your account</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone Number *</label>
                        <Input
                          placeholder="Phone"
                          value={customerData.phone}
                          onChange={(e) =>
                            setCustomerData({ ...customerData, phone: e.target.value })
                          }
                          className="bg-muted/50 border-border/50"
                        />
                      </div>
                      <Button type="submit" className="w-full" size="lg">
                        Continue to Address <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Address Step */}
            {step === "address" && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>2. Delivery Address</CardTitle>
                    <CardDescription>Where should we deliver your order?</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddressSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Address *</label>
                        <Input
                          placeholder="123 Main St, Apt 4B"
                          value={addressData.address}
                          onChange={(e) =>
                            setAddressData({ ...addressData, address: e.target.value })
                          }
                          className="bg-muted/50 border-border/50"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">City *</label>
                          <Input
                            placeholder="New York"
                            value={addressData.city}
                            onChange={(e) =>
                              setAddressData({ ...addressData, city: e.target.value })
                            }
                            className="bg-muted/50 border-border/50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Zip Code *</label>
                          <Input
                            placeholder="10001"
                            value={addressData.zipCode}
                            onChange={(e) =>
                              setAddressData({ ...addressData, zipCode: e.target.value })
                            }
                            className="bg-muted/50 border-border/50"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button type="submit" className="flex-1" size="lg">
                          Continue to Review <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep("customer")}
                          size="lg"
                        >
                          Back
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Review Step */}
            {step === "review" && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Summary Cards */}
                <Card>
                  <CardHeader>
                    <CardTitle>3. Order Review</CardTitle>
                    <CardDescription>Confirm your details before placing order</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                        <p className="text-xs text-muted-foreground mb-1">CUSTOMER</p>
                        <p className="font-semibold">{customerData.fullName}</p>
                        <p className="text-sm text-muted-foreground">{customerData.email}</p>
                        <p className="text-sm text-muted-foreground">{customerData.phone}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                        <p className="text-xs text-muted-foreground mb-1">DELIVERY ADDRESS</p>
                        <p className="font-semibold">{addressData.address}</p>
                        <p className="text-sm text-muted-foreground">
                          {addressData.city}, {addressData.zipCode}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={handlePlaceOrder}
                        disabled={loading}
                        className="flex-1"
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Placing Order...
                          </>
                        ) : (
                          <>
                            Place Order <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStep("address")}
                        size="lg"
                      >
                        Back
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="sticky top-20 h-fit">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.product.name} × {item.quantity}
                      </span>
                      <span className="font-medium">${(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border/50 pt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">COD Charge</span>
                    <span>{totalPrice > 1000 ? "Free" : "$50"}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-border/50">
                    <span>Total</span>
                    <span className="text-primary">
                      ${(totalPrice + (totalPrice > 1000 ? 0 : 50)).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleWhatsAppCheckout}
                    className="w-full py-2.5 bg-[#25D366] text-white flex items-center justify-center gap-2 font-medium text-sm rounded-md transition-opacity hover:opacity-90"
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                    Checkout via WhatsApp
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-muted/30 text-xs mt-2">
                  <p className="text-muted-foreground">
                    ✓ Cash on Delivery (COD)
                    <br />✓ Free shipping on orders &gt; $1000
                    <br />✓ Track your order in real-time
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
