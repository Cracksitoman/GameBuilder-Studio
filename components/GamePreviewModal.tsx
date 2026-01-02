
// ... (Previous imports)
import React, { useEffect, useRef, useState } from 'react';
import { GameObject, ObjectType, CanvasConfig, BehaviorType, AnimationClip, Variable, Scene } from '../types';
import { X, ArrowRight, ArrowUp, ArrowDown, Maximize } from './Icons';

// ... (SimObject interface remains same)
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
  
  // Interaction Data
  isPointerOver: boolean;
  isPointerDown: boolean;
  downStartTime: number;
  lastClickTime: number;
  isDragging: boolean;
  dragOffsetX: number;
  dragOffsetY: number;
  
  // Runtime
  overrideAnim?: string | null; 
  updateFn?: Function | null;

  // Visual Effects
  flashTimer?: number; 
  originalOpacity?: number;
  
  // Particle Specifics
  isParticle?: boolean;
  lifeTime?: number;
  maxLifeTime?: number;

  // Dynamic Methods (Scripting API)
  move?: (steps: number) => void;
  pointTowards?: (x: number, y: number) => void;
  distanceTo?: (other: {x: number, y: number}) => number;
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
  // ... (State hooks same as before)
  const [simObjects, setSimObjects] = useState<SimObject[]>([]);
  const [showControls, setShowControls] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const cameraRef = useRef({ 
      x: 0, 
      y: 0, 
      targetId: null as string | null, 
      smooth: true, 
      speed: 0.1,
      shakeIntensity: 0,
      shakeTimer: 0,
      zoom: 1,
      targetZoom: 1
  });
  
  const [inputs, setInputs] = useState({ left: false, right: false, up: false, down: false, action: false, tiltX: 0, tiltY: 0 });
  const inputsRef = useRef({ left: false, right: false, up: false, down: false, action: false, tiltX: 0, tiltY: 0 });
  
  const pointerPosRef = useRef({ x: 0, y: 0 });
  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number>(0);
  const objectsRef = useRef<SimObject[]>([]); 
  const globalsRef = useRef<Record<string, any>>({}); 
  const nextSceneIdRef = useRef<string | null>(null);
  const currentSceneIdRef = useRef<string>(initialSceneId);
  const newObjectsQueueRef = useRef<SimObject[]>([]); 

  // ... (Input handlers same as before)
  const setInputState = (key: 'left' | 'right' | 'up' | 'down' | 'action', value: boolean) => {
    inputsRef.current = { ...inputsRef.current, [key]: value };
    setInputs({ ...inputsRef.current });
  };

  const updatePointerPos = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scaleX = (canvasConfig.width / rect.width) / cameraRef.current.zoom;
      const scaleY = (canvasConfig.height / rect.height) / cameraRef.current.zoom;
      
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const relX = e.clientX - rect.left - cx;
      const relY = e.clientY - rect.top - cy;

      pointerPosRef.current = {
          x: (relX * scaleX) + (canvasConfig.width / 2),
          y: (relY * scaleY) + (canvasConfig.height / 2)
      };
  };

  const handleJoystickTouch = (e: React.PointerEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const threshold = rect.width * 0.2; // 20% deadzone

      if (dist < threshold) {
          setInputState('left', false);
          setInputState('right', false);
          setInputState('up', false);
          setInputState('down', false);
          return;
      }

      setInputState('left', dx < -threshold);
      setInputState('right', dx > threshold);
      setInputState('up', dy < -threshold);
      setInputState('down', dy > threshold);
  };

  const clearJoystick = () => {
      setInputState('left', false);
      setInputState('right', false);
      setInputState('up', false);
      setInputState('down', false);
  };

  const toggleFullScreen = () => {
      if (!document.fullscreenElement) {
          containerRef.current?.requestFullscreen().catch(err => {
              console.log(`Error enabling fullscreen: ${err.message}`);
          });
      } else {
          document.exitFullscreen();
      }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
        let x = e.gamma || 0; 
        let y = e.beta || 0; 
        
        let tx = Math.abs(x) < 5 ? 0 : Math.max(-1, Math.min(1, x / 45));
        let ty = Math.abs(y) < 5 ? 0 : Math.max(-1, Math.min(1, y / 45));
        
        if (window.orientation === 90) { 
             const temp = tx; tx = -ty; ty = temp; 
        } else if (window.orientation === -90) {
             const temp = tx; tx = ty; ty = -temp;
        }

        inputsRef.current.tiltX = tx;
        inputsRef.current.tiltY = ty;
    };

    const handlePointerDown = (e: PointerEvent) => {
        updatePointerPos(e);
        const { x, y } = pointerPosRef.current;
        const now = performance.now();

        const sorted = [...objectsRef.current].sort((a, b) => b.zIndex - a.zIndex);
        let found = false;

        sorted.forEach(obj => {
            const worldX = obj.isGui ? x : x + cameraRef.current.x;
            const worldY = obj.isGui ? y : y + cameraRef.current.y;
            
            if (!found && worldX >= obj.x && worldX <= obj.x + obj.width && worldY >= obj.y && worldY <= obj.y + obj.height) {
                obj.isPointerDown = true;
                obj.downStartTime = now;
                obj.isDragging = true;
                obj.dragOffsetX = worldX - obj.x;
                obj.dragOffsetY = worldY - obj.y;
                found = true;
                if (containerRef.current) {
                    (e.target as HTMLElement).setPointerCapture(e.pointerId);
                }
            }
        });
    };

    const handlePointerUp = (e: PointerEvent) => {
        const now = performance.now();
        objectsRef.current.forEach(obj => {
            if (obj.isPointerDown) {
                const duration = now - obj.downStartTime;
                if (duration < 300) {
                    obj.localVars.__clicked = true;
                    if (now - obj.lastClickTime < 300) {
                        obj.localVars.__doubleClicked = true;
                    }
                    obj.lastClickTime = now;
                }
            }
            obj.isPointerDown = false;
            obj.isDragging = false;
        });
    };

    const handlePointerMove = (e: PointerEvent) => updatePointerPos(e);

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') setInputState('left', true);
        if (e.code === 'ArrowRight' || e.code === 'KeyD') setInputState('right', true);
        if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') setInputState('up', true);
        if (e.code === 'ArrowDown' || e.code === 'KeyS') setInputState('down', true);
        if (e.code === 'KeyX' || e.code === 'KeyZ') setInputState('action', true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') setInputState('left', false);
        if (e.code === 'ArrowRight' || e.code === 'KeyD') setInputState('right', false);
        if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') setInputState('up', false);
        if (e.code === 'ArrowDown' || e.code === 'KeyS') setInputState('down', false);
        if (e.code === 'KeyX' || e.code === 'KeyZ') setInputState('action', false);
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
        window.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('deviceorientation', handleOrientation);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen]);

  const compileScript = (code: string | undefined) => {
      if (!code || !code.trim()) return null;
      try {
          return new Function('me', 'dt', 'inputs', 'globals', 'log', code);
      } catch (err) {
          console.error("Error compiling script:", err);
          return null;
      }
  };

  const loadScene = (sceneId: string) => {
      const scene = scenes.find(s => s.id === sceneId);
      if (!scene) return;
      const camConfig = scene.camera || { targetObjectId: null, smooth: true, followSpeed: 0.1, zoom: 1 };
      
      const initialSimObjects = scene.objects.map(obj => {
          const localsMap: Record<string, any> = {};
          (obj.variables || []).forEach(v => { localsMap[v.name] = v.value; });
          
          obj.behaviors.forEach(b => {
              if (b.type === BehaviorType.HEALTH) {
                  localsMap.__maxHealth = b.properties.maxHealth || 100;
                  localsMap.__health = b.properties.currentHealth || 100;
                  localsMap.__destroyOnZero = b.properties.destroyOnZero ?? true;
              }
          });

          return {
            ...obj, vx: 0, vy: 0, isGrounded: false, isFollowing: false,
            currentAnimId: null, frameIndex: 0, animTimer: 0, animFinished: false,
            flipX: false, localVars: localsMap,
            isPointerOver: false, isPointerDown: false, downStartTime: 0, lastClickTime: 0, 
            isDragging: false, dragOffsetX: 0, dragOffsetY: 0,
            originalOpacity: obj.opacity,
            updateFn: compileScript(obj.script)
          };
      });

      objectsRef.current = initialSimObjects;
      newObjectsQueueRef.current = [];
      setSimObjects(initialSimObjects);
      
      const hasPlatformer = scene.objects.some(obj => obj.behaviors?.some(b => b.type === BehaviorType.PLATFORMER));
      const hasTopDown = scene.objects.some(obj => obj.behaviors?.some(b => b.type === BehaviorType.TOPDOWN));
      const controlsEnabled = canvasConfig.mobileControls ? canvasConfig.mobileControls.enabled : (hasPlatformer || hasTopDown);
      setShowControls(controlsEnabled);

      let startX = 0, startY = 0;
      if (camConfig.targetObjectId) {
          const target = initialSimObjects.find(o => o.id === camConfig.targetObjectId);
          if (target) {
              startX = (target.x + target.width / 2) - (canvasConfig.width / 2);
              startY = (target.y + target.height / 2) - (canvasConfig.height / 2);
          }
      }
      
      cameraRef.current = { 
          x: startX, y: startY, targetId: camConfig.targetObjectId, 
          smooth: camConfig.smooth, speed: camConfig.followSpeed,
          shakeIntensity: 0, shakeTimer: 0,
          zoom: camConfig.zoom || 1, targetZoom: camConfig.zoom || 1
      };
      setCameraPos({ x: startX, y: startY });
      runStartEvents(initialSimObjects);
  };

  const runStartEvents = (currentObjects: SimObject[]) => {
      currentObjects.forEach(obj => {
          if (!obj.events) return;
          obj.events.forEach(event => {
              if (event.conditions.some(c => c.type === 'START_OF_SCENE')) executeActions(obj, event.actions, null, currentObjects);
          });
      });
      const survivors = currentObjects.filter(o => !o.isMarkedForDestroy);
      objectsRef.current = survivors;
      setSimObjects(survivors);
  };

  const executeActions = (obj: SimObject, actions: any[], collidedObject: SimObject | null, allObjects: SimObject[]) => {
     actions.forEach((action: any) => {
          if (action.type === 'DESTROY') {
              if (action.parameters.target === 'OTHER' && collidedObject) collidedObject.isMarkedForDestroy = true;
              else obj.isMarkedForDestroy = true;
          }
          if (action.type === 'RESTART_SCENE') nextSceneIdRef.current = currentSceneIdRef.current;
          if (action.type === 'CHANGE_SCENE') nextSceneIdRef.current = action.parameters.sceneId;
          if (action.type === 'SET_VISIBLE') obj.visible = action.parameters.visible;
          if (action.type === 'MOVE_TO_POINTER') {
              const { x: px, y: py } = pointerPosRef.current;
              const worldX = obj.isGui ? px : px + cameraRef.current.x;
              const worldY = obj.isGui ? py : py + cameraRef.current.y;
              obj.x = worldX - (obj.isDragging ? obj.dragOffsetX : obj.width/2);
              obj.y = worldY - (obj.isDragging ? obj.dragOffsetY : obj.height/2);
          }
          
          // --- NEW MOTION BLOCKS LOGIC ---
          if (action.type === 'MOVE_FORWARD') {
              // 0 deg = Up. 90 deg = Right.
              // Logic: x += cos(angle-90)*steps
              const steps = action.parameters.steps || 0;
              const rad = (obj.rotation - 90) * (Math.PI / 180);
              obj.x += Math.cos(rad) * steps;
              obj.y += Math.sin(rad) * steps;
          }
          if (action.type === 'SET_X') obj.x = action.parameters.value || 0;
          if (action.type === 'SET_Y') obj.y = action.parameters.value || 0;
          if (action.type === 'CHANGE_X') obj.x += action.parameters.value || 0;
          if (action.type === 'CHANGE_Y') obj.y += action.parameters.value || 0;
          if (action.type === 'SET_ROTATION') obj.rotation = action.parameters.value || 0;
          if (action.type === 'CHANGE_ROTATION') obj.rotation += action.parameters.value || 0;
          if (action.type === 'POINT_TOWARDS_POINT') {
              const tx = action.parameters.x || 0;
              const ty = action.parameters.y || 0;
              const cx = obj.x + obj.width / 2;
              const cy = obj.y + obj.height / 2;
              const angle = Math.atan2(ty - cy, tx - cx) * (180 / Math.PI);
              obj.rotation = angle + 90;
          }
          // -------------------------------

          if (action.type === 'MODIFY_VARIABLE') {
              const { source, varId, operation, value, targetObjectId } = action.parameters;
              const numericVal = parseFloat(value);
              let targetCollection: Record<string, any> | undefined;
              if (source === 'GLOBAL') targetCollection = globalsRef.current;
              else if (source === 'LOCAL') targetCollection = obj.localVars;
              else if (source === 'OBJECT' && targetObjectId) {
                  const targetObj = allObjects.find(o => o.id === targetObjectId);
                  if (targetObj) targetCollection = targetObj.localVars;
              }
              if (targetCollection) {
                   let currentVal = targetCollection[varId] ?? 0;
                   if (typeof currentVal === 'number' && !isNaN(numericVal)) {
                        if (operation === 'SET') currentVal = numericVal;
                        else if (operation === 'ADD') currentVal += numericVal;
                        else if (operation === 'SUBTRACT') currentVal -= numericVal;
                   } else if (operation === 'SET') {
                        currentVal = (value === 'true') ? true : (value === 'false' ? false : value);
                   }
                   targetCollection[varId] = currentVal;
              }
          }
          
          if (action.type === 'CREATE_OBJECT') {
              const sourceId = action.parameters.sourceObjectId;
              const prototype = library.find(o => o.id === sourceId) || allObjects.find(o => o.id === sourceId);
              if (prototype) {
                  let spawnOriginObj = obj;
                  if (action.parameters.spawnOrigin === 'OTHER' && collidedObject) spawnOriginObj = collidedObject;
                  else if (action.parameters.spawnOrigin && !['SELF', 'OTHER'].includes(action.parameters.spawnOrigin)) {
                      const specific = allObjects.find(o => o.id === action.parameters.spawnOrigin);
                      if (specific) spawnOriginObj = specific;
                  }

                  let startX = spawnOriginObj.x; 
                  let startY = spawnOriginObj.y;
                  let spawnRotation = prototype.rotation;
                  let spawnFlipX = false;
                  const spawnPointName = action.parameters.spawnPointName;
                  
                  if (spawnPointName === 'POINTER') {
                      startX = pointerPosRef.current.x + cameraRef.current.x;
                      startY = pointerPosRef.current.y + cameraRef.current.y;
                  } else if (spawnPointName && spawnOriginObj.points) {
                      const point = spawnOriginObj.points.find(p => p.name === spawnPointName);
                      if (point) {
                          const w = spawnOriginObj.width; const h = spawnOriginObj.height;
                          let px = point.x * w; let py = point.y * h;
                          if (spawnOriginObj.flipX) px = w - px; 
                          const cx = w / 2; const cy = h / 2; const dx = px - cx; const dy = py - cy;
                          const angleRad = spawnOriginObj.rotation * (Math.PI / 180);
                          const rx = dx * Math.cos(angleRad) - dy * Math.sin(angleRad);
                          const ry = dx * Math.sin(angleRad) + dy * Math.cos(angleRad);
                          startX = spawnOriginObj.x + cx + rx - (prototype.width / 2);
                          startY = spawnOriginObj.y + cy + ry - (prototype.height / 2);
                      }
                  } else {
                      startX = (spawnOriginObj.x + spawnOriginObj.width/2) - (prototype.width/2);
                      startY = (spawnOriginObj.y + spawnOriginObj.height/2) - (prototype.height/2);
                  }

                  const inherit = action.parameters.inheritRotation ?? true;
                  if (inherit) { spawnRotation = spawnOriginObj.rotation; spawnFlipX = spawnOriginObj.flipX; }

                  const newObj: SimObject = {
                      ...prototype, id: crypto.randomUUID(), x: startX, y: startY, rotation: spawnRotation, flipX: spawnFlipX,
                      isMarkedForDestroy: false, vx: 0, vy: 0, isGrounded: false, isFollowing: false,
                      localVars: { ...((prototype as SimObject).localVars || {}) },
                      isPointerDown: false, isPointerOver: false, isDragging: false,
                      downStartTime: 0, lastClickTime: 0, dragOffsetX: 0, dragOffsetY: 0,
                      animTimer: 0, frameIndex: 0, currentAnimId: null, animFinished: false,
                      updateFn: compileScript(prototype.script)
                  };
                  newObj.localVars.__creatorId = spawnOriginObj.id;
                  newObj.localVars.__gracePeriod = 0.5;
                  newObjectsQueueRef.current.push(newObj);
              }
          }

          if (action.type === 'DAMAGE_OBJECT' || action.type === 'HEAL_OBJECT') {
              const target = action.parameters.target === 'SELF' ? obj : collidedObject;
              if (target && target.localVars.__health !== undefined) {
                  const amount = action.parameters.amount || 1;
                  if (action.type === 'DAMAGE_OBJECT') {
                      target.localVars.__health -= amount;
                      target.flashTimer = 0.2;
                      if (target.localVars.__health <= 0 && target.localVars.__destroyOnZero) target.isMarkedForDestroy = true;
                  } else target.localVars.__health = Math.min(target.localVars.__health + amount, target.localVars.__maxHealth);
              }
          }

          if (action.type === 'SPAWN_PARTICLES') {
              const count = action.parameters.count || 10;
              const color = action.parameters.color || '#ffaa00';
              const speed = action.parameters.speed || 100;
              const duration = action.parameters.duration || 1.0;
              for (let i = 0; i < count; i++) {
                   const angle = Math.random() * Math.PI * 2;
                   const pSpeed = Math.random() * speed;
                   const vx = Math.cos(angle) * pSpeed; const vy = Math.sin(angle) * pSpeed;
                   const size = Math.random() * 8 + 2;
                   newObjectsQueueRef.current.push({
                       id: crypto.randomUUID(), name: 'Particle', type: ObjectType.SPRITE, x: obj.x + obj.width/2, y: obj.y + obj.height/2, width: size, height: size,
                       color: color, visible: true, opacity: 1, zIndex: 100, layerId: 'particle_layer', rotation: Math.random() * 360, isObstacle: false, behaviors: [], events: [], variables: [],
                       vx, vy, isGrounded: false, isFollowing: false, isPointerDown: false, isPointerOver: false, isDragging: false, downStartTime: 0, lastClickTime: 0, dragOffsetX: 0, dragOffsetY: 0, animTimer: 0, frameIndex: 0, currentAnimId: null, animFinished: false, flipX: false, localVars: {}, isParticle: true, lifeTime: duration, maxLifeTime: duration
                   });
              }
          }
          if (action.type === 'PLAY_SOUND' && action.parameters.url) new Audio(action.parameters.url).play().catch(() => {});
          if (action.type === 'SET_VELOCITY') { if (action.parameters.vx !== undefined) obj.vx = action.parameters.vx; if (action.parameters.vy !== undefined) obj.vy = action.parameters.vy; }
          if (action.type === 'STOP_MOVEMENT') { obj.vx = 0; obj.vy = 0; }
          if (action.type === 'SET_TEXT') obj.name = action.parameters.text;
          if (action.type === 'SET_COLOR') obj.color = action.parameters.color;
          if (action.type === 'APPLY_FORCE') { obj.vx = (obj.vx || 0) + (action.parameters.forceX || 0); obj.vy = (obj.vy || 0) + (action.parameters.forceY || 0); }
          if (action.type === 'ROTATE_TOWARD') {
              let tx = 0, ty = 0;
              if (action.parameters.targetId === 'POINTER') { tx = pointerPosRef.current.x + cameraRef.current.x; ty = pointerPosRef.current.y + cameraRef.current.y; } 
              else { const t = allObjects.find(o => o.id === action.parameters.targetId); if (t) { tx = t.x + t.width/2; ty = t.y + t.height/2; } }
              obj.rotation = Math.atan2(ty - (obj.y + obj.height/2), tx - (obj.x + obj.width/2)) * (180 / Math.PI);
          }
          if (action.type === 'CAMERA_SHAKE') { cameraRef.current.shakeIntensity = action.parameters.intensity; cameraRef.current.shakeTimer = action.parameters.duration; }
          if (action.type === 'SET_CAMERA_ZOOM') cameraRef.current.targetZoom = action.parameters.zoom || 1;
     });
  };

  const checkRectCollision = (r1: SimObject, r2: SimObject) => (
      r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y
  );

  const checkTilemapCollision = (obj: SimObject, tilemap: SimObject) => {
      if (!tilemap.tilemap) return false;
      const ts = tilemap.tilemap.tileSize || 32;
      const relX = obj.x - tilemap.x;
      const relY = obj.y - tilemap.y;
      
      const startGx = Math.floor(relX / ts);
      const endGx = Math.floor((relX + obj.width - 0.01) / ts);
      const startGy = Math.floor(relY / ts);
      const endGy = Math.floor((relY + obj.height - 0.01) / ts);

      for(let gy = startGy; gy <= endGy; gy++) {
          for(let gx = startGx; gx <= endGx; gx++) {
              const key = `${gx},${gy}`;
              const t = tilemap.tilemap.tiles[key];
              if (t && (typeof t === 'string' || t.solid)) return true;
          }
      }
      return false;
  };

  // ... (Rest of component remains largely the same, just keeping the animate and render logic)
  const animate = (time: number) => {
    const dt = Math.min((time - previousTimeRef.current) / 1000, 0.1); 
    previousTimeRef.current = time;

    if (newObjectsQueueRef.current.length > 0) {
        objectsRef.current = [...objectsRef.current, ...newObjectsQueueRef.current];
        newObjectsQueueRef.current = [];
    }

    if (nextSceneIdRef.current) {
        const id = nextSceneIdRef.current; nextSceneIdRef.current = null;
        currentSceneIdRef.current = id; loadScene(id);
        requestRef.current = requestAnimationFrame(animate); return;
    }

    const currentInputs = inputsRef.current;
    let currentObjects = [...objectsRef.current];
    const { x: px, y: py } = pointerPosRef.current;
    const now = performance.now();

    currentObjects.forEach(obj => {
        const worldX = obj.isGui ? px : px + cameraRef.current.x;
        const worldY = obj.isGui ? py : py + cameraRef.current.y;
        obj.isPointerOver = (worldX >= obj.x && worldX <= obj.x + obj.width && worldY >= obj.y && worldY <= obj.y + obj.height);
        
        if (obj.flashTimer && obj.flashTimer > 0) {
            obj.flashTimer -= dt;
            obj.opacity = (Math.floor(obj.flashTimer * 10) % 2 === 0) ? 0 : (obj.originalOpacity ?? 1);
            if (obj.flashTimer <= 0) obj.opacity = obj.originalOpacity ?? 1;
        }
        if (obj.localVars.__gracePeriod > 0) obj.localVars.__gracePeriod -= dt;
        if (obj.isParticle) {
            obj.lifeTime = (obj.lifeTime || 0) - dt;
            obj.x += obj.vx * dt; obj.y += obj.vy * dt;
            obj.opacity = Math.max(0, (obj.lifeTime / (obj.maxLifeTime || 1)));
            if (obj.lifeTime <= 0) obj.isMarkedForDestroy = true;
        }

        // --- INJECT SCRIPT API METHODS (Dynamically) ---
        if (obj.updateFn) {
            
            // Motion API
            // 0 degrees is UP in this engine logic? Let's check Rotate behavior.
            // Actually, usually in Canvas, 0 is Right. 
            // BUT user requested "0 is towards up".
            // So: 
            // 0 deg = Up ( -Y )
            // 90 deg = Right ( +X )
            // 180 deg = Down ( +Y )
            // 270 deg = Left ( -X )
            // Formula: x += sin(angle) * step, y -= cos(angle) * step (if clockwise)
            // Let's stick to standard math offset: angle - 90.
            
            obj.move = (steps: number) => {
                const rad = (obj.rotation - 90) * (Math.PI / 180);
                obj.x += Math.cos(rad) * steps;
                obj.y += Math.sin(rad) * steps;
            };
            
            obj.pointTowards = (tx: number, ty: number) => {
                const cx = obj.x + obj.width / 2;
                const cy = obj.y + obj.height / 2;
                // atan2(y, x) gives angle from X axis (Right).
                // We want 0 to be Up. So we add 90 degrees.
                const angle = Math.atan2(ty - cy, tx - cx) * (180 / Math.PI);
                obj.rotation = angle + 90;
            };

            obj.distanceTo = (target: {x: number, y: number}) => {
                return Math.sqrt(Math.pow(obj.x - target.x, 2) + Math.pow(obj.y - target.y, 2));
            };

            try { 
                obj.updateFn(obj, dt, currentInputs, globalsRef.current, console.log); 
            } catch (e) { 
                console.error(e);
                obj.updateFn = null; 
            }
        }
    });

    const solids = currentObjects.filter(o => o.isObstacle && o.type !== ObjectType.TILEMAP && o.visible && !o.behaviors.some(b => b.type === BehaviorType.PROJECTILE));
    const tilemaps = currentObjects.filter(o => o.type === ObjectType.TILEMAP && o.visible);

    const nextObjects = currentObjects.map(obj => {
      if (obj.isParticle || !obj.behaviors || obj.localVars['__behavior_disabled']) return obj;
      let { x, y, vx, vy, isGrounded } = obj;
      
      obj.behaviors.forEach(b => {
          if (b.type === BehaviorType.TOPDOWN) {
             const s = b.properties.speed || 200;
             let inputX = 0, inputY = 0;
             if (currentInputs.left) inputX = -1; else if (currentInputs.right) inputX = 1;
             if (currentInputs.up) inputY = -1; else if (currentInputs.down) inputY = 1;
             
             if (inputX !== 0) vx = inputX * s; else vx *= 0.7;
             if (inputY !== 0) vy = inputY * s; else vy *= 0.7;
             if (Math.abs(vx) < 5) vx = 0; if (Math.abs(vy) < 5) vy = 0;

             const nx = x + vx * dt; const ntx = { ...obj, x: nx, y };
             let cx = false;
             for (const obs of solids) if (obj.id !== obs.id && checkRectCollision(ntx, obs)) { cx = true; break; }
             if (!cx) for (const tm of tilemaps) if (checkTilemapCollision(ntx, tm)) { cx = true; break; }
             if (!cx) x = nx;

             const ny = y + vy * dt; const nty = { ...obj, x, y: ny };
             let cy = false;
             for (const obs of solids) if (obj.id !== obs.id && checkRectCollision(nty, obs)) { cy = true; break; }
             if (!cy) for (const tm of tilemaps) if (checkTilemapCollision(nty, tm)) { cy = true; break; }
             if (!cy) y = ny;
          }
          
          if (b.type === BehaviorType.PLATFORMER) {
            const g = b.properties.gravity || 1000;
            const j = b.properties.jumpForce || 500;
            const m = b.properties.maxSpeed || 250;

            let inputX = 0;
            if (currentInputs.left) inputX = -1;
            else if (currentInputs.right) inputX = 1;

            if (inputX !== 0) { vx = inputX * m; obj.flipX = inputX < 0; }
            else { vx *= 0.7; if (Math.abs(vx) < 5) vx = 0; }

            if ((currentInputs.up || currentInputs.action) && isGrounded) { vy = -j; isGrounded = false; }
            vy += g * dt;
            
            const nx = x + vx * dt; const ntx = { ...obj, x: nx, y };
            let cx = false;
            for (const obs of solids) if (obj.id !== obs.id && checkRectCollision(ntx, obs)) { cx = true; break; }
            if (!cx) for (const tm of tilemaps) if (checkTilemapCollision(ntx, tm)) { cx = true; break; }
            if (!cx) x = nx;

            const ny = y + vy * dt; const nty = { ...obj, x, y: ny };
            let cy = false;
            for (const obs of solids) {
                if (obj.id !== obs.id && checkRectCollision(nty, obs)) {
                    if (vy > 0) { y = obs.y - obj.height; isGrounded = true; vy = 0; }
                    else if (vy < 0) { y = obs.y + obs.height; vy = 0; }
                    cy = true; break;
                }
            }
            if (!cy) {
                for (const tm of tilemaps) {
                    if (checkTilemapCollision(nty, tm)) {
                        if (vy > 0) { isGrounded = true; vy = 0; y = Math.floor(y); } else vy = 0;
                        cy = true; break;
                    }
                }
            }
            if (!cy) { y = ny; isGrounded = false; }
            if (y + obj.height >= canvasConfig.height) { y = canvasConfig.height - obj.height; vy = 0; isGrounded = true; }
          }

          // NUEVO COMPORTAMIENTO: CONTROL POR INCLINACIÓN
          if (b.type === BehaviorType.TILT_CONTROL) {
              const s = b.properties.speed || 300;
              vx = currentInputs.tiltX * s;
              vy = currentInputs.tiltY * s;
              x += vx * dt; y += vy * dt;
          }

          if (b.type === BehaviorType.PROJECTILE) {
              const s = b.properties.speed || 400;
              const angleRad = obj.rotation * (Math.PI / 180);
              vx = Math.cos(angleRad) * s; vy = Math.sin(angleRad) * s;
              x += vx * dt; y += vy * dt;
              if (x < -2000 || x > canvasConfig.width + 2000 || y < -2000 || y > canvasConfig.height + 2000) obj.isMarkedForDestroy = true;
          }
      });
      return { ...obj, x, y, vx, vy, isGrounded };
    });

    if (cameraRef.current.targetId) {
        const t = nextObjects.find(o => o.id === cameraRef.current.targetId);
        if (t) {
            const tx = (t.x + t.width/2) - canvasConfig.width/2;
            const ty = (t.y + t.height/2) - canvasConfig.height/2;
            cameraRef.current.x += (tx - cameraRef.current.x) * cameraRef.current.speed;
            cameraRef.current.y += (ty - cameraRef.current.y) * cameraRef.current.speed;
        }
    }
    cameraRef.current.zoom += (cameraRef.current.targetZoom - cameraRef.current.zoom) * 0.05;
    
    let shakeX = 0, shakeY = 0;
    if (cameraRef.current.shakeTimer > 0) {
        cameraRef.current.shakeTimer -= dt;
        const mag = cameraRef.current.shakeIntensity;
        shakeX = (Math.random() - 0.5) * mag; shakeY = (Math.random() - 0.5) * mag;
    }
    setCameraPos({ x: cameraRef.current.x + shakeX, y: cameraRef.current.y + shakeY });

    nextObjects.forEach(obj => {
        if (!obj.events || obj.isParticle) return;
        obj.events.forEach(event => {
            let met = true; let collidedObject: SimObject | null = null;
            for (const cond of event.conditions) {
                if (cond.type === 'COLLISION') {
                   const t = nextObjects.find(o => o.id === cond.parameters.targetId);
                   if (t && !(t.id === obj.localVars.__creatorId && (obj.localVars.__gracePeriod || 0) > 0) && !(obj.id === t.localVars.__creatorId && (t.localVars.__gracePeriod || 0) > 0) && checkRectCollision(obj, t)) collidedObject = t;
                   else { met = false; break; }
                }
                if (cond.type === 'TOUCH_INTERACTION') {
                    const type = cond.parameters.subtype;
                    if (type === 'CLICK' && !obj.localVars.__clicked) { met = false; break; }
                    if (type === 'DOUBLE_CLICK' && !obj.localVars.__doubleClicked) { met = false; break; }
                    if (type === 'DRAG' && !obj.isDragging) { met = false; break; }
                    if (type === 'HOVER' && !obj.isPointerOver) { met = false; break; }
                    if (type === 'LONG_PRESS' && (!obj.isPointerDown || (now - obj.downStartTime < (cond.parameters.duration || 0.5) * 1000))) { met = false; break; }
                }
                if (cond.type === 'EVERY_X_SECONDS') {
                    const interval = (cond.parameters.interval || 1) * 1000;
                    const last = obj.localVars[`__timer_${event.id}`] || 0;
                    if (now - last >= interval) obj.localVars[`__timer_${event.id}`] = now; else { met = false; break; }
                }
                if (cond.type === 'DISTANCE_TO') {
                    const t = nextObjects.find(o => o.id === cond.parameters.targetId);
                    if (t) {
                        const d = Math.sqrt(Math.pow(obj.x - t.x, 2) + Math.pow(obj.y - t.y, 2));
                        const th = cond.parameters.distance || 100;
                        if (cond.parameters.operator === 'LESS' && d > th) { met = false; break; }
                        if (cond.parameters.operator === 'GREATER' && d < th) { met = false; break; }
                    } else { met = false; break; }
                }
                if (cond.type === 'KEY_PRESSED') {
                    const k = cond.parameters.key; let p = false;
                    if (k === 'Space') p = currentInputs.up;
                    else if (k === 'ArrowLeft') p = currentInputs.left;
                    else if (k === 'ArrowRight') p = currentInputs.right;
                    if (!p) { met = false; break; }
                }
                if (cond.type === 'IS_MOVING' && Math.sqrt(obj.vx*obj.vx + obj.vy*obj.vy) < 5) { met = false; break; }
                if (cond.type === 'IS_VISIBLE' && (!obj.visible || obj.opacity === 0)) { met = false; break; }
                if (cond.type === 'COMPARE_POSITION') {
                    const a = cond.parameters.axis || 'X'; const v = obj[a === 'X' ? 'x' : 'y']; const t = cond.parameters.value || 0;
                    if (cond.parameters.operator === 'GREATER' && v <= t) { met = false; break; }
                    if (cond.parameters.operator === 'LESS' && v >= t) { met = false; break; }
                    if (cond.parameters.operator === 'EQUAL' && Math.abs(v - t) > 1) { met = false; break; }
                }
                if (cond.type === 'COMPARE_VARIABLE') {
                   const { source, varId, operator, value } = cond.parameters;
                   let dict = source === 'GLOBAL' ? globalsRef.current : obj.localVars;
                   const cur = dict[varId]; const target = isNaN(parseFloat(value)) ? value : parseFloat(value);
                   if (operator === 'EQUAL' && cur != target) { met = false; break; }
                   if (operator === 'GREATER' && cur <= target) { met = false; break; }
                   if (operator === 'LESS' && cur >= target) { met = false; break; }
                   if (operator === 'NOT_EQUAL' && cur == target) { met = false; break; }
                }
            }
            if (met) executeActions(obj, event.actions, collidedObject, nextObjects);
        });
        delete obj.localVars.__clicked; delete obj.localVars.__doubleClicked;
    });

    const final = nextObjects.filter(o => !o.isMarkedForDestroy);
    objectsRef.current = final;
    setSimObjects(final);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (isOpen) {
      initGame(); previousTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animate);
    } else cancelAnimationFrame(requestRef.current);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isOpen]);

  const initGame = () => {
      const g = {}; globalVariables.forEach(v => { g[v.name] = v.value; });
      globalsRef.current = g; currentSceneIdRef.current = initialSceneId; nextSceneIdRef.current = null;
      loadScene(initialSceneId);
  };

  if (!isOpen) return null;

  const mobileConfig = canvasConfig.mobileControls || { 
      enabled: true, joystickX: 15, joystickY: 80, joystickSize: 150, 
      buttonX: 85, buttonY: 80, buttonSize: 100, opacity: 0.5, color: '#ffffff' 
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden touch-none">
      <div ref={containerRef} className="relative bg-gray-900" style={{ aspectRatio: `${canvasConfig.width}/${canvasConfig.height}`, width: '100%', height: '100%', maxHeight: '100vh', maxWidth: '100vw', objectFit: 'contain' }}>
        <div className="absolute inset-0 w-full h-full relative overflow-hidden">
             <div style={{ position: 'absolute', left: '50%', top: '50%', width: `${canvasConfig.width}px`, height: `${canvasConfig.height}px`, transform: `translate(-50%, -50%) scale(${Math.min((containerRef.current?.clientWidth || window.innerWidth) / canvasConfig.width, (containerRef.current?.clientHeight || window.innerHeight) / canvasConfig.height)})`, transformOrigin: 'center center' }}>
                 <div style={{ 
                     transform: `scale(${cameraRef.current.zoom}) translate(${-cameraPos.x}px, ${-cameraPos.y}px)`, 
                     width: '100%', height: '100%', transformOrigin: 'center center', transition: 'transform 0.05s linear' 
                 }}>
                     {simObjects.filter(o => !o.isGui).map(obj => {
                         const isTilemap = obj.type === ObjectType.TILEMAP;
                         // PIXEL PERFECT RENDER LOGIC:
                         // Keep internal x/y float for physics, but render integer coordinates
                         const style: React.CSSProperties = {
                             position: 'absolute', 
                             left: Math.round(obj.x), 
                             top: Math.round(obj.y), 
                             width: Math.round(obj.width), 
                             height: Math.round(obj.height),
                             backgroundColor: (!isTilemap && obj.type !== ObjectType.TEXT) ? (obj.previewSpriteUrl ? 'transparent' : obj.color) : 'transparent',
                             display: obj.visible ? 'block' : 'none', zIndex: obj.zIndex, opacity: obj.opacity,
                             imageRendering: 'pixelated', backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat',
                             backgroundImage: (obj.previewSpriteUrl && !isTilemap) ? `url(${obj.previewSpriteUrl})` : undefined,
                             transform: `rotate(${obj.rotation}deg) scaleX(${obj.flipX ? -1 : 1})`, borderRadius: obj.isParticle ? '50%' : '0'
                         };
                         return (
                            <div key={obj.id} style={style}>
                                {isTilemap && obj.tilemap && Object.entries(obj.tilemap.tiles).map(([key, data]) => {
                                    const [gx, gy] = key.split(',').map(Number);
                                    const tileSize = obj.tilemap?.tileSize || 32;
                                    const assetId = typeof data === 'string' ? data : (data as { url: string }).url;
                                    return ( <div key={key} style={{ position: 'absolute', left: gx * tileSize, top: gy * tileSize, width: tileSize, height: tileSize, backgroundImage: `url(${assetId})`, backgroundSize: 'contain' }} /> );
                                })}
                                {obj.type === ObjectType.TEXT && (
                                    <div style={{ color: obj.color }} className="w-full h-full flex items-center justify-center font-sans whitespace-nowrap">{obj.name}</div>
                                )}
                            </div>
                         );
                     })}
                 </div>
                 <div className="absolute inset-0 pointer-events-none">
                     {simObjects.filter(o => o.isGui).map(obj => (
                         <div key={obj.id} style={{ 
                             position: 'absolute', left: Math.round(obj.x), top: Math.round(obj.y), width: Math.round(obj.width), height: Math.round(obj.height), 
                             backgroundColor: (obj.previewSpriteUrl ? 'transparent' : obj.color), 
                             display: obj.visible ? 'block' : 'none', opacity: obj.opacity,
                             backgroundImage: obj.previewSpriteUrl ? `url(${obj.previewSpriteUrl})` : undefined,
                             backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', imageRendering: 'pixelated'
                         }}>
                             {obj.type === ObjectType.TEXT && <div style={{ color: obj.color }} className="w-full h-full flex items-center justify-center">{obj.name}</div>}
                         </div>
                     ))}
                 </div>
             </div>
        </div>

        <div className="absolute top-4 right-4 z-[110] flex space-x-2">
            <button onClick={toggleFullScreen} className="bg-black/40 hover:bg-gray-700/80 text-white p-3 rounded-full backdrop-blur transition-all"><Maximize className="w-6 h-6" /></button>
            <button onClick={onClose} className="bg-black/40 hover:bg-red-500/80 text-white p-3 rounded-full backdrop-blur transition-all"><X className="w-6 h-6" /></button>
        </div>
      
        {showControls && (
            <div className="absolute inset-0 pointer-events-none z-[110]">
                {/* VECTOR JOYSTICK */}
                <div 
                    className="absolute pointer-events-auto rounded-full border-2 flex items-center justify-center select-none touch-none"
                    style={{
                        left: `${mobileConfig.joystickX}%`, top: `${mobileConfig.joystickY}%`,
                        width: `${mobileConfig.joystickSize}px`, height: `${mobileConfig.joystickSize}px`,
                        transform: 'translate(-50%, -50%)', opacity: mobileConfig.opacity,
                        borderColor: mobileConfig.color, backgroundColor: `${mobileConfig.color}20`,
                    }}
                    onPointerMove={handleJoystickTouch}
                    onPointerDown={handleJoystickTouch}
                    onPointerUp={clearJoystick}
                    onPointerLeave={clearJoystick}
                >
                    <div className="w-1/3 h-1/3 rounded-full bg-current transition-transform duration-75" 
                         style={{
                             color: mobileConfig.color,
                             transform: `translate(${inputs.right ? 20 : (inputs.left ? -20 : 0)}%, ${inputs.down ? 20 : (inputs.up ? -20 : 0)}%)`
                         }}></div>
                    <ArrowUp className={`absolute top-2 w-6 h-6 transition-opacity ${inputs.up ? 'opacity-100' : 'opacity-30'}`} style={{color: mobileConfig.color}} />
                    <ArrowDown className={`absolute bottom-2 w-6 h-6 transition-opacity ${inputs.down ? 'opacity-100' : 'opacity-30'}`} style={{color: mobileConfig.color}} />
                    <ArrowRight className={`absolute left-2 w-6 h-6 rotate-180 transition-opacity ${inputs.left ? 'opacity-100' : 'opacity-30'}`} style={{color: mobileConfig.color}} />
                    <ArrowRight className={`absolute right-2 w-6 h-6 transition-opacity ${inputs.right ? 'opacity-100' : 'opacity-30'}`} style={{color: mobileConfig.color}} />
                </div>

                {/* ACTION BUTTON */}
                <div 
                    className="absolute pointer-events-auto rounded-full border-2 flex items-center justify-center font-bold text-2xl select-none touch-none"
                    style={{
                        left: `${mobileConfig.buttonX}%`, top: `${mobileConfig.buttonY}%`,
                        width: `${mobileConfig.buttonSize}px`, height: `${mobileConfig.buttonSize}px`,
                        transform: 'translate(-50%, -50%)', opacity: mobileConfig.opacity,
                        borderColor: mobileConfig.color, color: mobileConfig.color, backgroundColor: `${mobileConfig.color}20`,
                    }}
                    onPointerDown={() => setInputState('action', true)} 
                    onPointerUp={() => setInputState('action', false)}
                >
                    A
                </div>
            </div>
        )}
      </div>
    </div>
  );
};