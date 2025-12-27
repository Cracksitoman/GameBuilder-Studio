
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
import { GameObject, ObjectType, EditorTool, CanvasConfig, Layer, Asset, Variable, Scene, CameraConfig } from './types';
import { Layers, Plus, Settings, Box, Move, Maximize, Hand, ArrowRight, Layout, Workflow, Grid3x3, Menu, ChevronLeft, Clapperboard, Variable as VariableIcon, Video, Smartphone, MonitorSmartphone, Home } from './components/Icons';

// Helper to create object
const createInitialObject = (type: ObjectType, count: number): GameObject => {
  const base: Partial<GameObject> = {
    id: crypto.randomUUID(),
    zIndex: 1,
    layerId: 'base', 
    visible: true,
    opacity: 1,
    rotation: 0,
    isObstacle: false,
    behaviors: [],
    events: [],
    variables: [],
    group: undefined
  };

  switch (type) {
    case ObjectType.TEXT:
      return { ...base, name: 'Texto Nuevo', type: ObjectType.TEXT, x: 0, y: 0, width: 150, height: 50, color: '#ffffff' } as GameObject;
    case ObjectType.PLAYER:
       return { ...base, name: `Jugador ${count}`, type: ObjectType.PLAYER, x: 0, y: 0, width: 32, height: 32, color: '#22c55e' } as GameObject;
    case ObjectType.ENEMY:
      return { ...base, name: `Enemigo ${count}`, type: ObjectType.ENEMY, x: 0, y: 0, width: 32, height: 32, color: '#ef4444' } as GameObject;
    case ObjectType.TILEMAP:
        return { ...base, name: `Mapa ${count}`, type: ObjectType.TILEMAP, x: 0, y: 0, width: 320, height: 320, color: 'transparent', tilemap: { tileSize: 32, tiles: {} } } as GameObject;
    default:
      return { ...base, name: `Sprite ${count}`, type: ObjectType.SPRITE, x: 0, y: 0, width: 50, height: 50, color: '#3b82f6', isObstacle: true } as GameObject;
  }
};

type ActivePanel = 'none' | 'library' | 'properties' | 'layers';
type ViewState = 'START' | 'EDITOR' | 'DOCS'; 
type EditorMode = 'SCENE' | 'EVENTS';

