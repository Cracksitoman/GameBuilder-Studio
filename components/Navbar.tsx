import React from 'react';
import { Play, Save, Download, Undo, Redo } from './Icons';

const KodaLogo = ({ className = "w-6 h-6" }) => (
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
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onPreview, onSave, onQuickSave, onUndo, onRedo, canUndo, canRedo
}) => {
  return (
    <nav className="h-11 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-2 select-none relative z-[100] overflow-hidden shrink-0">
      <div className="flex items-center space-x-1.5 shrink-0">
        <KodaLogo />
        <span className="font-black text-[11px] tracking-tighter text-white hidden xs:inline uppercase">KODA <span className="text-orange-500 font-light">ENG</span></span>
      </div>

      <div className="flex items-center space-x-1.5">
        <div className="flex bg-gray-800 rounded-md p-0.5 border border-gray-700">
            <button onClick={onUndo} disabled={!canUndo} className={`p-1 rounded ${canUndo ? 'text-gray-300' : 'text-gray-600'}`}><Undo className="w-3.5 h-3.5" /></button>
            <button onClick={onRedo} disabled={!canRedo} className={`p-1 rounded ${canRedo ? 'text-gray-300' : 'text-gray-600'}`}><Redo className="w-3.5 h-3.5" /></button>
        </div>

        <button 
          onClick={onPreview}
          className="flex items-center space-x-1 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded-full text-[10px] font-black shadow-lg transition-transform active:scale-95 uppercase"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Jugar</span>
        </button>
      </div>

      <div className="flex items-center space-x-1">
        <button onClick={onQuickSave} className="p-1.5 bg-gray-800 text-gray-300 rounded-md border border-gray-700 hover:bg-gray-700 transition-colors" title="Guardar Proyecto Local"><Save className="w-3.5 h-3.5" /></button>
        {/* Cambiado: Eliminado 'hidden xs:block' para que sea visible siempre */}
        <button onClick={onSave} className="p-1.5 bg-blue-900/40 text-blue-200 rounded-md border border-blue-800/50 hover:bg-blue-900/60 transition-colors" title="Exportar Juego"><Download className="w-3.5 h-3.5" /></button>
      </div>
    </nav>
  );
};