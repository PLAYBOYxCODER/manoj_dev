"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { pageDetails } from "@/data/business";
import { supabase } from "@/lib/supabase";
import { MapPin, Phone, Mail, Clock, Map, CheckCircle, AlertCircle } from "lucide-react";

export default function ContactPage() {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async () => {
        if (!name || !phone || !message) {
            setError("Please fill in all fields.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error: pbError } = await supabase
                .from('feedback')
                .insert([{ customer_name: name, phone_number: phone, message }]);

            if (pbError) throw pbError;

            setSuccess(true);
            setName("");
            setPhone("");
            setMessage("");
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error("Feedback error:", err);
            setError(err.message || "Failed to submit feedback. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="min-h-screen bg-transparent pt-32 pb-20 px-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[#121212]/80 backdrop-blur-md -z-10" />
            {/* Background Decor */}
            <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[#8B0000]/5 rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[120px] -z-10" />

            <div className="max-w-6xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
                        {pageDetails.contact.title}
                    </h1>
                    <p className="text-[#D4AF37] text-lg font-medium tracking-wide">
                        "{pageDetails.contact.tagline}"
                    </p>
                    <div className="w-16 h-1 bg-[#8B0000] mx-auto mt-6" />
                </motion.div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Contact Details */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-panel p-10 rounded-3xl border border-white/10"
                    >
                        <h2 className="text-2xl font-bold text-white mb-8 border-b border-white/10 pb-4">
                            Get in Touch
                        </h2>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4 text-white/80 hover:text-white transition">
                                <MapPin className="text-[#8B0000] w-6 h-6 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Our Location</h3>
                                    <p className="font-light leading-relaxed">Abhiruchi Restaurant's, Chepurupalli, Vizianagaram District, Andhra Pradesh, India</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 text-white/80 hover:text-white transition">
                                <Phone className="text-[#8B0000] w-6 h-6 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Phone & WhatsApp</h3>
                                    <p className="font-light">0987644621</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 text-white/80 hover:text-white transition">
                                <Mail className="text-[#8B0000] w-6 h-6 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Email Address</h3>
                                    <p className="font-light">abhiruchirestaurants@gmail.com</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 text-white/80 hover:text-white transition">
                                <Clock className="text-[#8B0000] w-6 h-6 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-lg mb-1">Opening Hours</h3>
                                    <p className="font-light">Mon-Sun: 11:00 AM - 11:00 PM</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-white/10 text-center text-white/50 italic text-sm">
                            "{pageDetails.contact.finishingLine}"
                        </div>
                    </motion.div>

                    {/* Contact Form / Map */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col gap-6"
                    >
                        <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 h-64 flex items-center justify-center relative group">
                            <Map className="w-16 h-16 text-white/10 group-hover:scale-110 transition duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 flex items-end justify-center pb-6">
                                <a
                                    href="https://maps.google.com/?q=Chepurupalli+Vizianagaram"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-6 py-3 bg-[#D4AF37] hover:bg-[#b09030] text-black font-bold rounded-xl transition flex items-center gap-2"
                                >
                                    <MapPin className="w-4 h-4" /> Open in Google Maps
                                </a>
                            </div>
                        </div>

                        <div className="glass-panel p-8 rounded-3xl border border-white/10 flex-1 flex flex-col justify-center">
                            <h3 className="text-xl font-bold text-white mb-6">Send us a message</h3>
                            {success ? (
                                <div className="bg-green-900/20 text-green-200 p-6 rounded-xl border border-green-500/30 text-center flex flex-col items-center">
                                    <CheckCircle className="w-12 h-12 text-green-400 mb-2" />
                                    <p className="font-bold">Thank you for your feedback!</p>
                                    <p className="text-sm opacity-80 mt-1">We will get back to you soon.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Your Name"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition font-light"
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Your Phone Number"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition font-light"
                                    />
                                    <textarea
                                        placeholder="Your Message..."
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37] transition font-light min-h-[100px] resize-y"
                                    />

                                    {error && (
                                        <div className="bg-red-900/20 text-red-200 p-3 rounded-xl border border-red-500/30 text-sm flex items-center gap-2">
                                            <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="w-full py-3 bg-gradient-to-r from-[#8B0000] to-red-900 text-white font-bold rounded-xl hover:from-red-900 hover:to-[#8B0000] transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                                    >
                                        {loading ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                                        ) : (
                                            "Submit Feedback"
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
