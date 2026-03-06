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

    // Feedback Details
    const [feedbackPhone, setFeedbackPhone] = useState("");
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

    // Customer Details
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [orderType, setOrderType] = useState<'Dine-in' | 'Parcel'>('Dine-in');

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
        if (orderType === 'Dine-in' && !tableNumber) {
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
        localStorage.setItem("order_type", orderType);

        setLoading(true);
        setError(null);

        try {
            // Create new order entry
            const { data, error: pbError } = await supabase
                .from('orders')
                .insert([{
                    table_number: orderType === 'Parcel' ? null : tableNumber,
                    customer_name: name.trim(),
                    customer_phone: phone.trim() || null,
                    customer_email: email.trim() || null,
                    total_price: total,
                    order_status: 'Pending',
                    order_type: orderType
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

            // Save order info for tracking
            const tableForTracking = orderType === 'Parcel' ? 'Parcel' : (tableNumber || 'Unknown');
            localStorage.setItem('last_table_number', tableForTracking);
            localStorage.setItem('last_customer_name', name.trim());

            // Redirect to order tracking page
            setTimeout(() => {
                router.push(`/order-tracking?table=${tableForTracking}&customer=${encodeURIComponent(name.trim())}`);
            }, 2000);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error("Order error:", err);
            setError(err.message || "Failed to place order. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleFeedbackSubmit = async () => {
        if (!feedbackMessage.trim()) return;
        setIsSubmittingFeedback(true);
        try {
            await supabase.from('feedback').insert([{
                customer_name: name,
                phone_number: feedbackPhone || phone,
                message: feedbackMessage
            }]);
            setFeedbackSubmitted(true);
            setTimeout(() => router.push("/menu"), 2000);
        } catch (error) {
            console.error(error);
            router.push("/menu");
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#121212] pt-32 pb-20 flex justify-center items-center px-6">
                <div className="glass-panel p-10 rounded-3xl text-center max-w-lg w-full">
                    <CheckCircle className="w-20 h-20 text-[#D4AF37] mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-white mb-4">Order Placed!</h2>
                    <p className="text-white/60 mb-6">
                        {orderType === 'Parcel'
                            ? "Your parcel order is being prepared. We'll notify you when it's ready for pickup."
                            : `Your food is being prepared. We will serve it to Table ${tableNumber} shortly.`
                        }
                    </p>
                    <div className="w-12 h-1 bg-[#8B0000] mx-auto mb-6" />

                    {!feedbackSubmitted ? (
                        <div className="mt-8 text-left bg-black/20 p-6 rounded-2xl border border-white/5">
                            <h3 className="text-xl font-bold text-white mb-4">How was your experience?</h3>
                            <p className="text-white/50 text-sm mb-4">Leave a message or feedback for us!</p>
                            <input
                                type="tel"
                                placeholder="Phone Number (Optional)"
                                value={feedbackPhone}
                                onChange={(e) => setFeedbackPhone(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition font-light mb-3"
                            />
                            <textarea
                                placeholder="Your Message or Feedback..."
                                value={feedbackMessage}
                                onChange={(e) => setFeedbackMessage(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition font-light min-h-[100px] resize-y mb-4"
                            />
                            <div className="flex gap-4">
                                <button
                                    onClick={() => router.push("/menu")}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition"
                                >
                                    Skip
                                </button>
                                <button
                                    onClick={handleFeedbackSubmit}
                                    disabled={isSubmittingFeedback || !feedbackMessage.trim()}
                                    className="flex-1 py-3 bg-[#D4AF37] hover:bg-yellow-600 text-black font-bold rounded-xl transition disabled:opacity-50"
                                >
                                    {isSubmittingFeedback ? "Submitting..." : "Submit"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-8 bg-green-900/20 text-green-200 p-6 rounded-xl border border-green-500/30">
                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                            <p className="font-bold">Thank you for your feedback!</p>
                            <p className="text-sm opacity-80 mt-1">Redirecting to menu...</p>
                        </div>
                    )}
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
                        <h2 className="text-2xl font-bold mb-6 text-white border-b border-white/10 pb-4">Order Type</h2>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <button
                                onClick={() => setOrderType('Dine-in')}
                                className={`p-4 rounded-xl border-2 font-bold transition-all ${orderType === 'Dine-in'
                                    ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                                    }`}
                            >
                                🍽 Dine-in
                            </button>
                            <button
                                onClick={() => setOrderType('Parcel')}
                                className={`p-4 rounded-xl border-2 font-bold transition-all ${orderType === 'Parcel'
                                    ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                                    }`}
                            >
                                🥡 Parcel
                            </button>
                        </div>

                        {orderType === 'Dine-in' ? (
                            <>
                                <h3 className="text-lg font-semibold text-white mb-4">Table Details</h3>
                                <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${tableNumber ? 'bg-white/5 border-[#D4AF37]/30' : 'bg-red-900/20 border-red-500/30 text-red-200'}`}>
                                    {!tableNumber && <AlertCircle className="w-6 h-6 flex-shrink-0 mt-1" />}
                                    <div className="flex-1 w-full">
                                        <h4 className={`font-bold mb-1 ${tableNumber ? 'text-white' : ''}`}>
                                            {tableNumber ? 'Table Selected' : 'No Table Selected'}
                                        </h4>
                                        <p className={`text-sm mb-3 ${tableNumber ? 'text-white/50' : 'opacity-80'}`}>
                                            {tableNumber ? "You can change this if you're seated elsewhere." : "Please scan the QR code on your table, or enter your table number below."}
                                        </p>
                                        <div className="flex items-center gap-3 w-full">
                                            {tableNumber ? <span className="text-white/70 font-medium">Table: </span> : null}
                                            <input
                                                key="table-input"
                                                type="text"
                                                value={tableNumber || ""}
                                                onChange={(e) => setTableNumber(e.target.value)}
                                                placeholder={tableNumber ? "" : "Table Number"}
                                                className={`bg-black/40 border border-[#D4AF37]/50 rounded-lg py-2 text-white focus:outline-none transition font-bold ${tableNumber ? 'w-24 px-3 text-center text-[#D4AF37] focus:border-white' : 'w-full px-4 focus:border-[#D4AF37]'}`}
                                            />
                                        </div>
                                        {!tableNumber && (
                                            <div className="flex gap-2 mt-4">
                                                <button onClick={() => router.push("/menu")} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition">
                                                    Return to Menu
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-green-900/20 p-4 rounded-xl border border-green-500/30 text-green-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-black font-bold">🥡</div>
                                    <div>
                                        <h4 className="font-bold text-white mb-1">Parcel Order</h4>
                                        <p className="text-sm opacity-80">Your order will be prepared for takeaway. You'll receive a notification when it's ready for pickup.</p>
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
                        disabled={loading || cart.length === 0 || (orderType === 'Dine-in' && !tableNumber) || !name.trim()}
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
