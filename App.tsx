import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Canvas } from './components/Canvas';
import { ObjectLibrary } from './components/ObjectLibrary';
import { PropertiesPanel } from './components/PropertiesPanel';
import { LayersPanel } from './components/LayersPanel';
import { EventSheet } from './components/EventSheet';
import { BlockEditor } from './components/BlockEditor';
import { StartScreen } from './components/StartScreen';
import { AssetManagerModal } from './components/AssetManagerModal';
import { GamePreviewModal } from './components/GamePreviewModal';
import { SaveProjectModal } from './components/SaveProjectModal';
import { SceneManagerModal } from './components/SceneManagerModal';
import { CameraSettingsModal } from './components/CameraSettingsModal';
import { MobileSettingsModal } from './components/MobileSettingsModal';
import { WorldSettingsModal } from './components/WorldSettingsModal';
import { ExportModal } from './components/ExportModal';
import { ScriptEditorModal } from './components/ScriptEditorModal';
import { DocumentationPage } from './components/DocumentationPage';

import { GameObject, Scene, Layer, Asset, Variable, EditorTool, ObjectType, CanvasConfig, Plugin } from './types';
// Fixed: Added SmartphoneIcon to imports to resolve the "Cannot find name 'SmartphoneIcon'" error.
import { Layout, Box, Settings, Layers, Globe, FileUp, Code2, MousePointer2, Maximize2, Hand, Map as MapIcon, SmartphoneIcon } from './components/Icons';

