"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { Users, Search, Download, Mail, Phone, Loader2, TrendingUp, Flame, Snowflake } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/types";

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [intentFilter, setIntentFilter] = useState<"all" | "hot" | "warm" | "cold">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uuid) return;
    setLoading(true);
    fetch(`/api/leads?user_id=${user.uuid}`)
      .then(r => r.json())
      .then(data => setLeads(data.leads || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.uuid]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const filtered = leads
    .filter(l => intentFilter === "all" || l.buying_intent === intentFilter)
    .filter(l => !search || l.name.toLowerCase().includes(search.toLowerCase()) || (l.email && l.email.toLowerCase().includes(search.toLowerCase())) || (l.phone && l.phone.includes(search)));

  const hotCount = leads.filter(l => l.buying_intent === "hot").length;
  const warmCount = leads.filter(l => l.buying_intent === "warm").length;
  const coldCount = leads.filter(l => l.buying_intent !== "hot" && l.buying_intent !== "warm").length;

  const exportCSV = () => {
    const headers = "Name,Phone,Email,Budget,Product Interest,Intent,Source,Date\n";
    const rows = filtered.map(l => `"${l.name}","${l.phone || ""}","${l.email || ""}","${l.budget || ""}","${l.product_interest || ""}","${l.buying_intent || ""}","${(l as any).source || ""}","${new Date(l.created_at).toLocaleDateString()}"`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "nuron-leads.csv"; a.click();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Leads</h2>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">{leads.length} total leads captured by your AI</p>
        </div>
        <Button variant="outline" onClick={exportCSV} size="sm" className="h-8 text-xs self-start"><Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV</Button>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Hot", count: hotCount, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: Flame },
          { label: "Warm", count: warmCount, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: TrendingUp },
          { label: "Cold", count: coldCount, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: Snowflake },
        ].map(s => (
          <div key={s.label} className={cn("flex items-center gap-2 p-3 rounded-xl border", s.bg)}>
            <s.icon className={cn("h-4 w-4", s.color)} />
            <div>
              <span className="text-lg font-bold">{s.count}</span>
              <span className={cn("text-[10px] ml-1", s.color)}>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, or phone..." className="pl-9 bg-zinc-950 border-zinc-800 h-9 text-sm" />
        </div>
        <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-border/50 self-start">
          {(["all", "hot", "warm", "cold"] as const).map(f => (
            <button key={f} onClick={() => setIntentFilter(f)} className={cn("px-2.5 py-1 text-[10px] sm:text-xs font-medium rounded-md capitalize", intentFilter === f ? "bg-zinc-800 text-white shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="border-border/50">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <div className="h-12 w-12 mx-auto mb-3 rounded-2xl bg-amber-500/10 flex items-center justify-center"><Users className="h-6 w-6 text-amber-400" /></div>
              <p className="text-sm font-medium">No leads found</p>
              <p className="text-xs text-muted-foreground mt-1">Leads appear when customers show buying intent in chat</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border/30">
                  <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground text-xs">Name</th>
                  <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground text-xs">Contact</th>
                  <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground text-xs hidden md:table-cell">Interest</th>
                  <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground text-xs">Intent</th>
                  <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground text-xs hidden sm:table-cell">Source</th>
                  <th className="text-left p-3 sm:p-4 font-medium text-muted-foreground text-xs">Date</th>
                </tr></thead>
                <tbody>
                  {filtered.map((lead) => (
                    <tr key={lead.id} className="border-b border-border/10 hover:bg-accent/20 transition-colors">
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold shrink-0">{lead.name[0]?.toUpperCase()}</div>
                          <span className="font-medium text-xs sm:text-sm truncate max-w-[120px]">{lead.name}</span>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-muted-foreground">
                        <div className="flex flex-col gap-0.5">
                          {lead.phone && <span className="flex items-center gap-1 text-[10px] sm:text-xs"><Phone className="h-2.5 w-2.5" /> {lead.phone}</span>}
                          {lead.email && <span className="flex items-center gap-1 text-[10px] sm:text-xs"><Mail className="h-2.5 w-2.5" /> {lead.email}</span>}
                          {!lead.phone && !lead.email && <span className="text-[10px]">—</span>}
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 hidden md:table-cell"><span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-zinc-800 truncate max-w-[150px] inline-block">{lead.product_interest || "—"}</span></td>
                      <td className="p-3 sm:p-4">
                        <span className={cn("text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-medium",
                          lead.buying_intent === "hot" ? "bg-red-500/15 text-red-400" :
                          lead.buying_intent === "warm" ? "bg-amber-500/15 text-amber-400" : "bg-zinc-700 text-zinc-400"
                        )}>{lead.buying_intent || "cold"}</span>
                      </td>
                      <td className="p-3 sm:p-4 text-muted-foreground text-[10px] sm:text-xs hidden sm:table-cell capitalize">{(lead as any).source || "—"}</td>
                      <td className="p-3 sm:p-4 text-muted-foreground text-[10px] sm:text-xs">{new Date(lead.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
