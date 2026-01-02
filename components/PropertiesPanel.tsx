
import React, { useState, useEffect } from 'react';
import { GameObject, ObjectType, BehaviorType, Behavior, AnimationClip, Variable, VariableType, Asset, EditorTool } from '../types';
import { Layers, Move, Type, MousePointer2, X, Zap, Trash2, Activity, RotateCw, Plus, BrickWall, Compass, Crosshair, Magnet, Film, ImagePlus, ChevronDown, ChevronUp, Grid3x3, Hash, ToggleLeft, Variable as VariableIcon, Link2, Grid, Paintbrush, Eraser, MonitorSmartphone, Play, Settings, CheckSquare, Square, Code, BrickWall as WallIcon, Box, Scissors, Smartphone } from './Icons';

interface PropertiesPanelProps {
  selectedObject: GameObject | null;
  objects?: GameObject[];
  globalVariables?: Variable[];
  assets?: Asset[];
  onUpdateObject: (id: string, updates: Partial<GameObject>) => void;
  onDeleteObject?: (id: string) => void;
  onOpenAssetManager: (callback: (url: string | string[]) => void, initialMode?: 'GALLERY' | 'SHEET_SLICER') => void; // Updated signature
  onSetBrush?: (tool: EditorTool, assetId: string | null) => void;
  activeBrushId?: string | null;
  brushSolid?: boolean;
  onSetBrushSolid?: (solid: boolean) => void;
  currentTool?: EditorTool;
  onOpenScriptEditor?: (objectId: string) => void; 
  onClose?: () => void;
  className?: string;
}

