import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, getSupabaseAdmin } from "@/lib/supabase";
import { isAdminAuthenticated } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const isAdmin = await isAdminAuthenticated();
  if (!isAdmin) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const fileName = request.nextUrl.searchParams.get("file");
  if (!fileName) {
    return NextResponse.json({ error: "Ficheiro não especificado" }, { status: 400 });
  }

  // Data URL (in-memory / no-storage mode) — return directly
  if (fileName.startsWith("data:")) {
    return NextResponse.json({ url: fileName });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Armazenamento não configurado" }, { status: 503 });
  }

  const { data, error } = await getSupabaseAdmin()
    .storage.from("invoices")
    .createSignedUrl(fileName, 3600);

  if (error || !data) {
    return NextResponse.json({ error: "Erro ao gerar URL" }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
