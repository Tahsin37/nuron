'use client'

import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ArrowUp, Bot, Brain, Database, Globe, MessageSquare, Plus, ShoppingBag, Sparkles, Users } from 'lucide-react'
import { fadeUp, staggerContainer } from '@/lib/animations'

export function HeroFeaturesSection() {
  return (
    <section className="relative py-24 lg:py-32 px-6 border-t border-white/5 bg-black">
      <div className="mx-auto max-w-5xl">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
          <h2 className="text-white max-w-2xl text-balance text-3xl md:text-4xl font-semibold tracking-tight">
            Your AI employee handles the entire sales funnel
          </h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {/* Card 1: Product Brain */}
          <motion.div variants={fadeUp}>
            <GlassCard className="p-6 h-full flex flex-col">
              <Database className="text-white size-5" />
              <h3 className="text-white mt-5 text-lg font-medium tracking-tight">Product Knowledge Brain</h3>
              <p className="text-zinc-400 mt-3 text-balance text-sm leading-relaxed flex-1">Upload products once — the AI learns price, stock, sizes, colors and answers customers automatically.</p>
              <ProductBrainIllustration />
            </GlassCard>
          </motion.div>

          {/* Card 2: Messenger Inbox */}
          <motion.div variants={fadeUp}>
            <GlassCard className="p-6 h-full flex flex-col">
              <MessageSquare className="text-white size-5" />
              <h3 className="text-white mt-5 text-lg font-medium tracking-tight">Smart Messenger Inbox</h3>
              <p className="text-zinc-400 mt-3 text-balance text-sm leading-relaxed flex-1">AI replies to "price?", "COD আছে?", "size?" instantly. You step in only when needed.</p>
              <InboxIllustration />
            </GlassCard>
          </motion.div>

          {/* Card 3: Lead Capture */}
          <motion.div variants={fadeUp}>
            <GlassCard className="p-6 h-full flex flex-col">
              <Sparkles className="text-white size-5" />
              <h3 className="text-white mt-5 text-lg font-medium tracking-tight">Automatic Lead Capture</h3>
              <p className="text-zinc-400 mt-3 text-balance text-sm leading-relaxed flex-1">AI detects buying intent, captures phone numbers, and flags hot leads for you to close.</p>
              <div className="mask-b-from-50 -mx-2 -mt-2 px-2 pt-2">
                <LeadCaptureIllustration />
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Illustration: Product Brain Card ─── */
const ProductBrainIllustration = () => {
  return (
    <div aria-hidden className="mt-8 rounded-xl border border-white/10 bg-white/[0.02] p-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
      <div className="mb-2 text-xs font-medium flex items-center gap-2 text-zinc-300">
        <Brain className="size-4 text-zinc-400" /> Product Brain
      </div>
      <div className="mb-4 flex gap-2 text-xs">
        <span className="text-zinc-500">248 products learned</span>
      </div>
      <div className="mb-4 flex -space-x-2">
        {[
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=60&h=60&fit=crop',
          'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=60&h=60&fit=crop',
          'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=60&h=60&fit=crop',
          'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=60&h=60&fit=crop',
        ].map((src, i) => (
          <div key={i} className="bg-black size-8 rounded-lg border border-white/10 p-0.5 shadow-md">
            <img className="rounded-md object-cover w-full h-full" src={src} alt="Product" width="60" height="60" />
          </div>
        ))}
        <div className="bg-white/5 size-8 rounded-lg border border-white/10 flex items-center justify-center text-[10px] text-zinc-400 font-medium">+244</div>
      </div>
      <div className="text-zinc-500 text-[10px] uppercase tracking-widest font-medium">AI confidence: 96% avg.</div>
    </div>
  )
}

/* ─── Illustration: Inbox Preview Card ─── */
const InboxIllustration = () => {
  return (
    <div aria-hidden className="relative mt-8">
      <div className="rounded-xl border border-white/10 bg-white/[0.02] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] w-4/5 translate-y-4 p-3 transition-transform duration-300 ease-out group-hover:-rotate-2">
        <div className="mb-3 flex items-center gap-2">
          <div className="bg-zinc-800 size-6 rounded-full flex items-center justify-center">
            <Users className="size-3 text-white" />
          </div>
          <span className="text-xs font-medium text-white">Rahim Uddin</span>
          <span className="text-zinc-500 text-[10px]">now</span>
        </div>
        <div className="ml-8 space-y-1.5 text-[11px] text-zinc-400">
          <p>bhai black panjabi er price koto?</p>
        </div>
        <div className="ml-8 mt-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-[10px] text-emerald-400 font-medium">
          ✨ AI replied in 2s
        </div>
      </div>
      <div className="absolute -top-3 right-0 flex w-2/5 translate-y-4 rounded-xl border border-white/10 bg-black shadow-[0_8px_30px_rgb(0,0,0,0.5)] p-3 transition-transform duration-300 ease-out group-hover:rotate-3">
        <div className="m-auto text-center space-y-2">
          <div className="bg-emerald-500/10 mx-auto size-8 rounded-full flex items-center justify-center">
            <Bot className="size-4 text-emerald-400" />
          </div>
          <div className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium">AI Active</div>
        </div>
      </div>
    </div>
  )
}

/* ─── Illustration: Lead Capture Card ─── */
const LeadCaptureIllustration = () => {
  return (
    <div aria-hidden className="mt-8 translate-y-4 rounded-xl border border-white/10 bg-white/[0.02] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] p-4 pb-6 transition-transform duration-300 group-hover:translate-y-0">
      <div className="w-fit">
        <Sparkles className="size-3.5 fill-amber-300 stroke-amber-300" />
        <p className="mt-3 text-sm">
          <span className="text-amber-400 font-medium tracking-tight">Hot Lead Detected</span>
          <br />
          <span className="text-zinc-400 text-xs mt-1 block">Kamal wants to order Winter Hoodie (XL, Black)</span>
        </p>
      </div>
      <div className="bg-black/50 border border-white/5 -mx-3 -mb-3 mt-4 space-y-3 rounded-lg p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Intent: <span className="text-amber-400 font-medium">96%</span></span>
          <span className="text-emerald-400 text-[10px] font-medium">৳950 potential</span>
        </div>
        <div className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="size-7 rounded-md bg-white/5 shadow-none border-white/10">
              <ShoppingBag className="size-3 text-zinc-400" />
            </Button>
            <Button variant="outline" size="icon" className="size-7 rounded-md bg-white/5 shadow-none border-white/10">
              <Globe className="size-3 text-zinc-400" />
            </Button>
          </div>
          <Button size="icon" className="size-7 rounded-md bg-white text-black hover:bg-zinc-200">
            <ArrowUp strokeWidth={3} className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}
