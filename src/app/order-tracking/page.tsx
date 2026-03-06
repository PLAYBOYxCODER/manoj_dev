"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChefHat, CheckCircle, Package, UtensilsCrossed, Phone, User, Send, Star } from "lucide-react";
import { useOrderNotifications } from "@/components/CustomerNotifications";

type Order = {
    id: string;
    table_number: string;
    customer_name: string;
    customer_phone: string;
    total_price: number;
    order_status: 'Pending' | 'Preparing' | 'Ready' | 'Served';
    created_at: string;
    order_items?: Array<{
        item_name: string;
        quantity: number;
        price_per_item: number;
    }>;
};

export default function OrderTrackingPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [tableNumber, setTableNumber] = useState("");
    const [customerName, setCustomerName] = useState("");

    // Feedback state
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [feedbackPhone, setFeedbackPhone] = useState("");

    // Get order info from URL params or localStorage
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const table = urlParams.get('table') || localStorage.getItem('last_table_number');
        const name = urlParams.get('customer') || localStorage.getItem('last_customer_name');

        if (table && name && table !== 'Parcel') {
            setTableNumber(table);
            setCustomerName(name);
            fetchLatestOrder(table, name);
        } else if (table === 'Parcel' && name) {
            setTableNumber('Parcel');
            setCustomerName(name);
            fetchParcelOrder(name);
        } else {
            setLoading(false);
        }
    }, []);

    // Use customer notifications hook
    const { notifications, clearNotifications } = useOrderNotifications(tableNumber, customerName);

    const fetchLatestOrder = async (table: string, customer: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items(*)')
                .eq('table_number', table)
                .eq('customer_name', customer)
                .order('created_at', { ascending: false })
                // We fetch all recent orders for this customer (e.g. today)
                .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching order:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchParcelOrder = async (customer: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items(*)')
                .eq('order_type', 'Parcel')
                .eq('customer_name', customer)
                .order('created_at', { ascending: false })
                .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

            if (error) throw error;
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching parcel order:', error);
        } finally {
            setLoading(false);
        }
    };

    // Check if we need to show feedback (all orders served)
    useEffect(() => {
        if (orders.length > 0 && orders.every(o => o.order_status === 'Served')) {
            const hasGivenFeedback = localStorage.getItem(`feedback_given_${tableNumber}_${customerName}`);
            if (!hasGivenFeedback) {
                // Short delay so they see the served status first
                const timer = setTimeout(() => setShowFeedbackModal(true), 2500);
                return () => clearTimeout(timer);
            }
        }
    }, [orders, tableNumber, customerName]);

    // Real-time subscription for order updates
    useEffect(() => {
        if (orders.length === 0) return;

        const orderIds = orders.map(o => o.id);

        const subscription = supabase
            .channel(`order-tracking-customer`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
            }, (payload) => {
                if (orderIds.includes(payload.new.id)) {
                    setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o));

                    // Trigger customer notification locally so the UI popup shows
                    const event = new CustomEvent('customerOrderUpdate', {
                        detail: {
                            type: payload.new.order_status.toLowerCase(),
                            table: payload.new.table_number || 'Parcel',
                            customer: payload.new.customer_name
                        }
                    });
                    window.dispatchEvent(event);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [orders.length]); // Re-subscribe if length changes (new orders added)

    const handleSubmitFeedback = async () => {
        if (!feedbackMessage.trim()) return;
        setIsSubmittingFeedback(true);
        try {
            await supabase.from('feedback').insert([{
                customer_name: customerName,
                phone_number: feedbackPhone || orders[0]?.customer_phone,
                message: feedbackMessage
            }]);
            localStorage.setItem(`feedback_given_${tableNumber}_${customerName}`, "true");
            setShowFeedbackModal(false);
        } catch (error) {
            console.error("Feedback error:", error);
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    const getStatusStep = (status: string) => {
        switch (status) {
            case 'Pending': return 0;
            case 'Preparing': return 1;
            case 'Ready': return 2;
            case 'Served': return 3;
            default: return 0;
        }
    };

    const statusSteps = [
        { key: 'Pending', label: 'Order Received', icon: Clock, color: 'text-gray-400' },
        { key: 'Preparing', label: 'Preparing', icon: ChefHat, color: 'text-orange-400' },
        { key: 'Ready', label: 'Ready for Pickup', icon: CheckCircle, color: 'text-green-400' },
        { key: 'Served', label: 'Enjoy Your Meal!', icon: Package, color: 'text-blue-400' }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#D4AF37] border-t-transparent animate-spin rounded-full mx-auto mb-4"></div>
                    <p className="text-white/60">Loading your order...</p>
                </div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center px-4">
                <div className="text-center max-w-md">
                    <UtensilsCrossed className="w-20 h-20 text-[#D4AF37]/20 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">No Active Order Found</h1>
                    <p className="text-white/60 mb-6">We couldn't find any active orders for your table.</p>
                    <button
                        onClick={() => router.push('/menu')}
                        className="bg-[#D4AF37] hover:bg-yellow-600 text-black px-6 py-3 rounded-xl font-bold transition"
                    >
                        Back to Menu
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#121212] pt-20 pb-10">
            <div className="max-w-2xl mx-auto px-6">
                {/* Orders Overview Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#8B0000]/20 to-[#D4AF37]/20 rounded-2xl p-6 mb-8 border border-[#D4AF37]/30 shadow-xl"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-2">Your Orders</h1>
                            <div className="flex items-center gap-4 text-white/80">
                                <span className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    {tableNumber === 'Parcel' ? 'Parcel Order' : `Table ${tableNumber}`}
                                </span>
                                {orders[0]?.customer_phone && (
                                    <span className="flex items-center gap-1">
                                        <Phone className="w-4 h-4" />
                                        {orders[0].customer_phone}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-white/60 text-sm">Total Amount</p>
                            <p className="text-2xl font-bold text-[#D4AF37]">
                                ₹{orders.reduce((sum, order) => sum + order.total_price, 0)}
                            </p>
                            <p className="text-xs text-white/40 mt-1">{orders.length} order(s)</p>
                        </div>
                    </div>
                </motion.div>

                {/* Orders List */}
                <div className="space-y-8">
                    {orders.map((order, orderIndex) => {
                        const currentStep = getStatusStep(order.order_status);

                        return (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * orderIndex }}
                                className="glass-panel p-6 rounded-3xl border border-white/5 shadow-2xl"
                            >
                                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                        <Package className="w-5 h-5 text-[#D4AF37]" /> Order #{orders.length - orderIndex}
                                    </h2>
                                    <span className="text-white/40 text-sm">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>

                                {/* Status Progress */}
                                <div className="bg-black/20 rounded-2xl p-6 mb-6 border border-white/5">
                                    <div className="space-y-4">
                                        {statusSteps.map((step, index) => {
                                            const Icon = step.icon;
                                            const isActive = index <= currentStep;
                                            const isCurrent = index === currentStep;

                                            return (
                                                <div
                                                    key={step.key}
                                                    className={`flex items-center gap-4 p-3 rounded-xl transition-all ${isCurrent ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/20 shadow-lg' :
                                                        isActive ? 'bg-white/5' : 'bg-white/5 opacity-40'
                                                        }`}
                                                >
                                                    <div className={`relative ${isActive ? 'text-white' : 'text-white/40'}`}>
                                                        <Icon className={`w-6 h-6 ${isActive ? step.color : ''} ${isCurrent && step.key === 'Preparing' ? 'animate-bounce' : ''}`} />
                                                        {index < statusSteps.length - 1 && (
                                                            <div className={`absolute top-6 left-3 w-0.5 h-8 ${index < currentStep ? 'bg-[#D4AF37]' : 'bg-white/10'
                                                                }`} />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className={`font-semibold ${isActive ? 'text-white' : 'text-white/50'}`}>
                                                            {step.label}
                                                        </p>
                                                        {isCurrent && (
                                                            <motion.p
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                className="text-xs text-[#D4AF37] mt-0.5"
                                                            >
                                                                {index === statusSteps.length - 1 ? (
                                                                    <span className="flex items-center gap-1 font-bold italic">✨ Complete!</span>
                                                                ) : "Currently in progress..."}
                                                            </motion.p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                                    <h3 className="text-sm font-semibold text-white/50 mb-3 uppercase tracking-wider">Items in this order</h3>
                                    <div className="space-y-3">
                                        {order.order_items?.map((item, index) => (
                                            <div key={index} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 last:pb-0">
                                                <div className="flex items-start gap-2">
                                                    <span className="text-[#D4AF37] font-bold mt-0.5">{item.quantity}x</span>
                                                    <p className="text-white/90 font-medium">{item.item_name}</p>
                                                </div>
                                                <p className="text-white/60 font-medium">₹{item.price_per_item * item.quantity}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                                        <span className="text-white/60 font-medium">Subtotal</span>
                                        <span className="text-[#D4AF37] font-bold text-lg">₹{order.total_price}</span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Feedback Modal (Auto-pops when all orders served) */}
                <AnimatePresence>
                    {showFeedbackModal && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="glass-panel w-full max-w-md p-8 rounded-3xl border border-[#D4AF37]/30 shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[#8B0000]/10 to-[#D4AF37]/5 -z-10" />

                                <button
                                    onClick={() => {
                                        setShowFeedbackModal(false);
                                        localStorage.setItem(`feedback_given_${tableNumber}_${customerName}`, "skipped");
                                    }}
                                    className="absolute top-4 right-4 text-white/40 hover:text-white"
                                >
                                    ✕
                                </button>

                                <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Star className="w-8 h-8 text-[#D4AF37]" fill="currentColor" />
                                </div>

                                <h3 className="text-2xl font-bold text-white text-center mb-2">How was your meal?</h3>
                                <p className="text-white/60 text-center mb-6 text-sm">We'd love to hear your feedback about your experience at Table {tableNumber}.</p>

                                <div className="space-y-4">
                                    <input
                                        type="tel"
                                        placeholder="Phone Number (Optional)"
                                        value={feedbackPhone}
                                        onChange={(e) => setFeedbackPhone(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition font-light"
                                    />
                                    <textarea
                                        placeholder="Tell us what you loved..."
                                        value={feedbackMessage}
                                        onChange={(e) => setFeedbackMessage(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition font-light min-h-[120px] resize-y"
                                    />
                                    <button
                                        onClick={handleSubmitFeedback}
                                        disabled={isSubmittingFeedback || !feedbackMessage.trim()}
                                        className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-yellow-600 hover:from-yellow-600 hover:to-[#D4AF37] text-black font-bold rounded-xl transition disabled:opacity-50 shadow-lg shadow-[#D4AF37]/20 flex justify-center items-center gap-2"
                                    >
                                        {isSubmittingFeedback ? (
                                            <div className="w-5 h-5 border-2 border-black border-t-transparent animate-spin rounded-full"></div>
                                        ) : (
                                            <>Submit Feedback <Send className="w-4 h-4" /></>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Global CustomerNotifications container handles the live popups! */}
            </div>
        </div>
    );
}
