import React, { useState } from 'react';
import { GameEvent, GameObject, ConditionType, ActionType, EventCondition, EventAction, ObjectType, Scene, Variable, Plugin, Asset } from '../types';
import { Plus, Trash2, ArrowRight, X, Workflow, Box, User, Ghost, Type, MousePointer2, Menu, ChevronLeft, Edit, Hand, Move, Timer, Ruler, Wind, Copy, MessageSquare, Vibrate, Navigation, Film, Settings } from './Icons';
import { EventActionModal } from './EventActionModal';

interface EventSheetProps {
  objects: GameObject[];
  onUpdateObject: (id: string, updates: Partial<GameObject>) => void;
  scenes?: Scene[]; 
  library?: GameObject[];
  globalVariables?: Variable[];
  plugins?: Plugin[]; 
  assets?: Asset[]; // Recibir assets
}

export const EventSheet: React.FC<EventSheetProps> = ({ objects, onUpdateObject, scenes = [], library = [], globalVariables = [], plugins = [], assets = [] }) => {
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CONDITION' | 'ACTION'>('CONDITION');
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  // For editing
  const [editingItemId, setEditingItemId] = useState<string | null>(null); 
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
      if (confirm("¿Eliminar bloque de eventos?")) {
          onUpdateObject(selectedObject.id, { events: selectedObject.events.filter(e => e.id !== eventId) });
      }
  };

  const updateEvent = (eventId: string, updates: Partial<GameEvent>) => {
      if (!selectedObject) return;
      const newEvents = selectedObject.events.map(e => e.id === eventId ? { ...e, ...updates } : e);
      onUpdateObject(selectedObject.id, { events: newEvents });
  };

  // --- MODAL TRIGGERS ---

  const openAddCondition = (eventId: string) => {
      setActiveEventId(eventId);
      setEditingItemId(null); 
      setEditingItemType(null);
      setEditingItemParams({});
      setModalMode('CONDITION');
      setModalOpen(true);
  };

  const openAddAction = (eventId: string) => {
      setActiveEventId(eventId);
      setEditingItemId(null); 
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
              const newConditions = event.conditions.map(c => 
                  c.id === editingItemId ? { ...c, type: type as ConditionType, parameters: params } : c
              );
              updateEvent(activeEventId, { conditions: newConditions });
          } else {
              const newCond: EventCondition = {
                  id: crypto.randomUUID(),
                  type: type as ConditionType,
                  parameters: params
              };
              updateEvent(activeEventId, { conditions: [...event.conditions, newCond] });
          }
      } else {
           if (editingItemId) {
              const newActions = event.actions.map(a => 
                  a.id === editingItemId ? { ...a, type: type as ActionType, parameters: params } : a
              );
              updateEvent(activeEventId, { actions: newActions });
          } else {
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
      if (confirm("¿Eliminar condición?")) {
          const event = selectedObject.events.find(e => e.id === eventId);
          if (event) {
              updateEvent(eventId, { conditions: event.conditions.filter(c => c.id !== condId) });
          }
      }
  };

  const removeAction = (eventId: string, actId: string) => {
      if (!selectedObject) return;
      if (confirm("¿Eliminar acción?")) {
          const event = selectedObject.events.find(e => e.id === eventId);
          if (event) {
              updateEvent(eventId, { actions: event.actions.filter(a => a.id !== actId) });
          }
      }
  };

  // --- RENDER HELPERS ---
  const getIcon = (type: ObjectType) => {
    switch (type) {
      case ObjectType.TEXT: return <Type className="w-3.5 h-3.5 text-yellow-400" />;
      case ObjectType.PLAYER: return <User className="w-3.5 h-3.5 text-green-400" />;
      case ObjectType.ENEMY: return <Ghost className="w-3.5 h-3.5 text-red-400" />;
      default: return <Box className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  return (
    <div className="w-full h-full bg-gray-950 flex text-white animate-in fade-in overflow-hidden">
      
      {/* 1. SIDEBAR Compacto */}
      <div 
        className={`bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 ease-in-out relative ${isSidebarOpen ? 'w-56' : 'w-0 opacity-0 overflow-hidden'}`}
      >
          <div className="p-3 border-b border-gray-800 flex justify-between items-center whitespace-nowrap bg-gray-950/20">
              <h2 className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center">
                  <Workflow className="w-3.5 h-3.5 mr-1.5" />
                  Logica
              </h2>
              <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-white">
                  <ChevronLeft className="w-4 h-4" />
              </button>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
              {objects.map(obj => (
                  <button
                    key={obj.id}
                    onClick={() => setSelectedObjectId(obj.id)}
                    className={`w-full flex items-center justify-between p-2 rounded border transition-all ${
                        selectedObjectId === obj.id 
                        ? 'bg-blue-900/20 border-blue-500/50 text-white' 
                        : 'bg-gray-800/30 border-transparent hover:bg-gray-800 text-gray-400'
                    }`}
                  >
                      <div className="flex items-center space-x-2 overflow-hidden">
                          {getIcon(obj.type)}
                          <span className="font-bold text-[11px] truncate">{obj.name}</span>
                      </div>
                  </button>
              ))}
          </div>
      </div>

      {/* 2. MAIN AREA Compacta */}
      <div className="flex-1 flex flex-col bg-gray-950/50 relative">
          
          {selectedObject ? (
              <>
                <div className="h-10 border-b border-gray-800 flex items-center justify-between px-3 bg-gray-900/50 shrink-0">
                    <div className="flex items-center space-x-2">
                        {!isSidebarOpen && (
                            <button onClick={() => setIsSidebarOpen(true)} className="p-1.5 bg-gray-800 rounded border border-gray-700">
                                <Menu className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <div className="bg-gray-800 px-2 py-0.5 rounded border border-gray-700 font-black text-[10px] flex items-center space-x-1.5 uppercase">
                            {getIcon(selectedObject.type)}
                            <span>{selectedObject.name}</span>
                        </div>
                    </div>
                    <button onClick={handleAddEvent} className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-500 px-2 py-1 rounded text-[10px] font-black uppercase shadow-lg transition-transform active:scale-95">
                        <Plus className="w-3 h-3" />
                        <span>Evento</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3">
                    {(selectedObject.events || []).map((event, index) => (
                        <div key={event.id} className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden flex flex-col sm:flex-row shadow-xl">
                            
                            <div className="bg-gray-800 flex flex-row sm:flex-col items-center justify-between sm:justify-start p-1.5 sm:w-8 border-b sm:border-b-0 sm:border-r border-gray-700 sm:space-y-3">
                                <span className="font-mono text-[9px] text-gray-500">#{index + 1}</span>
                                <button onClick={() => handleRemoveEvent(event.id)} className="text-gray-600 hover:text-red-400">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-800">
                                <div className="flex-1 p-3 bg-gray-900/50">
                                    <div className="text-[8px] font-black text-green-500 uppercase mb-2 tracking-widest">CUANDO...</div>
                                    <div className="space-y-1.5">
                                        {event.conditions.map(cond => (
                                            <div key={cond.id} onClick={() => openEditCondition(event.id, cond)} className="flex items-center justify-between bg-gray-800 border-l-2 border-green-500 rounded p-2 text-[11px] hover:bg-gray-750 cursor-pointer group transition-colors">
                                                <span className="text-gray-300 font-medium truncate">{cond.type}</span>
                                                <button onClick={(e) => { e.stopPropagation(); removeCondition(event.id, cond.id); }} className="opacity-0 group-hover:opacity-100 text-gray-500 p-0.5"><X className="w-3.5 h-3.5" /></button>
                                            </div>
                                        ))}
                                        <button onClick={() => openAddCondition(event.id)} className="text-[9px] w-full py-1.5 border border-dashed border-gray-700 hover:border-green-500 text-gray-500 hover:text-green-400 rounded uppercase font-bold transition-all">
                                            + Condición
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 p-3 bg-gray-900/30">
                                    <div className="text-[8px] font-black text-blue-500 uppercase mb-2 tracking-widest">HACER...</div>
                                    <div className="space-y-1.5">
                                        {event.actions.map(act => (
                                            <div key={act.id} onClick={() => openEditAction(event.id, act)} className="flex items-center justify-between bg-gray-800 border-l-2 border-blue-500 rounded p-2 text-[11px] hover:bg-gray-750 cursor-pointer group transition-colors">
                                                <span className="text-gray-300 font-medium truncate">{act.type}</span>
                                                <button onClick={(e) => { e.stopPropagation(); removeAction(event.id, act.id); }} className="opacity-0 group-hover:opacity-100 text-gray-500 p-0.5"><X className="w-3.5 h-3.5" /></button>
                                            </div>
                                        ))}
                                        <button onClick={() => openAddAction(event.id)} className="text-[9px] w-full py-1.5 border border-dashed border-gray-700 hover:border-blue-500 text-gray-500 hover:text-blue-400 rounded uppercase font-bold transition-all">
                                            + Acción
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
              </>
          ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center opacity-40 uppercase font-black tracking-tighter text-xs">
                  Selecciona un objeto de la izquierda
              </div>
          )}

      </div>

      <EventActionModal 
        isOpen={modalOpen}
        mode={modalMode}
        objects={objects}
        scenes={scenes}
        initialType={editingItemType}
        initialParams={editingItemParams}
        onClose={() => setModalOpen(false)}
        onSave={handleModalSave}
        library={library}
        globalVariables={globalVariables}
        plugins={plugins}
        assets={assets}
      />
    </div>
  );
};