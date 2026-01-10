import React, { useEffect, useRef, useState } from 'react';
import { GameObject, ObjectType, CanvasConfig, BehaviorType, Scene, MobileControlsConfig, Plugin, Asset } from '../types';
import { X, ArrowUp, ArrowDown, ArrowRight } from './Icons';
import { checkCondition, executeAction, checkRectCollision, resolveTextContent } from '../logic/eventRuntime';

interface GamePreviewModalProps {
  objects: GameObject[]; 
  scenes: Scene[]; 
  initialSceneId: string; 
  isOpen: boolean;
  canvasConfig?: CanvasConfig;
  onClose: () => void;
  globalVariables?: any[]; 
  library?: GameObject[]; 
  plugins?: Plugin[];
  assets?: Asset[];
}

interface SimObject extends GameObject {
  vx: number; vy: number;
  isGrounded: boolean;
  flipX: boolean;
  isMarkedForDestroy?: boolean;
  isPointerDown: boolean;
  timers: Record<string, number>;
  // Touch Logic
  downStartTime: number;
  lastTapTime: number;
  justTapped: boolean; // Single frame flag for TAP
  isDoubleTapped: boolean; // Single frame flag for DOUBLE TAP
  holdDuration: number; 
}

export const GamePreviewModal: React.FC<GamePreviewModalProps> = ({ 
  scenes, initialSceneId, isOpen, canvasConfig = { width: 800, height: 450, mode: 'LANDSCAPE' } as CanvasConfig, onClose, library = [], plugins = [], globalVariables = [], assets = []
}) => {
  const [simObjects, setSimObjects] = useState<SimObject[]>([]);
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Camera State
  const cameraRef = useRef({ x: 0, y: 0, targetId: null as string | null, speed: 0.1 });
  const cameraShakeRef = useRef({ intensity: 0, duration: 0 });

  const inputsRef = useRef({ left: false, right: false, up: false, down: false, action: false });
  
  // Timing refs
  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  
  const objectsRef = useRef<SimObject[]>([]); 
  const currentSceneIdRef = useRef<string>(initialSceneId);
  const globalsRef = useRef<any[]>([]);
  const pendingSceneChange = useRef<string | null>(null);

  const setInput = (key: string, value: boolean) => { (inputsRef.current as any)[key] = value; };

  const createSimObject = (obj: any): SimObject => {
      const simObj = JSON.parse(JSON.stringify(obj));
      if (simObj.prototypeId && library.length > 0) {
          const proto = library.find(p => p.id === simObj.prototypeId);
          if (proto && proto.variables) {
              const existingVars = new Set(simObj.variables.map((v: any) => v.name));
              proto.variables.forEach((pv: any) => {
                  if (!existingVars.has(pv.name)) {
                      simObj.variables.push({ ...pv, id: crypto.randomUUID() });
                  }
              });
          }
      }
      return {
        ...simObj, 
        vx: 0, 
        vy: 0, 
        isGrounded: false, 
        flipX: false, 
        isPointerDown: false, 
        timers: {},
        downStartTime: 0,
        lastTapTime: 0,
        justTapped: false,
        isDoubleTapped: false,
        holdDuration: 0
      };
  };

  const loadScene = (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) {
        console.warn("Escena no encontrada:", sceneId);
        return;
    }
    currentSceneIdRef.current = sceneId;
    frameCountRef.current = 0;
    
    const instances = scene.objects.map(obj => createSimObject(obj));
    objectsRef.current = instances;
    setSimObjects(instances);
    
    cameraRef.current.targetId = scene.camera?.targetObjectId || null;
    cameraRef.current.x = 0;
    cameraRef.current.y = 0;
    cameraShakeRef.current = { intensity: 0, duration: 0 }; // Reset shake
    pendingSceneChange.current = null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const stageWidth = canvasConfig.width;
    const stageHeight = canvasConfig.height;
    const scale = Math.min(rect.width / stageWidth, rect.height / stageHeight);
    const offsetX = (rect.width - (stageWidth * scale)) / 2;
    const offsetY = (rect.height - (stageHeight * scale)) / 2;
    const wx = (e.clientX - rect.left - offsetX) / scale + cameraRef.current.x;
    const wy = (e.clientY - rect.top - offsetY) / scale + cameraRef.current.y;
    
    const now = Date.now();

    objectsRef.current.forEach(o => {
        if (wx >= o.x && wx <= o.x + o.width && wy >= o.y && wy <= o.y + o.height) {
            o.isPointerDown = true;
            o.downStartTime = now;
        }
    });
  };

  const handlePointerUpGlobal = () => {
      const now = Date.now();
      objectsRef.current.forEach(o => {
          if (o.isPointerDown) {
              const duration = now - o.downStartTime;
              // If short tap (< 300ms), register as TAP
              if (duration < 300) {
                  o.justTapped = true;
                  // If last tap was recent (< 300ms ago), register as DOUBLE TAP
                  if (now - o.lastTapTime < 300) {
                      o.isDoubleTapped = true;
                      o.lastTapTime = 0; // Reset to prevent triple tap triggering double twice immediately
                  } else {
                      o.lastTapTime = now;
                  }
              }
              o.isPointerDown = false;
              o.holdDuration = 0;
          }
      });
  };

  const playSound = (url: string, loop: boolean) => {
      const audio = new Audio(url);
      audio.loop = loop;
      audio.play().catch(e => console.warn("Audio autoplay blocked", e));
  };

  const animate = (time: number) => {
    if (previousTimeRef.current === 0) {
        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
        return;
    }

    // Proceso de cambio de escena pendiente
    if (pendingSceneChange.current) {
        loadScene(pendingSceneChange.current);
        previousTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
        return;
    }

    const dt = Math.min((time - previousTimeRef.current) / 1000, 0.1); 
    previousTimeRef.current = time;

    const inputs = inputsRef.current;
    let currentObjects = [...objectsRef.current]; // Copia para iteración segura
    const spawnQueue: SimObject[] = [];
    const frameCount = frameCountRef.current;

    // 1. UPDATE INPUT LOGIC
    currentObjects.forEach(o => {
        if (o.isPointerDown) {
            o.holdDuration += dt;
        } else {
            o.holdDuration = 0;
        }
    });

    // 2. EVENTOS
    for (const obj of currentObjects) {
        if (pendingSceneChange.current) break; 
        
        if (obj.events) {
            for (const ev of obj.events) {
                const allMet = ev.conditions.every(c => checkCondition(c, obj, currentObjects, dt, frameCount, globalsRef.current, inputs, library));
                if (allMet) {
                    for (const act of ev.actions) {
                        const result = executeAction(act, obj, currentObjects, library, spawnQueue, plugins, globalsRef.current, assets);
                        
                        if (result === 'RESTART') {
                            pendingSceneChange.current = currentSceneIdRef.current;
                            break;
                        }
                        if (result && typeof result === 'object') {
                            if (result.type === 'CHANGE_SCENE' || result.type === 'GO_TO_SCENE_SELECT') {
                                pendingSceneChange.current = result.sceneId || result.targetSceneId;
                                break;
                            }
                            if (result.type === 'PLAY_SOUND') {
                                playSound(result.url, result.loop);
                            }
                            if (result.type === 'CAMERA_SHAKE') {
                                cameraShakeRef.current = { duration: result.duration, intensity: result.intensity };
                            }
                        }
                    }
                }
                if (pendingSceneChange.current) break;
            }
        }
    }

    // Si hubo cambio de escena, ignorar el resto del frame
    if (pendingSceneChange.current) {
        requestRef.current = requestAnimationFrame(animate);
        return;
    }

    // Reset Tap Flags (solo duran 1 frame)
    currentObjects.forEach(o => { 
        o.justTapped = false;
        o.isDoubleTapped = false;
    });

    // 3. FÍSICAS Y COMPORTAMIENTOS
    const solids = currentObjects.filter(o => o.isObstacle && o.visible);
    currentObjects.forEach(obj => {
      obj.x += obj.vx * dt;
      obj.y += obj.vy * dt;
      obj.vx *= 0.95;
      obj.vy *= 0.95;

      obj.behaviors?.forEach(b => {
        if (b.type === BehaviorType.PLATFORMER) {
          const jumpForce = b.properties.jumpForce || 550;
          const gravity = b.properties.gravity || 1200;
          const speed = b.properties.speed || 250;
          if (inputs.left) { obj.vx = -speed; obj.flipX = true; } 
          else if (inputs.right) { obj.vx = speed; obj.flipX = false; } 
          if ((inputs.up || inputs.action) && obj.isGrounded) { obj.vy = -jumpForce; obj.isGrounded = false; }
          obj.vy += gravity * dt;
          const nx = obj.x + obj.vx * dt;
          if (solids.some(s => s.id !== obj.id && checkRectCollision({ ...obj, x: nx }, s))) { obj.vx = 0; } else { obj.x = nx; }
          const ny = obj.y + obj.vy * dt;
          obj.isGrounded = false;
          const hit = solids.find(s => s.id !== obj.id && checkRectCollision({ ...obj, y: ny }, s));
          if (hit) {
            if (obj.vy > 0) { obj.y = hit.y - obj.height; obj.isGrounded = true; }
            else if (obj.vy < 0) { obj.y = hit.y + hit.height; }
            obj.vy = 0;
          } else { obj.y = ny; }
        }
        if (b.type === BehaviorType.TOPDOWN) {
            const speed = b.properties.speed || 200;
            let moveX = 0, moveY = 0;
            if (inputs.left) moveX = -1; if (inputs.right) moveX = 1;
            if (inputs.up) moveY = -1; if (inputs.down) moveY = 1;
            if (moveX !== 0 && moveY !== 0) { moveX *= 0.707; moveY *= 0.707; }
            if (moveX !== 0 || moveY !== 0) { obj.vx = moveX * speed; obj.vy = moveY * speed; }
            if (moveX < 0) obj.flipX = true; if (moveX > 0) obj.flipX = false;
            const nx = obj.x + obj.vx * dt;
            if (!solids.some(s => s.id !== obj.id && checkRectCollision({ ...obj, x: nx }, s))) obj.x = nx;
            const ny = obj.y + obj.vy * dt;
            if (!solids.some(s => s.id !== obj.id && checkRectCollision({ ...obj, y: ny }, s))) obj.y = ny;
        }
      });
    });

    // 4. ACTUALIZACIÓN DE ESTADO
    const nextObjects = [...currentObjects.filter(o => !o.isMarkedForDestroy), ...spawnQueue.map(obj => createSimObject(obj))];
    objectsRef.current = nextObjects;
    setSimObjects(nextObjects.map(o => ({ ...o, variables: o.variables ? o.variables.map(v => ({...v})) : [] })));

    // 5. CÁMARA
    if (cameraRef.current.targetId) {
      const target = nextObjects.find(o => o.id === cameraRef.current.targetId || o.prototypeId === cameraRef.current.targetId);
      if (target) {
        const tx = target.x + target.width / 2 - canvasConfig.width / 2;
        const ty = target.y + target.height / 2 - canvasConfig.height / 2;
        cameraRef.current.x += (tx - cameraRef.current.x) * cameraRef.current.speed;
        cameraRef.current.y += (ty - cameraRef.current.y) * cameraRef.current.speed;
      }
    }

    // Camera Shake Logic
    let shakeX = 0;
    let shakeY = 0;
    if (cameraShakeRef.current.duration > 0) {
        cameraShakeRef.current.duration -= dt;
        const intensity = cameraShakeRef.current.intensity;
        shakeX = (Math.random() - 0.5) * intensity;
        shakeY = (Math.random() - 0.5) * intensity;
    }

    setCameraPos({ x: cameraRef.current.x + shakeX, y: cameraRef.current.y + shakeY });
    frameCountRef.current++;
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isOpen) { 
        globalsRef.current = JSON.parse(JSON.stringify(globalVariables)); 
        loadScene(initialSceneId); 
        previousTimeRef.current = 0;
        const handleKeyDown = (e: KeyboardEvent) => {
            if(e.code === 'ArrowLeft') inputsRef.current.left = true;
            if(e.code === 'ArrowRight') inputsRef.current.right = true;
            if(e.code === 'ArrowUp') inputsRef.current.up = true;
            if(e.code === 'ArrowDown') inputsRef.current.down = true;
            if(e.code === 'Space') inputsRef.current.action = true;
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if(e.code === 'ArrowLeft') inputsRef.current.left = false;
            if(e.code === 'ArrowRight') inputsRef.current.right = false;
            if(e.code === 'ArrowUp') inputsRef.current.up = false;
            if(e.code === 'ArrowDown') inputsRef.current.down = false;
            if(e.code === 'Space') inputsRef.current.action = false;
        };
        // Add Global Pointer Up listener to handle drag releases and tap logic
        window.addEventListener('pointerup', handlePointerUpGlobal);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        requestRef.current = requestAnimationFrame(animate); 
        return () => {
            window.removeEventListener('pointerup', handlePointerUpGlobal);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            cancelAnimationFrame(requestRef.current);
        };
    }
  }, [isOpen]);

  if (!isOpen) return null;
  const m = canvasConfig.mobileControls || { enabled: false };

  return (
    <div className="fixed inset-0 z-[150] bg-black flex items-center justify-center overflow-hidden touch-none select-none">
      <div ref={containerRef} onPointerDown={handlePointerDown} className="relative bg-gray-900 shadow-2xl overflow-hidden flex items-center justify-center w-full h-full">
        <div style={{ position: 'relative', width: `${canvasConfig.width}px`, height: `${canvasConfig.height}px`, transform: `scale(${Math.min(window.innerWidth / canvasConfig.width, window.innerHeight / canvasConfig.height)})`, overflow: 'hidden', backgroundColor: '#111827' }}>
          <div style={{ transform: `translate(${-cameraPos.x}px, ${-cameraPos.y}px)`, width: '100%', height: '100%', position: 'absolute' }}>
            {simObjects.map(obj => (
              <div className="pixelated" key={obj.id} style={{ position: 'absolute', left: Math.round(obj.x), top: Math.round(obj.y), width: obj.width, height: obj.height, backgroundColor: (!obj.previewSpriteUrl && obj.type !== ObjectType.TEXT) ? obj.color : 'transparent', backgroundImage: obj.previewSpriteUrl ? `url(${obj.previewSpriteUrl})` : undefined, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', opacity: obj.opacity, transform: `rotate(${obj.rotation}deg) scaleX(${obj.flipX ? -1 : 1})`, display: obj.visible ? (obj.type === ObjectType.TEXT ? 'flex' : 'block') : 'none', alignItems: 'center', justifyContent: 'center', color: obj.color, fontSize: obj.type === ObjectType.TEXT ? `${Math.max(8, obj.height * 0.6)}px` : undefined, fontWeight: 'bold', pointerEvents: 'none', textAlign: 'center', lineHeight: '1', whiteSpace: 'nowrap' }}>
                  {obj.type === ObjectType.TEXT ? resolveTextContent(obj, simObjects, globalsRef.current, library) : null}
              </div>
            ))}
          </div>
        </div>
        {m.enabled && (
          <div className="absolute inset-0 pointer-events-none z-[200]">
            <div className="absolute pointer-events-auto rounded-full border-4 flex items-center justify-center bg-black/30 backdrop-blur-sm shadow-2xl" style={{ left: `${m.joystickX}%`, top: `${m.joystickY}%`, width: `${m.joystickSize}px`, height: `${m.joystickSize}px`, transform: 'translate(-50%, -50%)', opacity: m.opacity, borderColor: m.color }}>
              <div className="grid grid-cols-3 grid-rows-3 w-full h-full text-white/50">
                <div /><div className="flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors rounded-t-full" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setInput('up', true); }} onPointerUp={() => setInput('up', false)} onPointerLeave={() => setInput('up', false)}><ArrowUp style={{ color: m.color }} /></div><div />
                <div className="flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors rounded-l-full" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setInput('left', true); }} onPointerUp={() => setInput('left', false)} onPointerLeave={() => setInput('left', false)}><ArrowUp className="-rotate-90" style={{ color: m.color }} /></div>
                <div className="flex items-center justify-center"><div className="w-4 h-4 rounded-full bg-white/20" /></div>
                <div className="flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors rounded-r-full" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setInput('right', true); }} onPointerUp={() => setInput('right', false)} onPointerLeave={() => setInput('right', false)}><ArrowUp className="rotate(90deg)" style={{ color: m.color }} /></div>
                <div /><div className="flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors rounded-b-full" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setInput('down', true); }} onPointerUp={() => setInput('down', false)} onPointerLeave={() => setInput('down', false)}><ArrowUp className="rotate-180" style={{ color: m.color }} /></div><div />
              </div>
            </div>
            <div className="absolute pointer-events-auto rounded-full border-4 flex items-center justify-center font-black text-2xl bg-black/30 backdrop-blur-sm shadow-2xl active:scale-90 transition-transform" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setInput('action', true); }} onPointerUp={() => setInput('action', false)} onPointerLeave={() => setInput('action', false)} style={{ left: `${m.buttonX}%`, top: `${m.buttonY}%`, width: `${m.buttonSize}px`, height: `${m.buttonSize}px`, transform: 'translate(-50%, -50%)', opacity: m.opacity, borderColor: m.color, color: m.color }}>A</div>
          </div>
        )}
        <button onClick={onClose} className="absolute top-4 right-4 bg-black/40 text-white p-3 rounded-full z-[300] border border-white/20 shadow-xl active:scale-95 transition-transform"><X className="w-6 h-6" /></button>
      </div>
    </div>
  );
};