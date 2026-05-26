import React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  spotlight?: boolean;
}

export function GlassCard({ children, className, spotlight = true, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black p-8 transition-all duration-300 hover:border-white/[0.15] hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]",
        className
      )}
      {...props}
    >
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent opacity-100" />
      
      {/* Hover glow */}
      {spotlight && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      )}
      
      {/* Top reflection / inset shadow replacement */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] opacity-50" />
      
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
