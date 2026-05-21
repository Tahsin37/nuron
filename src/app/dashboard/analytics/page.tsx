"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { BarChart3, Users, MessageSquare, HelpCircle, Clock, Package, Loader2 } from "lucide-react";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [convs, setConvs] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.uuid) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/conversations?user_id=${user.uuid}`).then(r => r.json()),
      fetch(`/api/leads?user_id=${user.uuid}`).then(r => r.json()),
    ]).then(([cData, lData]) => {
      setConvs(cData.conversations || []);
      setLeads(lData.leads || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user?.uuid]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const totalConvs = convs.length;
  const aiHandled = convs.filter(c => c.status === "active" || c.status === "resolved").length;
  const needsHuman = convs.filter(c => c.status === "needs_human").length;
  const totalLeads = leads.length;
  const hotLeads = leads.filter((l: any) => l.buying_intent === "hot").length;

  // Conversations over last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().split("T")[0];
    return { date: ds, count: convs.filter(c => c.started_at?.split("T")[0] === ds || c.last_message_at?.split("T")[0] === ds).length };
  });

  // Active hours
  const hourCounts = Array.from({ length: 24 }, () => 0);
  convs.forEach(c => { const h = new Date(c.last_message_at || c.started_at).getHours(); hourCounts[h]++; });

  // Common questions from messages
  const allMsgs = convs.flatMap(c => (Array.isArray(c.messages) ? c.messages : []).filter((m: any) => m.role === "user").map((m: any) => m.content));
  const qCounts: Record<string, number> = {};
  allMsgs.forEach(msg => { const s = (msg || "").length > 60 ? msg.slice(0, 60) + "…" : msg; if (s) qCounts[s] = (qCounts[s] || 0) + 1; });
  const commonQs = Object.entries(qCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Top products from leads
  const pCounts: Record<string, number> = {};
  leads.forEach((l: any) => { if (l.product_interest) pCounts[l.product_interest] = (pCounts[l.product_interest] || 0) + 1; });
  const topProducts = Object.entries(pCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxMentions = topProducts[0]?.[1] || 1;

  const stats = [
    { label: "Total Conversations", value: totalConvs, icon: MessageSquare, color: "text-purple-400" },
    { label: "AI Handled", value: aiHandled, icon: BarChart3, color: "text-emerald-400" },
    { label: "Hot Leads", value: hotLeads, icon: Users, color: "text-amber-400", sub: `${totalLeads} total` },
    { label: "Needs Human", value: needsHuman, icon: HelpCircle, color: "text-red-400" },
  ];

  const maxDaily = Math.max(...last7Days.map(d => d.count), 1);
  const maxHour = Math.max(...hourCounts, 1);

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold">Analytics</h2><p className="text-muted-foreground text-sm mt-1">Performance insights across all channels</p></div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {stats.map(s => (
          <Card key={s.label} className="border-border/50"><CardContent className="p-4 sm:p-6"><div className="flex items-center justify-between"><span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</span><s.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${s.color}`} /></div><div className="mt-2 text-2xl sm:text-3xl font-bold">{s.value}</div>{s.sub && <div className="text-[10px] text-muted-foreground mt-1">{s.sub}</div>}</CardContent></Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm sm:text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Conversations (7 Days)</CardTitle></CardHeader>
          <CardContent>
            {totalConvs === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No conversations yet</p> : (
              <div className="flex gap-1.5 sm:gap-2 items-end h-36 sm:h-48">
                {last7Days.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t bg-gradient-to-t from-purple-500/40 to-purple-400/20 transition-all" style={{ height: `${Math.max(8, (d.count / maxDaily) * 100)}%` }} />
                    <span className="text-[8px] sm:text-[10px] text-muted-foreground">{d.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm sm:text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Active Hours</CardTitle></CardHeader>
          <CardContent>
            {totalConvs === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No data yet</p> : (
              <div className="flex gap-0.5 items-end h-36 sm:h-48">
                {hourCounts.map((count, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full rounded-t bg-gradient-to-t from-emerald-500/40 to-emerald-400/20" style={{ height: `${Math.max(4, (count / maxHour) * 100)}%` }} />
                    {i % 6 === 0 && <span className="text-[8px] sm:text-[9px] text-muted-foreground">{i}h</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm sm:text-base flex items-center gap-2"><HelpCircle className="h-4 w-4" /> Common Questions</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {commonQs.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No questions yet</p> :
              commonQs.map(([q, count], i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm text-foreground/80 truncate flex-1">{q}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{count}x</span>
                </div>
              ))
            }
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2"><CardTitle className="text-sm sm:text-base flex items-center gap-2"><Package className="h-4 w-4" /> Top Products Discussed</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {topProducts.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">No product data yet</p> :
              topProducts.map(([p, mentions], i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs sm:text-sm"><span className="truncate">{p}</span><span className="text-muted-foreground shrink-0 ml-2">{mentions}x</span></div>
                  <div className="h-1.5 rounded-full bg-zinc-800"><div className="h-full rounded-full bg-gradient-to-r from-amber-500/60 to-amber-400/30" style={{ width: `${(mentions / maxMentions) * 100}%` }} /></div>
                </div>
              ))
            }
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
