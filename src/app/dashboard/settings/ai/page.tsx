"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast-provider";
import {
  Brain, BookOpen, Check, Loader2,
  Plus, X, FileText, HelpCircle, ScrollText, Trash2,
  Sparkles, ChevronDown, ChevronRight, ToggleLeft, ToggleRight,
  MessageSquare, GraduationCap, Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KBEntry { id: string; title: string; content: string; category: string; is_active: boolean; }

const CATEGORIES = [
  { value: "faq", label: "FAQ", icon: HelpCircle },
  { value: "policy", label: "Policy", icon: ScrollText },
  { value: "product_info", label: "Product Info", icon: FileText },
  { value: "general", label: "General", icon: BookOpen },
];

export default function AISettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [businessDescription, setBusinessDescription] = useState("");
  const [trainingData, setTrainingData] = useState("");
  const [welcomeMsg, setWelcomeMsg] = useState("");
  const [savingCtx, setSavingCtx] = useState(false);

  const [kbEntries, setKbEntries] = useState<KBEntry[]>([]);
  const [kbLoading, setKbLoading] = useState(true);
  const [showKbForm, setShowKbForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [kbForm, setKbForm] = useState({ title: "", content: "", category: "general" });
  const [savingKb, setSavingKb] = useState(false);
  const [expandedKb, setExpandedKb] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uuid) return;
    fetch(`/api/settings/connect?user_id=${user.uuid}`)
      .then(r => r.json())
      .then(data => {
        if (data.settings) {
          if (data.settings.business_description) setBusinessDescription(data.settings.business_description);
          if (data.settings.training_data) setTrainingData(data.settings.training_data);
          if (data.settings.welcome_message) setWelcomeMsg(data.settings.welcome_message);
        }
      }).catch(() => {});
  }, [user?.uuid]);

  useEffect(() => {
    if (!user?.uuid) return;
    fetch(`/api/knowledge?user_id=${user.uuid}`)
      .then(r => r.json())
      .then(d => setKbEntries(d.entries || []))
      .catch(() => {})
      .finally(() => setKbLoading(false));
  }, [user?.uuid]);

  const handleSaveContext = async () => {
    if (!user?.uuid) return;
    setSavingCtx(true);
    try {
      await fetch("/api/settings/connect", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.uuid,
          business_description: businessDescription,
          training_data: trainingData,
          welcome_message: welcomeMsg || undefined,
        }),
      });
      toast("AI context saved");
    } catch { toast("Failed to save", "error"); }
    setSavingCtx(false);
  };

  const handleSaveKb = async () => {
    if (!user?.uuid || !kbForm.title.trim() || !kbForm.content.trim()) return;
    setSavingKb(true);
    const res = await fetch("/api/knowledge", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.uuid, ...kbForm, ...(editId ? { id: editId } : {}) }),
    }).then(r => r.json()).catch(() => null);
    if (res?.success) {
      toast(editId ? "Entry updated" : "Entry added");
      fetch(`/api/knowledge?user_id=${user.uuid}`).then(r => r.json()).then(d => setKbEntries(d.entries || []));
      setShowKbForm(false); setEditId(null); setKbForm({ title: "", content: "", category: "general" });
    } else { toast(res?.error || "Failed", "error"); }
    setSavingKb(false);
  };

  const handleDeleteKb = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await fetch("/api/knowledge", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: user?.uuid, id }) });
    setKbEntries(prev => prev.filter(e => e.id !== id));
    toast("Entry deleted");
  };

  const handleToggleKb = async (entry: KBEntry) => {
    await fetch("/api/knowledge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: user?.uuid, id: entry.id, title: entry.title, content: entry.content, category: entry.category, is_active: !entry.is_active }) });
    setKbEntries(prev => prev.map(e => e.id === entry.id ? { ...e, is_active: !e.is_active } : e));
  };

  const activeCount = kbEntries.filter(e => e.is_active).length;

  return (
    <div className="max-w-2xl mx-auto space-y-12 pb-12">
      {/* Page Header */}
      <div className="space-y-1.5">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-50">AI & Training</h2>
        <p className="text-sm text-gray-400">Configure how your AI bot understands and responds to customers.</p>
      </div>

      {/* ═══════════════════════════════════════════════ */}
      {/* BUSINESS CONTEXT                               */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-white/5 border border-white/5 flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
            <Brain className="h-4 w-4 text-gray-300" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white tracking-tight">Business Context</h3>
            <p className="text-xs text-gray-500">Tell your AI who you are and what you sell.</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Business Description */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-300">Business Description</label>
              <span className="text-[10px] text-gray-600 font-mono">{businessDescription.length} chars</span>
            </div>
            <textarea
              value={businessDescription}
              onChange={e => setBusinessDescription(e.target.value)}
              placeholder="Describe your business: what you sell, your target audience, unique selling points, delivery areas, payment methods..."
              rows={5}
              className="w-full rounded-md bg-white/[0.03] border border-white/5 px-4 py-3 text-sm text-gray-100 resize-y focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all duration-200 ease-out placeholder:text-gray-600 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] leading-relaxed"
            />
          </div>

          {/* Training Data */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-300">Training Data</label>
                <span className="text-[10px] uppercase font-medium tracking-widest text-gray-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">Optional</span>
              </div>
              <span className="text-[10px] text-gray-600 font-mono">{trainingData.length} chars</span>
            </div>
            <textarea
              value={trainingData}
              onChange={e => setTrainingData(e.target.value)}
              placeholder="Paste real conversations between you and customers. The AI learns your tone and style from these examples."
              rows={4}
              className="w-full rounded-md bg-white/[0.03] border border-white/5 px-4 py-3 text-sm text-gray-100 resize-y focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all duration-200 ease-out placeholder:text-gray-600 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] font-mono text-xs leading-relaxed"
            />
          </div>

          {/* Welcome Message */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-300">Welcome Message</label>
              <span className="text-[10px] uppercase font-medium tracking-widest text-gray-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">Optional</span>
            </div>
            <div className="relative">
              <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-600" />
              <Input
                value={welcomeMsg}
                onChange={e => setWelcomeMsg(e.target.value)}
                placeholder="👋 Hey {name}! Welcome to {shop}. How can I help you?"
                className="h-10 pl-10 bg-white/[0.03] border-white/5 focus:border-white/20 focus:ring-1 focus:ring-white/10 text-sm text-gray-100 rounded-md transition-all duration-200 ease-out shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]"
              />
            </div>
            <p className="text-[11px] text-gray-600">Use <code className="text-gray-400 bg-white/5 px-1 py-0.5 rounded text-[10px]">{'{name}'}</code> for customer name and <code className="text-gray-400 bg-white/5 px-1 py-0.5 rounded text-[10px]">{'{shop}'}</code> for business name.</p>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <p className="text-xs text-gray-600">Changes are saved to your AI configuration.</p>
            <Button
              onClick={handleSaveContext}
              disabled={savingCtx}
              className="h-9 px-5 rounded-md bg-white text-black hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 ease-out font-medium text-xs"
            >
              {savingCtx ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-2" />}
              Save Context
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ */}
      {/* KNOWLEDGE BASE                                  */}
      {/* ═══════════════════════════════════════════════ */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-white/5 border border-white/5 flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
              <BookOpen className="h-4 w-4 text-gray-300" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-sm font-medium text-white tracking-tight">Knowledge Base</h3>
                {kbEntries.length > 0 && (
                  <span className="text-[10px] uppercase font-medium tracking-widest text-gray-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                    {activeCount}/{kbEntries.length} active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">FAQs, policies, and info your AI should know.</p>
            </div>
          </div>
          <Button
            onClick={() => { setShowKbForm(true); setEditId(null); setKbForm({ title: "", content: "", category: "general" }); }}
            className="h-9 px-4 rounded-md bg-white text-black hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 ease-out font-medium text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Add Entry
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showKbForm && (
          <div className="rounded-lg bg-gradient-to-b from-white/[0.04] to-transparent border border-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] overflow-hidden">
            {/* Form Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-gray-400" />
                <h4 className="text-sm font-medium text-white">{editId ? "Edit Entry" : "New Entry"}</h4>
              </div>
              <button
                onClick={() => { setShowKbForm(false); setEditId(null); }}
                className="h-7 w-7 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5 transition-all duration-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">Title</label>
                <Input
                  value={kbForm.title}
                  onChange={e => setKbForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Return Policy, Shipping Info, Payment Methods"
                  className="h-10 bg-white/[0.03] border-white/5 focus:border-white/20 focus:ring-1 focus:ring-white/10 text-sm text-gray-100 rounded-md transition-all duration-200 ease-out"
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">Content</label>
                <textarea
                  value={kbForm.content}
                  onChange={e => setKbForm(p => ({ ...p, content: e.target.value }))}
                  placeholder="Full information the AI should use when answering related questions..."
                  rows={4}
                  className="w-full rounded-md bg-white/[0.03] border border-white/5 px-4 py-3 text-sm text-gray-100 resize-y focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all duration-200 ease-out placeholder:text-gray-600 leading-relaxed"
                />
              </div>

              {/* Category Selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-300">Category</label>
                <div className="flex gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setKbForm(p => ({ ...p, category: c.value }))}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-200 ease-out",
                        kbForm.category === c.value
                          ? "bg-white/10 border-white/20 text-white"
                          : "bg-transparent border-white/5 text-gray-500 hover:text-gray-300 hover:border-white/10"
                      )}
                    >
                      <c.icon className="h-3 w-3" /> {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-2 border-t border-white/5">
                <Button
                  variant="ghost"
                  onClick={() => { setShowKbForm(false); setEditId(null); }}
                  className="h-9 px-4 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 ease-out font-medium text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveKb}
                  disabled={savingKb || !kbForm.title.trim() || !kbForm.content.trim()}
                  className="h-9 px-5 rounded-md bg-white text-black hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 ease-out font-medium text-xs"
                >
                  {savingKb ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-2" />}
                  {editId ? "Update Entry" : "Add Entry"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Entries List */}
        {kbLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
          </div>
        ) : kbEntries.length === 0 && !showKbForm ? (
          <div className="p-8 rounded-lg border border-dashed border-white/10 flex flex-col items-center justify-center text-center space-y-3">
            <div className="h-12 w-12 rounded-md bg-white/5 border border-white/5 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-300">No entries yet</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">Add FAQs, policies, delivery info — anything your bot should know to answer accurately.</p>
            </div>
            <Button
              onClick={() => setShowKbForm(true)}
              className="h-9 px-4 rounded-md bg-white text-black hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 ease-out font-medium text-xs gap-1.5 mt-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add First Entry
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border border-white/5 overflow-hidden divide-y divide-white/5">
            {kbEntries.map(entry => {
              const cat = CATEGORIES.find(c => c.value === entry.category) || CATEGORIES[3];
              const CatIcon = cat.icon;
              const isExpanded = expandedKb === entry.id;

              return (
                <div
                  key={entry.id}
                  className={cn(
                    "transition-all duration-200 ease-out",
                    !entry.is_active && "opacity-40"
                  )}
                >
                  {/* Entry Row */}
                  <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors duration-200">
                    <button
                      onClick={() => setExpandedKb(isExpanded ? null : entry.id)}
                      className="text-gray-600 hover:text-gray-300 transition-colors duration-200 shrink-0"
                    >
                      {isExpanded
                        ? <ChevronDown className="h-4 w-4" />
                        : <ChevronRight className="h-4 w-4" />
                      }
                    </button>

                    <div className="h-8 w-8 rounded-md bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                      <CatIcon className="h-3.5 w-3.5 text-gray-400" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-sm font-medium text-white truncate">{entry.title}</h4>
                        <span className="text-[10px] uppercase font-medium tracking-widest text-gray-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5 shrink-0">
                          {cat.label}
                        </span>
                      </div>
                      {!isExpanded && (
                        <p className="text-xs text-gray-600 truncate mt-0.5">{entry.content}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleKb(entry)}
                        className={cn(
                          "p-1.5 rounded-md transition-all duration-200",
                          entry.is_active
                            ? "text-emerald-400 hover:bg-emerald-500/10"
                            : "text-gray-600 hover:text-gray-300 hover:bg-white/5"
                        )}
                        title={entry.is_active ? "Active — click to disable" : "Disabled — click to enable"}
                      >
                        {entry.is_active
                          ? <ToggleRight className="h-4 w-4" />
                          : <ToggleLeft className="h-4 w-4" />
                        }
                      </button>
                      <button
                        onClick={() => { setKbForm({ title: entry.title, content: entry.content, category: entry.category }); setEditId(entry.id); setShowKbForm(true); }}
                        className="p-1.5 rounded-md text-gray-600 hover:text-white hover:bg-white/5 transition-all duration-200"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteKb(entry.id)}
                        className="p-1.5 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-5 pb-4 pl-[4.5rem]">
                      <div className="rounded-md bg-white/[0.02] border border-white/5 px-4 py-3">
                        <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{entry.content}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
