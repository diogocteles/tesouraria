import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, getSupabaseAdmin } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/auth";
import { storeInvoice, getAllInvoices } from "@/lib/store";
import type { Invoice } from "@/lib/supabase";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { submitter_name, context, image_url, vendor_name, nif, invoice_date, total_amount, values_breakdown } = body;

  if (!submitter_name || !image_url) {
    return NextResponse.json({ error: "Campos obrigatórios em falta" }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabaseAdmin()
      .from("invoices")
      .insert({
        submitter_name,
        context: context || null,
        image_url,
        vendor_name: vendor_name || null,
        nif: nif || null,
        invoice_date: invoice_date || null,
        total_amount: total_amount ? Number(total_amount) : null,
        values_breakdown: values_breakdown || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ error: "Erro ao guardar fatura" }, { status: 500 });
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  }

  // In-memory fallback
  const invoice: Invoice = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    submitter_name,
    context: context || null,
    image_url,
    vendor_name: vendor_name || null,
    nif: nif || null,
    invoice_date: invoice_date || null,
    total_amount: total_amount ? Number(total_amount) : null,
    values_breakdown: values_breakdown || null,
    status: "pending",
    paid_at: null,
    notes: null,
  };
  storeInvoice(invoice);

  return NextResponse.json({ id: invoice.id }, { status: 201 });
}

export async function GET() {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabaseAdmin()
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Erro ao carregar faturas" }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  return NextResponse.json(getAllInvoices());
}
