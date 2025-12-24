import React, { useState, useEffect } from 'react';
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
import { GameObject, ObjectType, EditorTool, CanvasConfig, Layer, Asset, Variable, Scene, CameraConfig } from './types';
import { Layers, Plus, Settings, Play, Box, Move, Maximize, Hand, ArrowRight, Layout, Workflow, Grid3x3, Menu, ChevronLeft, Clapperboard, Variable as VariableIcon, Video, Smartphone, MonitorSmartphone } from './components/Icons';

// Helper to create object with layer
const createInitialObject = (type: ObjectType, count: number, layerId: string): GameObject => {
  const base: Partial<GameObject> = {
    id: crypto.randomUUID(),
    zIndex: 1,
    layerId: layerId,
    visible: true,
    opacity: 1,
    rotation: 0,
    isObstacle: false, // Default physics state
    behaviors: [],
    events: [], // Initialize empty events
    variables: [] // Initialize empty local vars
  };

  switch (type) {
    case ObjectType.TEXT:
      return {
        ...base,
        name: 'Texto Nuevo',
        type: ObjectType.TEXT,
        x: 100,
        y: 100,
        width: 150,
        height: 50,
        color: '#ffffff'
      } as GameObject;
    case ObjectType.PLAYER:
       return {
        ...base,
        name: `Jugador ${count}`,
        type: ObjectType.PLAYER,
        x: 50,
        y: 200,
        width: 32,
        height: 32,
        color: '#22c55e'
      } as GameObject;
    case ObjectType.ENEMY:
      return {
        ...base,
        name: `Enemigo ${count}`,
        type: ObjectType.ENEMY,
        x: 300,
        y: 200,
        width: 32,
        height: 32,
        color: '#ef4444'
      } as GameObject;
    case ObjectType.TILEMAP:
        return {
            ...base,
            name: `Mapa ${count}`,
            type: ObjectType.TILEMAP,
            x: 0,
            y: 0,
            width: 320, // 10 tiles wide
            height: 320, // 10 tiles high
            color: 'transparent',
            tilemap: {
                tileSize: 32,
                tiles: {}
            }
        } as GameObject;
    default: // Sprite
      return {
        ...base,
        name: `Sprite ${count}`,
        type: ObjectType.SPRITE,
        x: 200,
        y: 150,
        width: 50,
        height: 50,
        color: '#3b82f6',
        isObstacle: true // Sprites default to obstacles often
      } as GameObject;
  }
};

type ActivePanel = 'none' | 'library' | 'properties' | 'layers';
type ViewState = 'START' | 'EDITOR';
type EditorMode = 'SCENE' | 'EVENTS';

