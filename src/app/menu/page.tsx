"use client";

import { useDeferredValue, useMemo, useRef, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { pageDetails } from "@/data/business";
import { useAppContext } from "@/context/AppContext";
import { Plus, ChevronLeft, ChevronRight, Search, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type MenuItem = {
    id: string;
    name: string;
    description: string;
    price: number;
    discount: number;
    stock_status: string;
    category: string;
    is_active: boolean;
    image_url?: string;
};

function getSupabaseMenuImageUrl(value: string | undefined | null) {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^(https?:)?\/\//i.test(trimmed)) return trimmed;
    if (/^(data:|blob:)/i.test(trimmed)) return trimmed;
    // Treat as Supabase Storage path in bucket "menu-images"
    const { data } = supabase.storage.from("menu-images").getPublicUrl(trimmed);
    return data.publicUrl || null;
}

const quotes = [
    "“Good food is the foundation of genuine happiness.”",
    "“Food brings people together on many different levels. It’s nourishment of the soul and body.”",
    "“People who love to eat are always the best people.”",
];

function MenuCardSkeleton() {
    return (
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
            <div className="h-60 bg-white/5 relative overflow-hidden">
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/5 via-white/10 to-white/5" />
            </div>
            <div className="p-6 space-y-4">
                <div className="h-4 w-2/3 bg-white/10 rounded animate-pulse" />
                <div className="h-3 w-full bg-white/5 rounded animate-pulse" />
                <div className="h-3 w-5/6 bg-white/5 rounded animate-pulse" />
                <div className="flex items-center justify-between pt-2">
                    <div className="h-6 w-24 bg-white/10 rounded animate-pulse" />
                    <div className="h-10 w-24 bg-white/10 rounded-xl animate-pulse" />
                </div>
            </div>
        </div>
    );
}

export default function MenuPage() {
    const [activeCategory, setActiveCategory] = useState("All");
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [query, setQuery] = useState("");
    const { addToCart } = useAppContext();
    const categoryScrollRef = useRef<HTMLDivElement | null>(null);
    const deferredQuery = useDeferredValue(query);

    useEffect(() => {
        let isMounted = true;
        const fetchMenu = async () => {
            const { data } = await supabase
                .from("menu_items")
                .select("*")
                .eq("is_active", true)
                .order('category', { ascending: true })
                .order('name', { ascending: true });

            if (!isMounted) return;
            if (data) setMenuItems(data);
            setLoading(false);
            setRefreshing(false);
        };
        fetchMenu();

        // Subscribe to real-time menu updates
        const subscription = supabase
            .channel('public:menu_items')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
                setRefreshing(true);
                fetchMenu();
            })
            .subscribe();

        return () => {
            isMounted = false;
            supabase.removeChannel(subscription);
        };
    }, []);

    const categories = useMemo(() => {
        const normalized = menuItems
            .map((i) => (i.category || "Uncategorized").trim())
            .filter(Boolean);
        const unique = Array.from(new Set(normalized));
        unique.sort((a, b) => a.localeCompare(b));
        return ["All", ...unique];
    }, [menuItems]);

    const filteredItems = useMemo(() => {
        const q = deferredQuery.trim().toLowerCase();
        return menuItems.filter((item) => {
            const category = (item.category || "Uncategorized").trim();
            const categoryOk = activeCategory === "All" ? true : category === activeCategory;
            const queryOk = !q
                ? true
                : `${item.name} ${item.description || ""} ${category}`.toLowerCase().includes(q);
            return categoryOk && queryOk;
        });
    }, [menuItems, activeCategory, deferredQuery]);

    const scrollCategories = (direction: "left" | "right") => {
        const el = categoryScrollRef.current;
        if (!el) return;
        const amount = Math.max(240, Math.round(el.clientWidth * 0.7));
        el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
    };

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
                        &ldquo;{pageDetails.menu.tagline}&rdquo;
                    </p>
                    <div className="w-16 h-1 bg-[#8B0000] mx-auto mt-6" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-12"
                >
                    {/* Search Bar - Moved to Top */}
                    <div className="flex justify-center mb-8">
                        <div className="relative w-full max-w-lg">
                            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search dishes, categories..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/60 focus:bg-white/10 transition-all text-center"
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery("")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="relative w-full">
                        <button
                            type="button"
                            onClick={() => scrollCategories("left")}
                            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-xl bg-black/30 border border-white/10 text-white/70 hover:text-white hover:bg-black/50 transition"
                            aria-label="Scroll categories left"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollCategories("right")}
                            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-xl bg-black/30 border border-white/10 text-white/70 hover:text-white hover:bg-black/50 transition"
                            aria-label="Scroll categories right"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <div
                            ref={categoryScrollRef}
                            className="flex overflow-x-auto gap-3 pb-3 scrollbar-hide pr-2 md:px-12"
                        >
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setActiveCategory(category)}
                                    title={category}
                                    className={`px-5 py-2 rounded-full whitespace-nowrap transition-all font-semibold text-sm ${activeCategory === category
                                        ? "bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20"
                                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/0 hover:border-white/10"
                                        }`}
                                >
                                    <span className="inline-block max-w-[16rem] truncate align-bottom">{category}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-center mb-8 italic text-white/50 text-sm md:text-base font-light"
                    >
                        {quotes[0]}
                    </motion.div>

                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="menu-loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {Array.from({ length: 9 }).map((_, i) => (
                                <MenuCardSkeleton key={i} />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`menu-grid-${activeCategory}-${deferredQuery}`}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div className="text-white/60 text-sm">
                                    Showing <span className="text-white font-semibold">{filteredItems.length}</span> items
                                </div>
                                {refreshing && (
                                    <div className="flex items-center gap-2 text-white/50 text-sm">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Refreshing…
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredItems.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: Math.min(index * 0.03, 0.25) }}
                                        className="glass-panel rounded-2xl overflow-hidden hover:border-[#D4AF37]/50 hover:shadow-2xl hover:shadow-[#D4AF37]/10 transition-all duration-300 group flex flex-col group/card"
                                    >
                                        <div className="relative h-60 overflow-hidden bg-white/5 group-hover/card:scale-[1.02] transition duration-500">
                                            {item.image_url ? (
                                                <img
                                                    src={getSupabaseMenuImageUrl(item.image_url) || undefined}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover opacity-90 group-hover/card:opacity-100 group-hover/card:scale-110 transition duration-700"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-white/20 font-bold tracking-widest uppercase bg-gradient-to-br from-black/40 to-white/5">
                                                    {item.category}
                                                </div>
                                            )}
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
                                                    onClick={() => addToCart({ id: item.id, name: item.name, price: item.price, image: getSupabaseMenuImageUrl(item.image_url) || "", quantity: 1 })}
                                                    disabled={item.stock_status !== "Available"}
                                                    className="flex items-center gap-2 bg-gradient-to-r from-[#8B0000] to-red-900 text-white px-4 py-2 rounded-xl hover:from-red-900 hover:to-[#8B0000] transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    {item.stock_status === "Available" ? "Add" : "Sold Out"}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {!loading && filteredItems.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className="mt-20 text-center text-white/40 italic font-light italic max-w-2xl mx-auto pb-10 border-t border-white/10 pt-10"
                    >
                    &ldquo;Cooking is all about people. Food is maybe the only universal thing that really has the power to bring everyone together. No matter what culture, everywhere around the world, people eat together.&rdquo;
                        <div className="mt-4 text-[#D4AF37]/60 font-bold text-xs uppercase tracking-widest">— Abhiruchi Chefs</div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
