
import React, { useState, useEffect } from 'react';
import { ConditionType, ActionType, GameObject, ObjectType, Scene, BehaviorType, Variable } from '../types';
import { X, Check, Zap, Play, MousePointer2, Box, Ghost, User, Type, Trash2, ArrowRight, Calculator, Hash, ToggleLeft, Clapperboard, MonitorSmartphone, Hand, MousePointerClick, Move, Timer, Ruler, Wind, Copy, Vibrate, Navigation, MessageSquare, Film, Settings, Droplets, Volume2, Maximize2, MoveHorizontal, Eye, Sun, Palette, Music, Activity, Crosshair, List, RefreshCw } from './Icons';
import { AssetManagerModal } from './AssetManagerModal';

interface EventActionModalProps {
  isOpen: boolean;
  mode: 'CONDITION' | 'ACTION';
  objects: GameObject[];
  scenes?: Scene[];
  initialType?: string | null;
  initialParams?: Record<string, any>;
  onClose: () => void;
  onSave: (type: string, params: Record<string, any>) => void;
  assets?: any[]; 
  onAddAsset?: any;
  library?: GameObject[]; 
  globalVariables?: Variable[];
}

export const EventActionModal: React.FC<EventActionModalProps> = ({ 
  isOpen, 
  mode, 
  objects, 
  scenes = [],
  initialType, 
  initialParams, 
  onClose, 
  onSave,
  assets = [],
  onAddAsset,
  library = [],
  globalVariables = []
}) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [params, setParams] = useState<Record<string, any>>({});
  const [isAudioPickerOpen, setIsAudioPickerOpen] = useState(false);

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

  const availableObjects = [...library, ...objects].filter((obj, index, self) => 
      index === self.findIndex((t) => (t.id === obj.id))
  );

  const CONDITION_OPTIONS = [
    { id: 'TOUCH_INTERACTION', label: 'Entrada Táctil / Ratón', description: 'Clics, toques, arrastrar o mantener pulsado.', icon: <Hand className="w-5 h-5 text-yellow-400"/> },
    { id: 'COLLISION', label: 'Colisión con objeto', description: 'Cuando este objeto choca con otro.', icon: <Box className="w-5 h-5 text-blue-400"/> },
    { id: 'KEY_PRESSED', label: 'Tecla presionada', description: 'Cuando el jugador pulsa una tecla física.', icon: <MonitorSmartphone className="w-5 h-5 text-pink-400"/> },
    { id: 'ARRAY_CONTAINS', label: 'Lista contiene...', description: 'Comprueba si un objeto o texto está en una lista.', icon: <List className="w-5 h-5 text-purple-400"/> },
    { id: 'EVERY_X_SECONDS', label: 'Cada X Segundos', description: 'Repetir cíclicamente.', icon: <Timer className="w-5 h-5 text-purple-400"/> },
    { id: 'DISTANCE_TO', label: 'Distancia a Objeto', description: 'Cuando se acerca o aleja.', icon: <Ruler className="w-5 h-5 text-cyan-400"/> },
    { id: 'COMPARE_VARIABLE', label: 'Comparar Variable', description: 'Comprueba el valor de una variable.', icon: <Calculator className="w-5 h-5 text-gray-400"/> },
    { id: 'COMPARE_POSITION', label: 'Comparar Posición', description: 'Comprueba X o Y.', icon: <MoveHorizontal className="w-5 h-5 text-indigo-400"/> },
    { id: 'START_OF_SCENE', label: 'Al inicio de la escena', description: 'Cargar datos o inicializar.', icon: <Play className="w-5 h-5 text-green-400"/> },
  ];

  const ACTION_OPTIONS = [
    { id: 'CREATE_OBJECT', label: 'Crear Objeto (Disparar)', description: 'Spawnea una bala u otro objeto.', icon: <Crosshair className="w-5 h-5 text-green-400"/> },
    { id: 'APPLY_FORCE', label: 'Aplicar Fuerza (Física)', description: 'Empuja un objeto en una dirección.', icon: <Wind className="w-5 h-5 text-indigo-400"/> },
    { id: 'PUSH_TO_ARRAY', label: 'Añadir a Lista (Inventario)', description: 'Agrega un elemento al final de una lista.', icon: <List className="w-5 h-5 text-green-400"/> },
    { id: 'REMOVE_FROM_ARRAY', label: 'Eliminar de Lista', description: 'Quita un elemento de una posición específica.', icon: <Trash2 className="w-5 h-5 text-orange-400"/> },
    { id: 'CLEAR_ARRAY', label: 'Vaciar Lista', description: 'Elimina todos los elementos de la lista.', icon: <RefreshCw className="w-5 h-5 text-red-400"/> },
    { id: 'REPEAT_X_TIMES', label: 'Bucle (Repetir)', description: 'Ejecuta acciones múltiples veces.', icon: <RefreshCw className="w-5 h-5 text-blue-400"/> },
    { id: 'DESTROY', label: 'Destruir objeto', description: 'Elimina un objeto del juego.', icon: <Trash2 className="w-5 h-5 text-red-400"/> },
    { id: 'MODIFY_VARIABLE', label: 'Modificar Variable', description: 'Cambia el valor de una variable.', icon: <Hash className="w-5 h-5 text-pink-400"/> },
    { id: 'CHANGE_SCENE', label: 'Cambiar de Escena', description: 'Carga otro nivel.', icon: <Clapperboard className="w-5 h-5 text-orange-500"/> },
    { id: 'SET_VISIBLE', label: 'Cambiar Visibilidad', description: 'Oculta o muestra.', icon: <User className="w-5 h-5 text-blue-400"/> },
  ];

  const options = mode === 'CONDITION' ? CONDITION_OPTIONS : ACTION_OPTIONS;
  const currentOption = options.find(o => o.id === selectedType);

  const renderVariableSelector = (fieldPrefix: string = 'varId', onlyArrays = false) => (
      <>
        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Variable</label>
        <div className="flex space-x-2 mb-2">
            <select 
                value={params.source || 'GLOBAL'}
                onChange={e => { updateParam('source', e.target.value); updateParam(fieldPrefix, ''); }}
                className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-white text-xs w-1/3"
            >
                <option value="GLOBAL">Global</option>
                <option value="LOCAL">Local</option>
            </select>
            
            {params.source === 'GLOBAL' ? (
                <select
                    value={params[fieldPrefix] || ''}
                    onChange={e => updateParam(fieldPrefix, e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-white text-xs"
                >
                    <option value="">-- Seleccionar --</option>
                    {globalVariables.filter(v => !onlyArrays || v.type === 'ARRAY').map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                </select>
            ) : (
                <input 
                    type="text"
                    value={params[fieldPrefix] || ''}
                    onChange={e => updateParam(fieldPrefix, e.target.value)}
                    placeholder="Nombre variable local"
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-white text-xs"
                />
            )}
        </div>
      </>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-3xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-800/50">
          <h3 className="text-lg font-bold text-white flex items-center">
            <Zap className={`w-5 h-5 mr-2 ${mode === 'CONDITION' ? 'text-green-500' : 'text-blue-500'}`} />
            {mode === 'CONDITION' ? 'Configurar Condición' : 'Configurar Acción'}
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            <div className="w-1/3 border-r border-gray-800 overflow-y-auto p-2 bg-gray-900">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2 pt-2">Opciones</div>
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
                        </button>
                    ))}
                </div>
            </div>

            <div className="w-2/3 bg-gray-950 p-6 flex flex-col overflow-y-auto">
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

                        <div className="space-y-4">
                            {/* --- CONDICIONES --- */}
                            {selectedType === 'TOUCH_INTERACTION' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tipo de Interacción</label>
                                        <select value={params.subtype || 'CLICK'} onChange={e => updateParam('subtype', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white">
                                            <option value="CLICK">Tocar / Clic (Tap)</option>
                                            <option value="DOUBLE_CLICK">Doble Tocar (Double Tap)</option>
                                            <option value="LONG_PRESS">Mantener Pulsado</option>
                                            <option value="DRAG">Arrastrar (Drag)</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* --- ACCIONES --- */}
                            {selectedType === 'CREATE_OBJECT' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Objeto a Crear</label>
                                        <select value={params.sourceObjectId || ''} onChange={e => updateParam('sourceObjectId', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white">
                                            <option value="">-- Seleccionar de Librería --</option>
                                            {library.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Punto de Aparición</label>
                                        <select value={params.spawnOrigin || 'SELF'} onChange={e => updateParam('spawnOrigin', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white">
                                            <option value="SELF">Posición del Creador (Aquí)</option>
                                            <option value="OTHER">Posición del Otro Objeto</option>
                                        </select>
                                        <p className="text-[10px] text-gray-500 mt-2">El nuevo objeto heredará la rotación del creador.</p>
                                    </div>
                                </div>
                            )}

                            {selectedType === 'APPLY_FORCE' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Aplicar a...</label>
                                        <select value={params.target || 'SELF'} onChange={e => updateParam('target', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white">
                                            <option value="SELF">Este Objeto (Yo)</option>
                                            <option value="OTHER">El Otro / Último Creado (Bala)</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Fuerza X</label>
                                            <input type="number" value={params.forceX || 0} onChange={e => updateParam('forceX', parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Fuerza Y</label>
                                            <input type="number" value={params.forceY || 0} onChange={e => updateParam('forceY', parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500">
                                        Tip: Si aplicas fuerza X positiva y el objeto está rotado, la fuerza se aplicará <strong>en dirección a la rotación</strong> (hacia adelante).
                                    </p>
                                </div>
                            )}

                            {selectedType === 'PUSH_TO_ARRAY' && (
                                <div className="space-y-3">
                                    {renderVariableSelector('varId', true)}
                                    <label className="block text-xs font-bold text-gray-400 uppercase">Valor a añadir</label>
                                    <input type="text" value={params.value || ''} onChange={e => updateParam('value', e.target.value)} placeholder="Texto o número" className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"/>
                                </div>
                            )}

                            {selectedType === 'ARRAY_CONTAINS' && (
                                <div className="space-y-3">
                                    {renderVariableSelector('varId', true)}
                                    <label className="block text-xs font-bold text-gray-400 uppercase">Valor a buscar</label>
                                    <input type="text" value={params.value || ''} onChange={e => updateParam('value', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"/>
                                </div>
                            )}

                            {selectedType === 'REPEAT_X_TIMES' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Número de repeticiones</label>
                                    <input type="number" min="1" value={params.count || 10} onChange={e => updateParam('count', parseInt(e.target.value))} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"/>
                                    <p className="text-[10px] text-gray-500 mt-2">* Esto repetirá las acciones siguientes en este mismo bloque.</p>
                                </div>
                            )}
                            
                            {selectedType === 'CLEAR_ARRAY' && renderVariableSelector('varId', true)}
                            
                            {selectedType === 'COLLISION' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Choca con...</label>
                                    <select value={params.targetId || ''} onChange={e => updateParam('targetId', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white">
                                        <option value="">-- Seleccionar Objeto --</option>
                                        {availableObjects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <MousePointer2 className="w-12 h-12 mb-4 opacity-20" />
                        <p>Selecciona una opción a la izquierda</p>
                    </div>
                )}

                <div className="mt-auto pt-6 border-t border-gray-800">
                    <button 
                        onClick={handleSave}
                        disabled={!selectedType}
                        className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all ${selectedType ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg' : 'bg-gray-800 text-gray-600'}`}
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
