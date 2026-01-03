
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GameObject, GameEvent, EventCondition, EventAction, ObjectType, Scene, Variable, BehaviorType } from '../types';
// Added User and Type to the imports from ./Icons
import { 
    Puzzle, Box, Hand, Trash2, Plus, Play, MonitorSmartphone, Timer, Ruler, Wind, Eye, Check, X,
    Move, Copy, MessageSquare, Vibrate, Navigation, Film, Settings, ChevronRight, Zap, RefreshCw,
    Activity, Crosshair, Volume2, Droplets, Maximize2, Palette, ChevronLeft, ArrowLeft, ArrowDown, Hash, 
    MapPin, Compass, Sun, ChevronDown, MousePointerClick, Sidebar, ChevronUp, List, RotateCw, Music, Sparkles,
    User, Type
} from './Icons';

interface BlockEditorProps {
    objects: GameObject[];
    scenes: Scene[];
    library: GameObject[];
    globalVariables: Variable[];
    onUpdateObject: (id: string, updates: Partial<GameObject>) => void;
}

type BlockCategory = 'EVENTS' | 'MOTION' | 'LOOKS' | 'SOUND' | 'CONTROL' | 'DATA' | 'PHYSICS';

// --- HELPER COMPONENTS ---

const InlineInput = ({ value, onChange, type = "text", className = "", width = "w-16", placeholder="" }: any) => (
    <input 
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) : e.target.value)}
        onPointerDown={(e) => e.stopPropagation()} 
        className={`bg-black/30 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white focus:bg-black/50 focus:border-blue-400 outline-none transition-colors ${width} ${className}`}
        placeholder={placeholder}
    />
);