export const App = () => {
  // --- STATE ---
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [projectName, setProjectName] = useState('Mi Juego');
  
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentSceneId, setCurrentSceneId] = useState<string>('');
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  const [library, setLibrary] = useState<GameObject[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  
  const [globalVariables, setGlobalVariables] = useState<Variable[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  
  // Configuración de Canvas con controles móviles activados por defecto
  const [canvasConfig, setCanvasConfig] = useState<CanvasConfig>({ 
    width: 800, 
    height: 450, 
    mode: 'LANDSCAPE',
    mobileControls: {
        enabled: true,
        joystickX: 15,
        joystickY: 75,
        joystickSize: 140,
        buttonX: 85,
        buttonY: 75,
        buttonSize: 90,
        opacity: 0.6,
        color: '#ffffff'
    }
  });
  
  // UI State - Paneles
  const [showLibrary, setShowLibrary] = useState(true);
  const [showProperties, setShowProperties] = useState(false);
  const [showLayers, setShowLayers] = useState(false);

  const toggleLibrary = () => {
    const newState = !showLibrary;
    setShowLibrary(newState);
    if (newState) { setShowProperties(false); setShowLayers(false); }
  };

  const toggleProperties = () => {
    const newState = !showProperties;
    setShowProperties(newState);
    if (newState) { setShowLibrary(false); setShowLayers(false); }
  };

  const toggleLayers = () => {
    const newState = !showLayers;
    setShowLayers(newState);
    if (newState) { setShowLibrary(false); setShowProperties(false); }
  };

  const [viewMode, setViewMode] = useState<'CANVAS' | 'EVENTS' | 'BLOCKS' | 'DOCS'>('CANVAS');
  const [currentTool, setCurrentTool] = useState<EditorTool>(EditorTool.SELECT);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(32);

  // Drag from Library State
  const [isDraggingFromLibrary, setIsDraggingFromLibrary] = useState(false);
  const [draggedLibObj, setDraggedLibObj] = useState<GameObject | null>(null);
  const [dragPointerPos, setDragPointerPos] = useState({ x: 0, y: 0 });
  const [canvasTransform, setCanvasTransform] = useState({ x: 0, y: 0, zoom: 1 });

  // Modals
  const [isAssetManagerOpen, setIsAssetManagerOpen] = useState(false);
  const [assetManagerCallback, setAssetManagerCallback] = useState<((url: string | string[]) => void) | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSceneManagerOpen, setIsSceneManagerOpen] = useState(false);
  const [isWorldSettingsOpen, setIsWorldSettingsOpen] = useState(false);
  const [isScriptEditorOpen, setIsScriptEditorOpen] = useState(false);
  const [isMobileSettingsOpen, setIsMobileSettingsOpen] = useState(false);
  const [scriptTargetId, setScriptTargetId] = useState<string | null>(null);

  // --- HELPERS ---
  const currentScene = scenes.find(s => s.id === currentSceneId);
  const objects = currentScene?.objects || [];
  const layers = currentScene?.layers || [];
  const selectedObject = objects.find(o => o.id === selectedObjectId) || library.find(o => o.id === selectedObjectId) || null;

  // --- GLOBAL DRAG HANDLERS ---
  useEffect(() => {
    if (!isDraggingFromLibrary) return;

    const handleGlobalMove = (e: PointerEvent) => {
        setDragPointerPos({ x: e.clientX, y: e.clientY });
    };

    const handleGlobalUp = (e: PointerEvent) => {
        const dropZone = document.getElementById('koda-stage-area');
        if (dropZone && draggedLibObj) {
            const rect = dropZone.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                const stageX = (e.clientX - rect.left) / canvasTransform.zoom;
                const stageY = (e.clientY - rect.top) / canvasTransform.zoom;
                handleDropObject(draggedLibObj.id, stageX, stageY);
            }
        }
        setIsDraggingFromLibrary(false);
        setDraggedLibObj(null);
    };

    window.addEventListener('pointermove', handleGlobalMove);
    window.addEventListener('pointerup', handleGlobalUp);
    return () => {
        window.removeEventListener('pointermove', handleGlobalMove);
        window.removeEventListener('pointerup', handleGlobalUp);
    };
  }, [isDraggingFromLibrary, draggedLibObj, canvasTransform]);

  // --- HANDLERS ---
  const handleNewProject = (config?: { name: string, orientation: 'LANDSCAPE' | 'PORTRAIT' }) => {
      const sceneId = crypto.randomUUID();
      const layerId = crypto.randomUUID();
      
      const width = config?.orientation === 'PORTRAIT' ? 450 : 800;
      const height = config?.orientation === 'PORTRAIT' ? 800 : 450;

      setProjectName(config?.name || 'Nuevo Proyecto');
      setCanvasConfig(prev => ({
          ...prev,
          width,
          height,
          mode: config?.orientation || 'LANDSCAPE'
      }));

      setScenes([{
          id: sceneId,
          name: 'Nivel 1',
          objects: [],
          layers: [{ id: layerId, name: 'Capa 1', visible: true, locked: false }],
          backgroundColor: '#111827',
          width,
          height
      }]);
      setCurrentSceneId(sceneId);
      setActiveLayerId(layerId);
      setProjectLoaded(true);
  };

  const handleLoadProject = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const data = JSON.parse(e.target?.result as string);
              setScenes(data.scenes || []);
              setLibrary(data.library || []);
              setGlobalVariables(data.globalVariables || []);
              setAssets(data.assets || []);
              if (data.scenes?.[0]) {
                  setCurrentSceneId(data.scenes[0].id);
                  setActiveLayerId(data.scenes[0].layers?.[0]?.id || null);
              }
              setProjectLoaded(true);
          } catch (err) { alert("Error al cargar"); }
      };
      reader.readAsText(file);
  };

  const handleUpdateObjectAnywhere = (id: string, updates: Partial<GameObject>) => {
      // PROPIEDADES QUE SON ÚNICAS DE LA INSTANCIA (NO SE SINCRONIZAN)
      // Nota: 'rotation' a veces se quiere sincronizar, pero en level design suele ser única. 
      // Aquí asumimos que X, Y, Z, Capa y ID son únicos. El resto se sincroniza.
      const instanceSpecificKeys = ['x', 'y', 'rotation', 'zIndex', 'layerId', 'id', 'group', 'isPointerDown', 'vx', 'vy', 'prototypeId'];

      // 1. Verificar si estamos editando directamente el objeto en la LIBRERÍA
      const isLibraryObject = library.some(o => o.id === id);

      if (isLibraryObject) {
          // ACTUALIZAR LIBRERÍA
          setLibrary(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
          
          // ACTUALIZAR TODAS LAS INSTANCIAS (Sincronización hacia abajo)
          // Preservando posición (x,y), capa y zIndex de las instancias.
          setScenes(prev => prev.map(s => ({
              ...s,
              objects: s.objects.map(o => {
                  if (o.prototypeId === id) {
                      // Mantenemos las props de la instancia, sobreescribimos con las nuevas de la librería
                      // Filtramos las actualizaciones para no machacar x/y accidentalmente si vinieran en updates
                      const cleanUpdates: any = {};
                      Object.keys(updates).forEach(key => {
                          if (!instanceSpecificKeys.includes(key) || key === 'width' || key === 'height') { 
                              // Permitimos width/height bajar desde la librería si se edita el master
                              cleanUpdates[key] = (updates as any)[key];
                          }
                      });
                      return { ...o, ...cleanUpdates };
                  }
                  return o;
              })
          })));
          return;
      }

      // 2. Estamos editando una INSTANCIA en la escena.
      // Buscamos el objeto en la escena actual para obtener su prototypeId
      const currentSceneObj = scenes.flatMap(s => s.objects).find(o => o.id === id);
      if (!currentSceneObj) return;

      const prototypeId = currentSceneObj.prototypeId;

      // Calcular qué propiedades son "Compartidas" (del Prototipo)
      const sharedUpdates: any = {};
      Object.keys(updates).forEach(key => {
          if (!instanceSpecificKeys.includes(key)) {
              sharedUpdates[key] = (updates as any)[key];
          }
      });
      // Excepción: Permitir que width/height se sincronicen hacia arriba si el usuario los cambia
      if (updates.width !== undefined) sharedUpdates.width = updates.width;
      if (updates.height !== undefined) sharedUpdates.height = updates.height;

      // A. Si hay propiedades compartidas cambiadas, ACTUALIZAMOS LA LIBRERÍA (Sincronización hacia arriba)
      if (prototypeId && Object.keys(sharedUpdates).length > 0) {
          setLibrary(prev => prev.map(libObj => 
              libObj.id === prototypeId 
                  ? { ...libObj, ...sharedUpdates } 
                  : libObj
          ));
      }

      // B. ACTUALIZAMOS LAS ESCENAS
      // Aquí aplicamos:
      // 1. Al objeto editado (id): TODOS los cambios (updates completos).
      // 2. A los hermanos (mismo prototypeId): SOLO los cambios compartidos (sharedUpdates).
      setScenes(prev => prev.map(s => ({
          ...s,
          objects: s.objects.map(o => {
              // Caso 1: Es el objeto que estamos tocando
              if (o.id === id) {
                  return { ...o, ...updates };
              }
              // Caso 2: Es un hermano (otra instancia del mismo prototipo)
              if (prototypeId && o.prototypeId === prototypeId && Object.keys(sharedUpdates).length > 0) {
                  return { ...o, ...sharedUpdates };
              }
              return o;
          })
      })));
  };

  const handleDeleteObject = (id: string) => {
    if (!id) return;
    const isFromLibrary = library.find(o => o.id === id);
    if (isFromLibrary) {
        if (confirm("¿Eliminar objeto de la librería? Esto no borrará las copias ya puestas en escenas.")) {
            setLibrary(prev => prev.filter(o => o.id !== id));
        }
    } else {
        setScenes(prev => prev.map(s => s.id === currentSceneId ? { ...s, objects: s.objects.filter(o => o.id !== id) } : s));
    }
    setSelectedObjectId(null);
  };

  const handleDropObject = (id: string, x: number, y: number) => {
     if (!activeLayerId || !currentSceneId) return;
     const proto = library.find(o => o.id === id);
     if (!proto) return;

     const snap = (v: number) => showGrid ? Math.round(v / gridSize) * gridSize : v;
     const newInstance: GameObject = { 
         ...JSON.parse(JSON.stringify(proto)), 
         id: crypto.randomUUID(), 
         prototypeId: proto.id, 
         x: snap(x - proto.width / 2), 
         y: snap(y - proto.height / 2), 
         layerId: activeLayerId,
         zIndex: objects.length 
     };
     
     setScenes(prev => prev.map(s => s.id === currentSceneId ? { ...s, objects: [...s.objects, newInstance] } : s));
     setSelectedObjectId(newInstance.id);
  };

  const handleStartDragFromLibrary = (e: React.PointerEvent, obj: GameObject) => {
      setDraggedLibObj(obj);
      setIsDraggingFromLibrary(true);
      setDragPointerPos({ x: e.clientX, y: e.clientY });
      setShowLibrary(false);
      setShowLayers(false);
      setShowProperties(false);
  };

  const handleSelectScene = (id: string) => {
      setCurrentSceneId(id);
      const scene = scenes.find(s => s.id === id);
      if (scene && scene.layers.length > 0) {
          setActiveLayerId(scene.layers[0].id);
      }
      setSelectedObjectId(null);
  };

  const handleAddScene = (name: string) => {
      const id = crypto.randomUUID();
      const layerId = crypto.randomUUID();
      const newScene: Scene = { 
          id, 
          name, 
          objects: [], 
          layers: [{ id: layerId, name: 'Capa 1', visible: true, locked: false }], 
          backgroundColor: '#111827' 
      };
      setScenes([...scenes, newScene]);
      setCurrentSceneId(id);
      setActiveLayerId(layerId);
      setSelectedObjectId(null);
  };

  if (!projectLoaded) return <StartScreen onNewProject={handleNewProject} onLoadProject={handleLoadProject} onOpenDocs={() => setViewMode('DOCS')} />;
  if (viewMode === 'DOCS') return <DocumentationPage onBack={() => setViewMode('CANVAS')} />;

  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex flex-col overflow-hidden relative">
      <Navbar 
          onPreview={() => setIsPreviewOpen(true)}
          onSave={() => setIsExportModalOpen(true)}
          onQuickSave={() => setIsSaveModalOpen(true)}
          canUndo={false} canRedo={false}
      />

      {/* Toolbar Superior */}
      <div className="h-10 bg-gray-900 border-b border-gray-800 flex items-center px-2 space-x-3 shrink-0 z-50 overflow-x-auto scrollbar-hide">
          <div className="flex bg-gray-800 rounded-md p-0.5 shrink-0">
             <button onClick={() => setViewMode('CANVAS')} className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all uppercase ${viewMode === 'CANVAS' ? 'bg-orange-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Escena</button>
             <button onClick={() => setViewMode('BLOCKS')} className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all uppercase ${viewMode === 'BLOCKS' ? 'bg-orange-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Bloques</button>
             <button onClick={() => setViewMode('EVENTS')} className={`px-2 py-0.5 rounded-md text-[10px] font-black transition-all uppercase ${viewMode === 'EVENTS' ? 'bg-orange-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Eventos</button>
          </div>

          <div className="h-4 w-px bg-gray-700 shrink-0"></div>

          <div className="flex bg-gray-800 rounded-md p-0.5 shrink-0">
             <button onClick={() => setCurrentTool(EditorTool.SELECT)} className={`p-1.5 rounded transition-all ${currentTool === EditorTool.SELECT ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`} title="Seleccionar"><MousePointer2 className="w-3.5 h-3.5" /></button>
             <button onClick={() => setCurrentTool(EditorTool.RESIZE)} className={`p-1.5 rounded transition-all ${currentTool === EditorTool.RESIZE ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`} title="Escalar"><Maximize2 className="w-3.5 h-3.5" /></button>
             <button onClick={() => setCurrentTool(EditorTool.HAND)} className={`p-1.5 rounded transition-all ${currentTool === EditorTool.HAND ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`} title="Mover Cámara"><Hand className="w-3.5 h-3.5" /></button>
          </div>

          <div className="h-4 w-px bg-gray-700 shrink-0"></div>

          <div className="flex space-x-1 shrink-0">
             <button onClick={toggleLibrary} className={`p-1.5 rounded-md transition-colors ${showLibrary ? 'bg-gray-700 text-orange-400 border border-orange-500/30' : 'text-gray-400 hover:bg-gray-800'}`} title="Librería"><Box className="w-4 h-4" /></button>
             <button onClick={toggleLayers} className={`p-1.5 rounded-md transition-colors ${showLayers ? 'bg-gray-700 text-orange-400 border border-orange-500/30' : 'text-gray-400 hover:bg-gray-800'}`} title="Capas"><Layers className="w-4 h-4" /></button>
             <button onClick={toggleProperties} className={`p-1.5 rounded-md transition-colors ${showProperties ? 'bg-gray-700 text-orange-400 border border-orange-500/30' : 'text-gray-400 hover:bg-gray-800'}`} title="Propiedades"><Settings className="w-4 h-4" /></button>
          </div>

          <div className="h-4 w-px bg-gray-700 shrink-0"></div>
          
          <div className="flex items-center space-x-4 shrink-0 pr-4">
              <button onClick={() => setIsAssetManagerOpen(true)} className="text-[10px] uppercase font-black text-gray-500 hover:text-white flex items-center transition-colors whitespace-nowrap"><FileUp className="w-3.5 h-3.5 mr-1" /> Assets</button>
              <button onClick={() => setIsSceneManagerOpen(true)} className="text-[10px] uppercase font-black text-gray-500 hover:text-white flex items-center transition-colors whitespace-nowrap"><Layout className="w-3.5 h-3.5 mr-1" /> Escenas</button>
              <button onClick={() => setIsMobileSettingsOpen(true)} className="text-[10px] uppercase font-black text-gray-500 hover:text-white flex items-center transition-colors whitespace-nowrap"><SmartphoneIcon className="w-3.5 h-3.5 mr-1" /> Controles</button>
              <button onClick={() => setIsWorldSettingsOpen(true)} className="text-[10px] uppercase font-black text-gray-500 hover:text-white flex items-center transition-colors whitespace-nowrap"><Globe className="w-3.5 h-3.5 mr-1" /> Ajustes Mundo</button>
          </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
          <aside className={`bg-gray-900 border-r border-gray-800 transition-all duration-300 ease-in-out z-40 ${showLibrary ? 'w-56 opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-full overflow-hidden'} absolute inset-y-0 left-0 lg:relative lg:translate-x-0`}>
              <ObjectLibrary objects={library} selectedObjectId={selectedObjectId} onAddObject={(type) => { const newObj = { id: crypto.randomUUID(), name: 'Nuevo Objeto', type, x:0, y:0, width:32, height:32, rotation:0, color:'#3b82f6', zIndex:0, layerId:'', visible:true, opacity:1, isObstacle:false, behaviors:[], events:[], variables:[] }; setLibrary([...library, newObj]); }} onSelectObject={setSelectedObjectId} onDeleteObject={handleDeleteObject} groups={groups} onAddGroup={(n) => setGroups([...groups, n])} onDeleteGroup={(n) => setGroups(groups.filter(g => g !== n))} onAssignToGroup={(id, g) => handleUpdateObjectAnywhere(id, { group: g === 'Sin Agrupar' ? undefined : g })} onStartDrag={handleStartDragFromLibrary} onClose={() => setShowLibrary(false)} className="h-full border-0" />
          </aside>

          <main className="flex-1 flex flex-col min-w-0 bg-[#0a0a0c] relative">
              <div className="flex-1 relative">
                {viewMode === 'CANVAS' && currentScene && (
                    <Canvas scene={currentScene} objects={objects} layers={layers} selectedObjectId={selectedObjectId} currentTool={currentTool} assets={assets} canvasConfig={canvasConfig} showGrid={showGrid} gridSize={gridSize} onToggleGrid={setShowGrid} onSetGridSize={setGridSize} onSelectObject={setSelectedObjectId} onUpdateObject={handleUpdateObjectAnywhere} onEditObject={(obj) => { setSelectedObjectId(obj.id); toggleProperties(); }} onDropObject={handleDropObject} onViewChange={(pos, z) => setCanvasTransform({ x: pos.x, y: pos.y, zoom: z })} onDeleteObject={handleDeleteObject} />
                )}
                {viewMode === 'EVENTS' && ( <EventSheet objects={objects} onUpdateObject={handleUpdateObjectAnywhere} scenes={scenes} library={library} globalVariables={globalVariables} plugins={plugins} assets={assets} /> )}
                {viewMode === 'BLOCKS' && ( <BlockEditor objects={objects} scenes={scenes} library={library} globalVariables={globalVariables} plugins={plugins} assets={assets} onUpdateObject={handleUpdateObjectAnywhere} onImportPlugin={(p) => setPlugins([...plugins, p])} /> )}
              </div>

              <div className={`bg-gray-900 border-t border-gray-800 transition-all duration-300 z-30 ${showLayers ? 'h-48' : 'h-0 overflow-hidden'}`}>
                  <LayersPanel layers={layers} selectedObjectId={selectedObjectId} activeLayerId={activeLayerId} onSelectLayer={setActiveLayerId} objects={objects} onAddLayer={() => { const newLayer = { id: crypto.randomUUID(), name: `Capa ${layers.length + 1}`, visible: true, locked: false }; setScenes(prev => prev.map(s => s.id === currentSceneId ? { ...s, layers: [...s.layers, newLayer] } : s)); setActiveLayerId(newLayer.id); }} onRemoveLayer={(id) => setScenes(prev => prev.map(s => s.id === currentSceneId ? { ...s, layers: s.layers.filter(l => l.id !== id), objects: s.objects.filter(o => o.layerId !== id) } : s))} onUpdateLayer={(id, upd) => setScenes(prev => prev.map(s => s.id === currentSceneId ? { ...s, layers: s.layers.map(l => l.id === id ? { ...l, ...upd } : l) } : s))} onMoveLayer={() => {}} onAssignObjectToLayer={(objId, lId) => handleUpdateObjectAnywhere(objId, { layerId: lId })} onClose={() => setShowLayers(false)} className="h-full border-0" />
              </div>
          </main>

          <aside className={`bg-gray-900 border-l border-gray-800 transition-all duration-300 ease-in-out z-40 ${showProperties ? 'w-72 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full overflow-hidden'} absolute inset-y-0 right-0 lg:relative lg:translate-x-0`}>
              <PropertiesPanel selectedObject={selectedObject} objects={objects} globalVariables={globalVariables} assets={assets} onUpdateObject={handleUpdateObjectAnywhere} onDeleteObject={handleDeleteObject} onOpenAssetManager={(cb) => { setAssetManagerCallback(() => cb); setIsAssetManagerOpen(true); }} onOpenScriptEditor={(id) => { setScriptTargetId(id); setIsScriptEditorOpen(true); }} onClose={() => setShowProperties(false)} className="h-full border-0" />
          </aside>
      </div>

      {/* Modales */}
      <AssetManagerModal isOpen={isAssetManagerOpen} assets={assets} onClose={() => setIsAssetManagerOpen(false)} onAddAsset={(a) => setAssets([...assets, a])} onDeleteAsset={(id) => setAssets(assets.filter(a => a.id !== id))} onSelectAsset={(url) => { if(assetManagerCallback) { assetManagerCallback(url); setIsAssetManagerOpen(false); } }} />
      <GamePreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} objects={objects} scenes={scenes} initialSceneId={currentSceneId} canvasConfig={canvasConfig} library={library} globalVariables={globalVariables} plugins={plugins} assets={assets} />
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} gameData={{ objects, layers, canvasConfig, assets, library, scenes, globalVariables, plugins }} />
      <SaveProjectModal isOpen={isSaveModalOpen} currentName={projectName} onClose={() => setIsSaveModalOpen(false)} onConfirm={(n) => { setProjectName(n); setIsSaveModalOpen(false); }} />
      <SceneManagerModal isOpen={isSceneManagerOpen} scenes={scenes} currentSceneId={currentSceneId} onClose={() => setIsSceneManagerOpen(false)} onSelectScene={handleSelectScene} onAddScene={handleAddScene} onRenameScene={(id, n) => setScenes(scenes.map(s => s.id === id ? { ...s, name: n } : s))} onDeleteScene={(id) => { const rem = scenes.filter(s => s.id !== id); setScenes(rem); if (currentSceneId === id && rem.length > 0) handleSelectScene(rem[0].id); }} />
      <WorldSettingsModal isOpen={isWorldSettingsOpen} scene={currentScene || scenes[0]} canvasConfig={canvasConfig} onClose={() => setIsWorldSettingsOpen(false)} onUpdateScene={(upd) => setScenes(prev => prev.map(s => s.id === currentSceneId ? {...s, ...upd} : s))} onUpdateCanvas={setCanvasConfig} />
      <MobileSettingsModal isOpen={isMobileSettingsOpen} config={canvasConfig.mobileControls!} canvasConfig={canvasConfig} onClose={() => setIsMobileSettingsOpen(false)} onSave={(cfg) => setCanvasConfig({...canvasConfig, mobileControls: cfg})} />
      {scriptTargetId && <ScriptEditorModal isOpen={isScriptEditorOpen} objectName={library.find(o => o.id === scriptTargetId)?.name || objects.find(o => o.id === scriptTargetId)?.name || 'Objeto'} initialCode={library.find(o => o.id === scriptTargetId)?.script || objects.find(o => o.id === scriptTargetId)?.script || ''} onClose={() => setIsScriptEditorOpen(false)} onSave={(code) => { handleUpdateObjectAnywhere(scriptTargetId, { script: code }); setIsScriptEditorOpen(false); }} />}
    </div>
  );
};