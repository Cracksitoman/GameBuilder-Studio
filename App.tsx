
import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { ObjectLibrary } from './components/ObjectLibrary';
import { Canvas } from './components/Canvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { LayersPanel } from './components/LayersPanel'; 
import { EditObjectModal } from './components/EditObjectModal';
import { GamePreviewModal } from './components/GamePreviewModal';
import { ExportModal } from './components/ExportModal'; 
import { AssetManagerModal } from './components/AssetManagerModal';
import { SaveProjectModal } from './components/SaveProjectModal'; 
import { StartScreen } from './components/StartScreen'; 
import { EventSheet } from './components/EventSheet'; 
import { VariableManagerModal } from './components/VariableManagerModal'; 
import { SceneManagerModal } from './components/SceneManagerModal'; 
import { CameraSettingsModal } from './components/CameraSettingsModal'; 
import { ScriptEditorModal } from './components/ScriptEditorModal'; 
import { DocumentationPage } from './components/DocumentationPage'; 
import { MobileSettingsModal } from './components/MobileSettingsModal'; 
import { WorldSettingsModal } from './components/WorldSettingsModal'; 
import { BlockEditor } from './components/BlockEditor'; 
import { GameObject, ObjectType, EditorTool, CanvasConfig, Layer, Asset, Variable, Scene, CameraConfig, MobileControlsConfig } from './types';
import { Layers, Plus, Settings, Box, Move, Maximize, Hand, ArrowRight, Layout, Workflow, Grid3x3, Menu, ChevronLeft, Clapperboard, Variable as VariableIcon, Video, Smartphone, MonitorSmartphone, Home, Puzzle, Map } from './components/Icons';

// Default Mobile Controls
const DEFAULT_MOBILE_CONTROLS: MobileControlsConfig = {
    enabled: true,
    joystickX: 15,
    joystickY: 80,
    joystickSize: 150,
    buttonX: 85,
    buttonY: 80,
    buttonSize: 100,
    opacity: 0.6,
    color: '#ffffff'
};

// Helper to create object - UPDATED TO 32px
const createInitialObject = (type: ObjectType, count: number): GameObject => {
  const base: Partial<GameObject> = {
    id: crypto.randomUUID(),
    zIndex: 1,
    layerId: 'base', 
    visible: true,
    opacity: 1,
    rotation: 0,
    isObstacle: false,
    isGui: false,
    behaviors: [],
    events: [],
    variables: [],
    group: undefined
  };

  switch (type) {
    case ObjectType.TEXT:
      return { ...base, name: 'Texto Nuevo', type: ObjectType.TEXT, x: 0, y: 0, width: 120, height: 32, color: '#ffffff' } as GameObject;
    case ObjectType.PLAYER:
       return { ...base, name: `Jugador ${count}`, type: ObjectType.PLAYER, x: 0, y: 0, width: 32, height: 32, color: '#22c55e' } as GameObject;
    case ObjectType.ENEMY:
      return { ...base, name: `Enemigo ${count}`, type: ObjectType.ENEMY, x: 0, y: 0, width: 32, height: 32, color: '#ef4444' } as GameObject;
    case ObjectType.TILEMAP:
        return { ...base, name: `Mapa ${count}`, type: ObjectType.TILEMAP, x: 0, y: 0, width: 320, height: 320, color: 'transparent', tilemap: { tileSize: 32, tiles: {} } } as GameObject;
    case ObjectType.UI_BUTTON:
        return { ...base, name: `Botón ${count}`, type: ObjectType.UI_BUTTON, x: 0, y: 0, width: 32, height: 32, color: '#f59e0b', isGui: true, isObstacle: false } as GameObject;
    default:
      return { ...base, name: `Sprite ${count}`, type: ObjectType.SPRITE, x: 0, y: 0, width: 32, height: 32, color: '#3b82f6', isObstacle: true } as GameObject;
  }
};

type ActivePanel = 'none' | 'library' | 'properties' | 'layers';
type ViewState = 'START' | 'EDITOR' | 'DOCS'; 
type EditorMode = 'SCENE' | 'EVENTS' | 'BLOCKS';

