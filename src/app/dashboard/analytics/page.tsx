"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnalytics } from "@/lib/store";
import type { AnalyticsData } from "@/lib/types";
import { BarChart3, Users, MessageSquare, TrendingUp, HelpCircle, Clock, Package } from "lucide-react";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); setData(getAnalytics()); }, []);
  if (!mounted || !data) return null;

  const stats = [
    { label: "Total Conversations", value: data.total_conversations, icon: MessageSquare, color: "text-purple-400" },
    { label: "AI Handled", value: data.ai_handled_count, icon: BarChart3, color: "text-emerald-400" },
    { label: "Hot Leads", value: data.total_leads, icon: Users, color: "text-amber-400" },
    { label: "Human Fallbacks", value: data.fallback_count, icon: HelpCircle, color: "text-red-400" },
  ];

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Analytics</h2><p className="text-muted-foreground text-sm mt-1">Performance insights for your Messenger AI</p></div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(s => (
          <Card key={s.label} className="border-border/50"><CardContent className="p-6"><div className="flex items-center justify-between"><span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</span><s.icon className={`h-5 w-5 ${s.color}`} /></div><div className="mt-3 text-3xl font-bold">{s.value}</div></CardContent></Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Conversations Over Time */}
        <Card className="border-border/50">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Conversations (7 Days)</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 items-end h-48">
              {data.conversations_over_time.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-gradient-to-t from-purple-500/40 to-purple-400/20 hover:from-purple-500/60 hover:to-purple-400/40 transition-all" style={{ height: `${Math.max(8, (d.count / 30) * 100)}%` }} />
                  <span className="text-[10px] text-muted-foreground">{d.date.slice(5)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Hours */}
        <Card className="border-border/50">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-5 w-5" /> Active Hours</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-0.5 items-end h-48">
              {data.active_hours.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full rounded-t bg-gradient-to-t from-emerald-500/40 to-emerald-400/20" style={{ height: `${Math.max(5, (h.count / 50) * 100)}%` }} />
                  {i % 4 === 0 && <span className="text-[9px] text-muted-foreground">{h.hour}h</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Common Questions */}
        <Card className="border-border/50">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><HelpCircle className="h-5 w-5" /> Common Questions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.common_questions.map((q, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-foreground/80 truncate flex-1">{q.question}</span>
                <span className="text-xs text-muted-foreground ml-2 shrink-0">{q.count} asks</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-border/50">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Package className="h-5 w-5" /> Top Products Discussed</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.top_products.map((p, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm"><span>{p.product}</span><span className="text-muted-foreground">{p.mentions} mentions</span></div>
                <div className="h-1.5 rounded-full bg-zinc-800"><div className="h-full rounded-full bg-gradient-to-r from-amber-500/60 to-amber-400/30" style={{ width: `${(p.mentions / 70) * 100}%` }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
