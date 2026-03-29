import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import { MapPin, Package, User, Navigation } from 'lucide-react';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Order {
    id: string;
    customerName: string;
    status: string;
    lane1?: string;
    city: string;
    location?: {
        latitude: number;
        longitude: number;
    };
}

interface Props {
    orders: Order[];
}

const STATUS_COLORS: Record<string, string> = {
    pending: "#fbbf24",
    confirmed: "#22d3ee",
    packed: "#6c5ce7",
    shipped: "#a855f7",
    out_for_delivery: "#fb923c",
    delivered: "#34d399",
};

const OrderGeoMap: React.FC<Props> = ({ orders }) => {
    const ordersWithLocation = orders.filter(o => o.location && o.location.latitude && o.location.longitude);

    // Default center (India if no orders, or first order)
    const center: [number, number] = ordersWithLocation.length > 0 
        ? [ordersWithLocation[0].location!.latitude, ordersWithLocation[0].location!.longitude]
        : [20.5937, 78.9629];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/6 bg-[#0d0d18] p-6 overflow-hidden"
        >
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <Navigation className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white">Live Order Tracking</h3>
                    <p className="text-[11px] text-white/30 mt-0.5">Real-time geographic distribution of orders</p>
                </div>
            </div>

            <div className="h-[450px] rounded-xl overflow-hidden border border-white/10 relative z-0">
                <MapContainer 
                    center={center} 
                    zoom={5} 
                    style={{ height: '100%', width: '100%', background: '#09090f' }}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />
                    {ordersWithLocation.map((order) => {
                        if (!order?.id || !order?.location?.latitude || !order?.location?.longitude) return null;
                        return (
                            <Marker 
                                key={order.id} 
                                position={[order.location.latitude, order.location.longitude]}
                            >
                                <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent={false}>
                                    <div className="bg-[#12121f] border border-white/10 rounded-lg p-3 shadow-2xl min-w-[180px]">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest font-mono">
                                                #{order.id.slice(0, 8)}
                                            </span>
                                            <span 
                                                className="w-2 h-2 rounded-full animate-pulse" 
                                                style={{ backgroundColor: STATUS_COLORS[order?.status || 'pending'] || '#fff' }} 
                                            />
                                        </div>
                                        <p className="text-white font-bold text-xs mb-1 flex items-center gap-1.5">
                                            <User className="w-3 h-3 text-white/30" />
                                            {order.customerName || "Unknown Customer"}
                                        </p>
                                        <p className="text-white/50 text-[10px] flex items-center gap-1.5 mb-2">
                                            <MapPin className="w-3 h-3 text-white/30" />
                                            {order.lane1 ? `${order.lane1}, ${order.city || ''}` : (order.city || 'Unknown City')}
                                        </p>
                                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                                            <div 
                                                className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                                                style={{ 
                                                    backgroundColor: `${STATUS_COLORS[order?.status || 'pending']}15`, 
                                                    color: STATUS_COLORS[order?.status || 'pending'],
                                                    border: `1px solid ${STATUS_COLORS[order?.status || 'pending']}30`
                                                }}
                                            >
                                                {(order?.status || 'pending').replace(/_/g, ' ')}
                                            </div>
                                        </div>
                                    </div>
                                </Tooltip>
                                <Popup>
                                    <div className="text-black">
                                        <strong>Order #{order.id.slice(0, 8)}</strong><br />
                                        {order.customerName || "Unknown Customer"}<br />
                                        Status: {order.status || 'pending'}
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-3">
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                    <div key={status} className="flex items-center gap-1.5 grayscale-[0.5] hover:grayscale-0 transition-all">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-[10px] text-white/30 uppercase font-bold tracking-widest">{status.replace(/_/g, ' ')}</span>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default OrderGeoMap;
