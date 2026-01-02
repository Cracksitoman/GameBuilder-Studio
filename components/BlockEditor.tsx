
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GameObject, GameEvent, EventCondition, EventAction, ObjectType, Scene, Variable, BehaviorType } from '../types';
import { 
    Puzzle, Box, Hand, Trash2, Plus, Play, MonitorSmartphone, Timer, Ruler, Wind, Eye, Check, X,
    Move, Copy, MessageSquare, Vibrate, Navigation, Film, Settings, ChevronRight, Zap, RefreshCw,
    Activity, Crosshair, Volume2, Droplets, Maximize2, Palette, ChevronLeft, ArrowLeft, Hash, MapPin, Compass, Sun, ChevronDown, MousePointerClick, Sidebar, ChevronUp
} from './Icons';

interface BlockEditorProps {
    objects: GameObject[];
    scenes: Scene[];
    library: GameObject[];
    globalVariables: Variable[];
    onUpdateObject: (id: string, updates: Partial<GameObject>) => void;
}

type BlockCategory = 'EVENTS' | 'MOTION' | 'LOOKS' | 'CONTROL';

// --- HELPER COMPONENTS ---

const InlineInput = ({ value, onChange, type = "text", className = "", width = "w-12", placeholder="" }: any) => (
    <input 
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) : e.target.value)}
        onPointerDown={(e) => e.stopPropagation()} 
        className={`bg-black/30 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white focus:bg-black/50 focus:border-blue-400 outline-none transition-colors ${width} ${className}`}
        placeholder={placeholder}
    />
);

const InlineSelect = ({ value, onChange, options, width = "w-24" }: any) => (
    <select 
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        className={`bg-black/30 border border-white/10 rounded px-1 py-0.5 text-[10px] text-white focus:bg-black/50 focus:border-blue-400 outline-none appearance-none cursor-pointer ${width}`}
    >
        {options.map((opt: any) => (
            <option key={opt.value} value={opt.value} className="bg-gray-800 text-white">{opt.label}</option>
        ))}
    </select>
);

// COMPACTED: Smaller padding, font size, and icons to fit more blocks
const BlockItem = ({ type, label, color, icon: Icon, mode, onPointerDown, onPointerMove, onPointerUp, isPressing, showText }: any) => (
    <div 
        onPointerDown={(e) => onPointerDown(e, { type, label, color, icon: Icon, mode })}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
        className={`
            flex items-center space-x-1.5 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing mb-1 shadow-sm border select-none
            ${color} text-white font-bold text-[10px] leading-tight
            hover:brightness-110 transition-all active:scale-95
            ${isPressing ? 'scale-90 brightness-125 ring-2 ring-white z-10' : 'border-black/10'}
        `}
        style={{ touchAction: 'none' }} 
        title={label}
    >
        {Icon && <Icon className="w-3.5 h-3.5 opacity-80 flex-shrink-0" />}
        <span className="truncate">{label}</span>
    </div>
);

const SidebarSection = ({ title, children, color }: any) => (
    <div className="mb-4 animate-in fade-in slide-in-from-left-2 duration-200">
        <h3 className={`text-[9px] font-black uppercase tracking-widest mb-1.5 pl-1 ${color}`}>{title}</h3>
        {children}
    </div>
);

