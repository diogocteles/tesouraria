import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import InvoiceTable from "@/components/InvoiceTable";
import LogoutButton from "@/components/LogoutButton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Invoice } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function fetchInvoices(): Promise<Invoice[]> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/invoices`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });

  if (res.status === 401) redirect("/backoffice");
  if (!res.ok) return [];

  return res.json();
}

export default async function DashboardPage() {
  const invoices = await fetchInvoices();

  const pendingCount = invoices.filter((i) => i.status === "pending").length;
  const paidCount = invoices.filter((i) => i.status === "paid").length;
  const total = invoices.reduce((sum, i) => sum + (i.total_amount ?? 0), 0);

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚜️</span>
          <div>
            <h1 className="font-bold text-gray-900">Tesouraria — Backoffice</h1>
            <p className="text-xs text-gray-500">Gestão de faturas</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm">Início</Button>
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
            <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
            <p className="text-xs text-gray-400">faturas</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-amber-600 uppercase tracking-wide">Pendentes</p>
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-xs text-gray-400">por pagar</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-green-600 uppercase tracking-wide">Valor total</p>
            <p className="text-2xl font-bold text-green-700">{total.toFixed(2)} €</p>
            <p className="text-xs text-gray-400">{paidCount} pagas</p>
          </div>
        </div>

        <InvoiceTable invoices={invoices} />
      </div>
    </main>
  );
}
