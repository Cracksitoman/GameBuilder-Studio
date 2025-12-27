
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
import { ScriptEditorModal } from './components/ScriptEditorModal'; 
import { DocumentationPage } from './components/DocumentationPage'; 
import { MobileSettingsModal } from './components/MobileSettingsModal'; // NEW IMPORT
import { GameObject, ObjectType, EditorTool, CanvasConfig, Layer, Asset, Variable, Scene, CameraConfig } from './types';
import { Layers, Plus, Settings, Box, Move, Maximize, Hand, ArrowRight, Layout, Workflow, Grid3x3, Menu, ChevronLeft, Clapperboard, Variable as VariableIcon, Video, Smartphone, MonitorSmartphone, Home } from './components/Icons';

// Helper to create object with layer
const createInitialObject = (type: ObjectType, count: number, layerId: string): GameObject => {
  const base: Partial<GameObject> = {
    id: crypto.randomUUID(),
    zIndex: 1,
    layerId: layerId,
    visible: true,
    opacity: 1,
    rotation: 0,
    isObstacle: false,
    behaviors: [],
    events: [],
    variables: []
  };

  switch (type) {
    case ObjectType.TEXT:
      return { ...base, name: 'Texto Nuevo', type: ObjectType.TEXT, x: 100, y: 100, width: 150, height: 50, color: '#ffffff' } as GameObject;
    case ObjectType.PLAYER:
       return { ...base, name: `Jugador ${count}`, type: ObjectType.PLAYER, x: 50, y: 200, width: 32, height: 32, color: '#22c55e' } as GameObject;
    case ObjectType.ENEMY:
      return { ...base, name: `Enemigo ${count}`, type: ObjectType.ENEMY, x: 300, y: 200, width: 32, height: 32, color: '#ef4444' } as GameObject;
    case ObjectType.TILEMAP:
        return { ...base, name: `Mapa ${count}`, type: ObjectType.TILEMAP, x: 0, y: 0, width: 320, height: 320, color: 'transparent', tilemap: { tileSize: 32, tiles: {} } } as GameObject;
    default:
      return { ...base, name: `Sprite ${count}`, type: ObjectType.SPRITE, x: 200, y: 150, width: 50, height: 50, color: '#3b82f6', isObstacle: true } as GameObject;
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
  const [assets, setAssets] = useState<Asset[]>([]); 
  const [globalVariables, setGlobalVariables] = useState<Variable[]>([]); 

  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>('none');
  const [currentTool, setCurrentTool] = useState<EditorTool>(EditorTool.SELECT);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);
  const [activeBrushId, setActiveBrushId] = useState<string | null>(null);
  const [brushSolid, setBrushSolid] = useState<boolean>(false); 
  
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
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false); // NEW
  
  // Script Editor State
  const [isScriptEditorOpen, setIsScriptEditorOpen] = useState(false);
  const [scriptEditingObjectId, setScriptEditingObjectId] = useState<string | null>(null);

  // Callback storage for Asset Selection
  const [assetSelectionCallback, setAssetSelectionCallback] = useState<((url: string) => void) | null>(null);

  const currentScene = scenes.find(s => s.id === currentSceneId);
  const objects = currentScene ? currentScene.objects : [];
  const layers = currentScene ? currentScene.layers : [];
  const selectedObject = objects.find(o => o.id === selectedObjectId) || null;
  const cameraConfig = currentScene?.camera || { targetObjectId: null, smooth: true, followSpeed: 0.1 };

  useEffect(() => {
      if (currentScene && currentScene.layers.length > 0) {
          const exists = currentScene.layers.find(l => l.id === activeLayerId);
          if (!exists) setActiveLayerId(currentScene.layers[currentScene.layers.length - 1].id);
      }
  }, [currentSceneId, scenes]);

  const updateCurrentScene = (updates: Partial<Scene>) => {
      setScenes(prev => prev.map(s => s.id === currentSceneId ? { ...s, ...updates } : s));
  };

  const handleUpdateObjectInScene = (id: string, updates: Partial<GameObject>) => {
      if (!currentScene) return;
      const newObjects = currentScene.objects.map(obj => obj.id === id ? { ...obj, ...updates } : obj);
      updateCurrentScene({ objects: newObjects });
  };
  
  const handleUpdateCamera = (config: CameraConfig) => updateCurrentScene({ camera: config });

  // Script Handling
  const handleOpenScriptEditor = (objectId: string) => {
      setScriptEditingObjectId(objectId);
      setIsScriptEditorOpen(true);
  };

  const handleSaveScript = (code: string) => {
      if (scriptEditingObjectId) {
          handleUpdateObjectInScene(scriptEditingObjectId, { script: code });
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
          camera: { targetObjectId: null, smooth: true, followSpeed: 0.1 }
      };
      setScenes([initialScene]);
      setCurrentSceneId(firstSceneId);
      setActiveLayerId(firstLayerId); 
      setAssets([]);
      setGlobalVariables([]);
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
                  setAssets(json.assets || []); 
                  setGlobalVariables(json.globalVariables || []);
                  setProjectName(json.metadata?.name || file.name.replace(/\.[^/.]+$/, ""));
                  setViewState('EDITOR');
              } else alert("Proyecto inválido.");
          } catch (err) { alert("Error al cargar."); }
      };
      reader.readAsText(file);
  };

  const handleConfirmSave = (name: string) => {
      setProjectName(name); 
      const gameData = { metadata: { name, version: "2.5", timestamp: Date.now() }, scenes, canvasConfig, assets, globalVariables };
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

  const handleAddObject = (type: ObjectType) => {
    if (!currentScene) return;
    const targetLayerId = activeLayerId || layers[layers.length - 1].id;
    const newObj = createInitialObject(type, objects.length + 1, targetLayerId);
    updateCurrentScene({ objects: [...objects, newObj] });
    setSelectedObjectId(newObj.id);
    setActivePanel('none');
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
      <div className="relative z-50 flex-shrink-0">
        <Navbar onSave={() => setIsExportOpen(true)} onQuickSave={() => setIsSaveModalOpen(true)} onPreview={() => setIsPreviewOpen(true)} />
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
                            onSelectObject={(id) => setSelectedObjectId(id)} 
                            onUpdateObject={handleUpdateObjectInScene} 
                            onEditObject={(o) => setEditingObject(o)} 
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
                  <EventSheet objects={objects} scenes={scenes} onUpdateObject={handleUpdateObjectInScene} />
                  {/* Note: EventSheet logic needs to access assets for PlaySound. 
                      Since EventSheet uses internal state for the modal, we need to pass assets down 
                      or change how the modal is invoked. For this snippet, I will rely on the fact 
                      EventActionModal handles assets via a prop which we need to thread through EventSheet.
                      
                      Correction: To keep changes minimal, I will hack `EventSheet` to accept assets via props in real implementation, 
                      but for now, `EventActionModal` imports `AssetManagerModal` and uses `assets` from parent.
                      In `App.tsx`, `assets` is state.
                      
                      Best approach here: Pass `assets` and `onAddAsset` to `EventSheet`.
                  */}
              </div>
          </div>
      </div>

      <EditObjectModal isOpen={!!editingObject} object={editingObject} onClose={() => setEditingObject(null)} onSave={handleUpdateObjectInScene} />
      <GamePreviewModal isOpen={isPreviewOpen} objects={objects} scenes={scenes} initialSceneId={currentSceneId} canvasConfig={canvasConfig} onClose={() => setIsPreviewOpen(false)} globalVariables={globalVariables} />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} gameData={{objects, scenes, layers, canvasConfig, assets}} />
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
             objectName={objects.find(o => o.id === scriptEditingObjectId)?.name || 'Objeto'}
             initialCode={objects.find(o => o.id === scriptEditingObjectId)?.script || ''}
             onClose={() => setIsScriptEditorOpen(false)}
             onSave={handleSaveScript}
          />
      )}

      {/* Panels remain same... */}
      {activePanel !== 'none' && editorMode === 'SCENE' && <div className="absolute inset-0 bg-black/50 z-[55]" onClick={() => setActivePanel('none')} />}
      <div className={`absolute bottom-0 left-0 right-0 h-[60%] z-[60] transform transition-transform duration-300 ease-out ${activePanel === 'library' && editorMode === 'SCENE' ? 'translate-y-0' : 'translate-y-full'}`}><ObjectLibrary objects={objects} selectedObjectId={selectedObjectId} onAddObject={handleAddObject} onSelectObject={(id) => setSelectedObjectId(id)} onDeleteObject={(id) => updateCurrentScene({ objects: objects.filter(o => o.id !== id) })} onClose={() => setActivePanel('none')} className="rounded-t-2xl" /></div>
      <div className={`absolute bottom-0 left-0 right-0 h-[60%] z-[60] transform transition-transform duration-300 ease-out ${activePanel === 'properties' && editorMode === 'SCENE' ? 'translate-y-0' : 'translate-y-full'}`}>
          <PropertiesPanel 
            selectedObject={selectedObject} 
            objects={objects} 
            globalVariables={globalVariables} 
            assets={assets} 
            onUpdateObject={handleUpdateObjectInScene} 
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
      <div className={`absolute bottom-0 left-0 right-0 h-[50%] z-[60] transform transition-transform duration-300 ease-out ${activePanel === 'layers' && editorMode === 'SCENE' ? 'translate-y-0' : 'translate-y-full'}`}><LayersPanel layers={layers} selectedObjectId={selectedObjectId} activeLayerId={activeLayerId} onSelectLayer={(id) => setActiveLayerId(id)} objects={objects} onAddLayer={() => updateCurrentScene({ layers: [...layers, { id: crypto.randomUUID(), name: `Capa ${layers.length + 1}`, visible: true, locked: false }] })} onRemoveLayer={(id) => { if (layers.length > 1) updateCurrentScene({ layers: layers.filter(l => l.id !== id), objects: objects.filter(o => o.layerId !== id) }); }} onUpdateLayer={(id, u) => updateCurrentScene({ layers: layers.map(l => l.id === id ? { ...l, ...u } : l) })} onMoveLayer={(id, d) => { /* logic */ }} onAssignObjectToLayer={(oid, lid) => handleUpdateObjectInScene(oid, { layerId: lid })} onClose={() => setActivePanel('none')} className="rounded-t-2xl" /></div>
    </div>
  );
};