export const BlockEditor: React.FC<BlockEditorProps> = ({ objects, scenes, library, globalVariables, onUpdateObject }) => {
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<BlockCategory>('EVENTS');
    const [collapsedEvents, setCollapsedEvents] = useState<Record<string, boolean>>({});
    
    // Controls the expansion of the Block Palette Sidebar
    const [isPaletteOpen, setIsPaletteOpen] = useState(true); // Default open

    // Scroll Logic
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const startScroll = (direction: 'up' | 'down') => {
        stopScroll();
        const step = direction === 'up' ? -15 : 15;
        
        // Immediate move
        if(scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop += step * 2;
        }

        // Continuous move
        scrollIntervalRef.current = setInterval(() => {
            if(scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop += step;
            }
        }, 16);
    };

    const stopScroll = () => {
        if(scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
        }
    };

    // Long Press & Drag State
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const startPressPos = useRef<{x: number, y: number} | null>(null);
    const [pressingBlockType, setPressingBlockType] = useState<string | null>(null);

    const [draggingBlock, setDraggingBlock] = useState<{
        type: string;
        mode: 'CONDITION' | 'ACTION';
        label: string;
        color: string;
        icon?: any;
    } | null>(null);
    
    const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });
    const [dropTarget, setDropTarget] = useState<{ type: 'NEW_EVENT' | 'EVENT_STACK', eventId?: string } | null>(null);
    const dragGhostRef = useRef<HTMLDivElement>(null);
    
    // UPDATED: Only look for object in LIBRARY for editing logic (Prototypes)
    const selectedObject = library.find(o => o.id === selectedObjectId);
    
    const selectedObjectRef = useRef(selectedObject);
    useEffect(() => { selectedObjectRef.current = selectedObject; }, [selectedObject]);

    // Available objects for dropdowns (can reference library prototypes)
    const availableObjects = library.map(o => ({ value: o.id, label: o.name }));

    // --- Helpers ---
    const toggleEventCollapse = (eventId: string) => {
        setCollapsedEvents(prev => ({ ...prev, [eventId]: !prev[eventId] }));
    };

    const handleCategoryClick = (category: BlockCategory) => {
        setActiveCategory(category);
        if (!isPaletteOpen) setIsPaletteOpen(true);
    };

    const getIcon = (type: ObjectType) => {
        switch (type) {
            case ObjectType.TEXT: return <span className="text-yellow-400 font-bold">T</span>;
            case ObjectType.PLAYER: return <span className="text-green-400 font-bold">P</span>;
            case ObjectType.ENEMY: return <span className="text-red-400 font-bold">E</span>;
            default: return <Box className="w-4 h-4 text-blue-400" />;
        }
    };

    const getDefaultParams = (type: string) => {
        switch(type) {
            case 'TOUCH_INTERACTION': return { subtype: 'CLICK', duration: 0.5 };
            case 'EVERY_X_SECONDS': return { interval: 1 };
            case 'KEY_PRESSED': return { key: 'Space' };
            case 'DISTANCE_TO': return { targetId: availableObjects[0]?.value || '', distance: 100, operator: 'LESS' };
            case 'COLLISION': return { targetId: availableObjects[0]?.value || '' };
            case 'COMPARE_VARIABLE': return { source: 'LOCAL', varId: 'vida', operator: 'EQUAL', value: 0 };
            case 'COMPARE_POSITION': return { axis: 'X', operator: 'GREATER', value: 0 };
            
            case 'MOVE_FORWARD': return { steps: 10 };
            case 'SET_X': return { value: 0 };
            case 'SET_Y': return { value: 0 };
            case 'CHANGE_X': return { value: 10 };
            case 'CHANGE_Y': return { value: 10 };
            case 'SET_ROTATION': return { value: 0 };
            case 'CHANGE_ROTATION': return { value: 15 };
            case 'POINT_TOWARDS_POINT': return { x: 0, y: 0 };

            case 'MOVE_TO_POINTER': return { speed: 200 };
            case 'SET_VELOCITY': return { vx: 100, vy: 0 };
            case 'APPLY_FORCE': return { forceX: 0, forceY: -500 };
            case 'ROTATE_TOWARD': return { targetId: 'POINTER', speed: 100 };
            case 'SET_VISIBLE': return { visible: false };
            case 'SET_COLOR': return { color: '#ff0000' };
            case 'SET_SIZE': return { width: 64, height: 64 };
            case 'SET_OPACITY': return { opacity: 0.5 };
            case 'CHANGE_SCENE': return { sceneId: scenes[0]?.id || '' };
            case 'CREATE_OBJECT': return { sourceObjectId: availableObjects[0]?.value || '', spawnOrigin: 'SELF' };
            case 'PLAY_SOUND': return { url: '' };
            case 'SET_TEXT': return { text: 'Hola Mundo' };
            case 'CAMERA_SHAKE': return { intensity: 5, duration: 0.5 };
            case 'PLAY_ANIMATION': return { animName: 'Run' };
            case 'MODIFY_VARIABLE': return { source: 'LOCAL', varId: 'puntos', operation: 'ADD', value: 1 };
            case 'DESTROY': return { target: 'SELF' };
            case 'SPAWN_PARTICLES': return { count: 10, color: '#ffaa00', duration: 1 };
            case 'DAMAGE_OBJECT': return { amount: 1, target: 'OTHER' };
            case 'HEAL_OBJECT': return { amount: 1, target: 'SELF' };
            case 'SET_CAMERA_ZOOM': return { zoom: 1.2 };
            case 'FLASH_EFFECT': return { duration: 0.1 };
            case 'TOGGLE_BEHAVIOR': return { behaviorType: BehaviorType.PLATFORMER, enable: true };
            default: return {};
        }
    };

    const handleDeleteEvent = (eventId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedObject) return;
        if(confirm("¿Eliminar este bloque de eventos completo?")) {
            onUpdateObject(selectedObject.id, { events: selectedObject.events.filter(e => e.id !== eventId) });
        }
    };

    const deleteBlock = (eventId: string, itemId: string, isCondition: boolean) => {
        if (!selectedObject) return;
        const newEvents = selectedObject.events.map(ev => {
            if (ev.id === eventId) {
                if (isCondition) {
                    return { ...ev, conditions: ev.conditions.filter(c => c.id !== itemId) };
                } else {
                    return { ...ev, actions: ev.actions.filter(a => a.id !== itemId) };
                }
            }
            return ev;
        });
        onUpdateObject(selectedObject.id, { events: newEvents });
    };

    const updateBlockParams = (eventId: string, itemId: string, newParams: any, isCondition: boolean) => {
        if (!selectedObject) return;
        const newEvents = selectedObject.events.map(ev => {
            if (ev.id === eventId) {
                if (isCondition) {
                    return { ...ev, conditions: ev.conditions.map(c => c.id === itemId ? { ...c, parameters: { ...c.parameters, ...newParams } } : c) };
                } else {
                    return { ...ev, actions: ev.actions.map(a => a.id === itemId ? { ...a, parameters: { ...a.parameters, ...newParams } } : a) };
                }
            }
            return ev;
        });
        onUpdateObject(selectedObject.id, { events: newEvents });
    };

    // --- DRAG LOGIC (Long Press) ---
    const initiateDrag = useCallback((blockData: any, initialX: number, initialY: number) => {
        setDraggingBlock(blockData);
        setPointerPos({ x: initialX, y: initialY });

        const handleWindowMove = (moveEvent: PointerEvent) => {
            setPointerPos({ x: moveEvent.clientX, y: moveEvent.clientY });
            const elements = document.elementsFromPoint(moveEvent.clientX, moveEvent.clientY);
            let foundZone = null;
            for (const el of elements) {
                if (el.hasAttribute('data-drop-zone')) {
                    const zoneType = el.getAttribute('data-drop-zone');
                    const zoneEventId = el.getAttribute('data-event-id') || undefined;
                    if (blockData.mode === 'CONDITION' && zoneType === 'NEW_EVENT') { foundZone = { type: 'NEW_EVENT' } as any; break; }
                    if (blockData.mode === 'ACTION' && zoneType === 'EVENT_STACK') { foundZone = { type: 'EVENT_STACK', eventId: zoneEventId } as any; break; }
                }
            }
            setDropTarget(foundZone);
        };

        const handleWindowUp = (upEvent: PointerEvent) => {
            const elements = document.elementsFromPoint(upEvent.clientX, upEvent.clientY);
            let finalZone = null;
            for (const el of elements) {
                if (el.hasAttribute('data-drop-zone')) {
                    const zoneType = el.getAttribute('data-drop-zone');
                    const zoneEventId = el.getAttribute('data-event-id') || undefined;
                    if (blockData.mode === 'CONDITION' && zoneType === 'NEW_EVENT') finalZone = { type: 'NEW_EVENT' };
                    if (blockData.mode === 'ACTION' && zoneType === 'EVENT_STACK') finalZone = { type: 'EVENT_STACK', eventId: zoneEventId };
                    break;
                }
            }

            const currentObject = selectedObjectRef.current;
            if (finalZone && currentObject) {
                const defaultParams = getDefaultParams(blockData.type);
                if (finalZone.type === 'NEW_EVENT') {
                    const newEvent: GameEvent = {
                        id: crypto.randomUUID(),
                        conditions: [{ id: crypto.randomUUID(), type: blockData.type as any, parameters: defaultParams }],
                        actions: []
                    };
                    setCollapsedEvents(prev => ({ ...prev, [newEvent.id]: false }));
                    onUpdateObject(currentObject.id, { events: [...(currentObject.events || []), newEvent] });
                } else if (finalZone.type === 'EVENT_STACK' && finalZone.eventId) {
                    const newAction: EventAction = { id: crypto.randomUUID(), type: blockData.type as any, parameters: defaultParams };
                    const newEvents = currentObject.events.map(e => e.id === finalZone.eventId ? { ...e, actions: [...e.actions, newAction] } : e);
                    setCollapsedEvents(prev => ({ ...prev, [finalZone.eventId]: false }));
                    onUpdateObject(currentObject.id, { events: newEvents });
                }
            }
            setDraggingBlock(null); setDropTarget(null);
            window.removeEventListener('pointermove', handleWindowMove);
            window.removeEventListener('pointerup', handleWindowUp);
        };
        window.addEventListener('pointermove', handleWindowMove);
        window.addEventListener('pointerup', handleWindowUp);
    }, [scenes, availableObjects]); 

    const handleBlockPointerDown = (e: React.PointerEvent, blockData: any) => {
        e.stopPropagation();
        startPressPos.current = { x: e.clientX, y: e.clientY };
        setPressingBlockType(blockData.type);
        pressTimer.current = setTimeout(() => {
            if (startPressPos.current) {
                initiateDrag(blockData, startPressPos.current.x, startPressPos.current.y);
                setPressingBlockType(null);
                startPressPos.current = null;
            }
        }, 200);
    };

    const handleBlockPointerMove = (e: React.PointerEvent) => {
        if (startPressPos.current) {
            const dx = Math.abs(e.clientX - startPressPos.current.x);
            const dy = Math.abs(e.clientY - startPressPos.current.y);
            if (dx > 10 || dy > 10) {
                if (pressTimer.current) clearTimeout(pressTimer.current);
                setPressingBlockType(null);
                startPressPos.current = null;
            }
        }
    };

    const handleBlockPointerUp = () => {
        if (pressTimer.current) clearTimeout(pressTimer.current);
        setPressingBlockType(null);
        startPressPos.current = null;
    };

    // --- Block Renderer (Workspace) ---
    const renderBlockContent = (type: string, params: any, onChange: (p: any) => void) => {
        const safeParams = params || {};
        switch(type) {
            case 'TOUCH_INTERACTION': return <div className="flex items-center space-x-2"><span>Al</span><InlineSelect width="w-24" value={safeParams.subtype} onChange={(v:any)=>onChange({subtype:v})} options={[{value:'CLICK', label:'Clic'},{value:'DOUBLE_CLICK', label:'Doble'},{value:'LONG_PRESS', label:'Mantener'},{value:'DRAG', label:'Arrastrar'}]} /></div>;
            case 'COLLISION': return <div className="flex items-center space-x-2"><span>Choca con</span><InlineSelect width="w-24" value={safeParams.targetId} onChange={(v:any)=>onChange({targetId:v})} options={availableObjects} /></div>;
            case 'MOVE_FORWARD': return <div className="flex items-center space-x-2"><span>Mover</span><InlineInput type="number" value={safeParams.steps} onChange={(v:any)=>onChange({steps:v})} /><span>pasos</span></div>;
            case 'DESTROY': return <span>Destruir</span>;
            case 'START_OF_SCENE': return <span>Al empezar escena</span>;
            case 'CREATE_OBJECT': return <div className="flex items-center space-x-2"><span>Crear</span><InlineSelect width="w-20" value={safeParams.sourceObjectId} onChange={(v:any)=>onChange({sourceObjectId:v})} options={availableObjects} /></div>;
            case 'PLAY_SOUND': return <div className="flex items-center space-x-2"><span>Sonido</span><InlineInput width="w-24" placeholder="URL" value={safeParams.url} onChange={(v:any)=>onChange({url:v})} /></div>;
            case 'CHANGE_SCENE': return <div className="flex items-center space-x-2"><span>Ir a:</span><InlineSelect value={safeParams.sceneId} onChange={(v:any)=>onChange({sceneId:v})} options={scenes.map(s=>({value:s.id, label:s.name}))} /></div>;
            case 'SET_VISIBLE': return <div className="flex items-center space-x-2"><span>Visible:</span><InlineSelect width="w-16" value={safeParams.visible} onChange={(v:any)=>onChange({visible: v === 'true'})} options={[{value:'true',label:'SI'},{value:'false',label:'NO'}]} /></div>;
            case 'SET_COLOR': return <div className="flex items-center space-x-2"><span>Color:</span><input type="color" value={safeParams.color} onChange={(e)=>onChange({color:e.target.value})} className="w-6 h-6 bg-transparent border-0 rounded cursor-pointer p-0" onPointerDown={e=>e.stopPropagation()} /></div>;
            case 'SPAWN_PARTICLES': return <div className="flex items-center space-x-1 text-[10px]"><span>Partículas</span><InlineInput width="w-8" type="number" value={safeParams.count} onChange={(v:any)=>onChange({count:v})} /></div>;
            case 'SET_TEXT': return <div className="flex items-center space-x-2"><span>Texto:</span><InlineInput width="w-32" value={safeParams.text} onChange={(v:any)=>onChange({text:v})} /></div>;
            case 'SET_X': return <div className="flex items-center space-x-2"><span>Fijar X a</span><InlineInput type="number" value={safeParams.value} onChange={(v:any)=>onChange({value:v})} /></div>;
            case 'SET_Y': return <div className="flex items-center space-x-2"><span>Fijar Y a</span><InlineInput type="number" value={safeParams.value} onChange={(v:any)=>onChange({value:v})} /></div>;
            case 'CHANGE_X': return <div className="flex items-center space-x-2"><span>Cambiar X por</span><InlineInput type="number" value={safeParams.value} onChange={(v:any)=>onChange({value:v})} /></div>;
            case 'CHANGE_Y': return <div className="flex items-center space-x-2"><span>Cambiar Y por</span><InlineInput type="number" value={safeParams.value} onChange={(v:any)=>onChange({value:v})} /></div>;
            case 'EVERY_X_SECONDS': return <div className="flex items-center space-x-2"><span>Cada</span><InlineInput type="number" value={safeParams.interval} onChange={(v:any)=>onChange({interval:v})} width="w-10" /><span>segundos</span></div>;
            case 'KEY_PRESSED': return <div className="flex items-center space-x-2"><span>Tecla</span><InlineSelect value={safeParams.key} onChange={(v:any)=>onChange({key:v})} options={[{value:'Space',label:'Espacio'},{value:'ArrowUp',label:'Arriba'},{value:'ArrowDown',label:'Abajo'},{value:'ArrowLeft',label:'Izquierda'},{value:'ArrowRight',label:'Derecha'},{value:'Enter',label:'Enter'}]} /><span>presionada</span></div>;
            case 'DISTANCE_TO': return <div className="flex items-center space-x-1 text-[10px]"><span>Distancia a</span><InlineSelect width="w-20" value={safeParams.targetId} onChange={(v:any)=>onChange({targetId:v})} options={availableObjects} /></div>;
            
            default: return <span>{type.replace(/_/g, ' ')}</span>;
        }
    };

    return (
        <div className="flex w-full h-full bg-[#1e1e1e] overflow-hidden font-sans relative">
            
            {/* LEFT SIDEBAR: Objects List (LIBRARY ONLY) */}
            <div className={`
                flex-col bg-[#252526] border-r border-[#333] z-20 transition-all duration-300
                ${selectedObjectId ? 'hidden md:flex md:w-48' : 'flex w-full md:w-48'}
            `}>
                <div className="p-4 border-b border-[#333] flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Objetos</span>
                    <Puzzle className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {/* ONLY SHOW LIBRARY OBJECTS */}
                    <div className="mb-2">
                        <div className="px-2 py-1 text-[10px] font-bold text-gray-500 uppercase">Librería (Prototipos)</div>
                        {library.map(obj => (
                            <button
                                key={obj.id}
                                onClick={() => setSelectedObjectId(obj.id)}
                                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors border ${selectedObjectId === obj.id ? 'bg-[#37373d] text-white border-blue-500/30' : 'bg-[#2a2d2e] text-gray-300 border-transparent hover:bg-[#333]'}`}
                            >
                                <div className="w-8 h-8 bg-black/40 rounded flex items-center justify-center shrink-0 border border-dashed border-gray-600">
                                    {getIcon(obj.type)}
                                </div>
                                <span className="text-xs font-medium truncate">{obj.name}</span>
                                <ChevronRight className="w-4 h-4 text-gray-600 ml-auto" />
                            </button>
                        ))}
                    </div>

                    {library.length === 0 && (
                        <div className="text-center p-8 text-gray-500 text-xs">
                            <Box className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            Crea objetos en la pestaña "Escena" para añadirlos a la librería.
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN WORKSPACE (Visible when Object Selected) */}
            {selectedObject ? (
                <div className="flex-1 flex h-full relative">
                    
                    {/* BLOCK PALETTE SIDEBAR */}
                    <div 
                        className={`flex flex-row border-r border-[#333] z-20 relative bg-[#333333] transition-all duration-300 ${isPaletteOpen ? 'w-56' : 'w-16'}`}
                    >
                        {/* 1. Vertical Icons Strip */}
                        <div className="flex flex-col w-16 bg-[#252526] border-r border-black/20 items-center py-2 space-y-2 shrink-0 z-20">
                            <button onClick={() => setIsPaletteOpen(!isPaletteOpen)} className="mb-4 p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700">
                                {isPaletteOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>

                            <button onClick={() => handleCategoryClick('EVENTS')} className={`p-3 rounded-lg ${activeCategory === 'EVENTS' ? 'bg-yellow-600 text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-gray-700'}`} title="Eventos">
                                <Zap className="w-6 h-6" />
                            </button>
                            <button onClick={() => handleCategoryClick('MOTION')} className={`p-3 rounded-lg ${activeCategory === 'MOTION' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-gray-700'}`} title="Movimiento">
                                <Move className="w-6 h-6" />
                            </button>
                            <button onClick={() => handleCategoryClick('LOOKS')} className={`p-3 rounded-lg ${activeCategory === 'LOOKS' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-gray-700'}`} title="Apariencia">
                                <Eye className="w-6 h-6" />
                            </button>
                            <button onClick={() => handleCategoryClick('CONTROL')} className={`p-3 rounded-lg ${activeCategory === 'CONTROL' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-gray-700'}`} title="Control">
                                <Settings className="w-6 h-6" />
                            </button>
                        </div>
                        
                        {/* 2. Block List Area (Hidden when collapsed) */}
                        {isPaletteOpen && (
                            <div className="flex-1 flex flex-col bg-[#2a2a2a] min-w-0">
                                {/* Scroll Buttons */}
                                <div className="flex bg-[#2a2a2a] border-b border-black/20 shrink-0">
                                    <button onPointerDown={() => startScroll('up')} onPointerUp={stopScroll} onPointerLeave={stopScroll} className="flex-1 hover:bg-[#333] text-gray-400 py-1 flex justify-center border-r border-black/20"><ChevronUp className="w-4 h-4" /></button>
                                    <button onPointerDown={() => startScroll('down')} onPointerUp={stopScroll} onPointerLeave={stopScroll} className="flex-1 hover:bg-[#333] text-gray-400 py-1 flex justify-center"><ChevronDown className="w-4 h-4" /></button>
                                </div>

                                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-2 scroll-smooth">
                                    {activeCategory === 'EVENTS' && (
                                        <SidebarSection title="Eventos" color="text-yellow-500">
                                            <BlockItem isPressing={pressingBlockType === 'START_OF_SCENE'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="CONDITION" type="START_OF_SCENE" label="Al empezar escena" color="bg-yellow-600" icon={Play} />
                                            <BlockItem isPressing={pressingBlockType === 'TOUCH_INTERACTION'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="CONDITION" type="TOUCH_INTERACTION" label="Interacción Táctil" color="bg-yellow-600" icon={Hand} />
                                            <BlockItem isPressing={pressingBlockType === 'COLLISION'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="CONDITION" type="COLLISION" label="Al chocar con..." color="bg-yellow-600" icon={Box} />
                                            <BlockItem isPressing={pressingBlockType === 'EVERY_X_SECONDS'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="CONDITION" type="EVERY_X_SECONDS" label="Temporizador" color="bg-yellow-600" icon={Timer} />
                                            <BlockItem isPressing={pressingBlockType === 'KEY_PRESSED'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="CONDITION" type="KEY_PRESSED" label="Tecla presionada" color="bg-yellow-600" icon={MonitorSmartphone} />
                                            <BlockItem isPressing={pressingBlockType === 'DISTANCE_TO'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="CONDITION" type="DISTANCE_TO" label="Distancia a..." color="bg-yellow-600" icon={Ruler} />
                                            <BlockItem isPressing={pressingBlockType === 'COMPARE_VARIABLE'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="CONDITION" type="COMPARE_VARIABLE" label="Comparar Variable" color="bg-yellow-600" icon={Activity} />
                                            <BlockItem isPressing={pressingBlockType === 'COMPARE_POSITION'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="CONDITION" type="COMPARE_POSITION" label="Comparar Posición" color="bg-yellow-600" icon={Crosshair} />
                                            <BlockItem isPressing={pressingBlockType === 'IS_MOVING'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="CONDITION" type="IS_MOVING" label="Está Moviéndose" color="bg-yellow-600" icon={Wind} />
                                            <BlockItem isPressing={pressingBlockType === 'IS_VISIBLE'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="CONDITION" type="IS_VISIBLE" label="Es Visible" color="bg-yellow-600" icon={Eye} />
                                        </SidebarSection>
                                    )}
                                    {activeCategory === 'MOTION' && (
                                        <SidebarSection title="Movimiento" color="text-blue-500">
                                            <BlockItem isPressing={pressingBlockType === 'MOVE_FORWARD'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="MOVE_FORWARD" label="Mover (Pasos)" color="bg-blue-600" icon={Move} />
                                            <BlockItem isPressing={pressingBlockType === 'SET_X'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="SET_X" label="Fijar X" color="bg-blue-600" icon={Move} />
                                            <BlockItem isPressing={pressingBlockType === 'SET_Y'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="SET_Y" label="Fijar Y" color="bg-blue-600" icon={Move} />
                                            <BlockItem isPressing={pressingBlockType === 'CHANGE_X'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="CHANGE_X" label="Cambiar X (Relativo)" color="bg-blue-600" icon={Move} />
                                            <BlockItem isPressing={pressingBlockType === 'CHANGE_Y'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="CHANGE_Y" label="Cambiar Y (Relativo)" color="bg-blue-600" icon={Move} />
                                            <BlockItem isPressing={pressingBlockType === 'SET_ROTATION'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="SET_ROTATION" label="Fijar Rotación" color="bg-blue-600" icon={RefreshCw} />
                                            <BlockItem isPressing={pressingBlockType === 'CHANGE_ROTATION'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="CHANGE_ROTATION" label="Girar (Relativo)" color="bg-blue-600" icon={RefreshCw} />
                                            <BlockItem isPressing={pressingBlockType === 'POINT_TOWARDS_POINT'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="POINT_TOWARDS_POINT" label="Apuntar a Coordenada" color="bg-blue-600" icon={MapPin} />
                                            <BlockItem isPressing={pressingBlockType === 'MOVE_TO_POINTER'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="MOVE_TO_POINTER" label="Ir al puntero" color="bg-blue-600" icon={Move} />
                                            <BlockItem isPressing={pressingBlockType === 'SET_VELOCITY'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="SET_VELOCITY" label="Fijar Velocidad" color="bg-blue-600" icon={Wind} />
                                            <BlockItem isPressing={pressingBlockType === 'ROTATE_TOWARD'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="ROTATE_TOWARD" label="Rotar hacia objeto" color="bg-blue-600" icon={Compass} />
                                            <BlockItem isPressing={pressingBlockType === 'APPLY_FORCE'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="APPLY_FORCE" label="Aplicar Fuerza" color="bg-blue-600" icon={Wind} />
                                            <BlockItem isPressing={pressingBlockType === 'STOP_MOVEMENT'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="STOP_MOVEMENT" label="Detener" color="bg-blue-600" icon={X} />
                                        </SidebarSection>
                                    )}
                                    {activeCategory === 'LOOKS' && (
                                        <SidebarSection title="Apariencia" color="text-purple-500">
                                            <BlockItem isPressing={pressingBlockType === 'PLAY_ANIMATION'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="PLAY_ANIMATION" label="Animación" color="bg-purple-600" icon={Film} />
                                            <BlockItem isPressing={pressingBlockType === 'SET_VISIBLE'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="SET_VISIBLE" label="Visibilidad" color="bg-purple-600" icon={Eye} />
                                            <BlockItem isPressing={pressingBlockType === 'SET_COLOR'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="SET_COLOR" label="Color (Tinte)" color="bg-purple-600" icon={Palette} />
                                            <BlockItem isPressing={pressingBlockType === 'SET_OPACITY'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="SET_OPACITY" label="Opacidad" color="bg-purple-600" icon={Droplets} />
                                            <BlockItem isPressing={pressingBlockType === 'SET_SIZE'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="SET_SIZE" label="Cambiar Tamaño" color="bg-purple-600" icon={Maximize2} />
                                            <BlockItem isPressing={pressingBlockType === 'SPAWN_PARTICLES'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="SPAWN_PARTICLES" label="Partículas" color="bg-purple-600" icon={Zap} />
                                            <BlockItem isPressing={pressingBlockType === 'SET_TEXT'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="SET_TEXT" label="Texto" color="bg-purple-600" icon={MessageSquare} />
                                            <BlockItem isPressing={pressingBlockType === 'CAMERA_SHAKE'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="CAMERA_SHAKE" label="Agitar Cámara" color="bg-purple-600" icon={Vibrate} />
                                            <BlockItem isPressing={pressingBlockType === 'SET_CAMERA_ZOOM'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="SET_CAMERA_ZOOM" label="Zoom Cámara" color="bg-purple-600" icon={Maximize2} />
                                            <BlockItem isPressing={pressingBlockType === 'FLASH_EFFECT'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="FLASH_EFFECT" label="Parpadear (Flash)" color="bg-purple-600" icon={Sun} />
                                        </SidebarSection>
                                    )}
                                    {activeCategory === 'CONTROL' && (
                                        <SidebarSection title="Control" color="text-orange-500">
                                            <BlockItem isPressing={pressingBlockType === 'CREATE_OBJECT'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="CREATE_OBJECT" label="Crear Objeto" color="bg-green-600" icon={Copy} />
                                            <BlockItem isPressing={pressingBlockType === 'DESTROY'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="DESTROY" label="Destruir Objeto" color="bg-red-600" icon={Trash2} />
                                            <BlockItem isPressing={pressingBlockType === 'DAMAGE_OBJECT'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="DAMAGE_OBJECT" label="Dañar (Vida)" color="bg-red-600" icon={Activity} />
                                            <BlockItem isPressing={pressingBlockType === 'HEAL_OBJECT'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="HEAL_OBJECT" label="Curar (Vida)" color="bg-green-600" icon={Activity} />
                                            <BlockItem isPressing={pressingBlockType === 'MODIFY_VARIABLE'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="MODIFY_VARIABLE" label="Modificar Variable" color="bg-orange-600" icon={Activity} />
                                            <BlockItem isPressing={pressingBlockType === 'PLAY_SOUND'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="PLAY_SOUND" label="Sonido" color="bg-orange-600" icon={Volume2} />
                                            <BlockItem isPressing={pressingBlockType === 'CHANGE_SCENE'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="CHANGE_SCENE" label="Cambiar Escena" color="bg-orange-600" icon={Navigation} />
                                            <BlockItem isPressing={pressingBlockType === 'RESTART_SCENE'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="RESTART_SCENE" label="Reiniciar Nivel" color="bg-red-600" icon={RefreshCw} />
                                            <BlockItem isPressing={pressingBlockType === 'TOGGLE_BEHAVIOR'} onPointerDown={handleBlockPointerDown} onPointerMove={handleBlockPointerMove} onPointerUp={handleBlockPointerUp} mode="ACTION" type="TOGGLE_BEHAVIOR" label="Activar/Desactivar Comp." color="bg-orange-600" icon={Settings} />
                                        </SidebarSection>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: WORKSPACE (Drop Zone) */}
                    <div className="flex-1 bg-[#1e1e1e] relative overflow-hidden flex flex-col">
                        <div className="h-10 bg-[#252526] border-b border-[#333] flex items-center px-4 justify-between">
                            <div className="flex items-center space-x-2 text-xs text-gray-400">
                                <span>Editando Prototipo:</span>
                                <span className="text-white font-bold px-2 py-0.5 bg-orange-900/50 rounded">{selectedObject.name}</span>
                            </div>
                            <button onClick={() => setSelectedObjectId(null)} className="md:hidden text-gray-400"><X className="w-4 h-4" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                            {/* Empty State */}
                            {(!selectedObject.events || selectedObject.events.length === 0) && (
                                <div 
                                    className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 pointer-events-none"
                                    data-drop-zone="NEW_EVENT" 
                                >
                                    <div className="border-2 border-dashed border-gray-700 rounded-2xl p-8 md:p-12 flex flex-col items-center pointer-events-auto bg-[#252526]/50">
                                        <Zap className="w-12 h-12 mb-4 opacity-50" />
                                        <p className="font-bold text-sm">Arrastra un evento aquí</p>
                                        <p className="text-xs mt-2">Mantén pulsado un bloque de la izquierda</p>
                                    </div>
                                </div>
                            )}

                            {/* Drop Zone Layer for New Events */}
                            <div className="absolute inset-0 z-0" data-drop-zone="NEW_EVENT" />

                            {/* Event Stacks */}
                            <div className="space-y-4 relative z-10">
                                {(selectedObject.events || []).map((event) => {
                                    const isCollapsed = collapsedEvents[event.id];
                                    const conditionCount = event.conditions.length;
                                    const actionCount = event.actions.length;
                                    const summary = event.conditions.length > 0 ? event.conditions[0].type.replace(/_/g, ' ') : 'Nuevo Evento';

                                    return (
                                        <div key={event.id} className="bg-[#252526] border border-black/50 rounded-xl shadow-xl overflow-hidden w-full max-w-2xl mx-auto transition-all">
                                            
                                            {/* Header Bar (Always Visible) */}
                                            <div 
                                                className="bg-[#333] hover:bg-[#3a3a3a] p-2 flex items-center justify-between cursor-pointer border-b border-black/50 select-none"
                                                onClick={() => toggleEventCollapse(event.id)}
                                            >
                                                <div className="flex items-center space-x-2">
                                                    {isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">Bloque de Lógica</span>
                                                    {isCollapsed && (
                                                        <div className="flex items-center space-x-2 ml-4">
                                                            <span className="text-[10px] bg-yellow-600/20 text-yellow-500 px-2 rounded-full border border-yellow-600/30">{conditionCount} Si...</span>
                                                            <span className="text-[10px] bg-blue-600/20 text-blue-400 px-2 rounded-full border border-blue-600/30">{actionCount} Entonces...</span>
                                                            <span className="text-[10px] text-gray-500 italic border-l border-gray-600 pl-2 ml-2">{summary}...</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <button 
                                                    onClick={(e) => handleDeleteEvent(event.id, e)} 
                                                    className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-black/20"
                                                    title="Eliminar Bloque"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Collapsible Content */}
                                            {!isCollapsed && (
                                                <div className="p-2 animate-in slide-in-from-top-2 fade-in duration-200">
                                                    
                                                    {/* Conditions Area */}
                                                    <div className="mb-2">
                                                        <div className="text-[9px] font-bold text-yellow-500 mb-1 px-1 uppercase tracking-widest opacity-70">Condiciones (Si...)</div>
                                                        <div className="space-y-1">
                                                            {event.conditions.map((cond) => (
                                                                <div key={cond.id} className="bg-yellow-600 text-white p-2 rounded-lg flex items-center justify-between font-bold text-xs shadow-sm border-l-4 border-yellow-400 relative group">
                                                                    <div className="flex items-center space-x-2 flex-1 overflow-hidden">
                                                                        <div className="flex-1 min-w-0">{renderBlockContent(cond.type, cond.parameters, (p) => updateBlockParams(event.id, cond.id, p, true))}</div>
                                                                    </div>
                                                                    <button onClick={() => deleteBlock(event.id, cond.id, true)} className="opacity-0 group-hover:opacity-100 hover:text-red-900 transition-opacity p-1"><X className="w-3 h-3" /></button>
                                                                </div>
                                                            ))}
                                                            {event.conditions.length === 0 && (
                                                                <div className="text-[10px] text-yellow-600/50 border border-dashed border-yellow-600/30 rounded p-2 text-center">
                                                                    Arrastra condiciones amarillas aquí
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Divider */}
                                                    <div className="flex items-center justify-center my-2 opacity-30">
                                                        <ArrowLeft className="w-4 h-4 text-gray-500 -rotate-90" />
                                                    </div>

                                                    {/* Actions Area */}
                                                    <div className="min-h-[50px]" data-drop-zone="EVENT_STACK" data-event-id={event.id}>
                                                        <div className="text-[9px] font-bold text-blue-500 mb-1 px-1 uppercase tracking-widest opacity-70">Acciones (Entonces...)</div>
                                                        <div className="space-y-1 ml-4 border-l-2 border-dashed border-gray-700 pl-2">
                                                            {event.actions.map((action) => (
                                                                <div key={action.id} className="bg-blue-600 text-white p-2 rounded-lg flex items-center justify-between font-bold text-xs shadow-sm border-l-4 border-blue-400 relative group">
                                                                    <div className="flex items-center space-x-2 flex-1 overflow-hidden">
                                                                        <div className="flex-1 min-w-0">{renderBlockContent(action.type, action.parameters, (p) => updateBlockParams(event.id, action.id, p, false))}</div>
                                                                    </div>
                                                                    <button onClick={() => deleteBlock(event.id, action.id, false)} className="opacity-0 group-hover:opacity-100 hover:text-red-900 transition-opacity p-1"><X className="w-3 h-3" /></button>
                                                                </div>
                                                            ))}
                                                            <div className="text-[10px] text-blue-500/30 py-2 italic text-center">
                                                                Arrastra acciones azules aquí...
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                    <Puzzle className="w-16 h-16 mb-4 opacity-10" />
                    <p className="text-sm">Selecciona un objeto de la lista izquierda</p>
                    <p className="text-xs opacity-50">para empezar a programar con bloques.</p>
                </div>
            )}

            {/* DRAG GHOST */}
            {draggingBlock && (
                <div 
                    ref={dragGhostRef}
                    className={`fixed z-50 px-4 py-3 rounded-lg shadow-2xl ${draggingBlock.color} text-white font-bold text-sm pointer-events-none flex items-center space-x-2 ring-2 ring-white/50`}
                    style={{ left: pointerPos.x + 10, top: pointerPos.y + 10 }}
                >
                    {draggingBlock.icon && <draggingBlock.icon className="w-5 h-5" />}
                    <span>{draggingBlock.label}</span>
                </div>
            )}

            {/* DROP TARGET INDICATOR */}
            {dropTarget && draggingBlock && (
                <div 
                    className="fixed z-40 pointer-events-none bg-yellow-500/20 border-2 border-yellow-400 rounded-lg animate-pulse"
                    style={{
                        left: pointerPos.x - 50, top: pointerPos.y + 30, width: 200, height: 40,
                        display: (dropTarget.type === 'NEW_EVENT' && draggingBlock.mode === 'CONDITION') || (dropTarget.type === 'EVENT_STACK' && draggingBlock.mode === 'ACTION') ? 'block' : 'none'
                    }}
                >
                    <span className="absolute -top-6 left-0 bg-yellow-400 text-black text-[10px] font-bold px-2 rounded">
                        SOLTAR AQUÍ
                    </span>
                </div>
            )}
        </div>
    );
};
