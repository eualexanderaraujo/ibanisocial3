import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'IbaSocial — Cadastro de Cestas',
  description: 'Sistema de cadastro de pedidos de cestas de alimentação da Igreja Batista',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <main className="flex-grow flex flex-col">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
