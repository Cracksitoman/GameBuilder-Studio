import React, { useState, useEffect } from 'react';
import { Save, X, FileJson, Check, Edit } from './Icons';

interface SaveProjectModalProps {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export const SaveProjectModal: React.FC<SaveProjectModalProps> = ({ isOpen, currentName, onClose, onConfirm }) => {
  const [name, setName] = useState(currentName);

  // Sync name when modal opens or currentName changes externally
  useEffect(() => {
    if (isOpen) {
        setName(currentName);
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (name.trim()) {
      onConfirm(name.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-sm rounded-2xl shadow-2xl flex flex-col overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-800/50">
          <h3 className="text-sm font-bold text-white flex items-center">
            <Save className="w-4 h-4 mr-2 text-blue-400" />
            Guardar Proyecto
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
           <div className="flex flex-col space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre del Archivo</label>
              <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileJson className="w-4 h-4 text-gray-500" />
                 </div>
                 <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="w-full bg-gray-950 border border-gray-700 rounded-xl pl-9 pr-12 py-3 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                    placeholder="Mi Juego Increíble"
                 />
                 <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-xs text-gray-600 font-mono">.gbs</span>
                 </div>
              </div>
              <p className="text-[10px] text-gray-500">
                 Se descargará en tu dispositivo. Si usas el mismo nombre, se actualizará (o creará una copia según tu navegador).
              </p>
           </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-800/30 flex space-x-3">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-900/20 flex items-center justify-center space-x-2 transition-transform active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Guardar</span>
          </button>
        </div>
      </div>
    </div>
  );
};