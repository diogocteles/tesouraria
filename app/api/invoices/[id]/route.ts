import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, getSupabaseAdmin } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/auth";
import { getInvoice, updateInvoice } from "@/lib/store";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, notes } = body;

  if (!["pending", "paid"].includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    const { error } = await getSupabaseAdmin()
      .from("invoices")
      .update({
        status,
        paid_at: status === "paid" ? new Date().toISOString() : null,
        notes: notes ?? undefined,
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Erro ao atualizar fatura" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // In-memory fallback
  const ok = updateInvoice(id, {
    status,
    paid_at: status === "paid" ? new Date().toISOString() : null,
    ...(notes !== undefined ? { notes } : {}),
  });

  if (!ok) return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  if (isSupabaseConfigured()) {
    const { data, error } = await getSupabaseAdmin()
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 });

    const { data: signedUrl } = await getSupabaseAdmin()
      .storage.from("invoices")
      .createSignedUrl(data.image_url, 3600);

    return NextResponse.json({ ...data, signed_image_url: signedUrl?.signedUrl });
  }

  const invoice = getInvoice(id);
  if (!invoice) return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 });
  return NextResponse.json(invoice);
}
