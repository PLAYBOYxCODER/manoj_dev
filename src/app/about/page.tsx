"use client";

import { motion } from "framer-motion";
import { businessIdentity, pageDetails } from "@/data/business";
import { CheckCircle } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-transparent pt-32 pb-20 px-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[#121212]/80 backdrop-blur-md -z-10" />
            {/* Background Ornaments */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#D4AF37]/5 rounded-full blur-[150px] -z-10" />
            <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-[#8B0000]/10 rounded-full blur-[150px] -z-10" />

            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-24"
                >
                    <div className="inline-flex px-4 py-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] text-sm uppercase tracking-widest font-semibold mb-6">
                        ESTD {businessIdentity.yearOfEstablishment}
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                        {pageDetails.about.title}
                    </h1>
                    <p className="text-[#D4AF37] text-xl font-medium tracking-wide italic">
                        "{pageDetails.about.tagline}"
                    </p>
                    <div className="w-24 h-1 bg-[#8B0000] mx-auto mt-8" />
                </motion.div>

                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-6 text-white/80 font-light leading-relaxed text-lg"
                    >
                        {pageDetails.about.content.split('\n').map((para, i) => (
                            <p key={i}>{para}</p>
                        ))}

                        <div className="pt-8 border-t border-white/10 mt-8 grid grid-cols-2 gap-6">
                            {[
                                "100% Traditional Recipe",
                                "Premium Spices & Grains",
                                "Hygiene & Quality Standard",
                                "Passionate Chefs"
                            ].map((val, idx) => (
                                <div key={idx} className="flex gap-3 items-center">
                                    <CheckCircle className="text-[#8B0000] w-5 h-5 flex-shrink-0" />
                                    <span className="font-medium text-white tracking-wide">{val}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-2 gap-4 h-[600px] relative group"
                    >
                        <div className="flex flex-col gap-4 h-full">
                            <div className="flex-[2] rounded-3xl overflow-hidden glass-panel border border-white/10 hover:border-[#D4AF37]/30 transition duration-500">
                                <img src="/imagees/ambiance.jpg.jpeg" alt="Our Heritage" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                            </div>
                            <div className="flex-[1] rounded-3xl overflow-hidden glass-panel border border-white/10 hover:border-[#D4AF37]/30 transition duration-500 bg-[#8B0000]/10 flex items-center justify-center p-6 text-center">
                                <p className="text-[#D4AF37] font-bold text-xl leading-tight uppercase tracking-widest">
                                    Quality <br />
                                    <span className="text-white text-sm font-bold uppercase tracking-widest block mt-2">Guaranteed</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 h-full">
                            <div className="flex-[1] rounded-3xl overflow-hidden glass-panel border border-white/10 hover:border-[#D4AF37]/30 transition duration-500 bg-[#8B0000]/10 flex items-center justify-center p-6 text-center">
                                <p className="text-white font-bold text-4xl leading-tight tracking-widest">
                                    2018 <br />
                                    <span className="text-sm font-bold uppercase tracking-widest block mt-2">Established</span>
                                </p>
                            </div>
                            <div className="flex-[2] rounded-3xl overflow-hidden glass-panel border border-white/10 hover:border-[#D4AF37]/30 transition duration-500">
                                <img src="/imagees/happy%20customers.jpg.jpeg" alt="Our Chefs" className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                            </div>
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-32 text-center"
                >
                    <div className="glass-panel max-w-2xl mx-auto py-12 px-8 rounded-3xl border border-white/10 shadow-2xl relative">
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#8B0000] rounded-full border-4 border-[#121212] flex items-center justify-center text-[#D4AF37] font-bold text-2xl">
                            "
                        </div>
                        <p className="text-2xl font-bold text-white leading-relaxed mb-6 font-sans">
                            {businessIdentity.shortDescription}
                        </p>
                        <p className="text-[#D4AF37] uppercase tracking-widest text-sm font-bold">
                            {pageDetails.about.finishingLine}
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
