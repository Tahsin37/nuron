"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getProducts, getLeads, getConversations, getAnalytics } from "@/lib/store";
import { Users, MessageSquare, ArrowUpRight, Plus, Database, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { Product, Lead, Conversation } from "@/lib/types";

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); setProducts(getProducts()); setLeads(getLeads()); setConversations(getConversations()); }, []);

  if (!mounted) return null;

  const analytics = getAnalytics();
  const activeProducts = products.filter(p => p.status === "active").length;
  const stats = [
    { label: "Products in Brain", value: activeProducts.toString(), delta: `${products.length} total`, icon: Database, color: "text-blue-400" },
    { label: "Inbox Messages", value: conversations.length.toString(), delta: conversations.length > 0 ? `${analytics.ai_handled_count} AI Handled` : "0 Automated", icon: MessageSquare, color: "text-emerald-400" },
    { label: "Hot Leads", value: leads.filter(l => l.buying_intent === "hot").length.toString(), delta: `${leads.length} Total Captured`, icon: Users, color: "text-amber-400" },
    { label: "Needs Attention", value: analytics.fallback_count.toString(), delta: "Human intervention needed", icon: AlertCircle, color: "text-rose-400" },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</span>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-3xl font-bold">{s.value}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{s.delta}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Products */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Product Knowledge Brain</CardTitle>
            <Link href="/dashboard/products/new"><Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Add Product</Button></Link>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No products yet. Train your AI employee!</p>
                <Link href="/dashboard/products/new"><Button className="mt-4" size="sm">Add First Product</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {products.slice(0, 4).map((product) => (
                  <Link key={product.id} href={`/dashboard/products/${product.id}`} className="flex items-center justify-between p-3 rounded-lg border border-border/30 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-zinc-800 flex items-center justify-center text-sm font-bold border border-border/50">
                        {product.image_urls?.[0] ? <img src={product.image_urls[0]} alt="" className="w-full h-full object-cover rounded-md" /> : <Database className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div>
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{product.price}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${product.stock_status === "in_stock" ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-700 text-zinc-400"}`}>
                        {product.stock_status.replace('_', ' ')}
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card className="border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Leads</CardTitle>
            <Link href="/dashboard/leads"><Button size="sm" variant="outline">View All</Button></Link>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No leads captured yet. Deploy an agent to start!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leads.slice(0, 5).map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg border border-border/30">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold">{lead.name[0]}</div>
                      <div>
                        <div className="font-medium text-sm">{lead.name}</div>
                        <div className="text-xs text-muted-foreground">{lead.email}</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{lead.product_interest || "—"}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card className="border-border/50">
        <CardHeader><CardTitle className="text-base">Conversation Activity (Last 7 Days)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2 items-end h-40">
            {analytics.conversations_over_time.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-sm bg-gradient-to-t from-zinc-700 to-zinc-500 transition-all hover:from-white/20 hover:to-white/10" style={{ height: `${Math.max(10, (d.count / 30) * 100)}%` }} />
                <span className="text-[10px] text-muted-foreground">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
