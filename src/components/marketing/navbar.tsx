"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X, Zap, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuth();

  const onScroll = useCallback(() => {
    setScrolled(window.scrollY > 10);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Docs", href: "#docs" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled 
          ? "bg-black/60 border-white/5 backdrop-blur-md" 
          : "bg-transparent border-transparent"
      )}
    >
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-white">
            <Zap className="h-4 w-4 text-black" />
          </div>
          <span className="text-base font-medium tracking-tight text-white">Nuron AI</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-white/[0.04]"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button size="sm" className="h-8 rounded-lg bg-white text-black hover:bg-zinc-200 active:scale-[0.98] transition-all font-medium text-xs px-4">
                Dashboard <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="h-8 text-zinc-400 hover:text-white hover:bg-white/[0.04] text-xs font-medium">
                  Log in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="h-8 rounded-lg bg-white text-black hover:bg-zinc-200 active:scale-[0.98] transition-all font-medium text-xs px-4">
                  Get Started Free
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setOpen(!open)}
          className="md:hidden text-zinc-400 hover:text-white hover:bg-white/[0.04]"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </nav>

      {/* Mobile Menu */}
      {open && (
        <div className="fixed inset-0 top-14 z-40 bg-black/95 backdrop-blur-lg md:hidden animate-in fade-in duration-200">
          <div className="flex flex-col p-6 gap-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setOpen(false)}
                className="px-4 py-3 text-lg font-medium text-zinc-300 hover:text-white hover:bg-white/[0.04] rounded-lg transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="border-t border-white/10 mt-4 pt-4 flex flex-col gap-3">
              {isAuthenticated ? (
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  <Button className="w-full h-10 rounded-lg bg-white text-black hover:bg-zinc-200 font-medium">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full h-10 rounded-lg border-white/10 text-white bg-transparent hover:bg-white/[0.04] font-medium">Log in</Button>
                  </Link>
                  <Link href="/signup" onClick={() => setOpen(false)}>
                    <Button className="w-full h-10 rounded-lg bg-white text-black hover:bg-zinc-200 font-medium">Get Started Free</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
