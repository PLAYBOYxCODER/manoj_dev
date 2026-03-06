"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChefHat, CheckCircle, Package, UtensilsCrossed, Phone, User } from "lucide-react";
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
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [tableNumber, setTableNumber] = useState("");
    const [customerName, setCustomerName] = useState("");

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
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            setOrder(data);
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
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            setOrder(data);
        } catch (error) {
            console.error('Error fetching parcel order:', error);
        } finally {
            setLoading(false);
        }
    };

    // Real-time subscription for order updates
    useEffect(() => {
        if (!order?.id) return;

        const subscription = supabase
            .channel(`order-tracking-${order.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `id=eq.${order.id}`
            }, (payload) => {
                setOrder(prev => prev ? { ...prev, ...payload.new } : null);

                // Trigger customer notification locally so the UI popup shows
                const event = new CustomEvent('customerOrderUpdate', {
                    detail: {
                        type: payload.new.order_status.toLowerCase(),
                        table: payload.new.table_number || 'Parcel',
                        customer: payload.new.customer_name
                    }
                });
                window.dispatchEvent(event);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [order?.id]);

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

    if (!order) {
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

    const currentStep = getStatusStep(order.order_status);

    return (
        <div className="min-h-screen bg-[#121212] pt-20 pb-10">
            <div className="max-w-2xl mx-auto px-6">
                {/* Order Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#8B0000]/20 to-[#D4AF37]/20 rounded-2xl p-6 mb-8 border border-[#D4AF37]/30"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-2">Order Tracking</h1>
                            <div className="flex items-center gap-4 text-white/80">
                                <span className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    {tableNumber === 'Parcel' ? 'Parcel Order' : `Table ${tableNumber}`}
                                </span>
                                {order.customer_phone && (
                                    <span className="flex items-center gap-1">
                                        <Phone className="w-4 h-4" />
                                        {order.customer_phone}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-white/60 text-sm">Total Amount</p>
                            <p className="text-2xl font-bold text-[#D4AF37]">₹{order.total_price}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Status Progress */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 rounded-2xl p-6 mb-8 border border-white/10"
                >
                    <h2 className="text-lg font-semibold text-white mb-6">Order Status</h2>
                    <div className="space-y-4">
                        {statusSteps.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = index <= currentStep;
                            const isCurrent = index === currentStep;

                            return (
                                <motion.div
                                    key={step.key}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * index }}
                                    className={`flex items-center gap-4 p-3 rounded-xl transition-all ${isCurrent ? 'bg-[#D4AF37]/20 border border-[#D4AF37]/30' :
                                            isActive ? 'bg-white/5' : 'bg-white/5 opacity-50'
                                        }`}
                                >
                                    <div className={`relative ${isActive ? 'text-white' : 'text-white/40'}`}>
                                        <Icon className={`w-6 h-6 ${isActive ? step.color : ''}`} />
                                        {index < statusSteps.length - 1 && (
                                            <div className={`absolute top-6 left-3 w-0.5 h-8 ${index < currentStep ? 'bg-[#D4AF37]' : 'bg-white/20'
                                                }`} />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-medium ${isActive ? 'text-white' : 'text-white/50'}`}>
                                            {step.label}
                                        </p>
                                        {isCurrent && (
                                            <motion.p
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-sm text-[#D4AF37] mt-1"
                                            >
                                                Currently in progress...
                                            </motion.p>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Order Items */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/5 rounded-2xl p-6 border border-white/10"
                >
                    <h2 className="text-lg font-semibold text-white mb-4">Order Items</h2>
                    <div className="space-y-3">
                        {order.order_items?.map((item, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-white/10 last:border-0">
                                <div>
                                    <p className="text-white font-medium">{item.item_name}</p>
                                    <p className="text-white/60 text-sm">Qty: {item.quantity}</p>
                                </div>
                                <p className="text-[#D4AF37] font-semibold">₹{item.price_per_item * item.quantity}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Notifications Display */}
                <AnimatePresence>
                    {notifications.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed bottom-4 left-4 right-4 z-50"
                        >
                            <div className="bg-gradient-to-r from-[#D4AF37] to-yellow-600 p-4 rounded-xl shadow-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-black font-semibold">Latest Update</p>
                                        <p className="text-black/80 text-sm">{notifications[notifications.length - 1].message}</p>
                                    </div>
                                    <button
                                        onClick={clearNotifications}
                                        className="text-black/60 hover:text-black"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
