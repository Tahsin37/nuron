"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { initStore } from "@/lib/store";
import { Zap, LayoutDashboard, Database, Users, BarChart3, Inbox, Settings, LogOut, ChevronLeft, ChevronRight, Search, Bell, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { id: "inbox", label: "Inbox", icon: Inbox, href: "/dashboard/conversations" },
  { id: "products", label: "Products", icon: Database, href: "/dashboard/products" },
  { id: "leads", label: "Leads", icon: Users, href: "/dashboard/leads" },
  { id: "analytics", label: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
  { id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, needsOnboarding, signOut } = useAuth();
  const [storeReady, setStoreReady] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
    if (!isLoading && isAuthenticated && needsOnboarding) router.push("/login");
  }, [isLoading, isAuthenticated, needsOnboarding, router]);

  useEffect(() => {
    if (user && !storeReady) {
      initStore().then(() => {
        setStoreReady(true);
      });
    }
  }, [user, storeReady]);

  if (isLoading || !storeReady) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="flex flex-col items-center gap-4 text-muted-foreground"><div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center animate-pulse"><Zap className="h-5 w-5 text-black" /></div><span className="text-sm">Loading your workspace...</span></div></div>;
  }

  if (!isAuthenticated) return null;

  const activeItem = navItems.find(item => pathname === item.href || pathname.startsWith(item.href + "/"));

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar Overlay for Mobile */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}
      
      {/* Sidebar */}
      <aside className={cn("fixed left-0 top-0 bottom-0 z-50 flex flex-col border-r border-border bg-card transition-transform duration-300 md:translate-x-0", mobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0", collapsed ? "md:w-16" : "md:w-64")}>
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2 flex-1" onClick={() => setMobileMenuOpen(false)}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shrink-0"><Zap className="h-4 w-4 text-black" /></div>
            {(!collapsed || mobileMenuOpen) && <span className="text-lg font-semibold tracking-tight">Nuron AI</span>}
          </Link>
          {mobileMenuOpen && (
            <button onClick={() => setMobileMenuOpen(false)} className="md:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link key={item.id} href={item.href} onClick={() => setMobileMenuOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all", isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground", (collapsed && !mobileMenuOpen) && "justify-center px-2")} title={collapsed ? item.label : undefined}>
                <item.icon className="h-5 w-5 shrink-0" />
                {(!collapsed || mobileMenuOpen) && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-border p-2 space-y-1">
          <button onClick={() => setCollapsed(!collapsed)} className="hidden md:flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground w-full transition-all" title="Toggle sidebar">
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <><ChevronLeft className="h-5 w-5" /><span>Collapse</span></>}
          </button>
          {user && (
            <div className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5", (collapsed && !mobileMenuOpen) && "justify-center px-2")}>
              <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold shrink-0">{(user.full_name || user.username)[0]?.toUpperCase()}</div>
              {(!collapsed || mobileMenuOpen) && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user.full_name || user.username}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email || user.username}</div>
                </div>
              )}
              {(!collapsed || mobileMenuOpen) && (
                <button onClick={signOut} className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground" title="Sign out">
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className={cn("flex-1 transition-all duration-300 flex flex-col min-h-screen", collapsed ? "md:ml-16" : "md:ml-64")}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 rounded-lg hover:bg-accent text-muted-foreground">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold truncate">{activeItem?.label || "Dashboard"}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder="Search..." className="h-9 w-64 rounded-lg border border-border bg-card pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/20" />
            </div>
            <button className="relative p-2 rounded-lg hover:bg-accent text-muted-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-400" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
