"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getProducts } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import {
  Users, MessageSquare, Plus, Database, Zap, CheckCircle2,
  Bot, Clock, TrendingUp, Inbox, ArrowRight, ArrowUpRight,
  Activity, AlertTriangle, Sparkles
} from "lucide-react";
import Link from "next/link";
import type { Product } from "@/lib/types";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [leadCount, setLeadCount] = useState(0);
  const [hotLeadCount, setHotLeadCount] = useState(0);
  const [convCount, setConvCount] = useState(0);
  const [needsHumanCount, setNeedsHumanCount] = useState(0);
  const [recentConvs, setRecentConvs] = useState<any[]>([]);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [hasBots, setHasBots] = useState(false);
  const [hasContext, setHasContext] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProducts(getProducts());
    if (!user?.uuid) return;
    fetch(`/api/leads?user_id=${user.uuid}`).then(r => r.json()).then(d => {
      const leads = d.leads || [];
      setLeadCount(leads.length);
      setHotLeadCount(leads.filter((l: any) => l.buying_intent === "hot").length);
      setRecentLeads(leads.slice(0, 4));
    }).catch(() => {});
    fetch(`/api/conversations?user_id=${user.uuid}`).then(r => r.json()).then(d => {
      const convs = d.conversations || [];
      setConvCount(convs.length);
      setNeedsHumanCount(convs.filter((c: any) => c.status === "needs_human").length);
      setRecentConvs(convs.slice(0, 5));
    }).catch(() => {});
    fetch(`/api/settings/connect?user_id=${user.uuid}`).then(r => r.json()).then(d => {
      if (d.bots?.length > 0) setHasBots(true);
      if (d.settings?.business_description) setHasContext(true);
    }).catch(() => {});
  }, [user?.uuid]);

  if (!mounted) return null;

  const activeProducts = products.filter(p => p.status === "active").length;
  const setupSteps = [
    { done: activeProducts > 0, label: "Products added", href: "/dashboard/products/new" },
    { done: hasBots, label: "Bot connected", href: "/dashboard/settings/keys" },
    { done: hasContext, label: "AI trained", href: "/dashboard/settings/ai" },
  ];
  const setupComplete = setupSteps.every(s => s.done);
  const setupCount = setupSteps.filter(s => s.done).length;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const activities: { icon: any; text: string; time: string; color: string; bg: string }[] = [];
  recentConvs.slice(0, 4).forEach(c => {
    activities.push({ icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10", text: `${c.visitor_name || "Customer"} started a conversation`, time: c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "" });
  });
  recentLeads.slice(0, 2).forEach(l => {
    activities.push({ icon: Users, color: "text-amber-400", bg: "bg-amber-500/10", text: `New ${l.buying_intent || "warm"} lead: ${l.name}`, time: l.created_at ? new Date(l.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "" });
  });

  const aiResolution = convCount > 0 ? Math.round(((convCount - needsHumanCount) / convCount) * 100) : 0;
  const leadConversion = leadCount > 0 && convCount > 0 ? Math.round((leadCount / convCount) * 100) : 0;

  return (
    <div className="max-w-[1200px] mx-auto space-y-0 pb-12">

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  WELCOME HEADER                                        */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10">
        <div>
          <p className="text-[13px] text-gray-500 mb-1 font-medium">{today}</p>
          <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-white leading-tight">
            {getGreeting()}, {user?.full_name?.split(" ")[0] || user?.username}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/products/new">
            <button className="h-9 px-4 rounded-[8px] border border-white/[0.08] bg-white/[0.03] text-[13px] font-medium text-gray-300 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.15] active:scale-[0.97] transition-all duration-150 flex items-center gap-2">
              <Plus className="h-3.5 w-3.5" /> Add Product
            </button>
          </Link>
          <Link href="/dashboard/conversations">
            <button className="h-9 px-4 rounded-[8px] bg-white text-black text-[13px] font-semibold hover:bg-gray-100 active:scale-[0.97] transition-all duration-150 flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]">
              <Inbox className="h-3.5 w-3.5" /> Open Inbox
            </button>
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  SETUP BANNER (with proper bottom margin)              */}
      {/* ═══════════════════════════════════════════════════════ */}
      {!setupComplete && (
        <div className="mb-10">
          <div className="rounded-[10px] border border-white/[0.06] bg-[#0a0a0a] overflow-hidden">
            {/* Top gradient line */}
            <div className="h-[2px] bg-gradient-to-r from-violet-500/0 via-violet-500/60 to-violet-500/0" />
            <div className="p-6 sm:p-7">
              <div className="flex items-start sm:items-center justify-between gap-6">
                <div className="flex items-start gap-5">
                  <div className="h-12 w-12 rounded-[10px] bg-gradient-to-br from-violet-500/15 to-indigo-500/15 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-white">Complete your setup</h3>
                    <p className="text-[13px] text-gray-500 mt-0.5">Finish these steps to go live with your AI bot.</p>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4">
                      {setupSteps.map(s => (
                        <Link key={s.label} href={s.href}>
                          <span className={`text-[13px] flex items-center gap-2 transition-colors duration-150 ${s.done ? "text-emerald-400" : "text-gray-600 hover:text-gray-400"}`}>
                            {s.done
                              ? <CheckCircle2 className="h-[16px] w-[16px]" />
                              : <div className="h-[16px] w-[16px] rounded-full border-[1.5px] border-gray-700" />
                            }
                            {s.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="relative h-[52px] w-[52px]">
                    <svg className="h-[52px] w-[52px] -rotate-90" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
                      <circle cx="20" cy="20" r="16" fill="none" stroke="url(#progress-gradient)" strokeWidth="3" strokeDasharray={`${(setupCount / 3) * 100.5} 100.5`} strokeLinecap="round" className="transition-all duration-700 ease-out" />
                      <defs>
                        <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#6366F1" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-white">{setupCount}<span className="text-gray-600">/3</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  STATS                                                 */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: "Products", value: activeProducts, icon: Database, color: "text-blue-400", href: "/dashboard/products" },
          { label: "Conversations", value: convCount, icon: MessageSquare, color: "text-emerald-400", href: "/dashboard/conversations" },
          { label: "Hot Leads", value: hotLeadCount, icon: TrendingUp, color: "text-amber-400", href: "/dashboard/leads" },
          { label: "Needs Human", value: needsHumanCount, icon: AlertTriangle, color: "text-rose-400", href: "/dashboard/conversations" },
        ].map((s) => (
          <Link key={s.label} href={s.href}>
            <div className="rounded-[10px] border border-white/[0.06] bg-[#0a0a0a] p-5 sm:p-6 hover:border-white/[0.12] hover:bg-[#0c0c0c] transition-all duration-200 cursor-pointer group h-full">
              <div className="flex items-center justify-between mb-4">
                <s.icon className={`h-[18px] w-[18px] ${s.color} opacity-80`} />
                <ArrowUpRight className="h-3.5 w-3.5 text-gray-800 group-hover:text-gray-500 transition-colors duration-200" />
              </div>
              <div className="text-[32px] font-semibold tracking-[-0.03em] text-white leading-none">{s.value}</div>
              <p className="text-[13px] text-gray-500 mt-2">{s.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  METRICS ROW                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-8">
        {[
          { label: "Avg. Response", value: "< 2s", sub: "AI latency", icon: Clock, color: "text-emerald-400" },
          { label: "AI Resolution", value: `${aiResolution}%`, sub: "Without human", icon: Bot, color: "text-blue-400" },
          { label: "Lead Rate", value: `${leadConversion}%`, sub: "Conv → Lead", icon: TrendingUp, color: "text-violet-400" },
        ].map(m => (
          <div key={m.label} className="rounded-[10px] border border-white/[0.06] bg-[#0a0a0a] p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-[8px] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
              <m.icon className={`h-[18px] w-[18px] ${m.color}`} />
            </div>
            <div>
              <div className="text-xl font-semibold tracking-[-0.02em] text-white">{m.value}</div>
              <p className="text-[12px] text-gray-600 mt-0.5">{m.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  CONTENT: Products + Leads | Activity                  */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="grid gap-5 lg:grid-cols-5">

        {/* LEFT: Products + Leads */}
        <div className="lg:col-span-3 space-y-5">

          {/* ─── Product Catalog ─── */}
          <div className="rounded-[10px] border border-white/[0.06] bg-[#0a0a0a] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
              <div className="flex items-center gap-2.5">
                <Database className="h-4 w-4 text-gray-500" />
                <span className="text-[13px] font-medium text-gray-200">Product Catalog</span>
                {activeProducts > 0 && (
                  <span className="text-[11px] text-gray-600 bg-white/[0.04] px-2 py-0.5 rounded-[5px]">{activeProducts}</span>
                )}
              </div>
              <Link href="/dashboard/products/new">
                <button className="text-[12px] text-gray-600 hover:text-white transition-colors duration-150 flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Add
                </button>
              </Link>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="h-10 w-10 rounded-[8px] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                  <Database className="h-4 w-4 text-gray-700" />
                </div>
                <p className="text-[13px] font-medium text-gray-400">No products yet</p>
                <p className="text-[12px] text-gray-600 mt-1">Add your first product to get started.</p>
                <Link href="/dashboard/products/new">
                  <button className="mt-5 h-8 px-4 rounded-[7px] bg-white text-black text-[12px] font-semibold hover:bg-gray-100 active:scale-[0.97] transition-all duration-150 inline-flex items-center gap-1.5">
                    <Plus className="h-3 w-3" /> Add Product
                  </button>
                </Link>
              </div>
            ) : (
              <>
                {products.slice(0, 5).map(p => (
                  <Link
                    key={p.id}
                    href={`/dashboard/products/${p.id}`}
                    className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.02] transition-colors duration-150 group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-10 w-10 rounded-[8px] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center overflow-hidden shrink-0">
                        {p.image_urls?.[0]
                          ? <img src={p.image_urls[0]} alt="" className="w-full h-full object-cover" />
                          : <Database className="h-3.5 w-3.5 text-gray-700" />
                        }
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-gray-200 group-hover:text-white transition-colors">{p.name}</div>
                        <div className="text-[12px] text-gray-600 mt-0.5">{p.price}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-[3px] rounded-[5px] ${
                      p.stock_status === "in_stock"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-white/[0.04] text-gray-600"
                    }`}>
                      {p.stock_status === "in_stock" ? "In Stock" : "Out"}
                    </span>
                  </Link>
                ))}
                {products.length > 5 && (
                  <Link href="/dashboard/products" className="flex items-center justify-center gap-1.5 py-3.5 text-[12px] text-gray-600 hover:text-gray-300 transition-colors duration-150 border-t border-white/[0.04]">
                    View all {products.length} <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </>
            )}
          </div>

          {/* ─── Recent Leads ─── */}
          <div className="rounded-[10px] border border-white/[0.06] bg-[#0a0a0a] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
              <div className="flex items-center gap-2.5">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-[13px] font-medium text-gray-200">Recent Leads</span>
                {leadCount > 0 && (
                  <span className="text-[11px] text-gray-600 bg-white/[0.04] px-2 py-0.5 rounded-[5px]">{leadCount}</span>
                )}
              </div>
              <Link href="/dashboard/leads">
                <button className="text-[12px] text-gray-600 hover:text-white transition-colors duration-150 flex items-center gap-1">
                  View All <ArrowRight className="h-3 w-3" />
                </button>
              </Link>
            </div>

            {leadCount === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="h-10 w-10 rounded-[8px] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                  <Users className="h-4 w-4 text-gray-700" />
                </div>
                <p className="text-[13px] font-medium text-gray-400">No leads yet</p>
                <p className="text-[12px] text-gray-600 mt-1">Leads appear when customers show buying intent.</p>
              </div>
            ) : (
              <>
                {recentLeads.map((l, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.02] transition-colors duration-150">
                    <div className="flex items-center gap-3.5">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-b from-gray-700 to-gray-800 flex items-center justify-center text-[12px] font-semibold text-gray-300 shrink-0">
                        {(l.name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-gray-200">{l.name}</div>
                        <div className="text-[12px] text-gray-600 truncate max-w-[200px] mt-0.5">{l.product_interest || l.phone || "—"}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-[3px] rounded-[5px] ${
                      l.buying_intent === "hot"
                        ? "bg-red-500/10 text-red-400"
                        : l.buying_intent === "warm"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-white/[0.04] text-gray-600"
                    }`}>
                      {l.buying_intent || "cold"}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Activity */}
        <div className="lg:col-span-2">
          <div className="rounded-[10px] border border-white/[0.06] bg-[#0a0a0a] overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
              <div className="flex items-center gap-2.5">
                <Activity className="h-4 w-4 text-gray-500" />
                <span className="text-[13px] font-medium text-gray-200">Activity</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-[6px] w-[6px] rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-emerald-400 font-medium">Live</span>
              </div>
            </div>

            <div className="flex-1">
              {activities.length === 0 ? (
                <div className="text-center py-24 px-6">
                  <div className="h-10 w-10 rounded-[8px] bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-4 w-4 text-gray-700" />
                  </div>
                  <p className="text-[13px] font-medium text-gray-400">No activity yet</p>
                  <p className="text-[12px] text-gray-600 mt-1">Connect a bot to start seeing events.</p>
                </div>
              ) : (
                <div>
                  {activities.map((a, i) => (
                    <div key={i} className="flex items-start gap-3.5 px-5 py-4 border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.02] transition-colors duration-150">
                      <div className={`h-9 w-9 rounded-[8px] ${a.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <a.icon className={`h-4 w-4 ${a.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-gray-300 leading-relaxed">{a.text}</p>
                        <p className="text-[11px] text-gray-700 mt-1.5 tabular-nums">{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
