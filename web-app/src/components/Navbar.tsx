"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useAppContext } from "@/context/AppContext";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { cart, setIsCartOpen } = useAppContext();

    const links = [
        { name: "Home", href: "/" },
        { name: "Menu", href: "/menu" },
        { name: "About", href: "/about" },
        { name: "Gallery", href: "/gallery" },
        { name: "Contact", href: "/contact" },
    ];

    const toggleOpen = () => setIsOpen(!isOpen);

    return (
        <nav className="fixed w-full z-40 bg-black/80 backdrop-blur-md border-b border-white/10 top-0 left-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    <Link href="/" className="flex items-center gap-2">
                        {/* Minimal logo text, normally this would be an image if provided */}
                        <span className="text-2xl font-bold tracking-widest text-gradient uppercase">
                            Abhiruchi
                        </span>
                    </Link>

                    {/* Desktop */}
                    <div className="hidden md:flex items-center space-x-8">
                        {links.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-white hover:text-[#D4AF37] transition font-medium"
                            >
                                {link.name}
                            </Link>
                        ))}

                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative p-2 text-white hover:text-[#D4AF37] transition"
                        >
                            <ShoppingBag className="w-6 h-6" />
                            {cart.length > 0 && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 bg-[#8B0000] text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full"
                                >
                                    {cart.length}
                                </motion.div>
                            )}
                        </button>
                    </div>

                    <div className="md:hidden flex items-center gap-4">
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative p-2 text-white hover:text-[#D4AF37] transition"
                        >
                            <ShoppingBag className="w-6 h-6" />
                            {cart.length > 0 && (
                                <div className="absolute -top-1 -right-1 bg-[#8B0000] text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                    {cart.length}
                                </div>
                            )}
                        </button>
                        <button
                            onClick={toggleOpen}
                            className="text-white hover:text-[#D4AF37] transition"
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="md:hidden absolute w-full bg-black/95 backdrop-blur-xl border-b border-white/10 flex flex-col items-center py-6 space-y-6 shadow-2xl"
                >
                    {links.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            onClick={toggleOpen}
                            className="text-lg font-medium text-white hover:text-[#D4AF37]"
                        >
                            {link.name}
                        </Link>
                    ))}
                </motion.div>
            )}
        </nav>
    );
}
