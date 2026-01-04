
import React, { useState, useRef, useEffect } from 'react';
import { GameObject, ObjectType, Scene, Variable } from '../types';
import { Puzzle, Box, User, Zap, ChevronLeft, ChevronRight, Trash2, ArrowDown, Menu, LayoutList, List, Grid3x3, X } from './Icons';
import { BLOCK_CATEGORIES, BLOCKS_CATALOG, BlockCategory } from '../logic/blocks/definitions';
import { getBlockDefaults } from '../logic/blocks/defaults';
import { renderBlockContent } from '../logic/blocks/renderer';
import { BlockPaletteItem } from '../logic/blocks/layoutComponents';

interface BlockEditorProps {
    objects: GameObject[];
    scenes: Scene[];
    library: GameObject[];
    globalVariables: Variable[];
    onUpdateObject: (id: string, updates: Partial<GameObject>) => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({ objects, scenes, library, globalVariables, onUpdateObject }) => {
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<BlockCategory>('EVENTS');
    const [draggingBlock, setDraggingBlock] = useState<any>(null);
    const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });
    const [dropTarget, setDropTarget] = useState<{ type: string, eventId?: string } | null>(null);

    // Estados de visibilidad de paneles (cerrados por defecto en móvil para dar espacio)
    const [isLibraryOpen, setIsLibraryOpen] = useState(window.innerWidth >= 1024);
    const [isPaletteOpen, setIsPaletteOpen] = useState(window.innerWidth >= 1024);

    const selectedObject = library.find(o => o.id === selectedObjectId);
    const selectedObjectRef = useRef(selectedObject);
    const dropTargetRef = useRef(dropTarget);
    
    useEffect(() => { selectedObjectRef.current = selectedObject; }, [selectedObject]);
    useEffect(() => { dropTargetRef.current = dropTarget; }, [dropTarget]);

    // Auto-cerrar paneles al seleccionar en móvil
    const handleSelectObject = (id: string) => {
        setSelectedObjectId(id);
        if (window.innerWidth < 1024) setIsLibraryOpen(false);
    };

    const handleBlockPointerDown = (e: React.PointerEvent, blockData: any) => {
        const target = e.currentTarget as HTMLElement;
        try { target.setPointerCapture(e.pointerId); } catch (err) {}

        setDraggingBlock(blockData);
        setPointerPos({ x: e.clientX, y: e.clientY });

        // MEJORA UX MÓVIL: Al empezar a arrastrar, ocultamos los paneles para ver la zona de soltado
        setIsPaletteOpen(false);
        setIsLibraryOpen(false);

        const onMove = (me: PointerEvent) => {
            setPointerPos({ x: me.clientX, y: me.clientY });
            const els = document.elementsFromPoint(me.clientX, me.clientY);
            let foundTarget = null;
            for(const el of els) {
                const zoneType = el.getAttribute('data-drop-zone');
                if (zoneType) {
                    foundTarget = { type: zoneType, eventId: el.getAttribute('data-event-id') || undefined };
                    break;
                }
            }
            setDropTarget(foundTarget);
        };

        const onUp = (ue: PointerEvent) => {
            const finalTarget = dropTargetRef.current;
            const currentObj = selectedObjectRef.current;

            if (finalTarget && currentObj) {
                const defaults = getBlockDefaults(blockData.type, library, scenes);
                if (finalTarget.type === 'NEW_EVENT' && blockData.mode === 'CONDITION') {
                    const newEv = { 
                        id: crypto.randomUUID(), 
                        conditions: [{ id: crypto.randomUUID(), type: blockData.type, parameters: defaults }], 
                        actions: [] 
                    };
                    onUpdateObject(currentObj.id, { events: [...(currentObj.events || []), newEv] });
                } 
                else if (finalTarget.type === 'EVENT_STACK' && blockData.mode === 'ACTION' && finalTarget.eventId) {
                    const newAct = { id: crypto.randomUUID(), type: blockData.type, parameters: defaults };
                    const newEvents = (currentObj.events || []).map(ev => 
                        ev.id === finalTarget.eventId ? { ...ev, actions: [...ev.actions, newAct] } : ev
                    );
                    onUpdateObject(currentObj.id, { events: newEvents });
                }
            }
            
            setDraggingBlock(null);
            setDropTarget(null);
            try { target.releasePointerCapture(ue.pointerId); } catch (err) {}
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    };

    return (
        <div className="flex flex-col w-full h-full bg-[#111] overflow-hidden select-none touch-none relative">
            
            {/* BARRA SUPERIOR DE CONTROL (HEADER) */}
            <div className="h-14 bg-[#252526] border-b border-black flex items-center px-4 justify-between shrink-0 z-[60] shadow-lg">
                <div className="flex items-center space-x-2 overflow-hidden">
                    <button 
                        onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                        className={`p-2 rounded-lg transition-colors ${isLibraryOpen ? 'bg-orange-600 text-white' : 'bg-gray-800 text-orange-500'}`}
                        title="Librería de Objetos"
                    >
                        <Box className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-gray-700 mx-1" />
                    <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-black text-orange-500 uppercase tracking-tighter leading-none mb-0.5">Programando</span>
                        <span className="text-xs font-bold text-white uppercase truncate">{selectedObject?.name || '---'}</span>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {selectedObjectId && (
                        <button 
                            onClick={() => setIsPaletteOpen(!isPaletteOpen)}
                            className={`p-2 rounded-lg transition-colors ${isPaletteOpen ? 'bg-orange-600 text-white' : 'bg-gray-800 text-orange-500'}`}
                        >
                            <Puzzle className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={() => setSelectedObjectId(null)} className="p-2 text-gray-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex relative overflow-hidden">
                
                {/* PANEL 1: LIBRERÍA DE OBJETOS (DRAWER) */}
                <div 
                    className={`absolute inset-y-0 left-0 z-50 flex transition-transform duration-300 ease-in-out ${isLibraryOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 ${!isLibraryOpen && 'lg:hidden'}`}
                    style={{ width: window.innerWidth < 640 ? '80%' : '260px' }}
                >
                    <div className="flex-1 flex flex-col bg-[#252526] border-r border-black shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Objetos</span>
                            <button onClick={() => setIsLibraryOpen(false)} className="lg:hidden text-gray-400 hover:text-white"><ChevronLeft className="w-5 h-5"/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar touch-pan-y">
                            {library.map(obj => (
                                <button key={obj.id} onClick={() => handleSelectObject(obj.id)} className={`w-full flex items-center space-x-3 p-3 rounded-xl border transition-all ${selectedObjectId === obj.id ? 'bg-orange-600 border-orange-400 shadow-lg' : 'bg-[#2a2d2e] border-transparent hover:bg-white/5'}`}>
                                    <div className="w-8 h-8 bg-black/40 rounded-lg flex items-center justify-center shrink-0">
                                        {obj.type === ObjectType.PLAYER ? <User className="w-4 h-4 text-green-400"/> : <Box className="w-4 h-4 text-blue-400"/>}
                                    </div>
                                    <span className="text-xs font-bold text-white truncate">{obj.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* PANEL 2: PALETA DE BLOQUES (DRAWER) */}
                {selectedObject && (
                    <div 
                        className={`absolute inset-y-0 left-0 lg:left-0 z-40 flex transition-transform duration-300 ease-in-out ${isPaletteOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 ${!isPaletteOpen && 'lg:hidden'}`}
                        style={{ width: window.innerWidth < 640 ? '85%' : '300px', marginLeft: isLibraryOpen && window.innerWidth >= 1024 ? '0' : '0' }}
                    >
                        <div className="flex-1 flex flex-row bg-[#2a2d2e] border-r border-black shadow-2xl overflow-hidden">
                            {/* Selector de Categorías Lateral */}
                            <div className="w-14 bg-black/40 flex flex-col items-center py-4 space-y-4 border-r border-white/5 shrink-0">
                                {BLOCK_CATEGORIES.map(cat => (
                                    <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`p-2.5 rounded-xl transition-all ${activeCategory === cat.id ? 'bg-orange-600 text-white scale-110 shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>
                                        <Zap className="w-5 h-5" />
                                    </button>
                                ))}
                            </div>
                            {/* Lista de Bloques */}
                            <div className="flex-1 flex flex-col bg-black/10 overflow-hidden">
                                <div className="p-4 border-b border-white/5">
                                    <h3 className={`text-[9px] font-black uppercase tracking-widest ${BLOCK_CATEGORIES.find(c => c.id === activeCategory)?.color}`}>
                                        {BLOCK_CATEGORIES.find(c => c.id === activeCategory)?.label}
                                    </h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3 custom-scrollbar touch-pan-y space-y-1.5">
                                    {(BLOCKS_CATALOG[activeCategory] || []).map((b:any) => (
                                        <BlockPaletteItem key={b.type} {...b} onPointerDown={handleBlockPointerDown} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* AREA DE TRABAJO (CENTRAL) */}
                <div 
                    className={`flex-1 bg-[#1e1e1e] flex flex-col relative transition-colors duration-200 overflow-hidden ${dropTarget?.type === 'NEW_EVENT' ? 'bg-yellow-500/5' : ''}`} 
                    data-drop-zone="NEW_EVENT"
                >
                    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 pointer-events-none custom-scrollbar touch-pan-y">
                        {selectedObject ? (
                            <>
                                {(selectedObject.events || []).map(event => (
                                    <div 
                                        key={event.id} 
                                        className={`bg-[#252526] border border-black rounded-2xl overflow-hidden shadow-2xl pointer-events-auto transform transition-all ${dropTarget?.eventId === event.id ? 'ring-2 ring-blue-500 scale-[1.01]' : ''}`}
                                    >
                                        <div className="bg-black/20 p-3 flex justify-between items-center border-b border-black">
                                            <div className="flex items-center space-x-2">
                                                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Si esto ocurre...</span>
                                            </div>
                                            <button onClick={() => onUpdateObject(selectedObject.id, { events: selectedObject.events.filter(e => e.id !== event.id) })} className="text-gray-600 hover:text-red-500 transition-colors p-1"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                        <div className="p-4 space-y-4">
                                            <div className="space-y-2">
                                                {event.conditions.map(c => (
                                                    <div key={c.id} className="bg-yellow-600 p-3 rounded-xl text-white font-bold text-xs shadow-xl border-l-4 border-yellow-300">
                                                        {renderBlockContent(c.type, c.parameters, (p) => {
                                                            const nEv = selectedObject.events.map(ev => ev.id === event.id ? { ...ev, conditions: ev.conditions.map(con => con.id === c.id ? { ...con, parameters: { ...con.parameters, ...p } } : con) } : ev);
                                                            onUpdateObject(selectedObject.id, { events: nEv });
                                                        }, { library, scenes, globalVariables })}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex justify-center py-1"><ArrowDown className="w-4 h-4 text-white/5" /></div>
                                            
                                            <div 
                                                className={`space-y-2 min-h-[60px] rounded-xl p-2 transition-colors border-2 border-transparent ${dropTarget?.eventId === event.id && dropTarget.type === 'EVENT_STACK' ? 'bg-blue-600/10 border-dashed border-blue-500' : 'bg-black/10'}`} 
                                                data-drop-zone="EVENT_STACK" 
                                                data-event-id={event.id}
                                            >
                                                {event.actions.map(a => (
                                                    <div key={a.id} className="bg-blue-600 p-3 rounded-xl text-white font-bold text-xs shadow-xl border-l-4 border-blue-300 group/act relative">
                                                        <div className="pr-8">
                                                            {renderBlockContent(a.type, a.parameters, (p) => {
                                                                const nEv = selectedObject.events.map(ev => ev.id === event.id ? { ...ev, actions: ev.actions.map(act => act.id === a.id ? { ...act, parameters: { ...act.parameters, ...p } } : act) } : ev);
                                                                onUpdateObject(selectedObject.id, { events: nEv });
                                                            }, { library, scenes, globalVariables })}
                                                        </div>
                                                        <button onClick={() => {
                                                            const nEv = selectedObject.events.map(ev => ev.id === event.id ? { ...ev, actions: ev.actions.filter(act => act.id !== a.id) } : ev);
                                                            onUpdateObject(selectedObject.id, { events: nEv });
                                                        }} className="absolute right-2 top-3 text-blue-300 hover:text-white p-1"><Trash2 className="w-4 h-4"/></button>
                                                    </div>
                                                ))}
                                                {event.actions.length === 0 && (
                                                    <div className="text-[9px] text-gray-600 text-center py-4 border border-dashed border-white/5 rounded-lg">Suelta acciones (azul) aquí</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!selectedObject.events || selectedObject.events.length === 0) && (
                                    <div className="h-full flex flex-col items-center justify-center opacity-30 border-4 border-dashed border-white/5 rounded-[40px] p-10 py-20">
                                        <Puzzle className="w-16 h-16 text-yellow-500 mb-4" />
                                        <p className="font-black uppercase text-center text-white">Lógica Vacía</p>
                                        <p className="text-xs text-center text-gray-500 mt-2 px-4">Arrastra un evento amarillo desde la izquierda</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600">
                                <Box className="w-12 h-12 opacity-10 mb-4" />
                                <p className="font-bold text-[10px] uppercase tracking-widest px-10 text-center leading-relaxed">
                                    Abre la librería y selecciona un objeto para ver sus bloques
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Overlays para cerrar al tocar fuera en móvil */}
                {(isLibraryOpen || isPaletteOpen) && window.innerWidth < 1024 && (
                    <div className="absolute inset-0 bg-black/60 z-30 animate-in fade-in" onClick={() => { setIsLibraryOpen(false); setIsPaletteOpen(false); }} />
                )}
            </div>

            {/* BLOQUE FANTASMA */}
            {draggingBlock && (
                <div 
                    className={`fixed z-[1000] px-4 py-3 rounded-2xl shadow-2xl ${draggingBlock.color} text-white font-bold text-xs pointer-events-none ring-4 ring-white/20 flex items-center space-x-2 animate-in fade-in zoom-in-95`} 
                    style={{ left: pointerPos.x, top: pointerPos.y - 60, transform: 'translateX(-50%)' }}
                >
                    {draggingBlock.icon && <draggingBlock.icon className="w-4 h-4 opacity-70" />}
                    <span>{draggingBlock.label}</span>
                    {dropTarget && (
                        <div className="ml-2 bg-black/30 px-2 py-0.5 rounded text-[8px] uppercase font-black text-green-400">+</div>
                    )}
                </div>
            )}
        </div>
    );
};
