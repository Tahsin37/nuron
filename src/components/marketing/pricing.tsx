"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, SparklesIcon } from "lucide-react";

function FilledCheck() {
  return (<div className="bg-primary text-primary-foreground rounded-full p-0.5"><CheckIcon className="size-3" strokeWidth={3} /></div>);
}

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight lg:text-5xl">Simple, Transparent Pricing</h2>
          <p className="text-muted-foreground mt-4 text-base">Free during launch. No credit card required. Build your AI employee today.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-8">
          {/* Featured Plan */}
          <div className={cn("bg-background border-foreground/10 relative w-full overflow-hidden rounded-xl border", "supports-[backdrop-filter]:bg-background/10 backdrop-blur", "lg:col-span-5")}>
            <div className="pointer-events-none absolute top-0 left-1/2 -mt-2 -ml-20 h-full w-full [mask-image:linear-gradient(white,transparent)]">
              <div className="from-foreground/5 to-foreground/2 absolute inset-0 bg-gradient-to-r [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]" />
            </div>
            <div className="flex items-center gap-3 p-5">
              <Badge variant="secondary">GROWTH</Badge>
              <Badge variant="outline" className="hidden lg:flex"><SparklesIcon className="me-1 size-3" /> Most Popular</Badge>
              <div className="ml-auto"><Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">FREE DURING LAUNCH</Badge></div>
            </div>
            <div className="flex flex-col p-5 pt-0 lg:flex-row">
              <div className="pb-4 lg:w-[30%]">
                <span className="font-mono text-5xl font-semibold tracking-tight line-through text-muted-foreground/40">$29</span>
                <span className="ml-2 text-3xl font-bold text-emerald-400">$0</span>
                <div className="text-muted-foreground text-sm mt-1">/month during beta</div>
              </div>
              <ul className="text-muted-foreground grid gap-3 text-sm lg:w-[70%]">
                {["5 AI agents with full personality control", "Unlimited conversations & lead capture", "Website URL + PDF + text training", "Embed widget with brand customization", "Real-time analytics dashboard", "Google Sheets integration"].map((f, i) => (
                  <li key={i} className="flex items-center gap-3"><FilledCheck /><span className="leading-relaxed">{f}</span></li>
                ))}
              </ul>
            </div>
          </div>

          {/* Starter */}
          <div className={cn("bg-background border-foreground/10 relative overflow-hidden rounded-xl border", "supports-[backdrop-filter]:bg-background/10 backdrop-blur", "lg:col-span-3")}>
            <div className="flex items-center gap-3 p-5"><Badge variant="secondary">STARTER</Badge><div className="ml-auto"><Button variant="outline" size="sm">Get Started</Button></div></div>
            <div className="flex items-end gap-2 px-5 py-2"><span className="font-mono text-5xl font-semibold tracking-tight">Free</span></div>
            <ul className="text-muted-foreground grid gap-3 p-5 text-sm">
              {["1 AI agent", "100 conversations/month", "Basic training (text only)", "Standard embed widget"].map((f, i) => (
                <li key={i} className="flex items-center gap-3"><FilledCheck /><span>{f}</span></li>
              ))}
            </ul>
          </div>

          {/* Teams */}
          <div className={cn("bg-background border-foreground/10 relative overflow-hidden rounded-xl border", "supports-[backdrop-filter]:bg-background/10 backdrop-blur", "lg:col-span-4")}>
            <div className="flex items-center gap-3 p-5"><Badge variant="secondary">TEAMS</Badge><div className="ml-auto"><Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">FREE</Badge></div></div>
            <div className="flex items-end gap-2 px-5 py-2"><span className="font-mono text-5xl font-semibold tracking-tight line-through text-muted-foreground/40">$49</span><span className="ml-2 text-3xl font-bold text-emerald-400">$0</span></div>
            <ul className="text-muted-foreground grid gap-3 p-5 text-sm">
              {["10 AI agents with team collaboration", "Priority support & custom integrations", "Advanced analytics & export"].map((f, i) => (
                <li key={i} className="flex items-center gap-3"><FilledCheck /><span>{f}</span></li>
              ))}
            </ul>
          </div>

          {/* Enterprise */}
          <div className={cn("bg-background border-foreground/10 relative overflow-hidden rounded-xl border", "supports-[backdrop-filter]:bg-background/10 backdrop-blur", "lg:col-span-4")}>
            <div className="flex items-center gap-3 p-5"><Badge variant="secondary">ENTERPRISE</Badge><div className="ml-auto"><Button variant="outline" size="sm">Contact Us</Button></div></div>
            <div className="flex items-end gap-2 px-5 py-2"><span className="font-mono text-5xl font-semibold tracking-tight">Custom</span></div>
            <ul className="text-muted-foreground grid gap-3 p-5 text-sm">
              {["Unlimited AI agents & conversations", "White-label widget & API access", "Dedicated account management"].map((f, i) => (
                <li key={i} className="flex items-center gap-3"><FilledCheck /><span>{f}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