// Mini Animation Player Component
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
             <img 
                src={animation.frames[frameIndex % animation.frames.length].imageUrl} 
                className="max-w-full max-h-full object-contain image-pixelated relative z-10" 
             />
             <div className="absolute bottom-1 right-1 bg-black/50 text-[9px] px-1.5 py-0.5 rounded text-white font-mono pointer-events-none">
                 {frameIndex % animation.frames.length + 1}/{animation.frames.length}
             </div>
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
  const [expandedAnim, setExpandedAnim] = useState<string | null>(null);
  
  // Local Variable State for adding new one
  const [newVarName, setNewVarName] = useState('');
  const [newVarType, setNewVarType] = useState<VariableType>('NUMBER');

  if (!selectedObject) {
    return (
      <div className={`bg-gray-900 flex flex-col h-full border-t border-gray-700 p-6 items-center justify-center text-center text-gray-500 ${className}`}>
        {onClose && (
          <button onClick={onClose} className="absolute top-3 right-3 p-1 text-gray-400 bg-gray-800 rounded-full">
            <X className="w-4 h-4" />
          </button>
        )}
        <MousePointer2 className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">Selecciona un objeto en el canvas para editarlo</p>
      </div>
    );
  }

  // Determine if it is an instance or a prototype based on context
  const isInstance = objects.some(o => o.id === selectedObject.id);

  const handleDelete = () => {
      if (!onDeleteObject) return;
      if (isInstance) {
          if (window.confirm("¿Seguro que quieres eliminar este objeto de la escena?")) {
              onDeleteObject(selectedObject.id);
          }
      } else {
          onDeleteObject(selectedObject.id);
      }
  };

  const handleChange = (field: keyof GameObject, value: any) => {
    let parsedValue = value;
    if (typeof selectedObject[field] === 'number') {
      parsedValue = parseFloat(value);
      if (isNaN(parsedValue)) parsedValue = 0;
    }
    onUpdateObject(selectedObject.id, { [field]: parsedValue });
  };

  const handleTilemapChange = (key: string, value: any) => {
      const tm = selectedObject.tilemap || { tileSize: 32, tiles: {} };
      let finalVal = value;
      if (key === 'tileSize') {
          finalVal = parseInt(value) || 32;
      }
      onUpdateObject(selectedObject.id, { tilemap: { ...tm, [key]: finalVal } });
  };

  // --- TEXT BINDING HANDLERS ---
  const handleBindingChange = (key: string, value: any) => {
      const currentBinding = selectedObject.textBinding || { source: 'GLOBAL', variableId: '' };
      
      let updates: any = { [key]: value };
      if (key === 'source') {
          updates.variableId = '';
          if (value === 'OBJECT') {
              updates.targetObjectId = objects.length > 0 ? objects[0].id : '';
          }
      }

      onUpdateObject(selectedObject.id, { 
          textBinding: { ...currentBinding, ...updates } 
      });
  };

  const toggleBinding = (enabled: boolean) => {
      if (enabled) {
          onUpdateObject(selectedObject.id, { 
              textBinding: { source: 'GLOBAL', variableId: '', prefix: '', suffix: '' } 
          });
      } else {
          onUpdateObject(selectedObject.id, { textBinding: undefined });
      }
  };

  // --- VARIABLES LOCALES HANDLERS ---
  const handleAddVariable = () => {
      if (!newVarName.trim()) return;
      const initialValue = newVarType === 'NUMBER' ? 0 : (newVarType === 'BOOLEAN' ? false : "Texto");
      const newVar: Variable = {
          id: crypto.randomUUID(),
          name: newVarName.trim(),
          type: newVarType,
          value: initialValue
      };
      const updatedVars = [...(selectedObject.variables || []), newVar];
      onUpdateObject(selectedObject.id, { variables: updatedVars });
      setNewVarName('');
  };

  const handleDeleteVariable = (id: string) => {
      if(confirm("¿Eliminar variable?")) {
          const updatedVars = (selectedObject.variables || []).filter(v => v.id !== id);
          onUpdateObject(selectedObject.id, { variables: updatedVars });
      }
  };

  const handleVariableChange = (id: string, value: any) => {
      const updatedVars = (selectedObject.variables || []).map(v => v.id === id ? { ...v, value } : v);
      onUpdateObject(selectedObject.id, { variables: updatedVars });
  };

  // --- BEHAVIORS HANDLERS ---
  const addBehavior = (type: BehaviorType) => {
    const existing = selectedObject.behaviors || [];
    let defaultProps = {};
    let name = "";
    
    switch(type) {
      case BehaviorType.PLATFORMER:
        name = "Plataforma (Física)";
        defaultProps = { gravity: 1200, jumpForce: 550, maxSpeed: 250 };
        break;
      case BehaviorType.TOPDOWN:
        name = "Movimiento Top-Down";
        defaultProps = { speed: 200, allowDiagonals: true };
        break;
      case BehaviorType.PROJECTILE:
        name = "Proyectil / Bala";
        defaultProps = { speed: 400, angle: 0 };
        break;
      case BehaviorType.FOLLOW:
        name = "Perseguir (IA)";
        defaultProps = { 
          movementType: 'TOPDOWN', speed: 100, stopDistance: 5, 
          detectionRange: 300, releaseRange: 500, gravity: 1000, jumpForce: 500, targetId: "" 
        };
        break;
      case BehaviorType.ROTATE:
        name = "Rotación Continua";
        defaultProps = { speed: 90 };
        break;
      case BehaviorType.HEALTH:
        name = "Salud y Daño";
        defaultProps = { maxHealth: 3, currentHealth: 3, destroyOnZero: true };
        break;
      case BehaviorType.ANIMATION:
        name = "Animador de Sprites";
        defaultProps = { 
           animations: [
             { id: 'anim-idle', name: 'Idle', frames: [], fps: 5, loop: true },
             { id: 'anim-run', name: 'Run', frames: [], fps: 10, loop: true },
             { id: 'anim-jump', name: 'Jump', frames: [], fps: 6, loop: false }
           ] 
        };
        break;
      case BehaviorType.TILT_CONTROL:
        name = "Control por Inclinación";
        defaultProps = { speed: 300 };
        break;
    }

    const newBehavior: Behavior = {
      id: crypto.randomUUID(),
      type,
      name,
      properties: defaultProps
    };

    onUpdateObject(selectedObject.id, { 
      behaviors: [...existing, newBehavior] 
    });
    setShowBehaviorMenu(false);
  };

  const removeBehavior = (behaviorId: string) => {
    if(confirm("¿Eliminar este comportamiento?")) {
        const existing = selectedObject.behaviors || [];
        onUpdateObject(selectedObject.id, { 
          behaviors: existing.filter(b => b.id !== behaviorId) 
        });
    }
  };

  const updateBehaviorProp = (behaviorId: string, prop: string, value: any) => {
    const existing = selectedObject.behaviors || [];
    const updated = existing.map(b => {
      if (b.id === behaviorId) {
        let finalValue = value;
        if (typeof value === 'string' && prop !== 'targetId' && prop !== 'movementType' && prop !== 'animations') {
            const num = parseFloat(value);
            if (!isNaN(num)) finalValue = num;
        }
        return { ...b, properties: { ...b.properties, [prop]: finalValue } };
      }
      return b;
    });
    onUpdateObject(selectedObject.id, { behaviors: updated });
  };

  // --- ANIMATION SPECIFIC HANDLERS ---
  
  // Handles adding single OR multiple frames
  const handleAddFrames = (behaviorId: string, animId: string, result: string | string[]) => {
      const urls = Array.isArray(result) ? result : [result];
      if (urls.length === 0) return;

      const existing = selectedObject.behaviors || [];
      let newPreviewUrl = selectedObject.previewSpriteUrl;
      
      const updatedBehaviors = existing.map(b => {
          if (b.id === behaviorId && b.type === BehaviorType.ANIMATION) {
              const animations = (b.properties.animations as AnimationClip[]).map(anim => {
                  if (anim.id === animId) {
                      // Add all new frames
                      const newFrames = urls.map(url => ({ id: crypto.randomUUID(), imageUrl: url }));
                      
                      // Set preview if needed
                      if ((anim.name === 'Idle' || !newPreviewUrl) && newFrames.length > 0) {
                          newPreviewUrl = newFrames[0].imageUrl;
                      }
                      
                      return { ...anim, frames: [...anim.frames, ...newFrames] };
                  }
                  return anim;
              });
              return { ...b, properties: { ...b.properties, animations }};
          }
          return b;
      });
      onUpdateObject(selectedObject.id, { behaviors: updatedBehaviors, previewSpriteUrl: newPreviewUrl });
  };

  const handleUpdateAnimation = (behaviorId: string, animId: string, field: keyof AnimationClip, value: any) => {
    const existing = selectedObject.behaviors || [];
    const updatedBehaviors = existing.map(b => {
        if (b.id === behaviorId && b.type === BehaviorType.ANIMATION) {
            const animations = (b.properties.animations as AnimationClip[]).map(anim => {
                if (anim.id === animId) return { ...anim, [field]: value };
                return anim;
            });
            return { ...b, properties: { ...b.properties, animations }};
        }
        return b;
    });
    onUpdateObject(selectedObject.id, { behaviors: updatedBehaviors });
  };

  const handleDeleteFrame = (behaviorId: string, animId: string, frameId: string) => {
     if(!confirm("¿Borrar este frame?")) return;
     const existing = selectedObject.behaviors || [];
     let newPreviewUrl = selectedObject.previewSpriteUrl;
     const updatedBehaviors = existing.map(b => {
          if (b.id === behaviorId && b.type === BehaviorType.ANIMATION) {
              const animations = (b.properties.animations as AnimationClip[]).map(anim => {
                  if (anim.id === animId) {
                      const newFrames = anim.frames.filter(f => f.id !== frameId);
                      if (anim.name === 'Idle') {
                          if (newFrames.length > 0) newPreviewUrl = newFrames[0].imageUrl;
                          else if (newFrames.length === 0 && newPreviewUrl) newPreviewUrl = undefined;
                      }
                      return { ...anim, frames: newFrames };
                  }
                  return anim;
              });
              return { ...b, properties: { ...b.properties, animations }};
          }
          return b;
      });
      onUpdateObject(selectedObject.id, { behaviors: updatedBehaviors, previewSpriteUrl: newPreviewUrl });
  };

  let varsToBind: Variable[] = [];
  if (selectedObject.textBinding?.source === 'GLOBAL') {
      varsToBind = globalVariables;
  } else if (selectedObject.textBinding?.source === 'LOCAL') {
      varsToBind = selectedObject.variables || [];
  } else if (selectedObject.textBinding?.source === 'OBJECT') {
      const targetObj = objects.find(o => o.id === selectedObject.textBinding?.targetObjectId);
      if (targetObj) varsToBind = targetObj.variables || [];
  }

  const activeBrushAsset = assets.find(a => a.url === activeBrushId);

  return (
    <div className={`bg-gray-900 flex flex-col h-full border-t border-gray-700 shadow-2xl ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between bg-gray-800">
        <div className="flex items-center space-x-2 overflow-hidden">
           <span className="bg-blue-900 text-blue-300 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wide flex-shrink-0">
             {selectedObject.type}
           </span>
           <span className="font-bold text-gray-200 text-sm truncate">Propiedades</span>
        </div>
        
        <div className="flex items-center space-x-1">
            <button 
                onClick={handleDelete}
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                title="Eliminar"
            >
                <Trash2 className="w-4 h-4" />
            </button>
            {onClose && (
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white bg-gray-700 rounded-full ml-1">
                <X className="w-4 h-4" />
            </button>
            )}
        </div>
      </div>

      {/* Instance/Prototype Indicator */}
      <div className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-center border-b border-gray-800 ${isInstance ? 'bg-gray-900 text-gray-500' : 'bg-orange-900/30 text-orange-400'}`}>
          {isInstance ? (
              <span>Editando Instancia (Única)</span>
          ) : (
              <span className="flex items-center justify-center">
                  <Box className="w-3 h-3 mr-1" /> Editando Prototipo (Librería)
              </span>
          )}
      </div>

      <div className="p-4 space-y-5 overflow-y-auto pb-20">
        <input 
          type="text" 
          value={selectedObject.name} 
          onChange={(e) => handleChange('name', e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
          placeholder="Nombre del objeto"
        />

        {(selectedObject.points && selectedObject.points.length > 0) && (
            <div className="flex items-center space-x-2 text-[10px] text-green-400 bg-green-900/20 px-2 py-1 rounded border border-green-900/50">
                <Crosshair className="w-3 h-3" />
                <span>{selectedObject.points.length} puntos de montaje definidos</span>
            </div>
        )}

        {/* --- CUSTOM SCRIPT BUTTON --- */}
        {selectedObject.type !== ObjectType.TILEMAP && (
            <div className="p-3 bg-gray-800 rounded-xl border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center">
                        <Code className="w-3 h-3 mr-2" />
                        Código JavaScript
                    </label>
                    {selectedObject.script && (
                        <span className="text-[9px] bg-green-900/50 text-green-400 px-2 rounded-full border border-green-800">Activo</span>
                    )}
                </div>
                <button 
                    onClick={() => onOpenScriptEditor && onOpenScriptEditor(selectedObject.id)}
                    className="w-full py-2 bg-gray-900 hover:bg-gray-950 border border-gray-700 text-gray-300 rounded-lg text-xs font-mono flex items-center justify-center transition-all hover:border-yellow-600 hover:text-yellow-500"
                >
                    <Code className="w-3 h-3 mr-2" />
                    {selectedObject.script ? 'Editar Script' : 'Escribir Código'}
                </button>
            </div>
        )}

        {/* --- TOGGLE HUD / UI --- */}
        <div className="flex items-center justify-between bg-gray-800 p-3 rounded-lg border border-gray-700">
            <label className="text-xs text-gray-300 flex items-center">
                <MonitorSmartphone className="w-4 h-4 mr-2 text-blue-400" />
                Es Interfaz (HUD)
            </label>
            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input 
                    type="checkbox" 
                    name="toggle" 
                    id="toggle" 
                    checked={!!selectedObject.isGui}
                    onChange={(e) => handleChange('isGui', e.target.checked)}
                    className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-blue-600"
                />
                <label className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${selectedObject.isGui ? 'bg-blue-600' : 'bg-gray-600'}`}></label>
            </div>
        </div>

        {selectedObject.type === ObjectType.TILEMAP && (
             <div className="space-y-3 p-3 bg-gray-800 rounded-xl border border-gray-700">
                 <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center">
                    <Grid3x3 className="w-3 h-3 mr-1" /> Configuración Mapa
                 </label>
                 <div className="flex space-x-3">
                     <div className="flex-1">
                         <label className="text-[9px] text-gray-500 block mb-1">TAMAÑO GRID (PX)</label>
                         <input 
                            type="number" 
                            value={selectedObject.tilemap?.tileSize} 
                            onChange={(e) => handleTilemapChange('tileSize', e.target.value)}
                            className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                         />
                     </div>
                     <div className="flex-1 flex flex-col justify-end">
                         <div className="text-[10px] text-gray-500 mb-1">MODO PINTAR</div>
                         <div className="flex bg-gray-900 rounded border border-gray-700 p-0.5">
                             <button 
                                onClick={() => onSetBrush && onSetBrush(EditorTool.BRUSH, activeBrushId || null)}
                                className={`flex-1 p-1 rounded ${currentTool === EditorTool.BRUSH ? 'bg-cyan-900 text-cyan-400' : 'text-gray-500 hover:text-white'}`}
                                title="Pincel"
                             >
                                 <Paintbrush className="w-4 h-4 mx-auto" />
                             </button>
                             <button 
                                onClick={() => onSetBrush && onSetBrush(EditorTool.ERASER, null)}
                                className={`flex-1 p-1 rounded ${currentTool === EditorTool.ERASER ? 'bg-red-900 text-red-400' : 'text-gray-500 hover:text-white'}`}
                                title="Borrador"
                             >
                                 <Eraser className="w-4 h-4 mx-auto" />
                             </button>
                         </div>
                     </div>
                 </div>

                 {currentTool === EditorTool.BRUSH && (
                     <div>
                         <label className="text-[9px] text-gray-500 block mb-2">SPRITE ACTIVO</label>
                         <div className="flex items-center space-x-2 bg-gray-900 p-2 rounded border border-gray-700">
                             {activeBrushAsset ? (
                                 <img src={activeBrushAsset.url} className="w-8 h-8 object-contain bg-gray-800 rounded image-pixelated" />
                             ) : (
                                 <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center text-gray-600">?</div>
                             )}
                             <button 
                                onClick={() => onOpenAssetManager((url) => onSetBrush && onSetBrush(EditorTool.BRUSH, typeof url === 'string' ? url : url[0]), 'GALLERY')}
                                className="flex-1 text-xs text-left text-gray-300 hover:text-white truncate"
                             >
                                 {activeBrushAsset ? activeBrushAsset.name : 'Seleccionar Sprite...'}
                             </button>
                         </div>
                         <div className="mt-2 flex items-center">
                             <label className="flex items-center space-x-2 text-xs text-gray-400 cursor-pointer">
                                 <input 
                                    type="checkbox" 
                                    checked={brushSolid} 
                                    onChange={(e) => onSetBrushSolid && onSetBrushSolid(e.target.checked)}
                                    className="rounded bg-gray-900 border-gray-600 text-cyan-500 focus:ring-0" 
                                 />
                                 <span>Es Sólido (Colisión)</span>
                             </label>
                         </div>
                     </div>
                 )}
                 <div className="text-[9px] text-gray-500 italic mt-1">
                     * Selecciona el objeto y usa el pincel sobre el canvas para dibujar.
                 </div>
             </div>
        )}

        {selectedObject.type === ObjectType.TEXT && (
            <div className="space-y-4">
                 <div>
                    <label className="block text-xs text-gray-400 mb-1">Contenido Texto</label>
                    <textarea 
                        value={selectedObject.name} 
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:border-yellow-500 outline-none min-h-[60px]"
                    />
                 </div>
                 <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 space-y-3">
                     <div className="flex items-center justify-between">
                         <label className="text-xs font-bold text-gray-500">Vincular a Variable</label>
                         <button 
                            onClick={() => toggleBinding(!selectedObject.textBinding)}
                            className={`w-8 h-4 rounded-full transition-colors ${selectedObject.textBinding ? 'bg-green-600' : 'bg-gray-600'} relative`}
                         >
                             <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${selectedObject.textBinding ? 'left-4.5' : 'left-0.5'}`} style={{left: selectedObject.textBinding ? '18px' : '2px'}}></div>
                         </button>
                     </div>
                     
                     {selectedObject.textBinding && (
                         <div className="space-y-2 pt-2 animate-in slide-in-from-top-2">
                             <div className="flex space-x-2">
                                 <select 
                                    value={selectedObject.textBinding.source}
                                    onChange={(e) => handleBindingChange('source', e.target.value)}
                                    className="bg-gray-900 border border-gray-600 text-[10px] text-white rounded px-2 py-1 flex-1"
                                 >
                                     <option value="GLOBAL">Global</option>
                                     <option value="LOCAL">Local (Este obj)</option>
                                     <option value="OBJECT">Otro Objeto</option>
                                 </select>
                             </div>
                             
                             {selectedObject.textBinding.source === 'OBJECT' && (
                                 <select 
                                    value={selectedObject.textBinding.targetObjectId || ''}
                                    onChange={(e) => handleBindingChange('targetObjectId', e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 text-[10px] text-white rounded px-2 py-1"
                                 >
                                     {objects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                 </select>
                             )}

                             <select 
                                value={selectedObject.textBinding.variableId}
                                onChange={(e) => handleBindingChange('variableId', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 text-[10px] text-white rounded px-2 py-1"
                             >
                                 <option value="">-- Seleccionar --</option>
                                 {varsToBind.map(v => (
                                     <option key={v.id} value={v.name}>{v.name} ({v.type})</option>
                                 ))}
                             </select>

                             <div className="flex space-x-2">
                                 <input type="text" placeholder="Prefijo" value={selectedObject.textBinding.prefix || ''} onChange={(e) => handleBindingChange('prefix', e.target.value)} className="flex-1 bg-gray-900 border-gray-600 rounded px-2 py-1 text-[10px] text-white" />
                                 <input type="text" placeholder="Sufijo" value={selectedObject.textBinding.suffix || ''} onChange={(e) => handleBindingChange('suffix', e.target.value)} className="flex-1 bg-gray-900 border-gray-600 rounded px-2 py-1 text-[10px] text-white" />
                             </div>
                         </div>
                     )}
                 </div>
            </div>
        )}

        {/* --- BEHAVIORS SECTION --- */}
        <div>
           <div className="flex items-center justify-between mb-3">
             <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-wider flex items-center">
                <Zap className="w-3 h-3 mr-1" /> Comportamientos
              </h3>
              <div className="relative">
                 <button 
                   onClick={() => setShowBehaviorMenu(!showBehaviorMenu)}
                   className="text-[10px] bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600 hover:text-white px-2 py-1 rounded transition-colors flex items-center"
                 >
                   <Plus className="w-3 h-3 mr-1" /> Añadir
                 </button>
                 {showBehaviorMenu && (
                   <div className="absolute right-0 top-full mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                      {/* Menu Options */}
                      <button onClick={() => addBehavior(BehaviorType.ANIMATION)} className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-gray-700 flex items-center border-l-2 border-transparent hover:border-orange-500"><Film className="w-3 h-3 mr-2 text-orange-400" /> Animación</button>
                      <button onClick={() => addBehavior(BehaviorType.PLATFORMER)} className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-gray-700 flex items-center"><Activity className="w-3 h-3 mr-2 text-green-400" /> Plataforma</button>
                      <button onClick={() => addBehavior(BehaviorType.TOPDOWN)} className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-gray-700 flex items-center"><Compass className="w-3 h-3 mr-2 text-purple-400" /> Top-Down</button>
                      <button onClick={() => addBehavior(BehaviorType.TILT_CONTROL)} className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-gray-700 flex items-center"><Smartphone className="w-3 h-3 mr-2 text-blue-400" /> Control Inclinación</button>
                      <button onClick={() => addBehavior(BehaviorType.PROJECTILE)} className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-gray-700 flex items-center"><Crosshair className="w-3 h-3 mr-2 text-red-400" /> Proyectil</button>
                      <button onClick={() => addBehavior(BehaviorType.FOLLOW)} className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-gray-700 flex items-center"><Magnet className="w-3 h-3 mr-2 text-blue-500" /> Perseguir</button>
                      <button onClick={() => addBehavior(BehaviorType.ROTATE)} className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-gray-700 flex items-center"><RotateCw className="w-3 h-3 mr-2 text-pink-400" /> Rotación</button>
                      <button onClick={() => addBehavior(BehaviorType.HEALTH)} className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-gray-700 flex items-center"><Activity className="w-3 h-3 mr-2 text-green-500" /> Salud / Vida</button>
                   </div>
                 )}
              </div>
           </div>

           <div className="space-y-3">
              {(selectedObject.behaviors || []).map(behavior => (
                <div key={behavior.id} className="bg-gray-800 rounded-lg border border-gray-700 p-3 relative group">
                   <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center text-sm font-medium text-gray-200">
                         {behavior.type === BehaviorType.ANIMATION && <Film className="w-4 h-4 mr-2 text-orange-500" />}
                         {behavior.type === BehaviorType.HEALTH && <Activity className="w-4 h-4 mr-2 text-green-500" />}
                         {behavior.type === BehaviorType.TILT_CONTROL && <Smartphone className="w-4 h-4 mr-2 text-blue-400" />}
                         {behavior.name}
                      </div>
                      <button onClick={() => removeBehavior(behavior.id)} className="text-gray-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                   </div>
                   
                   <div className="space-y-2 pl-1 border-l-2 border-gray-700 ml-1">
                      
                      {/* --- ANIMATION UI --- */}
                      {behavior.type === BehaviorType.ANIMATION && (
                          <div className="space-y-3 mt-2">
                             {(behavior.properties.animations as AnimationClip[]).map(anim => (
                                 <div key={anim.id} className="bg-gray-900/50 rounded border border-gray-700/50 overflow-hidden">
                                     <button 
                                        onClick={() => setExpandedAnim(expandedAnim === anim.id ? null : anim.id)}
                                        className="w-full flex items-center justify-between p-2 hover:bg-gray-800 transition-colors"
                                     >
                                         <div className="flex items-center space-x-2">
                                             {expandedAnim === anim.id ? <ChevronUp className="w-3 h-3 text-gray-500"/> : <ChevronDown className="w-3 h-3 text-gray-500"/>}
                                             <span className="text-xs font-bold text-gray-300">{anim.name}</span>
                                             <span className="text-[9px] bg-gray-800 text-gray-500 px-1 rounded">{anim.frames.length} frames</span>
                                         </div>
                                     </button>

                                     {expandedAnim === anim.id && (
                                         <div className="p-2 border-t border-gray-800 bg-black/20 animate-in slide-in-from-top-2">
                                             <div className="flex items-center space-x-2 mb-2">
                                                 <div className="flex-1">
                                                     <label className="text-[9px] text-gray-500 block">Velocidad (FPS)</label>
                                                     <input 
                                                        type="number" 
                                                        value={anim.fps}
                                                        onChange={(e) => handleUpdateAnimation(behavior.id, anim.id, 'fps', parseInt(e.target.value))}
                                                        className="w-full bg-gray-950 border border-gray-700 rounded px-1 py-0.5 text-xs text-white"
                                                     />
                                                 </div>
                                                 <div className="flex items-center pt-3">
                                                      <label className="flex items-center cursor-pointer space-x-1">
                                                          <input 
                                                            type="checkbox" 
                                                            checked={anim.loop}
                                                            onChange={(e) => handleUpdateAnimation(behavior.id, anim.id, 'loop', e.target.checked)}
                                                            className="rounded bg-gray-700 border-gray-600 text-orange-500 focus:ring-0" 
                                                          />
                                                          <span className="text-[10px] text-gray-400">Loop</span>
                                                      </label>
                                                 </div>
                                             </div>

                                             <AnimationPreview animation={anim} />

                                             <div className="text-[9px] text-gray-500 font-bold mb-1 uppercase flex justify-between items-center">
                                                 <span>Frames</span>
                                                 <button 
                                                    onClick={() => onOpenAssetManager((urls) => handleAddFrames(behavior.id, anim.id, urls), 'SHEET_SLICER')}
                                                    className="text-[9px] text-orange-400 hover:text-orange-300 flex items-center bg-orange-900/30 px-1.5 py-0.5 rounded border border-orange-500/30"
                                                    title="Importar Sprite Sheet"
                                                 >
                                                     <Scissors className="w-3 h-3 mr-1" /> Importar Sheet
                                                 </button>
                                             </div>
                                             
                                             <div className="flex flex-wrap gap-2 mb-2">
                                                 {anim.frames.map((frame, idx) => (
                                                     <div key={frame.id} className="relative w-14 h-14 bg-gray-800 border-2 border-gray-600 rounded-lg overflow-hidden shrink-0 group/frame">
                                                         <img src={frame.imageUrl} className="w-full h-full object-contain image-pixelated" />
                                                         <button className="absolute top-0 right-0 bg-red-600/90 text-white p-1 rounded-bl-lg z-10" onClick={(e) => { e.stopPropagation(); handleDeleteFrame(behavior.id, anim.id, frame.id); }}><X className="w-3 h-3" /></button>
                                                         <div className="absolute bottom-0 left-0 bg-black/60 text-[9px] text-white px-1.5 py-0.5 rounded-tr-lg pointer-events-none">{idx + 1}</div>
                                                     </div>
                                                 ))}
                                                 <button 
                                                    onClick={() => onOpenAssetManager((url) => handleAddFrames(behavior.id, anim.id, url), 'GALLERY')}
                                                    className="w-14 h-14 border-2 border-dashed border-gray-600 hover:border-blue-500 hover:text-blue-500 text-gray-500 rounded-lg flex items-center justify-center transition-colors shrink-0"
                                                    title="Añadir Frame Único"
                                                 >
                                                     <Plus className="w-5 h-5" />
                                                 </button>
                                             </div>
                                         </div>
                                     )}
                                 </div>
                             ))}
                          </div>
                      )}

                      {/* Default Props UI for other behaviors */}
                      {behavior.type !== BehaviorType.ANIMATION && Object.entries(behavior.properties).map(([key, val]) => (
                          <div key={key}>
                              <label className="text-[10px] text-gray-500 block capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                              {typeof val === 'boolean' ? (
                                  <button onClick={() => updateBehaviorProp(behavior.id, key, !val)} className={`text-xs px-2 py-1 rounded ${val ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{val ? 'ON' : 'OFF'}</button>
                              ) : (
                                  <input 
                                     type={typeof val === 'number' ? 'number' : 'text'} 
                                     value={val as any}
                                     onChange={(e) => updateBehaviorProp(behavior.id, key, e.target.value)}
                                     className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                                  />
                              )}
                          </div>
                      ))}
                   </div>
                </div>
              ))}
           </div>
        </div>
        
        {/* Transform section always at bottom */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Transformación</h3>
          <div className="grid grid-cols-2 gap-3">
             <div className="relative">
                <label className="text-[9px] text-gray-500 block mb-1">POS X</label>
                <input type="number" value={selectedObject.x} onChange={(e) => handleChange('x', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white" />
             </div>
             <div className="relative">
                <label className="text-[9px] text-gray-500 block mb-1">POS Y</label>
                <input type="number" value={selectedObject.y} onChange={(e) => handleChange('y', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white" />
             </div>
             <div className="relative">
                <label className="text-[9px] text-gray-500 block mb-1">ANCHO</label>
                <input type="number" value={selectedObject.width} onChange={(e) => handleChange('width', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white" />
             </div>
             <div className="relative">
                <label className="text-[9px] text-gray-500 block mb-1">ALTO</label>
                <input type="number" value={selectedObject.height} onChange={(e) => handleChange('height', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white" />
             </div>
             <div className="relative">
                <label className="text-[9px] text-gray-500 block mb-1">ROTACIÓN</label>
                <div className="flex items-center">
                    <input type="number" value={selectedObject.rotation} onChange={(e) => handleChange('rotation', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white" />
                    <span className="ml-1 text-[10px] text-gray-500">°</span>
                </div>
             </div>
             <div className="relative">
                <label className="text-[9px] text-gray-500 block mb-1">OPACIDAD</label>
                <input type="number" min="0" max="1" step="0.1" value={selectedObject.opacity} onChange={(e) => handleChange('opacity', e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white" />
             </div>
          </div>
        </div>
        
        {/* --- VARIABLES LOCALES UI --- */}
        <div>
            <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-pink-500 uppercase tracking-wider flex items-center">
                    <VariableIcon className="w-3 h-3 mr-1" /> Variables Locales
                </label>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700 space-y-2">
                {(selectedObject.variables || []).map(v => (
                    <div key={v.id} className="flex items-center justify-between bg-gray-900 rounded p-1.5 border border-gray-800">
                        <div className="flex items-center space-x-2 overflow-hidden flex-1">
                            <span className="text-[10px] bg-gray-800 px-1 rounded text-gray-400 font-mono">{v.name}</span>
                            <div className="flex-1">
                                {v.type === 'BOOLEAN' ? (
                                    <button 
                                      onClick={() => handleVariableChange(v.id, !v.value)}
                                      className={`text-[9px] px-1.5 py-0.5 rounded ${v.value ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}
                                    >
                                        {v.value ? 'TRUE' : 'FALSE'}
                                    </button>
                                ) : (
                                    <input 
                                        type={v.type === 'NUMBER' ? 'number' : 'text'}
                                        value={v.value}
                                        onChange={(e) => handleVariableChange(v.id, v.type === 'NUMBER' ? parseFloat(e.target.value) : e.target.value)}
                                        className="bg-transparent border-0 p-0 text-[10px] text-gray-300 w-full focus:ring-0"
                                    />
                                )}
                            </div>
                        </div>
                        <button onClick={() => handleDeleteVariable(v.id)} className="text-gray-600 hover:text-red-400">
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                ))}
                
                <div className="flex space-x-1">
                    <input 
                        type="text" 
                        value={newVarName} 
                        onChange={(e) => setNewVarName(e.target.value)}
                        placeholder="Nombre"
                        className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-[10px] text-white"
                    />
                     <select 
                        value={newVarType}
                        onChange={(e) => setNewVarType(e.target.value as VariableType)}
                        className="bg-gray-900 border border-gray-600 rounded px-1 text-[9px] text-white w-14"
                     >
                         <option value="NUMBER">Num</option>
                         <option value="STRING">Txt</option>
                         <option value="BOOLEAN">Bool</option>
                     </select>
                     <button onClick={handleAddVariable} className="bg-gray-700 hover:bg-gray-600 text-white px-2 rounded">
                         <Plus className="w-3 h-3" />
                     </button>
                </div>
            </div>
        </div>

        <div className="h-px bg-gray-800"></div>

        {/* DELETE BUTTON (Big one at bottom) */}
        <button 
            onClick={handleDelete}
            className="w-full py-3 bg-red-900/20 hover:bg-red-900/40 border border-red-800/50 rounded-xl text-red-400 font-bold text-xs flex items-center justify-center space-x-2 transition-all mt-8"
        >
            <Trash2 className="w-4 h-4" />
            <span>{isInstance ? 'Eliminar de Escena' : 'Eliminar de Librería'}</span>
        </button>

      </div>
    </div>
  );
};
