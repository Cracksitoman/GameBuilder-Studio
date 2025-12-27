
import React, { useState } from 'react';
import { GameObject, ObjectType, BehaviorType, Behavior, AnimationClip, Variable, VariableType, Asset, EditorTool } from '../types';
import { Layers, Move, Type, MousePointer2, X, Zap, Trash2, Activity, RotateCw, Plus, BrickWall, Compass, Crosshair, Magnet, Film, ImagePlus, ChevronDown, ChevronUp, Grid3x3, Hash, ToggleLeft, Variable as VariableIcon, Link2, Grid, Paintbrush, Eraser, MonitorSmartphone, Play, Settings, CheckSquare, Square, Code, BrickWall as WallIcon, Box } from './Icons';

interface PropertiesPanelProps {
  selectedObject: GameObject | null;
  objects?: GameObject[];
  globalVariables?: Variable[];
  assets?: Asset[];
  onUpdateObject: (id: string, updates: Partial<GameObject>) => void;
  onDeleteObject?: (id: string) => void;
  onOpenAssetManager: (callback: (url: string) => void) => void;
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
          // Library deletion usually handles its own confirmation in App.tsx logic for now, 
          // or we can force it here. Let's call it directly as App.tsx handles library confirm.
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
      const updatedVars = (selectedObject.variables || []).filter(v => v.id !== id);
      onUpdateObject(selectedObject.id, { variables: updatedVars });
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
    const existing = selectedObject.behaviors || [];
    onUpdateObject(selectedObject.id, { 
      behaviors: existing.filter(b => b.id !== behaviorId) 
    });
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
  const handleAddFrame = (behaviorId: string, animId: string, url: string) => {
      if (!url) return;
      const existing = selectedObject.behaviors || [];
      let newPreviewUrl = selectedObject.previewSpriteUrl;
      
      const updatedBehaviors = existing.map(b => {
          if (b.id === behaviorId && b.type === BehaviorType.ANIMATION) {
              const animations = (b.properties.animations as AnimationClip[]).map(anim => {
                  if (anim.id === animId) {
                      if (anim.name === 'Idle' || !newPreviewUrl) newPreviewUrl = url;
                      return { ...anim, frames: [...anim.frames, { id: crypto.randomUUID(), imageUrl: url }] };
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

        {/* ... (Rest of component content identical) ... */}
        {selectedObject.type === ObjectType.TILEMAP && (
             <div className="space-y-3 p-3 bg-gray-800 rounded-xl border border-gray-700">
                 <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center">
                    <Grid3x3 className="w-3 h-3 mr-1" /> Configuración Mapa
                 </label>
                 
                 <div className="flex items-center space-x-2">
                     <label className="text-[10px] text-gray-400">Tamaño Tile (px)</label>
                     <input 
                       type="number" 
                       value={selectedObject.tilemap?.tileSize || 32}
                       onChange={(e) => handleTilemapChange('tileSize', e.target.value)}
                       className="w-16 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                     />
                 </div>

                 <div className="h-px bg-gray-700"></div>

                 <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Herramientas de Pintado</label>
                 <div className="grid grid-cols-3 gap-2">
                     <button 
                        onClick={() => {
                            if(onSetBrush) onSetBrush(EditorTool.BRUSH, activeBrushId || (assets[0]?.url));
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border ${currentTool === EditorTool.BRUSH ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-gray-700 border-transparent text-gray-400 hover:bg-gray-600'}`}
                     >
                         <Paintbrush className="w-4 h-4 mb-1" />
                         <span className="text-[9px]">Pincel</span>
                     </button>
                     <button 
                        onClick={() => {
                             if(onSetBrush) onSetBrush(EditorTool.ERASER, null);
                        }}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border ${currentTool === EditorTool.ERASER ? 'bg-red-600 border-red-400 text-white' : 'bg-gray-700 border-transparent text-gray-400 hover:bg-gray-600'}`}
                     >
                         <Eraser className="w-4 h-4 mb-1" />
                         <span className="text-[9px]">Borrar</span>
                     </button>
                     <button 
                         onClick={() => onOpenAssetManager((url) => {
                             if(onSetBrush) onSetBrush(EditorTool.BRUSH, url);
                         })}
                         className="flex flex-col items-center justify-center p-2 rounded-lg border bg-gray-700 border-transparent text-gray-400 hover:bg-gray-600"
                     >
                         <ImagePlus className="w-4 h-4 mb-1" />
                         <span className="text-[9px]">Assets</span>
                     </button>
                 </div>
                 
                 {/* COLLISION TOGGLE for BRUSH */}
                 {currentTool === EditorTool.BRUSH && (
                     <div className="mt-2 pt-2 border-t border-gray-700">
                         <label className="flex items-center space-x-2 cursor-pointer bg-gray-900 p-2 rounded border border-gray-600 hover:bg-gray-800 transition-colors">
                             <div className={`w-4 h-4 border rounded flex items-center justify-center ${brushSolid ? 'bg-red-500 border-red-500' : 'border-gray-500'}`}>
                                 {brushSolid && <CheckSquare className="w-3 h-3 text-white" />}
                             </div>
                             <input 
                                 type="checkbox" 
                                 className="hidden"
                                 checked={brushSolid}
                                 onChange={(e) => onSetBrushSolid && onSetBrushSolid(e.target.checked)}
                             />
                             <span className={`text-[10px] font-bold ${brushSolid ? 'text-red-400' : 'text-gray-400'}`}>
                                 {brushSolid ? 'SÓLIDO (Pared/Suelo)' : 'DECORACIÓN (Fondo)'}
                             </span>
                         </label>
                     </div>
                 )}
             </div>
        )}

        {selectedObject.type === ObjectType.TEXT && (
            <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Contenido</label>
                  <textarea 
                    value={selectedObject.name} 
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-sm text-white h-20 focus:border-yellow-500 outline-none"
                  />
               </div>
               <div>
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Color de Texto</label>
                   <div className="flex items-center space-x-2">
                        <input 
                            type="color" 
                            value={selectedObject.color}
                            onChange={(e) => handleChange('color', e.target.value)}
                            className="w-8 h-8 bg-transparent border-0 p-0 cursor-pointer"
                        />
                        <span className="text-xs text-gray-400 font-mono">{selectedObject.color}</span>
                   </div>
               </div>
               {/* Text Binding UI */}
               <div className="p-3 bg-gray-800 rounded-xl border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center space-x-2">
                             <Link2 className="w-4 h-4 text-purple-400" />
                             <span className="text-xs font-bold text-gray-200">Vincular a Variable</span>
                         </div>
                         <button 
                           onClick={() => toggleBinding(!selectedObject.textBinding)}
                           className={`w-8 h-4 rounded-full relative transition-colors ${selectedObject.textBinding ? 'bg-purple-600' : 'bg-gray-600'}`}
                         >
                             <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${selectedObject.textBinding ? 'left-4.5' : 'left-0.5'}`}></div>
                         </button>
                    </div>
                    {selectedObject.textBinding && (
                        <div className="space-y-2 mt-2">
                             <select 
                                value={selectedObject.textBinding.source}
                                onChange={(e) => handleBindingChange('source', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                             >
                                 <option value="GLOBAL">Variable Global</option>
                                 <option value="LOCAL">Variable Local</option>
                                 <option value="OBJECT">Variable de Otro Objeto</option>
                             </select>
                             {selectedObject.textBinding.source === 'OBJECT' && (
                                 <select 
                                    value={selectedObject.textBinding.targetObjectId || ''}
                                    onChange={(e) => handleBindingChange('targetObjectId', e.target.value)}
                                    className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                                 >
                                     {objects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                                 </select>
                             )}
                             <select 
                                value={selectedObject.textBinding.variableId}
                                onChange={(e) => handleBindingChange('variableId', e.target.value)}
                                className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                             >
                                 <option value="">-- Seleccionar Variable --</option>
                                 {varsToBind.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                             </select>
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
                      <button onClick={() => addBehavior(BehaviorType.PROJECTILE)} className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-gray-700 flex items-center"><Crosshair className="w-3 h-3 mr-2 text-red-400" /> Proyectil</button>
                      <button onClick={() => addBehavior(BehaviorType.FOLLOW)} className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-gray-700 flex items-center"><Magnet className="w-3 h-3 mr-2 text-blue-500" /> Perseguir</button>
                      <button onClick={() => addBehavior(BehaviorType.ROTATE)} className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-gray-700 flex items-center"><RotateCw className="w-3 h-3 mr-2 text-pink-400" /> Rotación</button>
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
                         {/* Icons for others... */}
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

                                             <div className="text-[9px] text-gray-500 font-bold mb-1 uppercase">Frames</div>
                                             <div className="flex flex-wrap gap-2 mb-2">
                                                 {anim.frames.map((frame, idx) => (
                                                     <div key={frame.id} className="relative w-14 h-14 bg-gray-800 border-2 border-gray-600 rounded-lg overflow-hidden shrink-0 group/frame">
                                                         <img src={frame.imageUrl} className="w-full h-full object-contain image-pixelated" />
                                                         <button className="absolute top-0 right-0 bg-red-600/90 text-white p-1 rounded-bl-lg z-10" onClick={(e) => { e.stopPropagation(); handleDeleteFrame(behavior.id, anim.id, frame.id); }}><X className="w-3 h-3" /></button>
                                                         <div className="absolute bottom-0 left-0 bg-black/60 text-[9px] text-white px-1.5 py-0.5 rounded-tr-lg pointer-events-none">{idx + 1}</div>
                                                     </div>
                                                 ))}
                                                 <button 
                                                    onClick={() => onOpenAssetManager((url) => handleAddFrame(behavior.id, anim.id, url))}
                                                    className="w-14 h-14 border-2 border-dashed border-gray-600 hover:border-orange-500 hover:text-orange-500 text-gray-500 rounded-lg flex items-center justify-center transition-colors shrink-0"
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
        <div className="space-y-3 mt-4 pt-4 border-t border-gray-800">
             <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Transformación</label>
             <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">ANCHO</label>
                  <input type="number" value={selectedObject.width} onChange={(e) => handleChange('width', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">ALTO</label>
                  <input type="number" value={selectedObject.height} onChange={(e) => handleChange('height', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-2 text-sm text-white" />
                </div>
                {/* Hide Pos X/Y if editing prototype to avoid confusion, or keep it but it won't affect instances pos */}
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">X {isInstance ? '' : '(Base)'}</label>
                  <input type="number" value={selectedObject.x} onChange={(e) => handleChange('x', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Y {isInstance ? '' : '(Base)'}</label>
                  <input type="number" value={selectedObject.y} onChange={(e) => handleChange('y', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-2 text-sm text-white" />
                </div>
             </div>
        </div>

        <div className="h-px bg-gray-800"></div>

        {/* --- VARIABLES SECTION --- */}
        <div className="space-y-3">
             <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-pink-500 uppercase tracking-wider flex items-center">
                    <VariableIcon className="w-3 h-3 mr-1" /> Variables de Instancia
                </label>
             </div>

             <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-800 space-y-3">
                 {/* List of Vars */}
                 {(selectedObject.variables || []).map(v => (
                     <div key={v.id} className="flex items-center justify-between bg-gray-900 border border-gray-700 rounded-lg p-2">
                         <div className="flex items-center space-x-2 overflow-hidden flex-1">
                             <div className="p-1.5 bg-gray-800 rounded">
                                {v.type === 'NUMBER' && <Hash className="w-3 h-3 text-blue-400" />}
                                {v.type === 'STRING' && <Type className="w-3 h-3 text-yellow-400" />}
                                {v.type === 'BOOLEAN' && <ToggleLeft className="w-3 h-3 text-green-400" />}
                             </div>
                             <div className="flex flex-col min-w-0 flex-1">
                                 <span className="text-[10px] font-bold text-gray-300 truncate">{v.name}</span>
                                 {v.type === 'BOOLEAN' ? (
                                     <button onClick={() => handleVariableChange(v.id, !v.value)} className={`text-[9px] px-1.5 py-0.5 rounded w-fit ${v.value ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>{v.value ? 'TRUE' : 'FALSE'}</button>
                                 ) : (
                                     <input type={v.type === 'NUMBER' ? 'number' : 'text'} value={v.value} onChange={(e) => handleVariableChange(v.id, v.type === 'NUMBER' ? parseFloat(e.target.value) : e.target.value)} className="bg-transparent border-0 p-0 text-[10px] text-white focus:ring-0 w-full" />
                                 )}
                             </div>
                         </div>
                         <button onClick={() => handleDeleteVariable(v.id)} className="text-gray-600 hover:text-red-400 p-1"><Trash2 className="w-3 h-3" /></button>
                     </div>
                 ))}

                 {/* Add New Var */}
                 <div className="flex space-x-1 pt-1">
                    <input type="text" value={newVarName} onChange={(e) => setNewVarName(e.target.value)} placeholder="Nombre (ej. Vida)" className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-pink-500" />
                    <select value={newVarType} onChange={(e) => setNewVarType(e.target.value as VariableType)} className="bg-gray-900 border border-gray-600 rounded-lg px-1 text-[10px] text-white outline-none w-16">
                        <option value="NUMBER">Num</option>
                        <option value="STRING">Txt</option>
                        <option value="BOOLEAN">Bool</option>
                    </select>
                    <button onClick={handleAddVariable} className="p-1.5 bg-gray-700 hover:bg-pink-600 rounded-lg text-gray-300 hover:text-white transition-colors"><Plus className="w-4 h-4" /></button>
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
