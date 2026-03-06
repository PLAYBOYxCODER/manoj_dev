"use client";

import { motion } from "framer-motion";
import { businessIdentity, pageDetails } from "@/data/business";
import Link from "next/link";
import { ArrowRight, ChevronDown, CheckCircle } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden">
        {/* Abstract Dark Red Background blending smoothly */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#121212] -z-10" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#8B0000]/20 to-[#D4AF37]/5 -z-10 blur-3xl opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#8B0000]/10 rounded-full blur-[120px] -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center px-6 max-w-4xl"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-6 inline-flex px-4 py-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37] text-sm uppercase tracking-widest font-semibold"
          >
            {businessIdentity.yearOfEstablishment} Experience
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white leading-tight">
            Welcome to the <br />
            <span className="text-gradient">Royal World of Flavors</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 mb-10 leading-relaxed font-light">
            {businessIdentity.tagline}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/menu"
              className="px-8 py-4 bg-gradient-to-r from-[#8B0000] to-red-900 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-[#8B0000]/30 transition flex items-center justify-center gap-2 group"
            >
              Explore Menu
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition flex items-center justify-center"
            >
              Our Story
            </Link>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute bottom-10 text-white/30"
        >
          <ChevronDown className="w-8 h-8" />
        </motion.div>
      </section>

      {/* About Section */}
      <section className="py-24 bg-transparent relative">
        <div className="absolute inset-0 bg-[#121212]/80 backdrop-blur-md -z-10" />
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative h-[500px] rounded-2xl overflow-hidden glass-panel border border-[#D4AF37]/20 flex items-center justify-center bg-[#1a1a1a]"
          >
            <img src="/imagees/Premium%20Biryani.png" alt="Premium Biryani" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
            <span className="absolute transform -rotate-90 left-0 top-1/2 -translate-y-1/2 text-center text-4xl block font-bold text-white/10 tracking-widest uppercase">Tradition</span>
            <div className="absolute bottom-6 left-6 z-20">
              <p className="text-2xl font-bold text-white mb-2 tracking-wider">Premium Biryani</p>
              <div className="w-12 h-1 bg-[#D4AF37]" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6 text-white">
              {pageDetails.home.title}
            </h2>
            <p className="text-[#D4AF37] font-medium text-lg mb-6 block uppercase tracking-wide">
              {pageDetails.home.tagline}
            </p>
            <div className="text-white/70 space-y-4 font-light leading-relaxed mb-8">
              {pageDetails.home.content.split('\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {['Signature Mandi', 'Premium Ingredients', 'Authentic Taste', 'Royal Dine-in'].map((feature, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-[#8B0000]" />
                  <span className="text-white/80 text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="py-12 border-t border-white/10 bg-[#0a0a0a] text-center">
        <p className="text-white/40 italic font-light tracking-wide">
          "{pageDetails.home.finishingLine}"
        </p>
      </footer>
    </div>
  );
}
