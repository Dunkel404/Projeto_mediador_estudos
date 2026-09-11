import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-[#090b10] text-slate-100 font-mono p-4">
      <h2 className="text-2xl font-bold text-sky-400 mb-2">404 - Página Não Encontrada</h2>
      <p className="text-xs text-slate-400 mb-6">O nó ou caminho solicitado não existe no grafo curricular.</p>
      <Link
        href="/"
        className="tactile-btn tactile-btn-sky px-4 py-2 text-xs font-mono"
      >
        Retornar à Trilha
      </Link>
    </div>
  );
}
