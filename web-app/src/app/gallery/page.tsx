"use client";

import { motion } from "framer-motion";
import { pageDetails } from "@/data/business";
import { Image as ImageIcon } from "lucide-react";

export default function GalleryPage() {
    // Simulating gallery images loaded dynamically
    const galleryImages = [
        { src: "https://source.unsplash.com/800x600/?restaurant-interior", title: "Royal Ambiance" },
        { src: "https://source.unsplash.com/800x600/?biryani", title: "Signature Biryani" },
        { src: "https://source.unsplash.com/800x600/?mandi-rice", title: "Authentic Mandi" },
        { src: "https://source.unsplash.com/800x600/?spices", title: "Fresh Spices" },
        { src: "https://source.unsplash.com/800x600/?fine-dining-people", title: "Happy Customers" },
        { src: "https://source.unsplash.com/800x600/?indian-curry", title: "Rich Curries" },
    ];

    return (
        <div className="min-h-screen bg-transparent pt-32 pb-20 px-6 relative">
            <div className="absolute inset-0 bg-[#121212]/80 backdrop-blur-md -z-10" />
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
                        {pageDetails.gallery.title}
                    </h1>
                    <p className="text-[#D4AF37] text-lg font-medium tracking-wide">
                        "{pageDetails.gallery.tagline}"
                    </p>
                    <div className="w-16 h-1 bg-[#8B0000] mx-auto mt-6" />
                </motion.div>

                <div className="text-center text-white/70 max-w-3xl mx-auto font-light leading-relaxed mb-16">
                    {pageDetails.gallery.content}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {galleryImages.map((img, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="relative group rounded-3xl overflow-hidden aspect-[4/3] glass-panel border border-white/5"
                        >
                            <img src={img.src} alt={img.title} className="w-full h-full object-cover transition duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end opacity-0 group-hover:opacity-100 transition duration-500 pb-8 px-6">
                                <div>
                                    <ImageIcon className="text-[#D4AF37] mb-2" />
                                    <h3 className="text-2xl font-bold text-white tracking-widest uppercase">{img.title}</h3>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <p className="text-[#D4AF37] italic font-light tracking-wide text-lg">
                        "{pageDetails.gallery.finishingLine}"
                    </p>
                </div>
            </div>
        </div>
    );
}
