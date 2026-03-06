"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";

export default function CartDrawer() {
    const { cart, isCartOpen, setIsCartOpen, updateQuantity, tableNumber } = useAppContext();
    const router = useRouter();

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleCheckout = () => {
        setIsCartOpen(false);
        // Proceed to checkout - requires them to be at a table, but let's let them go to checkout page
        // Actually, just redirect to /checkout
        router.push("/checkout");
    };

    return (
        <AnimatePresence>
            {isCartOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsCartOpen(false)}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full sm:w-[400px] bg-[#121212] flex flex-col z-50 shadow-2xl border-l border-white/10"
                    >
                        <div className="flex items-center justify-between p-6 border-b border-white/10">
                            <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
                                <ShoppingBag className="text-[#D4AF37]" /> Your Order
                            </h2>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition"
                            >
                                <X className="w-6 h-6 text-white" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-white/50 space-y-4">
                                    <ShoppingBag className="w-16 h-16 opacity-20" />
                                    <p>Your cart is empty</p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.id} className="flex gap-4">
                                        {item.image ? (
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-20 h-20 object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 bg-black/40 rounded-lg flex items-center justify-center">
                                                <ShoppingBag className="w-8 h-8 text-white/20" />
                                            </div>
                                        )}
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h3 className="font-medium text-white">{item.name}</h3>
                                                <p className="text-[#D4AF37] font-semibold">₹{item.price}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    className="p-1 rounded bg-white/10 hover:bg-white/20 transition text-white"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="w-4 text-center text-white">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    className="p-1 rounded bg-[#8B0000] text-white hover:bg-[#6b0000] transition"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-6 border-t border-white/10 bg-[#1a1a1a]">
                            <div className="flex justify-between mb-4 text-lg font-semibold text-white">
                                <span>Total:</span>
                                <span className="text-[#D4AF37]">₹{total}</span>
                            </div>
                            <button
                                onClick={handleCheckout}
                                disabled={cart.length === 0}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#8B0000] to-red-900 text-white font-semibold flex items-center justify-center gap-2 hover:from-red-900 hover:to-[#8B0000] transition disabled:opacity-50"
                            >
                                Checkout Now
                            </button>
                            {tableNumber && (
                                <p className="text-center text-sm text-white/50 mt-4">
                                    Ordering for Table #{tableNumber}
                                </p>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
