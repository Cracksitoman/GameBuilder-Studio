import React, { useState, useEffect, useRef } from 'react';
import { GameObject, ObjectType, EditorTool, CanvasConfig, Layer, Asset, Scene } from '../types';
import { ZoomIn, ZoomOut, ArrowRight, ArrowDown, Video, MonitorSmartphone, Grid3x3, Magnet, Trash2 } from './Icons';

interface CanvasProps {
  scene: Scene; 
  objects: GameObject[];
  layers: Layer[];
  selectedObjectId: string | null;
  currentTool: EditorTool;
  activeBrushId?: string | null; 
  brushSolid?: boolean; 
  activeLayerId?: string | null; 
  assets?: Asset[]; 
  canvasConfig: CanvasConfig;
  cameraConfig?: { targetObjectId: string | null }; 
  
  // Grid Props
  showGrid: boolean;
  gridSize: number;
  onToggleGrid: (show: boolean) => void;
  onSetGridSize: (size: number) => void;

  onSelectObject: (id: string | null) => void;
  onUpdateObject: (id: string, updates: Partial<GameObject>) => void;
  onEditObject: (obj: GameObject) => void;
  onDropObject: (id: string, x: number, y: number) => void;
  onViewChange?: (viewPos: { x: number, y: number }, zoom: number) => void;
  onDeleteObject?: (id: string) => void;
}

type DragMode = 'NONE' | 'MOVE_ALL' | 'MOVE_X' | 'MOVE_Y' | 'RESIZE_X' | 'RESIZE_Y' | 'PAN_CANVAS';

