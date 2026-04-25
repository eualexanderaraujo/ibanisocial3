import Image from 'next/image';
import Link from 'next/link';

const MENU_ITEMS = [
  {
    title: 'Pedidos',
    description: 'Cadastro de pedidos e triagem social',
    icon: '📋',
    href: '/pedidos',
    color: 'bg-orange-50',
    iconColor: 'text-orange-600',
  },
  {
    title: 'Saídas',
    description: 'Registro de entregas e baixas',
    icon: '🚚',
    href: '/entregas',
    color: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    title: 'Estoque',
    description: 'Controle de itens e validade',
    icon: '📦',
    href: '/estoque',
    color: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  {
    title: 'Doações',
    description: 'Registro de entrada de itens',
    icon: '🤝',
    href: '/doacoes',
    color: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    title: 'Células',
    description: 'Gestão de redes e células',
    icon: '🏘️',
    href: '/celulas',
    color: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    title: 'Produtos',
    description: 'Cadastro de itens e categorias',
    icon: '🥫',
    href: '/produtos',
    color: 'bg-red-50',
    iconColor: 'text-red-600',
  },
  {
    title: 'Dashboard',
    description: 'Relatórios e indicadores de impacto',
    icon: '📊',
    href: '/dashboard',
    color: 'bg-teal-50',
    iconColor: 'text-teal-600',
  },
  {
    title: 'Análises',
    description: 'Estatísticas sociais, doações e perfil dos beneficiados',
    icon: '📈',
    href: '/analises',
    color: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
  },
];

export default function Home() {
  return (
    <div className="flex-1 bg-slate-100 flex flex-col items-center pb-20 relative overflow-hidden">
      {/* Header Premium */}
      <div className="w-full relative bg-slate-900 overflow-hidden mb-12">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 opacity-90"></div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-orange-600/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-6xl mx-auto px-6 py-12 lg:py-16 text-center flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-white/5 backdrop-blur-md rounded-3xl shadow-xl border border-white/10">
            <Image
              src="/logo.png"
              alt="Logo IbaniSocial"
              width={64}
              height={64}
              className="w-12 h-12 object-contain"
              priority
            />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">IbaniSocial</h1>
          <p className="text-slate-400 text-lg max-w-md mx-auto font-medium">
            Bem-vindo ao sistema de gestão de ação social da IBANI Atitude.
          </p>
        </div>
      </div>

      <div className="w-full max-w-6xl relative z-10 px-4 sm:px-6">
        {/* Menu Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative flex flex-col p-6 bg-white rounded-3xl border border-gray-200 shadow-xl shadow-slate-900/5 hover:-translate-y-1 hover:border-orange-200 transition-all duration-300 overflow-hidden"
            >
              {/* Card Background Glow */}
              <div className={`absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 ${item.color} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className={`flex items-center justify-center w-14 h-14 rounded-2xl ${item.color} ${item.iconColor} text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                {item.icon}
              </div>
              
              <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-orange-600 transition-colors">
                {item.title}
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                {item.description}
              </p>
              
              <div className="mt-6 flex items-center text-orange-600 text-sm font-bold opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                Acessar agora
                <span className="ml-2">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
