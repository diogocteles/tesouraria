import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type ExtractedInvoice = {
  vendor_name: string | null;
  nif: string | null;
  invoice_date: string | null;
  total_amount: number | null;
  values_breakdown: { description: string; amount: number }[];
};

export async function extractInvoiceData(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"
): Promise<ExtractedInvoice> {
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          {
            type: "text",
            text: `Extrai os seguintes dados desta fatura em JSON válido:
{
  "vendor_name": "nome do fornecedor",
  "nif": "NIF/NIPC do fornecedor (apenas 9 dígitos, sem espaços ou pontos)",
  "invoice_date": "YYYY-MM-DD",
  "total_amount": 0.00,
  "values_breakdown": [{"description": "descrição do item", "amount": 0.00}]
}
Se um campo não for encontrado, usa null. Responde APENAS com o JSON, sem texto adicional.`,
          },
        ],
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude não devolveu JSON válido");

  return JSON.parse(jsonMatch[0]) as ExtractedInvoice;
}
