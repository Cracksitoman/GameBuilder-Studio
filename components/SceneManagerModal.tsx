import React, { useState } from 'react';
import { Scene } from '../types';
import { X, Clapperboard, Plus, Trash2, Check, Edit, Play } from './Icons';

interface SceneManagerModalProps {
  isOpen: boolean;
  scenes: Scene[];
  currentSceneId: string;
  onClose: () => void;
  onSelectScene: (id: string) => void;
  onAddScene: (name: string) => void;
  onRenameScene: (id: string, name: string) => void;
  onDeleteScene: (id: string) => void;
}

export const SceneManagerModal: React.FC<SceneManagerModalProps> = ({
  isOpen,
  scenes,
  currentSceneId,
  onClose,
  onSelectScene,
  onAddScene,
  onRenameScene,
  onDeleteScene
}) => {
  const [newSceneName, setNewSceneName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (newSceneName.trim()) {
      onAddScene(newSceneName.trim());
      setNewSceneName('');
    }
  };

  const startEditing = (scene: Scene) => {
    setEditingId(scene.id);
    setEditName(scene.name);
  };

  const saveEditing = (id: string) => {
    if (editName.trim()) {
      onRenameScene(id, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden h-[500px]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-800/50">
          <div className="flex items-center space-x-2">
             <Clapperboard className="w-5 h-5 text-orange-500" />
             <h3 className="text-sm font-bold text-white">Gestor de Escenas</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scene List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-950/50">
            {scenes.map((scene, index) => (
                <div 
                  key={scene.id} 
                  onClick={() => { if(editingId !== scene.id) onSelectScene(scene.id); }}
                  className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      currentSceneId === scene.id 
                      ? 'bg-orange-900/20 border-orange-500/50 shadow-inner' 
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                    <div className="flex items-center space-x-3 flex-1">
                        <div className={`p-2 rounded-lg ${currentSceneId === scene.id ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                            {index === 0 ? <Play className="w-4 h-4 fill-current" /> : <Clapperboard className="w-4 h-4" />}
                        </div>
                        
                        {editingId === scene.id ? (
                            <div className="flex items-center space-x-2 w-full" onClick={e => e.stopPropagation()}>
                                <input 
                                   autoFocus
                                   type="text" 
                                   value={editName}
                                   onChange={e => setEditName(e.target.value)}
                                   onKeyDown={e => e.key === 'Enter' && saveEditing(scene.id)}
                                   className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white w-full outline-none focus:border-orange-500"
                                />
                                <button onClick={() => saveEditing(scene.id)} className="text-green-400 hover:text-white">
                                    <Check className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col">
                                <span className={`font-bold text-sm ${currentSceneId === scene.id ? 'text-orange-100' : 'text-gray-300'}`}>
                                    {scene.name}
                                </span>
                                {index === 0 && <span className="text-[9px] text-gray-500 uppercase font-bold">Escena Inicial</span>}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingId !== scene.id && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); startEditing(scene); }}
                                className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-700 rounded"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                        )}
                        {scenes.length > 1 && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); if(confirm(`¿Eliminar escena "${scene.name}"?`)) onDeleteScene(scene.id); }}
                                className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-900/30 rounded"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>

        {/* Footer Add */}
        <div className="p-4 bg-gray-800 border-t border-gray-700">
            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Nueva Escena</label>
            <div className="flex space-x-2">
                <input 
                   type="text" 
                   value={newSceneName}
                   onChange={(e) => setNewSceneName(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                   placeholder="Nombre (ej. Nivel 2, Game Over)"
                   className="flex-1 bg-gray-950 border border-gray-600 rounded-lg px-3 text-sm text-white focus:border-orange-500 outline-none"
                />
                <button 
                   onClick={handleAdd}
                   className="bg-orange-600 hover:bg-orange-500 text-white p-2 rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};
