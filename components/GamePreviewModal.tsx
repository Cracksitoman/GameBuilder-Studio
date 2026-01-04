
import React, { useEffect, useRef, useState } from 'react';
import { GameObject, ObjectType, CanvasConfig, BehaviorType, Scene, MobileControlsConfig } from '../types';
import { X, ArrowUp, ArrowDown, ArrowRight } from './Icons';
import { checkCondition, executeAction, checkRectCollision } from '../logic/eventRuntime';

interface GamePreviewModalProps {
  objects: GameObject[]; 
  scenes: Scene[]; 
  initialSceneId: string; 
  isOpen: boolean;
  canvasConfig?: CanvasConfig;
  onClose: () => void;
  globalVariables?: any[]; 
  library?: GameObject[]; 
}

interface SimObject extends GameObject {
  vx: number; vy: number;
  isGrounded: boolean;
  flipX: boolean;
  isMarkedForDestroy?: boolean;
  isPointerDown: boolean;
  timers: Record<string, number>;
}

export const GamePreviewModal: React.FC<GamePreviewModalProps> = ({ 
  scenes, initialSceneId, isOpen, canvasConfig = { width: 800, height: 450, mode: 'LANDSCAPE' } as CanvasConfig, onClose, library = [] 
}) => {
  const [simObjects, setSimObjects] = useState<SimObject[]>([]);
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef({ x: 0, y: 0, targetId: null as string | null, speed: 0.1 });
  const inputsRef = useRef({ left: false, right: false, up: false, down: false, action: false });
  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number>(0);
  const objectsRef = useRef<SimObject[]>([]); 
  const currentSceneIdRef = useRef<string>(initialSceneId);

  const setInput = (key: string, value: boolean) => { (inputsRef.current as any)[key] = value; };

  const createSimObject = (obj: any): SimObject => ({
    ...obj, vx: 0, vy: 0, isGrounded: false, flipX: false, isPointerDown: false, timers: {}
  });

  const loadScene = (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;
    const instances = scene.objects.map(obj => createSimObject(obj));
    objectsRef.current = instances;
    setSimObjects(instances);
    cameraRef.current.targetId = scene.camera?.targetObjectId || null;
  };

  const animate = (time: number) => {
    const dt = Math.min((time - previousTimeRef.current) / 1000, 0.1); 
    previousTimeRef.current = time;

    const inputs = inputsRef.current;
    let currentObjects = [...objectsRef.current];
    const spawnQueue: SimObject[] = [];

    // 1. EVENTOS
    currentObjects.forEach(obj => {
      obj.events?.forEach(ev => {
        if (ev.conditions.every(c => checkCondition(c, obj, currentObjects, dt, time))) {
          ev.actions.forEach(act => {
            const result = executeAction(act, obj, currentObjects, library, spawnQueue);
            if (result === 'RESTART') loadScene(currentSceneIdRef.current);
          });
        }
      });
    });

    // 2. FÍSICAS
    const solids = currentObjects.filter(o => o.isObstacle && o.visible);
    currentObjects.forEach(obj => {
      obj.behaviors?.forEach(b => {
        if (b.type === BehaviorType.PLATFORMER) {
          if (inputs.left) { obj.vx = -250; obj.flipX = true; } else if (inputs.right) { obj.vx = 250; obj.flipX = false; } else obj.vx *= 0.8;
          if (inputs.up && obj.isGrounded) { obj.vy = -550; obj.isGrounded = false; }
          obj.vy += 1200 * dt;

          const nx = obj.x + obj.vx * dt;
          if (!solids.some(s => s.id !== obj.id && checkRectCollision({ ...obj, x: nx }, s))) obj.x = nx; else obj.vx = 0;
          const ny = obj.y + obj.vy * dt;
          obj.isGrounded = false;
          const hit = solids.find(s => s.id !== obj.id && checkRectCollision({ ...obj, y: ny }, s));
          if (hit) {
            if (obj.vy > 0) { obj.y = hit.y - obj.height; obj.isGrounded = true; }
            obj.vy = 0;
          } else obj.y = ny;
          if (obj.y + obj.height > canvasConfig.height) { obj.y = canvasConfig.height - obj.height; obj.vy = 0; obj.isGrounded = true; }
        }
      });
    });

    // 3. ACTUALIZACIÓN GLOBAL
    objectsRef.current = [...currentObjects.filter(o => !o.isMarkedForDestroy), ...spawnQueue.map(createSimObject)];
    setSimObjects([...objectsRef.current]);

    // 4. CÁMARA
    if (cameraRef.current.targetId) {
      const target = objectsRef.current.find(o => o.id === cameraRef.current.targetId || o.prototypeId === cameraRef.current.targetId);
      if (target) {
        cameraRef.current.x += ((target.x + target.width / 2 - canvasConfig.width / 2) - cameraRef.current.x) * cameraRef.current.speed;
        cameraRef.current.y += ((target.y + target.height / 2 - canvasConfig.height / 2) - cameraRef.current.y) * cameraRef.current.speed;
      }
    }
    setCameraPos({ x: cameraRef.current.x, y: cameraRef.current.y });
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isOpen) { loadScene(initialSceneId); requestRef.current = requestAnimationFrame(animate); }
    else cancelAnimationFrame(requestRef.current);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isOpen]);

  if (!isOpen) return null;
  const m = canvasConfig.mobileControls || { enabled: false };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden touch-none select-none">
      <div ref={containerRef} onPointerDown={(e) => {
        const rect = containerRef.current?.getBoundingClientRect(); if (!rect) return;
        const scale = canvasConfig.width / rect.width;
        const wx = (e.clientX - rect.left) * scale + cameraRef.current.x;
        const wy = (e.clientY - rect.top) * scale + cameraRef.current.y;
        objectsRef.current.forEach(o => { if (wx >= o.x && wx <= o.x + o.width && wy >= o.y && wy <= o.y + o.height) o.isPointerDown = true; });
      }} className="relative bg-gray-900 shadow-2xl overflow-hidden" style={{ aspectRatio: `${canvasConfig.width}/${canvasConfig.height}`, width: '100%', height: '100%' }}>
        <div style={{ position: 'absolute', left: '50%', top: '50%', width: `${canvasConfig.width}px`, height: `${canvasConfig.height}px`, transform: `translate(-50%, -50%) scale(${Math.min(window.innerWidth / canvasConfig.width, window.innerHeight / canvasConfig.height)})` }}>
          <div style={{ transform: `translate(${-cameraPos.x}px, ${-cameraPos.y}px)` }}>
            {simObjects.map(obj => (
              <div key={obj.id} style={{ position: 'absolute', left: Math.round(obj.x), top: Math.round(obj.y), width: obj.width, height: obj.height, backgroundColor: (!obj.previewSpriteUrl ? obj.color : 'transparent'), backgroundImage: obj.previewSpriteUrl ? `url(${obj.previewSpriteUrl})` : undefined, backgroundSize: '100% 100%', opacity: obj.opacity, transform: `rotate(${obj.rotation}deg) scaleX(${obj.flipX ? -1 : 1})` }} />
            ))}
          </div>
        </div>
        {m.enabled && (
          <div className="absolute inset-0 pointer-events-none z-[100]">
            <div className="absolute pointer-events-auto rounded-full border-4 flex items-center justify-center bg-black/20" style={{ left: `${m.joystickX}%`, top: `${m.joystickY}%`, width: `${m.joystickSize}px`, height: `${m.joystickSize}px`, transform: 'translate(-50%, -50%)', opacity: m.opacity, borderColor: m.color }}>
              <div className="grid grid-cols-3 grid-rows-3 w-full h-full">
                <div /><div className="flex items-center justify-center" onPointerDown={() => setInput('up', true)} onPointerUp={() => setInput('up', false)}><ArrowUp style={{ color: m.color }} /></div><div />
                <div className="flex items-center justify-center" onPointerDown={() => setInput('left', true)} onPointerUp={() => setInput('left', false)}><ArrowUp className="-rotate-90" style={{ color: m.color }} /></div><div /><div className="flex items-center justify-center" onPointerDown={() => setInput('right', true)} onPointerUp={() => setInput('right', false)}><ArrowUp className="rotate-90" style={{ color: m.color }} /></div>
                <div /><div className="flex items-center justify-center" onPointerDown={() => setInput('down', true)} onPointerUp={() => setInput('down', false)}><ArrowUp className="rotate-180" style={{ color: m.color }} /></div><div />
              </div>
            </div>
            <div className="absolute pointer-events-auto rounded-full border-4 flex items-center justify-center font-black text-2xl bg-black/20" onPointerDown={() => setInput('action', true)} onPointerUp={() => setInput('action', false)} style={{ left: `${m.buttonX}%`, top: `${m.buttonY}%`, width: `${m.buttonSize}px`, height: `${m.buttonSize}px`, transform: 'translate(-50%, -50%)', opacity: m.opacity, borderColor: m.color, color: m.color }}> A </div>
          </div>
        )}
        <button onClick={onClose} className="absolute top-4 right-4 bg-black/40 text-white p-3 rounded-full z-[200] border border-white/20 shadow-xl"><X className="w-6 h-6" /></button>
      </div>
    </div>
  );
};
