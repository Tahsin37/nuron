"use client";
import React from "react";
import { motion, type Variants } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, MessageSquare, BarChart3, Brain, Globe, FileText, Users, Zap, ArrowUpRight } from "lucide-react";

const fadeUp: Variants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } };

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
    <section id="features" className="relative py-24 lg:py-32 px-6">
      <div className="mx-auto max-w-6xl space-y-20">
        {/* Features Grid */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="mx-auto max-w-3xl text-center">
          <Badge variant="outline" className="mb-4 inline-flex items-center gap-2 rounded-full border-border/50 bg-background/55 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-foreground/70 backdrop-blur">
            <Zap className="h-3.5 w-3.5" /> Platform Features
          </Badge>
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">Everything you need to sell on Messenger</h2>
          <p className="mt-5 text-base leading-relaxed text-foreground/70 md:text-lg">From building a product database to automating your Facebook inbox — one platform to scale your sales.</p>
        </motion.div>

        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} transition={{ staggerChildren: 0.08 }} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <motion.div key={f.title} variants={fadeUp}>
              <Card className="group relative overflow-hidden rounded-2xl border border-border/50 bg-background/45 p-8 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-border h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.03] via-transparent to-transparent" />
                <div className="relative z-10 space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/40 bg-background/70 text-foreground/80">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-foreground/70">{f.desc}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Metrics Section — adapted from GlassmorphismMinimalMetricsBlock */}
        <div className="space-y-12">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }} className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-4 inline-flex items-center gap-2 rounded-full border-border/50 bg-background/55 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-foreground/70 backdrop-blur">
              <Zap className="h-3.5 w-3.5" /> Realtime Insights
            </Badge>
            <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">Real results from real sellers</h2>
            <p className="mt-5 text-base leading-relaxed text-foreground/70 md:text-lg">See how social commerce businesses are saving time and increasing conversions.</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} transition={{ staggerChildren: 0.08 }} className="grid gap-4 md:grid-cols-2">
            {metrics.map((m) => (
              <motion.div key={m.label} variants={fadeUp}>
                <Card className="group relative overflow-hidden rounded-3xl border border-border/50 bg-background/45 p-8 backdrop-blur-2xl transition-transform duration-300 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.04] via-transparent to-transparent" />
                  <div className="relative z-10 space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-[0.25em] text-foreground/60">{m.label}</span>
                      <ArrowUpRight className="h-4 w-4 text-foreground/40 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </div>
                    <div className="flex items-end gap-3">
                      <span className="text-5xl font-semibold tracking-tight">{m.value}</span>
                      <span className="rounded-full border border-border/40 bg-background/60 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60 backdrop-blur">{m.delta}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/70">{m.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* How It Works — adapted from features-5 */}
        <div className="grid items-center gap-12 md:grid-cols-2 lg:grid-cols-5 lg:gap-24">
          <div className="lg:col-span-2">
            <h2 className="text-4xl font-semibold lg:text-5xl">Built for Facebook Sellers</h2>
            <p className="mt-6 text-foreground/70">Stop drowning in your inbox. Add your products to Nuron AI, and let the AI handle the repetitive "price?", "delivery?", and "size?" questions. Step in only when the customer is ready to buy or needs special help.</p>
            <ul className="mt-8 divide-y border-y divide-border border-border *:flex *:items-center *:gap-3 *:py-3 text-sm">
              <li><FileText className="size-5 text-foreground/70" /> Easy product knowledge management</li>
              <li><Zap className="size-5 text-foreground/70" /> Instant replies in Messenger</li>
              <li><Users className="size-5 text-foreground/70" /> Smart human fallback system</li>
              <li><Globe className="size-5 text-foreground/70" /> Native Banglish understanding</li>
            </ul>
          </div>
          <div className="border-border/50 relative rounded-3xl border p-3 lg:col-span-3">
            <div className="rounded-2xl border border-border/30 bg-zinc-900/50 p-6 space-y-4">
              {/* Chat mockup */}
              <div className="space-y-3">
                <div className="flex gap-3"><div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center"><Bot className="h-4 w-4" /></div><div className="rounded-2xl rounded-tl-sm bg-zinc-800 px-4 py-3 max-w-xs text-sm">Hi there! 👋 How can I help you today?</div></div>
                <div className="flex gap-3 justify-end"><div className="rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-3 max-w-xs text-sm">bhai black t-shirt er price koto?</div></div>
                <div className="flex gap-3"><div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center"><Bot className="h-4 w-4" /></div><div className="rounded-2xl rounded-tl-sm bg-zinc-800 px-4 py-3 max-w-xs text-sm">Black t-shirt er price 450 Taka. Delivery charge inside Dhaka 60 Tk, outside 120 Tk. Order confirm korben?</div></div>
                <div className="flex gap-3 justify-end"><div className="rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-3 max-w-xs text-sm">ha, cash on delivery hobe?</div></div>
                <div className="flex gap-3"><div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center"><Bot className="h-4 w-4" /></div><div className="rounded-2xl rounded-tl-sm bg-zinc-800 px-4 py-3 max-w-xs text-sm">Ji, Cash on Delivery available! Apnar nam, phone number r address ta din order confirm korar jonno.</div></div>
              </div>
              <div className="flex gap-2"><div className="flex-1 h-10 rounded-lg bg-zinc-800/80 border border-border/30" /><div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center"><ArrowUpRight className="h-4 w-4 text-black" /></div></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
