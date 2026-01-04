
import React, { useEffect, useRef, useState } from 'react';
import { GameObject, ObjectType, CanvasConfig, BehaviorType, AnimationClip, Variable, Scene, MobileControlsConfig } from '../types';
import { X, ArrowRight, ArrowUp, ArrowDown, Maximize } from './Icons';

interface GamePreviewModalProps {
  objects: GameObject[]; 
  scenes: Scene[]; 
  initialSceneId: string; 
  isOpen: boolean;
  canvasConfig?: CanvasConfig;
  onClose: () => void;
  globalVariables?: Variable[]; 
  library?: GameObject[]; 
}

interface SimObject extends GameObject {
  vx: number;
  vy: number;
  isGrounded: boolean;
  isFollowing: boolean; 
  currentAnimId: string | null;
  frameIndex: number;
  animTimer: number;
  animFinished: boolean; 
  flipX: boolean;
  isMarkedForDestroy?: boolean; 
  localVars: Record<string, any>; 
  isPointerOver: boolean;
  isPointerDown: boolean;
  downStartTime: number;
  lastClickTime: number; // Added for double click detection
  isDragging: boolean;
  dragOffsetX: number;
  dragOffsetY: number;
  originalOpacity?: number;
  updateFn?: Function | null;
  flashTimer?: number; 
  isParticle?: boolean;
  lifeTime?: number;
  maxLifeTime?: number;
}

