
import React, { useState } from 'react';
import { Variable, VariableType } from '../types';
import { X, Plus, Trash2, Hash, Type, ToggleLeft, Variable as VariableIcon, List } from './Icons';

interface VariableManagerModalProps {
  isOpen: boolean;
  variables: Variable[];
  onClose: () => void;
  onUpdateVariables: (vars: Variable[]) => void;
}

export const VariableManagerModal: React.FC<VariableManagerModalProps> = ({ 
  isOpen, 
  variables, 
  onClose, 
  onUpdateVariables 
}) => {
  const [newVarName, setNewVarName] = useState('');
  const [newVarType, setNewVarType] = useState<VariableType>('NUMBER');

  if (!isOpen) return null;

  const handleAdd = () => {
      if (!newVarName.trim()) return;
      
      let initialValue: any = 0;
      if (newVarType === 'BOOLEAN') initialValue = false;
      if (newVarType === 'STRING') initialValue = "";
      if (newVarType === 'ARRAY') initialValue = [];
      if (newVarType === 'OBJECT') initialValue = {};
      
      const newVar: Variable = {
          id: crypto.randomUUID(),
          name: newVarName.trim(),
          type: newVarType,
          value: initialValue
      };

      onUpdateVariables([...variables, newVar]);
      setNewVarName('');
  };

  const handleDelete = (id: string) => {
      if(confirm("¿Eliminar variable global?")) {
          onUpdateVariables(variables.filter(v => v.id !== id));
      }
  };

  const handleValueChange = (id: string, value: any) => {
      onUpdateVariables(variables.map(v => v.id === id ? { ...v, value } : v));
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden h-[600px]">
        
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-800/50">
          <div className="flex items-center space-x-2">
             <VariableIcon className="w-5 h-5 text-pink-500" />
             <h3 className="text-sm font-bold text-white">Variables Globales</h3>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-950/50">
            {variables.length === 0 && (
                <div className="text-center text-gray-500 py-10 flex flex-col items-center">
                    <VariableIcon className="w-10 h-10 mb-2 opacity-20" />
                    <p>No hay variables globales.</p>
                    <p className="text-xs">Crea una para guardar puntuaciones, vidas o inventarios.</p>
                </div>
            )}
            
            {variables.map(v => (
                <div key={v.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex items-center justify-between group">
                    <div className="flex-1 mr-4">
                        <div className="flex items-center space-x-2 mb-1">
                            {v.type === 'NUMBER' && <Hash className="w-3 h-3 text-blue-400" />}
                            {v.type === 'STRING' && <Type className="w-3 h-3 text-yellow-400" />}
                            {v.type === 'BOOLEAN' && <ToggleLeft className="w-3 h-3 text-green-400" />}
                            {v.type === 'ARRAY' && <List className="w-3 h-3 text-purple-400" />}
                            <span className="font-bold text-sm text-white">{v.name}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                             <span className="text-[10px] text-gray-500">Valor Inicial:</span>
                             {v.type === 'BOOLEAN' ? (
                                 <button 
                                   onClick={() => handleValueChange(v.id, !v.value)}
                                   className={`text-[10px] px-2 py-0.5 rounded font-bold ${v.value ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
                                 >
                                     {v.value ? 'TRUE' : 'FALSE'}
                                 </button>
                             ) : (v.type === 'ARRAY' || v.type === 'OBJECT') ? (
                                <span className="text-[10px] text-gray-400 font-mono">[{v.type}] Vacío</span>
                             ) : (
                                 <input 
                                    type={v.type === 'NUMBER' ? 'number' : 'text'}
                                    value={v.value}
                                    onChange={(e) => handleValueChange(v.id, v.type === 'NUMBER' ? parseFloat(e.target.value) : e.target.value)}
                                    className="bg-gray-950 border border-gray-600 rounded px-1 py-0.5 text-[10px] text-white w-20"
                                 />
                             )}
                        </div>
                    </div>
                    <button onClick={() => handleDelete(v.id)} className="p-2 text-gray-500 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>

        <div className="p-4 bg-gray-800 border-t border-gray-700">
            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Crear Nueva Variable</label>
            <div className="flex space-x-2">
                <input 
                   type="text" 
                   value={newVarName}
                   onChange={(e) => setNewVarName(e.target.value)}
                   placeholder="Nombre"
                   className="flex-1 bg-gray-950 border border-gray-600 rounded-lg px-3 text-sm text-white focus:border-pink-500 outline-none"
                />
                <select 
                   value={newVarType}
                   onChange={(e) => setNewVarType(e.target.value as VariableType)}
                   className="bg-gray-950 border border-gray-600 rounded-lg px-2 text-xs text-white outline-none"
                >
                    <option value="NUMBER">Número</option>
                    <option value="STRING">Texto</option>
                    <option value="BOOLEAN">Si/No</option>
                    <option value="ARRAY">Lista (Inv)</option>
                </select>
                <button 
                   onClick={handleAdd}
                   className="bg-pink-600 hover:bg-pink-500 text-white p-2 rounded-lg"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};
