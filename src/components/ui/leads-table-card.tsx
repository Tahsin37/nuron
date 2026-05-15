'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export type LeadEntry = {
  id: number | string
  date: string
  status: 'Order' | 'Interested' | 'Asked'
  statusVariant: 'success' | 'danger' | 'warning'
  name: string
  avatar: string
  product: string
}

export type LeadsTableCardProps = {
  title?: string
  subtitle?: string
  className?: string
  leads?: LeadEntry[]
}

const DEFAULT_LEADS: LeadEntry[] = [
  {
    id: 1,
    date: 'Today',
    status: 'Order',
    statusVariant: 'success',
    name: 'Rahim Uddin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    product: 'Black Panjabi — ৳1,200',
  },
  {
    id: 2,
    date: 'Today',
    status: 'Interested',
    statusVariant: 'warning',
    name: 'Fatima Akter',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    product: 'Cotton Saree — ৳850',
  },
  {
    id: 3,
    date: 'Yesterday',
    status: 'Order',
    statusVariant: 'success',
    name: 'Kamal Hossain',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    product: 'Winter Hoodie — ৳950',
  },
  {
    id: 4,
    date: 'Yesterday',
    status: 'Asked',
    statusVariant: 'danger',
    name: 'Nusrat Jahan',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    product: 'Sneakers — ৳2,400',
  },
]

const Badge = ({
  children,
  variant,
}: {
  children: React.ReactNode
  variant: 'success' | 'danger' | 'warning'
}) => {
  const styles =
    variant === 'success'
      ? 'bg-emerald-500/15 text-emerald-300'
      : variant === 'danger'
      ? 'bg-rose-500/15 text-rose-300'
      : 'bg-amber-500/15 text-amber-300'

  return (
    <span className={cn('rounded-full px-2 py-1 text-xs font-medium', styles)}>
      {children}
    </span>
  )
}

export default function LeadsTableCard({
  title = 'Live Leads',
  subtitle = 'AI-captured leads from your Messenger inbox today',
  leads = DEFAULT_LEADS,
  className,
}: LeadsTableCardProps) {
  return (
    <section
      className={cn(
        'bg-zinc-900/60 backdrop-blur-xl relative w-full overflow-hidden rounded-2xl border border-border/40 shadow-2xl shadow-black/30',
        className
      )}
      aria-label={title}
    >
      {/* Header */}
      <div className="space-y-1 border-b border-border/40 p-5">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="size-2 rounded-full bg-zinc-600" />
          <span className="size-2 rounded-full bg-zinc-600" />
        </div>
        <h2 className="text-base font-semibold leading-none tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-xs">{subtitle}</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-zinc-800/40">
            <tr className="text-muted-foreground *:text-left *:px-4 *:py-2.5 *:font-medium *:text-xs *:uppercase *:tracking-wider">
              <th className="w-10">#</th>
              <th>Customer</th>
              <th>Intent</th>
              <th className="text-right pr-5">Product</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead, idx) => (
              <tr
                key={lead.id}
                className="hover:bg-zinc-800/30 transition-colors *:px-4 *:py-2.5 border-b border-border/20 last:border-0"
              >
                <td className="text-muted-foreground text-xs">{idx + 1}</td>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 overflow-hidden rounded-full ring-1 ring-border/40">
                      <img
                        src={lead.avatar}
                        alt={lead.name}
                        width={28}
                        height={28}
                        loading="lazy"
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <div>
                      <span className="text-foreground font-medium text-sm">{lead.name}</span>
                      <div className="text-[10px] text-muted-foreground">{lead.date}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <Badge variant={lead.statusVariant}>{lead.status}</Badge>
                </td>
                <td className="text-right pr-5 text-xs text-muted-foreground">{lead.product}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/30 px-5 py-3 text-[10px] text-muted-foreground">
        <span>
          <strong className="text-foreground">{leads.length}</strong> leads captured today
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
          AI is active
        </span>
      </div>
    </section>
  )
}
