'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion, type Variants } from 'framer-motion'
import { ArrowUp, Bot, Brain, Database, Globe, MessageSquare, Plus, ShoppingBag, Sparkles, Users } from 'lucide-react'

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export function HeroFeaturesSection() {
  return (
    <section className="relative py-24 lg:py-32 px-6">
      <div className="mx-auto max-w-5xl">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.3 }}>
          <h2 className="text-foreground max-w-2xl text-balance text-4xl font-semibold">
            Your AI employee handles the entire sales funnel
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          transition={{ staggerChildren: 0.12 }}
          className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {/* Card 1: Product Brain */}
          <motion.div variants={fadeUp}>
            <Card variant="soft" className="overflow-hidden p-6 h-full">
              <Database className="text-blue-400 size-5" />
              <h3 className="text-foreground mt-5 text-lg font-semibold">Product Knowledge Brain</h3>
              <p className="text-muted-foreground mt-3 text-balance text-sm">Upload products once — the AI learns price, stock, sizes, colors and answers customers automatically.</p>
              <ProductBrainIllustration />
            </Card>
          </motion.div>

          {/* Card 2: Messenger Inbox */}
          <motion.div variants={fadeUp}>
            <Card variant="soft" className="group overflow-hidden px-6 pt-6 h-full">
              <MessageSquare className="text-emerald-400 size-5" />
              <h3 className="text-foreground mt-5 text-lg font-semibold">Smart Messenger Inbox</h3>
              <p className="text-muted-foreground mt-3 text-balance text-sm">AI replies to "price?", "COD আছে?", "size?" instantly. You step in only when needed.</p>
              <InboxIllustration />
            </Card>
          </motion.div>

          {/* Card 3: Lead Capture */}
          <motion.div variants={fadeUp}>
            <Card variant="soft" className="group overflow-hidden px-6 pt-6 h-full">
              <Sparkles className="text-amber-400 size-5" />
              <h3 className="text-foreground mt-5 text-lg font-semibold">Automatic Lead Capture</h3>
              <p className="text-muted-foreground mt-3 text-balance text-sm">AI detects buying intent, captures phone numbers, and flags hot leads for you to close.</p>
              <div className="mask-b-from-50 -mx-2 -mt-2 px-2 pt-2">
                <LeadCaptureIllustration />
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

/* ─── Illustration: Product Brain Card ─── */
const ProductBrainIllustration = () => {
  return (
    <Card aria-hidden className="mt-9 aspect-video p-4">
      <div className="mb-0.5 text-sm font-semibold flex items-center gap-2">
        <Brain className="size-4 text-blue-400" /> Product Brain
      </div>
      <div className="mb-4 flex gap-2 text-sm">
        <span className="text-muted-foreground">248 products learned</span>
      </div>
      <div className="mb-3 flex -space-x-2">
        {[
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=60&h=60&fit=crop',
          'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=60&h=60&fit=crop',
          'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=60&h=60&fit=crop',
          'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=60&h=60&fit=crop',
        ].map((src, i) => (
          <div key={i} className="bg-background size-8 rounded-lg border p-0.5 shadow shadow-zinc-950/5">
            <img className="rounded-md object-cover w-full h-full" src={src} alt="Product" width="60" height="60" />
          </div>
        ))}
        <div className="bg-zinc-800 size-8 rounded-lg border border-border/50 flex items-center justify-center text-[10px] text-zinc-400 font-medium">+244</div>
      </div>
      <div className="text-muted-foreground text-xs font-medium">AI confidence: 96% avg.</div>
    </Card>
  )
}

/* ─── Illustration: Inbox Preview Card ─── */
const InboxIllustration = () => {
  return (
    <div aria-hidden className="relative mt-6">
      <Card className="w-4/5 translate-y-4 p-3 transition-transform duration-200 ease-in-out group-hover:-rotate-2">
        <div className="mb-3 flex items-center gap-2">
          <div className="bg-blue-600 size-6 rounded-full flex items-center justify-center">
            <Users className="size-3 text-white" />
          </div>
          <span className="text-sm font-medium">Rahim Uddin</span>
          <span className="text-muted-foreground/75 text-xs">now</span>
        </div>
        <div className="ml-8 space-y-1.5 text-xs text-muted-foreground">
          <p>bhai black panjabi er price koto?</p>
        </div>
        <div className="ml-8 mt-2 rounded-lg bg-blue-600/10 border border-blue-500/20 p-2 text-xs text-blue-300">
          ✨ AI replied in 2s
        </div>
      </Card>
      <Card className="absolute -top-3 right-0 flex w-2/5 translate-y-4 p-3 transition-transform duration-200 ease-in-out group-hover:rotate-3">
        <div className="m-auto text-center space-y-1">
          <div className="bg-emerald-500/10 mx-auto size-8 rounded-full flex items-center justify-center">
            <Bot className="size-4 text-emerald-400" />
          </div>
          <div className="text-[10px] text-muted-foreground">AI Active</div>
        </div>
      </Card>
    </div>
  )
}

/* ─── Illustration: Lead Capture Card ─── */
const LeadCaptureIllustration = () => {
  return (
    <Card aria-hidden className="mt-6 translate-y-4 p-4 pb-6 transition-transform duration-200 group-hover:translate-y-0">
      <div className="w-fit">
        <Sparkles className="size-3.5 fill-amber-300 stroke-amber-300" />
        <p className="mt-2 text-sm">
          <span className="text-amber-400 font-medium">Hot Lead Detected</span>
          <br />
          <span className="text-muted-foreground text-xs">Kamal wants to order Winter Hoodie (XL, Black)</span>
        </p>
      </div>
      <div className="bg-foreground/5 -mx-3 -mb-3 mt-3 space-y-3 rounded-lg p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Intent: <span className="text-amber-400 font-medium">96%</span></span>
          <span className="text-emerald-400 text-[10px]">৳950 potential</span>
        </div>
        <div className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="size-7 rounded-2xl bg-transparent shadow-none border-border/50">
              <ShoppingBag className="size-3" />
            </Button>
            <Button variant="outline" size="icon" className="size-7 rounded-2xl bg-transparent shadow-none border-border/50">
              <Globe className="size-3" />
            </Button>
          </div>
          <Button size="icon" className="size-7 rounded-2xl bg-white text-black hover:bg-zinc-200">
            <ArrowUp strokeWidth={3} className="size-3" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
