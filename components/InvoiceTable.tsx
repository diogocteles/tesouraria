"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Invoice } from "@/lib/supabase";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-PT");
}

function formatAmount(amount: number | null) {
  if (amount === null) return "—";
  return `${amount.toFixed(2)} €`;
}

type Props = { invoices: Invoice[] };

export default function InvoiceTable({ invoices: initialInvoices }: Props) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  async function toggleStatus(invoice: Invoice) {
    const newStatus = invoice.status === "paid" ? "pending" : "paid";
    setLoadingId(invoice.id);

    const res = await fetch(`/api/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invoice.id
            ? { ...inv, status: newStatus, paid_at: newStatus === "paid" ? new Date().toISOString() : null }
            : inv
        )
      );
    }
    setLoadingId(null);
  }

  async function openDetail(invoice: Invoice) {
    setSelected(invoice);
    setImageUrl(null);
    setImageLoading(true);

    const res = await fetch(`/api/image?file=${encodeURIComponent(invoice.image_url)}`);
    if (res.ok) {
      const data = await res.json();
      setImageUrl(data.url);
    }
    setImageLoading(false);
  }

  return (
    <>
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900">Faturas submetidas</h2>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data fatura</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>NIF</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Submetido por</TableHead>
                <TableHead>Contexto</TableHead>
                <TableHead>Submetido em</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-gray-400 py-8">
                    Nenhuma fatura submetida ainda.
                  </TableCell>
                </TableRow>
              )}
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} className="cursor-pointer hover:bg-gray-50">
                  <TableCell onClick={() => openDetail(invoice)}>
                    {formatDate(invoice.invoice_date)}
                  </TableCell>
                  <TableCell onClick={() => openDetail(invoice)} className="font-medium">
                    {invoice.vendor_name ?? <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell onClick={() => openDetail(invoice)} className="font-mono text-sm">
                    {invoice.nif ?? <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell onClick={() => openDetail(invoice)} className="font-medium">
                    {formatAmount(invoice.total_amount)}
                  </TableCell>
                  <TableCell onClick={() => openDetail(invoice)}>
                    {invoice.submitter_name}
                  </TableCell>
                  <TableCell onClick={() => openDetail(invoice)} className="max-w-[160px] truncate text-gray-600 text-sm">
                    {invoice.context ?? <span className="text-gray-400">—</span>}
                  </TableCell>
                  <TableCell onClick={() => openDetail(invoice)} className="text-sm text-gray-500">
                    {formatDate(invoice.created_at)}
                  </TableCell>
                  <TableCell onClick={() => openDetail(invoice)}>
                    <Badge
                      variant={invoice.status === "paid" ? "default" : "secondary"}
                      className={
                        invoice.status === "paid"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                      }
                    >
                      {invoice.status === "paid" ? "Pago" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={invoice.status === "paid" ? "outline" : "default"}
                      onClick={(e) => { e.stopPropagation(); toggleStatus(invoice); }}
                      disabled={loadingId === invoice.id}
                      className={
                        invoice.status === "paid"
                          ? ""
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }
                    >
                      {loadingId === invoice.id
                        ? "..."
                        : invoice.status === "paid"
                        ? "Marcar pendente"
                        : "Marcar pago"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selected.vendor_name ?? "Fatura"} —{" "}
                {formatDate(selected.invoice_date)}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Submetido por</span>
                  <p className="font-medium">{selected.submitter_name}</p>
                </div>
                <div>
                  <span className="text-gray-500">NIF</span>
                  <p className="font-mono font-medium">{selected.nif ?? "—"}</p>
                </div>
                <div>
                  <span className="text-gray-500">Valor total</span>
                  <p className="font-medium text-lg">{formatAmount(selected.total_amount)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Estado</span>
                  <p>
                    <Badge
                      className={
                        selected.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }
                    >
                      {selected.status === "paid" ? "Pago" : "Pendente"}
                    </Badge>
                  </p>
                </div>
                {selected.context && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Contexto</span>
                    <p>{selected.context}</p>
                  </div>
                )}
              </div>

              {selected.values_breakdown && selected.values_breakdown.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Discriminação</p>
                  <div className="rounded-lg border divide-y text-sm">
                    {selected.values_breakdown.map((item, i) => (
                      <div key={i} className="flex justify-between px-3 py-2">
                        <span>{item.description}</span>
                        <span className="font-medium">{item.amount.toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500 mb-2">Fotografia da fatura</p>
                {imageLoading ? (
                  <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                    A carregar...
                  </div>
                ) : imageUrl ? (
                  <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Fatura"
                      className="rounded-lg border max-h-64 w-full object-contain bg-gray-50"
                    />
                  </a>
                ) : (
                  <div className="h-24 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                    Imagem não disponível
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
