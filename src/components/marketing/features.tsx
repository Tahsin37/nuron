"use client";
import React from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Bot, MessageSquare, BarChart3, Brain, Globe, FileText, Users, Zap, ArrowUpRight } from "lucide-react";
import { fadeUp, staggerContainer } from "@/lib/animations";

const features = [
  { icon: MessageSquare, title: "Facebook & Messenger", desc: "Automate your Facebook Page inbox. Instantly reply to customers 24/7." },
  { icon: Bot, title: "Product Brain", desc: "Add products, price, stock, and delivery info. The AI answers questions based on your brain." },
  { icon: Brain, title: "Human Fallback", desc: "If the AI is unsure, it escalates to you. You jump into the dashboard and reply manually." },
  { icon: Users, title: "Lead Capture", desc: "Detect buying intent and capture customer details for hot leads automatically." },
  { icon: Globe, title: "Bangla & Banglish", desc: "Understands and replies in natural Bangla and Banglish, just like a real seller." },
  { icon: BarChart3, title: "Actionable Insights", desc: "Track hot leads, common questions, and see which products are trending in your inbox." },
];

const metrics = [
  { label: "Products Learned", value: "248", delta: "avg.", description: "per seller brain" },
  { label: "Messages Handled", value: "1.2M+", delta: "total", description: "conversations automated" },
  { label: "Leads Captured", value: "340k+", delta: "+210%", description: "qualified prospects" },
  { label: "Human Escalations", value: "4%", delta: "-96%", description: "needs manual reply" },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 lg:py-32 px-6 bg-black border-t border-white/5">
      <div className="mx-auto max-w-6xl space-y-32">
        {/* Features Grid */}
        <div className="space-y-16">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-6 inline-flex items-center gap-2 rounded-full border-white/10 bg-white/5 px-4 py-1.5 text-[10px] uppercase tracking-widest text-zinc-300 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
              <Zap className="h-3 w-3" /> Platform Features
            </Badge>
            <h2 className="text-4xl font-semibold tracking-tighter md:text-5xl text-white">Everything you need to sell on Messenger</h2>
            <p className="mt-5 text-base leading-relaxed text-zinc-400 md:text-lg">From building a product database to automating your Facebook inbox — one platform to scale your sales.</p>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <motion.div key={f.title} variants={fadeUp}>
                <GlassCard className="h-full">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white mb-6">
                    <f.icon className="h-5 w-5 text-zinc-300" />
                  </div>
                  <h3 className="text-lg font-medium tracking-tight text-white mb-2">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-400">{f.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Metrics Section */}
        <div className="space-y-16">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-6 inline-flex items-center gap-2 rounded-full border-white/10 bg-white/5 px-4 py-1.5 text-[10px] uppercase tracking-widest text-zinc-300 backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
              <BarChart3 className="h-3 w-3" /> Realtime Insights
            </Badge>
            <h2 className="text-4xl font-semibold tracking-tighter md:text-5xl text-white">Real results from real sellers</h2>
            <p className="mt-5 text-base leading-relaxed text-zinc-400 md:text-lg">See how social commerce businesses are saving time and increasing conversions.</p>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="grid gap-4 md:grid-cols-2">
            {metrics.map((m) => (
              <motion.div key={m.label} variants={fadeUp}>
                <GlassCard className="group relative transition-transform duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between mb-8">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">{m.label}</span>
                    <ArrowUpRight className="h-4 w-4 text-zinc-600 transition-transform duration-300 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                  <div className="flex items-end gap-3 mb-2">
                    <span className="text-5xl font-semibold tracking-tighter text-white">{m.value}</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-widest text-zinc-400 mb-1">{m.delta}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-500">{m.description}</p>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* How It Works */}
        <div className="grid items-center gap-12 md:grid-cols-2 lg:grid-cols-5 lg:gap-24 pt-16">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="lg:col-span-2">
            <h2 className="text-4xl font-semibold tracking-tighter lg:text-5xl text-white">Built for Facebook Sellers</h2>
            <p className="mt-6 text-zinc-400 leading-relaxed">Stop drowning in your inbox. Add your products to Nuron AI, and let the AI handle the repetitive "price?", "delivery?", and "size?" questions. Step in only when the customer is ready to buy or needs special help.</p>
            <ul className="mt-8 divide-y divide-white/5 border-y border-white/5 *:flex *:items-center *:gap-4 *:py-4 text-sm text-zinc-300 font-medium">
              <li><FileText className="size-5 text-zinc-500" /> Easy product knowledge management</li>
              <li><Zap className="size-5 text-zinc-500" /> Instant replies in Messenger</li>
              <li><Users className="size-5 text-zinc-500" /> Smart human fallback system</li>
              <li><Globe className="size-5 text-zinc-500" /> Native Banglish understanding</li>
            </ul>
          </motion.div>
          
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="lg:col-span-3">
            <div className="relative rounded-2xl border border-white/10 bg-black shadow-[0_20px_60px_-15px_rgba(0,0,0,1),inset_0_1px_0_0_rgba(255,255,255,0.1)] p-6 space-y-5">
              {/* Chat mockup */}
              <div className="space-y-4">
                <div className="flex gap-3"><div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center shadow-inner"><Bot className="h-4 w-4 text-zinc-400" /></div><div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/5 px-4 py-3 max-w-xs text-[13px] text-zinc-300">Hi there! 👋 How can I help you today?</div></div>
                <div className="flex gap-3 justify-end"><div className="rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-3 max-w-xs text-[13px] text-white shadow-lg shadow-blue-900/20">bhai black t-shirt er price koto?</div></div>
                <div className="flex gap-3"><div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center shadow-inner"><Bot className="h-4 w-4 text-zinc-400" /></div><div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/5 px-4 py-3 max-w-xs text-[13px] text-zinc-300">Black t-shirt er price 450 Taka. Delivery charge inside Dhaka 60 Tk, outside 120 Tk. Order confirm korben?</div></div>
                <div className="flex gap-3 justify-end"><div className="rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-3 max-w-xs text-[13px] text-white shadow-lg shadow-blue-900/20">ha, cash on delivery hobe?</div></div>
                <div className="flex gap-3"><div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center shadow-inner"><Bot className="h-4 w-4 text-zinc-400" /></div><div className="rounded-2xl rounded-tl-sm bg-white/5 border border-white/5 px-4 py-3 max-w-xs text-[13px] text-zinc-300">Ji, Cash on Delivery available! Apnar nam, phone number r address ta din order confirm korar jonno.</div></div>
              </div>
              <div className="flex gap-3 mt-6"><div className="flex-1 h-10 rounded-lg bg-white/5 border border-white/10" /><div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center shadow-md shadow-white/10"><ArrowUpRight className="h-4 w-4 text-black" /></div></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
