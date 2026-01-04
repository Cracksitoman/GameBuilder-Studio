
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
  onClose,
  className = ""
}) => {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ 'Sin Agrupar': true });
  const [showGroupMenu, setShowGroupMenu] = useState<string | null>(null); // For creating new group
  const [newGroupName, setNewGroupName] = useState('');
  const [objectMenuId, setObjectMenuId] = useState<string | null>(null); // For moving objects
  
  // Long Press State
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPos = useRef<{x: number, y: number} | null>(null);
  const [pressingId, setPressingId] = useState<string | null>(null); // For visual feedback

  const getIcon = (type: ObjectType) => {
    switch (type) {
      case ObjectType.TEXT: return <Type className="w-4 h-4 text-yellow-400" />;
      case ObjectType.PLAYER: return <User className="w-4 h-4 text-green-400" />;
      case ObjectType.ENEMY: return <Ghost className="w-4 h-4 text-red-400" />;
      case ObjectType.TILEMAP: return <Grid className="w-4 h-4 text-cyan-400" />;
      case ObjectType.UI_BUTTON: return <MonitorSmartphone className="w-4 h-4 text-orange-400" />;
      default: return <Box className="w-4 h-4 text-blue-400" />;
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

  // --- LONG PRESS LOGIC ---
  const handlePointerDown = (e: React.PointerEvent, obj: GameObject) => {
      // Ignore if clicking context menu
      if (objectMenuId === obj.id) return;
      
      startPos.current = { x: e.clientX, y: e.clientY };
      setPressingId(obj.id);

      pressTimer.current = setTimeout(() => {
          // If executed, it means long press occurred
          setPressingId(null); // Clear pressing visual
          onStartDrag(e, obj); // Trigger Drag
          startPos.current = null; 
      }, 300); // 300ms threshold for long press
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      if (startPos.current) {
          const dx = Math.abs(e.clientX - startPos.current.x);
          const dy = Math.abs(e.clientY - startPos.current.y);
          // If moved more than 10 pixels, cancel long press (it's a scroll)
          if (dx > 10 || dy > 10) {
              if (pressTimer.current) clearTimeout(pressTimer.current);
              setPressingId(null);
              startPos.current = null;
          }
      }
  };

  const handlePointerUp = (objId: string) => {
      if (pressTimer.current) {
          clearTimeout(pressTimer.current); // Cancel drag start
          // It was a click!
          onSelectObject(objId); 
      }
      setPressingId(null);
      startPos.current = null;
  };

  // Organize objects by group
  const groupedObjects: Record<string, GameObject[]> = { 'Sin Agrupar': [] };
  groups.forEach(g => groupedObjects[g] = []);
  
  objects.forEach(obj => {
      const g = obj.group || 'Sin Agrupar';
      if (!groupedObjects[g]) groupedObjects[g] = [];
      groupedObjects[g].push(obj);
  });

  return (
    <div className={`bg-gray-900 flex flex-col h-full border-t border-gray-700 shadow-2xl ${className}`} onClick={() => setObjectMenuId(null)}>
      {/* Header */}
      <div className="p-3 border-b border-gray-700 flex items-center justify-between bg-gray-800">
        <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Librería</h2>
        <div className="flex items-center space-x-1">
            <button onClick={() => setShowGroupMenu('new')} className="p-1 text-gray-400 hover:text-yellow-400 bg-gray-700 hover:bg-gray-600 rounded" title="Nueva Carpeta">
                <FolderPlus className="w-4 h-4" />
            </button>
            {onClose && (
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-white bg-gray-700 rounded-full">
                <X className="w-4 h-4" />
            </button>
            )}
        </div>
      </div>

      {/* New Group Input */}
      {showGroupMenu === 'new' && (
          <div className="p-2 bg-gray-800 border-b border-gray-700 flex space-x-2">
              <input 
                autoFocus
                type="text" 
                value={newGroupName} 
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="Nombre Carpeta"
                className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                onKeyDown={e => e.key === 'Enter' && handleAddGroupSubmit()}
              />
              <button onClick={handleAddGroupSubmit} className="text-green-400 hover:text-white"><Plus className="w-4 h-4"/></button>
              <button onClick={() => setShowGroupMenu(null)} className="text-gray-500 hover:text-white"><X className="w-4 h-4"/></button>
          </div>
      )}

      {/* Grid of Add Buttons */}
      <div className="p-3 grid grid-cols-3 gap-2 bg-gray-900 border-b border-gray-800">
          <button onClick={() => onAddObject(ObjectType.SPRITE)} className="flex flex-col items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 active:border-blue-500 transition-all group">
            <Box className="w-5 h-5 text-blue-400 mb-1" /><span className="text-[9px] text-gray-400">Bloque</span>
          </button>
          <button onClick={() => onAddObject(ObjectType.PLAYER)} className="flex flex-col items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 active:border-green-500 transition-all group">
            <User className="w-5 h-5 text-green-400 mb-1" /><span className="text-[9px] text-gray-400">Jugador</span>
          </button>
          <button onClick={() => onAddObject(ObjectType.TILEMAP)} className="flex flex-col items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 active:border-cyan-500 transition-all group">
            <Grid className="w-5 h-5 text-cyan-400 mb-1" /><span className="text-[9px] text-gray-400">Mapa Tiles</span>
          </button>
          <button onClick={() => onAddObject(ObjectType.ENEMY)} className="flex flex-col items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 active:border-red-500 transition-all group">
            <Ghost className="w-5 h-5 text-red-400 mb-1" /><span className="text-[9px] text-gray-400">Enemigo</span>
          </button>
          <button onClick={() => onAddObject(ObjectType.UI_BUTTON)} className="flex flex-col items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 active:border-orange-500 transition-all group">
            <MonitorSmartphone className="w-5 h-5 text-orange-400 mb-1" /><span className="text-[9px] text-gray-400">Botón UI</span>
          </button>
          <button onClick={() => onAddObject(ObjectType.TEXT)} className="flex flex-col items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 active:border-yellow-500 transition-all group">
            <Type className="w-5 h-5 text-yellow-400 mb-1" /><span className="text-[9px] text-gray-400">Texto</span>
          </button>
      </div>
      
      {/* Object List with Folders */}
      <div className="flex-1 overflow-y-auto bg-gray-900 pb-20 touch-pan-y">
        {objects.length > 0 && (
            <div className="px-3 py-2 text-[10px] text-gray-500 flex items-center justify-center border-b border-gray-800 bg-gray-900/50">
                <Hand className="w-3 h-3 mr-1" /> Mantén pulsado para arrastrar a escena
            </div>
        )}

        {Object.entries(groupedObjects).map(([groupName, groupObjects]) => {
            const isOpen = openGroups[groupName] ?? false; // Default closed except unassigned
            
            // Don't show empty groups unless they are in the groups array (except "Sin Agrupar" which always shows if not empty)
            if (groupName !== 'Sin Agrupar' && !groups.includes(groupName) && groupObjects.length === 0) return null;
            if (groupName === 'Sin Agrupar' && groupObjects.length === 0 && groups.length > 0) return null;

            return (
                <div key={groupName} className="border-b border-gray-800">
                    {/* Folder Header */}
                    <div 
                        className="flex items-center justify-between p-2 bg-gray-850 hover:bg-gray-800 cursor-pointer group"
                        onClick={() => toggleGroup(groupName)}
                    >
                        <div className="flex items-center space-x-2">
                            {isOpen ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
                            {isOpen ? <FolderOpen className="w-4 h-4 text-yellow-500" /> : <Folder className="w-4 h-4 text-yellow-600" />}
                            <span className="text-xs font-bold text-gray-300 select-none">{groupName}</span>
                            <span className="text-[9px] text-gray-600 bg-gray-800 px-1 rounded">{groupObjects.length}</span>
                        </div>
                        {groupName !== 'Sin Agrupar' && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); if(confirm(`¿Eliminar carpeta "${groupName}"?`)) onDeleteGroup(groupName); }}
                                className="p-1 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {/* Folder Content */}
                    {isOpen && (
                        <div className="bg-gray-900/50 space-y-0.5">
                            {groupObjects.map((obj) => (
                                <div
                                    key={obj.id}
                                    onPointerDown={(e) => handlePointerDown(e, obj)}
                                    onPointerMove={handlePointerMove}
                                    onPointerUp={() => handlePointerUp(obj.id)}
                                    className={`relative flex items-center justify-between p-2 pl-8 cursor-pointer border-l-2 group/item touch-none select-none transition-colors duration-200 ${
                                        pressingId === obj.id ? 'bg-orange-900/20 scale-[0.98]' : ''
                                    } ${
                                        selectedObjectId === obj.id
                                            ? 'bg-blue-900/20 border-blue-500 text-white'
                                            : 'bg-transparent border-transparent hover:bg-gray-800 text-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3 truncate pointer-events-none">
                                        {getIcon(obj.type)}
                                        <span className="text-xs truncate">{obj.name}</span>
                                    </div>
                                    
                                    <div className="flex items-center">
                                        <button
                                            onPointerDown={(e) => {
                                                e.stopPropagation();
                                                setObjectMenuId(objectMenuId === obj.id ? null : obj.id);
                                            }}
                                            className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-white mr-1"
                                        >
                                            <MoreHorizontal className="w-3 h-3" />
                                        </button>
                                        <button
                                            onPointerDown={(e) => { 
                                                e.stopPropagation(); 
                                                if (confirm("¿Borrar este objeto de la librería?")) onDeleteObject(obj.id); 
                                            }}
                                            className="p-1 rounded hover:bg-red-900/50 text-gray-500 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>

                                    {/* Visual Feedback for Long Press */}
                                    {pressingId === obj.id && (
                                        <div className="absolute inset-0 border border-orange-500/50 pointer-events-none rounded animate-pulse" />
                                    )}

                                    {/* Context Menu for Moving Object */}
                                    {objectMenuId === obj.id && (
                                        <div className="absolute right-8 top-6 w-40 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 overflow-hidden" onPointerDown={e => e.stopPropagation()}>
                                            <div className="text-[9px] text-gray-500 uppercase font-bold p-2 bg-gray-900 border-b border-gray-700">Mover a...</div>
                                            {groupName !== 'Sin Agrupar' && (
                                                <button onClick={(e) => { e.stopPropagation(); onAssignToGroup(obj.id, 'Sin Agrupar'); setObjectMenuId(null); }} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 flex items-center">
                                                    <Box className="w-3 h-3 mr-2" /> Raíz
                                                </button>
                                            )}
                                            {groups.filter(g => g !== groupName).map(g => (
                                                <button 
                                                    key={g}
                                                    onClick={(e) => { e.stopPropagation(); onAssignToGroup(obj.id, g); setObjectMenuId(null); }} 
                                                    className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 flex items-center"
                                                >
                                                    <Folder className="w-3 h-3 mr-2 text-yellow-500" /> {g}
                                                </button>
                                            ))}
                                            {groups.length === 0 && groupName === 'Sin Agrupar' && (
                                                <div className="p-2 text-[10px] text-gray-500 italic">Crea carpetas primero</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {groupObjects.length === 0 && (
                                <div className="pl-8 py-2 text-[10px] text-gray-600 italic">Carpeta vacía</div>
                            )}
                        </div>
                    )}
                </div>
            );
        })}

        {objects.length === 0 && (
          <div className="text-center p-8 text-gray-600 text-sm">
            Crea un objeto para empezar.<br/>Luego mantén pulsado para arrastrar al escenario.
          </div>
        )}
      </div>
    </div>
  );
};
