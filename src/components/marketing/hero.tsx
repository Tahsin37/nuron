"use client";
import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ArrowRight, Bot, Sparkles, TrendingUp, Shield } from "lucide-react";
import LeadsTableCard from "@/components/ui/leads-table-card";
import { Particles } from "@/components/ui/particles";
import { fadeUp, fadeUpDelayed, scaleUp, staggerContainer } from "@/lib/animations";

export function HeroSection() {
  const stats = [
    { label: "Products in Brain", value: "248", delta: "+12" },
    { label: "Messenger Chats", value: "1,847", delta: "+24%" },
    { label: "Leads Captured", value: "342", delta: "+18%" },
    { label: "Human Fallbacks", value: "12", delta: "-5%" },
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background glow and lines */}
      <div className="absolute inset-0 pointer-events-none [background:radial-gradient(100%_60%_at_50%_0%,rgba(255,255,255,0.03),transparent_50%)]" />
      <div className="accent-lines"><div className="hline" /><div className="hline" /><div className="hline" /><div className="vline" /><div className="vline" /><div className="vline" /></div>
      <Particles />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-32 text-center">
        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-8">
          
          <motion.div variants={scaleUp} className="flex justify-center">
            <Badge variant="outline" className="inline-flex items-center gap-2 rounded-full border-white/10 bg-white/5 px-4 py-1.5 text-[10px] uppercase tracking-widest text-zinc-300 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
              <Sparkles className="h-3 w-3" /> Now in Open Beta — Free to Use
            </Badge>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-semibold tracking-tighter leading-[0.95]">
            <span className="text-white">Sell on Messenger</span><br />
            <span className="gradient-text">While You Sleep</span>
          </motion.h1>

          <motion.p variants={fadeUpDelayed} className="mx-auto max-w-2xl text-lg md:text-xl text-zinc-400 leading-relaxed font-medium">
            Stop answering "price?", "delivery?", and "size?" manually. Build a product knowledge brain and let AI automate your inbox, capture leads, and escalate to you when needed.
          </motion.p>

          <motion.div variants={fadeUpDelayed} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/signup">
              <Button size="lg" className="h-12 px-8 rounded-lg bg-white text-black hover:bg-zinc-200 active:scale-[0.98] transition-all text-base font-semibold shadow-[0_0_40px_rgba(255,255,255,0.15)]">
                Automate Your Inbox <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="h-12 px-8 rounded-lg border-white/10 bg-transparent hover:bg-white/5 active:scale-[0.98] transition-all text-white text-base font-medium">
                See How It Works
              </Button>
            </a>
          </motion.div>

          <motion.div variants={fadeUpDelayed} className="flex flex-wrap items-center justify-center gap-6 pt-10 text-xs font-medium text-zinc-500 uppercase tracking-widest">
            <div className="flex items-center gap-2"><Shield className="h-3.5 w-3.5" /><span>Enterprise-grade</span></div>
            <div className="flex items-center gap-2"><Bot className="h-3.5 w-3.5" /><span>GPT-4o powered</span></div>
            <div className="flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5" /><span>36% avg. conversion lift</span></div>
          </motion.div>
        </motion.div>

        {/* Dashboard Mockup + Leads Table */}
        <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 1, ease: [0.16, 1, 0.3, 1] }} className="mt-20 mx-auto max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Dashboard Preview */}
            <div className="lg:col-span-7">
              <div className="relative rounded-2xl border border-white/10 bg-black backdrop-blur-2xl p-1 shadow-[0_20px_60px_-15px_rgba(0,0,0,1),inset_0_1px_0_0_rgba(255,255,255,0.1)] h-full transition-all duration-300 hover:border-white/20">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
                    <div className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
                    <div className="h-2.5 w-2.5 rounded-full bg-zinc-800" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="h-6 w-52 rounded-md bg-white/5 flex items-center justify-center text-[10px] text-zinc-500 font-medium">app.nuronai.com/dashboard</div>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    {stats.map((s) => (
                      <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.02] p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-medium">{s.label}</div>
                        <div className="mt-2 flex items-end gap-2">
                          <span className="text-2xl font-bold tracking-tight text-white">{s.value}</span>
                          <span className="text-xs text-emerald-400 mb-1 font-medium">{s.delta}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1.5 items-end h-20">
                    {Array.from({ length: 24 }, (_, i) => (
                      <div 
                        key={i} 
                        className="flex-1 rounded-t-sm bg-gradient-to-t from-white/10 to-white/5" 
                        style={{ 
                          height: `${20 + Math.sin(i * 0.5) * 40 + 30}%`, 
                          opacity: 0.4 + Math.sin(i * 0.3) * 0.3 + 0.3 
                        }} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Leads Table */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-white/10 bg-black shadow-[0_20px_60px_-15px_rgba(0,0,0,1),inset_0_1px_0_0_rgba(255,255,255,0.1)] h-full overflow-hidden transition-all duration-300 hover:border-white/20">
                <LeadsTableCard className="h-full border-none shadow-none rounded-none bg-transparent" />
              </div>
            </div>
            
          </div>
        </motion.div>
      </div>
    </section>
  );
}
