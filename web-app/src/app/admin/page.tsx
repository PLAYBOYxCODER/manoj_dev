"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckSquare, Clock, LayoutDashboard, UtensilsCrossed } from "lucide-react";

type Order = {
    id: string;
    table_number: string;
    total_price: number;
    order_status: 'Pending' | 'Preparing' | 'Ready' | 'Served';
    created_at: string;
};

export default function AdminDashboard() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();

        // Setup real-time subscription
        const subscription = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
                setOrders(prev => [payload.new as Order, ...prev]);
                // Play notification sound
                new Audio('/bell.mp3').play().catch(() => { }); // Optional sound alert
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
                setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const fetchOrders = async () => {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setOrders(data);
        setLoading(false);
    };

    const updateStatus = async (id: string, status: Order['order_status']) => {
        await supabase.from('orders').update({ order_status: status }).eq('id', id);
        // Real-time will naturally update the UI, but we can do it optimistically too:
        setOrders(prev => prev.map(o => o.id === id ? { ...o, order_status: status } : o));
    };

    return (
        <div className="min-h-screen flex bg-[#121212] pt-20">

            {/* Sidebar Admin */}
            <div className="w-64 bg-[#0a0a0a] border-r border-white/10 hidden md:flex flex-col flex-shrink-0">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-white flex gap-2 items-center">
                        <LayoutDashboard className="text-[#D4AF37]" /> Dashboard
                    </h2>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <a href="#" className="flex items-center gap-3 px-4 py-3 bg-white/10 text-white rounded-xl font-medium border border-white/5 shadow-inner">
                        <Bell className="w-5 h-5 text-[#D4AF37]" /> Live Orders
                    </a>
                    <a href="#" className="flex items-center gap-3 px-4 py-3 text-white/50 hover:bg-white/5 hover:text-white transition rounded-xl">
                        <UtensilsCrossed className="w-5 h-5" /> Manage Menu
                    </a>
                </nav>
            </div>

            <div className="flex-1 p-8 overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-white">Live Orders</h1>
                    <div className="flex items-center gap-2 bg-[#8B0000]/20 text-[#D4AF37] px-4 py-2 rounded-full text-sm font-semibold border border-[#8B0000]/30 shadow-lg shadow-[#8B0000]/10">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Receiving Orders
                    </div>
                </div>

                {loading ? (
                    <div className="text-white/50 text-center py-20 animate-pulse">Loading Live Orders...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {orders.map(order => (
                                <motion.div
                                    key={order.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`glass-panel p-6 rounded-2xl border transition-colors ${order.order_status === 'Pending' ? 'border-[#8B0000]/50 shadow-lg shadow-[#8B0000]/20' :
                                            order.order_status === 'Preparing' ? 'border-[#D4AF37]/50 shadow-lg shadow-[#D4AF37]/20' :
                                                'border-white/10 opacity-70'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-sm text-white/50 block mb-1">Table Number</span>
                                            <span className="text-3xl font-black text-white">{order.table_number}</span>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.order_status === 'Pending' ? 'bg-red-500/20 text-red-300' :
                                                order.order_status === 'Preparing' ? 'bg-yellow-500/20 text-yellow-300' :
                                                    order.order_status === 'Ready' ? 'bg-green-500/20 text-green-300' :
                                                        'bg-white/10 text-white/50'
                                            }`}>
                                            {order.order_status}
                                        </span>
                                    </div>

                                    <div className="h-px bg-white/10 w-full my-4" />

                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-white/60">Total Bill</span>
                                        <span className="text-xl font-bold text-[#D4AF37]">₹{order.total_price}</span>
                                    </div>

                                    {/* Actions based on status */}
                                    <div className="grid grid-cols-2 gap-2 mt-auto">
                                        {order.order_status === 'Pending' && (
                                            <button onClick={() => updateStatus(order.id, 'Preparing')} className="col-span-2 py-3 bg-[#8B0000] hover:bg-red-800 text-white font-bold rounded-xl transition flex items-center justify-center gap-2">
                                                <UtensilsCrossed className="w-4 h-4" /> Start Preparing
                                            </button>
                                        )}
                                        {order.order_status === 'Preparing' && (
                                            <button onClick={() => updateStatus(order.id, 'Ready')} className="col-span-2 py-3 bg-[#D4AF37] hover:bg-yellow-600 text-black font-bold rounded-xl transition flex items-center justify-center gap-2">
                                                <CheckSquare className="w-4 h-4" /> Mark as Ready
                                            </button>
                                        )}
                                        {order.order_status === 'Ready' && (
                                            <button onClick={() => updateStatus(order.id, 'Served')} className="col-span-2 py-3 bg-green-700/80 hover:bg-green-600 text-white font-bold rounded-xl transition flex items-center justify-center gap-2">
                                                <CheckSquare className="w-4 h-4" /> Mark Served
                                            </button>
                                        )}
                                        {order.order_status === 'Served' && (
                                            <div className="col-span-2 py-3 bg-white/5 text-center text-white/30 rounded-xl font-medium flex items-center justify-center gap-2">
                                                <Clock className="w-4 h-4" /> Completed
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            {orders.length === 0 && (
                                <div className="col-span-full mt-20 text-center text-white/50 flex flex-col items-center">
                                    <Bell className="w-16 h-16 opacity-20 mb-4" />
                                    <p>No active orders right now.</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
