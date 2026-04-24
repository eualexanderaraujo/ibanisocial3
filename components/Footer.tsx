import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-100 py-6 sm:py-10 relative z-10">
      <div className="max-w-6xl mx-auto px-4 flex flex-col items-center justify-center space-y-4">
        <div className="opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <Image
            src="/logo.png"
            alt="Logo IBANI"
            width={32}
            height={32}
            className="w-8 h-8 object-contain"
          />
        </div>
        <p className="text-xs sm:text-sm text-gray-400 text-center font-medium">
          &copy; {new Date().getFullYear()} Igreja Batista Atitude de Nova Iguaçu <br className="sm:hidden" />
          <span className="hidden sm:inline"> | </span> Ação Social | IBANI Atitude
        </p>
      </div>
    </footer>
  );
}
