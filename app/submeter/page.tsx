"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function SubmeterPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const context = (form.elements.namedItem("context") as HTMLTextAreaElement).value.trim();
    const file = fileRef.current?.files?.[0];

    if (!file) {
      setError("Por favor seleciona uma fotografia da fatura.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/extract", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao processar fatura.");
        setLoading(false);
        return;
      }

      // Pass extracted data + submission info via sessionStorage
      sessionStorage.setItem(
        "invoice_draft",
        JSON.stringify({
          submitter_name: name,
          context,
          fileName: data.fileName,
          extracted: data.extracted,
        })
      );

      router.push("/submeter/confirmar");
    } catch {
      setError("Erro de ligação. Tenta novamente.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-green-700 hover:text-green-900 text-sm">← Início</Link>
          <h1 className="text-xl font-bold text-green-900">Submeter Fatura</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados da submissão</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="name">O teu nome *</Label>
                <Input id="name" name="name" required placeholder="Nome completo" />
              </div>

              <div className="space-y-1">
                <Label htmlFor="context">Contexto / motivo</Label>
                <Textarea
                  id="context"
                  name="context"
                  placeholder="Ex: Material para a reunião de sábado, acampamento de verão..."
                  rows={3}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="file">Fotografia da fatura *</Label>
                <Input
                  id="file"
                  name="file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required
                  ref={fileRef}
                  onChange={handleFileChange}
                />
              </div>

              {preview && (
                <div className="rounded-lg overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Pré-visualização" className="w-full max-h-48 object-contain bg-gray-50" />
                </div>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}

              <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
                {loading ? "A extrair dados..." : "Extrair dados →"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
