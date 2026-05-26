"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast-provider";
import { User, Trash2, LogOut, Check, Loader2, Building2, Mail } from "lucide-react";

export default function SettingsGeneralPage() {
  const { user, signOut, completeProfile } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    company: user?.company || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.uuid) return;
    fetch(`/api/settings/connect?user_id=${user.uuid}`)
      .then(r => r.json())
      .then(data => {
        if (data.settings?.business_name && !form.company)
          setForm(p => ({ ...p, company: data.settings.business_name }));
      }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uuid]);

  const handleSave = async () => {
    if (!form.full_name.trim() || !form.email.trim()) return;
    setSaving(true);
    await completeProfile(form);
    if (user?.uuid && form.company) {
      await fetch("/api/settings/connect", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.uuid, business_name: form.company }),
      }).catch(() => {});
    }
    setSaving(false);
    toast("Profile saved");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">General</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile and account preferences.</p>
      </div>

      {/* Profile Section */}
      <section className="space-y-6">
        <div>
          <h3 className="text-base font-medium">Profile</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Your personal information used across the platform.</p>
        </div>
        <Separator className="bg-border/40" />
        <div className="space-y-6">
          {/* Avatar + Name Row */}
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shrink-0 shadow-inner">
              {(form.full_name || user?.username || "U")[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium">{form.full_name || user?.username}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{form.email || user?.email}</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-5">
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                    className="pl-9 h-10 bg-zinc-950/50 border-border/50 text-sm rounded-xl focus-visible:ring-1 focus-visible:ring-white/20 transition-all" placeholder="John Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="pl-9 h-10 bg-zinc-950/50 border-border/50 text-sm rounded-xl focus-visible:ring-1 focus-visible:ring-white/20 transition-all" placeholder="john@example.com" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Business Name</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                  className="pl-9 h-10 bg-zinc-950/50 border-border/50 text-sm rounded-xl focus-visible:ring-1 focus-visible:ring-white/20 transition-all" placeholder="Acme Inc." />
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving} size="sm" className="h-10 text-sm px-6 bg-white text-black hover:bg-zinc-200 rounded-xl font-medium shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-6 pt-4">
        <div>
          <h3 className="text-base font-medium">Account</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your session and account.</p>
        </div>
        <Separator className="bg-border/40" />
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl border border-border/30 bg-card/50">
            <div>
              <p className="text-base font-medium">Sign Out</p>
              <p className="text-sm text-muted-foreground mt-0.5">End your current session on this device.</p>
            </div>
            <Button variant="outline" size="sm" onClick={signOut} className="h-10 text-sm rounded-xl px-5 hover:bg-white/5 border-white/10">
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl border border-red-500/15 bg-red-500/[0.02]">
            <div>
              <p className="text-base font-medium text-red-400">Delete Account</p>
              <p className="text-sm text-muted-foreground mt-0.5">Permanently delete your account and all data.</p>
            </div>
            <Button variant="outline" size="sm" className="h-10 text-sm text-red-400 border-red-500/20 hover:bg-red-500/10 rounded-xl px-5 transition-colors">
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
