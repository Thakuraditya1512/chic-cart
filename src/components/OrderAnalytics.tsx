/**
 * OrderAnalytics.tsx
 *
 * Drop this component into your Admin dashboard and render it
 * inside the "customers" (Orders) tab — above or below the orders list.
 *
 * ── INSTALL THESE PACKAGES ──────────────────────────────────────────────────
 *
 *   npm install recharts react-simple-maps d3-scale
 *
 *   recharts         → bar / area / pie charts
 *   react-simple-maps → SVG world-map (outline, no external tiles needed)
 *   d3-scale         → color-scale for the choropleth map
 *
 * ── USAGE ───────────────────────────────────────────────────────────────────
 *
 *   import OrderAnalytics from "@/components/OrderAnalytics";
 *
 *   // Inside your Orders tab JSX:
 *   <OrderAnalytics orders={orders} />
 *
 * ── ORDER SHAPE EXPECTED ────────────────────────────────────────────────────
 *
 *   Each order should have at minimum:
 *     id, total, status, city, createdAt (Firestore Timestamp | ISO string)
 *
 *   The city field is used to bucket orders by geography.
 *   If your orders also have a `country` field, pass it and the world map
 *   will automatically highlight those countries.
 */

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
    ComposableMap, Geographies, Geography, ZoomableGroup,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import {
    TrendingUp, ShoppingBag, DollarSign, Clock,
    Package, CheckCircle, Truck, MapPin, ZoomIn, ZoomOut, RotateCcw,
} from "lucide-react";

// ─── World topojson (no install needed — hosted CDN) ────────────────────────
const GEO_URL =
    "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Order {
    id: string;
    customerName?: string;
    total: number;
    status: string;
    city?: string;
    country?: string;          // ISO-3166 alpha-2 or full name
    countryCode?: string;      // ISO numeric string e.g. "356" for India
    createdAt?: any;
}

interface Props {
    orders: Order[];
}

// ─── Color palette ──────────────────────────────────────────────────────────
const ACCENT = "#6c5ce7";
const ACCENT2 = "#a855f7";
const EMERALD = "#34d399";
const AMBER = "#fbbf24";
const ROSE = "#f87171";
const CYAN = "#22d3ee";
const CHART_BG = "transparent";

const STATUS_COLOR: Record<string, string> = {
    pending: AMBER,
    confirmed: CYAN,
    packed: ACCENT,
    shipped: ACCENT2,
    out_for_delivery: "#fb923c",
    delivered: EMERALD,
};

const STATUS_LABEL: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    packed: "Packed",
    shipped: "Shipped",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseDate(createdAt: any): Date {
    if (!createdAt) return new Date(0);
    if (typeof createdAt.toDate === "function") return createdAt.toDate();
    if (typeof createdAt === "string" || typeof createdAt === "number")
        return new Date(createdAt);
    return new Date(0);
}

