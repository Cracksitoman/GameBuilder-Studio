
import React, { useState, useEffect } from 'react';
import { Scene, CanvasConfig } from '../types';
import { X, Map, Video, Check, MonitorSmartphone, Smartphone } from './Icons';

interface WorldSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  scene: Scene;
  canvasConfig: CanvasConfig;
  onUpdateScene: (updates: Partial<Scene>) => void;
  onUpdateCanvas: (config: CanvasConfig) => void;
}

export const WorldSettingsModal: React.FC<WorldSettingsModalProps> = ({
  isOpen,
  onClose,
  scene,
  canvasConfig,
  onUpdateScene,
  onUpdateCanvas
}) => {
  const [worldW, setWorldW] = useState(800);
  const [worldH, setWorldH] = useState(450);
  const [camW, setCamW] = useState(800);
  const [camH, setCamH] = useState(450);
  const [bgColor, setBgColor] = useState('#111827');

  useEffect(() => {
    if (isOpen) {
      setWorldW(scene.width || canvasConfig.width);
      setWorldH(scene.height || canvasConfig.height);
      setCamW(canvasConfig.width);
      setCamH(canvasConfig.height);
      setBgColor(scene.backgroundColor || '#111827');
    }
  }, [isOpen, scene, canvasConfig]);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateScene({ 
        width: worldW, 
        height: worldH,
        backgroundColor: bgColor
    });
    onUpdateCanvas({
        ...canvasConfig,
        width: camW,
        height: camH
    });
    onClose();
  };

  const setPreset = (w: number, h: number) => {
      setCamW(w);
      setCamH(h);
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-800/50">
          <div className="flex items-center space-x-2">
             <Map className="w-5 h-5 text-orange-500" />
             <h3 className="text-sm font-bold text-white">Configuración del Mundo</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8 flex-1 overflow-y-auto">
           
           {/* Section 1: World Size */}
           <div className="space-y-4">
               <div className="flex items-center space-x-2 mb-2">
                   <div className="p-1.5 bg-blue-900/30 rounded text-blue-400"><Map className="w-4 h-4" /></div>
                   <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Tamaño del Nivel (Mundo)</h4>
               </div>
               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="block text-[10px] text-gray-500 mb-1">ANCHO (Píxeles)</label>
                       <input 
                          type="number" 
                          value={worldW}
                          onChange={(e) => setWorldW(parseInt(e.target.value))}
                          className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none font-mono"
                       />
                   </div>
                   <div>
                       <label className="block text-[10px] text-gray-500 mb-1">ALTO (Píxeles)</label>
                       <input 
                          type="number" 
                          value={worldH}
                          onChange={(e) => setWorldH(parseInt(e.target.value))}
                          className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none font-mono"
                       />
                   </div>
               </div>
               <div className="flex items-center space-x-3 bg-gray-800 p-3 rounded-lg border border-gray-700">
                   <label className="text-xs text-gray-400">Color de Fondo</label>
                   <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="bg-transparent w-8 h-8 rounded cursor-pointer" />
                   <span className="text-xs font-mono text-gray-500">{bgColor}</span>
               </div>
               <p className="text-[10px] text-gray-500">
                   Este es el tamaño total de tu nivel. Si es más grande que la cámara, la cámara seguirá al jugador.
               </p>
           </div>

           <div className="h-px bg-gray-800"></div>

           {/* Section 2: Camera/Screen Size */}
           <div className="space-y-4">
               <div className="flex items-center space-x-2 mb-2">
                   <div className="p-1.5 bg-green-900/30 rounded text-green-400"><Video className="w-4 h-4" /></div>
                   <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Resolución de Cámara (Pantalla)</h4>
               </div>
               
               <div className="flex space-x-2 mb-2">
                   <button onClick={() => setPreset(800, 450)} className="flex-1 bg-gray-800 hover:bg-gray-700 p-2 rounded text-[10px] text-gray-300 border border-gray-700 flex items-center justify-center space-x-1">
                       <MonitorSmartphone className="w-3 h-3" /> <span>PC (16:9)</span>
                   </button>
                   <button onClick={() => setPreset(450, 800)} className="flex-1 bg-gray-800 hover:bg-gray-700 p-2 rounded text-[10px] text-gray-300 border border-gray-700 flex items-center justify-center space-x-1">
                       <Smartphone className="w-3 h-3" /> <span>Móvil (9:16)</span>
                   </button>
               </div>

               <div className="grid grid-cols-2 gap-4">
                   <div>
                       <label className="block text-[10px] text-gray-500 mb-1">ANCHO CÁMARA</label>
                       <input 
                          type="number" 
                          value={camW}
                          onChange={(e) => setCamW(parseInt(e.target.value))}
                          className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 outline-none font-mono"
                       />
                   </div>
                   <div>
                       <label className="block text-[10px] text-gray-500 mb-1">ALTO CÁMARA</label>
                       <input 
                          type="number" 
                          value={camH}
                          onChange={(e) => setCamH(parseInt(e.target.value))}
                          className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:border-green-500 outline-none font-mono"
                       />
                   </div>
               </div>
               <p className="text-[10px] text-gray-500">
                   Esto define cuánto se ve del juego a la vez. El juego se escalará para caber en cualquier pantalla real.
               </p>
           </div>

        </div>

        <div className="p-4 border-t border-gray-800 bg-gray-800/30">
          <button 
            onClick={handleSave}
            className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-900/20 flex items-center justify-center space-x-2 transition-transform active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Aplicar Cambios</span>
          </button>
        </div>
      </div>
    </div>
  );
};
