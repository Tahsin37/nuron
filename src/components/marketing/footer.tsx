"use client";
import React, { useState, useEffect } from "react";
import { Zap, Globe, Briefcase, Play, AtSign } from "lucide-react";
import Link from "next/link";

interface FooterLink { title: string; href: string; icon?: React.ComponentType<{ className?: string }>; external?: boolean; }
interface FooterSectionData { label: string; links: FooterLink[]; }

const footerLinks: FooterSectionData[] = [
  { label: "Product", links: [{ title: "Features", href: "#features" }, { title: "Pricing", href: "#pricing" }, { title: "Testimonials", href: "#testimonials" }, { title: "Embed Widget", href: "#" }] },
  { label: "Company", links: [{ title: "About Us", href: "#" }, { title: "Privacy Policy", href: "/privacy" }, { title: "Terms of Service", href: "/terms" }, { title: "Contact", href: "#" }] },
  { label: "Resources", links: [{ title: "Documentation", href: "#docs" }, { title: "Blog", href: "#" }, { title: "Changelog", href: "#" }, { title: "Help Center", href: "#" }] },
  { label: "Social", links: [{ title: "Twitter", href: "#", icon: AtSign }, { title: "LinkedIn", href: "#", icon: Briefcase }, { title: "Instagram", href: "#", icon: Globe }, { title: "YouTube", href: "#", icon: Play }] },
];

export function Footer() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <footer className="relative w-full max-w-6xl mx-auto flex flex-col items-center justify-center rounded-t-4xl border-t border-border/50 bg-[radial-gradient(35%_128px_at_50%_0%,rgba(255,255,255,0.05),transparent)] px-6 py-12 lg:py-16 mt-12">
      <div className="bg-foreground/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />
      <div className={`grid w-full gap-8 xl:grid-cols-3 xl:gap-8 transition-opacity duration-700 ${mounted ? "opacity-100" : "opacity-0"}`}>
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white"><Zap className="h-4 w-4 text-black" /></div>
            <span className="text-lg font-semibold">Nuron AI</span>
          </Link>
          <p className="text-muted-foreground text-sm max-w-xs">AI employees that sell, support, and capture leads for your business. Not just a chatbot — a full AI workforce.</p>
          <p className="text-muted-foreground text-xs">© 2026 Nuron AI. All rights reserved.</p>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
          {footerLinks.map((section) => (
            <div key={section.label} className="mb-10 md:mb-0">
              <h3 className="text-xs font-medium uppercase tracking-wider text-foreground/60">{section.label}</h3>
              <ul className="text-muted-foreground mt-4 space-y-2.5 text-sm">
                {section.links.map((link) => (
                  <li key={link.title}>
                    {link.href.startsWith("/") ? (
                      <Link href={link.href} className="hover:text-foreground inline-flex items-center transition-all duration-300">
                        {link.icon && <link.icon className="me-1.5 size-4" />}
                        {link.title}
                      </Link>
                    ) : (
                      <a href={link.href} className="hover:text-foreground inline-flex items-center transition-all duration-300">
                        {link.icon && <link.icon className="me-1.5 size-4" />}
                        {link.title}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
