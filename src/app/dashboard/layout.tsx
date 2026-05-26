"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { initStore } from "@/lib/store";
import {
  Zap, LayoutDashboard, Database, Users, BarChart3, Inbox, LogOut,
  ChevronLeft, ChevronRight, Search, Menu, X, Radio,
  Settings, Brain, Key, UserCircle, ChevronDown, TestTube2, Command
} from "lucide-react";
import { CommandPalette } from "@/components/ui/command-palette";

interface NavItem {
  id: string;
  label: string;
  icon: any;
  href: string;
  children?: { id: string; label: string; icon: any; href: string }[];
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { id: "inbox", label: "Inbox", icon: Inbox, href: "/dashboard/conversations" },
  { id: "products", label: "Products", icon: Database, href: "/dashboard/products" },
  { id: "leads", label: "Leads", icon: Users, href: "/dashboard/leads" },
  { id: "channels", label: "Channels", icon: Radio, href: "/dashboard/channels" },
  { id: "analytics", label: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
  { id: "playground", label: "Playground", icon: TestTube2, href: "/dashboard/playground" },
  {
    id: "settings", label: "Settings", icon: Settings, href: "/dashboard/settings",
    children: [
      { id: "settings-general", label: "General", icon: UserCircle, href: "/dashboard/settings" },
      { id: "settings-ai", label: "AI & Training", icon: Brain, href: "/dashboard/settings/ai" },
      { id: "settings-keys", label: "API Keys", icon: Key, href: "/dashboard/settings/keys" },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [inboxBadge, setInboxBadge] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, needsOnboarding, signOut } = useAuth();
  const [storeReady, setStoreReady] = useState(false);

  // Auto-expand settings if we're on a settings page
  useEffect(() => {
    if (pathname.startsWith("/dashboard/settings")) setSettingsOpen(true);
  }, [pathname]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/login");
    if (!isLoading && isAuthenticated && needsOnboarding) router.push("/login");
  }, [isLoading, isAuthenticated, needsOnboarding, router]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (user && !storeReady) {
      initStore().then(() => setStoreReady(true));
    }
  }, [user, storeReady]);

  useEffect(() => {
    if (!user?.uuid) return;
    const fetchBadge = () => {
      fetch(`/api/conversations?user_id=${user.uuid}`).then(r => r.json()).then(d => {
        const count = (d.conversations || []).filter((c: any) => c.status === "needs_human").length;
        setInboxBadge(count);
      }).catch(() => {});
    };
    fetchBadge();
    const t = setInterval(fetchBadge, 30000);
    return () => clearInterval(t);
  }, [user?.uuid]);

