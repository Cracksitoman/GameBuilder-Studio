import React, { useState } from 'react';
import { GameEvent, GameObject, ConditionType, ActionType, EventCondition, EventAction, ObjectType, Scene } from '../types';
import { Plus, Trash2, ArrowRight, X, Workflow, Box, User, Ghost, Type, MousePointer2, Menu, ChevronLeft, Edit } from './Icons';
import { EventActionModal } from './EventActionModal';

interface EventSheetProps {
  objects: GameObject[];
  onUpdateObject: (id: string, updates: Partial<GameObject>) => void;
  scenes?: Scene[]; // Optional, might be passed from App but not strictly needed for this file's internal logic unless we pass it to Modal
}

// NOTE: App.tsx doesn't pass scenes to EventSheet yet in the previous refactor step. 
// We need to update App.tsx to pass 'scenes' to EventSheet, OR we access scenes via a context or similar.
// For now, let's update EventSheet to accept scenes prop, and assume App passes it (I will update App.tsx content block above or rely on React state flow).
// Wait, I already updated App.tsx but didn't pass 'scenes' to EventSheet in the XML above.
// Actually, since I can't edit the previous XML block once generated, I will fix it here by making scenes optional
// and providing a mechanism. *Correction*: I will just use the objects for now.
// For CHANGE_SCENE to work, EventActionModal needs the list of scenes.
// Since EventSheet is a child of App, I can assume I will update App.tsx to pass scenes.

