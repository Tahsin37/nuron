"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, SparklesIcon } from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { fadeUp, staggerContainer } from "@/lib/animations";

function FilledCheck() {
  return (
    <div className="bg-white/10 text-white rounded-full p-0.5 border border-white/10">
      <CheckIcon className="size-3" strokeWidth={3} />
    </div>
  );
}

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 lg:py-32 px-6 bg-black border-t border-white/5">
      <div className="mx-auto max-w-5xl">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="mx-auto mb-16 max-w-2xl text-center space-y-4">
          <Badge variant="outline" className="mb-2 inline-flex items-center gap-2 rounded-full border-white/10 bg-white/5 px-4 py-1.5 text-[10px] uppercase tracking-widest text-zinc-300 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
            <SparklesIcon className="h-3 w-3" /> Pricing
          </Badge>
          <h2 className="text-4xl font-semibold tracking-tighter lg:text-5xl text-white">Simple, Transparent Pricing</h2>
          <p className="text-zinc-400 mt-4 text-base md:text-lg">Free during launch. No credit card required. Build your AI employee today.</p>
        </motion.div>

        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-8">
          
          {/* Featured Plan */}
          <motion.div variants={fadeUp} className="lg:col-span-5 h-full">
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black transition-all duration-300 hover:border-white/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] h-full p-[1px]">
              {/* Premium Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-100" />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              
              <div className="relative z-10 h-full rounded-2xl bg-black/40 backdrop-blur-xl p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-8">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-white border border-white/10 bg-white/5 px-3 py-1 rounded-full">GROWTH</span>
                    <span className="hidden lg:flex text-[10px] font-medium tracking-widest text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 rounded-full uppercase items-center gap-1">
                      <SparklesIcon className="size-3" /> Most Popular
                    </span>
                    <div className="ml-auto">
                      <span className="text-[10px] font-medium uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">FREE DURING LAUNCH</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col lg:flex-row gap-8">
                    <div className="lg:w-[35%]">
                      <div className="flex items-end gap-2 mb-2">
                        <span className="font-mono text-5xl font-semibold tracking-tighter line-through text-zinc-600">$29</span>
                        <span className="text-4xl font-semibold tracking-tighter text-emerald-400">$0</span>
                      </div>
                      <div className="text-zinc-500 text-xs font-medium tracking-wide uppercase">/month during beta</div>
                    </div>
                    
                    <ul className="text-zinc-400 grid gap-4 text-sm lg:w-[65%]">
                      {["5 AI agents with full personality control", "Unlimited conversations & lead capture", "Website URL + PDF + text training", "Embed widget with brand customization", "Real-time analytics dashboard", "Google Sheets integration"].map((f, i) => (
                        <li key={i} className="flex items-center gap-3"><FilledCheck /><span className="leading-relaxed text-zinc-300 font-medium">{f}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Starter */}
          <motion.div variants={fadeUp} className="lg:col-span-3 h-full">
            <GlassCard className="p-8 flex flex-col h-full" spotlight={false}>
              <div className="flex items-center gap-3 mb-8">
                <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 border border-white/10 bg-white/5 px-3 py-1 rounded-full">STARTER</span>
                <div className="ml-auto">
                  <Button variant="outline" size="sm" className="h-7 text-[10px] tracking-widest uppercase bg-transparent border-white/10 text-white hover:bg-white/5 hover:text-white rounded-full px-3">Get Started</Button>
                </div>
              </div>
              <div className="flex items-end gap-2 mb-8">
                <span className="font-mono text-4xl font-semibold tracking-tighter text-white">Free</span>
              </div>
              <ul className="text-zinc-400 grid gap-4 text-sm flex-1">
                {["1 AI agent", "100 conversations/month", "Basic training (text only)", "Standard embed widget"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3"><FilledCheck /><span className="text-zinc-300">{f}</span></li>
                ))}
              </ul>
            </GlassCard>
          </motion.div>

          {/* Teams */}
          <motion.div variants={fadeUp} className="lg:col-span-4 h-full">
            <GlassCard className="p-8 h-full flex flex-col" spotlight={false}>
              <div className="flex items-center gap-3 mb-8">
                <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 border border-white/10 bg-white/5 px-3 py-1 rounded-full">TEAMS</span>
                <div className="ml-auto">
                  <span className="text-[10px] font-medium uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">FREE</span>
                </div>
              </div>
              <div className="flex items-end gap-2 mb-8">
                <span className="font-mono text-4xl font-semibold tracking-tighter line-through text-zinc-600">$49</span>
                <span className="text-3xl font-semibold tracking-tighter text-emerald-400">$0</span>
              </div>
              <ul className="text-zinc-400 grid gap-4 text-sm">
                {["10 AI agents with team collaboration", "Priority support & custom integrations", "Advanced analytics & export"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3"><FilledCheck /><span className="text-zinc-300">{f}</span></li>
                ))}
              </ul>
            </GlassCard>
          </motion.div>

          {/* Enterprise */}
          <motion.div variants={fadeUp} className="lg:col-span-4 h-full">
            <GlassCard className="p-8 h-full flex flex-col" spotlight={false}>
              <div className="flex items-center gap-3 mb-8">
                <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-400 border border-white/10 bg-white/5 px-3 py-1 rounded-full">ENTERPRISE</span>
                <div className="ml-auto">
                  <Button variant="outline" size="sm" className="h-7 text-[10px] tracking-widest uppercase bg-white text-black hover:bg-zinc-200 hover:text-black rounded-full px-3 border-transparent">Contact Us</Button>
                </div>
              </div>
              <div className="flex items-end gap-2 mb-8">
                <span className="font-mono text-4xl font-semibold tracking-tighter text-white">Custom</span>
              </div>
              <ul className="text-zinc-400 grid gap-4 text-sm">
                {["Unlimited AI agents & conversations", "White-label widget & API access", "Dedicated account management"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3"><FilledCheck /><span className="text-zinc-300">{f}</span></li>
                ))}
              </ul>
            </GlassCard>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