export const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>('START');
  const [editorMode, setEditorMode] = useState<EditorMode>('SCENE'); 
  const [projectName, setProjectName] = useState("Nuevo Proyecto Koda");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentSceneId, setCurrentSceneId] = useState<string>('');
  
  // Library State: The Prototypes
  const [library, setLibrary] = useState<GameObject[]>([]);

  const [assets, setAssets] = useState<Asset[]>([]); 
  const [globalVariables, setGlobalVariables] = useState<Variable[]>([]); 

  // History State for Undo/Redo
  const [past, setPast] = useState<Scene[][]>([]);
  const [future, setFuture] = useState<Scene[][]>([]);

  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [currentTool, setCurrentTool] = useState<EditorTool>(EditorTool.SELECT);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [activeBrushId, setActiveBrushId] = useState<string | null>(null);
  const [brushSolid, setBrushSolid] = useState<boolean>(false); 
  
  // Drag Proxy State (Global Drag)
  const [dragProxy, setDragProxy] = useState<{ obj: GameObject, x: number, y: number } | null>(null);

  // Grid State
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(32);

  const [canvasConfig, setCanvasConfig] = useState<CanvasConfig>({ width: 800, height: 450, mode: 'LANDSCAPE' });
  const [editingObject, setEditingObject] = useState<GameObject | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAssetManagerOpen, setIsAssetManagerOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isVarManagerOpen, setIsVarManagerOpen] = useState(false); 
  const [isSceneManagerOpen, setIsSceneManagerOpen] = useState(false); 
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false); 
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false); 
  
  // Script Editor State
  const [isScriptEditorOpen, setIsScriptEditorOpen] = useState(false);
  const [scriptEditingObjectId, setScriptEditingObjectId] = useState<string | null>(null);

  const [assetSelectionCallback, setAssetSelectionCallback] = useState<((url: string) => void) | null>(null);

  const currentScene = scenes.find(s => s.id === currentSceneId);
  const objects = currentScene ? currentScene.objects : [];
  const layers = currentScene ? currentScene.layers : [];
  const groups = currentScene ? (currentScene.groups || []) : []; 
  const cameraConfig = currentScene?.camera || { targetObjectId: null, smooth: true, followSpeed: 0.1 };

  // Determine if selected object is from Scene or Library
  const selectedObject = objects.find(o => o.id === selectedObjectId) || library.find(o => o.id === selectedObjectId) || null;

  // Open Properties Panel automatically when selecting object from Library
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

  // --- GLOBAL DRAG AND DROP HANDLERS (POINTER EVENTS) ---
  useEffect(() => {
      if (!dragProxy) return;

      const handleGlobalMove = (e: PointerEvent) => {
          setDragProxy(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
      };

      const handleGlobalUp = (e: PointerEvent) => {
          // Check if dropped over canvas area
          const stageArea = document.getElementById('koda-stage-area');
          if (stageArea) {
              const rect = stageArea.getBoundingClientRect();
              
              if (
                  e.clientX >= rect.left && 
                  e.clientX <= rect.right && 
                  e.clientY >= rect.top && 
                  e.clientY <= rect.bottom
              ) {
                  const relX = (e.clientX - rect.left) / rect.width;
                  const relY = (e.clientY - rect.top) / rect.height;
                  
                  const gameX = relX * canvasConfig.width;
                  const gameY = relY * canvasConfig.height;

                  handleObjectDropOnCanvas(dragProxy.obj.id, gameX, gameY);
              }
          }
          setDragProxy(null);
      };

      window.addEventListener('pointermove', handleGlobalMove);
      window.addEventListener('pointerup', handleGlobalUp);

      return () => {
          window.removeEventListener('pointermove', handleGlobalMove);
          window.removeEventListener('pointerup', handleGlobalUp);
      };
  }, [dragProxy, canvasConfig]);

  const handleStartDragFromLibrary = (e: React.PointerEvent, obj: GameObject) => {
      // Close panel immediately
      setActivePanel('none');
      // Start Drag Proxy
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

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [past, future, scenes]);


  const updateCurrentScene = (updates: Partial<Scene>, skipHistory = false) => {
      if (!skipHistory) recordHistory();
      setScenes(prev => prev.map(s => s.id === currentSceneId ? { ...s, ...updates } : s));
  };

  // Handles updating both Scene Instances and Library Prototypes
  // AND Syncs prototype changes to all instances
  const handleUpdateObjectAnywhere = (id: string, updates: Partial<GameObject>, skipHistory = false) => {
      // 1. Check if it's a scene object (Instance)
      if (currentScene && currentScene.objects.some(o => o.id === id)) {
          if (!skipHistory) recordHistory();
          const newObjects = currentScene.objects.map(obj => obj.id === id ? { ...obj, ...updates } : obj);
          setScenes(prev => prev.map(s => s.id === currentSceneId ? { ...s, objects: newObjects } : s));
          return;
      }

      // 2. Check if it's a library object (Prototype)
      const libraryObj = library.find(o => o.id === id);
      if (libraryObj) {
          // Update the library object
          setLibrary(prev => prev.map(obj => obj.id === id ? { ...obj, ...updates } : obj));
          
          // PROPAGATE CHANGES TO INSTANCES (Live Sync)
          // We sync everything EXCEPT instance-specific data like position (x,y), layer, or unique ID.
          // Properties to sync: width, height, color, sprite, behaviors, scripts, name (maybe), tilemap.
          // Note: "variables" are tricky. If we add a variable to prototype, add it to instances.
          // For now, simpler sync:
          
          setScenes(prevScenes => prevScenes.map(scene => ({
              ...scene,
              objects: scene.objects.map(obj => {
                  if (obj.prototypeId === id) {
                      // Merge updates but preserve instance transforms if they weren't explicitly updated
                      // However, if we change width in prototype, we probably want all instances to resize.
                      // But if we move X in prototype (which is usually 0,0), we definitely DON'T want to move instances.
                      
                      const { x, y, id: instanceId, layerId, zIndex, ...restUpdates } = updates as any;
                      // "restUpdates" contains things like color, width, height, behaviors, script...
                      return { ...obj, ...restUpdates };
                  }
                  return obj;
              })
          })));
      }
  };
  
  const handleUpdateCamera = (config: CameraConfig) => updateCurrentScene({ camera: config });

  // Script Handling
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
          groups: []
      };
      setScenes([initialScene]);
      setCurrentSceneId(firstSceneId);
      setActiveLayerId(firstLayerId); 
      setLibrary([]); // Reset Library
      setAssets([]);
      setGlobalVariables([]);
      setPast([]); setFuture([]); 
      setCanvasConfig({ width: 800, height: 450, mode: 'LANDSCAPE' });
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
                  setLibrary(json.library || []); // Load library
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
      // Include Library in save data
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

  // Adds to LIBRARY, not Scene
  const handleAddObjectToLibrary = (type: ObjectType) => {
    const newObj = createInitialObject(type, library.length + 1);
    setLibrary(prev => [...prev, newObj]);
    setSelectedObjectId(newObj.id);
    // Don't close panel, user wants to see the new item
  };

  // Triggered when dragging from Library to Canvas (via Proxy drop logic)
  const handleObjectDropOnCanvas = (libraryId: string, x: number, y: number) => {
      if (!currentScene) return;
      const prototype = library.find(o => o.id === libraryId);
      if (!prototype) return;

      recordHistory();
      
      const targetLayerId = activeLayerId || layers[layers.length - 1].id;
      
      // Create Instance linked to Prototype
      const newInstance: GameObject = {
          ...JSON.parse(JSON.stringify(prototype)), // Deep copy properties
          id: crypto.randomUUID(), // New unique ID
          prototypeId: prototype.id, // LINK TO PROTOTYPE
          x: Math.round(x - (prototype.width / 2)), // Center on drop
          y: Math.round(y - (prototype.height / 2)),
          layerId: targetLayerId
      };

      setScenes(prev => prev.map(s => s.id === currentSceneId ? { ...s, objects: [...s.objects, newInstance] } : s));
      setSelectedObjectId(newInstance.id);
  };

  const handleDeleteObject = (id: string) => {
      // Check Scene First
      if (currentScene && currentScene.objects.some(o => o.id === id)) {
          recordHistory();
          setScenes(prev => prev.map(s => s.id === currentSceneId ? { ...s, objects: s.objects.filter(o => o.id !== id) } : s));
          if(selectedObjectId === id) setSelectedObjectId(null);
          return;
      }
      // Check Library
      if (library.some(o => o.id === id)) {
          if (confirm("¿Borrar este objeto de la librería? Esto no afectará a los objetos ya colocados en la escena.")) {
              setLibrary(prev => prev.filter(o => o.id !== id));
              if(selectedObjectId === id) setSelectedObjectId(null);
          }
      }
  };

  // Group Handlers (Update to handle Library Objects mostly)
  // For now, groups exist in Scene, but ObjectLibrary uses Library objects.
  // We need to sync groups or just use names.
  const handleAddGroup = (name: string) => {
      if(!currentScene || (currentScene.groups || []).includes(name)) return;
      // recordHistory(); // Groups are meta-data, maybe skip undo? Or enable.
      setScenes(prev => prev.map(s => s.id === currentSceneId ? { ...s, groups: [...(s.groups || []), name] } : s));
  };

  const handleDeleteGroup = (name: string) => {
      if(!currentScene) return;
      // Ungroup library items? Or Scene items?
      // "Group" prop is on GameObject.
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
      
      {/* DRAG PROXY LAYER */}
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
                   <div className="h-px bg-gray-800 mx-3 my-2" />
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
                        <Canvas 
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
                            // Grid Props
                            showGrid={showGrid}
                            gridSize={gridSize}
                            onToggleGrid={setShowGrid}
                            onSetGridSize={setGridSize}
                            // Callbacks
                            onSelectObject={(id) => setSelectedObjectId(id)} 
                            onUpdateObject={handleUpdateObjectAnywhere} 
                            onEditObject={(o) => setEditingObject(o)} 
                            onDropObject={(id, x, y) => handleObjectDropOnCanvas(id, x, y)} 
                        />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gray-900 border-t border-gray-800 flex items-center justify-center space-x-12 px-4 z-[50] shadow-[0_-5px_20px_rgba(0,0,0,0.5)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                         <button onClick={() => togglePanel('library')} className={`flex flex-col items-center justify-center space-y-1 w-12 ${activePanel === 'library' ? 'text-orange-400' : 'text-gray-500 hover:text-gray-300'}`}><Box className="w-6 h-6" /><span className="text-[10px] font-bold">Objetos</span></button>
                         <div className="relative -top-8"><button onClick={() => togglePanel('library')} className="w-14 h-14 bg-orange-600 rounded-full flex items-center justify-center shadow-lg text-white border-4 border-gray-950 transform hover:scale-105 transition-transform"><Plus className="w-7 h-7" /></button></div>
                         <button onClick={() => togglePanel('properties')} className={`flex flex-col items-center justify-center space-y-1 w-12 ${activePanel === 'properties' ? 'text-orange-400' : 'text-gray-500 hover:text-gray-300'}`}><Settings className="w-6 h-6" /><span className="text-[10px] font-bold">Editar</span></button>
                         <button onClick={() => togglePanel('layers')} className={`flex flex-col items-center justify-center space-y-1 w-12 ${activePanel === 'layers' ? 'text-orange-400' : 'text-gray-500 hover:text-gray-300'}`}><Layers className="w-6 h-6" /><span className="text-[10px] font-bold">Capas</span></button>
                    </div>
              </div>
              <div className={`flex-1 relative bg-gray-900 ${editorMode === 'EVENTS' ? 'block' : 'hidden'}`}>
                  {/* PASS ASSETS TO EVENT SHEET TO PASS TO ACTION MODAL */}
                  <EventSheet objects={objects} scenes={scenes} onUpdateObject={handleUpdateObjectAnywhere} />
              </div>
          </div>
      </div>

      <EditObjectModal isOpen={!!editingObject} object={editingObject} onClose={() => setEditingObject(null)} onSave={handleUpdateObjectAnywhere} />
      <GamePreviewModal isOpen={isPreviewOpen} objects={objects} scenes={scenes} initialSceneId={currentSceneId} canvasConfig={canvasConfig} onClose={() => setIsPreviewOpen(false)} globalVariables={globalVariables} />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} gameData={{objects, scenes, layers, canvasConfig, assets, library}} />
      <AssetManagerModal 
        isOpen={isAssetManagerOpen} 
        assets={assets} 
        onClose={() => { setIsAssetManagerOpen(false); setAssetSelectionCallback(null); }} 
        onAddAsset={(a) => setAssets([...assets, a])} 
        onDeleteAsset={(id) => setAssets(assets.filter(a => a.id !== id))} 
        onSelectAsset={(url) => { 
            if(assetSelectionCallback) {
                assetSelectionCallback(url);
                setAssetSelectionCallback(null);
            }
            setIsAssetManagerOpen(false); 
        }} 
      />
      <VariableManagerModal isOpen={isVarManagerOpen} variables={globalVariables} onClose={() => setIsVarManagerOpen(false)} onUpdateVariables={(v) => setGlobalVariables(v)} />
      <SceneManagerModal isOpen={isSceneManagerOpen} scenes={scenes} currentSceneId={currentSceneId} onClose={() => setIsSceneManagerOpen(false)} onSelectScene={(id) => { setCurrentSceneId(id); setSelectedObjectId(null); }} onAddScene={(name) => { const nid = crypto.randomUUID(); setScenes([...scenes, { id: nid, name, objects: [], layers: [{ id: 'l1', name: 'Capa Base', visible: true, locked: false }], backgroundColor: '#111827', camera: { targetObjectId: null, smooth: true, followSpeed: 0.1 } }]); setCurrentSceneId(nid); }} onRenameScene={(id, name) => setScenes(scenes.map(s => s.id === id ? { ...s, name } : s))} onDeleteScene={(id) => { if (scenes.length > 1) { setScenes(scenes.filter(s => s.id !== id)); if (currentSceneId === id) setCurrentSceneId(scenes[0].id); } }} />
      <CameraSettingsModal isOpen={isCameraModalOpen} onClose={() => setIsCameraModalOpen(false)} objects={objects} cameraConfig={cameraConfig} onUpdateCamera={handleUpdateCamera} />
      <SaveProjectModal isOpen={isSaveModalOpen} currentName={projectName} onClose={() => setIsSaveModalOpen(false)} onConfirm={handleConfirmSave} />
      <MobileSettingsModal 
        isOpen={isMobileSettingsOpen} 
        onClose={() => setIsMobileSettingsOpen(false)} 
        config={canvasConfig.mobileControls || { enabled: true, joystickX: 15, joystickY: 80, joystickSize: 150, buttonX: 85, buttonY: 80, buttonSize: 100, opacity: 0.5, color: '#ffffff' }}
        onSave={(newConfig) => setCanvasConfig({ ...canvasConfig, mobileControls: newConfig })}
        canvasConfig={canvasConfig}
      />
      
      {/* Script Editor Modal */}
      {scriptEditingObjectId && (
          <ScriptEditorModal 
             isOpen={isScriptEditorOpen}
             objectName={selectedObject?.name || 'Objeto'}
             initialCode={selectedObject?.script || ''}
             onClose={() => setIsScriptEditorOpen(false)}
             onSave={handleSaveScript}
          />
      )}

      {/* Panels */}
      {activePanel !== 'none' && editorMode === 'SCENE' && <div className="absolute inset-0 bg-black/50 z-[55]" onClick={() => setActivePanel('none')} />}
      
      <div className={`absolute bottom-0 left-0 right-0 h-[60%] z-[60] transform transition-transform duration-300 ease-out ${activePanel === 'library' && editorMode === 'SCENE' ? 'translate-y-0' : 'translate-y-full'}`}>
          <ObjectLibrary 
            objects={library}  // Pass Library Objects here
            selectedObjectId={selectedObjectId} 
            onAddObject={handleAddObjectToLibrary} 
            onSelectObject={(id) => setSelectedObjectId(id)} 
            onDeleteObject={handleDeleteObject} 
            onClose={() => setActivePanel('none')} 
            className="rounded-t-2xl" 
            
            // Grouping Props
            groups={groups}
            onAddGroup={handleAddGroup}
            onDeleteGroup={handleDeleteGroup}
            onAssignToGroup={handleAssignToGroup}
            // Start Global Drag
            onStartDrag={handleStartDragFromLibrary}
          />
      </div>
      
      <div className={`absolute bottom-0 left-0 right-0 h-[60%] z-[60] transform transition-transform duration-300 ease-out ${activePanel === 'properties' && editorMode === 'SCENE' ? 'translate-y-0' : 'translate-y-full'}`}>
          <PropertiesPanel 
            selectedObject={selectedObject} 
            objects={objects} // For linking to other scene objects
            globalVariables={globalVariables} 
            assets={assets} 
            onUpdateObject={handleUpdateObjectAnywhere} 
            onDeleteObject={handleDeleteObject} // Pass delete handler
            onOpenAssetManager={(callback) => { 
                setAssetSelectionCallback(() => callback); 
                setIsAssetManagerOpen(true); 
            }} 
            onSetBrush={handleSetBrush} 
            activeBrushId={activeBrushId} 
            brushSolid={brushSolid} 
            onSetBrushSolid={(b) => setBrushSolid(b)} 
            currentTool={currentTool} 
            onOpenScriptEditor={handleOpenScriptEditor} // PASS HANDLER
            onClose={() => setActivePanel('none')} 
            className="rounded-t-2xl" 
          />
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-[50%] z-[60] transform transition-transform duration-300 ease-out ${activePanel === 'layers' && editorMode === 'SCENE' ? 'translate-y-0' : 'translate-y-full'}`}><LayersPanel layers={layers} selectedObjectId={selectedObjectId} activeLayerId={activeLayerId} onSelectLayer={(id) => setActiveLayerId(id)} objects={objects} onAddLayer={() => updateCurrentScene({ layers: [...layers, { id: crypto.randomUUID(), name: `Capa ${layers.length + 1}`, visible: true, locked: false }] })} onRemoveLayer={(id) => { if (layers.length > 1) updateCurrentScene({ layers: layers.filter(l => l.id !== id), objects: objects.filter(o => o.layerId !== id) }); }} onUpdateLayer={(id, u) => updateCurrentScene({ layers: layers.map(l => l.id === id ? { ...l, ...u } : l) })} onMoveLayer={(id, d) => { /* logic */ }} onAssignObjectToLayer={(oid, lid) => handleUpdateObjectAnywhere(oid, { layerId: lid })} onClose={() => setActivePanel('none')} className="rounded-t-2xl" /></div>
    </div>
  );
};
