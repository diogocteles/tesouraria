import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function SucessoPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">✅</div>
        <h1 className="text-2xl font-bold text-green-900">Fatura submetida!</h1>
        <p className="text-green-700">
          A tua fatura foi registada com sucesso e está a aguardar aprovação da tesouraria.
        </p>
        {id && (
          <p className="text-xs text-gray-400 font-mono bg-white rounded-lg px-3 py-2">
            Referência: {id}
          </p>
        )}
        <Link href="/submeter">
          <Button className="bg-green-600 hover:bg-green-700 w-full">
            Submeter outra fatura
          </Button>
        </Link>
        <Link href="/" className="block text-sm text-green-700 hover:text-green-900">
          ← Voltar ao início
        </Link>
      </div>
    </main>
  );
}
