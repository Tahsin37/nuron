"use client";
import React, { useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { createProduct } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Image as ImageIcon, Loader2, CheckCircle2, ArrowRight, X, AlertCircle, Edit2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast-provider";
import { useRouter } from "next/navigation";

export default function ImportProductsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [products, setProducts] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }
    setError(null);
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const extractProducts = async () => {
    if (!preview || !user?.uuid) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/products/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: preview, tenant_id: user.uuid }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to extract products.");
      }
      
      setProducts(data.products || []);
      toast("Successfully extracted products from image!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = (index: number) => {
    const updated = [...products];
    updated[index] = { ...updated[index], ...editForm };
    setProducts(updated);
    setEditingIndex(null);
  };

  const startEdit = (index: number, product: any) => {
    setEditForm(product);
    setEditingIndex(index);
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const confirmAndImport = () => {
    if (products.length === 0) return;
    
    // Create each product in local store (which also syncs to Supabase)
    products.forEach(p => {
      createProduct({
        name: p.name,
        price: p.price,
        description: p.description,
        stock_status: p.stock_status || "in_stock",
        status: "active"
      });
    });
    
    toast(`Successfully imported ${products.length} products!`);
    router.push("/dashboard/products");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Auto-Cataloger</h2>
        <p className="text-sm text-muted-foreground mt-1">Upload a menu or catalog image and let Vision AI extract the products for you.</p>
      </div>

      {!products.length && !loading && (
        <div 
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${dragActive ? "border-emerald-500 bg-emerald-500/5 scale-[1.02]" : "border-border/50 bg-zinc-950/50 hover:bg-zinc-900/50 hover:border-border/80"}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
          
          <AnimatePresence mode="wait">
            {!preview ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center">
                <div className="h-16 w-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4 shadow-inner border border-white/5">
                  <UploadCloud className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-base font-medium">Drag and drop your image here</p>
                <p className="text-sm text-muted-foreground mt-1 mb-6">Supports JPG, PNG, WEBP</p>
                <Button onClick={() => fileInputRef.current?.click()} className="bg-white text-black hover:bg-zinc-200">
                  Select File
                </Button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
                <div className="relative w-full max-w-sm aspect-video rounded-xl overflow-hidden border border-white/10 shadow-2xl mb-6">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <button onClick={(e) => { e.stopPropagation(); setPreview(null); setFile(null); }} className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors backdrop-blur-md">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <Button onClick={extractProducts} size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <ImageIcon className="h-4 w-4 mr-2" /> Extract Products
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {loading && (
        <div className="border border-border/30 bg-zinc-950/50 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <Loader2 className="h-10 w-10 text-emerald-500 animate-spin mb-4" />
          <h3 className="text-lg font-medium">Analyzing Image...</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm">Vision AI is scanning the document to identify products, prices, and descriptions. This may take up to 30 seconds.</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Extraction Failed</p>
            <p className="text-sm opacity-80 mt-1">{error}</p>
            <Button variant="outline" size="sm" className="mt-3 border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => setError(null)}>Try Again</Button>
          </div>
        </div>
      )}

      {products.length > 0 && !loading && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-medium">Review & Edit ({products.length} found)</h3>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setProducts([]); setPreview(null); setFile(null); }}>Start Over</Button>
              <Button onClick={confirmAndImport} className="bg-white text-black hover:bg-zinc-200 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                <CheckCircle2 className="h-4 w-4 mr-2" /> Confirm & Import
              </Button>
            </div>
          </div>

          <div className="border border-white/10 rounded-xl bg-zinc-950 overflow-hidden shadow-2xl">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-900/50 border-b border-white/5 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Product Name</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Price</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map((p, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      {editingIndex === i ? (
                        <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="h-8 bg-black border-white/10" />
                      ) : (
                        <span className="font-medium">{p.name}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {editingIndex === i ? (
                        <Input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="h-8 bg-black border-white/10" />
                      ) : (
                        <span className="truncate max-w-[250px] inline-block">{p.description || "—"}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-medium text-emerald-400">
                      {editingIndex === i ? (
                        <Input value={editForm.price} onChange={e => setEditForm({ ...editForm, price: e.target.value })} className="h-8 bg-black border-white/10 w-24" />
                      ) : (
                        p.price
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {editingIndex === i ? (
                        <Button size="sm" variant="ghost" onClick={() => handleSaveEdit(i)} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-8 px-2">
                          <Save className="h-4 w-4" />
                        </Button>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => startEdit(i, p)} className="text-muted-foreground hover:text-white hover:bg-white/10 h-8 w-8 p-0">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => removeProduct(i)} className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 h-8 w-8 p-0">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
