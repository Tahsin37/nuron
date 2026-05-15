"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAgents, deleteAgent } from "@/lib/store";
import { Bot, Plus, ArrowUpRight, Trash2, Settings2, MessageSquare } from "lucide-react";
import Link from "next/link";
import type { Agent } from "@/lib/types";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); setAgents(getAgents()); }, []);
  if (!mounted) return null;

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this agent?")) {
      deleteAgent(id);
      setAgents(getAgents());
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">AI Agents</h2><p className="text-muted-foreground text-sm mt-1">Create and manage your AI employees</p></div>
        <Link href="/dashboard/agents/new"><Button><Plus className="h-4 w-4 mr-2" /> Create Agent</Button></Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* New Agent Card */}
        <Link href="/dashboard/agents/new">
          <Card className="border-dashed border-2 border-border/50 hover:border-border transition-colors cursor-pointer h-full min-h-[200px] flex items-center justify-center">
            <CardContent className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="h-14 w-14 rounded-full border-2 border-dashed border-border flex items-center justify-center"><Plus className="h-6 w-6" /></div>
              <span className="font-medium">Create New Agent</span>
            </CardContent>
          </Card>
        </Link>

        {agents.map((agent) => (
          <Card key={agent.id} className="border-border/50 hover:border-border transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.02] via-transparent to-transparent" />
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center text-lg font-bold">{agent.name[0]}</div>
                  <div>
                    <h3 className="font-semibold">{agent.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{agent.behavior.role} Agent</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${agent.status === "active" ? "bg-emerald-500/20 text-emerald-400" : agent.status === "training" ? "bg-amber-500/20 text-amber-400" : "bg-zinc-700 text-zinc-400"}`}>{agent.status}</span>
              </div>

              <p className="text-sm text-muted-foreground mt-4 line-clamp-2">{agent.welcome_message}</p>

              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> Personality: {agent.personality.friendliness > 50 ? "Friendly" : "Professional"}</div>
              </div>

              <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border/30">
                <Link href={`/dashboard/agents/${agent.id}`} className="flex-1"><Button variant="outline" size="sm" className="w-full"><Settings2 className="h-3.5 w-3.5 mr-1.5" /> Manage</Button></Link>
                <Link href={`/dashboard/agents/${agent.id}/embed`}><Button variant="outline" size="sm"><ArrowUpRight className="h-3.5 w-3.5" /></Button></Link>
                <Button variant="outline" size="sm" onClick={() => handleDelete(agent.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