export const EventSheet: React.FC<EventSheetProps & { scenes?: Scene[] }> = ({ objects, onUpdateObject, scenes = [] }) => {
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CONDITION' | 'ACTION'>('CONDITION');
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  // For editing
  const [editingItemId, setEditingItemId] = useState<string | null>(null); // Condition or Action ID
  const [editingItemType, setEditingItemType] = useState<string | null>(null);
  const [editingItemParams, setEditingItemParams] = useState<Record<string, any>>({});

  const selectedObject = objects.find(o => o.id === selectedObjectId);

  // --- HELPERS ---

  const handleAddEvent = () => {
      if (!selectedObject) return;
      const newEvent: GameEvent = {
          id: crypto.randomUUID(),
          conditions: [],
          actions: []
      };
      onUpdateObject(selectedObject.id, { events: [...(selectedObject.events || []), newEvent] });
  };

  const handleRemoveEvent = (eventId: string) => {
      if (!selectedObject) return;
      onUpdateObject(selectedObject.id, { events: selectedObject.events.filter(e => e.id !== eventId) });
  };

  const updateEvent = (eventId: string, updates: Partial<GameEvent>) => {
      if (!selectedObject) return;
      const newEvents = selectedObject.events.map(e => e.id === eventId ? { ...e, ...updates } : e);
      onUpdateObject(selectedObject.id, { events: newEvents });
  };

  // --- MODAL TRIGGERS ---

  const openAddCondition = (eventId: string) => {
      setActiveEventId(eventId);
      setEditingItemId(null); // Adding new
      setEditingItemType(null);
      setEditingItemParams({});
      setModalMode('CONDITION');
      setModalOpen(true);
  };

  const openAddAction = (eventId: string) => {
      setActiveEventId(eventId);
      setEditingItemId(null); // Adding new
      setEditingItemType(null);
      setEditingItemParams({});
      setModalMode('ACTION');
      setModalOpen(true);
  };

  const openEditCondition = (eventId: string, condition: EventCondition) => {
      setActiveEventId(eventId);
      setEditingItemId(condition.id);
      setEditingItemType(condition.type);
      setEditingItemParams(condition.parameters);
      setModalMode('CONDITION');
      setModalOpen(true);
  };

  const openEditAction = (eventId: string, action: EventAction) => {
      setActiveEventId(eventId);
      setEditingItemId(action.id);
      setEditingItemType(action.type);
      setEditingItemParams(action.parameters);
      setModalMode('ACTION');
      setModalOpen(true);
  };

  // --- MODAL SAVE HANDLER ---

  const handleModalSave = (type: string, params: Record<string, any>) => {
      if (!selectedObject || !activeEventId) return;

      const event = selectedObject.events.find(e => e.id === activeEventId);
      if (!event) return;

      if (modalMode === 'CONDITION') {
          if (editingItemId) {
              // Edit existing
              const newConditions = event.conditions.map(c => 
                  c.id === editingItemId ? { ...c, type: type as ConditionType, parameters: params } : c
              );
              updateEvent(activeEventId, { conditions: newConditions });
          } else {
              // Add new
              const newCond: EventCondition = {
                  id: crypto.randomUUID(),
                  type: type as ConditionType,
                  parameters: params
              };
              updateEvent(activeEventId, { conditions: [...event.conditions, newCond] });
          }
      } else {
          // ACTION
           if (editingItemId) {
              // Edit existing
              const newActions = event.actions.map(a => 
                  a.id === editingItemId ? { ...a, type: type as ActionType, parameters: params } : a
              );
              updateEvent(activeEventId, { actions: newActions });
          } else {
              // Add new
              const newAction: EventAction = {
                  id: crypto.randomUUID(),
                  type: type as ActionType,
                  parameters: params
              };
              updateEvent(activeEventId, { actions: [...event.actions, newAction] });
          }
      }
  };

  const removeCondition = (eventId: string, condId: string) => {
      if (!selectedObject) return;
      const event = selectedObject.events.find(e => e.id === eventId);
      if (event) {
          updateEvent(eventId, { conditions: event.conditions.filter(c => c.id !== condId) });
      }
  };

  const removeAction = (eventId: string, actId: string) => {
      if (!selectedObject) return;
      const event = selectedObject.events.find(e => e.id === eventId);
      if (event) {
          updateEvent(eventId, { actions: event.actions.filter(a => a.id !== actId) });
      }
  };

  // --- RENDER HELPERS ---
  const getIcon = (type: ObjectType) => {
    switch (type) {
      case ObjectType.TEXT: return <Type className="w-4 h-4 text-yellow-400" />;
      case ObjectType.PLAYER: return <User className="w-4 h-4 text-green-400" />;
      case ObjectType.ENEMY: return <Ghost className="w-4 h-4 text-red-400" />;
      default: return <Box className="w-4 h-4 text-blue-400" />;
    }
  };

  const getTargetName = (id: string) => {
      if (!id) return '???';
      if (id === 'SELF') return 'Este Objeto';
      if (id === 'OTHER') return 'El Otro Objeto';
      const obj = objects.find(o => o.id === id);
      return obj ? obj.name : 'Desconocido';
  };

  return (
    <div className="w-full h-full bg-gray-950 flex text-white animate-in fade-in overflow-hidden">
      
      {/* 1. SIDEBAR: Object Selector */}
      <div 
        className={`bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 ease-in-out relative ${isSidebarOpen ? 'w-64' : 'w-0 opacity-0 overflow-hidden'}`}
      >
          <div className="p-4 border-b border-gray-800 flex justify-between items-center whitespace-nowrap">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center">
                  <Workflow className="w-4 h-4 mr-2" />
                  Editor de Lógica
              </h2>
              <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-white">
                  <ChevronLeft className="w-4 h-4" />
              </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {objects.length === 0 && (
                  <div className="text-center p-4 text-gray-600 text-xs">Crea objetos primero.</div>
              )}
              {objects.map(obj => (
                  <button
                    key={obj.id}
                    onClick={() => setSelectedObjectId(obj.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                        selectedObjectId === obj.id 
                        ? 'bg-blue-900/30 border-blue-500/50 text-white' 
                        : 'bg-gray-800/50 border-transparent hover:bg-gray-800 text-gray-400'
                    }`}
                  >
                      <div className="flex items-center space-x-3 overflow-hidden">
                          {getIcon(obj.type)}
                          <span className="font-medium text-sm truncate">{obj.name}</span>
                      </div>
                      {(obj.events && obj.events.length > 0) && (
                          <span className="bg-purple-600 text-white text-[9px] px-1.5 rounded-full font-bold flex-shrink-0">
                              {obj.events.length}
                          </span>
                      )}
                  </button>
              ))}
          </div>
      </div>

      {/* 2. MAIN AREA: Event Editor */}
      <div className="flex-1 flex flex-col bg-gray-950/50 relative">
          
          {selectedObject ? (
              <>
                {/* Editor Header */}
                <div className="h-14 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50">
                    <div className="flex items-center space-x-4">
                        {!isSidebarOpen && (
                            <button 
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors border border-gray-700"
                            >
                                <Menu className="w-4 h-4" />
                            </button>
                        )}

                        <div className="flex items-center space-x-2">
                            <span className="text-gray-400 text-sm hidden sm:inline">Eventos de:</span>
                            <div className="bg-gray-800 px-3 py-1 rounded-lg border border-gray-700 font-bold flex items-center space-x-2">
                                {getIcon(selectedObject.type)}
                                <span>{selectedObject.name}</span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={handleAddEvent}
                        className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-purple-900/20 transition-transform active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Nuevo Evento</span>
                    </button>
                </div>

                {/* Event List */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                    
                    {(!selectedObject.events || selectedObject.events.length === 0) && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                            <Workflow className="w-16 h-16 mb-4" />
                            <p>Este objeto no tiene lógica.</p>
                            <p className="text-sm">Añade un evento para empezar.</p>
                        </div>
                    )}

                    {(selectedObject.events || []).map((event, index) => (
                        <div key={event.id} className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-sm hover:border-gray-600 transition-colors flex flex-col sm:flex-row">
                            
                            {/* Number & Delete */}
                            <div className="bg-gray-800 flex flex-row sm:flex-col items-center justify-between sm:justify-start p-2 sm:py-4 sm:w-10 border-b sm:border-b-0 sm:border-r border-gray-700 sm:space-y-4">
                                <span className="font-mono text-xs text-gray-500 ml-2 sm:ml-0">#{index + 1}</span>
                                <button onClick={() => handleRemoveEvent(event.id)} className="text-gray-600 hover:text-red-400 mr-2 sm:mr-0">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-800">
                                
                                {/* CONDITIONS AREA */}
                                <div className="flex-1 p-4 bg-gray-900/50 relative group/col min-h-[100px]">
                                    <div className="text-[10px] font-bold text-green-500 uppercase mb-3 tracking-widest flex items-center">
                                        CUANDO...
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {event.conditions.map(cond => (
                                            <div 
                                              key={cond.id} 
                                              onClick={() => openEditCondition(event.id, cond)}
                                              className="flex items-center justify-between bg-gray-800 border-l-4 border-green-500 rounded p-3 text-sm relative group/item hover:bg-gray-750 cursor-pointer transition-colors"
                                            >
                                                <div className="flex-1">
                                                    {cond.type === 'START_OF_SCENE' && <span className="font-bold text-gray-200">Inicio de Escena</span>}
                                                    {cond.type === 'COLLISION' && (
                                                        <span className="text-gray-300">
                                                            Choca con <b className="text-green-300">{getTargetName(cond.parameters.targetId)}</b>
                                                        </span>
                                                    )}
                                                    {cond.type === 'KEY_PRESSED' && (
                                                        <span className="text-gray-300">
                                                            Tecla <b className="text-green-300">{cond.parameters.key}</b> presionada
                                                        </span>
                                                    )}
                                                    {cond.type === 'COMPARE_VARIABLE' && (
                                                        <span className="text-gray-300">
                                                            Var <b className="text-pink-300">{cond.parameters.varId}</b> ({cond.parameters.source}) {cond.parameters.operator} <b>{cond.parameters.value}</b>
                                                        </span>
                                                    )}
                                                </div>

                                                <button onClick={(e) => { e.stopPropagation(); removeCondition(event.id, cond.id); }} className="opacity-0 group-hover/item:opacity-100 text-gray-500 hover:text-red-400">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}

                                        <button 
                                          onClick={() => openAddCondition(event.id)}
                                          className="text-[10px] w-full py-2 border border-dashed border-gray-700 hover:border-green-500 hover:bg-green-900/10 text-gray-500 hover:text-green-400 rounded flex items-center justify-center transition-all"
                                        >
                                            <Plus className="w-3 h-3 mr-1" /> Añadir Condición
                                        </button>
                                    </div>
                                </div>

                                {/* ARROW */}
                                <div className="hidden lg:flex bg-gray-900 items-center justify-center p-2">
                                     <ArrowRight className="w-4 h-4 text-gray-700" />
                                </div>

                                {/* ACTIONS AREA */}
                                <div className="flex-1 p-4 bg-gray-900/30 relative min-h-[100px]">
                                    <div className="text-[10px] font-bold text-blue-500 uppercase mb-3 tracking-widest flex items-center">
                                        HACER...
                                    </div>

                                    <div className="space-y-2">
                                        {event.actions.map(act => (
                                            <div 
                                              key={act.id} 
                                              onClick={() => openEditAction(event.id, act)}
                                              className="flex items-center justify-between bg-gray-800 border-l-4 border-blue-500 rounded p-3 text-sm relative group/item hover:bg-gray-750 cursor-pointer transition-colors"
                                            >
                                                <div className="flex-1">
                                                    {act.type === 'RESTART_SCENE' && <span className="font-bold text-red-300">Reiniciar Escena</span>}
                                                    {act.type === 'CHANGE_SCENE' && <span className="font-bold text-orange-300">Ir a Escena: {scenes.find(s=>s.id === act.parameters.sceneId)?.name || '...'}</span>}
                                                    {act.type === 'DESTROY' && (
                                                        <span className="text-gray-300">
                                                            Destruir: <b className="text-blue-300">{act.parameters.target === 'SELF' ? 'Este objeto' : 'El otro'}</b>
                                                        </span>
                                                    )}
                                                    {act.type === 'SET_VISIBLE' && (
                                                        <span className="text-gray-300">
                                                            Visibilidad: <b className="text-blue-300">{act.parameters.visible ? 'ON' : 'OFF'}</b>
                                                        </span>
                                                    )}
                                                    {act.type === 'MODIFY_VARIABLE' && (
                                                        <span className="text-gray-300">
                                                            {act.parameters.operation} Var <b className="text-pink-300">{act.parameters.varId}</b> ({act.parameters.source}) con <b>{act.parameters.value}</b>
                                                        </span>
                                                    )}
                                                </div>

                                                <button onClick={(e) => { e.stopPropagation(); removeAction(event.id, act.id); }} className="opacity-0 group-hover/item:opacity-100 text-gray-500 hover:text-red-400">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}

                                        <button 
                                          onClick={() => openAddAction(event.id)}
                                          className="text-[10px] w-full py-2 border border-dashed border-gray-700 hover:border-blue-500 hover:bg-blue-900/10 text-gray-500 hover:text-blue-400 rounded flex items-center justify-center transition-all"
                                        >
                                            <Plus className="w-3 h-3 mr-1" /> Añadir Acción
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    ))}
                </div>
              </>
          ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
                  <div className="relative">
                      {!isSidebarOpen && (
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 animate-bounce">
                                <span className="text-[10px] text-blue-400">¡Abre el menú para ver objetos!</span>
                                <ArrowRight className="w-4 h-4 text-blue-400 rotate-90 mx-auto mt-1" />
                          </div>
                      )}
                      <MousePointer2 className="w-12 h-12 mb-4 opacity-20 mx-auto" />
                  </div>
                  
                  {!isSidebarOpen ? (
                      <div>
                          <p className="text-lg font-bold mb-2">Menú Oculto</p>
                          <button onClick={() => setIsSidebarOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">
                             Mostrar Lista de Objetos
                          </button>
                      </div>
                  ) : (
                    <>
                        <p>Selecciona un objeto de la lista izquierda</p>
                        <p className="text-sm">para editar su lógica y eventos.</p>
                    </>
                  )}
              </div>
          )}

      </div>

      {/* MODAL */}
      <EventActionModal 
        isOpen={modalOpen}
        mode={modalMode}
        objects={objects}
        scenes={scenes} // PASSED scenes
        initialType={editingItemType}
        initialParams={editingItemParams}
        onClose={() => setModalOpen(false)}
        onSave={handleModalSave}
      />
    </div>
  );
};