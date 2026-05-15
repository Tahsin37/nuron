"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createProduct } from "@/lib/store";
import { useRouter } from "next/navigation";
import { Database, ArrowLeft, Save, Plus, X } from "lucide-react";
import Link from "next/link";

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", price: "", discount: "",
    stock_status: "in_stock" as "in_stock" | "out_of_stock" | "preorder",
    category: "", delivery_info: "", description: "", notes: "",
    status: "active" as "active" | "draft" | "archived"
  });
  const [tags, setTags] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [faq, setFaq] = useState<{ question: string; answer: string }[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [colorInput, setColorInput] = useState("");
  const [sizeInput, setSizeInput] = useState("");

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const addTag = () => { if (tagInput.trim() && !tags.includes(tagInput.trim())) { setTags([...tags, tagInput.trim()]); setTagInput(""); } };
  const addColor = () => { if (colorInput.trim() && !colors.includes(colorInput.trim())) { setColors([...colors, colorInput.trim()]); setColorInput(""); } };
  const addSize = () => { if (sizeInput.trim() && !sizes.includes(sizeInput.trim())) { setSizes([...sizes, sizeInput.trim()]); setSizeInput(""); } };
  const addFaq = () => setFaq([...faq, { question: "", answer: "" }]);
  const updateFaq = (i: number, key: "question" | "answer", val: string) => { const f = [...faq]; f[i][key] = val; setFaq(f); };
  const removeFaq = (i: number) => setFaq(faq.filter((_, j) => j !== i));

  const handleSave = () => {
    if (!form.name.trim()) return;
    createProduct({
      ...form,
      tags: tags.length > 0 ? tags : undefined,
      colors: colors.length > 0 ? colors : undefined,
      sizes: sizes.length > 0 ? sizes : undefined,
      faq: faq.filter(f => f.question.trim() && f.answer.trim()).length > 0
        ? faq.filter(f => f.question.trim() && f.answer.trim()) : undefined,
    });
    router.push(`/dashboard/products`);
  };

  const ChipInput = ({ label, items, setItems, input, setInput, addItem, placeholder }: {
    label: string; items: string[]; setItems: (v: string[]) => void;
    input: string; setInput: (v: string) => void; addItem: () => void; placeholder: string;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)} placeholder={placeholder} className="bg-zinc-950 border-zinc-800"
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }} />
        <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="h-3.5 w-3.5" /></Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {items.map(item => (
            <span key={item} className="text-xs px-2 py-1 rounded-full bg-zinc-800 text-zinc-300 flex items-center gap-1">
              {item} <button onClick={() => setItems(items.filter(i => i !== item))} className="hover:text-white"><X className="h-3 w-3" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products"><Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h2 className="text-2xl font-bold">Add Product</h2>
          <p className="text-muted-foreground text-sm mt-1">Train your AI by adding product details here.</p>
        </div>
      </div>

      {/* Basic Info */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" /> Basic Details</CardTitle>
          <CardDescription>The AI will use this exact info when answering customer queries.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Product Name *</Label><Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="e.g. Black Panjabi" className="bg-zinc-950 border-zinc-800" /></div>
            <div className="space-y-2"><Label>Price *</Label><Input value={form.price} onChange={e => update("price", e.target.value)} placeholder="e.g. 1200 Tk" className="bg-zinc-950 border-zinc-800" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Discount</Label><Input value={form.discount} onChange={e => update("discount", e.target.value)} placeholder="e.g. 10% off" className="bg-zinc-950 border-zinc-800" /></div>
            <div className="space-y-2">
              <Label>Stock Status</Label>
              <select value={form.stock_status} onChange={e => update("stock_status", e.target.value)} className="w-full h-10 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 appearance-none">
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="preorder">Pre-order</option>
              </select>
            </div>
            <div className="space-y-2"><Label>Category</Label><Input value={form.category} onChange={e => update("category", e.target.value)} placeholder="e.g. Clothing" className="bg-zinc-950 border-zinc-800" /></div>
          </div>
          <div className="space-y-2"><Label>Delivery Info</Label><Input value={form.delivery_info} onChange={e => update("delivery_info", e.target.value)} placeholder="e.g. 60 Tk Inside Dhaka, 120 Tk Outside" className="bg-zinc-950 border-zinc-800" /></div>
          <div className="space-y-2"><Label>Description</Label><textarea value={form.description} onChange={e => update("description", e.target.value)} rows={3} placeholder="e.g. Premium cotton, comfortable fit." className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
        </CardContent>
      </Card>

      {/* Variants & Tags */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Variants & Tags</CardTitle>
          <CardDescription>Help the AI differentiate options and find this product.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ChipInput label="Colors" items={colors} setItems={setColors} input={colorInput} setInput={setColorInput} addItem={addColor} placeholder="e.g. Black" />
          <ChipInput label="Sizes" items={sizes} setItems={setSizes} input={sizeInput} setInput={setSizeInput} addItem={addSize} placeholder="e.g. XL" />
          <ChipInput label="Tags" items={tags} setItems={setTags} input={tagInput} setInput={setTagInput} addItem={addTag} placeholder="e.g. cotton" />
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle className="text-base">FAQ</CardTitle><CardDescription>Common questions the AI should know answers to.</CardDescription></div>
          <Button variant="outline" size="sm" onClick={addFaq}><Plus className="h-3.5 w-3.5 mr-1" /> Add FAQ</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {faq.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No FAQs yet. Click "Add FAQ" to teach the AI common answers.</p>}
          {faq.map((f, i) => (
            <div key={i} className="p-4 rounded-lg border border-zinc-800 space-y-3 relative">
              <button onClick={() => removeFaq(i)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              <div className="space-y-1.5"><Label className="text-xs">Question</Label><Input value={f.question} onChange={e => updateFaq(i, "question", e.target.value)} placeholder="e.g. COD available?" className="bg-zinc-950 border-zinc-800" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Answer</Label><Input value={f.answer} onChange={e => updateFaq(i, "answer", e.target.value)} placeholder="e.g. Yes, Cash on Delivery is available." className="bg-zinc-950 border-zinc-800" /></div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notes & Actions */}
      <Card className="border-border/50">
        <CardContent className="pt-6 space-y-5">
          <div className="space-y-2"><Label>Internal Notes (Not shown to customers)</Label><textarea value={form.notes} onChange={e => update("notes", e.target.value)} rows={2} placeholder="e.g. Supplier contact: Rahim Bhai" className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/20" /></div>
          <div className="flex justify-end gap-3">
            <Link href="/dashboard/products"><Button variant="outline">Cancel</Button></Link>
            <Button onClick={handleSave} disabled={!form.name.trim()} className="bg-white text-black hover:bg-zinc-200"><Save className="mr-2 h-4 w-4" /> Save Product</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
