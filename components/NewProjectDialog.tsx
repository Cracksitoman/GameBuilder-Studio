import React, { useState } from 'react';
import { X, Folder, Layout } from './Icons';

interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, orientation: 'LANDSCAPE' | 'PORTRAIT') => void;
}

export const NewProjectDialog: React.FC<NewProjectDialogProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('Mi Gran Juego');
  const [orientation, setOrientation] = useState<'LANDSCAPE' | 'PORTRAIT'>('LANDSCAPE');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1f2937] border border-gray-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col transform transition-all scale-100">
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-[#111827]">
           <div className="flex items-center space-x-2">
              <Layout className="w-5 h-5 text-blue-500"/>
              <h3 className="text-lg font-bold text-white">Nuevo Proyecto</h3>
           </div>
           <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white"/></button>
        </div>

        <div className="p-6 space-y-6">
            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nombre del Proyecto</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#111827] border border-gray-600 rounded-lg p-3 text-white focus:border-orange-500 outline-none transition-colors"
                  placeholder="Ej. Super Juego"
                  autoFocus
                />
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Ubicación (Simulada)</label>
                <div className="flex space-x-2">
                    <input 
                      readOnly 
                      value="/storage/emulated/0/KodaProj" 
                      className="flex-1 bg-[#111827] border border-gray-600 rounded-lg p-3 text-gray-500 text-sm font-mono select-none"
                    />
                    <button className="px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg border border-gray-600 flex items-center transition-colors">
                        <Folder className="w-4 h-4 mr-2"/> <span className="text-sm">Examinar</span>
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Orientación Inicial</label>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setOrientation('LANDSCAPE')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${orientation === 'LANDSCAPE' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-[#111827] hover:border-gray-500'}`}
                    >
                        <div className="w-16 h-10 border-2 border-current rounded mb-2 opacity-80"></div>
                        <span className={`text-sm font-bold ${orientation === 'LANDSCAPE' ? 'text-orange-500' : 'text-gray-400'}`}>Landscape</span>
                    </button>
                    <button 
                        onClick={() => setOrientation('PORTRAIT')}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${orientation === 'PORTRAIT' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-700 bg-[#111827] hover:border-gray-500'}`}
                    >
                        <div className="w-10 h-16 border-2 border-current rounded mb-2 opacity-80"></div>
                        <span className={`text-sm font-bold ${orientation === 'PORTRAIT' ? 'text-orange-500' : 'text-gray-400'}`}>Portrait</span>
                    </button>
                </div>
            </div>
        </div>

        <div className="p-4 border-t border-gray-700 bg-[#111827] flex justify-end space-x-3">
            <button onClick={onClose} className="px-6 py-2 text-gray-400 hover:text-white font-bold transition-colors text-sm">Cancelar</button>
            <button onClick={() => onCreate(name, orientation)} className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-bold shadow-lg transition-transform active:scale-95 text-sm">Crear Proyecto</button>
        </div>
      </div>
    </div>
  );
};