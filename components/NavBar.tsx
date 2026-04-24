'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/',          label: 'Início',    icon: '🏠' },
  { href: '/cadastro',  label: 'Pedidos',   icon: '📋' },
  { href: '/entregas',  label: 'Saídas',    icon: '🚚' },
  { href: '/estoque',   label: 'Estoque',   icon: '📦' },
  { href: '/doacoes',   label: 'Doações',   icon: '🤝' },
  { href: '/celulas',   label: 'Células',   icon: '🏘️' },
  { href: '/produtos',  label: 'Produtos',  icon: '🥫' },
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="bg-orange-500 shadow-lg sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 flex items-center gap-1 overflow-x-auto">
        <span className="text-white font-black text-lg mr-4 whitespace-nowrap py-3">IbaSocial</span>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-3.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                active
                  ? 'border-white text-white'
                  : 'border-transparent text-orange-100 hover:text-white hover:border-orange-200'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
