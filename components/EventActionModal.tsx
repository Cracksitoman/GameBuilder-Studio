
import React, { useState, useEffect } from 'react';
import { ConditionType, ActionType, GameObject, ObjectType, Scene, BehaviorType, Variable } from '../types';
import { X, Check, Zap, Play, MousePointer2, Box, Ghost, User, Type, Trash2, ArrowRight, Calculator, Hash, ToggleLeft, Clapperboard, MonitorSmartphone, Hand, MousePointerClick, Move, Timer, Ruler, Wind, Copy, Vibrate, Navigation, MessageSquare, Film, Settings, Droplets, Volume2, Maximize2, MoveHorizontal, Eye, Sun, Palette, Music, Activity, Crosshair } from './Icons';
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
  globalVariables?: Variable[]; // NEW: To list global vars
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

  // Helper to combine scene objects and library objects for selection lists
  const availableObjects = [...library, ...objects].filter((obj, index, self) => 
      index === self.findIndex((t) => (
          t.id === obj.id
      ))
  );

  const CONDITION_OPTIONS = [
    { id: 'TOUCH_INTERACTION', label: 'Entrada Táctil / Ratón', description: 'Clics, toques, arrastrar o mantener pulsado.', icon: <Hand className="w-5 h-5 text-yellow-400"/> },
    { id: 'COLLISION', label: 'Colisión con objeto', description: 'Cuando este objeto choca con otro.', icon: <Box className="w-5 h-5 text-blue-400"/> },
    { id: 'KEY_PRESSED', label: 'Tecla presionada', description: 'Cuando el jugador pulsa una tecla física (PC).', icon: <MonitorSmartphone className="w-5 h-5 text-pink-400"/> },
    { id: 'EVERY_X_SECONDS', label: 'Cada X Segundos', description: 'Repetir cíclicamente (ej. disparos, spawn).', icon: <Timer className="w-5 h-5 text-purple-400"/> },
    { id: 'DISTANCE_TO', label: 'Distancia a Objeto', description: 'Cuando se acerca o aleja de otro objeto.', icon: <Ruler className="w-5 h-5 text-cyan-400"/> },
    { id: 'COMPARE_VARIABLE', label: 'Comparar Variable', description: 'Comprueba el valor de una variable.', icon: <Calculator className="w-5 h-5 text-gray-400"/> },
    { id: 'COMPARE_POSITION', label: 'Comparar Posición', description: 'Comprueba las coordenadas X o Y.', icon: <MoveHorizontal className="w-5 h-5 text-indigo-400"/> },
    { id: 'IS_MOVING', label: 'Está Moviéndose', description: 'Comprueba si el objeto tiene velocidad.', icon: <Wind className="w-5 h-5 text-orange-400"/> },
    { id: 'IS_VISIBLE', label: 'Es Visible', description: 'Comprueba si el objeto es visible actualmente.', icon: <Eye className="w-5 h-5 text-gray-400"/> },
    { id: 'START_OF_SCENE', label: 'Al inicio de la escena', description: 'Se ejecuta una sola vez cuando carga el nivel.', icon: <Play className="w-5 h-5 text-green-400"/> },
  ];

  const ACTION_OPTIONS = [
    { id: 'CREATE_OBJECT', label: 'Crear Objeto (Disparar)', description: 'Spawnea balas, enemigos o efectos en un punto.', icon: <Crosshair className="w-5 h-5 text-green-400"/> },
    { id: 'DAMAGE_OBJECT', label: 'Dañar Objeto', description: 'Reduce la vida de un objeto con comportamiento Salud.', icon: <Activity className="w-5 h-5 text-red-500"/> },
    { id: 'HEAL_OBJECT', label: 'Curar Objeto', description: 'Restaura vida.', icon: <Activity className="w-5 h-5 text-green-500"/> },
    { id: 'DESTROY', label: 'Destruir objeto', description: 'Elimina un objeto del juego.', icon: <Trash2 className="w-5 h-5 text-red-400"/> },
    { id: 'SPAWN_PARTICLES', label: 'Emitir Partículas', description: 'Crea una explosión visual o efectos de magia.', icon: <Droplets className="w-5 h-5 text-cyan-400"/> },
    { id: 'PLAY_SOUND', label: 'Reproducir Sonido', description: 'Reproduce un efecto de audio (URL).', icon: <Volume2 className="w-5 h-5 text-green-400"/> },
    { id: 'SET_VELOCITY', label: 'Fijar Velocidad', description: 'Establece la velocidad X/Y directamente.', icon: <Wind className="w-5 h-5 text-blue-500"/> },
    { id: 'STOP_MOVEMENT', label: 'Detener Movimiento', description: 'Frena el objeto por completo.', icon: <X className="w-5 h-5 text-red-500"/> },
    { id: 'SET_TEXT', label: 'Modificar Texto', description: 'Cambia el contenido de un objeto de texto.', icon: <MessageSquare className="w-5 h-5 text-yellow-400"/> },
    { id: 'FLASH_EFFECT', label: 'Parpadear / Flash', description: 'Efecto visual de daño o invulnerabilidad.', icon: <Sun className="w-5 h-5 text-yellow-200"/> },
    { id: 'SET_COLOR', label: 'Cambiar Color (Tint)', description: 'Cambia el color o tinte del sprite.', icon: <Palette className="w-5 h-5 text-pink-400"/> },
    { id: 'SET_OPACITY', label: 'Cambiar Opacidad', description: 'Hace el objeto transparente o visible.', icon: <Eye className="w-5 h-5 text-gray-400"/> },
    { id: 'SET_SIZE', label: 'Cambiar Tamaño', description: 'Escala el ancho y alto del objeto.', icon: <Maximize2 className="w-5 h-5 text-indigo-400"/> },
    { id: 'CAMERA_SHAKE', label: 'Agitar Cámara', description: 'Efecto de terremoto o impacto.', icon: <Vibrate className="w-5 h-5 text-orange-400"/> },
    { id: 'SET_CAMERA_ZOOM', label: 'Zoom de Cámara', description: 'Acerca o aleja la vista del juego.', icon: <Maximize2 className="w-5 h-5 text-cyan-400"/> },
    { id: 'APPLY_FORCE', label: 'Aplicar Fuerza / Empuje', description: 'Empuja el objeto en una dirección.', icon: <Wind className="w-5 h-5 text-blue-400"/> },
    { id: 'ROTATE_TOWARD', label: 'Rotar hacia...', description: 'Apunta hacia otro objeto o posición.', icon: <Navigation className="w-5 h-5 text-purple-400"/> },
    { id: 'PLAY_ANIMATION', label: 'Forzar Animación', description: 'Cambia la animación actual (ej. Atacar).', icon: <Film className="w-5 h-5 text-pink-400"/> },
    { id: 'TOGGLE_BEHAVIOR', label: 'Activar/Desactivar Comportamiento', description: 'Enciende o apaga IAs o físicas.', icon: <Settings className="w-5 h-5 text-gray-400"/> },
    { id: 'MOVE_TO_POINTER', label: 'Seguir al puntero', description: 'Mueve el objeto a la posición del dedo/mouse.', icon: <Move className="w-5 h-5 text-indigo-400"/> },
    { id: 'RESTART_SCENE', label: 'Reiniciar Escena', description: 'Recarga el nivel actual.', icon: <Play className="w-5 h-5 text-orange-400"/> },
    { id: 'CHANGE_SCENE', label: 'Cambiar de Escena', description: 'Carga otro nivel o menú.', icon: <Clapperboard className="w-5 h-5 text-orange-500"/> },
    { id: 'SET_VISIBLE', label: 'Cambiar Visibilidad', description: 'Oculta o muestra el objeto.', icon: <User className="w-5 h-5 text-blue-400"/> },
    { id: 'MODIFY_VARIABLE', label: 'Modificar Variable', description: 'Cambia el valor de una variable.', icon: <Hash className="w-5 h-5 text-pink-400"/> },
  ];

  const options = mode === 'CONDITION' ? CONDITION_OPTIONS : ACTION_OPTIONS;
  const currentOption = options.find(o => o.id === selectedType);

  // Helper to render variable selector
  const renderVariableSelector = (fieldPrefix: string = 'varId') => (
      <>
        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Variable</label>
        <div className="flex space-x-2 mb-2">
            <select 
                value={params.source || 'GLOBAL'}
                onChange={e => { updateParam('source', e.target.value); updateParam(fieldPrefix, ''); }}
                className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-white text-xs w-1/3"
            >
                <option value="GLOBAL">Global</option>
                <option value="LOCAL">Local (Este Obj)</option>
            </select>
            
            {params.source === 'GLOBAL' ? (
                <select
                    value={params[fieldPrefix] || ''}
                    onChange={e => updateParam(fieldPrefix, e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-2 text-white text-xs"
                >
                    <option value="">-- Seleccionar --</option>
                    {globalVariables.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
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
            {/* Sidebar with Options */}
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

            {/* Main Config Area */}
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
                            
                            {/* --- CONDITIONS IMPLEMENTATION --- */}

                            {selectedType === 'EVERY_X_SECONDS' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Intervalo (Segundos)</label>
                                    <input 
                                        type="number" 
                                        step="0.1" 
                                        value={params.interval || 1} 
                                        onChange={e => updateParam('interval', parseFloat(e.target.value))}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
                                    />
                                </div>
                            )}

                            {selectedType === 'DISTANCE_TO' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Objetivo</label>
                                        <select 
                                            value={params.targetId || ''} 
                                            onChange={e => updateParam('targetId', e.target.value)}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
                                        >
                                            <option value="">-- Seleccionar Objeto --</option>
                                            {availableObjects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex space-x-2">
                                        <select value={params.operator || 'LESS'} onChange={e => updateParam('operator', e.target.value)} className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-white w-1/3">
                                            <option value="LESS">Menor que</option>
                                            <option value="GREATER">Mayor que</option>
                                        </select>
                                        <input type="number" value={params.distance || 100} onChange={e => updateParam('distance', parseFloat(e.target.value))} className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-white flex-1" placeholder="Distancia (px)"/>
                                    </div>
                                </div>
                            )}

                            {selectedType === 'COMPARE_VARIABLE' && (
                                <div className="space-y-3">
                                    {renderVariableSelector('varId')}
                                    <div className="flex space-x-2">
                                        <select value={params.operator || 'EQUAL'} onChange={e => updateParam('operator', e.target.value)} className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-white w-1/3">
                                            <option value="EQUAL">Igual a</option>
                                            <option value="GREATER">Mayor que</option>
                                            <option value="LESS">Menor que</option>
                                            <option value="NOT_EQUAL">Diferente de</option>
                                        </select>
                                        <input type="text" value={params.value || ''} onChange={e => updateParam('value', e.target.value)} className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-white flex-1" placeholder="Valor (ej. 10 o true)"/>
                                    </div>
                                </div>
                            )}

                            {selectedType === 'COMPARE_POSITION' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Eje</label>
                                        <select value={params.axis || 'X'} onChange={e => updateParam('axis', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white">
                                            <option value="X">Posición X (Horizontal)</option>
                                            <option value="Y">Posición Y (Vertical)</option>
                                        </select>
                                    </div>
                                    <div className="flex space-x-2">
                                        <select value={params.operator || 'GREATER'} onChange={e => updateParam('operator', e.target.value)} className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-white w-1/3">
                                            <option value="GREATER">Mayor que</option>
                                            <option value="LESS">Menor que</option>
                                        </select>
                                        <input type="number" value={params.value || 0} onChange={e => updateParam('value', parseFloat(e.target.value))} className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-white flex-1" placeholder="Píxeles"/>
                                    </div>
                                </div>
                            )}

                            {selectedType === 'TOUCH_INTERACTION' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tipo de Interacción</label>
                                        <select 
                                            value={params.subtype || 'CLICK'} 
                                            onChange={e => updateParam('subtype', e.target.value)}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
                                        >
                                            <option value="CLICK">Tocar / Clic (Tap)</option>
                                            <option value="DOUBLE_CLICK">Doble Tocar / Clic</option>
                                            <option value="LONG_PRESS">Mantener Pulsado</option>
                                            <option value="DRAG">Arrastrar (Drag)</option>
                                            <option value="HOVER">Pasar por encima (Hover)</option>
                                        </select>
                                    </div>
                                    {params.subtype === 'LONG_PRESS' && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Duración (Segundos)</label>
                                            <input 
                                                type="number" 
                                                step="0.1"
                                                value={params.duration || 0.5} 
                                                onChange={e => updateParam('duration', parseFloat(e.target.value))}
                                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedType === 'COLLISION' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Choca con...</label>
                                    <select 
                                        value={params.targetId || ''} 
                                        onChange={e => updateParam('targetId', e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
                                    >
                                        <option value="">-- Seleccionar Objeto --</option>
                                        {availableObjects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {selectedType === 'KEY_PRESSED' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tecla</label>
                                    <select 
                                        value={params.key || 'Space'} 
                                        onChange={e => updateParam('key', e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
                                    >
                                        <option value="Space">Espacio</option>
                                        <option value="ArrowUp">Flecha Arriba</option>
                                        <option value="ArrowDown">Flecha Abajo</option>
                                        <option value="ArrowLeft">Flecha Izquierda</option>
                                        <option value="ArrowRight">Flecha Derecha</option>
                                        <option value="Enter">Enter</option>
                                    </select>
                                </div>
                            )}

                            {/* --- ACTIONS IMPLEMENTATION --- */}
                            
                            {selectedType === 'MODIFY_VARIABLE' && (
                                <div className="space-y-3">
                                    {renderVariableSelector('varId')}
                                    <div className="flex space-x-2">
                                        <select value={params.operation || 'SET'} onChange={e => updateParam('operation', e.target.value)} className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-white w-1/3">
                                            <option value="SET">Fijar a (=)</option>
                                            <option value="ADD">Sumar (+)</option>
                                            <option value="SUBTRACT">Restar (-)</option>
                                        </select>
                                        <input type="text" value={params.value || ''} onChange={e => updateParam('value', e.target.value)} className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-white flex-1" placeholder="Valor (ej. 5)"/>
                                    </div>
                                </div>
                            )}

                            {selectedType === 'CHANGE_SCENE' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Ir a Escena</label>
                                    <select 
                                        value={params.sceneId || ''} 
                                        onChange={e => updateParam('sceneId', e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {scenes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {selectedType === 'CREATE_OBJECT' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Objeto a crear (Prototipo)</label>
                                        <select 
                                            value={params.sourceObjectId || ''} 
                                            onChange={e => updateParam('sourceObjectId', e.target.value)}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
                                        >
                                            <option value="">-- Seleccionar de Librería --</option>
                                            {availableObjects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Generar desde...</label>
                                        <select 
                                            value={params.spawnOrigin || 'SELF'} 
                                            onChange={e => updateParam('spawnOrigin', e.target.value)}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
                                        >
                                            <option value="SELF">Este Objeto (Quien ejecuta el evento)</option>
                                            <option value="OTHER">El Otro Objeto (Colisión)</option>
                                            <optgroup label="Objetos en Escena">
                                                {objects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                            </optgroup>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Punto de Aparición (Spawn Point)</label>
                                        <div className="flex space-x-2">
                                            <select 
                                                value={params.spawnPointName || ''} 
                                                onChange={e => updateParam('spawnPointName', e.target.value)}
                                                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
                                            >
                                                <option value="">Centro del Objeto (Default)</option>
                                                <option value="POINTER">Posición del Puntero</option>
                                                <optgroup label="Puntos Definidos (Manual)">
                                                    <option value="Cañón">Cañón</option>
                                                    <option value="Boca">Boca</option>
                                                    <option value="Salida">Salida</option>
                                                </optgroup>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={params.inheritRotation ?? true} 
                                                onChange={e => updateParam('inheritRotation', e.target.checked)}
                                                className="rounded bg-gray-900 border-gray-600 text-green-500 focus:ring-0"
                                            />
                                            <span className="text-sm text-gray-200">Heredar Dirección/Rotación</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Damage/Heal */}
                            {(selectedType === 'DAMAGE_OBJECT' || selectedType === 'HEAL_OBJECT') && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Objetivo</label>
                                        <select 
                                            value={params.target || 'OTHER'} 
                                            onChange={e => updateParam('target', e.target.value)}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
                                        >
                                            <option value="OTHER">El Otro Objeto (Colisión)</option>
                                            <option value="SELF">Este Objeto</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Cantidad</label>
                                        <input 
                                            type="number" 
                                            value={params.amount || 1} 
                                            onChange={e => updateParam('amount', parseFloat(e.target.value))}
                                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
                                        />
                                    </div>
                                </div>
                            )}

                            {selectedType === 'DESTROY' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Objetivo a destruir</label>
                                    <select 
                                        value={params.target || 'SELF'} 
                                        onChange={e => updateParam('target', e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
                                    >
                                        <option value="SELF">Este Objeto</option>
                                        <option value="OTHER">El Otro Objeto (en Colisión)</option>
                                    </select>
                                </div>
                            )}

                            {selectedType === 'PLAY_SOUND' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Archivo de Audio</label>
                                    <div className="flex space-x-2">
                                        <input 
                                            type="text" 
                                            value={params.url || ''} 
                                            readOnly 
                                            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-3 text-white text-xs truncate"
                                            placeholder="Selecciona un audio..."
                                        />
                                        <button 
                                            onClick={() => setIsAudioPickerOpen(true)}
                                            className="bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg px-4 text-white"
                                        >
                                            <Music className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {selectedType === 'SPAWN_PARTICLES' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">CANTIDAD</label>
                                        <input type="number" value={params.count || 10} onChange={e => updateParam('count', parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">DURACIÓN (s)</label>
                                        <input type="number" step="0.1" value={params.duration || 1} onChange={e => updateParam('duration', parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">VELOCIDAD</label>
                                        <input type="number" value={params.speed || 100} onChange={e => updateParam('speed', parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">COLOR</label>
                                        <input type="color" value={params.color || '#ffaa00'} onChange={e => updateParam('color', e.target.value)} className="w-full h-9 bg-transparent border-0 cursor-pointer" />
                                    </div>
                                </div>
                            )}

                            {(selectedType === 'SET_VELOCITY' || selectedType === 'APPLY_FORCE') && (
                                <div className="flex space-x-3">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">X</label>
                                        <input type="number" value={selectedType === 'SET_VELOCITY' ? (params.vx ?? 0) : (params.forceX ?? 0)} onChange={e => updateParam(selectedType === 'SET_VELOCITY' ? 'vx' : 'forceX', parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Y</label>
                                        <input type="number" value={selectedType === 'SET_VELOCITY' ? (params.vy ?? 0) : (params.forceY ?? 0)} onChange={e => updateParam(selectedType === 'SET_VELOCITY' ? 'vy' : 'forceY', parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white" />
                                    </div>
                                </div>
                            )}

                            {selectedType === 'SET_TEXT' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nuevo Texto</label>
                                    <input type="text" value={params.text || ''} onChange={e => updateParam('text', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white" />
                                </div>
                            )}

                            {selectedType === 'SET_SIZE' && (
                                <div className="flex space-x-3">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Ancho (px)</label>
                                        <input type="number" value={params.width || 32} onChange={e => updateParam('width', parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Alto (px)</label>
                                        <input type="number" value={params.height || 32} onChange={e => updateParam('height', parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white" />
                                    </div>
                                </div>
                            )}

                            {selectedType === 'SET_OPACITY' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Opacidad (0 a 1)</label>
                                    <input type="number" step="0.1" max="1" min="0" value={params.opacity ?? 1} onChange={e => updateParam('opacity', parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white" />
                                </div>
                            )}

                            {selectedType === 'SET_COLOR' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Color</label>
                                    <input type="color" value={params.color || '#ffffff'} onChange={e => updateParam('color', e.target.value)} className="w-full h-12 bg-transparent border-0 cursor-pointer" />
                                </div>
                            )}

                            {selectedType === 'CAMERA_SHAKE' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">INTENSIDAD</label>
                                        <input type="number" value={params.intensity || 5} onChange={e => updateParam('intensity', parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-400 mb-1">DURACIÓN (s)</label>
                                        <input type="number" step="0.1" value={params.duration || 0.5} onChange={e => updateParam('duration', parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" />
                                    </div>
                                </div>
                            )}

                            {selectedType === 'ROTATE_TOWARD' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Objetivo</label>
                                    <select 
                                        value={params.targetId || ''} 
                                        onChange={e => updateParam('targetId', e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        <option value="POINTER">Puntero / Dedo</option>
                                        <optgroup label="Objetos">
                                            {availableObjects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                        </optgroup>
                                    </select>
                                </div>
                            )}

                            {selectedType === 'PLAY_ANIMATION' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nombre Animación</label>
                                    <input 
                                        type="text" 
                                        value={params.animName || ''} 
                                        onChange={e => updateParam('animName', e.target.value)}
                                        placeholder="Ej. Idle, Run, Attack"
                                        className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white" 
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">Debe coincidir con el nombre en Comportamiento de Animación.</p>
                                </div>
                            )}

                            {selectedType === 'SET_VISIBLE' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Visibilidad</label>
                                    <select value={params.visible ? 'true' : 'false'} onChange={e => updateParam('visible', e.target.value === 'true')} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white">
                                        <option value="true">Visible (ON)</option>
                                        <option value="false">Invisible (OFF)</option>
                                    </select>
                                </div>
                            )}

                            {selectedType === 'SET_CAMERA_ZOOM' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nivel de Zoom (1 = Normal)</label>
                                    <input type="number" step="0.1" value={params.zoom || 1} onChange={e => updateParam('zoom', parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white" />
                                </div>
                            )}

                            {selectedType === 'TOGGLE_BEHAVIOR' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Comportamiento</label>
                                        <select value={params.behaviorType || ''} onChange={e => updateParam('behaviorType', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white">
                                            <option value="">-- Seleccionar Tipo --</option>
                                            <option value={BehaviorType.PLATFORMER}>Plataforma</option>
                                            <option value={BehaviorType.TOPDOWN}>Top Down</option>
                                            <option value={BehaviorType.ROTATE}>Rotación</option>
                                            <option value={BehaviorType.FOLLOW}>Perseguir</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Estado</label>
                                        <select value={params.enable ? 'true' : 'false'} onChange={e => updateParam('enable', e.target.value === 'true')} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white">
                                            <option value="true">Activar</option>
                                            <option value="false">Desactivar</option>
                                        </select>
                                    </div>
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

        {/* INTEGRATED ASSET MANAGER FOR AUDIO */}
        {isAudioPickerOpen && (
            <AssetManagerModal 
                isOpen={true}
                assets={assets}
                allowedTypes={['audio']}
                onClose={() => setIsAudioPickerOpen(false)}
                onAddAsset={onAddAsset}
                onDeleteAsset={() => {}}
                onSelectAsset={(url) => {
                    updateParam('url', url);
                    setIsAudioPickerOpen(false);
                }}
            />
        )}
      </div>
    </div>
  );
};
