"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Edit, Save, Filter, Upload, Image as ImageIcon, CheckCircle, ArrowDownUp, X, Camera, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { showToast } from "@/components/Toast";

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

function getMenuImageSrc(value: string | undefined | null) {
    if (!value) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^(https?:)?\/\//i.test(trimmed)) return trimmed;
    if (/^(data:|blob:)/i.test(trimmed)) return trimmed;
    const { data } = supabase.storage.from("menu-images").getPublicUrl(trimmed);
    return data.publicUrl || null;
}

const compressImage = (file: File, maxWidth: number = 1080): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new window.Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                                    type: "image/jpeg",
                                    lastModified: Date.now(),
                                });
                                resolve(newFile);
                            } else {
                                reject(new Error("Canvas to Blob failed"));
                            }
                        },
                        "image/jpeg",
                        0.8
                    );
                } else {
                    reject(new Error("Failed to get canvas context"));
                }
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

export default function MenuManager() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [newItem, setNewItem] = useState<Partial<MenuItem>>({
        name: "",
        description: "",
        price: 0,
        discount: 0,
        stock_status: "Available",
        category: "Main Course",
        is_active: true,
        image_url: ""
    });
    const [isAdding, setIsAdding] = useState(false);

    // UI Enhancements State
    const [sortBy, setSortBy] = useState("Name");
    const [filterCategory, setFilterCategory] = useState("All");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);

    useEffect(() => {
        fetchMenuItems();
    }, []);

    const fetchMenuItems = async () => {
        if (items.length === 0) setLoading(true);
        else setRefreshing(true);
        const { data } = await supabase
            .from("menu_items")
            .select("*");

        if (data) setItems(data);
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        if (loading) return;
        const channel = supabase
            .channel("public:menu_items_admin")
            .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, () => {
                setRefreshing(true);
                fetchMenuItems();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loading]);

    const handleSaveNewItem = async () => {
        if (!newItem.name || !newItem.price) {
            showToast("error", "Name and price are required.");
            return;
        }

        const { error } = await supabase.from("menu_items").insert([{
            ...newItem,
            category: showNewCategoryInput ? newItem.category : (newItem.category || "Uncategorized")
        }]);

        if (error) {
            console.error("Error creating item", error);
            showToast("error", "Failed to create item. Please try again.");
            return;
        }

        showToast("success", `✨ ${newItem.name} has been added to the menu!`);
        setIsAdding(false);
        setNewItem({
            name: "",
            description: "",
            price: 0,
            discount: 0,
            stock_status: "Available",
            category: "Main Course",
            is_active: true,
            image_url: ""
        });
        setShowNewCategoryInput(false);
        setUploadSuccess(false);
        fetchMenuItems();
    };

    const handleSaveEdit = async () => {
        if (!editingItem) return;
        const { error } = await supabase
            .from("menu_items")
            .update(editingItem)
            .eq("id", editingItem.id);

        if (error) {
            console.error("Error updating item", error);
            showToast("error", "Failed to update item. Please try again.");
            return;
        }

        showToast("success", `📝 ${editingItem.name} has been updated successfully!`);
        setEditingItem(null);
        setUploadSuccess(false);
        fetchMenuItems();
    };

    const handleDelete = async (id: string) => {
        const item = items.find(i => i.id === id);
        if (!confirm(`Are you sure you want to delete "${item?.name}"? This action cannot be undone.`)) return;

        const { error } = await supabase.from("menu_items").delete().eq("id", id);
        if (error) {
            console.error("Error deleting item", error);
            showToast("error", "Failed to delete item. Please try again.");
            return;
        }

        showToast("success", `🗑️ ${item?.name} has been removed from the menu.`);
        fetchMenuItems();
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, isEditingForm: boolean) => {
        const originalFile = event.target.files?.[0];
        if (!originalFile) return;

        setIsUploading(true);
        setUploadSuccess(false);
        setUploadProgress(0);

        const progressInterval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= 90) return prev;
                return prev + 10;
            });
        }, 300);

        try {
            const file = await compressImage(originalFile);

            const fileExt = (file.name.split(".").pop() || "jpg").toLowerCase();
            const safeExt = fileExt.replace(/[^a-z0-9]/g, "") || "jpg";
            const fileName = `${crypto.randomUUID()}.${safeExt}`;
            const filePath = `menu/${fileName}`;

            // Bucket name: "menu-images" (recommended: Public). If Private, customers will need signed URLs.
            const { error: uploadError } = await supabase.storage
                .from("menu-images")
                .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: true,
                    contentType: file.type || undefined,
                });

            if (uploadError) {
                console.error("Storage upload failed.", uploadError);
                showToast("error", "Image upload failed. Please check your storage settings.");
                clearInterval(progressInterval);
                setIsUploading(false);
                return;
            }

            // Store the storage path (more future-proof than a full URL)
            const storedValue = filePath;
            if (isEditingForm && editingItem) setEditingItem({ ...editingItem, image_url: storedValue });
            else setNewItem({ ...newItem, image_url: storedValue });

            setUploadProgress(100);
            setUploadSuccess(true);
        } catch (error) {
            console.error("Upload error:", error);
            showToast("error", "Failed to upload image. Please try again.");
        } finally {
            clearInterval(progressInterval);
            setIsUploading(false);
            setTimeout(() => {
                setUploadSuccess(false);
                setUploadProgress(0);
            }, 3000);
        }
    };

    // Derived State
    const existingCategories = Array.from(new Set(items.map(i => i.category || "Uncategorized"))).filter(Boolean);

    // Sort and Filter Logic
    const sortedAndFilteredItems = items
        .filter(item => {
            // Don't filter out the item being edited
            if (editingItem && editingItem.id === item.id) return true;
            return filterCategory === "All" || item.category === filterCategory;
        })
        .sort((a, b) => {
            if (sortBy === "Price: Low to High") return a.price - b.price;
            if (sortBy === "Price: High to Low") return b.price - a.price;
            if (sortBy === "Category") return (a.category || "").localeCompare(b.category || "");
            return a.name.localeCompare(b.name);
        });

    if (loading) {
        return (
            <div className="pb-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="h-8 w-40 bg-white/10 rounded animate-pulse" />
                    <div className="h-12 w-40 bg-white/10 rounded-xl animate-pulse" />
                </div>
                <div className="h-16 w-full bg-white/5 rounded-xl border border-white/10 animate-pulse mb-8" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                            <div className="flex gap-3">
                                <div className="w-20 h-20 rounded-xl bg-white/10 animate-pulse" />
                                <div className="flex-1 space-y-3">
                                    <div className="h-4 w-2/3 bg-white/10 rounded animate-pulse" />
                                    <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
                                    <div className="h-3 w-5/6 bg-white/5 rounded animate-pulse" />
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-2">
                                <div className="h-10 bg-white/10 rounded-xl animate-pulse" />
                                <div className="h-10 bg-white/10 rounded-xl animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Manage Menu</h1>
                    {refreshing && <p className="text-white/40 text-sm mt-1">Refreshing changes…</p>}
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-6 py-3 md:py-2.5 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg shadow-[#D4AF37]/20 w-full md:w-auto"
                >
                    <Plus className="w-5 h-5" /> Add New Item
                </button>
            </div>

            {/* Sorting & Filtering Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-2 flex-1">
                    <Filter className="w-4 h-4 text-white/50" />
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="bg-transparent text-white text-sm outline-none cursor-pointer flex-1"
                    >
                        <option value="All" className="bg-[#121212]">All Categories</option>
                        {existingCategories.map(cat => (
                            <option key={cat} value={cat} className="bg-[#121212]">{cat}</option>
                        ))}
                    </select>
                </div>
                <div className="w-px h-6 bg-white/10 hidden sm:block"></div>
                <div className="flex items-center gap-2 flex-1">
                    <ArrowDownUp className="w-4 h-4 text-white/50" />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-transparent text-white text-sm outline-none cursor-pointer flex-1"
                    >
                        <option value="Name" className="bg-[#121212]">Sort by Name</option>
                        <option value="Price: Low to High" className="bg-[#121212]">Price: Low to High</option>
                        <option value="Price: High to Low" className="bg-[#121212]">Price: High to Low</option>
                        <option value="Category" className="bg-[#121212]">Category</option>
                    </select>
                </div>
            </div>

            {isAdding && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="glass-panel p-6 rounded-2xl border border-[#D4AF37]/50 mb-8 space-y-4 shadow-xl"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                        <h3 className="text-xl font-bold text-white">Add New Menu Item</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Name *"
                            value={newItem.name}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                        />

                        {/* Category Dropdown with 'Add New' option */}
                        <div className="flex flex-col gap-2">
                            <select
                                value={showNewCategoryInput ? "+ Add New" : newItem.category || existingCategories[0] || ""}
                                onChange={(e) => {
                                    if (e.target.value === "+ Add New") {
                                        setShowNewCategoryInput(true);
                                        setNewItem({ ...newItem, category: "" });
                                    } else {
                                        setShowNewCategoryInput(false);
                                        setNewItem({ ...newItem, category: e.target.value });
                                    }
                                }}
                                className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] h-full"
                            >
                                <option value="" disabled className="bg-[#121212]">Select Category</option>
                                {existingCategories.map(cat => (
                                    <option key={cat} value={cat} className="bg-[#121212]">{cat}</option>
                                ))}
                                <option value="+ Add New" className="bg-[#121212] text-[#D4AF37] font-bold">+ Add New Category</option>
                            </select>
                            {showNewCategoryInput && (
                                <input
                                    type="text"
                                    placeholder="Enter new category name..."
                                    value={newItem.category}
                                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                    className="bg-black/40 border border-[#D4AF37]/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37] text-sm animate-pulse"
                                    autoFocus
                                />
                            )}
                        </div>

                        <input
                            type="number"
                            placeholder="Price *"
                            value={newItem.price || ""}
                            onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                            className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                        />

                        <select
                            value={newItem.stock_status}
                            onChange={(e) => setNewItem({ ...newItem, stock_status: e.target.value })}
                            className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                        >
                            <option value="Available" className="bg-[#121212]">Available</option>
                            <option value="Sold Out" className="bg-[#121212]">Sold Out</option>
                        </select>

                        <div className="md:col-span-2 lg:col-span-4 flex flex-col md:flex-row gap-4">
                            <textarea
                                placeholder="Description"
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] flex-1 resize-y min-h-[50px]"
                            />

                            {/* Enhanced Image Upload Area */}
                            <div className="flex-1 bg-gradient-to-br from-black/30 to-black/10 border-2 border-dashed border-white/20 rounded-xl p-4 flex flex-col items-center justify-center relative hover:border-[#D4AF37]/50 hover:bg-black/20 transition-all group overflow-hidden min-h-[120px]">
                                {isUploading ? (
                                    <div className="flex flex-col items-center text-[#D4AF37]">
                                        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent animate-spin rounded-full mb-2"></div>
                                        <span className="text-sm font-semibold animate-pulse">Uploading... {uploadProgress}%</span>
                                        <span className="text-xs text-white/50 mt-1">Please wait</span>
                                    </div>
                                ) : uploadSuccess ? (
                                    <div className="flex flex-col items-center text-green-400">
                                        <CheckCircle className="w-8 h-8 mb-2" />
                                        <span className="text-sm font-semibold">Upload Complete!</span>
                                        <span className="text-xs text-white/50 mt-1">Photo saved successfully</span>
                                    </div>
                                ) : (
                                    <>
                                        {newItem.image_url ? (
                                            <div className="absolute inset-0 w-full h-full opacity-40 group-hover:opacity-30 transition">
                                                <Image
                                                    src={getMenuImageSrc(newItem.image_url) || "/images/placeholder.jpg"}
                                                    alt="Preview"
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, 300px"
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : null}
                                        <Upload className="w-8 h-8 text-white/40 mb-2 z-10 group-hover:text-[#D4AF37] transition-colors" />
                                        <span className="text-sm text-white/50 z-10 font-medium group-hover:text-white transition-colors">Click to upload photo</span>
                                        <span className="text-xs text-white/30 z-10 mt-1">JPG, PNG, GIF up to 10MB</span>
                                    </>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(e, false)}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-20"
                                    disabled={isUploading}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 justify-end mt-6 border-t border-white/10 pt-4">
                        <button
                            onClick={() => {
                                setIsAdding(false);
                                setShowNewCategoryInput(false);
                            }}
                            className="px-6 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveNewItem}
                            className="flex items-center justify-center gap-2 bg-[#8B0000] hover:bg-red-800 text-white px-6 py-2 rounded-xl font-bold transition w-full md:w-auto shadow-lg shadow-[#8B0000]/20"
                        >
                            <Save className="w-4 h-4" /> Save Item
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Mobile Responsive List & Desktop Table */}
            <div className="grid grid-cols-1 md:hidden gap-4">
                {/* Mobile Cards */}
                {sortedAndFilteredItems.map((item) => (
                    <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden group">
                        {editingItem?.id === item.id ? (
                            <div className="flex flex-col gap-2">
                                <label className="text-xs text-white/50">Name</label>
                                <input type="text" value={editingItem.name} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} className="bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white w-full mb-1" />

                                <label className="text-xs text-white/50">Category</label>
                                <select value={editingItem.category} onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })} className="bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white w-full mb-1">
                                    {existingCategories.map(cat => (
                                        <option key={cat} value={cat} className="bg-[#121212]">{cat}</option>
                                    ))}
                                </select>

                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <label className="text-xs text-white/50">Price</label>
                                        <input type="number" value={editingItem.price} onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })} className="bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white w-full" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs text-white/50">Status</label>
                                        <select value={editingItem.stock_status} onChange={(e) => setEditingItem({ ...editingItem, stock_status: e.target.value })} className="bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white w-full">
                                            <option value="Available">Available</option>
                                            <option value="Sold Out">Sold Out</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="mt-2 bg-gradient-to-br from-black/40 to-black/20 border-2 border-dashed border-white/20 rounded-xl p-3 text-center relative hover:border-[#D4AF37]/50 hover:bg-black/30 transition-all cursor-pointer group">
                                    {isUploading ? (
                                        <div className="flex flex-col items-center text-[#D4AF37]">
                                            <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent animate-spin rounded-full mb-2"></div>
                                            <span className="text-xs font-semibold animate-pulse">Uploading... {uploadProgress}%</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Camera className="w-5 h-5 text-white/40 mb-1 group-hover:text-[#D4AF37] transition-colors" />
                                            <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors font-medium">Change Photo</span>
                                        </>
                                    )}
                                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isUploading} />
                                </div>

                                <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
                                    <button onClick={() => setEditingItem(null)} className="flex-1 py-2 bg-white/10 text-white/70 rounded-xl hover:bg-white/20 transition font-medium flex items-center justify-center gap-2"><X className="w-4 h-4" /> Cancel</button>
                                    <button onClick={handleSaveEdit} className="flex-1 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-bold flex justify-center items-center gap-2"><Save className="w-4 h-4" /> Save Changes</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex gap-3">
                                    {/* Thumbnail */}
                                    <div className="w-20 h-20 rounded-xl bg-black/40 border border-white/5 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                                        {item.image_url ? (
                                            <Image
                                                src={getMenuImageSrc(item.image_url) || "/images/placeholder.jpg"}
                                                alt={item.name}
                                                fill
                                                sizes="80px"
                                                className="object-cover"
                                            />
                                        ) : (
                                            <ImageIcon className="w-6 h-6 text-white/20" />
                                        )}
                                        <div className={`absolute bottom-0 w-full text-[10px] text-center font-bold py-0.5 ${item.stock_status === 'Available' ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'}`}>
                                            {item.stock_status === 'Available' ? 'IN STOCK' : 'SOLD OUT'}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-bold text-white text-lg truncate">{item.name}</h3>
                                            <span className="text-[#D4AF37] font-bold shrink-0 ml-2">₹{item.price}</span>
                                        </div>
                                        <p className="text-xs text-white/50 bg-black/20 px-2 py-0.5 rounded inline-block mt-1">{item.category}</p>
                                        {item.description && <p className="text-sm text-white/40 mt-1 line-clamp-2 leading-tight">{item.description}</p>}
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                                    <button onClick={() => setEditingItem(item)} className="flex-1 py-2.5 bg-gradient-to-r from-[#D4AF37] to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black rounded-xl transition-all font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/20"><Edit className="w-4 h-4" /> Edit Item</button>
                                    <button onClick={() => handleDelete(item.id)} className="flex-1 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"><Trash2 className="w-4 h-4" /> Delete</button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto bg-black/20 rounded-2xl border border-white/5">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 text-white/50 text-sm bg-black/40">
                            <th className="py-4 px-6 font-medium">Item Details</th>
                            <th className="py-4 px-4 font-medium min-w-[150px]">Category</th>
                            <th className="py-4 px-4 font-medium w-24">Price</th>
                            <th className="py-4 px-4 font-medium w-32">Status</th>
                            <th className="py-4 px-6 text-right font-medium w-48">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAndFilteredItems.map((item) => (
                            <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition group">
                                {editingItem?.id === item.id ? (
                                    <>
                                        <td className="py-4 px-6 relative">
                                            <div className="flex flex-col gap-2">
                                                <input
                                                    type="text"
                                                    value={editingItem.name}
                                                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                                    className="bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white w-full font-medium"
                                                    placeholder="Item name"
                                                />
                                                <textarea
                                                    value={editingItem.description}
                                                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                                                    className="bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white w-full text-sm resize-y min-h-[40px]"
                                                    placeholder="Description (optional)"
                                                    rows={2}
                                                />
                                                <div className="bg-gradient-to-br from-black/40 to-black/20 border-2 border-dashed border-white/20 rounded-lg p-3 flex items-center justify-between text-sm relative hover:border-[#D4AF37]/50 cursor-pointer group transition-all">
                                                    <div className="flex items-center gap-2">
                                                        <Camera className="w-4 h-4 text-white/40 group-hover:text-[#D4AF37] transition-colors" />
                                                        <span className="text-white/50 group-hover:text-white/70 transition-colors">Change Image</span>
                                                    </div>
                                                    {isUploading ? (
                                                        <span className="text-[#D4AF37] animate-pulse text-xs font-semibold">Uploading... {uploadProgress}%</span>
                                                    ) : (
                                                        <span className="text-white/30 text-xs">Click to browse</span>
                                                    )}
                                                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, true)} className="absolute inset-0 opacity-0 cursor-pointer" disabled={isUploading} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 align-top pt-5">
                                            <select
                                                value={editingItem.category}
                                                onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                                                className="bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white w-full"
                                            >
                                                {existingCategories.map(cat => (
                                                    <option key={cat} value={cat} className="bg-[#121212]">{cat}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="py-4 px-4 align-top pt-5">
                                            <input
                                                type="number"
                                                value={editingItem.price}
                                                onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                                                className="bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white w-full text-center font-bold text-[#D4AF37]"
                                            />
                                        </td>
                                        <td className="py-4 px-4 align-top pt-5">
                                            <select
                                                value={editingItem.stock_status}
                                                onChange={(e) => setEditingItem({ ...editingItem, stock_status: e.target.value })}
                                                className="bg-black/60 border border-white/20 rounded-lg px-3 py-2 text-white w-full"
                                            >
                                                <option value="Available">Available</option>
                                                <option value="Sold Out">Sold Out</option>
                                            </select>
                                        </td>
                                        <td className="py-4 px-6 text-right align-top pt-5">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={handleSaveEdit} className="px-3 py-2 bg-green-700/80 text-white rounded-lg hover:bg-green-600 transition flex items-center justify-center font-bold min-w-[80px]">Save</button>
                                                <button onClick={() => setEditingItem(null)} className="px-3 py-2 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition flex items-center justify-center hover:text-white">Cancel</button>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="py-4 px-6 flex items-center gap-4">
                                            {/* Thumbnail */}
                                            <div className="w-14 h-14 rounded-xl bg-black/40 border border-white/5 flex-shrink-0 flex items-center justify-center overflow-hidden relative">
                                                {item.image_url ? (
                                                    <Image
                                                        src={getMenuImageSrc(item.image_url) || "/images/placeholder.jpg"}
                                                        alt={item.name}
                                                        fill
                                                        sizes="56px"
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <ImageIcon className="w-5 h-5 text-white/20" />
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-bold text-white text-lg block">{item.name}</span>
                                                {item.description && <span className="text-white/40 text-sm mt-0.5 line-clamp-1 max-w-sm">{item.description}</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="bg-white/5 text-white/70 px-3 py-1 rounded-lg text-sm">{item.category}</span>
                                        </td>
                                        <td className="py-4 px-4 text-[#D4AF37] font-bold text-lg">₹{item.price}</td>
                                        <td className="py-4 px-4">
                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold inline-block border ${item.stock_status === 'Available' ? 'bg-green-900/20 text-green-400 border-green-500/20' : 'bg-red-900/20 text-red-400 border-red-500/20'}`}>
                                                {item.stock_status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setEditingItem(item)} className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black rounded-lg transition-all font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/20 min-w-[100px]">
                                                    <Edit className="w-4 h-4" /> Edit
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg transition-all font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 min-w-[100px]">
                                                    <Trash2 className="w-4 h-4" /> Delete
                                                </button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {sortedAndFilteredItems.length === 0 && !loading && (
                <div className="text-center text-white/50 py-20 bg-black/10 rounded-2xl border border-white/5 mt-4">
                    <Filter className="w-12 h-12 opacity-20 mx-auto mb-4" />
                    <p>No menu items found. Add some or change filters!</p>
                </div>
            )}
        </div>
    );
}
