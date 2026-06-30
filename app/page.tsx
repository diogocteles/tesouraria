import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="space-y-2">
          <div className="text-5xl">⚜️</div>
          <h1 className="text-3xl font-bold text-green-900">Tesouraria</h1>
          <p className="text-green-700 text-lg">Gestão de faturas do grupo scout</p>
        </div>

        <div className="grid gap-4">
          <Link
            href="/submeter"
            className="block bg-green-600 hover:bg-green-700 text-white rounded-2xl p-6 transition-colors"
          >
            <div className="text-3xl mb-2">📄</div>
            <div className="font-semibold text-xl">Submeter Fatura</div>
            <div className="text-green-100 text-sm mt-1">
              Fotografa a tua fatura e submete para reembolso
            </div>
          </Link>

          <Link
            href="/backoffice"
            className="block bg-white hover:bg-gray-50 text-gray-800 rounded-2xl p-6 border border-gray-200 transition-colors"
          >
            <div className="text-3xl mb-2">🔐</div>
            <div className="font-semibold text-xl">Backoffice</div>
            <div className="text-gray-500 text-sm mt-1">
              Área reservada à tesouraria
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
