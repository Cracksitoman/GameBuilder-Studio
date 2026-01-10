import React, { useState, useRef } from 'react';
import { ObjectType, GameObject } from '../types';
import { Plus, Box, Type, User, Ghost, Trash2, X, Grid, Folder, FolderPlus, FolderOpen, ChevronRight, ChevronDown, MoreHorizontal, Hand, MonitorSmartphone } from './Icons';

interface ObjectLibraryProps {
  objects: GameObject[];
  selectedObjectId: string | null;
  onAddObject: (type: ObjectType) => void;
  onSelectObject: (id: string) => void;
  onDeleteObject: (id: string) => void;
  
  // Grouping Props
  groups?: string[];
  onAddGroup: (name: string) => void;
  onDeleteGroup: (name: string) => void;
  onAssignToGroup: (objectId: string, groupName: string) => void;

  // New Global Drag Handler
  onStartDrag: (e: React.PointerEvent, obj: GameObject) => void;
  onDoubleClickObject?: (id: string) => void;

  onClose?: () => void;
  className?: string;
}

export const ObjectLibrary: React.FC<ObjectLibraryProps> = ({
  objects,
  selectedObjectId,
  onAddObject,
  onSelectObject,
  onDeleteObject,
  groups = [],
  onAddGroup,
  onDeleteGroup,
  onAssignToGroup,
  onStartDrag,
  onDoubleClickObject,
  onClose,
  className = ""
}) => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ 'Sin Agrupar': true });
  const [showGroupMenu, setShowGroupMenu] = useState<string | null>(null); // For creating new group
  const [newGroupName, setNewGroupName] = useState('');
  const [objectMenuId, setObjectMenuId] = useState<string | null>(null); // For moving objects
  
  // Long Press & Double Tap State
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPos = useRef<{x: number, y: number} | null>(null);
  const [pressingId, setPressingId] = useState<string | null>(null); 
  const lastTapRef = useRef<{ id: string | null, time: number }>({ id: null, time: 0 });

  const getIcon = (type: ObjectType) => {
    switch (type) {
      case ObjectType.TEXT: return <Type className="w-3.5 h-3.5 text-yellow-400" />;
      case ObjectType.PLAYER: return <User className="w-3.5 h-3.5 text-green-400" />;
      case ObjectType.ENEMY: return <Ghost className="w-3.5 h-3.5 text-red-400" />;
      case ObjectType.TILEMAP: return <Grid className="w-3.5 h-3.5 text-cyan-400" />;
      case ObjectType.UI_BUTTON: return <MonitorSmartphone className="w-3.5 h-3.5 text-orange-400" />;
      default: return <Box className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const toggleGroup = (group: string) => {
      setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const handleAddGroupSubmit = () => {
      if (newGroupName.trim()) {
          onAddGroup(newGroupName.trim());
          setOpenGroups(prev => ({ ...prev, [newGroupName.trim()]: true }));
          setNewGroupName('');
          setShowGroupMenu(null);
      }
  };

  const handlePointerDown = (e: React.PointerEvent, obj: GameObject) => {
      if (objectMenuId === obj.id) return;
      
      startPos.current = { x: e.clientX, y: e.clientY };
      setPressingId(obj.id);

      pressTimer.current = setTimeout(() => {
          setPressingId(null); 
          onStartDrag(e, obj); 
          startPos.current = null; 
      }, 300); 
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (startPos.current) {
          const dx = Math.abs(e.clientX - startPos.current.x);
          const dy = Math.abs(e.clientY - startPos.current.y);
          if (dx > 10 || dy > 10) {
              if (pressTimer.current) clearTimeout(pressTimer.current);
              setPressingId(null);
              startPos.current = null;
          }
      }
  };

  const handlePointerUp = (objId: string) => {
      if (pressTimer.current) {
          clearTimeout(pressTimer.current); 
          
          const now = Date.now();
          if (lastTapRef.current.id === objId && (now - lastTapRef.current.time) < 300) {
              // Double Tap Detected
              onDoubleClickObject?.(objId);
              lastTapRef.current = { id: null, time: 0 };
          } else {
              onSelectObject(objId); 
              lastTapRef.current = { id: objId, time: now };
          }
      }
      setPressingId(null);
      startPos.current = null;
  };

  const groupedObjects: Record<string, GameObject[]> = { 'Sin Agrupar': [] };
  groups.forEach(g => groupedObjects[g] = []);
  
  objects.forEach(obj => {
      const g = obj.group || 'Sin Agrupar';
      if (!groupedObjects[g]) groupedObjects[g] = [];
      groupedObjects[g].push(obj);
  });

  return (
    <div className={`bg-gray-900 flex flex-col h-full border-t border-gray-700 shadow-2xl ${className}`} onClick={() => setObjectMenuId(null)}>
      {/* Header Compacto */}
      <div className="p-2 border-b border-gray-700 flex items-center justify-between bg-gray-800 shrink-0">
        <h2 className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Librería</h2>
        <div className="flex items-center space-x-0.5">
            <button onClick={() => setShowGroupMenu('new')} className="p-1 text-gray-500 hover:text-yellow-400 bg-gray-700 hover:bg-gray-600 rounded" title="Nueva Carpeta">
                <FolderPlus className="w-3.5 h-3.5" />
            </button>
            {onClose && (
            <button onClick={onClose} className="p-1 text-gray-500 hover:text-white bg-gray-700 rounded-full">
                <X className="w-3.5 h-3.5" />
            </button>
            )}
        </div>
      </div>

      {showGroupMenu === 'new' && (
          <div className="p-1.5 bg-gray-800 border-b border-gray-700 flex space-x-1 shrink-0">
              <input 
                autoFocus
                type="text" 
                value={newGroupName} 
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="Nombre"
                className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-[10px] text-white"
                onKeyDown={e => e.key === 'Enter' && handleAddGroupSubmit()}
              />
              <button onClick={handleAddGroupSubmit} className="text-green-500 p-1"><Plus className="w-3.5 h-3.5"/></button>
              <button onClick={() => setShowGroupMenu(null)} className="text-gray-500 p-1"><X className="w-3.5 h-3.5"/></button>
          </div>
      )}

      {/* Grid de creación Mini */}
      <div className="p-2 grid grid-cols-3 gap-1 bg-gray-900 border-b border-gray-800 shrink-0">
          <button onClick={() => onAddObject(ObjectType.SPRITE)} className="flex flex-col items-center justify-center p-1 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition-all">
            <Box className="w-4 h-4 text-blue-400 mb-0.5" /><span className="text-[8px] text-gray-500 font-bold">Bloque</span>
          </button>
          <button onClick={() => onAddObject(ObjectType.PLAYER)} className="flex flex-col items-center justify-center p-1 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition-all">
            <User className="w-4 h-4 text-green-400 mb-0.5" /><span className="text-[8px] text-gray-500 font-bold">Player</span>
          </button>
          <button onClick={() => onAddObject(ObjectType.TILEMAP)} className="flex flex-col items-center justify-center p-1 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition-all">
            <Grid className="w-4 h-4 text-cyan-400 mb-0.5" /><span className="text-[8px] text-gray-500 font-bold">Tiles</span>
          </button>
          <button onClick={() => onAddObject(ObjectType.ENEMY)} className="flex flex-col items-center justify-center p-1 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition-all">
            <Ghost className="w-4 h-4 text-red-400 mb-0.5" /><span className="text-[8px] text-gray-500 font-bold">Enemy</span>
          </button>
          <button onClick={() => onAddObject(ObjectType.UI_BUTTON)} className="flex flex-col items-center justify-center p-1 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition-all">
            <MonitorSmartphone className="w-4 h-4 text-orange-400 mb-0.5" /><span className="text-[8px] text-gray-500 font-bold">Botón</span>
          </button>
          <button onClick={() => onAddObject(ObjectType.TEXT)} className="flex flex-col items-center justify-center p-1 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 transition-all">
            <Type className="w-4 h-4 text-yellow-400 mb-0.5" /><span className="text-[8px] text-gray-500 font-bold">Texto</span>
          </button>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-gray-900 pb-20 touch-pan-y custom-scrollbar">
        {Object.entries(groupedObjects).map(([groupName, groupObjects]) => {
            const isOpen = openGroups[groupName] ?? false; 
            
            if (groupName !== 'Sin Agrupar' && !groups.includes(groupName) && groupObjects.length === 0) return null;
            if (groupName === 'Sin Agrupar' && groupObjects.length === 0 && groups.length > 0) return null;

            return (
                <div key={groupName} className="border-b border-gray-800">
                    <div 
                        className="flex items-center justify-between p-1.5 bg-gray-850 hover:bg-gray-800 cursor-pointer group"
                        onClick={() => toggleGroup(groupName)}
                    >
                        <div className="flex items-center space-x-1.5">
                            {isOpen ? <ChevronDown className="w-3 h-3 text-gray-600" /> : <ChevronRight className="w-3 h-3 text-gray-600" />}
                            <span className="text-[10px] font-bold text-gray-400 select-none uppercase truncate">{groupName}</span>
                            <span className="text-[8px] text-gray-600 bg-gray-800 px-1 rounded">{groupObjects.length}</span>
                        </div>
                    </div>

                    {isOpen && (
                        <div className="bg-gray-900/50">
                            {groupObjects.map((obj) => (
                                <div
                                    key={obj.id}
                                    onPointerDown={(e) => handlePointerDown(e, obj)}
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={() => handlePointerUp(obj.id)}
                                    className={`relative flex items-center justify-between p-1.5 pl-5 cursor-pointer border-l-2 group/item touch-none select-none transition-colors duration-200 ${
                                        pressingId === obj.id ? 'bg-orange-900/20' : ''
                                    } ${
                                        selectedObjectId === obj.id
                                            ? 'bg-blue-900/10 border-blue-500 text-white'
                                            : 'bg-transparent border-transparent hover:bg-gray-800 text-gray-400'
                                    }`}
                                >
                                    <div className="flex items-center space-x-2 truncate pointer-events-none">
                                        {getIcon(obj.type)}
                                        <span className="text-[11px] truncate font-medium">{obj.name}</span>
                                    </div>
                                    
                                    <div className="flex items-center">
                                        <button
                                            onPointerDown={(e) => {
                                                e.stopPropagation();
                                                setObjectMenuId(objectMenuId === obj.id ? null : obj.id);
                                            }}
                                            className="p-1 rounded hover:bg-gray-700 text-gray-600 hover:text-white"
                                        >
                                            <MoreHorizontal className="w-3 h-3" />
                                        </button>
                                    </div>

                                    {objectMenuId === obj.id && (
                                        <div className="absolute right-6 top-6 w-32 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 overflow-hidden" onPointerDown={e => e.stopPropagation()}>
                                            <button onClick={(e) => { e.stopPropagation(); onAssignToGroup(obj.id, 'Sin Agrupar'); setObjectMenuId(null); }} className="w-full text-left px-3 py-2 text-[10px] text-gray-300 hover:bg-gray-700 flex items-center">Raíz</button>
                                            <button onClick={(e) => { e.stopPropagation(); if (confirm("¿Borrar?")) onDeleteObject(obj.id); }} className="w-full text-left px-3 py-2 text-[10px] text-red-400 hover:bg-red-900/20 flex items-center border-t border-gray-700">Eliminar</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
};