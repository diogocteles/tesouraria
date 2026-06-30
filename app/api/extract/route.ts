import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, getSupabaseAdmin } from "@/lib/supabase";
import { extractInvoiceData } from "@/lib/claude";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Ficheiro não encontrado" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type as AllowedType)) {
    return NextResponse.json(
      { error: "Tipo de ficheiro inválido. Aceite: JPEG, PNG, WEBP" },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  let fileName: string;

  if (isSupabaseConfigured()) {
    // Upload image to Supabase Storage
    const safeName = `${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
    const { error: uploadError } = await getSupabaseAdmin()
      .storage.from("invoices")
      .upload(safeName, buffer, { contentType: file.type });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Erro ao guardar imagem" }, { status: 500 });
    }
    fileName = safeName;
  } else {
    // No Supabase — encode the image as a data URL so it survives in sessionStorage
    const base64 = buffer.toString("base64");
    fileName = `data:${file.type};base64,${base64}`;
  }

  // Extract data with Claude Vision
  const base64 = buffer.toString("base64");
  const extracted = await extractInvoiceData(base64, file.type as AllowedType);

  return NextResponse.json({ extracted, fileName });
}
