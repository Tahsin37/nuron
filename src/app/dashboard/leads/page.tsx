"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { Users, Search, Download, Mail, Phone, Loader2 } from "lucide-react";
import type { Lead } from "@/lib/types";

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
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

  const filtered = leads.filter(l => l.name.toLowerCase().includes(search.toLowerCase()) || (l.email && l.email.toLowerCase().includes(search.toLowerCase())) || (l.phone && l.phone.includes(search)));

  const exportCSV = () => {
    const headers = "Name,Phone,Email,Budget,Product Interest,Intent,Date\n";
    const rows = filtered.map(l => `${l.name},${l.phone || ""},${l.email || ""},${l.budget || ""},${l.product_interest || ""},${l.buying_intent || "unknown"},${new Date(l.created_at).toLocaleDateString()}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "nuron-leads.csv"; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Leads</h2><p className="text-muted-foreground text-sm mt-1">{leads.length} leads captured</p></div>
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
      </div>

      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads..." className="pl-10 bg-zinc-950 border-zinc-800" /></div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border/30">
                <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Phone / Email</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Budget</th>
                <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Interest</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Intent</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
              </tr></thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>No leads found</p></td></tr>
                ) : filtered.map((lead) => (
                  <tr key={lead.id} className="border-b border-border/20 hover:bg-accent/30 transition-colors">
                    <td className="p-4 font-medium">{lead.name}</td>
                    <td className="p-4 text-muted-foreground">
                      <div className="flex flex-col gap-1">
                        {lead.phone && <span className="flex items-center gap-1 text-xs"><Phone className="h-3 w-3" /> {lead.phone}</span>}
                        {lead.email && <span className="flex items-center gap-1 text-xs"><Mail className="h-3 w-3" /> {lead.email}</span>}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground hidden lg:table-cell">{lead.budget || "—"}</td>
                    <td className="p-4 hidden lg:table-cell"><span className="text-xs px-2 py-1 rounded-full bg-zinc-800">{lead.product_interest || "—"}</span></td>
                    <td className="p-4">
                      {lead.buying_intent === "hot" ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 font-medium">Hot</span>
                      ) : lead.buying_intent === "warm" ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 font-medium">Warm</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-zinc-700 text-zinc-400 font-medium">Cold</span>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">{new Date(lead.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
