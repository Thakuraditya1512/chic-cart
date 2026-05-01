import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Star as StarFilled, Plus, Loader2, LogOut, Truck, CheckCircle,
  Clock, Moon, Sun, Navigation, MapPin, Package, ShoppingBag, Star,
  ChevronDown, ChevronUp, Copy, Check, ChevronLeft, Circle,
  ClipboardCheck, PackageCheck, PackageSearch,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import {
  collection, query, where, getDocs, addDoc, serverTimestamp, orderBy,
} from "firebase/firestore";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€âinterface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  lane1?: string;
  lane2?: string;
  landmark?: string;
  address?: string;
  city: string;
  zipCode: string;
  location?: { latitude: number; longitude: number; googleMapsLink?: string };
  items: any[];
  subtotal: number;
  codCharge: number;
  total: number;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt: any;
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Constants
 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const STATUS_STEPS = [
  { key: "pending",          label: "Placed",           Icon: ClipboardCheck },
  { key: "confirmed",        label: "Confirmed",        Icon: CheckCircle     },
  { key: "packed",           label: "Packed",           Icon: PackageCheck    },
  { key: "shipped",          label: "Shipped",          Icon: Package         },
  { key: "out_for_delivery", label: "Out for delivery", Icon: Truck           },
  { key: "delivered",        label: "Delivered",        Icon: PackageSearch   },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:          { label: "Pending",          color: "text-orange-600 dark:text-orange-400",  bg: "bg-orange-50  dark:bg-orange-400/10  border-orange-200  dark:border-orange-400/20",  dot: "bg-orange-500"  },
  awaiting_payment: { label: "Awaiting Pay",     color: "text-yellow-600 dark:text-yellow-400",  bg: "bg-yellow-50  dark:bg-yellow-400/10  border-yellow-200  dark:border-yellow-400/20",  dot: "bg-yellow-500"  },
  paid:             { label: "Paid",             color: "text-emerald-600 dark:text-emerald-400",bg: "bg-emerald-50 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-400/20", dot: "bg-emerald-500" },
  confirmed:        { label: "Confirmed",        color: "text-blue-600   dark:text-blue-400",    bg: "bg-blue-50    dark:bg-blue-400/10    border-blue-200    dark:border-blue-400/20",    dot: "bg-blue-500"    },
  packed:           { label: "Packed",           color: "text-indigo-600 dark:text-indigo-400",  bg: "bg-indigo-50  dark:bg-indigo-400/10  border-indigo-200  dark:border-indigo-400/20",  dot: "bg-indigo-500"  },
  shipped:          { label: "Shipped",          color: "text-violet-600 dark:text-violet-400",  bg: "bg-violet-50  dark:bg-violet-400/10  border-violet-200  dark:border-violet-400/20",  dot: "bg-violet-500"  },
  out_for_delivery: { label: "Out for delivery", color: "text-amber-700  dark:text-amber-400",   bg: "bg-amber-50   dark:bg-amber-400/10   border-amber-200   dark:border-amber-400/20",   dot: "bg-amber-500"   },
  delivered:        { label: "Delivered",        color: "text-green-700  dark:text-green-400",   bg: "bg-green-50   dark:bg-green-400/10   border-green-200   dark:border-green-400/20",   dot: "bg-green-500"   },
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Tracking Map SVG (decorative)
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const TrackingMap = ({ dark }: { dark: boolean }) => (
  <div className={`relative rounded-xl overflow-hidden border ${dark ? "border-zinc-800 bg-zinc-900" : "border-gray-100 bg-gray-50"}`} style={{ height: 140 }}>
    {/* grid */}
    <svg className="absolute inset-0 w-full h-full opacity-20" preserveAspectRatio="none">
      <defs>
        <pattern id="mapgrid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M32 0L0 0 0 32" fill="none" stroke={dark ? "#ffffff" : "#000000"} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#mapgrid)" />
    </svg>

    {/* route */}
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 140" preserveAspectRatio="none">
      {/* dashed route line */}
      <path
        d="M 70 95 C 130 95 150 55 210 50 C 270 45 300 60 340 60"
        fill="none"
        stroke="#22c55e"
        strokeWidth="2.5"
        strokeDasharray="7 4"
        opacity="0.8"
      />
      {/* warehouse dot */}
      <circle cx="70" cy="95" r="7" fill="#3b82f6" stroke="white" strokeWidth="2" />
      {/* rider dot */}
      <circle cx="210" cy="50" r="7" fill="#f97316" stroke="white" strokeWidth="2" />
      {/* home dot */}
      <circle cx="340" cy="60" r="8" fill="#22c55e" stroke="white" strokeWidth="2.5" />
    </svg>

    {/* warehouse label */}
    <div className="absolute" style={{ left: "10%", top: "52%" }}>
      <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1 ${dark ? "bg-zinc-800 text-zinc-300 border border-zinc-700" : "bg-white text-gray-700 border border-gray-200"} shadow-sm`}>
        📦 Warehouse
      </div>
    </div>

    {/* home label */}
    <div className="absolute" style={{ right: "8%", top: "22%" }}>
      <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mb-1 ${dark ? "bg-zinc-800 text-zinc-300 border border-zinc-700" : "bg-white text-gray-700 border border-gray-200"} shadow-sm`}>
        ðŸ  Your address
      </div>
    </div>

    {/* ETA banner */}
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
      <div className={`text-[11px] font-semibold px-3 py-1.5 rounded-full ${dark ? "bg-zinc-900 text-green-400 border border-green-500/30" : "bg-white text-green-700 border border-green-200"} shadow whitespace-nowrap`}>
        🚴 ETA: Today by 7:00 PM · ~3.2 km away
      </div>
    </div>
  </div>
);

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Status Timeline
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const StatusTimeline = ({ status, dark }: { status: string; dark: boolean }) => {
  const currentIdx = STATUS_STEPS.findIndex(s => s.key === status);

  return (
    <div className={`px-4 py-4 ${dark ? "bg-zinc-900/60" : "bg-gray-50/80"}`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${dark ? "text-zinc-500" : "text-gray-400"}`}>Order journey</p>
      <div className="flex items-start">
        {STATUS_STEPS.map((step, i) => {
          const done   = i < currentIdx;
          const active = i === currentIdx;
          const future = i > currentIdx;
          const Icon   = step.Icon;

          return (
            <div key={step.key} className="flex flex-col items-center flex-1">
              {/* connector + node row */}
              <div className="flex items-center w-full">
                {/* left line */}
                <div className={`flex-1 h-0.5 ${i === 0 ? "opacity-0" : done || active ? "bg-green-500" : dark ? "bg-zinc-700" : "bg-gray-200"}`} />
                {/* node */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all
                  ${active
                    ? "bg-green-500 ring-4 ring-green-500/20"
                    : done
                    ? "bg-green-500"
                    : dark ? "bg-zinc-800 border border-zinc-700" : "bg-white border border-gray-200"
                  }`}>
                  <Icon className={`w-3.5 h-3.5 ${active || done ? "text-white" : dark ? "text-zinc-600" : "text-gray-300"}`} />
                </div>
                {/* right line */}
                <div className={`flex-1 h-0.5 ${i === STATUS_STEPS.length - 1 ? "opacity-0" : done ? "bg-green-500" : dark ? "bg-zinc-700" : "bg-gray-200"}`} />
              </div>
              {/* label */}
              <p className={`text-center mt-1.5 leading-tight px-0.5
                text-[9px] font-semibold
                ${active ? "text-green-500" : done ? (dark ? "text-zinc-300" : "text-gray-600") : dark ? "text-zinc-600" : "text-gray-300"}`}>
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Order Card
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const OrderCard = ({ order, index, expanded, onToggle, onReview, reviewedIds, dark }: any) => {
  const meta = STATUS_META[order.status] || STATUS_META.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`rounded-2xl border overflow-hidden ${dark ? "bg-zinc-900/70 border-zinc-800/80" : "bg-white border-gray-100 shadow-sm"}`}
    >
      {/* â”€â”€ Collapsed header â”€â”€ */}
      <button onClick={onToggle} className="w-full text-left">
        <div className={`px-4 py-4 flex items-center gap-3 transition-colors ${dark ? "hover:bg-white/[0.02]" : "hover:bg-gray-50/60"}`}>

          {/* status dot */}
          <div className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className={`text-[10px] font-bold tracking-wider uppercase ${dark ? "text-zinc-500" : "text-gray-400"}`}>
                #{order.id.slice(0, 8).toUpperCase()}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>
                {meta.label}
              </span>
            </div>
            <p className={`text-[13px] font-semibold truncate ${dark ? "text-white" : "text-gray-900"}`}>
              {order.items.map((i: any) => i.productName).join(", ")}
            </p>
            <p className={`text-[11px] mt-0.5 ${dark ? "text-zinc-500" : "text-gray-400"}`}>
              {order.createdAt?.toDate?.()?.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) || "—"}
              {" · "}{order.items.length} {order.items.length === 1 ? "item" : "items"}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={`text-[15px] font-bold ${dark ? "text-white" : "text-gray-900"}`}>
              ₹{order.total.toLocaleString("en-IN")}
            </span>
            <span className={`text-xs ${dark ? "text-zinc-500" : "text-gray-400"}`}>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </div>
        </div>
      </button>

      {/* â”€â”€ Expanded body â”€â”€ */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={`border-t ${dark ? "border-zinc-800/80" : "border-gray-100"}`}>

              {/* Timeline */}
              <StatusTimeline status={order.status} dark={dark} />

              {/* Map â€” only for out_for_delivery */}
              {order.status === "out_for_delivery" && (
                <div className={`px-4 pb-4 border-t ${dark ? "border-zinc-800/60" : "border-gray-100"}`}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-4 mb-2 ${dark ? "text-zinc-500" : "text-gray-400"}`}>
                    Live tracking
                  </p>
                  <TrackingMap dark={dark} />
                </div>
              )}

              {/* Items */}
              <div className={`px-4 py-4 border-t ${dark ? "border-zinc-800/60" : "border-gray-100"}`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${dark ? "text-zinc-500" : "text-gray-400"}`}>Items</p>
                <div className="space-y-3">
                  {order.items.map((item: any, i: number) => (
                    <div key={i} className={`flex gap-3 p-3 rounded-xl border ${dark ? "bg-zinc-800/50 border-zinc-700/50" : "bg-gray-50 border-gray-100"}`}>
                      {item.image
                        ? <img src={item.image} alt={item.productName} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                        : <div className={`w-14 h-14 rounded-lg shrink-0 flex items-center justify-center ${dark ? "bg-zinc-700" : "bg-gray-100"}`}>
                            <Package className={`w-5 h-5 ${dark ? "text-zinc-500" : "text-gray-300"}`} />
                          </div>
                      }
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-1.5 flex-wrap mt-1.5 mb-2">
                          {[`Qty ${item.quantity}`, item.size && `Size ${item.size}`, `₹${item.price.toLocaleString("en-IN")} each`]
                            .filter(Boolean)
                            .map((tag, ti) => (
                              <span key={ti} className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${dark ? "bg-zinc-700 text-zinc-400" : "bg-gray-100 text-gray-500"}`}>
                                {tag}
                              </span>
                            ))}
                        </div>
                        {order.status === "delivered" && (
                          reviewedIds.has(item.productId)
                            ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-500">
                                <CheckCircle className="w-3 h-3" /> Reviewed
                              </span>
                            : <button
                                onClick={e => { e.stopPropagation(); onReview(order, item); }}
                                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all active:scale-95"
                              >
                                <Star className="w-3 h-3" /> Write a review · Earn 10% off
                              </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info grid: address + payment */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x border-t ${dark ? "border-zinc-800/60 divide-zinc-800/60" : "border-gray-100 divide-gray-100"}`}>
                {/* Address */}
                <div className="p-4">
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${dark ? "text-zinc-500" : "text-gray-400"}`}>Delivery address</p>
                  <p className={`font-semibold text-[13px] ${dark ? "text-white" : "text-gray-900"}`}>{order.customerName}</p>
                  <div className={`text-[12px] mt-1 space-y-0.5 ${dark ? "text-zinc-400" : "text-gray-500"}`}>
                    {order.lane1 ? (
                      <>
                        <p>{order.lane1}</p>
                        {order.lane2 && <p>{order.lane2}</p>}
                        {order.landmark && <p className="italic">Near {order.landmark}</p>}
                        <p>{order.city} – {order.zipCode}</p>
                      </>
                    ) : (
                      <p>{order.address}</p>
                    )}
                  </div>
                  {order.location?.googleMapsLink && (
                    <a
                      href={order.location.googleMapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all"
                    >
                      <Navigation className="w-3 h-3" /> Get directions
                    </a>
                  )}
                </div>

                {/* Payment */}
                <div className="p-4">
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${dark ? "text-zinc-500" : "text-gray-400"}`}>Payment summary</p>
                  <div className="space-y-1.5">
                    {[
                      { label: "Subtotal", val: `₹${order.subtotal.toLocaleString("en-IN")}` },
                      { label: "Shipping / COD", val: order.codCharge > 0 ? `₹${order.codCharge}` : "Free" },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex justify-between text-[12px]">
                        <span className={dark ? "text-zinc-500" : "text-gray-400"}>{label}</span>
                        <span className={dark ? "text-zinc-300" : "text-gray-600"}>{val}</span>
                      </div>
                    ))}
                    <div className={`flex justify-between pt-2 mt-1 border-t text-[13px] font-bold ${dark ? "border-zinc-700/50" : "border-gray-100"}`}>
                      <span className={dark ? "text-zinc-300" : "text-gray-700"}>Total</span>
                      <span className="text-blue-500">₹{order.total.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Empty State
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const EmptyState = ({ icon: Icon, title, subtitle, dark, cta }: any) => (
  <div className={`rounded-2xl border p-12 text-center ${dark ? "bg-zinc-900/50 border-zinc-800/60" : "bg-white border-gray-100"}`}>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${dark ? "bg-zinc-800" : "bg-gray-50"}`}>
      <Icon className={`w-5 h-5 ${dark ? "text-zinc-600" : "text-gray-300"}`} />
    </div>
    <p className={`font-semibold text-sm ${dark ? "text-white" : "text-gray-900"}`}>{title}</p>
    <p className={`text-xs mt-1 mb-5 ${dark ? "text-zinc-500" : "text-gray-400"}`}>{subtitle}</p>
    {cta && (
      <button
        onClick={cta.onClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all active:scale-95"
      >
        {cta.label}
      </button>
    )}
  </div>
);

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
   Main Orders Page
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const Orders = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders]         = useState<Order[]>([]);
  const [loading, setLoading]       = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [isDark, setIsDark]         = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("theme") !== "light" : true
  );
  const [activeTab, setActiveTab]   = useState<"orders" | "addresses">("orders");
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  /* review state */
  const [reviewModalOpen, setReviewModalOpen]   = useState(false);
  const [reviewOrder, setReviewOrder]           = useState<Order | null>(null);
  const [reviewItem, setReviewItem]             = useState<any>(null);
  const [rating, setRating]                     = useState(0);
  const [hoverRating, setHoverRating]           = useState(0);
  const [comment, setComment]                   = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedIds, setReviewedIds]           = useState<Set<string>>(new Set());

  /* coupon state */
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode]           = useState("");
  const [copiedCoupon, setCopiedCoupon]       = useState(false);

  /* theme sync */
  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  /* data fetching */
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(query(collection(db, "orders"), where("userId", "==", user?.uid)));
      setOrders(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Order))
          .sort((a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0))
      );
    } catch { toast.error("Failed to load orders"); }
    finally { setLoading(false); }
  };

  const fetchReviews = async () => {
    const snap = await getDocs(query(collection(db, "reviews"), where("userId", "==", user?.uid)));
    setReviewedIds(new Set(snap.docs.map(d => d.data().productId)));
  };

  const fetchAddresses = async () => {
    const snap = await getDocs(
      query(collection(db, "orders"), where("userId", "==", user?.uid), orderBy("createdAt", "desc"))
    );
    const seen = new Set<string>();
    const addrs: any[] = [];
    snap.docs.forEach(d => {
      const data = d.data();
      if (data.lane1 && data.city) {
        const key = `${data.lane1}-${data.city}-${data.zipCode}`.toLowerCase();
        if (!seen.has(key)) {
          addrs.push({ lane1: data.lane1, lane2: data.lane2 || "", landmark: data.landmark || "",
            city: data.city, zipCode: data.zipCode, location: data.location || null });
          seen.add(key);
        }
      }
    });
    setSavedAddresses(addrs);
  };

  useEffect(() => {
    if (user) { fetchOrders(); fetchReviews(); fetchAddresses(); }
  }, [user]);

  /* review submit */
  const submitReview = async () => {
    if (!rating)         { toast.error("Please select a rating"); return; }
    if (!comment.trim()) { toast.error("Please add a comment");   return; }
    try {
      setSubmittingReview(true);
      await addDoc(collection(db, "reviews"), {
        productId: reviewItem.productId, productName: reviewItem.productName,
        userId: user?.uid, orderId: reviewOrder?.id,
        customerName: reviewOrder?.customerName || user?.email?.split("@")[0],
        rating, comment, images: [], createdAt: serverTimestamp(),
      });
      const code = `CHIC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await addDoc(collection(db, "coupons"), {
        code, discountPercent: 10, userId: user?.uid, isUsed: false,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      });
      setReviewedIds(prev => new Set([...prev, reviewItem.productId]));
      setCouponCode(code);
      setReviewModalOpen(false);
      setShowCouponModal(true);
      toast.success("Review submitted! 🎉");
    } catch { toast.error("Failed to submit review"); }
    finally { setSubmittingReview(false); }
  };

  const copyCoupon = async () => {
    await navigator.clipboard.writeText(couponCode);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  /* loading screen */
  if (loading) return (
    <div className={`min-h-screen flex items-center justify-center transition-colors ${isDark ? "bg-black" : "bg-gray-50"}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-14 h-14">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-blue-500/20 border-t-blue-500"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-blue-400" />
          </div>
        </div>
        <p className={`text-xs font-bold tracking-[0.2em] uppercase ${isDark ? "text-zinc-500" : "text-gray-400"}`}>
          Loading your orders…
        </p>
      </div>
    </div>
  );

  const dk = isDark;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${dk ? "bg-[#0a0a0a]" : "bg-gray-50"}`}>
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">

        {/* â”€â”€ Header â”€â”€ */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6 gap-2">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate("/")}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 transition-colors
                ${dk ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className={`text-lg font-bold tracking-tight ${dk ? "text-white" : "text-gray-900"}`}>My account</h1>
              <p className={`text-[11px] truncate max-w-[200px] ${dk ? "text-zinc-500" : "text-gray-400"}`}>{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsDark(!isDark)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors
                ${dk ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}
            >
              {dk ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={async () => { await logout(); navigate("/login"); }}
              className={`h-9 px-3 rounded-xl flex items-center gap-1.5 border text-[11px] font-semibold transition-colors
                ${dk ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-400/30" : "bg-white border-gray-200 text-gray-500 hover:text-red-500"}`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </motion.div>

        {/* â”€â”€ Stats â”€â”€ */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            { label: "Total orders",    value: orders.length,                                                          Icon: ShoppingBag  },
            { label: "Delivered",       value: orders.filter(o => o.status === "delivered").length,                    Icon: CheckCircle  },
            { label: "In transit",      value: orders.filter(o => !["delivered","pending"].includes(o.status)).length, Icon: Truck        },
          ].map(({ label, value, Icon }) => (
            <div key={label} className={`rounded-2xl border p-4 ${dk ? "bg-zinc-900/60 border-zinc-800/60" : "bg-white border-gray-100 shadow-sm"}`}>
              <Icon className={`w-4 h-4 mb-2.5 ${dk ? "text-zinc-600" : "text-gray-300"}`} />
              <p className={`text-2xl font-bold leading-none ${dk ? "text-white" : "text-gray-900"}`}>{value}</p>
              <p className={`text-[10px] font-medium mt-1.5 ${dk ? "text-zinc-600" : "text-gray-400"}`}>{label}</p>
            </div>
          ))}
        </motion.div>

        {/* â”€â”€ Tabs â”€â”€ */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}
          className={`flex gap-1 p-1 rounded-xl border mb-5 ${dk ? "bg-zinc-900/60 border-zinc-800/60" : "bg-white border-gray-100 shadow-sm"}`}>
          {(["orders", "addresses"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === tab
                  ? dk ? "bg-white text-black shadow-sm" : "bg-gray-900 text-white shadow-sm"
                  : dk ? "text-zinc-500 hover:text-zinc-300" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab === "orders" ? `Orders (${orders.length})` : "Addresses"}
            </button>
          ))}
        </motion.div>

        {/* â”€â”€ Content â”€â”€ */}
        <AnimatePresence mode="wait">
          {activeTab === "addresses" ? (
            <motion.div key="addresses" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              {savedAddresses.length === 0
                ? <EmptyState icon={MapPin} title="No saved addresses" subtitle="Addresses from your orders appear here" dark={dk} />
                : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {savedAddresses.map((addr, i) => (
                      <motion.div key={i} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                        className={`rounded-2xl border p-4 ${dk ? "bg-zinc-900/60 border-zinc-800/60" : "bg-white border-gray-100 shadow-sm"}`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${dk ? "bg-zinc-800 text-zinc-500" : "bg-gray-100 text-gray-400"}`}>
                            Address {i + 1}
                          </span>
                          <MapPin className={`w-3.5 h-3.5 ${dk ? "text-zinc-600" : "text-gray-300"}`} />
                        </div>
                        <p className={`font-semibold text-sm ${dk ? "text-white" : "text-gray-900"}`}>{addr.lane1}</p>
                        {addr.lane2    && <p className={`text-xs mt-0.5 ${dk ? "text-zinc-400" : "text-gray-500"}`}>{addr.lane2}</p>}
                        {addr.landmark && <p className={`text-xs italic mt-0.5 ${dk ? "text-zinc-500" : "text-gray-400"}`}>Near {addr.landmark}</p>}
                        <p className={`text-xs font-medium mt-1 ${dk ? "text-zinc-400" : "text-gray-500"}`}>{addr.city} – {addr.zipCode}</p>
                        {addr.location?.googleMapsLink && (
                          <a href={addr.location.googleMapsLink} target="_blank" rel="noopener noreferrer"
                            className="mt-3 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold tracking-wide uppercase transition-all">
                            <Navigation className="w-3 h-3" /> Get directions
                          </a>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
            </motion.div>
          ) : (
            <motion.div key="orders" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-3">
              {orders.length === 0
                ? <EmptyState icon={ShoppingBag} title="No orders yet" subtitle="Your order history will appear here" dark={dk}
                    cta={{ label: "Start shopping", onClick: () => navigate("/") }} />
                : orders.map((order, i) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    index={i}
                    expanded={expandedOrder === order.id}
                    onToggle={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    onReview={(o: Order, item: any) => {
                      setReviewOrder(o); setReviewItem(item); setRating(0); setComment(""); setReviewModalOpen(true);
                    }}
                    reviewedIds={reviewedIds}
                    dark={dk}
                  />
                ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* â”€â”€ Footer CTA â”€â”€ */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8 text-center">
          <button onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all active:scale-95">
            <ShoppingBag className="w-4 h-4" /> Continue shopping
          </button>
        </motion.div>
      </div>

      {/* â•â• Review Modal â•â• */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className={`max-w-sm mx-4 rounded-2xl border p-0 overflow-hidden shadow-2xl
          ${dk ? "bg-[#111118] border-white/10 text-white" : "bg-white border-black/10 text-gray-900"}`}>
          <div className={`px-5 pt-5 pb-4 border-b ${dk ? "border-white/[0.07]" : "border-gray-100"}`}>
            <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${dk ? "text-white/40" : "text-gray-400"}`}>Write a review</p>
            <h2 className="text-base font-bold leading-tight">{reviewItem?.productName}</h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div>
              <p className={`text-[9px] font-bold uppercase tracking-widest mb-2.5 ${dk ? "text-white/40" : "text-gray-400"}`}>Rating</p>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setRating(s)}
                    onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110 active:scale-95">
                    <StarFilled className={`w-8 h-8 transition-colors ${
                      s <= (hoverRating || rating) ? "text-amber-400 fill-amber-400" : dk ? "text-white/10 fill-white/10" : "text-gray-200 fill-gray-200"
                    }`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className={`text-[9px] font-bold uppercase tracking-widest mb-2 ${dk ? "text-white/40" : "text-gray-400"}`}>Your review</p>
              <Textarea
                value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Tell others what you think…"
                className={`rounded-xl min-h-[90px] text-sm border resize-none focus-visible:ring-1 focus-visible:ring-blue-500
                  ${dk ? "bg-white/[0.03] border-white/10 text-white placeholder:text-white/20" : "bg-gray-50 border-gray-200 placeholder:text-gray-300"}`}
              />
            </div>
          </div>
          <div className={`px-5 py-4 flex gap-2 border-t ${dk ? "border-white/[0.07] bg-white/[0.02]" : "border-gray-100 bg-gray-50"}`}>
            <button onClick={() => setReviewModalOpen(false)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all
                ${dk ? "border-white/10 text-white/50 hover:bg-white/[0.04]" : "border-gray-200 text-gray-400 hover:bg-gray-100"}`}>
              Cancel
            </button>
            <button onClick={submitReview} disabled={submittingReview}
              className="flex-[2] py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold transition-all">
              {submittingReview ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Submit review"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* â•â• Coupon Modal â•â• */}
      <Dialog open={showCouponModal} onOpenChange={setShowCouponModal}>
        <DialogContent className={`max-w-xs mx-4 rounded-2xl border p-0 overflow-hidden shadow-2xl
          ${dk ? "bg-[#111118] border-white/10 text-white" : "bg-white border-black/10 text-gray-900"}`}>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 text-center">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Review submitted!</h2>
            <p className="text-blue-100/70 text-xs mt-1">You've earned a reward</p>
          </div>
          <div className="p-5 space-y-4 text-center">
            <div>
              <p className={`text-[9px] font-bold uppercase tracking-widest mb-3 ${dk ? "text-white/40" : "text-gray-400"}`}>Your coupon</p>
              <div className={`relative rounded-xl border-2 border-dashed p-4
                ${dk ? "border-white/10 bg-white/[0.02]" : "border-gray-200 bg-gray-50"}`}>
                <p className="text-xl font-bold tracking-widest text-blue-500 mb-1">{couponCode}</p>
                <p className={`text-[11px] ${dk ? "text-white/30" : "text-gray-400"}`}>10% off · Valid 10 days</p>
                <button onClick={copyCoupon}
                  className={`absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center transition-colors
                    ${dk ? "bg-white/5 hover:bg-white/10" : "bg-gray-100 hover:bg-gray-200"}`}>
                  {copiedCoupon
                    ? <Check className="w-3.5 h-3.5 text-green-500" />
                    : <Copy className={`w-3.5 h-3.5 ${dk ? "text-white/40" : "text-gray-400"}`} />}
                </button>
              </div>
            </div>
            <button onClick={() => { setShowCouponModal(false); navigate("/"); }}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all active:scale-95">
              Start shopping
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
