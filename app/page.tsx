import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex-1 bg-white flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-brand-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-brand-100 rounded-full blur-3xl opacity-40 pointer-events-none" />

      <div className="text-center max-w-lg relative z-10">
        <div className="inline-flex items-center justify-center w-28 h-28 mb-6">
          <Image
            src="/logo.png"
            alt="Logo IbaSocial"
            width={112}
            height={112}
            className="w-full h-full object-contain drop-shadow-sm"
            priority
          />
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-brand-600 mb-4 tracking-tight">IbaSocial</h1>
        <p className="text-gray-600 text-lg sm:text-xl mb-3 font-medium">Cadastro de cestas de alimentacao</p>
        <p className="text-gray-500 text-sm sm:text-base mb-10 max-w-md mx-auto">
          Registre pedidos sociais, acompanhe o andamento dos casos e visualize a triagem por rede.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-xs sm:max-w-none mx-auto">
          <Link
            href="/cadastro"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-brand-600 text-white font-bold text-lg shadow-lg shadow-brand-200 hover:bg-brand-700 hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
          >
            Fazer cadastro
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white text-brand-600 font-bold text-lg border-2 border-brand-100 hover:border-brand-300 hover:bg-brand-50 hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
          >
            Ver dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