export const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('START');
  const [editorMode, setEditorMode] = useState<EditorMode>('SCENE'); 
  const [projectName, setProjectName] = useState("Nuevo Proyecto Koda");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentSceneId, setCurrentSceneId] = useState<string>('');
  
  const [library, setLibrary] = useState<GameObject[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]); 
  const [globalVariables, setGlobalVariables] = useState<Variable[]>([]); 

  const [past, setPast] = useState<Scene[][]>([]);
  const [future, setFuture] = useState<Scene[][]>([]);

  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [currentTool, setCurrentTool] = useState<EditorTool>(EditorTool.SELECT);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [activeBrushId, setActiveBrushId] = useState<string | null>(null);
  const [brushSolid, setBrushSolid] = useState<boolean>(false); 
  
  const [dragProxy, setDragProxy] = useState<{ obj: GameObject, x: number, y: number } | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(32);
  const [viewPos, setViewPos] = useState({ x: 0, y: 0 }); 
  const [zoom, setZoom] = useState(0.8); 

  const [canvasConfig, setCanvasConfig] = useState<CanvasConfig>({ 
      width: 800, 
      height: 450, 
      mode: 'LANDSCAPE',
      mobileControls: DEFAULT_MOBILE_CONTROLS 
  });

  const [editingObject, setEditingObject] = useState<GameObject | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAssetManagerOpen, setIsAssetManagerOpen] = useState(false);
  const [assetManagerMode, setAssetManagerMode] = useState<'GALLERY' | 'SHEET_SLICER'>('GALLERY'); 
  
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isVarManagerOpen, setIsVarManagerOpen] = useState(false); 
  const [isSceneManagerOpen, setIsSceneManagerOpen] = useState(false); 
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false); 
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false); 
  const [isWorldSettingsOpen, setIsWorldSettingsOpen] = useState(false); 
  
  const [isScriptEditorOpen, setIsScriptEditorOpen] = useState(false);
  const [scriptEditingObjectId, setScriptEditingObjectId] = useState<string | null>(null);
  const [assetSelectionCallback, setAssetSelectionCallback] = useState<((url: string | string[]) => void) | null>(null);

  const currentScene = scenes.find(s => s.id === currentSceneId);
  const objects = currentScene ? currentScene.objects : [];
  const layers = currentScene ? currentScene.layers : [];
  const groups = currentScene ? (currentScene.groups || []) : []; 
  const cameraConfig = currentScene?.camera || { targetObjectId: null, smooth: true, followSpeed: 0.1 };

  useEffect(() => {
      const isLibraryObj = library.some(o => o.id === selectedObjectId);
      if (isLibraryObj) {
          setActivePanel('properties');
      }
  }, [selectedObjectId, library]);

  useEffect(() => {
      if (currentScene && currentScene.layers.length > 0) {
          const exists = currentScene.layers.find(l => l.id === activeLayerId);
          if (!exists) setActiveLayerId(currentScene.layers[currentScene.layers.length - 1].id);
      }
  }, [currentSceneId, scenes]);

  const selectedObject = objects.find(o => o.id === selectedObjectId) || library.find(o => o.id === selectedObjectId) || null;

  useEffect(() => {
      if (!dragProxy) return;
      const handleGlobalMove = (e: PointerEvent) => {
          setDragProxy(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
      };
      const handleGlobalUp = (e: PointerEvent) => {
          const stageArea = document.getElementById('koda-stage-area');
          if (stageArea && dragProxy) {
              // PRECISE COORDINATE MATH
              // 1. Center of viewport (relative to which we translate in Canvas.tsx)
              const cx = window.innerWidth / 2;
              const cy = window.innerHeight / 2;
              
              // 2. Relative distance from center, including view pan and zoom
              // Canvas.tsx does: translate(viewPos.x * zoom, viewPos.y * zoom) scale(zoom)
              const relX = (e.clientX - cx) / zoom - viewPos.x;
              const relY = (e.clientY - cy) / zoom - viewPos.y;

              // 3. Coordinate translation: The Game Box is centered at world (0,0) via translate(-50%, -50%)
              // So top-left of the box is at -width/2, -height/2
              const worldW = currentScene?.width || canvasConfig.width;
              const worldH = currentScene?.height || canvasConfig.height;

              const dropX = relX + (worldW / 2);
              const dropY = relY + (worldH / 2);

              handleObjectDropOnCanvas(dragProxy.obj.id, dropX, dropY); 
          }
          setDragProxy(null);
      };
      window.addEventListener('pointermove', handleGlobalMove);
      window.addEventListener('pointerup', handleGlobalUp);
      return () => {
          window.removeEventListener('pointermove', handleGlobalMove);
          window.removeEventListener('pointerup', handleGlobalUp);
      };
  }, [dragProxy, zoom, viewPos, canvasConfig, currentScene]);

  const handleStartDragFromLibrary = (e: React.PointerEvent, obj: GameObject) => {
      setActivePanel('none');
      setDragProxy({ obj, x: e.clientX, y: e.clientY });
  };

  const recordHistory = () => {
      setPast(prev => [...prev, scenes]);
      setFuture([]); 
  };

  const performUndo = () => {
      if (past.length === 0) return;
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      setFuture(prev => [scenes, ...prev]);
      setScenes(previous);
      setPast(newPast);
  };

  const performRedo = () => {
      if (future.length === 0) return;
      const next = future[0];
      const newFuture = future.slice(1);
      setPast(prev => [...prev, scenes]);
      setScenes(next);
      setFuture(newFuture);
  };

  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (isAssetManagerOpen) return; 
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
              e.preventDefault();
              performUndo();
          }
          if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
              e.preventDefault();
              performRedo();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [past, future, scenes, isAssetManagerOpen]);


  const updateCurrentScene = (updates: Partial<Scene>, skipHistory = false) => {
      if (!skipHistory) recordHistory();
      setScenes(prev => prev.map(s => s.id === currentSceneId ? { ...s, ...updates } : s));
  };

  const handleUpdateObjectAnywhere = (id: string, updates: Partial<GameObject>, skipHistory = false) => {
      if (currentScene && currentScene.objects.some(o => o.id === id)) {
          if (!skipHistory) recordHistory();
          const newObjects = currentScene.objects.map(obj => obj.id === id ? { ...obj, ...updates } : obj);
          setScenes(prev => prev.map(s => s.id === currentSceneId ? { ...s, objects: newObjects } : s));
          return;
      }
      const libraryObj = library.find(o => o.id === id);
      if (libraryObj) {
          setLibrary(prev => prev.map(obj => obj.id === id ? { ...obj, ...updates } : obj));
          setScenes(prevScenes => prevScenes.map(scene => ({
              ...scene,
              objects: scene.objects.map(obj => {
                  if (obj.prototypeId === id) {
                      const { x, y, id: instanceId, layerId, zIndex, ...restUpdates } = updates as any;
                      return { ...obj, ...restUpdates };
                  }
                  return obj;
              })
          })));
      }
  };
  
  const handleUpdateCamera = (config: CameraConfig) => updateCurrentScene({ camera: config });

  const handleOpenScriptEditor = (objectId: string) => {
      setScriptEditingObjectId(objectId);
      setIsScriptEditorOpen(true);
  };

  const handleSaveScript = (code: string) => {
      if (scriptEditingObjectId) {
          handleUpdateObjectAnywhere(scriptEditingObjectId, { script: code });
      }
      setIsScriptEditorOpen(false);
  };

  const handleNewProject = () => {
      const firstSceneId = crypto.randomUUID();
      const firstLayerId = 'layer-base';
      const initialScene: Scene = {
          id: firstSceneId,
          name: 'Escena 1',
          backgroundColor: '#111827',
          objects: [],
          layers: [{ id: firstLayerId, name: 'Capa Base', visible: true, locked: false }],
          camera: { targetObjectId: null, smooth: true, followSpeed: 0.1 },
          groups: [],
          width: 800,
          height: 450
      };
      setScenes([initialScene]);
      setCurrentSceneId(firstSceneId);
      setActiveLayerId(firstLayerId); 
      setLibrary([]); 
      setAssets([]);
      setGlobalVariables([]);
      setPast([]); setFuture([]); 
      setCanvasConfig({ 
          width: 800, 
          height: 450, 
          mode: 'LANDSCAPE',
          mobileControls: DEFAULT_MOBILE_CONTROLS
      });
      setProjectName("Nuevo Proyecto Koda");
      setViewState('EDITOR');
  };

  const handleLoadProject = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const json = JSON.parse(e.target?.result as string);
              let loadedScenes = json.scenes || (json.objects && json.layers ? [{ id: crypto.randomUUID(), name: 'Escena 1', objects: json.objects, layers: json.layers, backgroundColor: '#111827' }] : []);
              if (loadedScenes.length > 0 && json.canvasConfig) {
                  setScenes(loadedScenes);
                  setCurrentSceneId(loadedScenes[0].id);
                  if (loadedScenes[0].layers.length > 0) setActiveLayerId(loadedScenes[0].layers[loadedScenes[0].layers.length - 1].id);
                  setCanvasConfig(json.canvasConfig);
                  setLibrary(json.library || []); 
                  setAssets(json.assets || []); 
                  setGlobalVariables(json.globalVariables || []);
                  setProjectName(json.metadata?.name || file.name.replace(/\.[^/.]+$/, ""));
                  setPast([]); setFuture([]);
                  setViewState('EDITOR');
              } else alert("Proyecto inválido.");
          } catch (err) { alert("Error al cargar."); }
      };
      reader.readAsText(file);
  };

  const handleConfirmSave = (name: string) => {
      setProjectName(name); 
      const gameData = { metadata: { name, version: "2.5", timestamp: Date.now() }, scenes, library, canvasConfig, assets, globalVariables };
      const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(gameData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${name}.gbs`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      setIsSaveModalOpen(false);
  };

  const handleToggleOrientation = () => setCanvasConfig(prev => prev.mode === 'LANDSCAPE' ? { ...prev, width: 450, height: 800, mode: 'PORTRAIT' } : { ...prev, width: 800, height: 450, mode: 'LANDSCAPE' });

  const handleAddObjectToLibrary = (type: ObjectType) => {
    const newObj = createInitialObject(type, library.length + 1);
    setLibrary(prev => [...prev, newObj]);
    setSelectedObjectId(newObj.id);
  };

  const handleObjectDropOnCanvas = (libraryId: string, x: number, y: number) => {
      if (!currentScene) return;
      const prototype = library.find(o => o.id === libraryId);
      if (!prototype) return;
      recordHistory();
      const targetLayerId = activeLayerId || layers[layers.length - 1].id;
      
      let finalX = x - (prototype.width / 2);
      let finalY = y - (prototype.height / 2);
      
      if (showGrid) {
          finalX = Math.round(finalX / gridSize) * gridSize;
          finalY = Math.round(finalY / gridSize) * gridSize;
      }

      const newInstance: GameObject = {
          ...JSON.parse(JSON.stringify(prototype)), 
          id: crypto.randomUUID(), 
          prototypeId: prototype.id, 
          x: Math.round(finalX), 
          y: Math.round(finalY),
          layerId: targetLayerId
      };
      setScenes(prev => prev.map(s => s.id === currentSceneId ? { ...s, objects: [...s.objects, newInstance] } : s));
      setSelectedObjectId(newInstance.id);
  };

  const handleDeleteObject = (id: string) => {
      if (currentScene && currentScene.objects.some(o => o.id === id)) {
          recordHistory();
          setScenes(prev => prev.map(s => s.id === currentSceneId ? { ...s, objects: s.objects.filter(o => o.id !== id) } : s));
          if(selectedObjectId === id) setSelectedObjectId(null);
          return;
      }
      if (library.some(o => o.id === id)) {
          if (confirm("¿Borrar este objeto de la librería? Esto no afectará a los objetos ya colocados en la escena.")) {
              setLibrary(prev => prev.filter(o => o.id !== id));
              if(selectedObjectId === id) setSelectedObjectId(null);
          }
      }
  };

  const handleAddGroup = (name: string) => {
      if(!currentScene || (currentScene.groups || []).includes(name)) return;
      setScenes(prev => prev.map(s => s.id === currentSceneId ? { ...s, groups: [...(s.groups || []), name] } : s));
  };

  const handleDeleteGroup = (name: string) => {
      if(!currentScene) return;
      setLibrary(prev => prev.map(o => o.group === name ? { ...o, group: undefined } : o));
      const newGroups = (currentScene.groups || []).filter(g => g !== name);
      setScenes(prev => prev.map(s => s.id === currentSceneId ? { ...s, groups: newGroups } : s));
  };

  const handleAssignToGroup = (objectId: string, groupName: string) => {
      const targetGroup = groupName === 'Sin Agrupar' ? undefined : groupName;
      handleUpdateObjectAnywhere(objectId, { group: targetGroup });
  };

  const handleSetBrush = (tool: EditorTool, assetId: string | null) => {
    setCurrentTool(tool);
    setActiveBrushId(assetId);
  };

  const togglePanel = (panel: ActivePanel) => setActivePanel(current => current === panel ? 'none' : panel);

  const NavItem = ({ icon: Icon, label, isActive, onClick }: { icon: any, label: string, isActive?: boolean, onClick: () => void }) => (
     <button 
        onClick={onClick}
        className={`w-full flex items-center px-3 py-3 transition-colors relative group
        ${isActive ? 'text-white bg-orange-900/40 border-r-2 border-orange-500' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}`}
        title={label}
     >
         <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-orange-400' : ''}`} />
         <span className={`ml-3 text-xs font-medium transition-opacity duration-300 whitespace-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>{label}</span>
     </button>
  );

  if (viewState === 'START') {
      return (
        <StartScreen 
            onNewProject={handleNewProject} 
            onLoadProject={handleLoadProject} 
            onOpenDocs={() => setViewState('DOCS')} 
        />
      );
  }

  if (viewState === 'DOCS') {
      return <DocumentationPage onBack={() => setViewState('START')} />;
  }

  return (
    <div className="h-[100dvh] w-screen bg-gray-950 text-white font-sans overflow-hidden flex flex-col relative animate-in fade-in duration-500 supports-[height:100dvh]:h-[100dvh]">
      
      {dragProxy && (
          <div 
            className="fixed z-[200] pointer-events-none flex items-center justify-center opacity-80"
            style={{ 
                left: dragProxy.x, 
                top: dragProxy.y,
                width: dragProxy.obj.width,
                height: dragProxy.obj.height,
                transform: 'translate(-50%, -50%)',
                backgroundColor: dragProxy.obj.color,
                backgroundImage: dragProxy.obj.previewSpriteUrl ? `url(${dragProxy.obj.previewSpriteUrl})` : undefined,
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                border: '2px solid white',
                borderRadius: '4px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
            }}
          >
              {!dragProxy.obj.previewSpriteUrl && (
                  <span className="text-[9px] font-bold text-white drop-shadow-md">{dragProxy.obj.type[0]}</span>
              )}
          </div>
      )}

      <div className="relative z-50 flex-shrink-0">
        <Navbar 
            onSave={() => setIsExportOpen(true)} 
            onQuickSave={() => setIsSaveModalOpen(true)} 
            onPreview={() => setIsPreviewOpen(true)} 
            onUndo={performUndo}
            onRedo={performRedo}
            canUndo={past.length > 0}
            canRedo={future.length > 0}
        />
        <button 
          onClick={() => { if(confirm("¿Volver al inicio? Se perderán los cambios no guardados.")) setViewState('START'); }} 
          className="absolute top-3 right-3 bg-gray-800 hover:bg-gray-700 p-2 rounded-full text-xs text-orange-400 z-50 flex items-center space-x-1 border border-gray-700 shadow-lg"
          title="Salir al Inicio"
        >
          <Home className="w-4 h-4" />
          <span className="px-1 hidden sm:inline">Inicio</span>
        </button>
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-50 text-[10px] text-gray-400 flex flex-col items-center">
            <span>{projectName}</span>
            <span className="text-orange-400 text-[9px] font-bold uppercase tracking-widest">{currentScene?.name || '...'}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
          <div className={`bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 ease-in-out z-50 shadow-xl ${isSidebarOpen ? 'w-48' : 'w-14'}`}>
               <div className="flex justify-end p-2 border-b border-gray-800">
                   <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 text-gray-500 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">{isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
               </div>
               <div className="flex-1 py-2 overflow-y-auto">
                   <NavItem icon={Layout} label="Escena" isActive={editorMode === 'SCENE'} onClick={() => setEditorMode('SCENE')} />
                   <NavItem icon={Workflow} label="Eventos" isActive={editorMode === 'EVENTS'} onClick={() => setEditorMode('EVENTS')} />
                   <NavItem icon={Puzzle} label="Bloques" isActive={editorMode === 'BLOCKS'} onClick={() => setEditorMode('BLOCKS')} />
                   <div className="h-px bg-gray-800 mx-3 my-2" />
                   <NavItem icon={Map} label="Mundo / Nivel" onClick={() => setIsWorldSettingsOpen(true)} />
                   <NavItem icon={Clapperboard} label="Escenas" onClick={() => setIsSceneManagerOpen(true)} />
                   <NavItem icon={Grid3x3} label="Sprites" onClick={() => setIsAssetManagerOpen(true)} />
                   <NavItem icon={VariableIcon} label="Variables" onClick={() => setIsVarManagerOpen(true)} />
                   <NavItem icon={Video} label="Cámara" onClick={() => setIsCameraModalOpen(true)} />
                   <NavItem icon={Smartphone} label="Controles Móviles" onClick={() => setIsMobileSettingsOpen(true)} />
                   <div className="h-px bg-gray-800 mx-3 my-2" />
                   <NavItem icon={canvasConfig.mode === 'LANDSCAPE' ? MonitorSmartphone : Smartphone} label={canvasConfig.mode === 'LANDSCAPE' ? 'Horizontal' : 'Vertical'} onClick={handleToggleOrientation} />
               </div>
          </div>

          <div className="flex-1 relative flex flex-col overflow-hidden bg-gray-950">
              <div className={`flex-1 relative w-full h-full overflow-hidden ${editorMode === 'SCENE' ? 'block' : 'hidden'}`}>
                    <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2 bg-gray-800/90 backdrop-blur border border-gray-700 p-1.5 rounded-xl shadow-xl">
                        <button onClick={() => {setCurrentTool(EditorTool.SELECT); setActiveBrushId(null);}} className={`p-3 rounded-lg transition-all ${currentTool === EditorTool.SELECT ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}><Move className="w-5 h-5" /></button>
                        <button onClick={() => {setCurrentTool(EditorTool.RESIZE); setActiveBrushId(null);}} className={`p-3 rounded-lg transition-all ${currentTool === EditorTool.RESIZE ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}><Maximize className="w-5 h-5" /></button>
                        <button onClick={() => {setCurrentTool(EditorTool.HAND); setActiveBrushId(null);}} className={`p-3 rounded-lg transition-all ${currentTool === EditorTool.HAND ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}><Hand className="w-5 h-5" /></button>
                    </div>
                    <div className="absolute inset-0 pb-16 bg-gray-950">
                        {currentScene && (
                            <Canvas 
                                scene={currentScene} 
                                objects={objects} 
                                layers={layers} 
                                selectedObjectId={selectedObjectId} 
                                currentTool={currentTool} 
                                activeBrushId={activeBrushId} 
                                brushSolid={brushSolid} 
                                activeLayerId={activeLayerId} 
                                assets={assets} 
                                canvasConfig={canvasConfig} 
                                cameraConfig={cameraConfig} 
                                showGrid={showGrid}
                                gridSize={gridSize}
                                onToggleGrid={setShowGrid}
                                onSetGridSize={setGridSize}
                                onSelectObject={(id) => setSelectedObjectId(id)} 
                                onUpdateObject={handleUpdateObjectAnywhere} 
                                onEditObject={(o) => setEditingObject(o)} 
                                onDropObject={(id, x, y) => handleObjectDropOnCanvas(id, x, y)} 
                                onViewChange={(pos, z) => { setViewPos(pos); setZoom(z); }}
                            />
                        )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gray-900 border-t border-gray-800 flex items-center justify-center space-x-12 px-4 z-[50] shadow-[0_-5px_20px_rgba(0,0,0,0.5)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                         <button onClick={() => togglePanel('library')} className={`flex flex-col items-center justify-center space-y-1 w-12 ${activePanel === 'library' ? 'text-orange-400' : 'text-gray-500 hover:text-gray-300'}`}><Box className="w-6 h-6" /><span className="text-[10px] font-bold">Objetos</span></button>
                         <div className="relative -top-8"><button onClick={() => togglePanel('library')} className="w-14 h-14 bg-orange-600 rounded-full flex items-center justify-center shadow-lg text-white border-4 border-gray-950 transform hover:scale-105 transition-transform"><Plus className="w-7 h-7" /></button></div>
                         <button onClick={() => togglePanel('properties')} className={`flex flex-col items-center justify-center space-y-1 w-12 ${activePanel === 'properties' ? 'text-orange-400' : 'text-gray-500 hover:text-gray-300'}`}><Settings className="w-6 h-6" /><span className="text-[10px] font-bold">Editar</span></button>
                         <button onClick={() => togglePanel('layers')} className={`flex flex-col items-center justify-center space-y-1 w-12 ${activePanel === 'layers' ? 'text-orange-400' : 'text-gray-500 hover:text-gray-300'}`}><Layers className="w-6 h-6" /><span className="text-[10px] font-bold">Capas</span></button>
                    </div>
              </div>
              <div className={`flex-1 relative bg-gray-900 ${editorMode === 'EVENTS' ? 'block' : 'hidden'}`}>
                  <EventSheet 
                    objects={objects} 
                    scenes={scenes} 
                    onUpdateObject={handleUpdateObjectAnywhere} 
                    library={library} 
                    globalVariables={globalVariables} 
                  />
              </div>
              <div className={`flex-1 relative bg-gray-900 ${editorMode === 'BLOCKS' ? 'block' : 'hidden'}`}>
                  <BlockEditor
                    objects={objects}
                    scenes={scenes}
                    library={library}
                    globalVariables={globalVariables}
                    onUpdateObject={handleUpdateObjectAnywhere}
                  />
              </div>
          </div>
      </div>

      <EditObjectModal isOpen={!!editingObject} object={editingObject} onClose={() => setEditingObject(null)} onSave={handleUpdateObjectAnywhere} />
      <GamePreviewModal isOpen={isPreviewOpen} objects={objects} scenes={scenes} initialSceneId={currentSceneId} canvasConfig={canvasConfig} onClose={() => setIsPreviewOpen(false)} globalVariables={globalVariables} library={library} />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} gameData={{objects, scenes, layers, canvasConfig, assets, library}} />
      <AssetManagerModal 
        isOpen={isAssetManagerOpen} 
        assets={assets} 
        initialMode={assetManagerMode} 
        onClose={() => { setIsAssetManagerOpen(false); setAssetSelectionCallback(null); setAssetManagerMode('GALLERY'); }} 
        onAddAsset={(a) => setAssets(prev => [...prev, a])} 
        onDeleteAsset={(id) => setAssets(assets.filter(a => a.id !== id))} 
        onSelectAsset={(url) => { 
            if(assetSelectionCallback) {
                assetSelectionCallback(url);
                setAssetSelectionCallback(null);
            }
            setIsAssetManagerOpen(false); 
        }} 
        onMultiSelectAssets={(urls) => {
            if(assetSelectionCallback) {
                assetSelectionCallback(urls);
                setAssetSelectionCallback(null);
            }
            setIsAssetManagerOpen(false); 
        }}
      />
      <VariableManagerModal isOpen={isVarManagerOpen} variables={globalVariables} onClose={() => setIsVarManagerOpen(false)} onUpdateVariables={(v) => setGlobalVariables(v)} />
      <SceneManagerModal isOpen={isSceneManagerOpen} scenes={scenes} currentSceneId={currentSceneId} onClose={() => setIsSceneManagerOpen(false)} onSelectScene={(id) => { setCurrentSceneId(id); setSelectedObjectId(null); }} onAddScene={(name) => { const nid = crypto.randomUUID(); setScenes([...scenes, { id: nid, name, objects: [], layers: [{ id: 'l1', name: 'Capa Base', visible: true, locked: false }], backgroundColor: '#111827', camera: { targetObjectId: null, smooth: true, followSpeed: 0.1 }, width: canvasConfig.width, height: canvasConfig.height }]); setCurrentSceneId(nid); }} onRenameScene={(id, name) => setScenes(scenes.map(s => s.id === id ? { ...s, name } : s))} onDeleteScene={(id) => { if (scenes.length > 1) { setScenes(scenes.filter(s => s.id !== id)); if (currentSceneId === id) setCurrentSceneId(scenes[0].id); } }} />
      <CameraSettingsModal isOpen={isCameraModalOpen} onClose={() => setIsCameraModalOpen(false)} objects={objects} cameraConfig={cameraConfig} onUpdateCamera={handleUpdateCamera} />
      <SaveProjectModal isOpen={isSaveModalOpen} currentName={projectName} onClose={() => setIsSaveModalOpen(false)} onConfirm={handleConfirmSave} />
      <MobileSettingsModal 
        isOpen={isMobileSettingsOpen} 
        onClose={() => setIsMobileSettingsOpen(false)} 
        config={canvasConfig.mobileControls || DEFAULT_MOBILE_CONTROLS}
        onSave={(newConfig) => setCanvasConfig({ ...canvasConfig, mobileControls: newConfig })}
        canvasConfig={canvasConfig}
      />
      {currentScene && (
          <WorldSettingsModal 
            isOpen={isWorldSettingsOpen}
            scene={currentScene}
            canvasConfig={canvasConfig}
            onClose={() => setIsWorldSettingsOpen(false)}
            onUpdateScene={updateCurrentScene}
            onUpdateCanvas={setCanvasConfig}
          />
      )}
      {scriptEditingObjectId && (
          <ScriptEditorModal 
             isOpen={isScriptEditorOpen}
             objectName={selectedObject?.name || 'Objeto'}
             initialCode={selectedObject?.script || ''}
             onClose={() => setIsScriptEditorOpen(false)}
             onSave={handleSaveScript}
          />
      )}
      {activePanel !== 'none' && editorMode === 'SCENE' && <div className="absolute inset-0 bg-black/50 z-[55]" onClick={() => setActivePanel('none')} />}
      <div className={`absolute bottom-0 left-0 right-0 h-[60%] z-[60] transform transition-transform duration-300 ease-out ${activePanel === 'library' && editorMode === 'SCENE' ? 'translate-y-0' : 'translate-y-full'}`}>
          <ObjectLibrary 
            objects={library} 
            selectedObjectId={selectedObjectId} 
            onAddObject={handleAddObjectToLibrary} 
            onSelectObject={(id) => setSelectedObjectId(id)} 
            onDeleteObject={handleDeleteObject} 
            onClose={() => setActivePanel('none')} 
            className="rounded-t-2xl"
            groups={currentScene?.groups || []}
            onAddGroup={handleAddGroup}
            onDeleteGroup={handleDeleteGroup}
            onAssignToGroup={handleAssignToGroup}
            onStartDrag={handleStartDragFromLibrary}
          />
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-[50%] z-[60] transform transition-transform duration-300 ease-out ${activePanel === 'properties' && editorMode === 'SCENE' ? 'translate-y-0' : 'translate-y-full'}`}>
          <PropertiesPanel 
            selectedObject={selectedObject} 
            objects={objects} 
            globalVariables={globalVariables}
            assets={assets}
            onUpdateObject={handleUpdateObjectAnywhere} 
            onDeleteObject={handleDeleteObject} 
            onOpenAssetManager={(cb, mode) => { setAssetSelectionCallback(() => cb); setAssetManagerMode(mode || 'GALLERY'); setIsAssetManagerOpen(true); }}
            onSetBrush={handleSetBrush}
            activeBrushId={activeBrushId}
            brushSolid={brushSolid}
            onSetBrushSolid={setBrushSolid}
            currentTool={currentTool}
            onOpenScriptEditor={handleOpenScriptEditor}
            onClose={() => setActivePanel('none')} 
            className="rounded-t-2xl"
          />
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-[50%] z-[60] transform transition-transform duration-300 ease-out ${activePanel === 'layers' && editorMode === 'SCENE' ? 'translate-y-0' : 'translate-y-full'}`}>
          <LayersPanel 
            layers={layers} 
            selectedObjectId={selectedObjectId}
            activeLayerId={activeLayerId}
            onSelectLayer={setActiveLayerId} 
            objects={objects}
            onAddLayer={() => { if (currentScene) updateCurrentScene({ layers: [...currentScene.layers, { id: crypto.randomUUID(), name: `Capa ${currentScene.layers.length + 1}`, visible: true, locked: false }] }); }} 
            onRemoveLayer={(id) => { if (currentScene) updateCurrentScene({ layers: currentScene.layers.filter(l => l.id !== id), objects: currentScene.objects.filter(o => o.layerId !== id) }); }} 
            onUpdateLayer={(id, updates) => { if (currentScene) updateCurrentScene({ layers: currentScene.layers.map(l => l.id === id ? { ...l, ...updates } : l) }); }} 
            onMoveLayer={(id, dir) => {
                if (!currentScene) return;
                const idx = currentScene.layers.findIndex(l => l.id === id);
                if (dir === 'up' && idx < currentScene.layers.length - 1) {
                    const newLayers = [...currentScene.layers];
                    [newLayers[idx], newLayers[idx + 1]] = [newLayers[idx + 1], newLayers[idx]];
                    updateCurrentScene({ layers: newLayers });
                } else if (dir === 'down' && idx > 0) {
                    const newLayers = [...currentScene.layers];
                    [newLayers[idx], newLayers[idx - 1]] = [newLayers[idx - 1], newLayers[idx]];
                    updateCurrentScene({ layers: newLayers });
                }
            }}
            onAssignObjectToLayer={(objId, layerId) => handleUpdateObjectAnywhere(objId, { layerId })}
            onClose={() => setActivePanel('none')} 
            className="rounded-t-2xl"
          />
      </div>
    </div>
  );
};
