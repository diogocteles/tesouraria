import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, getSupabaseAdmin } from "@/lib/supabase";
import { extractInvoiceData } from "@/lib/claude";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

async function uploadToStorage(buffer: Buffer, file: File): Promise<string | null> {
  try {
    const safeName = `${Date.now()}-${file.name.replace(/[^a-z0-9.\-_]/gi, "_")}`;
    const { error } = await getSupabaseAdmin()
      .storage.from("invoices")
      .upload(safeName, buffer, { contentType: file.type });

    if (error) {
      console.warn("Storage upload failed, falling back to data URL:", error.message);
      return null;
    }
    return safeName;
  } catch (e) {
    console.warn("Storage upload threw, falling back to data URL:", e);
    return null;
  }
}

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
  const base64 = buffer.toString("base64");

  // Try Supabase Storage; fall back to inline data URL if unavailable
  let fileName: string;
  if (isSupabaseConfigured()) {
    const storageName = await uploadToStorage(buffer, file);
    fileName = storageName ?? `data:${file.type};base64,${base64}`;
  } else {
    fileName = `data:${file.type};base64,${base64}`;
  }

  // Extract data with Claude Vision
  const extracted = await extractInvoiceData(base64, file.type as AllowedType);

  return NextResponse.json({ extracted, fileName });
}
