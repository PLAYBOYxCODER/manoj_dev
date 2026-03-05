"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";

type MenuItem = {
    id: string;
    name: string;
    description: string;
    price: number;
    discount: number;
    stock_status: string;
    category: string;
    is_active: boolean;
};

export default function MenuManager() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [newItem, setNewItem] = useState<Partial<MenuItem>>({
        name: "",
        description: "",
        price: 0,
        discount: 0,
        stock_status: "Available",
        category: "Main Course",
        is_active: true
    });
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchMenuItems();
    }, []);

    const fetchMenuItems = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("menu_items")
            .select("*")
            .order("category", { ascending: true })
            .order("name", { ascending: true });

        if (data) setItems(data);
        setLoading(false);
    };

    const handleSaveNewItem = async () => {
        if (!newItem.name || !newItem.price) {
            alert("Name and price are required.");
            return;
        }

        const { error } = await supabase.from("menu_items").insert([newItem]);
        if (error) {
            console.error("Error creating item", error);
            alert("Failed to create item.");
            return;
        }

        setIsAdding(false);
        setNewItem({
            name: "",
            description: "",
            price: 0,
            discount: 0,
            stock_status: "Available",
            category: "Main Course",
            is_active: true
        });
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
            alert("Failed to update item.");
            return;
        }

        setEditingItem(null);
        fetchMenuItems();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this item?")) return;
        const { error } = await supabase.from("menu_items").delete().eq("id", id);
        if (error) {
            console.error("Error deleting item", error);
            alert("Failed to delete item.");
            return;
        }
        fetchMenuItems();
    };

    if (loading) {
        return <div className="text-white/50 text-center py-20 animate-pulse">Loading Menu Items...</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Manage Menu</h1>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-[#D4AF37] hover:bg-yellow-600 text-black px-4 py-2 rounded-xl font-bold transition"
                >
                    <Plus className="w-5 h-5" /> Add New Item
                </button>
            </div>

            {isAdding && (
                <div className="glass-panel p-6 rounded-2xl border border-[#D4AF37]/50 mb-8 space-y-4">
                    <h3 className="text-xl font-bold text-white mb-4">Add Menu Item</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Name *"
                            value={newItem.name}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                        <input
                            type="text"
                            placeholder="Category *"
                            value={newItem.category}
                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                            className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                        <input
                            type="number"
                            placeholder="Price *"
                            value={newItem.price || ""}
                            onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) })}
                            className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                        <select
                            value={newItem.stock_status}
                            onChange={(e) => setNewItem({ ...newItem, stock_status: e.target.value })}
                            className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37]"
                        >
                            <option value="Available">Available</option>
                            <option value="Sold Out">Sold Out</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Description"
                            value={newItem.description}
                            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                            className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#D4AF37] md:col-span-2 lg:col-span-4"
                        />
                    </div>
                    <div className="flex gap-4 justify-end mt-4">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="px-4 py-2 text-white/70 hover:text-white transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveNewItem}
                            className="flex items-center gap-2 bg-[#8B0000] hover:bg-red-800 text-white px-4 py-2 rounded-xl font-bold transition"
                        >
                            <Save className="w-4 h-4" /> Save Item
                        </button>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/10 text-white/50 text-sm">
                            <th className="pb-3 px-4">Name</th>
                            <th className="pb-3 px-4">Category</th>
                            <th className="pb-3 px-4">Price</th>
                            <th className="pb-3 px-4">Status</th>
                            <th className="pb-3 px-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition group">
                                {editingItem?.id === item.id ? (
                                    <>
                                        <td className="py-3 px-4">
                                            <input
                                                type="text"
                                                value={editingItem.name}
                                                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                                className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white w-full"
                                            />
                                        </td>
                                        <td className="py-3 px-4">
                                            <input
                                                type="text"
                                                value={editingItem.category}
                                                onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                                                className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white w-full"
                                            />
                                        </td>
                                        <td className="py-3 px-4">
                                            <input
                                                type="number"
                                                value={editingItem.price}
                                                onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                                                className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white w-20"
                                            />
                                        </td>
                                        <td className="py-3 px-4">
                                            <select
                                                value={editingItem.stock_status}
                                                onChange={(e) => setEditingItem({ ...editingItem, stock_status: e.target.value })}
                                                className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-white"
                                            >
                                                <option value="Available">Available</option>
                                                <option value="Sold Out">Sold Out</option>
                                            </select>
                                        </td>
                                        <td className="py-3 px-4 text-right flex justify-end gap-2">
                                            <button onClick={handleSaveEdit} className="p-2 bg-green-900/40 text-green-400 rounded hover:bg-green-900/60 transition"><Save className="w-4 h-4" /></button>
                                            <button onClick={() => setEditingItem(null)} className="p-2 bg-white/10 text-white/70 rounded hover:bg-white/20 transition"><X className="w-4 h-4" /></button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="py-4 px-4 font-medium text-white">
                                            {item.name}
                                            {item.description && <p className="text-white/40 text-xs mt-1 truncate max-w-xs">{item.description}</p>}
                                        </td>
                                        <td className="py-4 px-4 text-white/70">{item.category}</td>
                                        <td className="py-4 px-4 text-[#D4AF37] font-bold">₹{item.price}</td>
                                        <td className="py-4 px-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.stock_status === 'Available' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                                {item.stock_status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                                                <button onClick={() => setEditingItem(item)} className="p-2 bg-white/5 text-white/70 rounded hover:text-white hover:bg-white/10 transition"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-900/20 text-red-400 rounded hover:bg-red-900/40 transition"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {items.length === 0 && (
                    <div className="text-center text-white/50 py-10">No menu items found. Add some!</div>
                )}
            </div>
        </div>
    );
}