export const GamePreviewModal: React.FC<GamePreviewModalProps> = ({ 
  scenes, 
  initialSceneId,
  isOpen, 
  canvasConfig = { width: 800, height: 450, mode: 'LANDSCAPE' } as CanvasConfig, 
  onClose, 
  globalVariables = [],
  library = [] 
}) => {
  const [simObjects, setSimObjects] = useState<SimObject[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const cameraRef = useRef({ x: 0, y: 0, targetId: null as string | null, smooth: true, speed: 0.1, shakeIntensity: 0, shakeTimer: 0, zoom: 1, targetZoom: 1 });
  
  const inputsRef = useRef({ left: false, right: false, up: false, down: false, action: false, tiltX: 0, tiltY: 0 });
  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number>(0);
  const objectsRef = useRef<SimObject[]>([]); 
  const globalsRef = useRef<Record<string, any>>({}); 
  const nextSceneIdRef = useRef<string | null>(null);
  const currentSceneIdRef = useRef<string>(initialSceneId);

  const setInput = (key: keyof typeof inputsRef.current, value: boolean | number) => {
    (inputsRef.current as any)[key] = value;
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'ArrowLeft') setInput('left', true);
        if (e.code === 'ArrowRight') setInput('right', true);
        if (e.code === 'ArrowUp') setInput('up', true);
        if (e.code === 'ArrowDown') setInput('down', true);
        if (e.code === 'Space') setInput('action', true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'ArrowLeft') setInput('left', false);
        if (e.code === 'ArrowRight') setInput('right', false);
        if (e.code === 'ArrowUp') setInput('up', false);
        if (e.code === 'ArrowDown') setInput('down', false);
        if (e.code === 'Space') setInput('action', false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen]);

  const loadScene = (sceneId: string) => {
      const scene = scenes.find(s => s.id === sceneId);
      if (!scene) return;
      const initialSimObjects = scene.objects.map(obj => {
          const localsMap: Record<string, any> = {};
          (obj.variables || []).forEach(v => { localsMap[v.name] = v.value; });
          return { ...obj, vx: 0, vy: 0, isGrounded: false, isFollowing: false, currentAnimId: null, frameIndex: 0, animTimer: 0, animFinished: false, flipX: false, localVars: localsMap, isPointerOver: false, isPointerDown: false, downStartTime: 0, lastClickTime: 0, isDragging: false, dragOffsetX: 0, dragOffsetY: 0, originalOpacity: obj.opacity };
      });
      objectsRef.current = initialSimObjects;
      setSimObjects(initialSimObjects);
      loadCamera(scene);
  };

  const loadCamera = (scene: Scene) => {
      const camConfig = scene.camera || { targetObjectId: null, smooth: true, followSpeed: 0.1, zoom: 1 };
      cameraRef.current = { x: 0, y: 0, targetId: camConfig.targetObjectId, smooth: camConfig.smooth, speed: camConfig.followSpeed, shakeIntensity: 0, shakeTimer: 0, zoom: camConfig.zoom || 1, targetZoom: camConfig.zoom || 1 };
  };

  const checkRectCollision = (r1: {x: number, y: number, width: number, height: number}, r2: {x: number, y: number, width: number, height: number}) => 
    (r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y);

  const checkTilemapCollision = (obj: {x: number, y: number, width: number, height: number}, tilemap: SimObject) => {
      if (!tilemap.tilemap) return false;
      const ts = tilemap.tilemap.tileSize;
      const relX = obj.x - tilemap.x;
      const relY = obj.y - tilemap.y;
      
      const startGx = Math.floor(relX / ts);
      const endGx = Math.floor((relX + obj.width - 0.01) / ts);
      const startGy = Math.floor(relY / ts);
      const endGy = Math.floor((relY + obj.height - 0.01) / ts);

      for(let gy = startGy; gy <= endGy; gy++) {
          for(let gx = startGx; gx <= endGx; gx++) {
              const t = tilemap.tilemap.tiles[`${gx},${gy}`];
              if (t) {
                  const isSolid = typeof t === 'string' || (t as any).solid;
                  if (isSolid) return true;
              }
          }
      }
      return false;
  };

  const executeEvent = (event: any, self: SimObject, context: { other?: SimObject, globalVars: any, inputs: any, dt: number }) => {
      // CONDITIONS
      for (const cond of event.conditions) {
          if (cond.type === 'TOUCH_INTERACTION') {
              const subtype = cond.parameters.subtype || 'CLICK';
              if (subtype === 'CLICK' && !(self.isPointerDown && context.inputs.justReleased)) return false;
              if (subtype === 'LONG_PRESS' && !(self.isPointerDown && (Date.now() - self.downStartTime > 500))) return false;
              if (subtype === 'DRAG' && !self.isDragging) return false;
              // Double Tap Logic
              if (subtype === 'DOUBLE_CLICK') {
                  // This relies on tracking lastClickTime on pointer up
                  if (!(self.isPointerDown && context.inputs.justReleased && (Date.now() - self.lastClickTime < 300))) return false;
              }
          }
          if (cond.type === 'KEY_PRESSED') {
              if (!context.inputs[cond.parameters.key.toLowerCase()]) return false;
          }
      }

      // ACTIONS
      for (const act of event.actions) {
          if (act.type === 'CREATE_OBJECT') {
              const proto = library.find(o => o.id === act.parameters.sourceObjectId);
              if (proto) {
                  const spawnX = act.parameters.spawnOrigin === 'OTHER' && context.other ? context.other.x : self.x;
                  const spawnY = act.parameters.spawnOrigin === 'OTHER' && context.other ? context.other.y : self.y;
                  const rotation = act.parameters.spawnOrigin === 'OTHER' && context.other ? context.other.rotation : self.rotation;

                  const newObj: SimObject = {
                      ...JSON.parse(JSON.stringify(proto)),
                      id: crypto.randomUUID(),
                      x: spawnX,
                      y: spawnY,
                      rotation: rotation, // IMPORTANT: Inherit rotation
                      vx: 0, vy: 0,
                      isGrounded: false, isFollowing: false, currentAnimId: null, frameIndex: 0, animTimer: 0, animFinished: false, flipX: false, localVars: {}, isPointerOver: false, isPointerDown: false, downStartTime: 0, lastClickTime: 0, isDragging: false, dragOffsetX: 0, dragOffsetY: 0
                  };
                  objectsRef.current.push(newObj);
                  context.other = newObj; // Update context so next actions affect this new object
              }
          }
          if (act.type === 'APPLY_FORCE') {
              const target = act.parameters.target === 'OTHER' ? context.other : self;
              if (target) {
                  let fx = act.parameters.forceX || 0;
                  let fy = act.parameters.forceY || 0;
                  
                  // Apply rotation to force vector if the object is rotated
                  if (target.rotation !== 0) {
                      const rad = (target.rotation * Math.PI) / 180;
                      const rotX = fx * Math.cos(rad) - fy * Math.sin(rad);
                      const rotY = fx * Math.sin(rad) + fy * Math.cos(rad);
                      fx = rotX;
                      fy = rotY;
                  }

                  target.vx += fx;
                  target.vy += fy;
              }
          }
          if (act.type === 'DESTROY') {
              const target = act.parameters.target === 'OTHER' ? context.other : self;
              if (target) target.isMarkedForDestroy = true;
          }
      }
      return true; // Actions executed
  };

  const animate = (time: number) => {
    const dt = Math.min((time - previousTimeRef.current) / 1000, 0.1); 
    previousTimeRef.current = time;

    // Detect click release frame for standardizing touch events
    const justReleased = !inputsRef.current.action && (inputsRef.current as any).prevAction;
    (inputsRef.current as any).prevAction = inputsRef.current.action;

    if (nextSceneIdRef.current) { 
        const id = nextSceneIdRef.current; nextSceneIdRef.current = null; 
        currentSceneIdRef.current = id; loadScene(id); 
        requestRef.current = requestAnimationFrame(animate); return; 
    }

    const inputs = inputsRef.current;
    let currentObjects = [...objectsRef.current];
    const solids = currentObjects.filter(o => o.isObstacle && o.visible && o.type !== ObjectType.TILEMAP);
    const tilemaps = currentObjects.filter(o => o.type === ObjectType.TILEMAP && o.visible);

    currentObjects.forEach(obj => {
        // --- GAME LOGIC EVENTS ---
        if (obj.events) {
            obj.events.forEach(event => {
                executeEvent(event, obj, { globalVars: globalsRef.current, inputs: { ...inputs, justReleased }, dt, other: undefined });
            });
        }

        // --- BEHAVIORS ---
        if (!obj.behaviors) return;

        obj.behaviors.forEach(b => {
            if (b.type === BehaviorType.PROJECTILE) {
                const speed = b.properties.speed || 400;
                // Calculate vector based on rotation (assuming 0 deg is right, clockwise)
                const rad = (obj.rotation * Math.PI) / 180;
                // Add initial speed to current velocity (allows physics + projectile logic)
                obj.x += (Math.cos(rad) * speed + obj.vx) * dt;
                obj.y += (Math.sin(rad) * speed + obj.vy) * dt;
                
                // Cleanup if out of bounds (simple optimization)
                if(obj.x < -1000 || obj.x > 5000 || obj.y < -1000 || obj.y > 5000) obj.isMarkedForDestroy = true;
            }

            if (b.type === BehaviorType.TOPDOWN) {
                const speed = b.properties.speed || 200;
                let mx = 0, my = 0;
                if (inputs.left) mx = -speed; else if (inputs.right) mx = speed;
                if (inputs.up) my = -speed; else if (inputs.down) my = speed;
                
                if (mx !== 0) obj.vx = mx; else obj.vx *= 0.8;
                if (my !== 0) obj.vy = my; else obj.vy *= 0.8;

                const nextX = obj.x + obj.vx * dt;
                let colX = false;
                for(const s of solids) { if(s.id !== obj.id && checkRectCollision({x: nextX, y: obj.y, width: obj.width, height: obj.height}, s)) { colX = true; break; } }
                if(!colX) for(const tm of tilemaps) if(checkTilemapCollision({x: nextX, y: obj.y, width: obj.width, height: obj.height}, tm)) { colX = true; break; }
                if(!colX) obj.x = nextX; else obj.vx = 0;

                const nextY = obj.y + obj.vy * dt;
                let colY = false;
                for(const s of solids) { if(s.id !== obj.id && checkRectCollision({x: obj.x, y: nextY, width: obj.width, height: obj.height}, s)) { colY = true; break; } }
                if(!colY) for(const tm of tilemaps) if(checkTilemapCollision({x: obj.x, y: nextY, width: obj.width, height: obj.height}, tm)) { colY = true; break; }
                if(!colY) obj.y = nextY; else obj.vy = 0;
            }

            if (b.type === BehaviorType.PLATFORMER) {
                const gravity = b.properties.gravity || 1200;
                const jump = b.properties.jumpForce || 550;
                const maxSpeed = b.properties.maxSpeed || 250;

                if (inputs.left) { obj.vx = -maxSpeed; obj.flipX = true; }
                else if (inputs.right) { obj.vx = maxSpeed; obj.flipX = false; }
                else { obj.vx *= 0.8; if(Math.abs(obj.vx) < 5) obj.vx = 0; }

                if ((inputs.up || inputs.action) && obj.isGrounded) { obj.vy = -jump; obj.isGrounded = false; }
                obj.vy += gravity * dt;

                const nx = obj.x + obj.vx * dt;
                let cx = false;
                for(const s of solids) { if(s.id !== obj.id && checkRectCollision({x: nx, y: obj.y, width: obj.width, height: obj.height}, s)) { cx = true; break; } }
                if(!cx) for(const tm of tilemaps) if(checkTilemapCollision({x: nx, y: obj.y, width: obj.width, height: obj.height}, tm)) { cx = true; break; }
                if(!cx) obj.x = nx; else obj.vx = 0;

                const ny = obj.y + obj.vy * dt;
                let cy = false;
                obj.isGrounded = false;
                for(const s of solids) { 
                    if(s.id !== obj.id && checkRectCollision({x: obj.x, y: ny, width: obj.width, height: obj.height}, s)) { 
                        if(obj.vy > 0) { obj.y = s.y - obj.height; obj.isGrounded = true; obj.vy = 0; }
                        else if(obj.vy < 0) { obj.y = s.y + s.height; obj.vy = 0; }
                        cy = true; break; 
                    } 
                }
                if(!cy) {
                    for(const tm of tilemaps) {
                        if(checkTilemapCollision({x: obj.x, y: ny, width: obj.width, height: obj.height}, tm)) {
                            if(obj.vy > 0) { 
                                // Snap to tile top
                                // Since checkTilemapCollision doesn't return exact hit, we assume simple floor collision
                                obj.isGrounded = true; obj.vy = 0; 
                                obj.y = Math.floor(obj.y); // Simple stabilization
                            } else {
                                obj.vy = 0;
                            }
                            cy = true; break;
                        }
                    }
                }
                if(!cy) obj.y = ny;
                if (obj.y + obj.height > canvasConfig.height) { obj.y = canvasConfig.height - obj.height; obj.vy = 0; obj.isGrounded = true; }
            }
        });
    });

    if (cameraRef.current.targetId) {
        const target = currentObjects.find(o => o.id === cameraRef.current.targetId);
        if (target) {
            const tx = (target.x + target.width / 2) - (canvasConfig.width / 2);
            const ty = (target.y + target.height / 2) - (canvasConfig.height / 2);
            if (cameraRef.current.smooth) {
                cameraRef.current.x += (tx - cameraRef.current.x) * cameraRef.current.speed;
                cameraRef.current.y += (ty - cameraRef.current.y) * cameraRef.current.speed;
            } else {
                cameraRef.current.x = tx; cameraRef.current.y = ty;
            }
        }
    }
    setCameraPos({ x: cameraRef.current.x, y: cameraRef.current.y });
    objectsRef.current = currentObjects.filter(o => !o.isMarkedForDestroy);
    setSimObjects([...objectsRef.current]);
    requestRef.current = requestAnimationFrame(animate);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
      // Find object under pointer
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const scaleX = canvasConfig.width / rect.width;
      const scaleY = canvasConfig.height / rect.height;
      const worldX = (e.clientX - rect.left) * scaleX + cameraRef.current.x;
      const worldY = (e.clientY - rect.top) * scaleY + cameraRef.current.y;

      objectsRef.current.forEach(obj => {
          if (
              worldX >= obj.x && worldX <= obj.x + obj.width &&
              worldY >= obj.y && worldY <= obj.y + obj.height
          ) {
              obj.isPointerDown = true;
              obj.downStartTime = Date.now();
              // Check for Double Click
              if (Date.now() - obj.lastClickTime < 300) {
                  // This will be caught by the event loop as a double click
              }
          }
      });
      // Also trigger global "action" input for testing
      setInput('action', true);
  };

  const handlePointerUp = () => {
      objectsRef.current.forEach(obj => {
          if (obj.isPointerDown) {
              obj.lastClickTime = Date.now(); // Store time for double click check
          }
          obj.isPointerDown = false;
          obj.isDragging = false;
      });
      setInput('action', false);
  };

  useEffect(() => {
    if (isOpen) {
      const g = {}; globalVariables.forEach(v => { (g as any)[v.name] = v.value; });
      globalsRef.current = g; 
      currentSceneIdRef.current = initialSceneId; 
      loadScene(initialSceneId);
      requestRef.current = requestAnimationFrame(animate);
    } else cancelAnimationFrame(requestRef.current);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isOpen]);

  if (!isOpen) return null;

  const mConfig = canvasConfig.mobileControls || { enabled: false } as MobileControlsConfig;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden touch-none select-none">
      <div ref={containerRef} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} className="relative bg-gray-900 shadow-2xl overflow-hidden" style={{ aspectRatio: `${canvasConfig.width}/${canvasConfig.height}`, width: '100%', height: '100%', maxHeight: '100vh', maxWidth: '100vw', objectFit: 'contain' }}>
        
        {/* Game World */}
        <div className="absolute inset-0 w-full h-full overflow-hidden z-10">
             <div style={{ position: 'absolute', left: '50%', top: '50%', width: `${canvasConfig.width}px`, height: `${canvasConfig.height}px`, transform: `translate(-50%, -50%) scale(${Math.min((containerRef.current?.clientWidth || window.innerWidth) / canvasConfig.width, (containerRef.current?.clientHeight || window.innerHeight) / canvasConfig.height)})`, transformOrigin: 'center center' }}>
                 <div style={{ transform: `translate(${-cameraPos.x}px, ${-cameraPos.y}px)`, width: '100%', height: '100%' }}>
                     {simObjects.filter(o => !o.isGui).map(obj => (
                        <div 
                            key={obj.id} 
                            style={{ 
                                position: 'absolute', 
                                left: Math.round(obj.x), 
                                top: Math.round(obj.y), 
                                width: obj.width, 
                                height: obj.height, 
                                backgroundColor: (obj.type !== ObjectType.TEXT && obj.type !== ObjectType.TILEMAP && !obj.previewSpriteUrl ? obj.color : 'transparent'), 
                                backgroundImage: (obj.type !== ObjectType.TILEMAP && obj.previewSpriteUrl) ? `url(${obj.previewSpriteUrl})` : undefined, 
                                backgroundSize: '100% 100%', 
                                imageRendering: 'pixelated', 
                                opacity: obj.opacity, 
                                transform: `rotate(${obj.rotation}deg) scaleX(${obj.flipX ? -1 : 1})` 
                            }}
                        >
                            {obj.type === ObjectType.TILEMAP && obj.tilemap && Object.entries(obj.tilemap.tiles).map(([key, data]) => {
                                const [gx, gy] = key.split(',').map(Number);
                                const tileSize = obj.tilemap?.tileSize || 32;
                                const assetId = typeof data === 'string' ? data : (data as any).url;
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
                                            imageRendering: 'pixelated'
                                        }}
                                    />
                                );
                            })}
                            {obj.type === ObjectType.TEXT && (
                                <div style={{ color: obj.color, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                                    {obj.name}
                                </div>
                            )}
                        </div>
                     ))}
                 </div>
                 {/* GUI Layer */}
                 <div className="absolute inset-0 pointer-events-none">
                     {simObjects.filter(o => o.isGui).map(obj => (
                         <div key={obj.id} style={{ position: 'absolute', left: Math.round(obj.x), top: Math.round(obj.y), width: obj.width, height: obj.height, backgroundColor: (obj.previewSpriteUrl ? 'transparent' : obj.color), backgroundImage: obj.previewSpriteUrl ? `url(${obj.previewSpriteUrl})` : undefined, backgroundSize: '100% 100%', imageRendering: 'pixelated', opacity: obj.opacity }}>
                             {obj.type === ObjectType.TEXT && <div style={{ color: obj.color }} className="w-full h-full flex items-center justify-center text-xs font-bold text-center">{obj.name}</div>}
                         </div>
                     ))}
                 </div>
             </div>
        </div>

        {/* VIRTUAL CONTROLS LAYER (HIGH Z-INDEX) */}
        {mConfig.enabled && (
            <div className="absolute inset-0 pointer-events-none z-[100]">
                 {/* Joystick */}
                 <div 
                    className="absolute pointer-events-auto rounded-full border-4 flex items-center justify-center shadow-lg bg-black/20"
                    style={{ left: `${mConfig.joystickX}%`, top: `${mConfig.joystickY}%`, width: `${mConfig.joystickSize}px`, height: `${mConfig.joystickSize}px`, transform: 'translate(-50%, -50%)', opacity: mConfig.opacity, borderColor: mConfig.color }}
                 >
                    <div className="grid grid-cols-3 grid-rows-3 w-full h-full">
                        <div />
                        <div className="flex items-center justify-center active:bg-white/20" onPointerDown={() => setInput('up', true)} onPointerUp={() => setInput('up', false)} onPointerLeave={() => setInput('up', false)}><ArrowUp style={{color: mConfig.color}} /></div>
                        <div />
                        <div className="flex items-center justify-center active:bg-white/20" onPointerDown={() => setInput('left', true)} onPointerUp={() => setInput('left', false)} onPointerLeave={() => setInput('left', false)}><ArrowUp className="-rotate-90" style={{color: mConfig.color}} /></div>
                        <div className="bg-current rounded-full m-4 opacity-50 shadow-inner" style={{color: mConfig.color}} />
                        <div className="flex items-center justify-center active:bg-white/20" onPointerDown={() => setInput('right', true)} onPointerUp={() => setInput('right', false)} onPointerLeave={() => setInput('right', false)}><ArrowUp className="rotate-90" style={{color: mConfig.color}} /></div>
                        <div />
                        <div className="flex items-center justify-center active:bg-white/20" onPointerDown={() => setInput('down', true)} onPointerUp={() => setInput('down', false)} onPointerLeave={() => setInput('down', false)}><ArrowUp className="rotate-180" style={{color: mConfig.color}} /></div>
                        <div />
                    </div>
                 </div>

                 {/* Action Button */}
                 <div 
                    className="absolute pointer-events-auto rounded-full border-4 flex items-center justify-center font-black text-2xl shadow-lg active:scale-90 transition-transform select-none bg-black/20"
                    onPointerDown={() => setInput('action', true)}
                    onPointerUp={() => setInput('action', false)}
                    onPointerLeave={() => setInput('action', false)}
                    style={{ left: `${mConfig.buttonX}%`, top: `${mConfig.buttonY}%`, width: `${mConfig.buttonSize}px`, height: `${mConfig.buttonSize}px`, transform: 'translate(-50%, -50%)', opacity: mConfig.opacity, borderColor: mConfig.color, color: mConfig.color }}
                 >
                    A
                 </div>
            </div>
        )}

        {/* Exit Button */}
        <button onClick={onClose} className="absolute top-4 right-4 bg-black/40 text-white p-3 rounded-full backdrop-blur z-[200] hover:bg-red-600/80 transition-all border border-white/20 shadow-xl active:scale-95"><X className="w-6 h-6" /></button>
      </div>
    </div>
  );
};
