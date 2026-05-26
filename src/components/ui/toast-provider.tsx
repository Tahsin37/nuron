"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  toast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const icons = { success: CheckCircle2, error: AlertCircle, info: Info };
  const colors = {
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    error: "border-rose-500/30 bg-rose-500/10 text-rose-400",
    info: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map(t => {
          const Icon = icons[t.type];
          return (
            <div key={t.id} className={cn("flex items-center gap-2.5 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl animate-in slide-in-from-right-5 fade-in duration-300", colors[t.type])}>
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-sm text-foreground flex-1">{t.message}</span>
              <button onClick={() => removeToast(t.id)} className="text-muted-foreground hover:text-foreground shrink-0"><X className="h-3.5 w-3.5" /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
