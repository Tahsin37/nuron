"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-context";
import { User, Bell, Shield, Key, Trash2, LogOut, Check, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { user, signOut, completeProfile } = useAuth();
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    company: user?.company || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveProfile = async () => {
    if (!profileForm.full_name.trim() || !profileForm.email.trim()) return;
    setSaving(true);
    await completeProfile(profileForm);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div><h2 className="text-2xl font-bold">Settings</h2><p className="text-muted-foreground text-sm mt-1">Manage your account and preferences</p></div>

      {/* Profile */}
      <Card className="border-border/50">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-5 w-5" /> Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-zinc-700 flex items-center justify-center text-2xl font-bold">{(user?.full_name || user?.username || "U")[0]?.toUpperCase()}</div>
            <div>
              <div className="font-semibold">{user?.full_name || user?.username}</div>
              <div className="text-sm text-muted-foreground">{user?.email || "No email set"}</div>
              {user?.company && <div className="text-xs text-muted-foreground">{user.company}</div>}
            </div>
          </div>
          <Separator className="bg-border/30" />
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input value={profileForm.full_name} onChange={(e) => setProfileForm(p => ({ ...p, full_name: e.target.value }))} className="bg-zinc-950 border-zinc-800" />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={profileForm.email} onChange={(e) => setProfileForm(p => ({ ...p, email: e.target.value }))} className="bg-zinc-950 border-zinc-800" />
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input value={profileForm.company} onChange={(e) => setProfileForm(p => ({ ...p, company: e.target.value }))} placeholder="Your company name" className="bg-zinc-950 border-zinc-800" />
            </div>
          </div>
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : saved ? <><Check className="h-4 w-4 mr-2" /> Saved!</> : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-border/50">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {[{ label: "New lead captured", desc: "Get notified when your AI agent captures a new lead" },
            { label: "Weekly analytics report", desc: "Receive a summary of your agent performance" },
            { label: "Agent errors", desc: "Alert when an agent encounters issues" }].map(n => (
            <div key={n.label} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800">
              <div><div className="text-sm font-medium">{n.label}</div><div className="text-xs text-muted-foreground">{n.desc}</div></div>
              <div className="h-6 w-11 rounded-full bg-white cursor-pointer relative"><div className="absolute top-0.5 left-[22px] h-5 w-5 rounded-full bg-zinc-900" /></div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card className="border-border/50">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Key className="h-5 w-5" /> API & Integrations</CardTitle><CardDescription>Connect external services (coming soon)</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5"><Label>OpenAI API Key</Label><Input type="password" placeholder="sk-..." className="bg-zinc-950 border-zinc-800" /></div>
          <div className="space-y-1.5"><Label>Webhook URL</Label><Input placeholder="https://your-webhook.com/leads" className="bg-zinc-950 border-zinc-800" /></div>
          <Button variant="outline">Save API Keys</Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader><CardTitle className="text-base text-destructive flex items-center gap-2"><Shield className="h-5 w-5" /> Danger Zone</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={signOut} className="w-full"><LogOut className="h-4 w-4 mr-2" /> Sign Out</Button>
          <Button variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"><Trash2 className="h-4 w-4 mr-2" /> Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  );
}
