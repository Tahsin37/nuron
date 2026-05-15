"use client";
import React from "react";
import { motion } from "framer-motion";

const testimonials = [
  { text: "Nuron AI transformed our sales process. Our AI agent handles 80% of initial customer conversations and our lead quality improved dramatically.", image: "https://randomuser.me/api/portraits/women/1.jpg", name: "Sarah Mitchell", role: "VP of Sales, TechFlow" },
  { text: "We deployed our AI employee in 30 minutes. It learned our product catalog from our website and started selling immediately. Incredible.", image: "https://randomuser.me/api/portraits/men/2.jpg", name: "James Chen", role: "CEO, ShopMatrix" },
  { text: "The lead capture is phenomenal. We went from losing 90% of after-hours visitors to converting 35% of them into qualified leads.", image: "https://randomuser.me/api/portraits/women/3.jpg", name: "Emily Rodriguez", role: "Marketing Director, GrowthLab" },
  { text: "Our support costs dropped 60% after deploying Nuron AI. The AI handles common questions perfectly and escalates complex ones.", image: "https://randomuser.me/api/portraits/men/4.jpg", name: "David Park", role: "CTO, CloudServe" },
  { text: "The personality customization is what sets Nuron apart. Our AI agent truly feels like a member of our team, not a generic bot.", image: "https://randomuser.me/api/portraits/women/5.jpg", name: "Lisa Thompson", role: "Brand Manager, Luxe Retail" },
  { text: "Integration was seamless. One script tag and our AI sales agent was live. The analytics dashboard gives us insights we never had.", image: "https://randomuser.me/api/portraits/women/6.jpg", name: "Anna Kowalski", role: "Head of Digital, NexGen" },
  { text: "We tripled our conversion rate within the first month. The AI upselling feature alone paid for itself ten times over.", image: "https://randomuser.me/api/portraits/men/7.jpg", name: "Robert Kim", role: "E-commerce Director, StyleHub" },
  { text: "Best investment we made this year. Our AI employee works 24/7, never takes breaks, and consistently delivers quality conversations.", image: "https://randomuser.me/api/portraits/women/8.jpg", name: "Maria Santos", role: "Founder, HealthFirst" },
  { text: "The Google Sheets integration is genius. We update our product prices in Sheets and the AI agent reflects changes instantly.", image: "https://randomuser.me/api/portraits/men/9.jpg", name: "Tom Anderson", role: "Operations Lead, DataDriven" },
];

function TestimonialsColumn({ testimonials: items, duration = 15, className }: { testimonials: typeof testimonials; duration?: number; className?: string }) {
  return (
    <div className={className}>
      <motion.div animate={{ translateY: "-50%" }} transition={{ duration, repeat: Infinity, ease: "linear", repeatType: "loop" }} className="flex flex-col gap-6 pb-6">
        {[...new Array(2)].map((_, index) => (
          <React.Fragment key={index}>
            {items.map((t, i) => (
              <div className="p-8 rounded-3xl border border-border/50 bg-card/50 backdrop-blur shadow-lg shadow-black/10 max-w-xs w-full" key={`${index}-${i}`}>
                <div className="text-sm leading-relaxed text-foreground/80">{t.text}</div>
                <div className="flex items-center gap-3 mt-5">
                  <img width={40} height={40} src={t.image} alt={t.name} className="h-10 w-10 rounded-full border border-border/30" />
                  <div className="flex flex-col">
                    <div className="font-medium text-sm tracking-tight leading-5">{t.name}</div>
                    <div className="leading-5 text-xs text-foreground/50">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
}

export function TestimonialsSection() {
  const col1 = testimonials.slice(0, 3);
  const col2 = testimonials.slice(3, 6);
  const col3 = testimonials.slice(6, 9);
  return (
    <section id="testimonials" className="relative py-24">
      <div className="container z-10 mx-auto px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} viewport={{ once: true }} className="flex flex-col items-center justify-center max-w-[540px] mx-auto">
          <div className="flex justify-center"><div className="border border-border/50 py-1 px-4 rounded-lg text-sm text-foreground/70">Testimonials</div></div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter mt-5 text-center">What our users say</h2>
          <p className="text-center mt-5 text-foreground/60">See how businesses are transforming their sales with AI employees.</p>
        </motion.div>
        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
          <TestimonialsColumn testimonials={col1} duration={15} />
          <TestimonialsColumn testimonials={col2} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={col3} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
}
