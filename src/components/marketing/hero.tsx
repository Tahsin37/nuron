"use client";
import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ArrowRight, Bot, Sparkles, TrendingUp, Shield } from "lucide-react";
import LeadsTableCard from "@/components/ui/leads-table-card";

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const setSize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    setSize();
    type P = { x: number; y: number; v: number; o: number };
    let ps: P[] = [];
    let raf = 0;
    const make = (): P => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, v: Math.random() * 0.25 + 0.05, o: Math.random() * 0.35 + 0.15 });
    const init = () => { ps = []; const count = Math.floor((canvas.width * canvas.height) / 12000); for (let i = 0; i < count; i++) ps.push(make()); };
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ps.forEach((p) => { p.y -= p.v; if (p.y < 0) { p.x = Math.random() * canvas.width; p.y = canvas.height + Math.random() * 40; p.v = Math.random() * 0.25 + 0.05; p.o = Math.random() * 0.35 + 0.15; } ctx.fillStyle = `rgba(250,250,250,${p.o})`; ctx.fillRect(p.x, p.y, 0.7, 2.2); });
      raf = requestAnimationFrame(draw);
    };
    const onResize = () => { setSize(); init(); };
    window.addEventListener("resize", onResize); init(); raf = requestAnimationFrame(draw);
    return () => { window.removeEventListener("resize", onResize); cancelAnimationFrame(raf); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-40 mix-blend-screen pointer-events-none" />;
}

export function HeroSection() {
  const stats = [
    { label: "Products in Brain", value: "248", delta: "+12" },
    { label: "Messenger Chats", value: "1,847", delta: "+24%" },
    { label: "Leads Captured", value: "342", delta: "+18%" },
    { label: "Human Fallbacks", value: "12", delta: "-5%" },
  ];
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none [background:radial-gradient(80%_60%_at_50%_30%,rgba(255,255,255,0.04),transparent_60%)]" />
      <div className="accent-lines"><div className="hline" /><div className="hline" /><div className="hline" /><div className="vline" /><div className="vline" /><div className="vline" /></div>
      <ParticleCanvas />
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-24 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }} className="space-y-8">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="flex justify-center">
            <Badge variant="outline" className="inline-flex items-center gap-2 rounded-full border-border/50 bg-background/55 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-foreground/70 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Now in Open Beta — Free to Use
            </Badge>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.95]">
            <span className="gradient-text">Sell on Messenger</span><br />
            <span className="text-muted-foreground">While You Sleep</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
            Stop answering "price?", "delivery?", and "size?" manually. Build a product knowledge brain and let AI automate your inbox, capture leads, and escalate to you when needed.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup"><Button size="lg" className="h-12 px-8 rounded-xl bg-white text-black hover:bg-zinc-200 text-base font-semibold shadow-lg shadow-white/10">Automate Your Inbox <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <a href="#features"><Button size="lg" variant="outline" className="h-12 px-8 rounded-xl border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 text-base">See How It Works</Button></a>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Shield className="h-4 w-4" /><span>Enterprise-grade security</span></div>
            <div className="flex items-center gap-2"><Bot className="h-4 w-4" /><span>GPT-4o powered</span></div>
            <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /><span>36% avg. conversion lift</span></div>
          </motion.div>
        </motion.div>

        {/* Dashboard Mockup + Leads Table — Side by Side on Large Screens */}
        <motion.div initial={{ opacity: 0, y: 60, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.9, duration: 1 }} className="mt-16 mx-auto max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Dashboard Preview — Takes 3 columns */}
            <div className="lg:col-span-7">
              <div className="relative rounded-2xl border border-border/50 bg-zinc-900/70 backdrop-blur-xl p-1 shadow-2xl shadow-black/40 h-full">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
                  <div className="flex gap-1.5"><div className="h-3 w-3 rounded-full bg-zinc-700" /><div className="h-3 w-3 rounded-full bg-zinc-700" /><div className="h-3 w-3 rounded-full bg-zinc-700" /></div>
                  <div className="flex-1 flex justify-center"><div className="h-6 w-52 rounded-md bg-zinc-800/80 flex items-center justify-center text-[11px] text-zinc-500">app.nuronai.com/dashboard</div></div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {stats.map((s) => (
                      <div key={s.label} className="rounded-xl border border-border/30 bg-zinc-800/40 p-3">
                        <div className="text-[10px] uppercase tracking-wider text-zinc-500">{s.label}</div>
                        <div className="mt-1 flex items-end gap-2"><span className="text-xl font-bold">{s.value}</span><span className="text-xs text-emerald-400 mb-0.5">{s.delta}</span></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1 items-end h-16">
                    {Array.from({ length: 20 }, (_, i) => (<div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-zinc-700 to-zinc-600" style={{ height: `${20 + Math.sin(i * 0.5) * 40 + 30}%`, opacity: 0.4 + Math.sin(i * 0.3) * 0.3 + 0.3 }} />))}
                  </div>
                </div>
              </div>
            </div>

            {/* Leads Table — Takes 2 columns */}
            <div className="lg:col-span-5">
              <LeadsTableCard className="h-full" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
