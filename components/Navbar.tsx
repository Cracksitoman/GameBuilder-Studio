import React from 'react';
import { Play, Save, MonitorSmartphone, Settings, Smartphone, Share2, Grid3x3, Variable, Clapperboard } from './Icons';
import { CanvasConfig } from '../types';

interface NavbarProps {
  onPreview: () => void;
  onSave: () => void; // This triggers the Export modal
  onQuickSave: () => void; // New: Direct Save
  onOpenAssets: () => void;
  onOpenVariables: () => void;
  onOpenScenes: () => void; // New
  canvasConfig: CanvasConfig;
  onToggleOrientation: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onPreview, 
  onSave, 
  onQuickSave, 
  onOpenAssets, 
  onOpenVariables,
  onOpenScenes,
  canvasConfig, 
  onToggleOrientation 
}) => {
  return (
    <nav className="h-14 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4 select-none">
      <div className="flex items-center space-x-3">
        <div className="bg-blue-600 p-1.5 rounded-lg">
          <MonitorSmartphone className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight text-white hidden sm:inline">GameBuilder <span className="text-blue-400 text-xs font-normal">Android</span></span>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        {/* Scenes Button */}
        <button 
          onClick={onOpenScenes}
          className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-xs text-gray-300 transition-colors"
          title="Gestor de Escenas"
        >
          <Clapperboard className="w-4 h-4 text-orange-400" />
          <span className="hidden lg:inline">Escenas</span>
        </button>

        {/* Assets Button */}
        <button 
          onClick={onOpenAssets}
          className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-xs text-gray-300 transition-colors"
          title="Gestor de Sprites"
        >
          <Grid3x3 className="w-4 h-4 text-purple-400" />
          <span className="hidden lg:inline">Sprites</span>
        </button>

         {/* Variables Button */}
         <button 
          onClick={onOpenVariables}
          className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-xs text-gray-300 transition-colors"
          title="Variables Globales"
        >
          <Variable className="w-4 h-4 text-pink-400" />
          <span className="hidden lg:inline">Variables</span>
        </button>

        {/* Orientation Toggle */}
        <button 
          onClick={onToggleOrientation}
          className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-xs text-gray-300 transition-colors"
          title="Cambiar Orientación"
        >
          {canvasConfig.mode === 'LANDSCAPE' ? (
            <MonitorSmartphone className="w-4 h-4 rotate-90" />
          ) : (
            <Smartphone className="w-4 h-4" />
          )}
          <span className="hidden lg:inline">{canvasConfig.mode === 'LANDSCAPE' ? 'Horizontal' : 'Vertical'}</span>
        </button>

        <div className="h-6 w-px bg-gray-700 hidden sm:block"></div>

        {/* Preview Button */}
        <button 
          onClick={onPreview}
          className="flex items-center space-x-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded transition-colors text-sm font-medium shadow-sm shadow-green-900/20"
        >
          <Play className="w-4 h-4 fill-current" />
          <span className="hidden sm:inline">Jugar</span>
        </button>
      </div>

      <div className="flex items-center space-x-2">
        {/* Quick Save Button */}
        <button 
          onClick={onQuickSave}
          className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white rounded border border-gray-600 transition-colors text-xs"
          title="Guardar Proyecto (.json)"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Guardar</span>
        </button>

        <button 
          onClick={onSave}
          className="flex items-center space-x-2 px-3 py-1.5 bg-blue-900/40 hover:bg-blue-800 text-blue-200 hover:text-white rounded border border-blue-800/50 transition-colors text-xs"
          title="Exportar Juego (APK/HTML)"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar</span>
        </button>
      </div>
    </nav>
  );
};