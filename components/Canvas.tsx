import React, { useState, useEffect, useRef } from 'react';
import { GameObject, ObjectType, EditorTool, CanvasConfig, Layer, Asset } from '../types';
import { ZoomIn, ZoomOut, ArrowRight, ArrowDown } from './Icons';

interface CanvasProps {
  objects: GameObject[];
  layers: Layer[];
  selectedObjectId: string | null;
  currentTool: EditorTool;
  activeBrushId?: string | null; 
  brushSolid?: boolean; 
  activeLayerId?: string | null; // NEW: Active Layer Check
  assets?: Asset[]; 
  canvasConfig: CanvasConfig;
  onSelectObject: (id: string | null) => void;
  onUpdateObject: (id: string, updates: Partial<GameObject>) => void;
  onEditObject: (obj: GameObject) => void;
}

// Define the types of interactions available
type DragMode = 'NONE' | 'MOVE_ALL' | 'MOVE_X' | 'MOVE_Y' | 'RESIZE_X' | 'RESIZE_Y' | 'PAN_CANVAS';

export const Canvas: React.FC<CanvasProps> = ({
  objects,
  layers,
  selectedObjectId,
  currentTool,
  activeBrushId,
  brushSolid,
  activeLayerId,
  canvasConfig,
  onSelectObject,
  onUpdateObject,
  onEditObject
}) => {
  const [zoom, setZoom] = useState(0.8);
  const [viewPos, setViewPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Update zoom automatically to fit when orientation changes
  useEffect(() => {
     if (canvasConfig.mode === 'PORTRAIT') {
         setZoom(0.5);
     } else {
         setZoom(0.8);
     }
  }, [canvasConfig.mode]);

  // --- TILEMAP PAINTING HELPERS ---
  const handleTilePaint = (e: React.PointerEvent, obj: GameObject) => {
      if (!obj.tilemap) return;
      
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const clickX = (e.clientX - rect.left) / zoom; // Adjust for zoom
      const clickY = (e.clientY - rect.top) / zoom;
      
      // Calculate Grid Coordinate
      const tileSize = obj.tilemap.tileSize || 32;
      const gx = Math.floor(clickX / tileSize);
      const gy = Math.floor(clickY / tileSize);
      
      // Prevent painting outside bounds based on object width/height
      const maxGx = Math.floor(obj.width / tileSize);
      const maxGy = Math.floor(obj.height / tileSize);
      
      if (gx < 0 || gy < 0 || gx >= maxGx || gy >= maxGy) return;

      const key = `${gx},${gy}`;
      const currentTiles = { ...obj.tilemap.tiles };
      
      if (currentTool === EditorTool.ERASER) {
          delete currentTiles[key];
      } else if (activeBrushId) {
          // STORE DATA OBJECT with SOLID FLAG
          currentTiles[key] = { url: activeBrushId, solid: !!brushSolid };
      }

      onUpdateObject(obj.id, { tilemap: { ...obj.tilemap, tiles: currentTiles } });
  };

  // --- ROBUST DRAG HANDLER (POINTER EVENTS) ---
  const startDrag = (e: React.PointerEvent, obj: GameObject | null, mode: DragMode) => {
    // PAINT MODE INTERCEPTION
    if (obj && obj.type === ObjectType.TILEMAP && (currentTool === EditorTool.BRUSH || currentTool === EditorTool.ERASER)) {
        if (obj.id === selectedObjectId) {
            e.preventDefault();
            e.stopPropagation();
            
            // Perform initial paint
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
            x: startViewX + deltaX,
            y: startViewY + deltaY
        });
        return;
      }

      if (!initialObjectState || !obj) return;

      const scaledDeltaX = deltaX / zoom;
      const scaledDeltaY = deltaY / zoom;
      const updates: Partial<GameObject> = {};

      switch (effectiveMode) {
        case 'MOVE_ALL':
          updates.x = initialObjectState.x + scaledDeltaX;
          updates.y = initialObjectState.y + scaledDeltaY;
          break;
        case 'MOVE_X':
          updates.x = initialObjectState.x + scaledDeltaX;
          break;
        case 'MOVE_Y':
          updates.y = initialObjectState.y + scaledDeltaY;
          break;
        case 'RESIZE_X':
          updates.width = Math.max(10, initialObjectState.width + scaledDeltaX);
          break;
        case 'RESIZE_Y':
          updates.height = Math.max(10, initialObjectState.height + scaledDeltaY);
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
    if (obj.type === ObjectType.TILEMAP && (currentTool === EditorTool.BRUSH || currentTool === EditorTool.ERASER)) return; // Don't edit props on paint
    e.stopPropagation();
    onEditObject(obj);
  };

  // --- RENDER HELPERS ---

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
              <div className="h-[2px] w-8 bg-red-500 shadow-sm pointer-events-none"></div>
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-md hover:bg-red-400 transition-colors -ml-1 pointer-events-none">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
            </div>
            <div 
              className="absolute flex flex-col items-center group cursor-s-resize pointer-events-auto touch-none"
              style={{ top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '0px', padding: '10px' }}
              onPointerDown={(e) => startDrag(e, obj, 'MOVE_Y')}
            >
              <div className="w-[2px] h-8 bg-green-500 shadow-sm pointer-events-none"></div>
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md hover:bg-green-400 transition-colors -mt-1 pointer-events-none">
                <ArrowDown className="w-5 h-5 text-white" />
              </div>
            </div>
          </>
        )}
        {currentTool === EditorTool.RESIZE && (
          <>
             <div className="absolute inset-0 border-2 border-blue-400 opacity-50 pointer-events-none" />
            <div 
              className="absolute bg-blue-500 border-2 border-white shadow-md cursor-ew-resize pointer-events-auto touch-none"
              style={{ right: '-12px', top: '50%', marginTop: '-12px', width: '24px', height: '24px', borderRadius: '4px' }}
              onPointerDown={(e) => startDrag(e, obj, 'RESIZE_X')}
            />
            <div 
              className="absolute bg-blue-500 border-2 border-white shadow-md cursor-ns-resize pointer-events-auto touch-none"
              style={{ bottom: '-12px', left: '50%', marginLeft: '-12px', width: '24px', height: '24px', borderRadius: '4px' }}
              onPointerDown={(e) => startDrag(e, obj, 'RESIZE_Y')}
            />
          </>
        )}
      </div>
    );
  };

  const renderObject = (obj: GameObject) => {
    const isSelected = selectedObjectId === obj.id;
    // Check if layer is hidden
    const layer = layers.find(l => l.id === obj.layerId);
    if (layer && !layer.visible) return null;
    const isLocked = layer?.locked || false;
    
    // LAYER ACTIVE CHECK
    const isOnActiveLayer = !activeLayerId || obj.layerId === activeLayerId;

    // TILEMAP SPECIFIC VISUALS
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
      opacity: isOnActiveLayer ? obj.opacity : obj.opacity * 0.5, // Dim inactive
      cursor: currentTool === EditorTool.HAND ? 'grab' : (isPainting ? 'crosshair' : (isSelected ? 'default' : (isLocked ? 'not-allowed' : 'pointer'))), 
      border: isSelected ? (isPainting ? '2px dashed cyan' : '1px solid rgba(59, 130, 246, 0.5)') : '1px solid transparent',
      imageRendering: 'pixelated',
      touchAction: 'none',
      pointerEvents: (isLocked || !isOnActiveLayer) ? 'none' : 'auto', // CRITICAL: Only allow pointer events on active layer
      backgroundColor: obj.type === ObjectType.TEXT ? undefined : (isTilemap ? undefined : (obj.previewSpriteUrl ? 'transparent' : obj.color)),
      backgroundImage: (!isTilemap && obj.previewSpriteUrl) ? `url(${obj.previewSpriteUrl})` : undefined,
      backgroundSize: '100% 100%', 
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      // overflow: 'hidden' <--- REMOVED TO FIX ARROWS
    };

    return (
      <div
        key={obj.id}
        style={style}
        onPointerDown={(e) => {
           if (e.button === 1 || currentTool === EditorTool.HAND) {
              startDrag(e, null, 'PAN_CANVAS');
              return;
           }
           if (!isLocked && isOnActiveLayer) {
             startDrag(e, obj, currentTool === EditorTool.SELECT ? 'MOVE_ALL' : 'NONE');
           }
        }}
        // Enable painting while moving mouse if button is held
        onPointerMove={(e) => {
            if (isPainting && e.buttons === 1) {
                handleTilePaint(e, obj);
            }
        }}
        onDoubleClick={(e) => !isLocked && isOnActiveLayer && handleDoubleClick(e, obj)}
        className="select-none group"
      >
        <div className="w-full h-full relative overflow-hidden pointer-events-none">
            {obj.type === ObjectType.TEXT ? (
              <div 
                style={{color: obj.color}} 
                className="w-full h-full flex items-center justify-center font-sans whitespace-nowrap"
              >
                {obj.name}
              </div>
            ) : isTilemap ? (
                // RENDER TILEMAP GRID
                <div className="w-full h-full relative">
                    {/* Grid Lines (Visible only when selected) */}
                    {isSelected && (
                        <div 
                            className="absolute inset-0 opacity-20 pointer-events-none"
                            style={{
                                backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                                backgroundSize: `${obj.tilemap?.tileSize || 32}px ${obj.tilemap?.tileSize || 32}px`
                            }}
                        />
                    )}
                    {/* Render Tiles */}
                    {obj.tilemap && Object.entries(obj.tilemap.tiles).map(([key, data]) => {
                        const [gx, gy] = key.split(',').map(Number);
                        const tileSize = obj.tilemap?.tileSize || 32;
                        
                        // Handle legacy (string) or new object structure
                        const assetId = typeof data === 'string' ? data : data.url;
                        const isSolid = typeof data === 'object' && data.solid;

                        return (
                            <div 
                                key={key}
                                style={{
                                    position: 'absolute',
                                    left: gx * tileSize,
                                    top: gy * tileSize,
                                    width: tileSize,
                                    height: tileSize,
                                    backgroundImage: `url(${assetId})`,
                                    backgroundSize: 'contain',
                                    backgroundRepeat: 'no-repeat',
                                    // Visual debug for solid tiles in Editor
                                    boxShadow: (isSelected && isSolid) ? 'inset 0 0 0 1px rgba(255,0,0,0.5), inset 0 0 10px rgba(255,0,0,0.2)' : 'none'
                                }}
                            />
                        );
                    })}
                </div>
            ) : (
               <div className="w-full h-full flex items-center justify-center">
                  {!obj.previewSpriteUrl && (obj.type === ObjectType.PLAYER || obj.type === ObjectType.ENEMY) && (
                     <span className="text-white text-[10px] font-bold opacity-80">{obj.type[0]}</span>
                  )}
               </div>
            )}
        </div>
        {isSelected && !isLocked && isOnActiveLayer && !isPainting && renderGizmos(obj)}
      </div>
    );
  };

  return (
    <div className="absolute inset-0 bg-gray-950 overflow-hidden flex flex-col z-0">
      
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-20 bg-gray-800/80 backdrop-blur rounded-lg border border-gray-700 flex flex-col shadow-lg">
        <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-3 hover:bg-gray-700/50 rounded-t-lg text-gray-300 hover:text-white border-b border-gray-700">
          <ZoomIn className="w-5 h-5" />
        </button>
        <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-3 hover:bg-gray-700/50 rounded-b-lg text-gray-300 hover:text-white">
          <ZoomOut className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute top-4 right-16 z-20 pointer-events-none mt-2">
          <span className="bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur">
             {Math.round(zoom * 100)}%
          </span>
      </div>

      {/* Infinite Canvas */}
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
             transform: `translate(${viewPos.x}px, ${viewPos.y}px) scale(${zoom})`,
             transformOrigin: 'center center'
           }}
        >
          {/* THE GAME RESOLUTION BOX (Dynamic Size) */}
          <div 
             className="relative bg-black border-4 border-black shadow-[0_0_50px_-12px_rgba(0,0,0,0.7)] transition-all duration-300"
             style={{ width: `${canvasConfig.width}px`, height: `${canvasConfig.height}px` }}
          >
              <div className="absolute inset-0 pointer-events-none opacity-20" 
                  style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '50px 50px'}}>
              </div>

              {/* RENDER OBJECTS BY LAYER ORDER */}
              {layers.map(layer => {
                 // Get objects for this layer
                 const layerObjects = objects.filter(o => o.layerId === layer.id);
                 return (
                    <div key={layer.id} className="absolute inset-0 pointer-events-none">
                       {/* Wrapper div for layer to separate z-stacking if needed, but absolute pos handles it */}
                       {layerObjects.map(renderObject)}
                    </div>
                 )
              })}

              <div className="absolute -top-6 left-0 text-gray-500 text-[10px] font-mono whitespace-nowrap scale-[1] origin-bottom-left" style={{ transform: `scale(${1/zoom})` }}>
                CÁMARA: {canvasConfig.width}x{canvasConfig.height} px
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};