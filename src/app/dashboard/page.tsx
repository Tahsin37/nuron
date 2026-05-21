"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getProducts } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { Users, MessageSquare, ArrowUpRight, Plus, Database, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { Product } from "@/lib/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [leadCount, setLeadCount] = useState(0);
  const [hotLeadCount, setHotLeadCount] = useState(0);
  const [convCount, setConvCount] = useState(0);
  const [needsHumanCount, setNeedsHumanCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProducts(getProducts());
    if (!user?.uuid) return;
    // Fetch real stats from Supabase
    fetch(`/api/leads?user_id=${user.uuid}`).then(r => r.json()).then(d => {
      const leads = d.leads || [];
      setLeadCount(leads.length);
      setHotLeadCount(leads.filter((l: any) => l.buying_intent === "hot").length);
    }).catch(() => {});
    fetch(`/api/conversations?user_id=${user.uuid}`).then(r => r.json()).then(d => {
      const convs = d.conversations || [];
      setConvCount(convs.length);
      setNeedsHumanCount(convs.filter((c: any) => c.status === "needs_human").length);
    }).catch(() => {});
  }, [user?.uuid]);

  if (!mounted) return null;

  const activeProducts = products.filter(p => p.status === "active").length;
  const stats = [
    { label: "Products in Brain", value: activeProducts.toString(), delta: `${products.length} total`, icon: Database, color: "text-blue-400" },
    { label: "Conversations", value: convCount.toString(), delta: convCount > 0 ? "From all channels" : "No messages yet", icon: MessageSquare, color: "text-emerald-400" },
    { label: "Hot Leads", value: hotLeadCount.toString(), delta: `${leadCount} Total Captured`, icon: Users, color: "text-amber-400" },
    { label: "Needs Attention", value: needsHumanCount.toString(), delta: "Human intervention needed", icon: AlertCircle, color: "text-rose-400" },
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
            {leadCount === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No leads captured yet</p>
                <p className="text-xs mt-1">Leads appear when customers show buying intent</p>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-4xl font-bold">{leadCount}</div>
                <p className="text-sm text-muted-foreground mt-1">leads captured • {hotLeadCount} hot</p>
                <Link href="/dashboard/leads"><Button size="sm" variant="outline" className="mt-3">View All Leads <ArrowUpRight className="h-3 w-3 ml-1" /></Button></Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <Card className="border-border/50">
        <CardHeader><CardTitle className="text-base">Activity Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-zinc-900/50">
              <div className="text-2xl font-bold text-blue-400">{products.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Products</p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-900/50">
              <div className="text-2xl font-bold text-emerald-400">{convCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Conversations</p>
            </div>
            <div className="p-4 rounded-lg bg-zinc-900/50">
              <div className="text-2xl font-bold text-amber-400">{leadCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Leads</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