function fmt(n: number) {
    return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Custom tooltip ─────────────────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-white/10 bg-[#12121f] px-4 py-3 text-xs shadow-2xl">
            {label && <p className="text-white/40 mb-2 font-semibold tracking-wider uppercase text-[10px]">{label}</p>}
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2 mb-0.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color || p.fill }} />
                    <span className="text-white/50">{p.name}:</span>
                    <span className="text-white font-semibold">
                        {p.name?.toLowerCase().includes("revenue") || p.name?.toLowerCase().includes("total")
                            ? `₹${fmt(p.value)}`
                            : p.value}
                    </span>
                </div>
            ))}
        </div>
    );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const OrderAnalytics: React.FC<Props> = ({ orders }) => {

    const [mapZoom, setMapZoom] = useState(1);
    const [mapCenter, setMapCenter] = useState<[number, number]>([0, 20]);

    // ── Derived stats ──────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
        const totalOrders = orders.length;
        const avgOrder = totalOrders ? totalRevenue / totalOrders : 0;
        const delivered = orders.filter(o => o.status === "delivered").length;
        const pending = orders.filter(o => o.status === "pending").length;
        return { totalRevenue, totalOrders, avgOrder, delivered, pending };
    }, [orders]);

    // ── Orders by day (last 30 days) ───────────────────────────────────────────
    const dailyData = useMemo(() => {
        const map: Record<string, { date: string; orders: number; revenue: number }> = {};
        const now = Date.now();
        for (let i = 29; i >= 0; i--) {
            const d = new Date(now - i * 86400000);
            const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            map[key] = { date: key, orders: 0, revenue: 0 };
        }
        orders.forEach(o => {
            const d = parseDate(o.createdAt);
            const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            if (map[key]) {
                map[key].orders++;
                map[key].revenue += o.total || 0;
            }
        });
        return Object.values(map);
    }, [orders]);

    // ── Orders by status (pie) ─────────────────────────────────────────────────
    const statusData = useMemo(() => {
        const map: Record<string, number> = {};
        orders.forEach(o => { map[o.status] = (map[o.status] || 0) + 1; });
        return Object.entries(map).map(([status, count]) => ({
            name: STATUS_LABEL[status] || status,
            value: count,
            color: STATUS_COLOR[status] || "#ffffff30",
        }));
    }, [orders]);

    // ── Orders by city (top 10 bar) ────────────────────────────────────────────
    const cityData = useMemo(() => {
        const map: Record<string, { orders: number; revenue: number }> = {};
        orders.forEach(o => {
            const city = o.city?.trim() || "Unknown";
            if (!map[city]) map[city] = { orders: 0, revenue: 0 };
            map[city].orders++;
            map[city].revenue += o.total || 0;
        });
        return Object.entries(map)
            .map(([city, v]) => ({ city, ...v }))
            .sort((a, b) => b.orders - a.orders)
            .slice(0, 10);
    }, [orders]);

    // ── Country order counts (for map) ────────────────────────────────────────
    // We match by ISO-numeric country code stored in order.countryCode
    // OR do a simple text match on order.country to a lookup table
    const countryOrderMap = useMemo(() => {
        const map: Record<string, number> = {};
        orders.forEach(o => {
            const key = o.countryCode || resolveCountryCode(o.country || o.city || "");
            if (key) map[key] = (map[key] || 0) + 1;
        });
        return map;
    }, [orders]);

    const maxCountryOrders = Math.max(1, ...Object.values(countryOrderMap));

    const colorScale = scaleLinear<string>()
        .domain([0, maxCountryOrders])
        .range(["#1a1535", "#6c5ce7"]);

    // ── Weekly trend (last 8 weeks) ────────────────────────────────────────────
    const weeklyData = useMemo(() => {
        const weeks: Record<string, { week: string; orders: number; revenue: number }> = {};
        for (let i = 7; i >= 0; i--) {
            const d = new Date(Date.now() - i * 7 * 86400000);
            const key = `W${getWeekNumber(d)}`;
            weeks[key] = { week: key, orders: 0, revenue: 0 };
        }
        orders.forEach(o => {
            const d = parseDate(o.createdAt);
            const key = `W${getWeekNumber(d)}`;
            if (weeks[key]) {
                weeks[key].orders++;
                weeks[key].revenue += o.total || 0;
            }
        });
        return Object.values(weeks);
    }, [orders]);

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 mb-8">

            {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    {
                        icon: DollarSign, label: "Total Revenue", color: EMERALD,
                        value: `₹${fmt(stats.totalRevenue)}`,
                    },
                    {
                        icon: ShoppingBag, label: "Total Orders", color: ACCENT,
                        value: stats.totalOrders,
                    },
                    {
                        icon: TrendingUp, label: "Avg. Order Value", color: CYAN,
                        value: `₹${fmt(stats.avgOrder)}`,
                    },
                    {
                        icon: CheckCircle, label: "Delivered", color: AMBER,
                        value: `${stats.delivered} / ${stats.totalOrders}`,
                    },
                ].map((kpi, i) => {
                    const Icon = kpi.icon;
                    return (
                        <motion.div
                            key={kpi.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="rounded-2xl border border-white/6 bg-[#0d0d18] p-5 relative overflow-hidden"
                        >
                            <div
                                className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-20"
                                style={{ background: kpi.color }}
                            />
                            <div className="flex items-start justify-between mb-4">
                                <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                                    style={{ background: `${kpi.color}18`, border: `1px solid ${kpi.color}30` }}
                                >
                                    <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                                </div>
                            </div>
                            <p className="text-[11px] uppercase tracking-widest text-white/30 mb-1">{kpi.label}</p>
                            <p className="text-xl font-bold text-white font-mono">{kpi.value}</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* ── Revenue Area Chart ──────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-white/6 bg-[#0d0d18] p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-sm font-bold text-white">Revenue Over Time</h3>
                        <p className="text-[11px] text-white/30 mt-0.5">Last 30 days · daily</p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-white/30">
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: ACCENT }} /> Revenue
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: EMERALD }} /> Orders
                        </span>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={ACCENT} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={ACCENT} stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gOrders" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={EMERALD} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={EMERALD} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#ffffff08" vertical={false} />
                        <XAxis
                            dataKey="date"
                            tick={{ fill: "#ffffff30", fontSize: 10 }}
                            tickLine={false} axisLine={false}
                            interval={4}
                        />
                        <YAxis
                            yAxisId="rev"
                            tick={{ fill: "#ffffff30", fontSize: 10 }}
                            tickLine={false} axisLine={false}
                            tickFormatter={v => `₹${v.toLocaleString('en-IN')}`}
                        />
                        <YAxis
                            yAxisId="ord"
                            orientation="right"
                            tick={{ fill: "#ffffff30", fontSize: 10 }}
                            tickLine={false} axisLine={false}
                        />
                        <Tooltip content={<DarkTooltip />} />
                        <Area
                            yAxisId="rev" type="monotone" dataKey="revenue"
                            name="Revenue" stroke={ACCENT} strokeWidth={2}
                            fill="url(#gRevenue)" dot={false} activeDot={{ r: 4, fill: ACCENT }}
                        />
                        <Area
                            yAxisId="ord" type="monotone" dataKey="orders"
                            name="Orders" stroke={EMERALD} strokeWidth={2}
                            fill="url(#gOrders)" dot={false} activeDot={{ r: 4, fill: EMERALD }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </motion.div>

            {/* ── Row: Status Pie + Weekly Bar ───────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Pie: Order Status */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="rounded-2xl border border-white/6 bg-[#0d0d18] p-6"
                >
                    <h3 className="text-sm font-bold text-white mb-1">Order Status Breakdown</h3>
                    <p className="text-[11px] text-white/30 mb-5">Distribution by fulfillment stage</p>

                    {statusData.length === 0 ? (
                        <div className="flex items-center justify-center h-40 text-white/20 text-sm">No data yet</div>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <ResponsiveContainer width={160} height={160}>
                                <PieChart>
                                    <Pie
                                        data={statusData} cx="50%" cy="50%"
                                        innerRadius={48} outerRadius={72}
                                        dataKey="value" paddingAngle={3} strokeWidth={0}
                                    >
                                        {statusData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<DarkTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>

                            <div className="flex flex-col gap-2 flex-1">
                                {statusData.map((s, i) => (
                                    <div key={i} className="flex items-center gap-2.5">
                                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                                        <span className="text-xs text-white/50 flex-1">{s.name}</span>
                                        <span className="text-xs font-bold text-white font-mono">{s.value}</span>
                                        <div className="w-16 h-1 rounded-full bg-white/6 overflow-hidden">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${(s.value / stats.totalOrders) * 100}%`,
                                                    background: s.color,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Bar: Weekly Orders */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-2xl border border-white/6 bg-[#0d0d18] p-6"
                >
                    <h3 className="text-sm font-bold text-white mb-1">Weekly Performance</h3>
                    <p className="text-[11px] text-white/30 mb-5">Last 8 weeks · orders &amp; revenue</p>
                    <ResponsiveContainer width="100%" height={190}>
                        <BarChart data={weeklyData} barGap={4} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                            <CartesianGrid stroke="#ffffff08" vertical={false} />
                            <XAxis
                                dataKey="week"
                                tick={{ fill: "#ffffff30", fontSize: 10 }}
                                tickLine={false} axisLine={false}
                            />
                            <YAxis tick={{ fill: "#ffffff30", fontSize: 10 }} tickLine={false} axisLine={false} />
                            <Tooltip content={<DarkTooltip />} />
                            <Bar dataKey="orders" name="Orders" fill={ACCENT} radius={[4, 4, 0, 0]} maxBarSize={20} />
                            <Bar dataKey="revenue" name="Revenue" fill={ACCENT2} radius={[4, 4, 0, 0]} maxBarSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* ── Top Cities Bar ─────────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-2xl border border-white/6 bg-[#0d0d18] p-6"
            >
                <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-white/30" />
                    <h3 className="text-sm font-bold text-white">Top Cities by Orders</h3>
                </div>
                <p className="text-[11px] text-white/30 mb-5">Top 10 cities ranked by order volume</p>

                {cityData.length === 0 ? (
                    <div className="flex items-center justify-center h-40 text-white/20 text-sm">No city data</div>
                ) : (
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart
                            data={cityData} layout="vertical"
                            margin={{ top: 0, right: 60, left: 4, bottom: 0 }}
                        >
                            <CartesianGrid stroke="#ffffff08" horizontal={false} />
                            <XAxis type="number" tick={{ fill: "#ffffff30", fontSize: 10 }} tickLine={false} axisLine={false} />
                            <YAxis
                                type="category" dataKey="city" width={90}
                                tick={{ fill: "#ffffff50", fontSize: 11 }}
                                tickLine={false} axisLine={false}
                            />
                            <Tooltip content={<DarkTooltip />} />
                            <Bar dataKey="orders" name="Orders" radius={[0, 4, 4, 0]} maxBarSize={14}>
                                {cityData.map((_, i) => (
                                    <Cell
                                        key={i}
                                        fill={`hsl(${260 + i * 8}, 70%, ${60 - i * 3}%)`}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </motion.div>

            {/* ── World Map ──────────────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl border border-white/6 bg-[#0d0d18] p-6 overflow-hidden"
            >
                <div className="flex items-center justify-between mb-1">
                    <div>
                        <h3 className="text-sm font-bold text-white">Global Order Distribution</h3>
                        <p className="text-[11px] text-white/30 mt-0.5">
                            Orders by country · darker = more orders
                        </p>
                    </div>
                    {/* Zoom controls */}
                    <div className="flex items-center gap-1">
                        <MapControlBtn onClick={() => setMapZoom(z => Math.min(z + 0.5, 6))} title="Zoom in">
                            <ZoomIn className="w-3.5 h-3.5" />
                        </MapControlBtn>
                        <MapControlBtn onClick={() => setMapZoom(z => Math.max(z - 0.5, 1))} title="Zoom out">
                            <ZoomOut className="w-3.5 h-3.5" />
                        </MapControlBtn>
                        <MapControlBtn onClick={() => { setMapZoom(1); setMapCenter([0, 20]); }} title="Reset">
                            <RotateCcw className="w-3.5 h-3.5" />
                        </MapControlBtn>
                    </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-2 mb-4 mt-3">
                    <span className="text-[10px] text-white/25">0 orders</span>
                    <div className="flex-1 max-w-[140px] h-1.5 rounded-full"
                        style={{ background: `linear-gradient(to right, #1a1535, ${ACCENT})` }} />
                    <span className="text-[10px] text-white/25">{maxCountryOrders} orders</span>
                </div>

                {/* Map */}
                <div className="relative rounded-xl overflow-hidden bg-[#09090f] border border-white/4"
                    style={{ height: 420 }}>
                    <ComposableMap
                        projection="geoNaturalEarth1"
                        projectionConfig={{ scale: 160, center: mapCenter }}
                        style={{ width: "100%", height: "100%" }}
                    >
                        <ZoomableGroup
                            zoom={mapZoom}
                            center={mapCenter}
                            onMoveEnd={({ coordinates, zoom }) => {
                                setMapCenter(coordinates as [number, number]);
                                setMapZoom(zoom);
                            }}
                        >
                            <Geographies geography={GEO_URL}>
                                {({ geographies }) =>
                                    geographies.map(geo => {
                                        const numericCode = geo.id; // world-atlas uses ISO numeric
                                        const orderCount = countryOrderMap[String(numericCode)] || 0;
                                        const fillColor = orderCount > 0
                                            ? colorScale(orderCount)
                                            : "#13131f";
                                        return (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                fill={fillColor}
                                                stroke="#ffffff08"
                                                strokeWidth={0.5}
                                                style={{
                                                    default: { outline: "none", transition: "fill 0.2s" },
                                                    hover: { fill: orderCount > 0 ? "#9f7aea" : "#1e1e30", outline: "none", cursor: "pointer" },
                                                    pressed: { outline: "none" },
                                                }}
                                            />
                                        );
                                    })
                                }
                            </Geographies>
                        </ZoomableGroup>
                    </ComposableMap>

                    {/* Map overlay: no data note */}
                    {Object.keys(countryOrderMap).length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-[#0d0d18]/80 border border-white/8 rounded-xl px-5 py-3 text-center">
                                <p className="text-xs text-white/40">
                                    Add a <span className="font-mono text-white/60">countryCode</span> field (ISO numeric)
                                    to your orders to see the map highlight.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Country breakdown list */}
                {Object.keys(countryOrderMap).length > 0 && (
                    <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {Object.entries(countryOrderMap)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 8)
                            .map(([code, count]) => (
                                <div key={code}
                                    className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/3 border border-white/6">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ background: colorScale(count) }} />
                                    <div className="min-w-0">
                                        <p className="text-[11px] text-white/40 font-mono truncate">{code}</p>
                                        <p className="text-xs font-bold text-white">{count} orders</p>
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                )}
            </motion.div>

        </div>
    );
};

// ─── Small helpers ────────────────────────────────────────────────────────────

const MapControlBtn = ({
    children, onClick, title,
}: {
    children: React.ReactNode;
    onClick: () => void;
    title?: string;
}) => (
    <button
        title={title}
        onClick={onClick}
        className="w-7 h-7 rounded-lg border border-white/10 bg-white/4 flex items-center justify-center
      text-white/40 hover:text-white/80 hover:bg-white/8 transition-all"
    >
        {children}
    </button>
);

function getWeekNumber(d: Date): number {
    const onejan = new Date(d.getFullYear(), 0, 1);
    return Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
}

/**
 * resolveCountryCode — maps common country name strings to ISO-numeric codes.
 * Extend this table to match whatever your orders contain.
 * The world-atlas numeric IDs correspond to ISO 3166-1 numeric.
 */
function resolveCountryCode(input: string): string {
    const lc = input.toLowerCase().trim();
    const TABLE: Record<string, string> = {
        // ── South Asia ──────────────────────────────────────────────────────────
        "india": "356", "in": "356",
        "pakistan": "586", "pk": "586",
        "bangladesh": "050", "bd": "050",
        "sri lanka": "144", "lk": "144",
        // ── East Asia ───────────────────────────────────────────────────────────
        "china": "156", "cn": "156",
        "japan": "392", "jp": "392",
        "south korea": "410", "korea": "410", "kr": "410",
        // ── Southeast Asia ──────────────────────────────────────────────────────
        "indonesia": "360", "id": "360",
        "philippines": "608", "ph": "608",
        "vietnam": "704", "vn": "704",
        "thailand": "764", "th": "764",
        "malaysia": "458", "my": "458",
        "singapore": "702", "sg": "702",
        // ── Middle East ─────────────────────────────────────────────────────────
        "uae": "784", "united arab emirates": "784",
        "saudi arabia": "682", "sa": "682",
        "qatar": "634", "qa": "634",
        // ── Americas ────────────────────────────────────────────────────────────
        "united states": "840", "usa": "840", "us": "840",
        "canada": "124", "ca": "124",
        "brazil": "076", "br": "076",
        "mexico": "484", "mx": "484",
        "argentina": "032", "ar": "032",
        // ── Europe ──────────────────────────────────────────────────────────────
        "united kingdom": "826", "uk": "826", "gb": "826",
        "germany": "276", "de": "276",
        "france": "250", "fr": "250",
        "italy": "380", "it": "380",
        "spain": "724", "es": "724",
        "netherlands": "528", "nl": "528",
        // ── Africa ──────────────────────────────────────────────────────────────
        "nigeria": "566", "ng": "566",
        "south africa": "710", "za": "710",
        "kenya": "404", "ke": "404",
        "egypt": "818", "eg": "818",
        // ── Oceania ─────────────────────────────────────────────────────────────
        "australia": "036", "au": "036",
        "new zealand": "554", "nz": "554",
    };
    return TABLE[lc] || "";
}

export default OrderAnalytics;