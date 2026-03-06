"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckSquare, Clock, LayoutDashboard, UtensilsCrossed, History, Lock, User, Key, MessageSquareText } from "lucide-react";
import MenuManager from "@/components/MenuManager";
import { ToastContainer } from "@/components/Toast";
import { requestNotificationPermission, showOrderNotification, showFeedbackNotification } from "@/lib/notifications";

type OrderItem = {
    id: string;
    item_name: string;
    quantity: number;
    price_per_item: number;
};

type Order = {
    id: string;
    table_number: string;
    customer_name: string;
    customer_phone: string;
    total_price: number;
    order_status: 'Pending' | 'Preparing' | 'Ready' | 'Served';
    created_at: string;
    order_items?: OrderItem[];
};

type Feedback = {
    id: string;
    customer_name: string;
    phone_number: string;
    message: string;
    created_at: string;
};

export default function AdminDashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [adminId, setAdminId] = useState("");
    const [adminPass, setAdminPass] = useState("");
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'orders' | 'history' | 'submissions' | 'menu'>('orders');
    const [orders, setOrders] = useState<Order[]>([]);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        // Simple auth check from session storage
        const auth = sessionStorage.getItem("adminAuth");
        if (auth === "true") setIsAuthenticated(true);
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;

        // Request notification permission on admin login
        requestNotificationPermission();

        fetchOrders();
        fetchFeedbacks();

        // Setup real-time subscriptions
        const ordersSub = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
                setTimeout(fetchOrders, 1000);
                // Play notification sound with better error handling
                try {
                    const audio = new Audio('/bell.mp3');
                    audio.volume = 0.7;
                    audio.play().catch(() => {
                        // Fallback to system notification if audio fails
                        console.log('Audio notification failed - using visual notification only');
                        if ('vibrate' in navigator) {
                            navigator.vibrate([200, 100, 200]);
                        }
                    });
                } catch (error) {
                    console.log('Audio notification not available');
                }
                
                // Show toast notification for new order
                if (typeof window !== 'undefined' && (window as any).addToast) {
                    (window as any).addToast('info', `🔔 New order received from Table ${payload.new.table_number}!`, 6000);
                }
                
                // Show browser notification
                showOrderNotification(payload.new.table_number, payload.new.customer_name);
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, payload => {
                const nextStatus = payload.new.order_status as Order['order_status'];
                setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, order_status: nextStatus } : o));
                
                // Show toast for status changes
                if (typeof window !== 'undefined' && (window as any).addToast) {
                    const order = orders.find(o => o.id === payload.new.id);
                    if (order) {
                        (window as any).addToast('success', `✅ Order for Table ${order.table_number} updated to ${nextStatus}`, 4000);
                    }
                }
            })
            .subscribe();

        const feedbackSub = supabase
            .channel('public:feedback')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'feedback' }, (payload) => {
                setTimeout(fetchFeedbacks, 1000);
                
                // Show toast for new feedback
                if (typeof window !== 'undefined' && (window as any).addToast) {
                    (window as any).addToast('info', `💬 New feedback received from ${payload.new.customer_name || 'Anonymous'}!`, 5000);
                }
                
                // Show browser notification
                showFeedbackNotification(payload.new.customer_name);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(ordersSub);
            supabase.removeChannel(feedbackSub);
        };
    }, [isAuthenticated]);

    const fetchOrders = async () => {
        const { data } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .order('created_at', { ascending: false });

        if (data) setOrders(data);
        setLoading(false);
    };

    const fetchFeedbacks = async () => {
        const { data } = await supabase
            .from('feedback')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setFeedbacks(data);
    };

    const updateStatus = async (id: string, status: Order['order_status']) => {
        await supabase.from('orders').update({ order_status: status }).eq('id', id);
        setOrders(prev => prev.map(o => o.id === id ? { ...o, order_status: status } : o));
        
        // Send customer notification
        const order = orders.find(o => o.id === id);
        if (order && typeof window !== 'undefined' && (window as any).addCustomerNotification) {
            (window as any).addCustomerNotification(
                status === 'Preparing' ? 'preparing' : 
                status === 'Ready' ? 'ready' : 
                status === 'Served' ? 'served' : 'preparing',
                order.table_number,
                order.customer_name
            );
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError(null);
        setAuthLoading(true);
        try {
            const username = adminId.trim();
            const password = adminPass;
            if (!username || !password) {
                setAuthError("Please enter Admin ID and Password.");
                return;
            }

            const { data, error } = await supabase
                .from("admins")
                .select("id, username, role")
                .eq("username", username)
                .eq("password", password)
                .maybeSingle();

            if (error) {
                console.error("Admin login query error:", error);
                setAuthError("Login failed. Please try again.");
                return;
            }

            if (!data) {
                setAuthError("Invalid ID or Password.");
                return;
            }

            setIsAuthenticated(true);
            sessionStorage.setItem("adminAuth", "true");
            sessionStorage.setItem("adminUsername", data.username);
            sessionStorage.setItem("adminRole", data.role || "owner");
        } finally {
            setAuthLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex bg-[#121212] pt-20 justify-center items-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-panel p-8 md:p-12 rounded-3xl max-w-md w-full border border-[#D4AF37]/30 shadow-2xl shadow-black/50"
                >
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-[#8B0000]/20 rounded-full flex items-center justify-center border border-[#8B0000]/50">
                            <Lock className="w-8 h-8 text-[#D4AF37]" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white text-center mb-2">Admin Login</h1>
                    <p className="text-white/50 text-center mb-8 text-sm">Authorized personnel only</p>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-white/70 text-sm mb-2 font-medium">Admin ID</label>
                            <div className="relative">
                                <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                                <input
                                    type="text"
                                    value={adminId}
                                    onChange={(e) => setAdminId(e.target.value)}
                                    placeholder="Enter Admin ID"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-white/70 text-sm mb-2 font-medium">Password</label>
                            <div className="relative">
                                <Key className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                                <input
                                    type="password"
                                    value={adminPass}
                                    onChange={(e) => setAdminPass(e.target.value)}
                                    placeholder="Enter Password"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition"
                                    required
                                />
                            </div>
                        </div>
                        {authError && (
                            <div className="bg-red-900/20 text-red-200 p-3 rounded-xl border border-red-500/30 text-sm">
                                {authError}
                            </div>
                        )}
                        <button
                            type="submit"
                            disabled={authLoading}
                            className="w-full py-4 bg-[#D4AF37] hover:bg-yellow-600 text-black font-bold rounded-xl transition shadow-lg shadow-[#D4AF37]/20 flex justify-center items-center disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {authLoading ? "Verifying..." : "Secure Login"}
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    const isToday = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const liveOrders = orders.filter(o => isToday(o.created_at));

    const orderHistoryGroups = orders.reduce((acc, order) => {
        const dateStr = new Date(order.created_at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
        if (!acc[dateStr]) acc[dateStr] = { orders: [], totalSales: 0 };
        acc[dateStr].orders.push(order);
        acc[dateStr].totalSales += order.total_price;
        return acc;
    }, {} as Record<string, { orders: Order[], totalSales: number }>);

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#121212] md:pt-20 pt-16">
            <ToastContainer />

            {/* Mobile Navigation Tabs */}
            <div className="md:hidden flex overflow-x-auto bg-[#0a0a0a] border-b border-white/10 p-4 gap-3 flex-shrink-0 sticky top-16 z-30 shadow-md scrollbar-hide">
                <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${activeTab === 'orders' ? 'bg-white/10 text-[#D4AF37] border border-white/5' : 'text-white/50 bg-black/40'}`}>
                    <Bell className="w-4 h-4" /> Live Orders
                </button>
                <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${activeTab === 'history' ? 'bg-white/10 text-[#D4AF37] border border-white/5' : 'text-white/50 bg-black/40'}`}>
                    <History className="w-4 h-4" /> Order History
                </button>
                <button onClick={() => setActiveTab('submissions')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${activeTab === 'submissions' ? 'bg-white/10 text-[#D4AF37] border border-white/5' : 'text-white/50 bg-black/40'}`}>
                    <MessageSquareText className="w-4 h-4" /> Submissions
                </button>
                <button onClick={() => setActiveTab('menu')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${activeTab === 'menu' ? 'bg-white/10 text-[#D4AF37] border border-white/5' : 'text-white/50 bg-black/40'}`}>
                    <UtensilsCrossed className="w-4 h-4" /> Manage Menu
                </button>
            </div>

            {/* Desktop Sidebar */}
            <div className="w-64 bg-[#0a0a0a] border-r border-white/10 hidden md:flex flex-col flex-shrink-0 sticky top-20 h-[calc(100vh-80px)]">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-white flex gap-2 items-center">
                        <LayoutDashboard className="text-[#D4AF37]" /> Dashboard
                    </h2>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'orders' ? 'bg-white/10 text-white border border-white/5 shadow-inner' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
                        <Bell className={`w-5 h-5 ${activeTab === 'orders' ? 'text-[#D4AF37]' : ''}`} /> Live Orders
                    </button>
                    <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'history' ? 'bg-white/10 text-white border border-white/5 shadow-inner' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
                        <History className={`w-5 h-5 ${activeTab === 'history' ? 'text-[#D4AF37]' : ''}`} /> Order History
                    </button>
                    <button onClick={() => setActiveTab('submissions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'submissions' ? 'bg-white/10 text-white border border-white/5 shadow-inner' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
                        <MessageSquareText className={`w-5 h-5 ${activeTab === 'submissions' ? 'text-[#D4AF37]' : ''}`} /> Submissions
                    </button>
                    <button onClick={() => setActiveTab('menu')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'menu' ? 'bg-white/10 text-white border border-white/5 shadow-inner' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}>
                        <UtensilsCrossed className={`w-5 h-5 ${activeTab === 'menu' ? 'text-[#D4AF37]' : ''}`} /> Manage Menu
                    </button>
                </nav>
                <div className="p-4 border-t border-white/10">
                    <button onClick={() => { setIsAuthenticated(false); sessionStorage.removeItem("adminAuth"); }} className="w-full py-2 text-white/40 hover:text-red-400 text-sm font-medium transition text-left px-4">
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                {activeTab === 'orders' && (
                    <>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">Today&apos;s Live Orders</h1>
                                <p className="text-white/50 text-sm">Showing active and completed orders for {new Date().toLocaleDateString('en-GB')}</p>
                            </div>
                            <div className="flex items-center gap-2 bg-[#8B0000]/20 text-[#D4AF37] px-4 py-2 rounded-full text-sm font-semibold border border-[#8B0000]/30 shadow-lg shadow-[#8B0000]/10">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Real-time Updates
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-white/50 text-center py-20 animate-pulse">Loading Live Orders...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <AnimatePresence>
                                    {liveOrders.map(order => (
                                        <motion.div
                                            key={order.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className={`glass-panel p-6 rounded-2xl border transition-colors flex flex-col ${order.order_status === 'Pending' ? 'border-[#8B0000]/50 shadow-lg shadow-[#8B0000]/20' :
                                                order.order_status === 'Preparing' ? 'border-[#D4AF37]/50 shadow-lg shadow-[#D4AF37]/20' :
                                                    'border-white/10 opacity-70'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <span className="text-sm text-white/50 block mb-1">Table Number</span>
                                                    <span className="text-3xl font-black text-white">{order.table_number}</span>
                                                    {order.customer_name && (
                                                        <div className="mt-2">
                                                            <span className="text-white font-bold block">{order.customer_name}</span>
                                                            <span className="text-white/50 text-sm block">{order.customer_phone}</span>
                                                            <span className="text-white/30 text-xs block mt-1">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.order_status === 'Pending' ? 'bg-red-500/20 text-red-300' :
                                                    order.order_status === 'Preparing' ? 'bg-yellow-500/20 text-yellow-300' :
                                                        order.order_status === 'Ready' ? 'bg-green-500/20 text-green-300' :
                                                            'bg-white/10 text-white/50'
                                                    }`}>
                                                    {order.order_status}
                                                </span>
                                            </div>

                                            {order.order_items && order.order_items.length > 0 && (
                                                <div className="my-4 space-y-2 max-h-40 overflow-y-auto pr-2 bg-black/20 p-3 rounded-lg border border-white/5 flex-grow">
                                                    {order.order_items.map(item => (
                                                        <div key={item.id} className="flex justify-between items-center text-sm">
                                                            <div className="flex gap-2 text-white/80">
                                                                <span className="font-bold text-[#D4AF37]">{item.quantity}x</span>
                                                                <span>{item.item_name}</span>
                                                            </div>
                                                            <span className="text-white/60 shrink-0">₹{item.price_per_item * item.quantity}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="h-px bg-white/10 w-full my-4 mt-auto" />

                                            <div className="flex justify-between items-center mb-6">
                                                <span className="text-white/60 font-medium">Total Bill</span>
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
                                    {liveOrders.length === 0 && (
                                        <div className="col-span-full mt-20 text-center text-white/50 flex flex-col items-center">
                                            <Bell className="w-16 h-16 opacity-20 mb-4" />
                                            <p className="text-lg">No active orders today right now.</p>
                                            <p className="text-sm opacity-60 mt-2">New orders will pop up here instantly.</p>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'history' && (
                    <>
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-white mb-2">Order History & Sales</h1>
                            <p className="text-white/50 text-sm">Past daily reports and total collected sales.</p>
                        </div>

                        {loading ? (
                            <div className="text-white/50 text-center py-20 animate-pulse">Loading History...</div>
                        ) : (
                            <div className="space-y-8">
                                {Object.entries(orderHistoryGroups).map(([date, groupData]) => (
                                    <div key={date} className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
                                        <div className="bg-white/5 p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10">
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 bg-black/40 rounded-xl">
                                                    <Clock className="w-5 h-5 text-white/70" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-white text-lg">{date}</h3>
                                                    <span className="text-sm text-white/50">{groupData.orders.length} orders</span>
                                                </div>
                                            </div>
                                            <div className="text-right w-full md:w-auto bg-[#8B0000]/20 px-6 py-3 rounded-xl border border-[#8B0000]/30 shadow-inner">
                                                <span className="text-sm text-[#D4AF37] block mb-1 font-semibold uppercase tracking-wider">Total Collection</span>
                                                <span className="text-2xl font-black text-white">₹{groupData.totalSales}</span>
                                            </div>
                                        </div>

                                        <div className="p-4 md:p-6">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left bg-black/20 rounded-xl overflow-hidden">
                                                    <thead className="bg-black/60">
                                                        <tr className="text-white/40 text-xs uppercase">
                                                            <th className="px-4 py-3 font-medium">Time & Table</th>
                                                            <th className="px-4 py-3 font-medium">Customer</th>
                                                            <th className="px-4 py-3 font-medium">Items</th>
                                                            <th className="px-4 py-3 font-medium">Status</th>
                                                            <th className="px-4 py-3 font-medium text-right">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5">
                                                        {groupData.orders.map(order => (
                                                            <tr key={order.id} className="hover:bg-white/5 transition text-sm">
                                                                <td className="px-4 py-3 align-top">
                                                                    <div className="font-bold text-white">Table {order.table_number}</div>
                                                                    <div className="text-white/40 text-xs mt-1">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                                </td>
                                                                <td className="px-4 py-3 align-top text-white/70">
                                                                    <div className="font-bold text-white">{order.customer_name}</div>
                                                                    {order.customer_phone && <div className="text-white/50 text-xs mt-0.5">{order.customer_phone}</div>}
                                                                </td>
                                                                <td className="px-4 py-3 align-top text-white/60">
                                                                    <div className="space-y-1">
                                                                        {order.order_items?.map(it => (
                                                                            <div key={it.id} className="line-clamp-1"><span className="text-[#D4AF37] font-bold">{it.quantity}x</span> {it.item_name}</div>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 align-top">
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${order.order_status === 'Pending' ? 'text-red-400 bg-red-400/10 border border-red-500/20' :
                                                                        order.order_status === 'Preparing' ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-500/20' :
                                                                            order.order_status === 'Ready' ? 'text-green-400 bg-green-400/10 border border-green-500/20' :
                                                                                'text-white/50 bg-white/5 border border-white/10'
                                                                        }`}>
                                                                        {order.order_status}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-3 align-top text-right font-bold text-[#D4AF37]">
                                                                    ₹{order.total_price}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {Object.keys(orderHistoryGroups).length === 0 && (
                                    <div className="text-center text-white/50 py-20 flex flex-col items-center">
                                        <History className="w-16 h-16 opacity-20 mb-4" />
                                        <p>No past orders found.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'submissions' && (
                    <>
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-white mb-2">Customer Submissions</h1>
                            <p className="text-white/50 text-sm">Feedback and messages left by customers during checkout or on the contact page.</p>
                        </div>

                        {feedbacks.length === 0 ? (
                            <div className="text-center text-white/50 py-20 flex flex-col items-center">
                                <MessageSquareText className="w-16 h-16 opacity-20 mb-4" />
                                <p>No feedback submissions found.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {feedbacks.map((fb) => (
                                    <motion.div
                                        key={fb.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="glass-panel p-6 rounded-2xl border border-white/5 bg-gradient-to-b from-white/5 to-transparent relative group"
                                    >
                                        <div className="absolute top-4 right-4 text-white/20 group-hover:text-[#D4AF37]/50 transition duration-300">
                                            <MessageSquareText className="w-8 h-8" />
                                        </div>
                                        <h3 className="font-bold text-lg text-white mb-1 pr-10">{fb.customer_name || "Anonymous User"}</h3>
                                        <p className="text-white/40 text-xs mb-4 flex items-center gap-2">
                                            <span>{new Date(fb.created_at).toLocaleDateString('en-GB')}</span>
                                            <span>•</span>
                                            <span>{new Date(fb.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </p>

                                        {fb.phone_number && (
                                            <div className="bg-black/30 rounded-lg px-3 py-2 text-sm text-white/70 mb-4 inline-block border border-white/5 group-hover:border-[#D4AF37]/30 transition">
                                                📞 {fb.phone_number}
                                            </div>
                                        )}

                                        <div className="bg-black/40 rounded-xl p-4 text-white/80 italic border-l-2 border-[#D4AF37] relative">
                                            &ldquo;{fb.message}&rdquo;
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'menu' && (
                    <MenuManager />
                )}
            </div>
        </div>
    );
}