  if (isLoading || !storeReady) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="flex flex-col items-center gap-4 text-muted-foreground"><div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center animate-pulse"><Zap className="h-5 w-5 text-black" /></div><span className="text-sm">Loading your workspace...</span></div></div>;
  }
  if (!isAuthenticated) return null;

  // Find active label for top bar
  let activeLabel = "Dashboard";
  for (const item of navItems) {
    if (item.children) {
      const child = item.children.find(c => pathname === c.href);
      if (child) { activeLabel = child.label; break; }
      if (pathname.startsWith(item.href)) { activeLabel = item.label; }
    } else if (pathname === item.href || pathname.startsWith(item.href + "/")) {
      activeLabel = item.label;
    }
  }

  const isExpanded = !collapsed || mobileMenuOpen;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 bottom-0 z-50 flex flex-col border-r border-border/60 bg-card transition-all duration-300 md:translate-x-0",
        mobileMenuOpen ? "translate-x-0 w-[260px]" : "-translate-x-full md:translate-x-0",
        collapsed ? "md:w-[60px]" : "md:w-[260px]"
      )}>
        {/* Logo */}
        <div className="flex items-center h-14 px-4 border-b border-border/40">
          <Link href="/dashboard" className="flex items-center gap-2.5 flex-1" onClick={() => setMobileMenuOpen(false)}>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shrink-0"><Zap className="h-3.5 w-3.5 text-black" /></div>
            {isExpanded && <span className="text-[15px] font-semibold tracking-tight">Nuron AI</span>}
          </Link>
          {mobileMenuOpen && (
            <button onClick={() => setMobileMenuOpen(false)} className="md:hidden p-1.5 -mr-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-accent/50">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const badge = item.id === "inbox" ? inboxBadge : 0;
            const hasChildren = item.children && item.children.length > 0;
            const isSettingsGroup = item.id === "settings";

            if (hasChildren && isExpanded) {
              return (
                <div key={item.id}>
                  {/* Parent button */}
                  <button
                    onClick={() => {
                      setSettingsOpen(!settingsOpen);
                      if (!settingsOpen) router.push(item.href);
                    }}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all w-full",
                      isActive ? "text-foreground" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200", settingsOpen && "rotate-180")} />
                  </button>
                  {/* Children */}
                  <div className={cn(
                    "overflow-hidden transition-all duration-200",
                    settingsOpen ? "max-h-40 opacity-100 mt-0.5" : "max-h-0 opacity-0"
                  )}>
                    <div className="ml-3 pl-3 border-l border-border/30 space-y-0.5">
                      {item.children!.map((child) => {
                        const childActive = pathname === child.href;
                        return (
                          <Link
                            key={child.id}
                            href={child.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-all",
                              childActive
                                ? "bg-accent text-foreground"
                                : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
                            )}
                          >
                            <child.icon className="h-3.5 w-3.5 shrink-0" />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            // Regular nav item
            return (
              <Link
                key={item.id}
                href={hasChildren ? item.href : item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all",
                  isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                  !isExpanded && "justify-center px-2"
                )}
                title={!isExpanded ? item.label : undefined}
              >
                <div className="relative shrink-0">
                  <item.icon className="h-[18px] w-[18px]" />
                  {badge > 0 && <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-rose-500 text-[7px] text-white flex items-center justify-center font-bold">{badge > 9 ? "9+" : badge}</span>}
                </div>
                {isExpanded && <span className="flex-1">{item.label}</span>}
                {isExpanded && badge > 0 && (
                  <span className="text-[10px] bg-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded-full font-medium">{badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom User */}
        <div className="border-t border-border/40 p-2">
          <button onClick={() => setCollapsed(!collapsed)} className="hidden md:flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] text-muted-foreground hover:bg-accent/40 hover:text-foreground w-full transition-all">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Collapse</span></>}
          </button>
          {user && (
            <div className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2", !isExpanded && "justify-center px-2")}>
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">{(user.full_name || user.username)[0]?.toUpperCase()}</div>
              {isExpanded && (
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{user.full_name || user.username}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{user.email || "Free plan"}</div>
                </div>
              )}
              {isExpanded && (
                <button onClick={signOut} className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground" title="Sign out">
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className={cn("flex-1 transition-all duration-300 flex flex-col min-h-screen", collapsed ? "md:ml-[60px]" : "md:ml-[260px]")}>
        <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-xl px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-accent text-muted-foreground">
              <Menu className="h-4 w-4" />
            </button>
            <h1 className="text-[13px] font-medium text-muted-foreground">{activeLabel}</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Search / Command Palette trigger */}
            <button
              onClick={() => setCmdOpen(true)}
              className="hidden lg:flex items-center gap-2 h-8 w-52 rounded-[7px] border border-white/[0.07] bg-white/[0.03] px-3 text-left hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-150 group"
            >
              <Search className="h-3.5 w-3.5 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
              <span className="flex-1 text-[12px] text-gray-600 group-hover:text-gray-500 transition-colors">Search...</span>
              <div className="flex items-center gap-0.5">
                <kbd className="text-[10px] text-gray-700 bg-white/[0.04] border border-white/[0.06] rounded-[4px] px-1.5 py-0.5 font-mono leading-none flex items-center gap-0.5">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              </div>
            </button>
            {/* Mobile search trigger */}
            <button onClick={() => setCmdOpen(true)} className="lg:hidden p-1.5 rounded-lg hover:bg-white/[0.05] text-gray-500 hover:text-gray-300 transition-colors">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </header>
        <main className="p-4 sm:p-6 flex-1">{children}</main>
      </div>

      {/* Command Palette */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}
