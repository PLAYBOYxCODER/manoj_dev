"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { menuItems } from "@/data/menu";
import { pageDetails } from "@/data/business";
import { useAppContext } from "@/context/AppContext";
import { ShoppingCart, Plus } from "lucide-react";

export default function MenuPage() {
    const [activeCategory, setActiveCategory] = useState("All");
    const { addToCart } = useAppContext();

    const categories = ["All", ...Array.from(new Set(menuItems.map((item) => item.category)))];

    const filteredItems = activeCategory === "All"
        ? menuItems
        : menuItems.filter((item) => item.category === activeCategory);

    return (
        <div className="min-h-screen bg-transparent pt-24 pb-20 relative">
            <div className="absolute inset-0 bg-[#121212]/80 backdrop-blur-md -z-10" />
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
                        {pageDetails.menu.title}
                    </h1>
                    <p className="text-[#D4AF37] text-lg font-medium tracking-wide">
                        "{pageDetails.menu.tagline}"
                    </p>
                    <div className="w-16 h-1 bg-[#8B0000] mx-auto mt-6" />
                </motion.div>

                {/* Categories */}
                <div className="flex overflow-x-auto gap-4 mb-16 pb-4 scrollbar-hide justify-start md:justify-center">
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-6 py-2 rounded-full whitespace-nowrap transition-all font-medium ${activeCategory === category
                                ? "bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20"
                                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Menu Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredItems.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-panel rounded-2xl overflow-hidden hover:border-[#D4AF37]/30 transition group flex flex-col"
                        >
                            <div className="relative h-60 overflow-hidden bg-white/5">
                                {/* Simulated images using unsplash or placeholder */}
                                <div className="absolute inset-0 flex items-center justify-center text-white/20 font-bold tracking-widest uppercase">
                                    {item.category}
                                </div>
                                {item.discount > 0 && (
                                    <div className="absolute top-4 left-4 bg-[#8B0000] text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10">
                                        {item.discount}% OFF
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                                <h3 className="absolute bottom-4 left-4 text-xl font-bold text-white z-20 group-hover:text-[#D4AF37] transition">
                                    {item.name}
                                </h3>
                            </div>

                            <div className="p-6 flex flex-col flex-1">
                                <p className="text-white/60 text-sm mb-6 flex-1 line-clamp-2 leading-relaxed">
                                    {item.description}
                                </p>
                                <div className="flex items-center justify-between mt-auto">
                                    <div>
                                        <span className="text-2xl font-bold text-white">₹{item.price}</span>
                                        {item.discount > 0 && (
                                            <span className="text-white/40 text-sm line-through ml-2">
                                                ₹{Math.round(item.price * (1 + item.discount / 100))}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => addToCart({ ...item, quantity: 1 })}
                                        disabled={item.stock !== "Available"}
                                        className="flex items-center gap-2 bg-gradient-to-r from-[#8B0000] to-red-900 text-white px-4 py-2 rounded-xl hover:from-red-900 hover:to-[#8B0000] transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {item.stock === "Available" ? "Add" : "Sold Out"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
