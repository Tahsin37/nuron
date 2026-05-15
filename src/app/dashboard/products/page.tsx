"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProducts, deleteProduct, createProduct } from "@/lib/store";
import { Plus, Trash2, Edit, Database, Search, Copy, Archive, Filter } from "lucide-react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft" | "archived">("all");

  useEffect(() => { setMounted(true); setProducts(getProducts()); }, []);
  if (!mounted) return null;

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase())) ||
      p.price.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProduct(id);
      setProducts(getProducts());
    }
  };

  const handleDuplicate = (product: Product) => {
    const { id, created_at, updated_at, ...rest } = product;
    createProduct({ ...rest, name: `${rest.name} (Copy)` });
    setProducts(getProducts());
  };

  const handleArchive = (product: Product) => {
    const { getProduct, updateProduct } = require("@/lib/store");
    updateProduct(product.id, { status: product.status === "archived" ? "active" : "archived" });
    setProducts(getProducts());
  };

  const counts = {
    all: products.length,
    active: products.filter(p => p.status === "active").length,
    draft: products.filter(p => p.status === "draft").length,
    archived: products.filter(p => p.status === "archived").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Product Knowledge Brain</h2>
          <p className="text-muted-foreground text-sm mt-1">{products.length} products — AI uses this data to answer customer questions.</p>
        </div>
        <Link href="/dashboard/products/new"><Button><Plus className="h-4 w-4 mr-2" /> Add Product</Button></Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, category, tags, or price..." className="pl-10 bg-zinc-950 border-zinc-800" />
        </div>
        <div className="flex bg-zinc-900 rounded-lg p-1 border border-border/50 shrink-0">
          {(["all", "active", "draft", "archived"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize", statusFilter === s ? "bg-zinc-800 text-white" : "text-muted-foreground hover:text-white")}>
              {s} {counts[s] > 0 && <span className="ml-1 text-[10px] opacity-60">({counts[s]})</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* New Product Card */}
        <Link href="/dashboard/products/new">
          <Card className="border-dashed border-2 border-border/50 hover:border-border transition-colors cursor-pointer h-full min-h-[200px] flex items-center justify-center">
            <CardContent className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="h-14 w-14 rounded-full border-2 border-dashed border-border flex items-center justify-center"><Plus className="h-6 w-6" /></div>
              <span className="font-medium">Add New Product</span>
            </CardContent>
          </Card>
        </Link>

        {filtered.map((product) => (
          <Card key={product.id} className={cn("border-border/50 hover:border-border transition-all group relative overflow-hidden flex flex-col", product.status === "archived" && "opacity-60")}>
            <div className="absolute inset-0 bg-gradient-to-br from-foreground/[0.02] via-transparent to-transparent" />
            <CardContent className="p-6 relative flex-1 flex flex-col">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 shrink-0 rounded-lg bg-zinc-800 flex items-center justify-center border border-border/50 overflow-hidden">
                  {product.image_urls?.[0] ? (
                    <img src={product.image_urls[0]} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <Database className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate" title={product.name}>{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-lg text-emerald-400">{product.price}</span>
                    {product.discount && <span className="text-xs text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">{product.discount}</span>}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${product.stock_status === "in_stock" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : product.stock_status === "preorder" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"}`}>
                  {product.stock_status.replace('_', ' ')}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider ${product.status === "active" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : product.status === "draft" ? "bg-zinc-700 text-zinc-400" : "bg-zinc-800 text-zinc-500"}`}>
                  {product.status}
                </span>
                {product.category && <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">{product.category}</span>}
              </div>

              {(product.colors?.length || product.sizes?.length) ? (
                <div className="mt-3 flex flex-wrap gap-1">
                  {product.colors?.map(c => <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">{c}</span>)}
                  {product.sizes?.map(s => <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{s}</span>)}
                </div>
              ) : null}

              {product.tags?.length ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {product.tags.slice(0, 4).map(t => <span key={t} className="text-[10px] text-muted-foreground">#{t}</span>)}
                </div>
              ) : null}

              <p className="text-sm text-muted-foreground mt-3 line-clamp-2 flex-1">{product.description || product.notes}</p>

              <div className="flex items-center gap-1.5 mt-5 pt-4 border-t border-border/30">
                <Link href={`/dashboard/products/${product.id}`} className="flex-1"><Button variant="outline" size="sm" className="w-full"><Edit className="h-3.5 w-3.5 mr-1.5" /> Edit</Button></Link>
                <Button variant="outline" size="sm" onClick={() => handleDuplicate(product)} title="Duplicate"><Copy className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" size="sm" onClick={() => handleArchive(product)} title={product.status === "archived" ? "Unarchive" : "Archive"}><Archive className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(product.id)} className="text-destructive hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && products.length > 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>No products match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