export const App: React.FC = () => {
  // --- STATE ---
  const [viewState, setViewState] = useState<ViewState>('START');
  const [editorMode, setEditorMode] = useState<EditorMode>('SCENE'); 
  const [projectName, setProjectName] = useState("Mi Proyecto");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  // Multi-Scene State
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentSceneId, setCurrentSceneId] = useState<string>('');

  const [assets, setAssets] = useState<Asset[]>([]); 
  const [globalVariables, setGlobalVariables] = useState<Variable[]>([]); 

  // Selection & Tools
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [currentTool, setCurrentTool] = useState<EditorTool>(EditorTool.SELECT);
  
  // Layer Management
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  // Brush State for Tilemaps
  const [activeBrushId, setActiveBrushId] = useState<string | null>(null);
  const [brushSolid, setBrushSolid] = useState<boolean>(false); 

  // Canvas Configuration State
  const [canvasConfig, setCanvasConfig] = useState<CanvasConfig>({
      width: 800,
      height: 450,
      mode: 'LANDSCAPE'
  });
  
  // Modal States
  const [editingObject, setEditingObject] = useState<GameObject | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAssetManagerOpen, setIsAssetManagerOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isVarManagerOpen, setIsVarManagerOpen] = useState(false); 
  const [isSceneManagerOpen, setIsSceneManagerOpen] = useState(false); 
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false); 
  
  const [assetSelectCallback, setAssetSelectCallback] = useState<((url: string) => void) | null>(null);

  // --- COMPUTED PROPERTIES ---
  const currentScene = scenes.find(s => s.id === currentSceneId);
  const objects = currentScene ? currentScene.objects : [];
  const layers = currentScene ? currentScene.layers : [];
  const selectedObject = objects.find(o => o.id === selectedObjectId) || null;
  
  // Default camera if not present in scene
  const cameraConfig = currentScene?.camera || { targetObjectId: null, smooth: true, followSpeed: 0.1 };

  // Ensure activeLayerId is valid when scene changes
  useEffect(() => {
      if (currentScene && currentScene.layers.length > 0) {
          // If current active layer is not in this scene, reset to top layer
          const exists = currentScene.layers.find(l => l.id === activeLayerId);
          if (!exists) {
              setActiveLayerId(currentScene.layers[currentScene.layers.length - 1].id);
          }
      }
  }, [currentSceneId, scenes]);

  // --- HELPERS FOR UPDATING CURRENT SCENE ---
  const updateCurrentScene = (updates: Partial<Scene>) => {
      setScenes(prev => prev.map(s => s.id === currentSceneId ? { ...s, ...updates } : s));
  };

  const handleUpdateObjectInScene = (id: string, updates: Partial<GameObject>) => {
      if (!currentScene) return;
      const newObjects = currentScene.objects.map(obj => obj.id === id ? { ...obj, ...updates } : obj);
      updateCurrentScene({ objects: newObjects });
  };
  
  const handleUpdateCamera = (config: CameraConfig) => {
      updateCurrentScene({ camera: config });
  };

  // --- START SCREEN HANDLERS ---
  const handleNewProject = () => {
      const firstSceneId = crypto.randomUUID();
      const firstLayerId = 'layer-base';
      const initialScene: Scene = {
          id: firstSceneId,
          name: 'Escena 1',
          backgroundColor: '#111827',
          objects: [],
          layers: [{ id: firstLayerId, name: 'Capa Base', visible: true, locked: false }],
          camera: { targetObjectId: null, smooth: true, followSpeed: 0.1 }
      };

      setScenes([initialScene]);
      setCurrentSceneId(firstSceneId);
      setActiveLayerId(firstLayerId); // Set active layer
      setAssets([]);
      setGlobalVariables([]);
      setCanvasConfig({ width: 800, height: 450, mode: 'LANDSCAPE' });
      setSelectedObjectId(null);
      setProjectName("Mi Proyecto");
      setViewState('EDITOR');
      setEditorMode('SCENE');
  };

  const handleLoadProject = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const json = JSON.parse(e.target?.result as string);
              
              let loadedScenes: Scene[] = [];
              if (json.scenes) {
                  loadedScenes = json.scenes;
              } else if (json.objects && json.layers) {
                  loadedScenes = [{
                      id: crypto.randomUUID(),
                      name: 'Escena 1',
                      objects: json.objects,
                      layers: json.layers,
                      backgroundColor: '#111827'
                  }];
              }

              if (loadedScenes.length > 0 && json.canvasConfig) {
                  setScenes(loadedScenes);
                  setCurrentSceneId(loadedScenes[0].id);
                  // Set active layer to the top layer of the loaded scene
                  if (loadedScenes[0].layers.length > 0) {
                      setActiveLayerId(loadedScenes[0].layers[loadedScenes[0].layers.length - 1].id);
                  }
                  
                  setCanvasConfig(json.canvasConfig);
                  setAssets(json.assets || []); 
                  setGlobalVariables(json.globalVariables || []);
                  
                  if (json.metadata && json.metadata.name) {
                      setProjectName(json.metadata.name);
                  } else {
                      const nameFromFiles = file.name.replace(/\.[^/.]+$/, "");
                      setProjectName(nameFromFiles);
                  }

                  setViewState('EDITOR');
                  setEditorMode('SCENE');
              } else {
                  alert("Error: Archivo de proyecto inválido o corrupto.");
              }
          } catch (err) {
              console.error(err);
              alert("Error al leer el archivo. Asegúrate de que es un archivo .GBS o .JSON válido.");
          }
      };
      reader.readAsText(file);
  };

  // --- SAVE HANDLERS ---
  const handleOpenSaveModal = () => {
      setIsSaveModalOpen(true);
  };

  const handleConfirmSave = (name: string) => {
      setProjectName(name); 
      const gameData = {
          metadata: { name: name, version: "2.5", timestamp: Date.now() },
          scenes, 
          canvasConfig,
          assets,
          globalVariables
      };
      const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(gameData, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `${name}.gbs`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      setIsSaveModalOpen(false);
  };

  // --- SCENE MANAGEMENT HANDLERS ---
  const handleAddScene = (name: string) => {
      const newLayerId = crypto.randomUUID();
      const newScene: Scene = {
          id: crypto.randomUUID(),
          name: name,
          objects: [],
          layers: [{ id: newLayerId, name: 'Capa Base', visible: true, locked: false }],
          backgroundColor: '#111827',
          camera: { targetObjectId: null, smooth: true, followSpeed: 0.1 }
      };
      setScenes(prev => [...prev, newScene]);
      setCurrentSceneId(newScene.id); 
      setActiveLayerId(newLayerId);
  };

  const handleRenameScene = (id: string, name: string) => {
      setScenes(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  };

  const handleDeleteScene = (id: string) => {
      if (scenes.length <= 1) return; 
      const newScenes = scenes.filter(s => s.id !== id);
      setScenes(newScenes);
      if (currentSceneId === id) {
          setCurrentSceneId(newScenes[0].id);
      }
  };

  // --- EDITOR HANDLERS ---

  const handleToggleOrientation = () => {
      setCanvasConfig(prev => {
          if (prev.mode === 'LANDSCAPE') {
              return { width: 450, height: 800, mode: 'PORTRAIT' };
          } else {
              return { width: 800, height: 450, mode: 'LANDSCAPE' };
          }
      });
  };

  const handleAddObject = (type: ObjectType) => {
    if (!currentScene) return;
    const targetLayerId = activeLayerId || layers[layers.length - 1].id;
    const newObj = createInitialObject(type, objects.length + 1, targetLayerId);
    
    updateCurrentScene({ objects: [...objects, newObj] });
    setSelectedObjectId(newObj.id);
    setCurrentTool(EditorTool.SELECT);
    setActivePanel('none');
  };

  const handleUpdateObject = (id: string, updates: Partial<GameObject>) => {
    handleUpdateObjectInScene(id, updates);
  };

  const handleDeleteObject = (id: string) => {
    if (!currentScene) return;
    updateCurrentScene({ objects: objects.filter(obj => obj.id !== id) });
    if (selectedObjectId === id) {
      setSelectedObjectId(null);
    }
  };

  const handleSelectObject = (id: string | null) => {
    setSelectedObjectId(id);
    if (id !== selectedObjectId) {
        setCurrentTool(EditorTool.SELECT);
        setActiveBrushId(null);
    }
  };

  const handleEditObject = (obj: GameObject) => {
    setEditingObject(obj);
  };

  const togglePanel = (panel: ActivePanel) => {
    setActivePanel(current => current === panel ? 'none' : panel);
  };

  // --- ASSET HANDLERS ---
  const handleOpenAssetManager = (callback?: (url: string) => void) => {
      if (callback) {
          setAssetSelectCallback(() => callback);
      } else {
          setAssetSelectCallback(null);
      }
      setIsAssetManagerOpen(true);
  };

  const handleAssetSelect = (url: string) => {
      if (assetSelectCallback) {
          assetSelectCallback(url);
          setIsAssetManagerOpen(false);
          setAssetSelectCallback(null);
      }
  };

  const handleAddAsset = (asset: Asset) => {
      setAssets(prev => [...prev, asset]);
  };

  const handleDeleteAsset = (id: string) => {
      setAssets(prev => prev.filter(a => a.id !== id));
  };

  // --- LAYER HANDLERS ---
  const handleAddLayer = () => {
      if (!currentScene) return;
      const newId = crypto.randomUUID();
      const newLayer: Layer = {
          id: newId,
          name: `Capa ${layers.length + 1}`,
          visible: true,
          locked: false
      };
      updateCurrentScene({ layers: [...layers, newLayer] });
      setActiveLayerId(newId); 
  };

  const handleRemoveLayer = (id: string) => {
      if (!currentScene || layers.length <= 1) return;
      const newLayers = layers.filter(l => l.id !== id);
      const newObjects = objects.filter(o => o.layerId !== id);
      updateCurrentScene({ layers: newLayers, objects: newObjects });
      
      if (activeLayerId === id) {
          setActiveLayerId(newLayers[newLayers.length - 1].id);
      }
  };

  const handleUpdateLayer = (id: string, updates: Partial<Layer>) => {
      if (!currentScene) return;
      updateCurrentScene({ layers: layers.map(l => l.id === id ? { ...l, ...updates } : l) });
  };

  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
      if (!currentScene) return;
      const index = layers.findIndex(l => l.id === id);
      if (index === -1) return;
      
      const newLayers = [...layers];
      if (direction === 'up' && index < newLayers.length - 1) {
          [newLayers[index], newLayers[index + 1]] = [newLayers[index + 1], newLayers[index]];
      } else if (direction === 'down' && index > 0) {
          [newLayers[index], newLayers[index - 1]] = [newLayers[index - 1], newLayers[index]];
      }
      updateCurrentScene({ layers: newLayers });
  };

  const handleAssignObjectToLayer = (objectId: string, layerId: string) => {
      handleUpdateObject(objectId, { layerId });
  };

  // --- PAINT HANDLERS ---
  const handleSetBrush = (tool: EditorTool, assetId: string | null) => {
      setCurrentTool(tool);
      setActiveBrushId(assetId);
  };

  // --- RENDER ---

  if (viewState === 'START') {
      return <StartScreen onNewProject={handleNewProject} onLoadProject={handleLoadProject} />;
  }

  // Improved NavItem Component with tooltip
  const NavItem = ({ icon: Icon, label, isActive, onClick, isSubItem = false }: { icon: any, label: string, isActive?: boolean, onClick: () => void, isSubItem?: boolean }) => (
     <button 
        onClick={onClick}
        className={`w-full flex items-center px-3 py-3 transition-colors relative group
        ${isActive ? 'text-white bg-blue-900/40 border-r-2 border-blue-500' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}
        ${isSubItem ? 'pl-4' : ''}`}
        title={label}
     >
         <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-400' : ''}`} />
         <span className={`ml-3 text-xs font-medium transition-opacity duration-300 whitespace-nowrap ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
             {label}
         </span>
         
         {!isSidebarOpen && (
             <div className="absolute left-full ml-2 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 whitespace-nowrap z-[60] pointer-events-none border border-gray-700">
                 {label}
             </div>
         )}
     </button>
  );

  return (
    <div className="h-screen w-screen bg-gray-950 text-white font-sans overflow-hidden flex flex-col relative animate-in fade-in duration-500">
      
      {/* 1. Top Navbar (Clean) */}
      <div className="relative z-50 flex-shrink-0">
        <Navbar 
          onSave={() => setIsExportOpen(true)} 
          onQuickSave={handleOpenSaveModal} 
          onPreview={() => setIsPreviewOpen(true)}
        />
        <button 
           onClick={() => { if(confirm("¿Volver al inicio? Se perderán los cambios no guardados.")) setViewState('START'); }}
           className="absolute top-3 right-3 bg-gray-800/50 hover:bg-gray-800 p-2 rounded-full text-xs text-gray-500 z-50"
           title="Volver al Inicio"
        >
            <ArrowRight className="w-4 h-4 rotate-180" />
        </button>

        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-50 text-[10px] text-gray-400 flex flex-col items-center">
            <span>{projectName}</span>
            <span className="text-orange-400 text-[9px]">{currentScene?.name || '...'}</span>
        </div>
      </div>

      {/* 2. Main Workspace (Flex Container) */}
      <div className="flex-1 flex overflow-hidden relative">

          {/* LEFT MAIN SIDEBAR (Navigation & Tools) */}
          <div 
            className={`bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-300 ease-in-out z-50 shadow-xl ${isSidebarOpen ? 'w-48' : 'w-14'}`}
          >
               <div className="flex justify-end p-2 border-b border-gray-800">
                   <button 
                     onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                     className="p-1.5 text-gray-500 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
                   >
                       {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                   </button>
               </div>

               <div className="flex-1 py-2 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-700">
                   <div className="px-3 pb-2 pt-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider hidden md:block opacity-50">
                       {isSidebarOpen ? 'Vistas' : '—'}
                   </div>
                   <NavItem 
                      icon={Layout} 
                      label="Editor Escena" 
                      isActive={editorMode === 'SCENE'} 
                      onClick={() => setEditorMode('SCENE')} 
                   />
                   <NavItem 
                      icon={Workflow} 
                      label="Editor Eventos" 
                      isActive={editorMode === 'EVENTS'} 
                      onClick={() => setEditorMode('EVENTS')} 
                   />
                   
                   <div className="h-px bg-gray-800 mx-3 my-2" />
                   <div className="px-3 pb-2 pt-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider hidden md:block opacity-50">
                       {isSidebarOpen ? 'Herramientas' : '—'}
                   </div>

                   <NavItem 
                      icon={Clapperboard} 
                      label="Gestor Escenas" 
                      onClick={() => setIsSceneManagerOpen(true)} 
                   />
                   <NavItem 
                      icon={Grid3x3} 
                      label="Sprites y Pixel Art" 
                      onClick={() => handleOpenAssetManager()} 
                   />
                   <NavItem 
                      icon={VariableIcon} 
                      label="Variables Globales" 
                      onClick={() => setIsVarManagerOpen(true)} 
                   />
                   <NavItem 
                      icon={Video} 
                      label="Cámara" 
                      onClick={() => setIsCameraModalOpen(true)} 
                   />
                   
                   <div className="h-px bg-gray-800 mx-3 my-2" />
                   
                   <NavItem 
                      icon={canvasConfig.mode === 'LANDSCAPE' ? MonitorSmartphone : Smartphone} 
                      label={canvasConfig.mode === 'LANDSCAPE' ? 'Horizontal' : 'Vertical'} 
                      onClick={handleToggleOrientation} 
                   />
               </div>
          </div>

          {/* CONTENT AREA */}
          <div className="flex-1 relative flex flex-col overflow-hidden bg-gray-950">
              
              {/* SCENE EDITOR */}
              <div className={`flex-1 flex flex-col relative overflow-hidden ${editorMode === 'SCENE' ? 'flex' : 'hidden'}`}>
                    
                    {/* Floating Toolbar (Tools) */}
                    <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2 bg-gray-800/90 backdrop-blur border border-gray-700 p-1.5 rounded-xl shadow-xl">
                        <button onClick={() => {setCurrentTool(EditorTool.SELECT); setActiveBrushId(null);}} className={`p-3 rounded-lg transition-all ${currentTool === EditorTool.SELECT ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`} title="Mover">
                            <Move className="w-5 h-5" />
                        </button>
                        <button onClick={() => {setCurrentTool(EditorTool.RESIZE); setActiveBrushId(null);}} className={`p-3 rounded-lg transition-all ${currentTool === EditorTool.RESIZE ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`} title="Escalar">
                            <Maximize className="w-5 h-5" />
                        </button>
                        <button onClick={() => {setCurrentTool(EditorTool.HAND); setActiveBrushId(null);}} className={`p-3 rounded-lg transition-all ${currentTool === EditorTool.HAND ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`} title="Mano">
                            <Hand className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {/* Canvas Area - Flex Grow */}
                    <div className="flex-1 relative">
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
                            onSelectObject={handleSelectObject}
                            onUpdateObject={handleUpdateObject}
                            onEditObject={handleEditObject}
                        />
                    </div>

                    {/* DOCK for Drawers (STATIC FOOTER) */}
                    <div className="h-16 bg-gray-900 border-t border-gray-800 flex items-center justify-center space-x-12 px-4 z-40 shrink-0 safe-area-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.3)] relative">
                         <button onClick={() => togglePanel('library')} className={`flex flex-col items-center justify-center space-y-1 w-12 ${activePanel === 'library' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
                             <Box className="w-6 h-6" />
                             <span className="text-[10px] font-bold">Objetos</span>
                         </button>

                         {/* Floating Plus Button (Visual Only, opens Library too) */}
                         <div className="relative -top-8">
                             <button onClick={() => togglePanel('library')} className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg text-white border-4 border-gray-950 transform hover:scale-105 transition-transform">
                               <Plus className="w-7 h-7" />
                             </button>
                         </div>

                         <button onClick={() => togglePanel('properties')} className={`flex flex-col items-center justify-center space-y-1 w-12 ${activePanel === 'properties' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
                             <Settings className="w-6 h-6" />
                             <span className="text-[10px] font-bold">Editar</span>
                         </button>

                         <button onClick={() => togglePanel('layers')} className={`flex flex-col items-center justify-center space-y-1 w-12 ${activePanel === 'layers' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
                             <Layers className="w-6 h-6" />
                             <span className="text-[10px] font-bold">Capas</span>
                         </button>
                    </div>
              </div>

              {/* EVENTS EDITOR */}
              <div className={`flex-1 relative bg-gray-900 ${editorMode === 'EVENTS' ? 'block' : 'hidden'}`}>
                  <EventSheet 
                      objects={objects}
                      scenes={scenes}
                      onUpdateObject={handleUpdateObject}
                  />
              </div>

          </div>
      </div>

      {/* 4. Drawers & Modals */}
      <EditObjectModal 
        isOpen={!!editingObject}
        object={editingObject}
        onClose={() => setEditingObject(null)}
        onSave={handleUpdateObject}
      />

      <GamePreviewModal 
        isOpen={isPreviewOpen}
        objects={objects} 
        scenes={scenes} 
        initialSceneId={currentSceneId}
        canvasConfig={canvasConfig}
        onClose={() => setIsPreviewOpen(false)}
        globalVariables={globalVariables} 
      />

      <ExportModal 
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        gameData={{objects, scenes, layers, canvasConfig, assets, globalVariables}} 
      />
      
      <AssetManagerModal
        isOpen={isAssetManagerOpen}
        assets={assets}
        onClose={() => setIsAssetManagerOpen(false)}
        onAddAsset={handleAddAsset}
        onDeleteAsset={handleDeleteAsset}
        onSelectAsset={assetSelectCallback ? handleAssetSelect : undefined}
      />

      <VariableManagerModal 
        isOpen={isVarManagerOpen}
        variables={globalVariables}
        onClose={() => setIsVarManagerOpen(false)}
        onUpdateVariables={setGlobalVariables}
      />

      <SceneManagerModal 
        isOpen={isSceneManagerOpen}
        scenes={scenes}
        currentSceneId={currentSceneId}
        onClose={() => setIsSceneManagerOpen(false)}
        onSelectScene={(id) => { setCurrentSceneId(id); setSelectedObjectId(null); }}
        onAddScene={handleAddScene}
        onRenameScene={handleRenameScene}
        onDeleteScene={handleDeleteScene}
      />
      
      <CameraSettingsModal 
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        objects={objects}
        cameraConfig={cameraConfig}
        onUpdateCamera={handleUpdateCamera}
      />

      <SaveProjectModal
        isOpen={isSaveModalOpen}
        currentName={projectName}
        onClose={() => setIsSaveModalOpen(false)}
        onConfirm={handleConfirmSave}
      />

      {/* Sliding Panels Overlay */}
      {activePanel !== 'none' && editorMode === 'SCENE' && (
        <div 
          className="absolute inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setActivePanel('none')}
        />
      )}

      {/* Sliding Panels (Z-50 to cover dock if needed, or Z-30 to slide under? Usually panels go over) */}
      <div className={`absolute bottom-0 left-0 right-0 h-[60%] z-[60] transform transition-transform duration-300 ease-out ${activePanel === 'library' && editorMode === 'SCENE' ? 'translate-y-0' : 'translate-y-full'}`}>
        <ObjectLibrary 
          objects={objects}
          selectedObjectId={selectedObjectId}
          onAddObject={handleAddObject}
          onSelectObject={handleSelectObject}
          onDeleteObject={handleDeleteObject}
          onClose={() => setActivePanel('none')}
          className="rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
        />
      </div>

      <div className={`absolute bottom-0 left-0 right-0 h-[60%] z-[60] transform transition-transform duration-300 ease-out ${activePanel === 'properties' && editorMode === 'SCENE' ? 'translate-y-0' : 'translate-y-full'}`}>
        <PropertiesPanel 
          selectedObject={selectedObject}
          objects={objects}
          globalVariables={globalVariables}
          assets={assets} 
          onUpdateObject={handleUpdateObject}
          onOpenAssetManager={handleOpenAssetManager}
          onSetBrush={handleSetBrush} 
          activeBrushId={activeBrushId} 
          brushSolid={brushSolid} 
          onSetBrushSolid={setBrushSolid} 
          currentTool={currentTool}
          onClose={() => setActivePanel('none')}
          className="rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
        />
      </div>

      <div className={`absolute bottom-0 left-0 right-0 h-[50%] z-[60] transform transition-transform duration-300 ease-out ${activePanel === 'layers' && editorMode === 'SCENE' ? 'translate-y-0' : 'translate-y-full'}`}>
        <LayersPanel 
          layers={layers}
          selectedObjectId={selectedObjectId}
          activeLayerId={activeLayerId} 
          onSelectLayer={setActiveLayerId} 
          objects={objects}
          onAddLayer={handleAddLayer}
          onRemoveLayer={handleRemoveLayer}
          onUpdateLayer={handleUpdateLayer}
          onMoveLayer={handleMoveLayer}
          onAssignObjectToLayer={handleAssignObjectToLayer}
          onClose={() => setActivePanel('none')}
          className="rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
        />
      </div>
    </div>
  );
};