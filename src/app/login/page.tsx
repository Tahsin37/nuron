"use client";
import React, { useRef, useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, User, Mail, Building2, Loader2, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";

function ParticleBg() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const setSize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    setSize();
    type P = { x: number; y: number; v: number; o: number };
    let ps: P[] = [], raf = 0;
    const make = (): P => ({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, v: Math.random() * 0.25 + 0.05, o: Math.random() * 0.35 + 0.15 });
    const init = () => { ps = []; for (let i = 0; i < Math.floor((canvas.width * canvas.height) / 9000); i++) ps.push(make()); };
    const draw = () => { ctx.clearRect(0, 0, canvas.width, canvas.height); ps.forEach((p) => { p.y -= p.v; if (p.y < 0) { p.x = Math.random() * canvas.width; p.y = canvas.height + 40; } ctx.fillStyle = `rgba(250,250,250,${p.o})`; ctx.fillRect(p.x, p.y, 0.7, 2.2); }); raf = requestAnimationFrame(draw); };
    const resizeHandler = () => { setSize(); init(); };
    window.addEventListener("resize", resizeHandler); init(); raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resizeHandler); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-50 mix-blend-screen pointer-events-none" />;
}

export default function LoginPage() {
  const { signIn, completeProfile, isAuthenticated, isLoading, needsOnboarding, user } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: "", email: "", company: "" });
  const [saving, setSaving] = useState(false);

  // Redirect if already authenticated and onboarded
  useEffect(() => {
    if (isAuthenticated && !needsOnboarding) router.push("/dashboard");
  }, [isAuthenticated, needsOnboarding, router]);

  // Pre-fill email from Puter when available
  useEffect(() => {
    if (user?.email && !profileForm.email) {
      setProfileForm((prev) => ({ ...prev, email: user.email }));
    }
  }, [user?.email, profileForm.email]);

  const handlePuterSignIn = async () => {
    setSigningIn(true);
    await signIn();
    setSigningIn(false);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.full_name.trim() || !profileForm.email.trim()) return;
    setSaving(true);
    await completeProfile(profileForm);
    setSaving(false);
    router.push("/dashboard/onboarding");
  };

  // Show onboarding form if signed in but needs profile
  const showOnboarding = isAuthenticated && needsOnboarding;

  return (
    <section className="fixed inset-0 bg-zinc-950 text-zinc-50">
      <div className="absolute inset-0 pointer-events-none [background:radial-gradient(80%_60%_at_50%_30%,rgba(255,255,255,0.06),transparent_60%)]" />
      <div className="accent-lines"><div className="hline" /><div className="hline" /><div className="hline" /><div className="vline" /><div className="vline" /><div className="vline" /></div>
      <ParticleBg />

      <header className="absolute left-0 right-0 top-0 flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 z-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white"><Zap className="h-3.5 w-3.5 text-black" /></div>
          <span className="text-xs tracking-[0.14em] uppercase text-zinc-400">Nuron AI</span>
        </Link>
        <Link href="/">
          <Button variant="outline" className="h-9 rounded-lg border-zinc-800 bg-zinc-900 text-zinc-50 hover:bg-zinc-900/80">
            <span className="mr-2">Home</span><ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </header>

      <div className="h-full w-full grid place-items-center px-4">
        {!showOnboarding ? (
          /* Sign In Card */
          <Card className="card-animate w-full max-w-sm border-zinc-800 bg-zinc-900/70 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60">
            <CardHeader className="text-center space-y-3 pb-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-lg">
                <Zap className="h-6 w-6 text-black" />
              </div>
              <CardTitle className="text-2xl">Welcome to Nuron AI</CardTitle>
              <CardDescription className="text-zinc-400 text-base">Sign in to build your AI employees</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <Button
                onClick={handlePuterSignIn}
                disabled={signingIn || isLoading}
                className="w-full h-12 rounded-xl bg-white text-zinc-900 hover:bg-zinc-200 text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {signingIn ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Connecting...</> : <>Get Started Free <ArrowRight className="ml-2 h-5 w-5" /></>}
              </Button>
              <div className="flex items-center gap-3 text-xs text-zinc-500 justify-center">
                <div className="flex items-center gap-1"><Shield className="h-3 w-3" /> Secure sign-in</div>
                <span>•</span>
                <span>No credit card</span>
                <span>•</span>
                <span>Free AI access</span>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-center text-xs text-zinc-500 pt-2">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="ml-1 text-zinc-300 hover:underline">Terms</Link>{" "}
              &{" "}
              <Link href="/privacy" className="ml-1 text-zinc-300 hover:underline">Privacy Policy</Link>
            </CardFooter>
          </Card>
        ) : (
          /* Complete Profile Card */
          <Card className="card-animate w-full max-w-md border-zinc-800 bg-zinc-900/70 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60">
            <CardHeader className="text-center space-y-3 pb-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 shadow-lg">
                <User className="h-6 w-6 text-emerald-400" />
              </div>
              <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
              <CardDescription className="text-zinc-400">Just a few details so we can personalize your experience</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-zinc-300">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      id="full_name" type="text" required autoFocus
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm((p) => ({ ...p, full_name: e.target.value }))}
                      placeholder="John Doe"
                      className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 h-11"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      id="email" type="email" required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="you@company.com"
                      className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 h-11"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-zinc-300">Company <span className="text-zinc-600">(optional)</span></Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      id="company" type="text"
                      value={profileForm.company}
                      onChange={(e) => setProfileForm((p) => ({ ...p, company: e.target.value }))}
                      placeholder="Acme Inc."
                      className="pl-10 bg-zinc-950 border-zinc-800 text-zinc-50 placeholder:text-zinc-600 h-11"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={saving || !profileForm.full_name.trim() || !profileForm.email.trim()}
                  className="w-full h-12 rounded-xl bg-white text-zinc-900 hover:bg-zinc-200 text-base font-semibold mt-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {saving ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</> : <>Continue to Setup <ArrowRight className="ml-2 h-5 w-5" /></>}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