const InlineSelect = ({ value, onChange, options, width = "w-28" }: any) => (
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

const BlockItem = ({ type, label, color, icon: Icon, mode, onPointerDown }: any) => (
    <div 
        onPointerDown={(e) => onPointerDown(e, { type, label, color, icon: Icon, mode })}
        className={`
            flex items-center space-x-1.5 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing mb-1 shadow-sm border select-none
            ${color} text-white font-bold text-[10px] leading-tight
            hover:brightness-110 transition-all active:scale-95 border-black/10
        `}
        style={{ touchAction: 'none' }} 
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
    const [isPaletteOpen, setIsPaletteOpen] = useState(true); 

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const toggleEventCollapse = (eventId: string) => {
        setCollapsedEvents(prev => ({ ...prev, [eventId]: !prev[eventId] }));
    };

    const [draggingBlock, setDraggingBlock] = useState<any>(null);
    const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });
    const [dropTarget, setDropTarget] = useState<any>(null);
    
    const selectedObject = library.find(o => o.id === selectedObjectId);
    const selectedObjectRef = useRef(selectedObject);
    useEffect(() => { selectedObjectRef.current = selectedObject; }, [selectedObject]);

    const availableObjects = [
        { value: 'SELF', label: 'Este Objeto' },
        { value: 'OTHER', label: 'El Otro' },
        ...library.map(o => ({ value: o.id, label: o.name }))
    ];
    const onlyLibraryObjects = library.map(o => ({ value: o.id, label: o.name }));
    const availableScenes = scenes.map(s => ({ value: s.id, label: s.name }));

    const getDefaultParams = (type: string) => {
        switch(type) {
            case 'PUSH_TO_ARRAY': return { varId: '', source: 'GLOBAL', value: 'Item' };
            case 'REMOVE_FROM_ARRAY': return { varId: '', source: 'GLOBAL', index: 0 };
            case 'CLEAR_ARRAY': return { varId: '', source: 'GLOBAL' };
            case 'REPEAT_X_TIMES': return { count: 10 };
            case 'CREATE_OBJECT': return { sourceObjectId: onlyLibraryObjects[0]?.value || '', spawnOrigin: 'SELF' };
            case 'TOUCH_INTERACTION': return { subtype: 'CLICK' };
            case 'EVERY_X_SECONDS': return { interval: 1 };
            case 'COLLISION': return { targetId: onlyLibraryObjects[0]?.value || '' };
            case 'MODIFY_VARIABLE': return { source: 'LOCAL', varId: 'puntos', operation: 'ADD', value: 1 };
            case 'MOVE_FORWARD': return { steps: 10 };
            case 'SET_VISIBLE': return { visible: true };
            case 'CHANGE_SCENE': return { sceneId: scenes[0]?.id || '' };
            case 'DESTROY': return { target: 'SELF' };
            case 'CAMERA_SHAKE': return { intensity: 10, duration: 0.5 };
            case 'PLAY_SOUND': return { soundAssetId: '', volume: 1 };
            case 'FLASH_EFFECT': return { duration: 0.5, color: '#ffffff' };
            case 'DAMAGE_OBJECT': return { amount: 1 };
            case 'HEAL_OBJECT': return { amount: 1 };
            case 'DISTANCE_TO': return { targetId: onlyLibraryObjects[0]?.value || '', distance: 100, operator: 'LESS' };
            case 'SET_COLOR': return { color: '#ffffff' };
            case 'APPLY_FORCE': return { forceX: 0, forceY: -500 };
            default: return {};
        }
    };

    const deleteBlock = (eventId: string, itemId: string, isCondition: boolean) => {
        if (!selectedObject) return;
        const newEvents = selectedObject.events.map(ev => {
            if (ev.id === eventId) {
                if (isCondition) return { ...ev, conditions: ev.conditions.filter(c => c.id !== itemId) };
                else return { ...ev, actions: ev.actions.filter(a => a.id !== itemId) };
            }
            return ev;
        });
        onUpdateObject(selectedObject.id, { events: newEvents });
    };

    const updateBlockParams = (eventId: string, itemId: string, newParams: any, isCondition: boolean) => {
        if (!selectedObject) return;
        const newEvents = selectedObject.events.map(ev => {
            if (ev.id === eventId) {
                if (isCondition) return { ...ev, conditions: ev.conditions.map(c => c.id === itemId ? { ...c, parameters: { ...c.parameters, ...newParams } } : c) };
                else return { ...ev, actions: ev.actions.map(a => a.id === itemId ? { ...a, parameters: { ...a.parameters, ...newParams } } : a) };
            }
            return ev;
        });
        onUpdateObject(selectedObject.id, { events: newEvents });
    };

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
                    const newEvent: GameEvent = { id: crypto.randomUUID(), conditions: [{ id: crypto.randomUUID(), type: blockData.type as any, parameters: defaultParams }], actions: [] };
                    onUpdateObject(currentObject.id, { events: [...(currentObject.events || []), newEvent] });
                } else if (finalZone.type === 'EVENT_STACK' && finalZone.eventId) {
                    const newAction: EventAction = { id: crypto.randomUUID(), type: blockData.type as any, parameters: defaultParams };
                    const newEvents = currentObject.events.map(e => e.id === finalZone.eventId ? { ...e, actions: [...e.actions, newAction] } : e);
                    onUpdateObject(currentObject.id, { events: newEvents });
                }
            }
            setDraggingBlock(null); setDropTarget(null);
            window.removeEventListener('pointermove', handleWindowMove);
            window.removeEventListener('pointerup', handleWindowUp);
        };
        window.addEventListener('pointermove', handleWindowMove);
        window.addEventListener('pointerup', handleWindowUp);
    }, [scenes, onlyLibraryObjects]); 

    const handleBlockPointerDown = (e: React.PointerEvent, blockData: any) => {
        e.stopPropagation();
        initiateDrag(blockData, e.clientX, e.clientY);
    };

    const renderBlockContent = (type: string, params: any, onChange: (p: any) => void) => {
        const safeParams = params || {};
        const availableArrays = globalVariables.filter(v => v.type === 'ARRAY').map(v => ({ value: v.name, label: v.name }));

        switch(type) {
            // --- DATA ---
            case 'PUSH_TO_ARRAY': return (
                <div className="flex items-center space-x-1">
                    <span>Añadir a lista</span>
                    <InlineSelect width="w-24" value={safeParams.varId} onChange={(v:any)=>onChange({varId:v})} options={availableArrays} />
                    <span>valor</span>
                    <InlineInput width="w-24" value={safeParams.value} onChange={(v:any)=>onChange({value:v})} placeholder="Item" />
                </div>
            );
            case 'REMOVE_FROM_ARRAY': return (
                <div className="flex items-center space-x-1">
                    <span>Quitar de lista</span>
                    <InlineSelect width="w-24" value={safeParams.varId} onChange={(v:any)=>onChange({varId:v})} options={availableArrays} />
                    <span>pos.</span>
                    <InlineInput width="w-8" type="number" value={safeParams.index} onChange={(v:any)=>onChange({index:v})} />
                </div>
            );
            case 'MODIFY_VARIABLE': return (
                <div className="flex items-center space-x-1">
                    <InlineSelect width="w-14" value={safeParams.operation} onChange={(v:any)=>onChange({operation:v})} options={[{value:'SET',label:'Fijar'},{value:'ADD',label:'Sumar'},{value:'SUB',label:'Restar'}]} />
                    <InlineSelect width="w-14" value={safeParams.source} onChange={(v:any)=>onChange({source:v})} options={[{value:'LOCAL',label:'Loc'},{value:'GLOBAL',label:'Glo'}]} />
                    <InlineInput width="w-16" value={safeParams.varId} onChange={(v:any)=>onChange({varId:v})} placeholder="Nombre" />
                    <span>a</span>
                    <InlineInput width="w-12" value={safeParams.value} onChange={(v:any)=>onChange({value:v})} />
                </div>
            );

            // --- CONTROL ---
            case 'REPEAT_X_TIMES': return (
                <div className="flex items-center space-x-1">
                    <span>Repetir</span>
                    <InlineInput width="w-12" type="number" value={safeParams.count} onChange={(v:any)=>onChange({count:v})} />
                    <span>veces</span>
                </div>
            );
            case 'CREATE_OBJECT': return (
                <div className="flex items-center space-x-1">
                    <span>Crear</span>
                    <InlineSelect width="w-24" value={safeParams.sourceObjectId} onChange={(v:any)=>onChange({sourceObjectId:v})} options={onlyLibraryObjects} />
                    <span>en</span>
                    <InlineSelect width="w-24" value={safeParams.spawnOrigin} onChange={(v:any)=>onChange({spawnOrigin:v})} options={availableObjects} />
                </div>
            );
            case 'DESTROY': return (
                <div className="flex items-center space-x-1">
                    <span>Destruir</span>
                    <InlineSelect width="w-24" value={safeParams.target} onChange={(v:any)=>onChange({target:v})} options={[{value:'SELF',label:'Este'},{value:'OTHER',label:'El Otro'}]} />
                </div>
            );
            case 'CHANGE_SCENE': return (
                <div className="flex items-center space-x-1">
                    <span>Ir a escena</span>
                    <InlineSelect width="w-24" value={safeParams.sceneId} onChange={(v:any)=>onChange({sceneId:v})} options={availableScenes} />
                </div>
            );

            // --- MOTION ---
            case 'MOVE_FORWARD': return <div className="flex items-center space-x-2"><span>Mover</span><InlineInput type="number" value={safeParams.steps} onChange={(v:any)=>onChange({steps:v})} /><span>pasos</span></div>;
            case 'SET_X': return <div className="flex items-center space-x-1"><span>X a</span><InlineInput type="number" value={safeParams.x} onChange={(v:any)=>onChange({x:v})} /></div>;
            case 'SET_Y': return <div className="flex items-center space-x-1"><span>Y a</span><InlineInput type="number" value={safeParams.y} onChange={(v:any)=>onChange({y:v})} /></div>;
            case 'APPLY_FORCE': return <div className="flex items-center space-x-1"><span>Impulso X</span><InlineInput type="number" value={safeParams.forceX} onChange={(v:any)=>onChange({forceX:v})} /><span>Y</span><InlineInput type="number" value={safeParams.forceY} onChange={(v:any)=>onChange({forceY:v})} /></div>;

            // --- LOOKS ---
            case 'SET_VISIBLE': return <div className="flex items-center space-x-2"><span>Visible:</span><InlineSelect width="w-16" value={safeParams.visible} onChange={(v:any)=>onChange({visible: v === 'true'})} options={[{value:'true',label:'SÍ'},{value:'false',label:'NO'}]} /></div>;
            case 'PLAY_ANIMATION': return <div className="flex items-center space-x-2"><span>Animación</span><InlineInput width="w-24" value={safeParams.animName} onChange={(v:any)=>onChange({animName:v})} placeholder="Ej: Correr" /></div>;
            case 'FLASH_EFFECT': return <div className="flex items-center space-x-1"><span>Efecto Flash</span><InlineInput type="number" value={safeParams.duration} onChange={(v:any)=>onChange({duration:v})} /><span>seg.</span></div>;

            // --- SOUND / FX ---
            case 'CAMERA_SHAKE': return <div className="flex items-center space-x-1"><span>Agitar cámara int.</span><InlineInput type="number" value={safeParams.intensity} onChange={(v:any)=>onChange({intensity:v})} /></div>;
            case 'PLAY_SOUND': return <div className="flex items-center space-x-1"><span>Sonido ID</span><InlineInput width="w-20" value={safeParams.soundAssetId} onChange={(v:any)=>onChange({soundAssetId:v})} /></div>;

            // --- CONDITIONS ---
            case 'TOUCH_INTERACTION': return <div className="flex items-center space-x-2"><span>Al</span><InlineSelect width="w-24" value={safeParams.subtype} onChange={(v:any)=>onChange({subtype:v})} options={[{value:'CLICK', label:'Hacer Clic'},{value:'LONG_PRESS', label:'Mantener'},{value:'DRAG', label:'Arrastrar'}]} /></div>;
            case 'COLLISION': return <div className="flex items-center space-x-2"><span>Choca con</span><InlineSelect width="w-24" value={safeParams.targetId} onChange={(v:any)=>onChange({targetId:v})} options={onlyLibraryObjects} /></div>;
            case 'EVERY_X_SECONDS': return <div className="flex items-center space-x-1"><span>Cada</span><InlineInput type="number" value={safeParams.interval} onChange={(v:any)=>onChange({interval:v})} /><span>segundos</span></div>;
            case 'DISTANCE_TO': return <div className="flex items-center space-x-1"><span>Dist. a</span><InlineSelect width="w-20" value={safeParams.targetId} onChange={(v:any)=>onChange({targetId:v})} options={onlyLibraryObjects} /><span>es</span><InlineSelect width="w-14" value={safeParams.operator} onChange={(v:any)=>onChange({operator:v})} options={[{value:'LESS',label:'<'},{value:'GREATER',label:'>'}]} /><InlineInput type="number" value={safeParams.distance} onChange={(v:any)=>onChange({distance:v})} /></div>;

            default: return <span>{type.replace(/_/g, ' ')}</span>;
        }
    };

    return (
        <div className="flex w-full h-full bg-[#1e1e1e] overflow-hidden font-sans relative">
            {/* Sidebar de Objetos */}
            <div className={`flex-col bg-[#252526] border-r border-[#333] z-20 transition-all duration-300 ${selectedObjectId ? 'hidden md:flex md:w-48' : 'flex w-full md:w-48'}`}>
                <div className="p-4 border-b border-[#333] flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Librería</span>
                    <Puzzle className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {library.map(obj => (
                        <button key={obj.id} onClick={() => setSelectedObjectId(obj.id)} className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all border ${selectedObjectId === obj.id ? 'bg-orange-900/20 border-orange-500/30 text-white' : 'bg-[#2a2d2e] text-gray-400 border-transparent hover:bg-[#333]'}`}>
                            <div className="w-8 h-8 bg-black/40 rounded flex items-center justify-center shrink-0 border border-dashed border-gray-600">
                                {obj.type === ObjectType.PLAYER ? <User className="w-4 h-4 text-green-400"/> : <Box className="w-4 h-4 text-blue-400"/>}
                            </div>
                            <span className="text-xs font-bold truncate">{obj.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {selectedObject ? (
                <div className="flex-1 flex h-full relative">
                    {/* Paleta de Categorías */}
                    <div className={`flex flex-row border-r border-[#333] z-20 relative bg-[#333333] transition-all duration-300 ${isPaletteOpen ? 'w-64' : 'w-16'}`}>
                        <div className="flex flex-col w-16 bg-[#252526] border-r border-black/20 items-center py-2 space-y-2 shrink-0 z-20">
                            <button onClick={() => setIsPaletteOpen(!isPaletteOpen)} className="mb-4 p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700">{isPaletteOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</button>
                            <button onClick={() => setActiveCategory('EVENTS')} className={`p-3 rounded-lg ${activeCategory === 'EVENTS' ? 'bg-yellow-600 text-white' : 'text-gray-500 hover:text-white hover:bg-gray-700'}`} title="Eventos"><Zap className="w-6 h-6" /></button>
                            <button onClick={() => setActiveCategory('MOTION')} className={`p-3 rounded-lg ${activeCategory === 'MOTION' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white hover:bg-gray-700'}`} title="Movimiento"><Move className="w-6 h-6" /></button>
                            <button onClick={() => setActiveCategory('LOOKS')} className={`p-3 rounded-lg ${activeCategory === 'LOOKS' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white hover:bg-gray-700'}`} title="Apariencia"><Eye className="w-6 h-6" /></button>
                            <button onClick={() => setActiveCategory('SOUND')} className={`p-3 rounded-lg ${activeCategory === 'SOUND' ? 'bg-pink-600 text-white' : 'text-gray-500 hover:text-white hover:bg-gray-700'}`} title="Sonido y FX"><Music className="w-6 h-6" /></button>
                            <button onClick={() => setActiveCategory('CONTROL')} className={`p-3 rounded-lg ${activeCategory === 'CONTROL' ? 'bg-orange-600 text-white' : 'text-gray-500 hover:text-white hover:bg-gray-700'}`} title="Control"><Settings className="w-6 h-6" /></button>
                            <button onClick={() => setActiveCategory('DATA')} className={`p-3 rounded-lg ${activeCategory === 'DATA' ? 'bg-green-600 text-white' : 'text-gray-500 hover:text-white hover:bg-gray-700'}`} title="Inventario y Listas"><List className="w-6 h-6" /></button>
                            <button onClick={() => setActiveCategory('PHYSICS')} className={`p-3 rounded-lg ${activeCategory === 'PHYSICS' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-white hover:bg-gray-700'}`} title="Física"><Wind className="w-6 h-6" /></button>
                        </div>
                        
                        {isPaletteOpen && (
                            <div className="flex-1 overflow-y-auto p-2 bg-[#2a2a2a] custom-scrollbar">
                                {activeCategory === 'EVENTS' && (
                                    <SidebarSection title="Si Ocurre..." color="text-yellow-500">
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="CONDITION" type="START_OF_SCENE" label="Al empezar nivel" color="bg-yellow-600" icon={Play} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="CONDITION" type="TOUCH_INTERACTION" label="Interacción Táctil" color="bg-yellow-600" icon={Hand} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="CONDITION" type="COLLISION" label="Al chocar con..." color="bg-yellow-600" icon={Box} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="CONDITION" type="EVERY_X_SECONDS" label="Temporizador" color="bg-yellow-600" icon={Timer} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="CONDITION" type="DISTANCE_TO" label="Distancia a..." color="bg-yellow-600" icon={Ruler} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="CONDITION" type="KEY_PRESSED" label="Tecla presionada" color="bg-yellow-600" icon={MonitorSmartphone} />
                                    </SidebarSection>
                                )}
                                {activeCategory === 'MOTION' && (
                                    <SidebarSection title="Movimiento" color="text-blue-500">
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="MOVE_FORWARD" label="Mover Pasos" color="bg-blue-600" icon={Move} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="SET_X" label="Fijar X" color="bg-blue-600" icon={Move} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="SET_Y" label="Fijar Y" color="bg-blue-600" icon={Move} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="SET_ROTATION" label="Fijar Rotación" color="bg-blue-600" icon={RotateCw} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="POINT_TOWARDS_POINT" label="Mirar a punto" color="bg-blue-600" icon={Crosshair} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="STOP_MOVEMENT" label="Detener" color="bg-blue-600" icon={X} />
                                    </SidebarSection>
                                )}
                                {activeCategory === 'LOOKS' && (
                                    <SidebarSection title="Apariencia" color="text-purple-500">
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="SET_VISIBLE" label="Mostrar/Ocultar" color="bg-purple-600" icon={Eye} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="PLAY_ANIMATION" label="Reproducir Anim" color="bg-purple-600" icon={Film} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="FLASH_EFFECT" label="Efecto Flash" color="bg-purple-600" icon={Sparkles} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="SET_TEXT" label="Cambiar Texto" color="bg-purple-600" icon={Type} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="SET_COLOR" label="Cambiar Color" color="bg-purple-600" icon={Palette} />
                                    </SidebarSection>
                                )}
                                {activeCategory === 'SOUND' && (
                                    <SidebarSection title="Sonidos y FX" color="text-pink-500">
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="PLAY_SOUND" label="Reproducir Sonido" color="bg-pink-600" icon={Volume2} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="CAMERA_SHAKE" label="Agitar Cámara" color="bg-pink-600" icon={Vibrate} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="SPAWN_PARTICLES" label="Soltar Partículas" color="bg-pink-600" icon={Sparkles} />
                                    </SidebarSection>
                                )}
                                {activeCategory === 'CONTROL' && (
                                    <SidebarSection title="Flujo de Control" color="text-orange-500">
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="REPEAT_X_TIMES" label="Bucle Repetir" color="bg-orange-600" icon={RefreshCw} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="CREATE_OBJECT" label="Crear Objeto" color="bg-orange-600" icon={Copy} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="DESTROY" label="Destruir Objeto" color="bg-red-600" icon={Trash2} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="CHANGE_SCENE" label="Ir a Escena" color="bg-orange-600" icon={Navigation} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="RESTART_SCENE" label="Reiniciar Nivel" color="bg-red-600" icon={RefreshCw} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="TOGGLE_BEHAVIOR" label="Activar Comporta." color="bg-orange-600" icon={Activity} />
                                    </SidebarSection>
                                )}
                                {activeCategory === 'DATA' && (
                                    <SidebarSection title="Inventario y Datos" color="text-green-500">
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="PUSH_TO_ARRAY" label="Añadir a Lista" color="bg-green-600" icon={Plus} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="REMOVE_FROM_ARRAY" label="Borrar de Lista" color="bg-green-600" icon={Trash2} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="CLEAR_ARRAY" label="Vaciar Lista" color="bg-green-600" icon={RefreshCw} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="MODIFY_VARIABLE" label="Modificar Variable" color="bg-green-600" icon={Hash} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="CONDITION" type="ARRAY_CONTAINS" label="Si lista contiene..." color="bg-green-700" icon={List} />
                                    </SidebarSection>
                                )}
                                {activeCategory === 'PHYSICS' && (
                                    <SidebarSection title="Física" color="text-indigo-500">
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="APPLY_FORCE" label="Aplicar Fuerza" color="bg-indigo-600" icon={Wind} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="SET_VELOCITY" label="Fijar Velocidad" color="bg-indigo-600" icon={Activity} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="DAMAGE_OBJECT" label="Dañar Salud" color="bg-red-600" icon={Activity} />
                                        <BlockItem onPointerDown={handleBlockPointerDown} mode="ACTION" type="HEAL_OBJECT" label="Curar Salud" color="bg-green-600" icon={Activity} />
                                    </SidebarSection>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Espacio de Trabajo */}
                    <div className="flex-1 bg-[#1e1e1e] relative overflow-hidden flex flex-col">
                        <div className="h-10 bg-[#252526] border-b border-[#333] flex items-center px-4 justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="bg-orange-600 text-[10px] px-1.5 rounded font-black text-white">LÓGICA</span>
                                <span className="text-white font-bold text-xs">{selectedObject.name}</span>
                            </div>
                            <button onClick={() => setSelectedObjectId(null)} className="md:hidden text-gray-400"><X className="w-4 h-4" /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative" data-drop-zone="NEW_EVENT">
                            <div className="space-y-6 relative z-10 w-full max-w-3xl mx-auto pb-24">
                                {(selectedObject.events || []).map((event) => (
                                    <div key={event.id} className="bg-[#252526] border border-black/50 rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/5 animate-in slide-in-from-top-4 duration-300">
                                        <div className="bg-[#333] p-2.5 flex items-center justify-between cursor-pointer border-b border-black/50" onClick={() => toggleEventCollapse(event.id)}>
                                            <div className="flex items-center space-x-2">
                                                {collapsedEvents[event.id] ? <ChevronRight className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-tighter">SI ESTO PASA...</span>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); onUpdateObject(selectedObject.id, { events: selectedObject.events.filter(ev => ev.id !== event.id) }); }} className="text-gray-500 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                        {!collapsedEvents[event.id] && (
                                            <div className="p-3 space-y-3">
                                                <div className="space-y-1.5 min-h-[40px]">
                                                    {event.conditions.map((cond) => (
                                                        <div key={cond.id} className="bg-yellow-600/90 text-white p-2.5 rounded-lg flex items-center justify-between font-bold text-xs shadow-lg border-l-4 border-yellow-400 group">
                                                            <div className="flex-1 overflow-hidden">{renderBlockContent(cond.type, cond.parameters, (p) => updateBlockParams(event.id, cond.id, p, true))}</div>
                                                            <button onClick={() => deleteBlock(event.id, cond.id, true)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/20 rounded ml-2"><X className="w-3.5 h-3.5" /></button>
                                                        </div>
                                                    ))}
                                                    {event.conditions.length === 0 && (
                                                        <div className="text-[9px] text-gray-500 italic p-2 text-center border border-dashed border-gray-700 rounded-lg">Arrastra un evento amarillo aquí</div>
                                                    )}
                                                </div>
                                                
                                                <div className="flex items-center space-x-2 px-1">
                                                     <div className="h-px bg-white/5 flex-1"></div>
                                                     <ArrowDown className="w-3 h-3 text-white/20" />
                                                     <div className="h-px bg-white/5 flex-1"></div>
                                                </div>

                                                <div className="min-h-[60px] space-y-1.5" data-drop-zone="EVENT_STACK" data-event-id={event.id}>
                                                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-tighter px-1 mb-1">HACER ESTO...</div>
                                                    {event.actions.map((action) => (
                                                        <div key={action.id} className={`p-2.5 rounded-lg flex items-center justify-between font-bold text-xs shadow-lg border-l-4 group text-white ${action.type === 'REPEAT_X_TIMES' ? 'bg-orange-600 border-orange-400' : 'bg-blue-600 border-blue-400'}`}>
                                                            <div className="flex-1 overflow-hidden">{renderBlockContent(action.type, action.parameters, (p) => updateBlockParams(event.id, action.id, p, false))}</div>
                                                            <button onClick={() => deleteBlock(event.id, action.id, false)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-black/20 rounded ml-2"><X className="w-3.5 h-3.5" /></button>
                                                        </div>
                                                    ))}
                                                    <div className="text-[10px] text-blue-500/30 py-6 italic text-center border-2 border-dashed border-blue-900/20 rounded-xl mt-2">
                                                        Arrastra acciones aquí (Mover, Sonido, Inventario...)
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                
                                {selectedObject.events?.length === 0 && (
                                    <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                        <Zap className="w-12 h-12 text-white/5 mx-auto mb-4" />
                                        <p className="text-gray-500 text-sm">El espacio está vacío</p>
                                        <p className="text-xs text-gray-600 mt-1">Arrastra un bloque amarillo del panel lateral para empezar</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-8 text-center bg-[#1e1e1e]">
                    <div className="bg-orange-600/10 p-6 rounded-full mb-4">
                        <Puzzle className="w-16 h-16 opacity-20 text-orange-500" />
                    </div>
                    <p className="text-sm font-bold text-gray-400">Selecciona un objeto de la izquierda</p>
                    <p className="text-xs text-gray-600 mt-2 max-w-xs leading-relaxed">Cada objeto en tu juego puede tener su propia lógica visual. Usa los bloques para crear movimientos, colisiones y sistemas complejos sin escribir una sola línea de código.</p>
                </div>
            )}

            {/* Bloque Fantasma al Arrastrar */}
            {draggingBlock && (
                <div 
                    className={`fixed z-[1000] px-4 py-2.5 rounded-xl shadow-2xl ${draggingBlock.color} text-white font-bold text-xs pointer-events-none flex items-center space-x-2 ring-4 ring-white/20`}
                    style={{ left: pointerPos.x + 15, top: pointerPos.y + 15 }}
                >
                    {draggingBlock.icon && <draggingBlock.icon className="w-4 h-4" />}
                    <span>{draggingBlock.label}</span>
                </div>
            )}

            {/* Indicador de Zona de Soltado */}
            {dropTarget && draggingBlock && (
                <div 
                    className={`fixed z-40 pointer-events-none rounded-xl animate-pulse flex items-center justify-center border-4 border-dashed ${draggingBlock.mode === 'CONDITION' ? 'bg-yellow-500/10 border-yellow-500' : 'bg-blue-500/10 border-blue-500'}`}
                    style={{ 
                        left: pointerPos.x - 120, 
                        top: pointerPos.y + 30, 
                        width: 240, 
                        height: 50 
                    }}
                >
                    <span className={`text-[10px] font-black uppercase ${draggingBlock.mode === 'CONDITION' ? 'text-yellow-500' : 'text-blue-500'}`}>SOLTAR AQUÍ</span>
                </div>
            )}
        </div>
    );
};
