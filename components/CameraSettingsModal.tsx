import React from 'react';
import { GameObject, CameraConfig } from '../types';
import { X, Video, Crosshair, User } from './Icons';

interface CameraSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  objects: GameObject[];
  cameraConfig: CameraConfig;
  onUpdateCamera: (config: CameraConfig) => void;
}

export const CameraSettingsModal: React.FC<CameraSettingsModalProps> = ({
  isOpen,
  onClose,
  objects,
  cameraConfig,
  onUpdateCamera
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-800/50">
          <div className="flex items-center space-x-2">
             <Video className="w-5 h-5 text-cyan-400" />
             <h3 className="text-sm font-bold text-white">Configuración de Cámara</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
           
           <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl">
               <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Objetivo a Seguir</label>
               <div className="relative">
                   <select 
                      value={cameraConfig.targetObjectId || ''}
                      onChange={(e) => onUpdateCamera({ ...cameraConfig, targetObjectId: e.target.value || null })}
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-sm text-white focus:border-cyan-500 outline-none appearance-none"
                   >
                       <option value="">-- Cámara Estática (0,0) --</option>
                       {objects.map(obj => (
                           <option key={obj.id} value={obj.id}>{obj.name} ({obj.type})</option>
                       ))}
                   </select>
                   <div className="absolute right-3 top-3 pointer-events-none text-gray-400">
                       <Crosshair className="w-4 h-4" />
                   </div>
               </div>
               <p className="text-[10px] text-gray-500 mt-2">
                   La cámara se centrará automáticamente en este objeto durante el juego.
               </p>
           </div>

           <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <label className="text-sm text-gray-300">Movimiento Suave</label>
                    <div className="relative">
                        <input 
                            type="checkbox" 
                            checked={cameraConfig.smooth} 
                            onChange={(e) => onUpdateCamera({ ...cameraConfig, smooth: e.target.checked })}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                    </div>
                </div>

                {cameraConfig.smooth && (
                    <div>
                         <div className="flex justify-between text-xs mb-1">
                             <span className="text-gray-400">Velocidad de seguimiento</span>
                             <span className="text-cyan-400 font-bold">{Math.round(cameraConfig.followSpeed * 100)}%</span>
                         </div>
                         <input 
                            type="range" 
                            min="0.01" max="1" step="0.01"
                            value={cameraConfig.followSpeed}
                            onChange={(e) => onUpdateCamera({ ...cameraConfig, followSpeed: parseFloat(e.target.value) })}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                         />
                    </div>
                )}
           </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-800/30 text-center">
             <button onClick={onClose} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded-lg transition-colors shadow-lg">
                 Aceptar
             </button>
        </div>

      </div>
    </div>
  );
};