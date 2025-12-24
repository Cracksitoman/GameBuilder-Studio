import React, { useState, useEffect } from 'react';
import { ConditionType, ActionType, GameObject, ObjectType, Scene } from '../types';
import { X, Check, Zap, Play, MousePointer2, Box, Ghost, User, Type, Trash2, ArrowRight, Calculator, Hash, ToggleLeft, Clapperboard } from './Icons';

interface EventActionModalProps {
  isOpen: boolean;
  mode: 'CONDITION' | 'ACTION';
  objects: GameObject[];
  scenes?: Scene[]; // Pass scenes for selection
  initialType?: string | null;
  initialParams?: Record<string, any>;
  onClose: () => void;
  onSave: (type: string, params: Record<string, any>) => void;
}

export const EventActionModal: React.FC<EventActionModalProps> = ({ 
  isOpen, 
  mode, 
  objects, 
  scenes = [],
  initialType, 
  initialParams, 
  onClose, 
  onSave 
}) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [params, setParams] = useState<Record<string, any>>({});

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedType(initialType || null);
      setParams(initialParams || {});
    }
  }, [isOpen, initialType, initialParams]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (selectedType) {
      onSave(selectedType, params);
      onClose();
    }
  };

  const updateParam = (key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  // --- CONFIGURATION DEFS ---
  
  const CONDITION_OPTIONS = [
    { id: 'START_OF_SCENE', label: 'Al inicio de la escena', description: 'Se ejecuta una sola vez cuando carga el nivel.', icon: <Play className="w-5 h-5 text-green-400"/> },
    { id: 'COLLISION', label: 'Colisión con objeto', description: 'Cuando este objeto choca con otro.', icon: <Box className="w-5 h-5 text-blue-400"/> },
    { id: 'KEY_PRESSED', label: 'Tecla presionada', description: 'Cuando el jugador pulsa una tecla.', icon: <MousePointer2 className="w-5 h-5 text-purple-400"/> },
    { id: 'COMPARE_VARIABLE', label: 'Comparar Variable', description: 'Comprueba el valor de una variable Global, Local u de Otro Objeto.', icon: <Calculator className="w-5 h-5 text-pink-400"/> },
  ];

  const ACTION_OPTIONS = [
    { id: 'DESTROY', label: 'Destruir objeto', description: 'Elimina el objeto del juego.', icon: <Trash2 className="w-5 h-5 text-red-400"/> },
    { id: 'RESTART_SCENE', label: 'Reiniciar Escena', description: 'Recarga el nivel actual.', icon: <Play className="w-5 h-5 text-orange-400"/> },
    { id: 'CHANGE_SCENE', label: 'Cambiar de Escena', description: 'Carga otro nivel o menú.', icon: <Clapperboard className="w-5 h-5 text-orange-500"/> },
    { id: 'SET_VISIBLE', label: 'Cambiar Visibilidad', description: 'Oculta o muestra el objeto.', icon: <User className="w-5 h-5 text-blue-400"/> },
    { id: 'MODIFY_VARIABLE', label: 'Modificar Variable', description: 'Cambia el valor de una variable Global, Local u de Otro Objeto.', icon: <Hash className="w-5 h-5 text-pink-400"/> },
  ];

  const options = mode === 'CONDITION' ? CONDITION_OPTIONS : ACTION_OPTIONS;
  const currentOption = options.find(o => o.id === selectedType);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-800/50">
          <h3 className="text-lg font-bold text-white flex items-center">
            <Zap className={`w-5 h-5 mr-2 ${mode === 'CONDITION' ? 'text-green-500' : 'text-blue-500'}`} />
            {mode === 'CONDITION' ? 'Añadir Condición' : 'Añadir Acción'}
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            
            {/* Left: List of Options */}
            <div className="w-1/2 border-r border-gray-800 overflow-y-auto p-2 bg-gray-900">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2 pt-2">Tipos Disponibles</div>
                <div className="space-y-1">
                    {options.map(opt => (
                        <button
                           key={opt.id}
                           onClick={() => { setSelectedType(opt.id); setParams({}); }}
                           className={`w-full text-left p-3 rounded-xl flex items-start space-x-3 transition-all ${selectedType === opt.id ? 'bg-blue-900/40 border border-blue-500/50' : 'hover:bg-gray-800 border border-transparent'}`}
                        >
                            <div className="mt-0.5">{opt.icon}</div>
                            <div>
                                <div className={`text-sm font-bold ${selectedType === opt.id ? 'text-white' : 'text-gray-300'}`}>{opt.label}</div>
                                <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{opt.description}</div>
                            </div>
                            {selectedType === opt.id && <ArrowRight className="w-4 h-4 text-blue-400 ml-auto self-center" />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Right: Parameters Form */}
            <div className="w-1/2 bg-gray-950 p-6 flex flex-col overflow-y-auto">
                {currentOption ? (
                    <div className="flex-1 space-y-6">
                        <div>
                            <div className="flex items-center space-x-2 mb-2">
                                {currentOption.icon}
                                <h4 className="text-xl font-bold text-white">{currentOption.label}</h4>
                            </div>
                            <p className="text-sm text-gray-400">{currentOption.description}</p>
                        </div>

                        <div className="h-px bg-gray-800"></div>

                        {/* --- PARAMETER INPUTS --- */}
                        <div className="space-y-4">
                            
                            {selectedType === 'COLLISION' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Objeto a chocar</label>
                                    <select 
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        value={params.targetId || ''}
                                        onChange={e => updateParam('targetId', e.target.value)}
                                    >
                                        <option value="">-- Seleccionar Objeto --</option>
                                        {objects.map(obj => (
                                            <option key={obj.id} value={obj.id}>{obj.name} ({obj.type})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {selectedType === 'CHANGE_SCENE' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Ir a Escena</label>
                                    <select 
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        value={params.sceneId || ''}
                                        onChange={e => updateParam('sceneId', e.target.value)}
                                    >
                                        <option value="">-- Seleccionar Escena --</option>
                                        {scenes.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* VARIABLE LOGIC - COMPARE */}
                            {selectedType === 'COMPARE_VARIABLE' && (
                                <div className="space-y-3">
                                     {/* ... (Variable logic remains same) ... */}
                                     <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Origen de Variable</label>
                                        <select 
                                            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-white text-sm"
                                            value={params.source || 'GLOBAL'}
                                            onChange={e => updateParam('source', e.target.value)}
                                        >
                                            <option value="GLOBAL">Global</option>
                                            <option value="LOCAL">Este Objeto (Local)</option>
                                            <option value="OBJECT">Otro Objeto</option>
                                        </select>
                                     </div>

                                     {params.source === 'OBJECT' && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Seleccionar Objeto</label>
                                            <select 
                                                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-white text-sm"
                                                value={params.targetObjectId || ''}
                                                onChange={e => updateParam('targetObjectId', e.target.value)}
                                            >
                                                <option value="">-- Elegir Objeto --</option>
                                                {objects.map(obj => (
                                                    <option key={obj.id} value={obj.id}>{obj.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                     )}

                                     <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nombre Variable (ID)</label>
                                        <input 
                                            type="text"
                                            placeholder="ej. Vida, Puntos"
                                            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-white text-sm"
                                            value={params.varId || ''}
                                            onChange={e => updateParam('varId', e.target.value)}
                                        />
                                     </div>
                                     <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Operador</label>
                                        <select 
                                            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-white text-sm"
                                            value={params.operator || 'EQUAL'}
                                            onChange={e => updateParam('operator', e.target.value)}
                                        >
                                            <option value="EQUAL">Igual a (=)</option>
                                            <option value="GREATER">Mayor que (&gt;)</option>
                                            <option value="LESS">Menor que (&lt;)</option>
                                            <option value="GREATER_EQUAL">Mayor o igual (&gt;=)</option>
                                            <option value="LESS_EQUAL">Menor o igual (&lt;=)</option>
                                            <option value="NOT_EQUAL">Diferente (!=)</option>
                                        </select>
                                     </div>
                                     <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Valor a comparar</label>
                                        <input 
                                            type="text"
                                            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-white text-sm"
                                            placeholder="ej. 10, true, texto"
                                            value={params.value || ''}
                                            onChange={e => updateParam('value', e.target.value)}
                                        />
                                     </div>
                                </div>
                            )}

                             {/* VARIABLE LOGIC - MODIFY */}
                            {selectedType === 'MODIFY_VARIABLE' && (
                                <div className="space-y-3">
                                     {/* ... (Variable modify logic remains same) ... */}
                                     <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Origen de Variable</label>
                                        <select 
                                            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-white text-sm"
                                            value={params.source || 'GLOBAL'}
                                            onChange={e => updateParam('source', e.target.value)}
                                        >
                                            <option value="GLOBAL">Global</option>
                                            <option value="LOCAL">Este Objeto (Local)</option>
                                            <option value="OBJECT">Otro Objeto</option>
                                        </select>
                                     </div>

                                     {params.source === 'OBJECT' && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Seleccionar Objeto</label>
                                            <select 
                                                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-white text-sm"
                                                value={params.targetObjectId || ''}
                                                onChange={e => updateParam('targetObjectId', e.target.value)}
                                            >
                                                <option value="">-- Elegir Objeto --</option>
                                                {objects.map(obj => (
                                                    <option key={obj.id} value={obj.id}>{obj.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                     )}

                                     <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nombre Variable (ID)</label>
                                        <input 
                                            type="text"
                                            placeholder="ej. Vida, Puntos"
                                            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-white text-sm"
                                            value={params.varId || ''}
                                            onChange={e => updateParam('varId', e.target.value)}
                                        />
                                     </div>
                                     <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Operación</label>
                                        <select 
                                            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-white text-sm"
                                            value={params.operation || 'SET'}
                                            onChange={e => updateParam('operation', e.target.value)}
                                        >
                                            <option value="SET">Definir (=)</option>
                                            <option value="ADD">Sumar (+)</option>
                                            <option value="SUBTRACT">Restar (-)</option>
                                        </select>
                                     </div>
                                     <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Valor</label>
                                        <input 
                                            type="text"
                                            className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-2 text-white text-sm"
                                            placeholder="ej. 1"
                                            value={params.value || ''}
                                            onChange={e => updateParam('value', e.target.value)}
                                        />
                                     </div>
                                </div>
                            )}

                            {selectedType === 'KEY_PRESSED' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tecla</label>
                                    <select 
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        value={params.key || 'Space'}
                                        onChange={e => updateParam('key', e.target.value)}
                                    >
                                        <option value="ArrowUp">Flecha Arriba ↑</option>
                                        <option value="ArrowDown">Flecha Abajo ↓</option>
                                        <option value="ArrowLeft">Flecha Izquierda ←</option>
                                        <option value="ArrowRight">Flecha Derecha →</option>
                                        <option value="Space">Barra Espaciadora</option>
                                        <option value="Enter">Enter</option>
                                    </select>
                                </div>
                            )}

                            {selectedType === 'DESTROY' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">¿Qué objeto destruir?</label>
                                    <select 
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                                        value={params.target || 'SELF'}
                                        onChange={e => updateParam('target', e.target.value)}
                                    >
                                        <option value="SELF">Este objeto (A sí mismo)</option>
                                        {mode === 'ACTION' && <option value="OTHER">El otro objeto (Si hay colisión)</option>}
                                    </select>
                                </div>
                            )}

                            {selectedType === 'SET_VISIBLE' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Visibilidad</label>
                                    <div className="flex space-x-2">
                                        <button 
                                            onClick={() => updateParam('visible', true)}
                                            className={`flex-1 py-2 rounded-lg border text-xs font-bold ${params.visible !== false ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                                        >
                                            Visible
                                        </button>
                                        <button 
                                            onClick={() => updateParam('visible', false)}
                                            className={`flex-1 py-2 rounded-lg border text-xs font-bold ${params.visible === false ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                                        >
                                            Invisible
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {/* No params for START_OF_SCENE or RESTART_SCENE yet */}
                            {(selectedType === 'START_OF_SCENE' || selectedType === 'RESTART_SCENE') && (
                                <div className="text-gray-500 text-sm italic bg-gray-900 p-3 rounded border border-gray-800">
                                    No hay parámetros adicionales para esta opción.
                                </div>
                            )}

                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <MousePointer2 className="w-12 h-12 mb-4 opacity-20" />
                        <p>Selecciona una opción de la izquierda</p>
                    </div>
                )}

                {/* Footer Save */}
                <div className="mt-auto pt-6 border-t border-gray-800">
                    <button 
                        onClick={handleSave}
                        disabled={!selectedType}
                        className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all ${selectedType ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 active:scale-95' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                    >
                        <Check className="w-4 h-4" />
                        <span>Confirmar</span>
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};