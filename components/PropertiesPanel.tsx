import React, { useState, useEffect } from 'react';
import { GameObject, ObjectType, BehaviorType, Behavior, AnimationClip, Variable, VariableType, Asset, EditorTool, TextBinding } from '../types';
import { Layers, Move, Type, MousePointer2, X, Zap, Trash2, Activity, RotateCw, Plus, BrickWall, Compass, Crosshair, Magnet, Film, ImagePlus, ChevronDown, ChevronUp, Grid3x3, Hash, ToggleLeft, Variable as VariableIcon, Link2, Grid, Paintbrush, Eraser, MonitorSmartphone, Play, Settings, CheckSquare, Square, Code, Box, Scissors, Smartphone, List, Droplets, Star, Palette } from './Icons';

interface PropertiesPanelProps {
  selectedObject: GameObject | null;
  objects?: GameObject[];
  globalVariables?: Variable[];
  assets?: Asset[];
  onUpdateObject: (id: string, updates: Partial<GameObject>) => void;
  onDeleteObject?: (id: string) => void;
  onOpenAssetManager: (callback: (url: string | string[]) => void, initialMode?: 'GALLERY' | 'SHEET_SLICER') => void;
  onSetBrush?: (tool: EditorTool, assetId: string | null) => void;
  activeBrushId?: string | null;
  brushSolid?: boolean;
  onSetBrushSolid?: (solid: boolean) => void;
  currentTool?: EditorTool;
  onOpenScriptEditor?: (objectId: string) => void; 
  onClose?: () => void;
  className?: string;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedObject,
  objects = [],
  globalVariables = [],
  assets = [],
  onUpdateObject,
  onDeleteObject,
  onOpenAssetManager,
  onSetBrush,
  activeBrushId,
  brushSolid = false,
  onSetBrushSolid,
  currentTool,
  onOpenScriptEditor,
  onClose,
  className = ""
}) => {
  const [showBehaviorMenu, setShowBehaviorMenu] = useState(false);
  const [newVarName, setNewVarName] = useState('');
  const [newVarType, setNewVarType] = useState<VariableType>('NUMBER');

  if (!selectedObject) {
    return (
      <div className={`bg-gray-900 flex flex-col h-full border-t border-gray-700 p-6 items-center justify-center text-center text-gray-500 ${className}`}>
        {onClose && <button onClick={onClose} className="absolute top-3 right-3 p-1 text-gray-400 bg-gray-800 rounded-full"><X className="w-4 h-4" /></button>}
        <MousePointer2 className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">Selecciona un objeto para editarlo</p>
      </div>
    );
  }

  const isInstance = objects.some(o => o.id === selectedObject.id);
  
  // Obtener lista de variables disponibles para el binding
  const getBindingVarOptions = (source: 'LOCAL' | 'GLOBAL' | 'OBJECT', targetId?: string) => {
      if (source === 'GLOBAL') return globalVariables.map(v => v.name);
      if (source === 'LOCAL') return (selectedObject.variables || []).map(v => v.name);
      if (source === 'OBJECT' && targetId) {
          const target = objects.find(o => o.id === targetId);
          return (target?.variables || []).map(v => v.name);
      }
      return [];
  };

  const handleUpdateTextBinding = (updates: Partial<TextBinding>) => {
      const current = selectedObject.textBinding || { enabled: false, source: 'LOCAL', variableName: '' };
      onUpdateObject(selectedObject.id, { textBinding: { ...current, ...updates } });
  };

  const handleChange = (field: keyof GameObject, value: any) => {
    let finalValue = value;
    if (typeof selectedObject[field] === 'number') {
        finalValue = parseFloat(value);
        if (isNaN(finalValue)) finalValue = 0;
    }
    onUpdateObject(selectedObject.id, { [field]: finalValue });
  };

  const handleAddVariable = () => {
      if (!newVarName.trim()) return;
      const updatedVars = [...(selectedObject.variables || []), { id: crypto.randomUUID(), name: newVarName.trim(), type: newVarType, value: newVarType === 'NUMBER' ? 0 : '' }];
      onUpdateObject(selectedObject.id, { variables: updatedVars });
      setNewVarName('');
  };

  const addBehavior = (type: BehaviorType) => {
    const existing = selectedObject.behaviors || [];
    // Evitar duplicados del mismo tipo
    if (existing.some(b => b.type === type)) {
        setShowBehaviorMenu(false);
        return;
    }
    onUpdateObject(selectedObject.id, { behaviors: [...existing, { id: crypto.randomUUID(), type, name: type, properties: {} }] });
    setShowBehaviorMenu(false);
  };

  const handleSelectSprite = () => {
      onOpenAssetManager((url) => {
          const urlStr = Array.isArray(url) ? url[0] : url;
          onUpdateObject(selectedObject.id, { previewSpriteUrl: urlStr });
      });
  };

  const currentBinding = selectedObject.textBinding || { enabled: false, source: 'LOCAL', variableName: '' };
  const availableVars = getBindingVarOptions(currentBinding.source as any, currentBinding.targetObjectId);

  return (
    <div className={`bg-gray-900 flex flex-col h-full border-t border-gray-700 shadow-2xl overflow-hidden ${className}`}>
      {/* Header fijo */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between bg-gray-800 shrink-0">
        <div className="flex items-center space-x-2 overflow-hidden">
           <span className="bg-blue-900 text-blue-300 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold">{selectedObject.type}</span>
           <span className="font-bold text-gray-200 text-sm truncate">Propiedades</span>
        </div>
        <div className="flex items-center space-x-1">
            <button onClick={() => onDeleteObject?.(selectedObject.id)} className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            {onClose && <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white bg-gray-700 rounded-full ml-1"><X className="w-4 h-4" /></button>}
        </div>
      </div>

      <div className={`px-4 py-1.5 text-[9px] font-bold uppercase text-center border-b border-gray-800 shrink-0 ${isInstance ? 'bg-gray-900 text-gray-500' : 'bg-orange-900/30 text-orange-400'}`}>
          {isInstance ? 'Editando Instancia' : 'Editando Prototipo'}
      </div>

      {/* ÁREA SCROLLABLE */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar touch-pan-y overscroll-contain pb-32">
        
        <div>
            <label className="text-[10px] text-gray-500 block mb-1 uppercase font-bold">Nombre del Objeto</label>
            <input type="text" value={selectedObject.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" />
        </div>

        {/* --- SECCIÓN APARIENCIA MEJORADA --- */}
        {selectedObject.type !== ObjectType.TEXT && (
            <div className="bg-gray-800/30 border border-gray-700 rounded-xl p-3">
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between mb-2">
                    <span>Sprite (Imagen)</span>
                    {selectedObject.previewSpriteUrl && (
                        <button onClick={() => onUpdateObject(selectedObject.id, { previewSpriteUrl: undefined })} className="text-[9px] text-red-400 hover:underline">Quitar</button>
                    )}
                </label>
                
                <div className="flex space-x-3">
                    <button 
                        onClick={handleSelectSprite}
                        className="w-20 h-20 bg-gray-900 border border-gray-600 border-dashed rounded-lg flex flex-col items-center justify-center hover:border-blue-500 hover:bg-gray-800 transition-all group overflow-hidden relative shrink-0"
                    >
                        {selectedObject.previewSpriteUrl ? (
                            <img src={selectedObject.previewSpriteUrl} className="w-full h-full object-contain pixelated" alt="sprite" />
                        ) : (
                            <ImagePlus className="w-6 h-6 text-gray-500 group-hover:text-blue-400 mb-1" />
                        )}
                        {!selectedObject.previewSpriteUrl && <span className="text-[8px] text-gray-500">Seleccionar</span>}
                    </button>

                    <div className="flex-1 space-y-2">
                        <div>
                            <label className="block text-[9px] text-gray-500 uppercase font-bold mb-1">Color (Tinte)</label>
                            <div className="flex items-center space-x-2 bg-gray-900 p-1 rounded border border-gray-700">
                                <input 
                                    type="color" 
                                    value={selectedObject.color}
                                    onChange={(e) => handleChange('color', e.target.value)}
                                    className="h-6 w-6 rounded cursor-pointer bg-transparent border-0 p-0"
                                />
                                <span className="text-[10px] text-gray-300 font-mono">{selectedObject.color}</span>
                            </div>
                        </div>
                        <button onClick={handleSelectSprite} className="w-full py-1 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-800 text-blue-300 text-[10px] rounded">
                            Cambiar Sprite
                        </button>
                    </div>
                </div>
                <p className="text-[9px] text-gray-500 mt-2 italic">
                    La imagen seleccionada aquí se verá siempre en el editor y al iniciar el juego.
                </p>
            </div>
        )}

        {selectedObject.type === ObjectType.TEXT && (
            <div className="bg-blue-900/10 border border-blue-800/50 rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black text-blue-400 uppercase flex items-center">
                        <Link2 className="w-3 h-3 mr-1" /> Vincular a Variable
                    </label>
                    <input 
                        type="checkbox" 
                        checked={!!currentBinding.enabled} 
                        onChange={e => handleUpdateTextBinding({ enabled: e.target.checked })} 
                        className="rounded bg-gray-900 border-gray-600 text-blue-500 w-5 h-5" 
                    />
                </div>
                {currentBinding.enabled && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[9px] text-gray-500 block mb-1 uppercase font-bold">Origen</label>
                                <select 
                                    value={currentBinding.source}
                                    onChange={e => handleUpdateTextBinding({ source: e.target.value as any, variableName: '' })}
                                    className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-2 text-xs text-white outline-none"
                                >
                                    <option value="LOCAL">Este Objeto</option>
                                    <option value="GLOBAL">Global</option>
                                    <option value="OBJECT">Otro Objeto...</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] text-gray-500 block mb-1 uppercase font-bold">Variable</label>
                                {availableVars.length > 0 ? (
                                    <select 
                                        value={currentBinding.variableName}
                                        onChange={e => handleUpdateTextBinding({ variableName: e.target.value })}
                                        className="w-full bg-gray-950 border border-blue-500/50 rounded px-2 py-2 text-xs text-white outline-none"
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {availableVars.map(name => <option key={name} value={name}>{name}</option>)}
                                    </select>
                                ) : (
                                    <input 
                                        type="text" 
                                        placeholder="Nombre var..."
                                        value={currentBinding.variableName}
                                        onChange={e => handleUpdateTextBinding({ variableName: e.target.value })}
                                        className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-2 text-xs text-white"
                                    />
                                )}
                            </div>
                        </div>

                        {currentBinding.source === 'OBJECT' && (
                             <div>
                                <label className="text-[9px] text-gray-500 block mb-1 uppercase font-bold">Seleccionar Objeto de la Escena</label>
                                <select 
                                    value={currentBinding.targetObjectId || ''}
                                    onChange={e => handleUpdateTextBinding({ targetObjectId: e.target.value, variableName: '' })}
                                    className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-2 text-xs text-white outline-none"
                                >
                                    <option value="">-- Selecciona un objeto --</option>
                                    {objects.filter(o => o.id !== selectedObject.id).map(o => (
                                        <option key={o.id} value={o.id}>{o.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <p className="text-[9px] text-gray-400 italic">El texto mostrará dinámicamente el valor de la variable seleccionada.</p>
                    </div>
                )}
            </div>
        )}

        <div className="grid grid-cols-2 gap-3">
             {['x', 'y', 'width', 'height', 'rotation', 'opacity'].map(field => (
                 <div key={field} className="bg-gray-850 p-2 rounded-lg border border-gray-800">
                    <label className="text-[9px] text-gray-500 block mb-1 uppercase font-bold">{field}</label>
                    <input type="number" step={field === 'opacity' ? 0.1 : 1} value={selectedObject[field as keyof GameObject] as any} onChange={(e) => handleChange(field as any, e.target.value)} className="w-full bg-transparent text-sm text-white outline-none" />
                 </div>
             ))}
        </div>

        {/* --- OPCIÓN DE SÓLIDO / OBSTÁCULO --- */}
        <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg border border-gray-700">
            <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center select-none cursor-pointer" onClick={() => onUpdateObject(selectedObject.id, { isObstacle: !selectedObject.isObstacle })}>
                <BrickWall className="w-3.5 h-3.5 mr-2 text-orange-500" />
                Es Sólido (Colisión)
            </label>
            <div className="relative inline-block w-8 align-middle select-none transition duration-200 ease-in">
                <input 
                    type="checkbox" 
                    name="toggle" 
                    id="toggle-solid" 
                    checked={!!selectedObject.isObstacle} 
                    onChange={(e) => onUpdateObject(selectedObject.id, { isObstacle: e.target.checked })} 
                    className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-green-500"
                />
                <label 
                    htmlFor="toggle-solid" 
                    className={`toggle-label block overflow-hidden h-4 rounded-full cursor-pointer ${selectedObject.isObstacle ? 'bg-green-500' : 'bg-gray-600'}`}
                ></label>
            </div>
        </div>

        {/* --- SECCIÓN DE COMPORTAMIENTOS --- */}
        <div className="pt-2 border-t border-gray-800">
            <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-yellow-500 uppercase tracking-wider flex items-center">
                    <Zap className="w-3 h-3 mr-1" /> Comportamientos
                </label>
                <button 
                    onClick={() => setShowBehaviorMenu(!showBehaviorMenu)}
                    className={`p-1 rounded transition-colors ${showBehaviorMenu ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-yellow-500 hover:bg-gray-700'}`}
                    title="Añadir Comportamiento"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {showBehaviorMenu && (
                <div className="grid grid-cols-1 gap-1 mb-4 animate-in fade-in slide-in-from-top-1 bg-gray-950 p-2 rounded-xl border border-yellow-900/30">
                    {Object.values(BehaviorType).map(type => (
                        <button 
                            key={type}
                            onClick={() => addBehavior(type)}
                            className="text-left px-3 py-2 bg-gray-900 hover:bg-yellow-600 text-[10px] text-gray-300 hover:text-white rounded-lg transition-all flex items-center justify-between group"
                        >
                            <span className="font-bold tracking-tight">{type}</span>
                            <Plus className="w-3 h-3 opacity-30 group-hover:opacity-100" />
                        </button>
                    ))}
                </div>
            )}

            <div className="space-y-2">
                {(selectedObject.behaviors || []).map(b => (
                    <div key={b.id} className="bg-gray-800/60 border border-gray-700 rounded-xl p-3 group relative hover:border-yellow-500/30 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Zap className="w-3 h-3 text-yellow-500" />
                                <span className="text-[10px] font-black text-gray-200 uppercase">{b.type}</span>
                            </div>
                            <button 
                                onClick={() => onUpdateObject(selectedObject.id, { behaviors: selectedObject.behaviors.filter(x => x.id !== b.id) })}
                                className="text-gray-600 hover:text-red-400 p-1 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="mt-1.5 text-[9px] text-gray-500 flex items-center">
                            <Settings className="w-2.5 h-2.5 mr-1" />
                            Configuración predeterminada activa
                        </div>
                    </div>
                ))}
                {(!selectedObject.behaviors || selectedObject.behaviors.length === 0) && !showBehaviorMenu && (
                    <div className="text-[10px] text-gray-600 text-center py-4 border border-dashed border-gray-800 rounded-xl italic">
                        Sin comportamientos activos
                    </div>
                )}
            </div>
        </div>

        <div>
            <label className="text-xs font-bold text-pink-500 uppercase tracking-wider flex items-center mb-2"><VariableIcon className="w-3 h-3 mr-1" /> Variables Locales</label>
            <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-700 space-y-2">
                {(selectedObject.variables || []).map(v => (
                    <div key={v.id} className="flex items-center justify-between bg-gray-900 rounded-lg p-2 border border-gray-800">
                        <span className="text-[10px] text-gray-400 font-mono w-20 truncate">{v.name}</span>
                        <input type={v.type === 'NUMBER' ? 'number' : 'text'} value={v.value} onChange={(e) => onUpdateObject(selectedObject.id, { variables: selectedObject.variables.map(x => x.id === v.id ? { ...x, value: v.type === 'NUMBER' ? parseFloat(e.target.value) : e.target.value } : x) })} className="bg-transparent border-0 p-0 text-white text-xs w-20 text-right focus:ring-0" />
                        <button onClick={() => onUpdateObject(selectedObject.id, { variables: selectedObject.variables.filter(x => x.id !== v.id) })} className="text-gray-600 hover:text-red-400 ml-2"><Trash2 className="w-3 h-3" /></button>
                    </div>
                ))}
                <div className="flex space-x-1 pt-2">
                    <input type="text" value={newVarName} onChange={(e) => setNewVarName(e.target.value)} placeholder="Nueva Var" className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-2 py-1 text-xs text-white" />
                    <button onClick={handleAddVariable} className="bg-blue-600 px-3 rounded-lg text-white font-bold text-lg">+</button>
                </div>
            </div>
        </div>

        <div className="pt-4 border-t border-gray-800">
             <button onClick={() => onOpenScriptEditor?.(selectedObject.id)} className="w-full py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-xl text-xs font-bold flex items-center justify-center transition-all">
                <Code className="w-4 h-4 mr-2" /> {selectedObject.script ? 'EDITAR SCRIPT' : 'AÑADIR SCRIPT'}
            </button>
        </div>

      </div>
    </div>
  );
};