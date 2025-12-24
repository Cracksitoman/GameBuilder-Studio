
import React from 'react';
import { Play, Save, Share2 } from './Icons';

// Custom SVG Koda Logo
const KodaLogo = ({ className = "w-8 h-8" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="30" width="60" height="45" rx="8" fill="url(#paint0_linear)" />
    <rect x="28" y="42" width="44" height="22" rx="4" fill="#1F1F1F" />
    <rect x="35" y="48" width="10" height="10" rx="1" fill="#4ADE80" />
    <rect x="55" y="48" width="10" height="10" rx="1" fill="#4ADE80" />
    <rect x="30" y="20" width="10" height="12" rx="2" fill="#F97316" />
    <rect x="60" y="20" width="10" height="12" rx="2" fill="#F97316" />
    <rect x="30" y="75" width="40" height="10" rx="2" fill="#9A3412" />
    <defs>
      <linearGradient id="paint0_linear" x1="50" y1="30" x2="50" y2="75" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FB923C" />
        <stop offset="1" stopColor="#EA580C" />
      </linearGradient>
    </defs>
  </svg>
);

interface NavbarProps {
  onPreview: () => void;
  onSave: () => void;
  onQuickSave: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onPreview, 
  onSave, 
  onQuickSave
}) => {
  return (
    <nav className="h-14 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4 select-none z-40 relative">
      <div className="flex items-center space-x-2">
        <KodaLogo className="w-9 h-9" />
        <span className="font-black text-xl tracking-tighter text-white hidden sm:inline">KODA <span className="text-orange-500 font-light">ENGINE</span></span>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        <button 
          onClick={onPreview}
          className="flex items-center space-x-2 px-6 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-full transition-colors text-sm font-bold shadow-lg shadow-orange-900/30 active:scale-95"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Jugar</span>
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <button 
          onClick={onQuickSave}
          className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white rounded-lg border border-gray-600 transition-colors text-xs"
          title="Guardar Proyecto (.gbs)"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Guardar</span>
        </button>

        <button 
          onClick={onSave}
          className="flex items-center space-x-2 px-3 py-1.5 bg-orange-900/40 hover:bg-orange-800 text-orange-200 hover:text-white rounded-lg border border-orange-800/50 transition-colors text-xs"
          title="Exportar Juego (APK/HTML)"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar</span>
        </button>
      </div>
    </nav>
  );
};
