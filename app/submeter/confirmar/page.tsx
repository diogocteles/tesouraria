"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

type LineItem = { description: string; amount: number };

type Draft = {
  submitter_name: string;
  context: string;
  fileName: string;
  extracted: {
    vendor_name: string | null;
    nif: string | null;
    invoice_date: string | null;
    total_amount: number | null;
    values_breakdown: LineItem[];
  };
};

export default function ConfirmarPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [vendorName, setVendorName] = useState("");
  const [nif, setNif] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem("invoice_draft");
    if (!raw) { router.push("/submeter"); return; }
    const d: Draft = JSON.parse(raw);
    setDraft(d);
    setVendorName(d.extracted.vendor_name ?? "");
    setNif(d.extracted.nif ?? "");
    setInvoiceDate(d.extracted.invoice_date ?? "");
    setTotalAmount(d.extracted.total_amount?.toString() ?? "");
    setLineItems(d.extracted.values_breakdown ?? []);
  }, [router]);

  function updateLineItem(index: number, field: keyof LineItem, value: string) {
    setLineItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: field === "amount" ? Number(value) : value } : item
      )
    );
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, { description: "", amount: 0 }]);
  }

  function removeLineItem(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setLoading(true);
    setError("");

    const payload = {
      submitter_name: draft.submitter_name,
      context: draft.context,
      image_url: draft.fileName,
      vendor_name: vendorName || null,
      nif: nif || null,
      invoice_date: invoiceDate || null,
      total_amount: totalAmount ? Number(totalAmount) : null,
      values_breakdown: lineItems.length ? lineItems : null,
    };

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erro ao submeter fatura.");
      setLoading(false);
      return;
    }

    sessionStorage.removeItem("invoice_draft");
    router.push(`/submeter/sucesso?id=${data.id}`);
  }

  if (!draft) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/submeter" className="text-green-700 hover:text-green-900 text-sm">← Voltar</Link>
          <h1 className="text-xl font-bold text-green-900">Confirmar dados</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados extraídos — confirma ou corrige</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Submetido por</Label>
                  <Input value={draft.submitter_name} readOnly className="bg-gray-50" />
                </div>
                <div className="space-y-1">
                  <Label>Data da fatura</Label>
                  <Input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Fornecedor</Label>
                  <Input
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="Nome do fornecedor"
                  />
                </div>
                <div className="space-y-1">
                  <Label>NIF</Label>
                  <Input
                    value={nif}
                    onChange={(e) => setNif(e.target.value)}
                    placeholder="123456789"
                    maxLength={9}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Valor total (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Discriminação de valores</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                    + Adicionar linha
                  </Button>
                </div>
                {lineItems.length === 0 && (
                  <p className="text-sm text-gray-400 italic">Sem linhas extraídas</p>
                )}
                {lineItems.map((item, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={item.description}
                      onChange={(e) => updateLineItem(i, "description", e.target.value)}
                      placeholder="Descrição"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.amount}
                      onChange={(e) => updateLineItem(i, "amount", e.target.value)}
                      className="w-24"
                      placeholder="0.00"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(i)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>

              {draft.context && (
                <div className="bg-green-50 rounded-lg px-3 py-2 text-sm text-green-800">
                  <span className="font-medium">Contexto:</span> {draft.context}
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? "A submeter..." : "Confirmar e submeter ✓"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
