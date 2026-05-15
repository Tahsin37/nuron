"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// ==================== Types ====================
export interface NuronUser {
  uuid: string;
  username: string;
  email: string;
  full_name: string;
  company: string;
  avatar_url?: string;
  created_at: string;
}

interface AuthContextType {
  user: NuronUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsOnboarding: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  completeProfile: (profile: { full_name: string; email: string; company: string }) => Promise<void>;
  chatWithAI: (messages: { role: string; content: string }[]) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Key used to store user profile in Puter KV (persistent, not localStorage)
const PROFILE_KEY = "nuron_user_profile";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<NuronUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [puterReady, setPuterReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Load Puter.js SDK
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).puter) {
      setPuterReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.puter.com/v2/";
    script.async = true;
    script.onload = () => setPuterReady(true);
    script.onerror = () => setIsLoading(false);
    document.head.appendChild(script);
  }, []);

  // Check existing auth session
  useEffect(() => {
    if (!puterReady) return;
    const puter = (window as any).puter;
    (async () => {
      try {
        if (puter.auth?.isSignedIn()) {
          const puterUser = await puter.auth.getUser();
          // Try loading saved profile from Puter KV (persistent cloud storage)
          try {
            const stored = await puter.kv.get(PROFILE_KEY);
            if (stored) {
              const profile = typeof stored === "string" ? JSON.parse(stored) : stored;
              setUser({ ...profile, uuid: puterUser.uuid, username: puterUser.username });
              setNeedsOnboarding(false);
            } else {
              // Signed in but no profile yet → needs onboarding
              setUser({
                uuid: puterUser.uuid,
                username: puterUser.username,
                email: puterUser.email || "",
                full_name: "",
                company: "",
                created_at: new Date().toISOString(),
              });
              setNeedsOnboarding(true);
            }
          } catch {
            // KV not available, use basic Puter user data
            setUser({
              uuid: puterUser.uuid,
              username: puterUser.username,
              email: puterUser.email || "",
              full_name: "",
              company: "",
              created_at: new Date().toISOString(),
            });
            setNeedsOnboarding(true);
          }
        }
      } catch {
        // Not signed in — normal state
      } finally {
        setIsLoading(false);
      }
    })();
  }, [puterReady]);

  const signIn = useCallback(async () => {
    if (!puterReady) return;
    const puter = (window as any).puter;
    try {
      setIsLoading(true);
      await puter.auth.signIn();
      const puterUser = await puter.auth.getUser();
      // Check if profile exists
      try {
        const stored = await puter.kv.get(PROFILE_KEY);
        if (stored) {
          const profile = typeof stored === "string" ? JSON.parse(stored) : stored;
          setUser({ ...profile, uuid: puterUser.uuid, username: puterUser.username });
          setNeedsOnboarding(false);
        } else {
          setUser({
            uuid: puterUser.uuid,
            username: puterUser.username,
            email: puterUser.email || "",
            full_name: "",
            company: "",
            created_at: new Date().toISOString(),
          });
          setNeedsOnboarding(true);
        }
      } catch {
        setUser({
          uuid: puterUser.uuid,
          username: puterUser.username,
          email: puterUser.email || "",
          full_name: "",
          company: "",
          created_at: new Date().toISOString(),
        });
        setNeedsOnboarding(true);
      }
    } catch (err: any) {
      if (err?.error === 'auth_window_closed') {
        console.log("Authentication window closed by user.");
      } else {
        console.error("Puter auth error:", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [puterReady]);

  const completeProfile = useCallback(async (profile: { full_name: string; email: string; company: string }) => {
    if (!puterReady || !user) return;
    const puter = (window as any).puter;
    const updatedUser: NuronUser = {
      ...user,
      full_name: profile.full_name.trim(),
      email: profile.email.trim().toLowerCase(),
      company: profile.company.trim(),
    };
    // 1. Save to Puter KV (for the user — fast, cloud-persistent)
    try {
      await puter.kv.set(PROFILE_KEY, JSON.stringify(updatedUser));
    } catch (err) {
      console.error("Failed to save profile to Puter KV:", err);
    }
    // 2. Save to YOUR Supabase database (for you — user list, emails, analytics)
    // Fire-and-forget: never blocks the user, fails silently if Supabase isn't configured
    try {
      fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puter_uuid: updatedUser.uuid,
          username: updatedUser.username,
          full_name: updatedUser.full_name,
          email: updatedUser.email,
          company: updatedUser.company,
        }),
      }).catch(() => {}); // Silently ignore — Supabase is optional
    } catch {
      // Supabase save failed — no problem, user experience is unaffected
    }
    setUser(updatedUser);
    setNeedsOnboarding(false);
  }, [puterReady, user]);

  const signOut = useCallback(async () => {
    if (!puterReady) return;
    const puter = (window as any).puter;
    try {
      await puter.auth.signOut();
      setUser(null);
      setNeedsOnboarding(false);
    } catch (err) {
      console.error("Sign out error:", err);
    }
  }, [puterReady]);

  const chatWithAI = useCallback(async (messages: { role: string; content: string }[]) => {
    if (!puterReady) throw new Error("Puter not ready");
    const puter = (window as any).puter;
    try {
      const response = await puter.ai.chat("gpt-4.1", messages);
      return response?.message?.content || response?.toString() || "I apologize, I couldn't generate a response.";
    } catch (err) {
      console.error("AI chat error:", err);
      throw err;
    }
  }, [puterReady]);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, needsOnboarding, signIn, signOut, completeProfile, chatWithAI }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