export const Canvas: React.FC<CanvasProps> = ({
  scene,
  objects,
  layers,
  selectedObjectId,
  currentTool,
  activeBrushId,
  brushSolid,
  activeLayerId,
  canvasConfig,
  cameraConfig,
  showGrid,
  gridSize,
  onToggleGrid,
  onSetGridSize,
  onSelectObject,
  onUpdateObject,
  onEditObject,
  onDropObject,
  onViewChange,
  onDeleteObject
}) => {
  const [zoom, setZoom] = useState(0.8);
  const [viewPos, setViewPos] = useState({ x: 0, y: 0 });
  const [isGridMenuOpen, setIsGridMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const gameBoxRef = useRef<HTMLDivElement>(null); 
  
  const lastTapRef = useRef<{ id: string | null, time: number }>({ id: null, time: 0 });

  useEffect(() => {
    onViewChange?.(viewPos, zoom);
  }, [viewPos, zoom, onViewChange]);

  const worldWidth = scene.width || canvasConfig.width;
  const worldHeight = scene.height || canvasConfig.height;

  useEffect(() => {
     if (canvasConfig.mode === 'PORTRAIT') {
         setZoom(0.5);
     } else {
         setZoom(0.8);
     }
  }, [canvasConfig.mode]);

  const getCameraRect = () => {
      let x = 0;
      let y = 0;
      if (cameraConfig?.targetObjectId) {
          const target = objects.find(o => o.id === cameraConfig.targetObjectId);
          if (target) {
              x = (target.x + target.width / 2) - (canvasConfig.width / 2);
              y = (target.y + target.height / 2) - (canvasConfig.height / 2);
          }
      }
      return { x, y, w: canvasConfig.width, h: canvasConfig.height };
  };

  const cameraRect = getCameraRect();

  const handleTilePaint = (e: React.PointerEvent, obj: GameObject) => {
      if (!obj.tilemap) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const clickX = (e.clientX - rect.left) / zoom; 
      const clickY = (e.clientY - rect.top) / zoom;
      const tileSize = obj.tilemap.tileSize || 32;
      const gx = Math.floor(clickX / tileSize);
      const gy = Math.floor(clickY / tileSize);
      const maxGx = Math.floor(obj.width / tileSize);
      const maxGy = Math.floor(obj.height / tileSize);
      if (gx < 0 || gy < 0 || gx >= maxGx || gy >= maxGy) return;
      const key = `${gx},${gy}`;
      const currentTiles = { ...obj.tilemap.tiles };
      if (currentTool === EditorTool.ERASER) {
          delete currentTiles[key];
      } else if (activeBrushId) {
          currentTiles[key] = { url: activeBrushId, solid: !!brushSolid };
      }
      onUpdateObject(obj.id, { tilemap: { ...obj.tilemap, tiles: currentTiles } });
  };

  const startDrag = (e: React.PointerEvent, obj: GameObject | null, mode: DragMode) => {
    if (obj && obj.type === ObjectType.TILEMAP && (currentTool === EditorTool.BRUSH || currentTool === EditorTool.ERASER)) {
        if (obj.id === selectedObjectId) {
            e.preventDefault();
            e.stopPropagation();
            handleTilePaint(e, obj);
            return;
        }
    }
    const isMiddleClick = e.button === 1;
    const effectiveMode = isMiddleClick ? 'PAN_CANVAS' : mode;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startViewX = viewPos.x;
    const startViewY = viewPos.y;
    const initialObjectState = obj ? { ...obj } : null;
    if (obj && effectiveMode !== 'PAN_CANVAS') {
       onSelectObject(obj.id);
    }
    const handlePointerMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      if (effectiveMode === 'PAN_CANVAS') {
        setViewPos({
            x: startViewX + deltaX / zoom,
            y: startViewY + deltaY / zoom
        });
        return;
      }
      if (!initialObjectState || !obj) return;
      const scaledDeltaX = deltaX / zoom;
      const scaledDeltaY = deltaY / zoom;
      const updates: Partial<GameObject> = {};
      const snap = (val: number) => showGrid ? Math.round(val / gridSize) * gridSize : val;
      switch (effectiveMode) {
        case 'MOVE_ALL':
          updates.x = snap(initialObjectState.x + scaledDeltaX);
          updates.y = snap(initialObjectState.y + scaledDeltaY);
          break;
        case 'MOVE_X':
          updates.x = snap(initialObjectState.x + scaledDeltaX);
          break;
        case 'MOVE_Y':
          updates.y = snap(initialObjectState.y + scaledDeltaY);
          break;
        case 'RESIZE_X':
          updates.width = Math.max(10, snap(initialObjectState.width + scaledDeltaX));
          break;
        case 'RESIZE_Y':
          updates.height = Math.max(10, snap(initialObjectState.height + scaledDeltaY));
          break;
      }
      onUpdateObject(obj.id, updates);
    };
    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleDoubleClick = (e: React.MouseEvent, obj: GameObject) => {
    if (currentTool === EditorTool.HAND || e.button === 1) return;
    if (obj.type === ObjectType.TILEMAP && (currentTool === EditorTool.BRUSH || currentTool === EditorTool.ERASER)) return; 
    e.stopPropagation();
    onEditObject(obj);
  };

  const renderGizmos = (obj: GameObject) => {
    if (currentTool === EditorTool.HAND || currentTool === EditorTool.BRUSH || currentTool === EditorTool.ERASER) return null;
    return (
      <div className="absolute inset-0 pointer-events-none z-50">
        {currentTool === EditorTool.SELECT && (
          <>
            <div 
              className="absolute flex items-center group cursor-e-resize pointer-events-auto touch-none"
              style={{ left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '0px', padding: '10px' }}
              onPointerDown={(e) => startDrag(e, obj, 'MOVE_X')}
            >
              <div className="h-[2px] w-6 bg-red-500 shadow-sm pointer-events-none"></div>
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-md hover:bg-red-400 transition-colors -ml-1 pointer-events-none">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div 
              className="absolute flex flex-col items-center group cursor-s-resize pointer-events-auto touch-none"
              style={{ top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '0px', padding: '10px' }}
              onPointerDown={(e) => startDrag(e, obj, 'MOVE_Y')}
            >
              <div className="w-[2px] h-6 bg-green-500 shadow-sm pointer-events-none"></div>
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md hover:bg-green-400 transition-colors -mt-1 pointer-events-none">
                <ArrowDown className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </>
        )}
        {currentTool === EditorTool.RESIZE && (
          <>
             <div className="absolute inset-0 border-2 border-blue-400 opacity-50 pointer-events-none" />
            <div 
              className="absolute bg-blue-500 border-2 border-white shadow-md cursor-ew-resize pointer-events-auto touch-none"
              style={{ right: '-10px', top: '50%', marginTop: '-10px', width: '20px', height: '20px', borderRadius: '4px' }}
              onPointerDown={(e) => startDrag(e, obj, 'RESIZE_X')}
            />
            <div 
              className="absolute bg-blue-500 border-2 border-white shadow-md cursor-ns-resize pointer-events-auto touch-none"
              style={{ bottom: '-10px', left: '50%', marginLeft: '-10px', width: '20px', height: '20px', borderRadius: '4px' }}
              onPointerDown={(e) => startDrag(e, obj, 'RESIZE_Y')}
            />
          </>
        )}
      </div>
    );
  };

  const renderObject = (obj: GameObject) => {
    const isSelected = selectedObjectId === obj.id;
    const layer = layers.find(l => l.id === obj.layerId);
    if (layer && !layer.visible) return null;
    const isLocked = layer?.locked || false;
    const isOnActiveLayer = !activeLayerId || obj.layerId === activeLayerId;
    const isTilemap = obj.type === ObjectType.TILEMAP;
    const isPainting = isSelected && isTilemap && (currentTool === EditorTool.BRUSH || currentTool === EditorTool.ERASER);

    const style: React.CSSProperties = {
      position: 'absolute',
      left: `${obj.x}px`,
      top: `${obj.y}px`,
      width: `${obj.width}px`,
      height: `${obj.height}px`,
      transform: `rotate(${obj.rotation}deg)`,
      zIndex: obj.zIndex, 
      opacity: isOnActiveLayer ? obj.opacity : obj.opacity * 0.5, 
      cursor: currentTool === EditorTool.HAND ? 'grab' : (isPainting ? 'crosshair' : (isSelected ? 'default' : (isLocked ? 'not-allowed' : 'pointer'))), 
      border: isSelected ? (isPainting ? '2px dashed cyan' : '1px solid rgba(59, 130, 246, 0.5)') : '1px solid transparent',
      touchAction: 'none',
      pointerEvents: (isLocked || !isOnActiveLayer) ? 'none' : 'auto', 
      backgroundColor: obj.type === ObjectType.TEXT ? undefined : (isTilemap ? undefined : (obj.previewSpriteUrl ? 'transparent' : obj.color)),
      backgroundImage: (!isTilemap && obj.previewSpriteUrl) ? `url(${obj.previewSpriteUrl})` : undefined,
      backgroundSize: '100% 100%', 
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
    };

    return (
      <div
        key={obj.id}
        style={style}
        // Aplicamos la clase pixelated para bordes nítidos
        className={`select-none group pixelated ${!isTilemap ? 'image-pixelated' : ''}`}
        onPointerDown={(e) => {
           const now = Date.now();
           if (lastTapRef.current.id === obj.id && (now - lastTapRef.current.time) < 300) {
               if (!isLocked && isOnActiveLayer && currentTool !== EditorTool.HAND && !isPainting) {
                   handleDoubleClick(e as unknown as React.MouseEvent, obj);
                   lastTapRef.current = { id: null, time: 0 }; 
                   return; 
               }
           }
           lastTapRef.current = { id: obj.id, time: now };
           if (e.button === 1 || currentTool === EditorTool.HAND) {
              startDrag(e, null, 'PAN_CANVAS');
              return;
           }
           if (!isLocked && isOnActiveLayer) {
             startDrag(e, obj, currentTool === EditorTool.SELECT ? 'MOVE_ALL' : 'NONE');
           }
        }}
        onPointerMove={(e) => {
            if (isPainting && e.buttons === 1) {
                handleTilePaint(e, obj);
            }
        }}
        onDoubleClick={(e) => !isLocked && isOnActiveLayer && handleDoubleClick(e, obj)}
      >
        <div className="w-full h-full relative overflow-hidden pointer-events-none">
            {obj.type === ObjectType.TEXT ? (
              <div 
                style={{color: obj.color}} 
                className="w-full h-full flex items-center justify-center font-sans whitespace-nowrap text-[8px]"
              >
                {obj.name}
              </div>
            ) : isTilemap ? (
                <div className="w-full h-full relative">
                    {isSelected && (
                        <div 
                            className="absolute inset-0 opacity-20 pointer-events-none"
                            style={{
                                backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                                backgroundSize: `${obj.tilemap?.tileSize || 32}px ${obj.tilemap?.tileSize || 32}px`
                            }}
                        />
                    )}
                    {obj.tilemap && Object.entries(obj.tilemap.tiles).map(([key, data]) => {
                        const [gx, gy] = key.split(',').map(Number);
                        const tileSize = obj.tilemap?.tileSize || 32;
                        const assetId = typeof data === 'string' ? data : data.url;
                        return (
                            <div 
                                key={key}
                                className="pixelated"
                                style={{
                                    position: 'absolute',
                                    left: gx * tileSize,
                                    top: gy * tileSize,
                                    width: tileSize,
                                    height: tileSize,
                                    backgroundImage: `url(${assetId})`,
                                    backgroundSize: 'contain',
                                    backgroundRepeat: 'no-repeat',
                                    boxShadow: (isSelected && (typeof data === 'object' && data.solid)) ? 'inset 0 0 0 1px rgba(255,0,0,0.5), inset 0 0 10px rgba(255,0,0,0.2)' : 'none'
                                }}
                            />
                        );
                    })}
                </div>
            ) : (
               <div className="w-full h-full flex items-center justify-center">
                  {!obj.previewSpriteUrl && (obj.type === ObjectType.PLAYER || obj.type === ObjectType.ENEMY) && (
                     <span className="text-white text-[8px] font-black opacity-80">{obj.type[0]}</span>
                  )}
               </div>
            )}
        </div>
        {obj.isGui && (
            <div className="absolute top-0 right-0 p-0.5 bg-teal-900 rounded-bl text-teal-300 pointer-events-none" style={{transform: 'scale(0.7) origin(top right)'}}>
                <MonitorSmartphone className="w-3 h-3" />
            </div>
        )}
        {isSelected && !isLocked && isOnActiveLayer && !isPainting && renderGizmos(obj)}
      </div>
    );
  };

  return (
    <div className="absolute inset-0 bg-gray-950 overflow-hidden flex flex-col z-0">
      
      {/* Controles de Canvas: Grid, Zoom y Borrar */}
      <div className="absolute top-2 right-2 z-20 flex flex-col space-y-2">
          
          {/* Grid Toggle */}
          <div className="bg-gray-800/80 backdrop-blur rounded-md border border-gray-700 shadow-lg relative">
              <button 
                onClick={() => setIsGridMenuOpen(!isGridMenuOpen)}
                className={`p-2 rounded-md hover:text-white transition-colors flex items-center justify-center ${showGrid ? 'text-blue-400 bg-blue-900/20' : 'text-gray-300 hover:bg-gray-700/50'}`}
              >
                  {showGrid ? <Magnet className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
              </button>

              {isGridMenuOpen && (
                  <div className="absolute right-full top-0 mr-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-1.5 w-24 animate-in fade-in slide-in-from-right-2">
                      <button 
                        onClick={() => onToggleGrid(!showGrid)}
                        className={`w-full text-center px-1 py-1 rounded text-[9px] font-black mb-1 uppercase ${showGrid ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                      >
                          {showGrid ? 'ON' : 'OFF'}
                      </button>
                      {showGrid && (
                          <div className="space-y-1">
                              {[16, 32, 64].map(s => (
                                  <button
                                    key={s}
                                    onClick={() => onSetGridSize(s)}
                                    className={`w-full text-center px-1 py-0.5 rounded text-[9px] hover:bg-gray-700 ${gridSize === s ? 'text-blue-400 font-bold' : 'text-gray-500'}`}
                                  >
                                      {s}px
                                  </button>
                              ))}
                          </div>
                      )}
                  </div>
              )}
          </div>

          {/* Zoom Buttons */}
          <div className="bg-gray-800/80 backdrop-blur rounded-md border border-gray-700 flex flex-col shadow-lg">
            <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-2 hover:bg-gray-700/50 rounded-t-md text-gray-300 hover:text-white border-b border-gray-700">
            <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-2 hover:bg-gray-700/50 rounded-b-md text-gray-300 hover:text-white">
            <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Delete Button */}
          <button 
            onClick={() => selectedObjectId && onDeleteObject?.(selectedObjectId)}
            disabled={!selectedObjectId}
            className={`p-2 rounded-md border shadow-lg transition-all flex items-center justify-center ${selectedObjectId ? 'bg-red-900/40 border-red-500/50 text-red-400 hover:bg-red-600 hover:text-white' : 'bg-gray-800/40 border-gray-700 text-gray-600 cursor-not-allowed'}`}
            title="Borrar Objeto Seleccionado"
          >
            <Trash2 className="w-4 h-4" />
          </button>
      </div>

      <div className="absolute top-2 right-12 z-20 pointer-events-none mt-1">
          <span className="bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur font-mono">
             {Math.round(zoom * 100)}%
          </span>
      </div>

      <div 
        ref={containerRef}
        className={`w-full h-full relative overflow-hidden touch-none select-none ${currentTool === EditorTool.HAND ? 'cursor-grab active:cursor-grabbing' : ''}`}
        style={{
          backgroundColor: '#111827',
          backgroundPosition: `${viewPos.x}px ${viewPos.y}px`,
          backgroundImage: 'radial-gradient(#374151 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
        onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
               setIsGridMenuOpen(false);
               if (currentTool === EditorTool.HAND || e.button === 1) {
                 startDrag(e, null, 'PAN_CANVAS');
               } else {
                 onSelectObject(null);
               }
            }
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div 
           className="absolute w-0 h-0 flex items-center justify-center visible"
           style={{
             left: '50%',
             top: '50%',
             transform: `translate(${viewPos.x * zoom}px, ${viewPos.y * zoom}px) scale(${zoom})`,
             transformOrigin: 'center center'
           }}
        >
          <div 
             id="koda-stage-area"
             ref={gameBoxRef}
             className="absolute shadow-2xl"
             style={{ 
                 left: 0, 
                 top: 0, 
                 width: `${worldWidth}px`, 
                 height: `${worldHeight}px`, 
                 backgroundColor: scene.backgroundColor || '#000000',
                 border: '1px solid #4b5563',
                 transform: 'translate(-50%, -50%)' 
             }}
          >
              <div className="absolute inset-0 pointer-events-none opacity-20" 
                  style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px'}}>
              </div>
              <div 
                className="absolute top-0 left-0 border-2 border-dashed border-cyan-500/50 pointer-events-none z-10"
                style={{
                    width: `${canvasConfig.width}px`,
                    height: `${canvasConfig.height}px`
                }}
              >
                  <div className="absolute top-1 left-1 bg-cyan-900/80 text-cyan-200 text-[8px] px-1 rounded">Inicio Cámara</div>
              </div>
              {showGrid && (
                  <div 
                    className="absolute inset-0 pointer-events-none z-0"
                    style={{
                        opacity: 0.1,
                        backgroundImage: `
                            linear-gradient(to right, white 1px, transparent 1px),
                            linear-gradient(to bottom, white 1px, transparent 1px)
                        `,
                        backgroundSize: `${gridSize}px ${gridSize}px`
                    }}
                  />
              )}
              {layers.map(layer => {
                 const layerObjects = objects.filter(o => o.layerId === layer.id);
                 return (
                    <div key={layer.id} className="absolute inset-0 pointer-events-none">
                       {layerObjects.map(renderObject)}
                    </div>
                 )
              })}
          </div>
        </div>
      </div>
    </div>
  );
};