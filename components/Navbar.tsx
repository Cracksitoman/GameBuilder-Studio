import React from 'react';
import { Play, Save, MonitorSmartphone, Share2, ArrowRight } from './Icons';
import { CanvasConfig } from '../types';

interface NavbarProps {
  onPreview: () => void;
  onSave: () => void; // This triggers the Export modal
  onQuickSave: () => void; // New: Direct Save
  onOpenAssets?: () => void; // Removed from UI but kept in interface to avoid breaking build if passed
  onOpenVariables?: () => void;
  onOpenScenes?: () => void; 
  onOpenCamera?: () => void; 
  canvasConfig?: CanvasConfig;
  onToggleOrientation?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onPreview, 
  onSave, 
  onQuickSave
}) => {
  return (
    <nav className="h-14 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4 select-none z-40 relative">
      <div className="flex items-center space-x-3">
        <div className="bg-blue-600 p-1.5 rounded-lg">
          <MonitorSmartphone className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight text-white hidden sm:inline">GameBuilder <span className="text-blue-400 text-xs font-normal">Android</span></span>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
         {/* Center Action: Play */}
        <button 
          onClick={onPreview}
          className="flex items-center space-x-2 px-6 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors text-sm font-bold shadow-lg shadow-green-900/30"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Jugar</span>
        </button>
      </div>

      <div className="flex items-center space-x-2">
        {/* Quick Save Button */}
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
          className="flex items-center space-x-2 px-3 py-1.5 bg-blue-900/40 hover:bg-blue-800 text-blue-200 hover:text-white rounded-lg border border-blue-800/50 transition-colors text-xs"
          title="Exportar Juego (APK/HTML)"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar</span>
        </button>
      </div>
    </nav>
  );
};