
import React, { useState, useEffect, useRef } from 'react';
import { GameObject, ObjectType, Variable, VariableType, SpawnPoint } from '../types';
import { X, Save, Box, Type, User, Ghost, Check, ImageIcon, Hash, ToggleLeft, Plus, Trash2, Variable as VariableIcon, Crosshair, MonitorSmartphone } from './Icons';

interface EditObjectModalProps {
  object: GameObject | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<GameObject>) => void;
}

export const EditObjectModal: React.FC<EditObjectModalProps> = ({ object, isOpen, onClose, onSave }) => {
  const [data, setData] = useState<GameObject | null>(null);
  const [tab, setTab] = useState<'GENERAL' | 'VARIABLES' | 'POINTS'>('GENERAL');
  
  // Local Variable Entry State
  const [newVarName, setNewVarName] = useState('');
  const [newVarType, setNewVarType] = useState<VariableType>('NUMBER');

  // Point Entry State
  const [newPointName, setNewPointName] = useState('Cañón');
  const previewRef = useRef<HTMLDivElement>(null);

  // Sync state when object opens
  useEffect(() => {
    if (object && isOpen) {
      setData({ ...object, variables: object.variables || [], points: object.points || [] });
      setTab('GENERAL');
    }
  }, [object, isOpen]);

  if (!isOpen || !data) return null;

  const handleChange = (field: keyof GameObject, value: any) => {
    setData(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleNumberChange = (field: keyof GameObject, value: string) => {
    const num = parseFloat(value);
    handleChange(field, isNaN(num) ? 0 : num);
  };

  const handleSave = () => {
    if (data && object) {
      onSave(object.id, data);
      onClose();
    }
  };

  // --- VARIABLE HANDLERS ---
  const handleAddVariable = () => {
      if (!newVarName.trim()) return;
      const initialValue = newVarType === 'NUMBER' ? 0 : (newVarType === 'BOOLEAN' ? false : "Texto");
      const newVar: Variable = {
          id: crypto.randomUUID(),
          name: newVarName.trim(),
          type: newVarType,
          value: initialValue
      };
      
      setData(prev => {
          if (!prev) return null;
          return { ...prev, variables: [...(prev.variables || []), newVar] };
      });
      setNewVarName('');
  };

  const handleDeleteVariable = (id: string) => {
      setData(prev => {
          if (!prev) return null;
          return { ...prev, variables: (prev.variables || []).filter(v => v.id !== id) };
      });
  };

  const handleVariableChange = (id: string, value: any) => {
      setData(prev => {
          if (!prev) return null;
          return { 
              ...prev, 
              variables: (prev.variables || []).map(v => v.id === id ? { ...v, value } : v) 
          };
      });
  };

  // --- POINTS HANDLERS ---
  const handlePreviewClick = (e: React.MouseEvent) => {
      if (tab !== 'POINTS' || !previewRef.current) return;
      
      const rect = previewRef.current.getBoundingClientRect();
      // Calculate normalized coordinates (0 to 1)
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const newPoint: SpawnPoint = {
          id: crypto.randomUUID(),
          name: newPointName,
          x,
          y
      };

      setData(prev => {
          if (!prev) return null;
          return { ...prev, points: [...(prev.points || []), newPoint] };
      });
  };

  const handleDeletePoint = (id: string) => {
      setData(prev => {
          if (!prev) return null;
          return { ...prev, points: (prev.points || []).filter(p => p.id !== id) };
      });
  };

  const getIcon = () => {
    switch (data.type) {
      case ObjectType.TEXT: return <Type className="w-5 h-5 text-yellow-400" />;
      case ObjectType.PLAYER: return <User className="w-5 h-5 text-green-400" />;
      case ObjectType.ENEMY: return <Ghost className="w-5 h-5 text-red-400" />;
      case ObjectType.UI_BUTTON: return <MonitorSmartphone className="w-5 h-5 text-orange-400" />;
      default: return <Box className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden transform transition-all scale-100 h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-800/50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-800 rounded-lg border border-gray-700">
              {getIcon()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Editar Objeto</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">{data.type}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 bg-gray-900">
            <button onClick={() => setTab('GENERAL')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${tab === 'GENERAL' ? 'text-blue-400 border-b-2 border-blue-500 bg-gray-800/50' : 'text-gray-500 hover:text-gray-300'}`}>General</button>
            <button onClick={() => setTab('VARIABLES')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${tab === 'VARIABLES' ? 'text-pink-400 border-b-2 border-pink-500 bg-gray-800/50' : 'text-gray-500 hover:text-gray-300'}`}>Variables</button>
            <button onClick={() => setTab('POINTS')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${tab === 'POINTS' ? 'text-red-400 border-b-2 border-red-500 bg-gray-800/50' : 'text-gray-500 hover:text-gray-300'}`}>Puntos</button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          
          {tab === 'GENERAL' && (
              <>
                {/* General Section */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">General</label>
                    <div>
                    <label className="block text-xs text-gray-400 mb-1">Nombre</label>
                    <input 
                        type="text" 
                        value={data.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                    </div>
                </div>

                {/* Sprite / Visual Section */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Apariencia (Sprite)</span>
                    <span className="text-[10px] bg-blue-900/50 text-blue-300 px-1.5 rounded">2D / Pixel Art</span>
                    </label>
                    
                    <div className="flex space-x-4">
                    {/* Preview Box */}
                    <div className="w-24 h-24 bg-gray-950 border border-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden group shrink-0">
                        {/* Checkerboard background for transparency */}
                        <div className="absolute inset-0 opacity-20" 
                            style={{backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)', backgroundSize: '10px 10px', backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px'}}>
                        </div>
                        
                        {/* The Object Preview */}
                        <div 
                            className="relative z-10 w-full h-full shadow-sm"
                            style={{
                                backgroundColor: data.previewSpriteUrl ? 'transparent' : data.color,
                                backgroundImage: data.previewSpriteUrl ? `url(${data.previewSpriteUrl})` : undefined,
                                backgroundSize: '100% 100%',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center',
                                imageRendering: 'pixelated',
                                borderRadius: data.previewSpriteUrl ? '0' : '0.125rem',
                                transform: 'scale(0.8)' // Padding inside box
                            }}
                        ></div>

                        {!data.previewSpriteUrl && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                <ImageIcon className="w-6 h-6 text-white" />
                            </div>
                        )}
                    </div>

                    {/* Color/Opacity Controls */}
                    <div className="flex-1 space-y-3">
                        <div>
                        <label className="block text-xs text-gray-400 mb-1">Color (Tint)</label>
                        <div className="flex items-center space-x-2">
                            <input 
                                type="color" 
                                value={data.color}
                                onChange={(e) => handleChange('color', e.target.value)}
                                className="h-8 w-8 rounded cursor-pointer bg-transparent border-0 p-0"
                            />
                            <input 
                                type="text" 
                                value={data.color}
                                onChange={(e) => handleChange('color', e.target.value)}
                                className="flex-1 bg-gray-950 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-300 font-mono"
                            />
                        </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Opacidad</label>
                            <input 
                            type="range" min="0" max="1" step="0.1" 
                            value={data.opacity}
                            onChange={(e) => handleNumberChange('opacity', e.target.value)}
                            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>
                    </div>
                    </div>
                </div>

                <div className="h-px bg-gray-800"></div>

                {/* Transform Section */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Transformación</label>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                        <label className="block text-[10px] text-gray-400 mb-1">ANCHO (PX)</label>
                        <input type="number" value={data.width} onChange={(e) => handleNumberChange('width', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-2 text-sm text-white" />
                        </div>
                        <div>
                        <label className="block text-[10px] text-gray-400 mb-1">ALTO (PX)</label>
                        <input type="number" value={data.height} onChange={(e) => handleNumberChange('height', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-2 text-sm text-white" />
                        </div>
                        <div>
                        <label className="block text-[10px] text-gray-400 mb-1">POSICIÓN X</label>
                        <input type="number" value={data.x} onChange={(e) => handleNumberChange('x', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-2 text-sm text-white" />
                        </div>
                        <div>
                        <label className="block text-[10px] text-gray-400 mb-1">POSICIÓN Y</label>
                        <input type="number" value={data.y} onChange={(e) => handleNumberChange('y', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded px-2 py-2 text-sm text-white" />
                        </div>
                    </div>
                </div>
                
                {data.type === ObjectType.TEXT && (
                    <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Texto</label>
                    <textarea 
                        value={data.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm text-white min-h-[80px]"
                    />
                    </div>
                )}
              </>
          )}

          {tab === 'VARIABLES' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-pink-500 uppercase tracking-wider flex items-center">
                        <VariableIcon className="w-3 h-3 mr-1" /> Variables Locales
                    </label>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-3 border border-gray-800 space-y-3">
                    {/* List of Vars */}
                    {(data.variables || []).length === 0 && (
                        <p className="text-[10px] text-gray-500 text-center py-2">Sin variables definidas.</p>
                    )}
                    {(data.variables || []).map(v => (
                        <div key={v.id} className="flex items-center justify-between bg-gray-900 border border-gray-700 rounded-lg p-2">
                            <div className="flex items-center space-x-2 overflow-hidden flex-1">
                                <div className="p-1.5 bg-gray-800 rounded">
                                    {v.type === 'NUMBER' && <Hash className="w-3 h-3 text-blue-400" />}
                                    {v.type === 'STRING' && <Type className="w-3 h-3 text-yellow-400" />}
                                    {v.type === 'BOOLEAN' && <ToggleLeft className="w-3 h-3 text-green-400" />}
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-[10px] font-bold text-gray-300 truncate">{v.name}</span>
                                    {/* Inline Value Edit */}
                                    {v.type === 'BOOLEAN' ? (
                                        <button 
                                        onClick={() => handleVariableChange(v.id, !v.value)}
                                        className={`text-[9px] px-1.5 py-0.5 rounded w-fit ${v.value ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}
                                        >
                                            {v.value ? 'TRUE' : 'FALSE'}
                                        </button>
                                    ) : (
                                        <input 
                                            type={v.type === 'NUMBER' ? 'number' : 'text'}
                                            value={v.value}
                                            onChange={(e) => handleVariableChange(v.id, v.type === 'NUMBER' ? parseFloat(e.target.value) : e.target.value)}
                                            className="bg-transparent border-0 p-0 text-[10px] text-white focus:ring-0 w-full"
                                        />
                                    )}
                                </div>
                            </div>
                            <button onClick={() => handleDeleteVariable(v.id)} className="text-gray-600 hover:text-red-400 p-1">
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}

                    {/* Add New Var */}
                    <div className="flex space-x-1 pt-1">
                        <input 
                        type="text" 
                        value={newVarName}
                        onChange={(e) => setNewVarName(e.target.value)}
                        placeholder="Nombre (ej. Vida)"
                        className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-pink-500"
                        />
                        <select 
                        value={newVarType}
                        onChange={(e) => setNewVarType(e.target.value as VariableType)}
                        className="bg-gray-900 border border-gray-600 rounded-lg px-1 text-[10px] text-white outline-none w-16"
                        >
                            <option value="NUMBER">Num</option>
                            <option value="STRING">Txt</option>
                            <option value="BOOLEAN">Bool</option>
                        </select>
                        <button 
                        onClick={handleAddVariable}
                        className="p-1.5 bg-gray-700 hover:bg-pink-600 rounded-lg text-gray-300 hover:text-white transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
              </div>
          )}

          {tab === 'POINTS' && (
              <div className="space-y-4">
                  <div className="bg-red-900/10 border border-red-900/30 p-3 rounded-lg text-xs text-red-200">
                      <p className="mb-2">Define puntos clave como la <strong>punta del arma</strong> o el <strong>centro de ojos</strong>. Haz clic en la imagen para añadir.</p>
                  </div>

                  <div className="flex justify-center">
                        <div 
                            ref={previewRef}
                            onClick={handlePreviewClick}
                            className="relative w-48 h-48 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg cursor-crosshair overflow-hidden group"
                        >
                             <div className="absolute inset-0 opacity-20 pointer-events-none" style={{backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)', backgroundSize: '10px 10px'}}></div>
                             
                             <div 
                                className="absolute inset-0 z-0 pointer-events-none"
                                style={{
                                    backgroundColor: data.previewSpriteUrl ? 'transparent' : data.color,
                                    backgroundImage: data.previewSpriteUrl ? `url(${data.previewSpriteUrl})` : undefined,
                                    backgroundSize: '100% 100%',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'center',
                                    imageRendering: 'pixelated',
                                }}
                             ></div>

                             {/* Render Existing Points */}
                             {(data.points || []).map(p => (
                                 <div 
                                    key={p.id}
                                    className="absolute w-4 h-4 -ml-2 -mt-2 flex items-center justify-center z-10 pointer-events-none"
                                    style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}
                                 >
                                     <Crosshair className="w-full h-full text-red-500 drop-shadow-md" />
                                     <span className="absolute top-4 bg-black/70 text-[9px] text-white px-1 rounded whitespace-nowrap">{p.name}</span>
                                 </div>
                             ))}
                        </div>
                  </div>

                  <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">Nombre:</span>
                        <input 
                            type="text" 
                            value={newPointName}
                            onChange={(e) => setNewPointName(e.target.value)}
                            className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white"
                        />
                  </div>

                  {/* Points List */}
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                      {(data.points || []).map(p => (
                          <div key={p.id} className="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-700">
                              <span className="text-xs text-gray-300 font-bold">{p.name}</span>
                              <div className="flex items-center space-x-2">
                                  <span className="text-[9px] text-gray-500 font-mono">({Math.round(p.x*100)}%, {Math.round(p.y*100)}%)</span>
                                  <button onClick={() => handleDeletePoint(p.id)} className="text-gray-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-800 bg-gray-800/30 flex space-x-3 flex-shrink-0">
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
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>
    </div>
  );
};
