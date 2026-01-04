
import React, { useState, useEffect } from 'react';
import { GameObject, ObjectType, BehaviorType, Behavior, AnimationClip, Variable, VariableType, Asset, EditorTool } from '../types';
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

const AnimationPreview = ({ animation }: { animation: AnimationClip }) => {
    const [frameIndex, setFrameIndex] = useState(0);
    useEffect(() => {
        if (!animation.frames.length) return;
        const interval = setInterval(() => {
            setFrameIndex(prev => (prev + 1) % animation.frames.length);
        }, 1000 / (animation.fps || 1));
        return () => clearInterval(interval);
    }, [animation.frames.length, animation.fps]);
    if (!animation.frames.length) return null;
    return (
        <div className="w-full h-32 bg-gray-950 rounded-lg border border-gray-700 flex items-center justify-center relative overflow-hidden mb-2 shadow-inner">
             <div className="absolute inset-0 opacity-20 pointer-events-none" style={{backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)', backgroundSize: '10px 10px'}}></div>
             <img src={animation.frames[frameIndex % animation.frames.length].imageUrl} className="max-w-full max-h-full object-contain image-pixelated relative z-10" />
             <div className="absolute bottom-1 right-1 bg-black/50 text-[9px] px-1.5 py-0.5 rounded text-white font-mono pointer-events-none">{frameIndex % animation.frames.length + 1}/{animation.frames.length}</div>
        </div>
    );
};

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
  const handleChange = (field: keyof GameObject, value: any) => {
    let finalValue = value;
    if (typeof selectedObject[field] === 'number') {
        finalValue = parseFloat(value);
        if (isNaN(finalValue)) finalValue = 0;
    }
    onUpdateObject(selectedObject.id, { [field]: finalValue });
  };

  const handleTilemapChange = (key: string, value: any) => {
      const tm = selectedObject.tilemap || { tileSize: 32, tiles: {} };
      onUpdateObject(selectedObject.id, { tilemap: { ...tm, [key]: value } });
  };

  const handleAddVariable = () => {
      if (!newVarName.trim()) return;
      const initialValue = newVarType === 'NUMBER' ? 0 : (newVarType === 'BOOLEAN' ? false : (newVarType === 'ARRAY' ? [] : ""));
      const updatedVars = [...(selectedObject.variables || []), { id: crypto.randomUUID(), name: newVarName.trim(), type: newVarType, value: initialValue }];
      onUpdateObject(selectedObject.id, { variables: updatedVars });
      setNewVarName('');
  };

  const addBehavior = (type: BehaviorType) => {
    const existing = selectedObject.behaviors || [];
    let defaultProps = {};
    let name = "";
    
    switch(type) {
      case BehaviorType.PLATFORMER: 
        name = "Plataforma"; 
        defaultProps = { 
            gravity: 1200, jumpForce: 550, maxSpeed: 250,
            animIdle: "", animWalk: "", animJump: "", animFall: "", animCrouch: ""
        }; 
        break;
      case BehaviorType.TOPDOWN: 
        name = "Movimiento Top-Down"; 
        defaultProps = { 
            speed: 200,
            animIdle: "", animWalk: ""
        }; 
        break;
      case BehaviorType.PROJECTILE: name = "Proyectil"; defaultProps = { speed: 400 }; break;
      case BehaviorType.FOLLOW: name = "Perseguir (IA)"; defaultProps = { speed: 100, stopDistance: 5, targetId: "" }; break;
      case BehaviorType.ROTATE: name = "Rotación Continua"; defaultProps = { speed: 90 }; break;
      case BehaviorType.HEALTH: name = "Salud y Daño"; defaultProps = { maxHealth: 3, currentHealth: 3, destroyOnZero: true }; break;
      case BehaviorType.GRID_LAYOUT: name = "Contenedor en Rejilla"; defaultProps = { columns: 4, padding: 10, slotWidth: 50, slotHeight: 50 }; break;
      case BehaviorType.TILT_CONTROL: name = "Control Inclinación"; defaultProps = { speed: 300 }; break;
      case BehaviorType.ANIMATION: name = "Animador"; defaultProps = { animations: [{ id: crypto.randomUUID(), name: 'Idle', frames: [], fps: 5, loop: true }] }; break;
    }
    onUpdateObject(selectedObject.id, { behaviors: [...existing, { id: crypto.randomUUID(), type, name, properties: defaultProps }] });
    setShowBehaviorMenu(false);
  };

  const updateBehaviorProp = (behaviorId: string, prop: string, value: any) => {
    const updated = selectedObject.behaviors.map(b => b.id === behaviorId ? { ...b, properties: { ...b.properties, [prop]: (typeof b.properties[prop] === 'number' && typeof value !== 'object' ? parseFloat(value) : value) } } : b);
    onUpdateObject(selectedObject.id, { behaviors: updated });
  };

  const handleAddFrames = (behaviorId: string, animId: string, result: string | string[]) => {
      const urls = Array.isArray(result) ? result : [result];
      const updated = selectedObject.behaviors.map(b => {
          if (b.id === behaviorId && b.type === BehaviorType.ANIMATION) {
              const animations = (b.properties.animations as AnimationClip[]).map(anim => {
                  if (anim.id === animId) return { ...anim, frames: [...anim.frames, ...urls.map(u => ({ id: crypto.randomUUID(), imageUrl: u }))] };
                  return anim;
              });
              return { ...b, properties: { ...b.properties, animations } };
          }
          return b;
      });
      onUpdateObject(selectedObject.id, { behaviors: updated, previewSpriteUrl: Array.isArray(result) ? result[0] : result });
  };

  const handleAddNewAnimation = (behaviorId: string) => {
      const behavior = selectedObject.behaviors.find(b => b.id === behaviorId);
      if (!behavior) return;
      const animations = [...(behavior.properties.animations || [])];
      animations.push({ id: crypto.randomUUID(), name: 'Nueva Anim', frames: [], fps: 5, loop: true });
      updateBehaviorProp(behaviorId, 'animations', animations);
  };

  const getFriendlyPropName = (key: string) => {
      switch(key) {
          case 'animIdle': return 'Anim. Reposo';
          case 'animWalk': return 'Anim. Caminar';
          case 'animJump': return 'Anim. Saltar';
          case 'animFall': return 'Anim. Caer';
          case 'animCrouch': return 'Anim. Agacharse';
          case 'gravity': return 'Gravedad';
          case 'jumpForce': return 'Fuerza Salto';
          case 'maxSpeed': return 'Vel. Máxima';
          case 'speed': return 'Velocidad';
          default: return key;
      }
  };

  // Get all animation names defined in the ANIMATION behavior
  const animationNames = (selectedObject.behaviors || [])
      .find(b => b.type === BehaviorType.ANIMATION)
      ?.properties.animations?.map((a: AnimationClip) => a.name) || [];

  const activeBrushAsset = assets.find(a => a.url === activeBrushId);

  return (
    <div className={`bg-gray-900 flex flex-col h-full border-t border-gray-700 shadow-2xl ${className}`}>
      <div className="p-3 border-b border-gray-800 flex items-center justify-between bg-gray-800">
        <div className="flex items-center space-x-2 overflow-hidden">
           <span className="bg-blue-900 text-blue-300 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold">{selectedObject.type}</span>
           <span className="font-bold text-gray-200 text-sm truncate">Propiedades</span>
        </div>
        <div className="flex items-center space-x-1">
            <button onClick={() => onDeleteObject?.(selectedObject.id)} className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            {onClose && <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white bg-gray-700 rounded-full ml-1"><X className="w-4 h-4" /></button>}
        </div>
      </div>

      <div className={`px-4 py-1.5 text-[9px] font-bold uppercase text-center border-b border-gray-800 ${isInstance ? 'bg-gray-900 text-gray-500' : 'bg-orange-900/30 text-orange-400'}`}>
          {isInstance ? 'Editando Instancia' : 'Editando Prototipo (Librería)'}
      </div>

      <div className="p-4 space-y-5 overflow-y-auto pb-20">
        <input type="text" value={selectedObject.name} onChange={(e) => handleChange('name', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" placeholder="Nombre" />

        <div className="flex space-x-2">
            <button onClick={() => onOpenScriptEditor?.(selectedObject.id)} className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 rounded-lg text-xs font-bold flex items-center justify-center transition-all">
                <Code className="w-3 h-3 mr-2" /> {selectedObject.script ? 'Editar Script' : 'Añadir Script'}
            </button>
            <div className="flex items-center justify-between bg-gray-800 px-3 rounded-lg border border-gray-700">
                <label className="text-[10px] text-gray-400 mr-2 uppercase font-bold">GUI</label>
                <input type="checkbox" checked={!!selectedObject.isGui} onChange={(e) => handleChange('isGui', e.target.checked)} className="rounded bg-gray-900 border-gray-600 text-blue-500" />
            </div>
        </div>

        {selectedObject.type === ObjectType.TILEMAP && (
             <div className="space-y-3 p-3 bg-gray-800 rounded-xl border border-gray-700">
                 <label className="text-xs font-bold text-cyan-400 uppercase flex items-center"><Grid3x3 className="w-3 h-3 mr-1" /> Rejilla Tilemap</label>
                 <div className="flex space-x-2">
                     <div className="flex-1"><label className="text-[9px] text-gray-500 block mb-1">TAMAÑO (PX)</label><input type="number" value={selectedObject.tilemap?.tileSize} onChange={(e) => handleTilemapChange('tileSize', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1 text-xs text-white" /></div>
                     <div className="flex bg-gray-900 rounded border border-gray-700 p-0.5">
                         <button onClick={() => onSetBrush?.(EditorTool.BRUSH, activeBrushId || null)} className={`p-1 rounded ${currentTool === EditorTool.BRUSH ? 'bg-cyan-900 text-cyan-400' : 'text-gray-500'}`}><Paintbrush className="w-4 h-4" /></button>
                         <button onClick={() => onSetBrush?.(EditorTool.ERASER, null)} className={`p-1 rounded ${currentTool === EditorTool.ERASER ? 'bg-red-900 text-red-400' : 'text-gray-500'}`}><Eraser className="w-4 h-4" /></button>
                     </div>
                 </div>
                 {currentTool === EditorTool.BRUSH && (
                     <div className="space-y-2">
                        <button onClick={() => onOpenAssetManager((url) => onSetBrush?.(EditorTool.BRUSH, typeof url === 'string' ? url : url[0]), 'GALLERY')} className="w-full flex items-center space-x-2 bg-gray-950 p-2 rounded border border-gray-700 text-[10px] text-gray-400">
                            {activeBrushAsset ? <img src={activeBrushAsset.url} className="w-6 h-6 object-contain image-pixelated" /> : <div className="w-6 h-6 bg-gray-800 rounded" />}
                            <span>{activeBrushAsset ? activeBrushAsset.name : 'Click para elegir sprite'}</span>
                        </button>
                        
                        <div className="flex items-center justify-between bg-gray-900 p-2 rounded border border-gray-700 cursor-pointer hover:bg-gray-850" onClick={() => onSetBrushSolid?.(!brushSolid)}>
                            <label className="text-[10px] text-gray-400 uppercase font-bold flex items-center cursor-pointer">
                                <BrickWall className={`w-3 h-3 mr-2 ${brushSolid ? 'text-red-400' : 'text-gray-600'}`} />
                                Es Sólido (Pared)
                            </label>
                            <div className={`w-8 h-4 rounded-full relative transition-colors ${brushSolid ? 'bg-red-500' : 'bg-gray-700'}`}>
                                <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${brushSolid ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                        </div>
                     </div>
                 )}
             </div>
        )}

        <div>
           <div className="flex items-center justify-between mb-3">
             <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-wider flex items-center"><Zap className="w-3 h-3 mr-1" /> Comportamientos</h3>
             <div className="relative">
                 <button onClick={() => setShowBehaviorMenu(!showBehaviorMenu)} className="text-[9px] bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded">+ Añadir</button>
                 {showBehaviorMenu && (
                   <div className="absolute right-0 top-full mt-2 w-52 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden py-1">
                      <button onClick={() => addBehavior(BehaviorType.ANIMATION)} className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 flex items-center"><Film className="w-3 h-3 mr-2 text-orange-400" /> Animación</button>
                      <button onClick={() => addBehavior(BehaviorType.GRID_LAYOUT)} className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 flex items-center"><Grid className="w-3 h-3 mr-2 text-blue-400" /> Rejilla (Inventario)</button>
                      <button onClick={() => addBehavior(BehaviorType.PLATFORMER)} className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 flex items-center"><Activity className="w-3 h-3 mr-2 text-green-400" /> Plataforma</button>
                      <button onClick={() => addBehavior(BehaviorType.TOPDOWN)} className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 flex items-center"><Compass className="w-3 h-3 mr-2 text-purple-400" /> Top-Down</button>
                      <button onClick={() => addBehavior(BehaviorType.TILT_CONTROL)} className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 flex items-center"><Smartphone className="w-3 h-3 mr-2 text-blue-400" /> Inclinación</button>
                      <button onClick={() => addBehavior(BehaviorType.HEALTH)} className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 flex items-center"><Activity className="w-3 h-3 mr-2 text-red-400" /> Salud</button>
                      <button onClick={() => addBehavior(BehaviorType.ROTATE)} className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-gray-700 flex items-center"><RotateCw className="w-3 h-3 mr-2 text-pink-400" /> Rotación</button>
                   </div>
                 )}
              </div>
           </div>

           <div className="space-y-3">
              {(selectedObject.behaviors || []).map(behavior => (
                <div key={behavior.id} className="bg-gray-800 rounded-lg border border-gray-700 p-3">
                   <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-300">{behavior.name}</span>
                      <button onClick={() => onUpdateObject(selectedObject.id, { behaviors: selectedObject.behaviors.filter(b => b.id !== behavior.id) })} className="text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                   </div>
                   
                   <div className="space-y-2">
                      {behavior.type === BehaviorType.ANIMATION && (
                          <div className="space-y-3">
                             {(behavior.properties.animations as AnimationClip[]).map(anim => (
                                 <div key={anim.id} className="bg-gray-900/50 rounded border border-gray-700/50 p-2">
                                     <div className="flex items-center justify-between mb-2 gap-2">
                                         <input 
                                            type="text" 
                                            value={anim.name} 
                                            onChange={e => updateBehaviorProp(behavior.id, 'animations', (behavior.properties.animations as AnimationClip[]).map(a => a.id === anim.id ? {...a, name: e.target.value} : a))} 
                                            className="flex-1 bg-gray-950 border border-gray-800 rounded px-2 py-0.5 text-[10px] font-bold text-gray-300 uppercase outline-none focus:border-orange-500" 
                                            placeholder="Nombre Anim"
                                         />
                                         <div className="flex items-center space-x-2 shrink-0">
                                             <label className="text-[9px] text-gray-500 uppercase">FPS</label>
                                             <input type="number" value={anim.fps} onChange={e => updateBehaviorProp(behavior.id, 'animations', (behavior.properties.animations as AnimationClip[]).map(a => a.id === anim.id ? {...a, fps: parseInt(e.target.value)} : a))} className="w-8 bg-black rounded text-center text-[10px] text-white" />
                                             <button onClick={() => updateBehaviorProp(behavior.id, 'animations', (behavior.properties.animations as AnimationClip[]).filter(a => a.id !== anim.id))} className="p-1 text-gray-600 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                                         </div>
                                     </div>
                                     <div className="flex flex-wrap gap-1">
                                         {anim.frames.map(f => (
                                             <div key={f.id} className="relative group/frame">
                                                 <img src={f.imageUrl} className="w-8 h-8 bg-black rounded object-contain image-pixelated border border-gray-800" />
                                                 <button 
                                                    onClick={() => updateBehaviorProp(behavior.id, 'animations', (behavior.properties.animations as AnimationClip[]).map(a => a.id === anim.id ? {...a, frames: a.frames.filter(fr => fr.id !== f.id)} : a))}
                                                    className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover/frame:opacity-100 transition-opacity"
                                                 >
                                                     <X className="w-2 h-2" />
                                                 </button>
                                             </div>
                                         ))}
                                         <button onClick={() => onOpenAssetManager((url) => handleAddFrames(behavior.id, anim.id, url), 'GALLERY')} className="w-8 h-8 border border-dashed border-gray-600 rounded flex items-center justify-center text-gray-500 hover:text-white hover:border-gray-400 transition-all"><Plus className="w-3 h-3" /></button>
                                     </div>
                                 </div>
                             ))}
                             <button 
                                onClick={() => handleAddNewAnimation(behavior.id)}
                                className="w-full py-1.5 border border-dashed border-gray-700 rounded-lg text-[10px] font-bold text-gray-500 hover:text-orange-400 hover:border-orange-500 transition-all flex items-center justify-center space-x-1"
                             >
                                 <Plus className="w-3 h-3" />
                                 <span>Añadir Animación</span>
                             </button>
                          </div>
                      )}
                      {behavior.type !== BehaviorType.ANIMATION && Object.entries(behavior.properties).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between">
                              <label className="text-[9px] text-gray-500 uppercase">{getFriendlyPropName(k)}</label>
                              {k.startsWith('anim') ? (
                                  <select 
                                      value={v as string} 
                                      onChange={(e) => updateBehaviorProp(behavior.id, k, e.target.value)} 
                                      className="bg-gray-950 border border-gray-700 rounded px-1.5 py-0.5 text-[10px] text-white w-24 outline-none focus:border-blue-500"
                                  >
                                      <option value="">-- Ninguna --</option>
                                      {animationNames.map(name => (
                                          <option key={name} value={name}>{name}</option>
                                      ))}
                                  </select>
                              ) : typeof v === 'boolean' ? (
                                  <button onClick={() => updateBehaviorProp(behavior.id, k, !v)} className={`text-[9px] px-2 py-0.5 rounded font-bold ${v ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{v ? 'SI' : 'NO'}</button>
                              ) : (
                                  <input type={typeof v === 'number' ? 'number' : 'text'} value={v as any} onChange={(e) => updateBehaviorProp(behavior.id, k, e.target.value)} className="bg-gray-950 border border-gray-700 rounded px-1.5 py-0.5 text-[10px] text-white w-24 text-right" />
                              )}
                          </div>
                      ))}
                   </div>
                </div>
              ))}
           </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Transformación</h3>
          <div className="grid grid-cols-2 gap-3">
             {['x', 'y', 'width', 'height', 'rotation', 'opacity'].map(field => (
                 <div key={field}>
                    <label className="text-[9px] text-gray-500 block mb-1 uppercase">{field}</label>
                    <input type="number" step={field === 'opacity' ? 0.1 : 1} value={selectedObject[field as keyof GameObject] as any} onChange={(e) => handleChange(field as any, e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white" />
                 </div>
             ))}
          </div>
        </div>

        <div>
            <label className="text-xs font-bold text-pink-500 uppercase tracking-wider flex items-center mb-2"><VariableIcon className="w-3 h-3 mr-1" /> Variables Locales</label>
            <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700 space-y-2">
                {(selectedObject.variables || []).map(v => (
                    <div key={v.id} className="flex items-center justify-between bg-gray-900 rounded p-1.5 border border-gray-800 text-[10px]">
                        <span className="bg-gray-800 px-1 rounded text-gray-400 font-mono">{v.name}</span>
                        <div className="flex-1 px-2">
                             <input type={v.type === 'NUMBER' ? 'number' : 'text'} value={v.value} onChange={(e) => onUpdateObject(selectedObject.id, { variables: selectedObject.variables.map(x => x.id === v.id ? { ...x, value: v.type === 'NUMBER' ? parseFloat(e.target.value) : e.target.value } : x) })} className="bg-transparent border-0 p-0 text-white w-full focus:ring-0" />
                        </div>
                        <button onClick={() => onUpdateObject(selectedObject.id, { variables: selectedObject.variables.filter(x => x.id !== v.id) })} className="text-gray-600 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                    </div>
                ))}
                <div className="flex space-x-1">
                    <input type="text" value={newVarName} onChange={(e) => setNewVarName(e.target.value)} placeholder="Nombre" className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-[10px] text-white" />
                    <select value={newVarType} onChange={(e) => setNewVarType(e.target.value as VariableType)} className="bg-gray-900 border border-gray-600 rounded px-1 text-[9px] text-white w-14">
                        <option value="NUMBER">Num</option>
                        <option value="STRING">Txt</option>
                        <option value="BOOLEAN">Bool</option>
                        <option value="ARRAY">Lista</option>
                    </select>
                    <button onClick={handleAddVariable} className="bg-gray-700 px-2 rounded text-white"><Plus className="w-3 h-3" /></button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
