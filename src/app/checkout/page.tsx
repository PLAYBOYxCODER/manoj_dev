"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";
import { CheckCircle, AlertCircle, ShoppingBag } from "lucide-react";

export default function CheckoutPage() {
    const { cart, tableNumber, setTableNumber, clearCart } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Customer Details
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");

    useEffect(() => {
        const savedName = localStorage.getItem("customer_name") || "";
        const savedPhone = localStorage.getItem("customer_phone") || "";
        const savedEmail = localStorage.getItem("customer_email") || "";
        setName(savedName);
        setPhone(savedPhone);
        setEmail(savedEmail);
    }, []);

    const router = useRouter();

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const placeOrder = async () => {
        if (cart.length === 0) return;
        if (!tableNumber) {
            setError("Please scan a table QR code first or enter your table number.");
            return;
        }
        if (!name.trim()) {
            setError("Name is required to place an order.");
            return;
        }

        // Save for next time
        localStorage.setItem("customer_name", name.trim());
        localStorage.setItem("customer_phone", phone.trim());
        localStorage.setItem("customer_email", email.trim());

        setLoading(true);
        setError(null);

        try {
            // Create new order entry
            const { data, error: pbError } = await supabase
                .from('orders')
                .insert([{
                    table_number: tableNumber,
                    customer_name: name.trim(),
                    customer_phone: phone.trim() || null,
                    customer_email: email.trim() || null,
                    total_price: total,
                    order_status: 'Pending'
                }])
                .select()
                .single();

            if (pbError) throw pbError;

            // Create order items
            if (data) {
                const orderItems = cart.map(item => ({
                    order_id: data.id,
                    item_name: item.name,
                    quantity: item.quantity,
                    price_per_item: item.price
                }));

                const { error: itemsError } = await supabase
                    .from('order_items')
                    .insert(orderItems);

                if (itemsError) throw itemsError;
            }

            setSuccess(true);
            clearCart();
            setTimeout(() => router.push("/menu"), 3000);

        } catch (err: any) {
            console.error("Order error:", err);
            setError(err.message || "Failed to place order. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#121212] pt-32 pb-20 flex justify-center items-center px-6">
                <div className="glass-panel p-10 rounded-3xl text-center max-w-lg w-full">
                    <CheckCircle className="w-20 h-20 text-[#D4AF37] mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-white mb-4">Order Placed!</h2>
                    <p className="text-white/60 mb-6">Your food is being prepared. We will serve it to Table {tableNumber} shortly.</p>
                    <div className="w-12 h-1 bg-[#8B0000] mx-auto mb-6" />
                    <p className="text-sm text-white/40">Redirecting back to menu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#121212] pt-32 pb-20 px-6">
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10">

                {/* Order Summary */}
                <div className="glass-panel p-8 rounded-3xl h-max border border-white/5">
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-6 text-white border-b border-white/10 pb-4">
                        <ShoppingBag className="text-[#D4AF37]" /> Order Summary
                    </h2>

                    <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-2">
                        {cart.map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-white/80">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-white">{item.quantity}x</span>
                                    <span>{item.name}</span>
                                </div>
                                <span className="font-semibold text-[#D4AF37]">₹{item.price * item.quantity}</span>
                            </div>
                        ))}
                        {cart.length === 0 && (
                            <div className="text-center text-white/40 py-8">Your cart is empty.</div>
                        )}
                    </div>

                    <div className="border-t border-white/10 pt-6">
                        <div className="flex justify-between text-xl font-bold text-white">
                            <span>Total Amount</span>
                            <span className="text-[#D4AF37]">₹{total}</span>
                        </div>
                    </div>
                </div>

                {/* Checkout Actions */}
                <div className="flex flex-col gap-6">
                    <div className="glass-panel p-8 rounded-3xl border border-white/5">
                        <h2 className="text-2xl font-bold mb-6 text-white border-b border-white/10 pb-4">Table Details</h2>
                        {tableNumber ? (
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-[#D4AF37]/30">
                                <div className="flex-1">
                                    <h3 className="font-bold text-white">Table Selected</h3>
                                    <p className="text-white/50 text-sm mb-2">You can change this if you're seated elsewhere.</p>
                                    <div className="flex items-center gap-3">
                                        <span className="text-white/70 font-medium">Table: </span>
                                        <input
                                            type="text"
                                            value={tableNumber}
                                            onChange={(e) => setTableNumber(e.target.value)}
                                            className="w-24 bg-black/40 border border-[#D4AF37]/50 rounded-lg px-3 py-2 text-center text-[#D4AF37] focus:outline-none focus:border-white transition font-bold"
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-4 bg-red-900/20 p-4 rounded-xl border border-red-500/30 text-red-200">
                                <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold mb-1">No Table Selected</h3>
                                    <p className="text-sm opacity-80 mb-3">Please scan the QR code on your table, or enter your table number below.</p>
                                    <input
                                        type="text"
                                        placeholder="Table Number"
                                        className="w-full bg-black/40 border border-[#D4AF37]/50 rounded-lg px-4 py-2 text-white mb-3 focus:outline-none focus:border-[#D4AF37] transition font-bold"
                                        onChange={(e) => setTableNumber(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => router.push("/menu")} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition">
                                            Return to Menu
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Customer Details */}
                    <div className="glass-panel p-8 rounded-3xl border border-white/5">
                        <h2 className="text-xl font-bold mb-4 text-white">Your Details</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-white/70 text-sm mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37] transition font-light"
                                />
                            </div>
                            <div>
                                <label className="block text-white/70 text-sm mb-1">Phone Number <span className="text-white/40">(Optional)</span></label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Enter your phone"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37] transition font-light"
                                />
                            </div>
                            <div>
                                <label className="block text-white/70 text-sm mb-1">Email <span className="text-white/40">(Optional)</span></label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37] transition font-light"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-900/20 text-red-200 p-4 rounded-xl border border-red-500/30 text-sm flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
                        </div>
                    )}

                    <button
                        onClick={placeOrder}
                        disabled={loading || cart.length === 0 || !tableNumber || !name.trim()}
                        className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#8B0000] to-red-900 text-white font-bold text-lg hover:from-red-900 hover:to-[#8B0000] transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-[#8B0000]/20 flex justify-center items-center"
                    >
                        {loading ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                        ) : (
                            "Confirm & Place Order"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
