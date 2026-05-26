"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, LayoutDashboard, Database, Users, Inbox, BarChart3, Radio,
  Settings, Brain, Key, TestTube2, Plus, UserCircle, LogOut,
  ArrowRight, Package, MessageSquare, Zap, Command
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  iconColor?: string;
  group: string;
  action: () => void;
  keywords?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const go = useCallback((href: string) => {
    router.push(href);
    onClose();
  }, [router, onClose]);

  const commands: CommandItem[] = [
    // Navigation
    { id: "home", label: "Dashboard", description: "Overview & analytics", icon: LayoutDashboard, group: "Navigate", action: () => go("/dashboard"), keywords: "home overview" },
    { id: "inbox", label: "Inbox", description: "View conversations", icon: Inbox, group: "Navigate", action: () => go("/dashboard/conversations"), keywords: "messages chat" },
    { id: "products", label: "Products", description: "Manage your catalog", icon: Database, group: "Navigate", action: () => go("/dashboard/products"), keywords: "catalog items" },
    { id: "leads", label: "Leads", description: "Track potential customers", icon: Users, group: "Navigate", action: () => go("/dashboard/leads"), keywords: "customers crm" },
    { id: "channels", label: "Channels", description: "WhatsApp, Telegram, Messenger", icon: Radio, group: "Navigate", action: () => go("/dashboard/channels"), keywords: "connect bots integrations" },
    { id: "analytics", label: "Analytics", description: "Performance & metrics", icon: BarChart3, group: "Navigate", action: () => go("/dashboard/analytics"), keywords: "stats reports" },
    { id: "playground", label: "Bot Playground", description: "Test your AI in a sandbox", icon: TestTube2, group: "Navigate", action: () => go("/dashboard/playground"), keywords: "test debug simulate" },
    // Settings
    { id: "settings", label: "General Settings", description: "Profile & account", icon: UserCircle, group: "Settings", action: () => go("/dashboard/settings"), keywords: "profile account" },
    { id: "settings-ai", label: "AI & Training", description: "Business context & knowledge base", icon: Brain, group: "Settings", action: () => go("/dashboard/settings/ai"), keywords: "train knowledge bot prompt" },
    { id: "settings-keys", label: "API Keys", description: "Connect Puter, Groq & Telegram", icon: Key, group: "Settings", action: () => go("/dashboard/settings/keys"), keywords: "puter groq telegram token secret" },
    // Actions
    { id: "new-product", label: "Add New Product", description: "Create a product listing", icon: Plus, iconColor: "text-emerald-400", group: "Actions", action: () => go("/dashboard/products/new"), keywords: "create product add item" },
    { id: "new-product-import", label: "Import Products", description: "Bulk import from CSV or Google Sheets", icon: Package, iconColor: "text-blue-400", group: "Actions", action: () => go("/dashboard/products/import"), keywords: "csv bulk sheet upload" },
    { id: "open-playground", label: "Test Bot Now", description: "Open the sandbox playground", icon: Zap, iconColor: "text-violet-400", group: "Actions", action: () => go("/dashboard/playground"), keywords: "test simulate sandbox" },
    // Account
    { id: "sign-out", label: "Sign Out", description: `Signed in as ${user?.email || ""}`, icon: LogOut, iconColor: "text-rose-400", group: "Account", action: () => { signOut(); onClose(); }, keywords: "logout exit" },
  ];

  // Filter by query
  const filtered = query.trim() === ""
    ? commands
    : commands.filter(cmd => {
        const q = query.toLowerCase();
        return (
          cmd.label.toLowerCase().includes(q) ||
          (cmd.description?.toLowerCase().includes(q) ?? false) ||
          (cmd.keywords?.toLowerCase().includes(q) ?? false) ||
          cmd.group.toLowerCase().includes(q)
        );
      });

  // Group results
  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    if (!acc[cmd.group]) acc[cmd.group] = [];
    acc[cmd.group].push(cmd);
    return acc;
  }, {});

  // Flat list for keyboard navigation
  const flatList = Object.values(groups).flat();

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    const item = listRef.current?.querySelector(`[data-idx="${selected}"]`);
    item?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected(i => Math.min(i + 1, flatList.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelected(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); flatList[selected]?.action(); }
    if (e.key === "Escape") { onClose(); }
  };

  if (!open) return null;

  let flatIdx = 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-[560px] mx-4 rounded-[14px] border border-white/[0.08] bg-[#111111] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_32px_64px_rgba(0,0,0,0.7)] overflow-hidden">

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-white/[0.06]">
          <Search className="h-4 w-4 text-gray-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, actions, settings..."
            className="flex-1 h-14 bg-transparent text-[14px] text-gray-100 placeholder:text-gray-600 focus:outline-none"
          />
          <kbd className="hidden sm:flex items-center gap-1 text-[11px] text-gray-600 bg-white/[0.04] border border-white/[0.06] rounded-[5px] px-2 py-1 font-mono shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[380px] overflow-y-auto overscroll-contain py-2">
          {flatList.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-[13px] text-gray-600">No results for <span className="text-gray-400">&ldquo;{query}&rdquo;</span></p>
            </div>
          ) : (
            Object.entries(groups).map(([group, items]) => (
              <div key={group} className="mb-1">
                <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-700">{group}</p>
                {items.map(cmd => {
                  const idx = flatIdx++;
                  const isSelected = selected === idx;
                  return (
                    <button
                      key={cmd.id}
                      data-idx={idx}
                      onClick={cmd.action}
                      onMouseEnter={() => setSelected(idx)}
                      className={cn(
                        "w-full flex items-center gap-3.5 px-4 py-2.5 text-left transition-colors duration-100",
                        isSelected ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"
                      )}
                    >
                      <div className={cn(
                        "h-9 w-9 rounded-[8px] bg-white/[0.05] border border-white/[0.06] flex items-center justify-center shrink-0",
                        isSelected && "bg-white/[0.08] border-white/[0.1]"
                      )}>
                        <cmd.icon className={cn("h-[16px] w-[16px]", cmd.iconColor || "text-gray-400")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[13px] font-medium leading-tight", isSelected ? "text-white" : "text-gray-200")}>{cmd.label}</p>
                        {cmd.description && (
                          <p className="text-[11px] text-gray-600 mt-0.5 truncate">{cmd.description}</p>
                        )}
                      </div>
                      {isSelected && (
                        <ArrowRight className="h-3.5 w-3.5 text-gray-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/[0.04] bg-white/[0.01]">
          <div className="flex items-center gap-4 text-[11px] text-gray-700">
            <span className="flex items-center gap-1.5"><kbd className="bg-white/[0.05] border border-white/[0.06] rounded-[4px] px-1.5 py-0.5 font-mono">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1.5"><kbd className="bg-white/[0.05] border border-white/[0.06] rounded-[4px] px-1.5 py-0.5 font-mono">↵</kbd> open</span>
            <span className="flex items-center gap-1.5"><kbd className="bg-white/[0.05] border border-white/[0.06] rounded-[4px] px-1.5 py-0.5 font-mono">ESC</kbd> close</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-700">
            <Command className="h-3 w-3" />
            <span>K</span>
          </div>
        </div>
      </div>
    </div>
  );
}
