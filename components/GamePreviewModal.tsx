
import React, { useEffect, useRef, useState } from 'react';
import { GameObject, ObjectType, CanvasConfig, BehaviorType, AnimationClip, Variable, Scene } from '../types';
import { X, ArrowRight, ArrowUp, ArrowDown, Maximize } from './Icons';

interface GamePreviewModalProps {
  objects: GameObject[]; 
  scenes: Scene[]; 
  initialSceneId: string; 
  isOpen: boolean;
  canvasConfig?: CanvasConfig;
  onClose: () => void;
  globalVariables?: Variable[]; 
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
  updateFn?: Function | null; // THE COMPILED SCRIPT

  // Visual Effects
  flashTimer?: number; // For FLASH_EFFECT
  originalOpacity?: number;
  
  // Particle Specifics
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
  globalVariables = [] 
}) => {
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

  const setInputState = (key: 'left' | 'right' | 'up' | 'down' | 'action', value: boolean) => {
    setInputs(prev => ({ ...prev, [key]: value }));
    inputsRef.current = { ...inputsRef.current, [key]: value };
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

  const toggleFullScreen = () => {
      if (!document.fullscreenElement) {
          containerRef.current?.requestFullscreen().catch(err => {
              console.log(`Error attempting to enable fullscreen: ${err.message}`);
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
        let tx = Math.max(-1, Math.min(1, x / 45));
        let ty = Math.max(-1, Math.min(1, y / 45));
        
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

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('deviceorientation', handleOrientation);
    
    return () => {
        window.removeEventListener('pointerdown', handlePointerDown);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('deviceorientation', handleOrientation);
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

      setSimObjects(initialSimObjects);
      objectsRef.current = initialSimObjects;
      newObjectsQueueRef.current = [];
      
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
     // ... (Previous action logic remains largely the same, trimmed for brevity as user didn't ask for change here)
     // Keep all action logic as is
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
              const prototype = allObjects.find(o => o.id === sourceId) || scenes.flatMap(s=>s.objects).find(o=>o.id === sourceId);
              if (prototype) {
                  const xMode = action.parameters.xSource || 'SELF';
                  const yMode = action.parameters.ySource || 'SELF';
                  let startX = obj.x; let startY = obj.y;
                  if (xMode === 'POINTER') startX = pointerPosRef.current.x + cameraRef.current.x;
                  if (yMode === 'POINTER') startY = pointerPosRef.current.y + cameraRef.current.y;

                  const newObj: SimObject = {
                      ...prototype,
                      id: crypto.randomUUID(), 
                      x: startX, y: startY,
                      isMarkedForDestroy: false,
                      vx: 0, vy: 0, isGrounded: false, isFollowing: false,
                      localVars: { ...((prototype as SimObject).localVars || {}) },
                      isPointerDown: false, isPointerOver: false, isDragging: false,
                      downStartTime: 0, lastClickTime: 0, dragOffsetX: 0, dragOffsetY: 0,
                      animTimer: 0, frameIndex: 0, currentAnimId: null, animFinished: false, flipX: false,
                      updateFn: compileScript(prototype.script)
                  };
                  newObjectsQueueRef.current.push(newObj);
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
                   const vx = Math.cos(angle) * pSpeed;
                   const vy = Math.sin(angle) * pSpeed;
                   const size = Math.random() * 8 + 2;
                   const pObj: SimObject = {
                       id: crypto.randomUUID(), name: 'Particle', type: ObjectType.SPRITE,
                       x: obj.x + obj.width/2, y: obj.y + obj.height/2, width: size, height: size,
                       color: color, visible: true, opacity: 1, zIndex: 100, layerId: 'particle_layer',
                       rotation: Math.random() * 360, isObstacle: false, behaviors: [], events: [], variables: [],
                       vx: vx, vy: vy, isGrounded: false, isFollowing: false, isPointerDown: false, isPointerOver: false, isDragging: false,
                       downStartTime: 0, lastClickTime: 0, dragOffsetX: 0, dragOffsetY: 0,
                       animTimer: 0, frameIndex: 0, currentAnimId: null, animFinished: false, flipX: false, localVars: {},
                       isParticle: true, lifeTime: duration, maxLifeTime: duration
                   };
                   newObjectsQueueRef.current.push(pObj);
              }
          }
          if (action.type === 'PLAY_SOUND') {
              if (action.parameters.url) { const audio = new Audio(action.parameters.url); audio.play().catch(() => {}); }
          }
          if (action.type === 'SET_VELOCITY') {
              if (action.parameters.vx !== undefined) obj.vx = action.parameters.vx;
              if (action.parameters.vy !== undefined) obj.vy = action.parameters.vy;
          }
          if (action.type === 'STOP_MOVEMENT') { obj.vx = 0; obj.vy = 0; }
          if (action.type === 'SET_TEXT') obj.name = action.parameters.text;
          if (action.type === 'SET_COLOR') obj.color = action.parameters.color;
          if (action.type === 'APPLY_FORCE') { obj.vx = (obj.vx || 0) + (action.parameters.forceX || 0); obj.vy = (obj.vy || 0) + (action.parameters.forceY || 0); }
          if (action.type === 'ROTATE_TOWARD') {
              let targetX = 0; let targetY = 0;
              if (action.parameters.targetId === 'POINTER') { targetX = pointerPosRef.current.x + cameraRef.current.x; targetY = pointerPosRef.current.y + cameraRef.current.y; } 
              else { const target = allObjects.find(o => o.id === action.parameters.targetId); if (target) { targetX = target.x + target.width/2; targetY = target.y + target.height/2; } }
              const dx = targetX - (obj.x + obj.width/2); const dy = targetY - (obj.y + obj.height/2);
              obj.rotation = Math.atan2(dy, dx) * (180 / Math.PI);
          }
          if (action.type === 'CAMERA_SHAKE') { cameraRef.current.shakeIntensity = action.parameters.intensity; cameraRef.current.shakeTimer = action.parameters.duration; }
          if (action.type === 'SET_CAMERA_ZOOM') { cameraRef.current.targetZoom = action.parameters.zoom || 1; }
     });
  };

  // --- PHYSICS ENGINE ---

  const checkRectCollision = (r1: SimObject, r2: SimObject) => {
      return (
          r1.x < r2.x + r2.width &&
          r1.x + r1.width > r2.x &&
          r1.y < r2.y + r2.height &&
          r1.y + r1.height > r2.y
      );
  };

  const checkTilemapCollision = (obj: SimObject, tilemap: SimObject): boolean => {
      if (!tilemap.tilemap) return false;
      const ts = tilemap.tilemap.tileSize;
      
      // Calculate object bounds in grid coordinates (relative to tilemap position)
      const relX = obj.x - tilemap.x;
      const relY = obj.y - tilemap.y;
      
      const startGx = Math.floor(relX / ts);
      const endGx = Math.floor((relX + obj.width - 0.01) / ts);
      const startGy = Math.floor(relY / ts);
      const endGy = Math.floor((relY + obj.height - 0.01) / ts);

      for (let gy = startGy; gy <= endGy; gy++) {
          for (let gx = startGx; gx <= endGx; gx++) {
              const key = `${gx},${gy}`;
              const tile = tilemap.tilemap.tiles[key];
              if (tile) {
                  // If it's an object (new format), check solid property. If string (legacy), assume solid.
                  const isSolid = typeof tile === 'object' ? tile.solid : true;
                  if (isSolid) return true;
              }
          }
      }
      return false;
  };

  const animate = (time: number) => {
    const deltaTime = Math.min((time - previousTimeRef.current) / 1000, 0.1); 
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

    // 1. Process Interaction, Flash, Particles, Script
    currentObjects.forEach(obj => {
        const worldX = obj.isGui ? px : px + cameraRef.current.x;
        const worldY = obj.isGui ? py : py + cameraRef.current.y;
        obj.isPointerOver = (worldX >= obj.x && worldX <= obj.x + obj.width && worldY >= obj.y && worldY <= obj.y + obj.height);
        
        if (obj.flashTimer && obj.flashTimer > 0) {
            obj.flashTimer -= deltaTime;
            obj.opacity = (Math.floor(obj.flashTimer * 10) % 2 === 0) ? 0 : (obj.originalOpacity ?? 1);
            if (obj.flashTimer <= 0) obj.opacity = obj.originalOpacity ?? 1;
        }

        if (obj.isParticle) {
            obj.lifeTime = (obj.lifeTime || 0) - deltaTime;
            obj.x += obj.vx * deltaTime;
            obj.y += obj.vy * deltaTime;
            obj.opacity = Math.max(0, (obj.lifeTime / (obj.maxLifeTime || 1)));
            if (obj.lifeTime <= 0) obj.isMarkedForDestroy = true;
        }
        
        if (obj.updateFn && !obj.isMarkedForDestroy) {
            try { obj.updateFn(obj, deltaTime, currentInputs, globalsRef.current, console.log); } catch (e) { obj.updateFn = null; }
        }
    });

    // 2. Physics & Movement
    // Separate Solid Objects (Sprites) from Tilemaps for different collision logic
    const solidSprites = currentObjects.filter(o => o.isObstacle && o.type !== ObjectType.TILEMAP && o.visible);
    const tilemaps = currentObjects.filter(o => o.type === ObjectType.TILEMAP && o.visible);

    const nextObjects = currentObjects.map(obj => {
      if (obj.isParticle) return obj;
      if (!obj.behaviors || obj.behaviors.length === 0 || obj.localVars['__behavior_disabled']) return obj;
      
      let { x, y, vx, vy, isGrounded } = obj;
      
      obj.behaviors.forEach(b => {
          // --- TOP DOWN BEHAVIOR ---
          if (b.type === BehaviorType.TOPDOWN) {
             const s = b.properties.speed || 200;
             let mx = 0, my = 0;
             
             // Input Handling
             if (currentInputs.left) mx = -s; else if (currentInputs.right) mx = s;
             if (currentInputs.up) my = -s; else if (currentInputs.down) my = s;
             if (inputsRef.current.tiltX !== 0) mx = inputsRef.current.tiltX * s;
             if (inputsRef.current.tiltY !== 0) my = inputsRef.current.tiltY * s;
             
             // Friction / Acceleration
             if (mx !== 0) vx = mx; else vx *= 0.8;
             if (my !== 0) vy = my; else vy *= 0.8;
             if (Math.abs(vx) < 1) vx = 0;
             if (Math.abs(vy) < 1) vy = 0;

             // Move X
             const nextX = x + vx * deltaTime;
             const tempX = { ...obj, x: nextX, y };
             let colX = false;
             
             // Check Sprite Obstacles
             for (const obs of solidSprites) {
                 if (obj.id !== obs.id && checkRectCollision(tempX, obs)) { colX = true; break; }
             }
             // Check Tilemaps
             if (!colX) {
                 for (const tm of tilemaps) {
                     if (checkTilemapCollision(tempX, tm)) { colX = true; break; }
                 }
             }
             if (!colX) x = nextX;

             // Move Y
             const nextY = y + vy * deltaTime;
             const tempY = { ...obj, x, y: nextY };
             let colY = false;
             for (const obs of solidSprites) {
                 if (obj.id !== obs.id && checkRectCollision(tempY, obs)) { colY = true; break; }
             }
             if (!colY) {
                 for (const tm of tilemaps) {
                     if (checkTilemapCollision(tempY, tm)) { colY = true; break; }
                 }
             }
             if (!colY) y = nextY;
          }
          
          // --- PLATFORMER BEHAVIOR ---
          if (b.type === BehaviorType.PLATFORMER) {
            let g = b.properties.gravity || 1000;
            let j = b.properties.jumpForce || 500;
            let m = b.properties.maxSpeed || 200;

            // X Movement
            if (currentInputs.left) { vx = -m; obj.flipX = true; }
            else if (currentInputs.right) { vx = m; obj.flipX = false; }
            else { vx *= 0.8; if (Math.abs(vx) < 10) vx = 0; }
            
            if (Math.abs(inputsRef.current.tiltX) > 0.15) vx = inputsRef.current.tiltX * m;

            // Y Movement (Jump & Gravity)
            if ((currentInputs.up || currentInputs.action) && isGrounded) { vy = -j; isGrounded = false; }
            vy += g * deltaTime;
            
            // Apply X
            const nextX = x + vx * deltaTime;
            const tempX = { ...obj, x: nextX, y };
            let colX = false;
            
            for (const obs of solidSprites) {
                if (obj.id !== obs.id && checkRectCollision(tempX, obs)) { colX = true; break; }
            }
            if (!colX) {
                for (const tm of tilemaps) {
                    if (checkTilemapCollision(tempX, tm)) { colX = true; break; }
                }
            }
            if (!colX) x = nextX; // Apply movement only if no collision

            // Apply Y
            const nextY = y + vy * deltaTime;
            const tempY = { ...obj, x, y: nextY };
            let colY = false;
            
            // Check Sprite Collisions Y
            for (const obs of solidSprites) {
                if (obj.id !== obs.id && checkRectCollision(tempY, obs)) {
                    if (vy > 0) { y = obs.y - obj.height; isGrounded = true; vy = 0; }
                    else if (vy < 0) { y = obs.y + obs.height; vy = 0; }
                    colY = true; break;
                }
            }
            
            // Check Tilemap Collisions Y
            if (!colY) {
                for (const tm of tilemaps) {
                    if (checkTilemapCollision(tempY, tm)) {
                        // Snap to grid logic is complex, simpler approach for preview:
                        // Just stop movement. For floor (vy > 0), try to snap above.
                        if (vy > 0) {
                            // Find grid top
                            const ts = tm.tilemap!.tileSize;
                            // Approximate new Y to sit on tile
                            const footY = y + obj.height;
                            const tileY = Math.floor((footY + vy * deltaTime) / ts) * ts;
                            // Check if that actually fixes it? 
                            // Simple revert for now:
                            isGrounded = true; 
                            vy = 0;
                            // Minor correction to prevent sticking
                            y = Math.floor(y); 
                        } else {
                            vy = 0;
                        }
                        colY = true;
                        break;
                    }
                }
            }

            if (!colY) {
                y = nextY;
                isGrounded = false; // Falling
                if (y + obj.height >= canvasConfig.height) { y = canvasConfig.height - obj.height; vy = 0; isGrounded = true; } // Canvas Floor
            }
          }

          // --- PROJECTILE ---
          if (b.type === BehaviorType.PROJECTILE) {
              const s = b.properties.speed || 400;
              const angleRad = obj.rotation * (Math.PI / 180);
              vx = Math.cos(angleRad) * s;
              vy = Math.sin(angleRad) * s;
              x += vx * deltaTime;
              y += vy * deltaTime;
          }
      });
      return { ...obj, x, y, vx, vy, isGrounded };
    });

    // 3. Camera
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
    
    // Shake
    let shakeX = 0, shakeY = 0;
    if (cameraRef.current.shakeTimer > 0) {
        cameraRef.current.shakeTimer -= deltaTime;
        const mag = cameraRef.current.shakeIntensity;
        shakeX = (Math.random() - 0.5) * mag;
        shakeY = (Math.random() - 0.5) * mag;
    }
    setCameraPos({ x: cameraRef.current.x + shakeX, y: cameraRef.current.y + shakeY });

    // 4. Game Events
    nextObjects.forEach(obj => {
        if (!obj.events || obj.isParticle) return;
        obj.events.forEach(event => {
            let met = true;
            let collidedObject: SimObject | null = null;
            for (const cond of event.conditions) {
                if (cond.type === 'COLLISION') {
                   const targetId = cond.parameters.targetId;
                   const target = nextObjects.find(o => o.id === targetId);
                   if (target) {
                       if (checkRectCollision(obj, target)) collidedObject = target;
                       else { met = false; break; }
                   } else { met = false; break; }
                }
                // ... (Other conditions logic preserved) ...
                if (cond.type === 'TOUCH_INTERACTION') {
                    const type = cond.parameters.subtype;
                    if (type === 'CLICK' && !obj.localVars.__clicked) { met = false; break; }
                    if (type === 'DOUBLE_CLICK' && !obj.localVars.__doubleClicked) { met = false; break; }
                    if (type === 'DRAG' && !obj.isDragging) { met = false; break; }
                    if (type === 'HOVER' && !obj.isPointerOver) { met = false; break; }
                    if (type === 'LONG_PRESS') {
                        if (!obj.isPointerDown || (now - obj.downStartTime < (cond.parameters.duration || 0.5) * 1000)) { met = false; break; }
                    }
                }
                if (cond.type === 'EVERY_X_SECONDS') {
                    const interval = (cond.parameters.interval || 1) * 1000;
                    const lastTrigger = obj.localVars[`__timer_${event.id}`] || 0;
                    if (now - lastTrigger >= interval) obj.localVars[`__timer_${event.id}`] = now;
                    else { met = false; break; }
                }
                if (cond.type === 'DISTANCE_TO') {
                    const target = nextObjects.find(o => o.id === cond.parameters.targetId);
                    if (target) {
                        const dist = Math.sqrt(Math.pow(obj.x - target.x, 2) + Math.pow(obj.y - target.y, 2));
                        const threshold = cond.parameters.distance || 100;
                        if (cond.parameters.operator === 'LESS' && dist > threshold) { met = false; break; }
                        if (cond.parameters.operator === 'GREATER' && dist < threshold) { met = false; break; }
                    } else { met = false; break; }
                }
                if (cond.type === 'KEY_PRESSED') {
                    const k = cond.parameters.key;
                    let p = false;
                    if (k === 'Space') p = currentInputs.action;
                    else if (k === 'ArrowLeft') p = currentInputs.left;
                    else if (k === 'ArrowRight') p = currentInputs.right;
                    if (!p) { met = false; break; }
                }
                if (cond.type === 'IS_MOVING') { if (Math.sqrt(obj.vx*obj.vx + obj.vy*obj.vy) < 5) { met = false; break; } }
                if (cond.type === 'IS_VISIBLE') { if (!obj.visible || obj.opacity === 0) { met = false; break; } }
                if (cond.type === 'COMPARE_POSITION') {
                    const axis = cond.parameters.axis || 'X';
                    const val = obj[axis === 'X' ? 'x' : 'y'];
                    const t = cond.parameters.value || 0;
                    if (cond.parameters.operator === 'GREATER' && val <= t) { met = false; break; }
                    if (cond.parameters.operator === 'LESS' && val >= t) { met = false; break; }
                    if (cond.parameters.operator === 'EQUAL' && Math.abs(val - t) > 1) { met = false; break; }
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
                         const style: React.CSSProperties = {
                             position: 'absolute', left: obj.x, top: obj.y, width: obj.width, height: obj.height,
                             backgroundColor: (!isTilemap && obj.type !== ObjectType.TEXT) ? obj.color : 'transparent',
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
                         <div key={obj.id} style={{ position: 'absolute', left: obj.x, top: obj.y, width: obj.width, height: obj.height, backgroundColor: obj.color, display: obj.visible ? 'block' : 'none', opacity: obj.opacity }}>
                             {obj.type === ObjectType.TEXT && <div style={{ color: obj.color }} className="w-full h-full flex items-center justify-center">{obj.name}</div>}
                         </div>
                     ))}
                 </div>
             </div>
        </div>

        {/* --- MOVED UI INSIDE CONTAINER FOR FULLSCREEN SUPPORT --- */}
        <div className="absolute top-4 right-4 z-[110] flex space-x-2">
            <button onClick={toggleFullScreen} className="bg-black/40 hover:bg-gray-700/80 text-white p-3 rounded-full backdrop-blur transition-all"><Maximize className="w-6 h-6" /></button>
            <button onClick={onClose} className="bg-black/40 hover:bg-red-500/80 text-white p-3 rounded-full backdrop-blur transition-all"><X className="w-6 h-6" /></button>
        </div>
      
        {showControls && (
            <div className="absolute inset-0 pointer-events-none z-[110]">
                <div 
                    className="absolute pointer-events-auto rounded-full border-2 flex items-center justify-center select-none touch-none"
                    style={{
                        left: `${mobileConfig.joystickX}%`, top: `${mobileConfig.joystickY}%`,
                        width: `${mobileConfig.joystickSize}px`, height: `${mobileConfig.joystickSize}px`,
                        transform: 'translate(-50%, -50%)', opacity: mobileConfig.opacity,
                        borderColor: mobileConfig.color, backgroundColor: `${mobileConfig.color}20`,
                        userSelect: 'none', WebkitUserSelect: 'none'
                    }}
                >
                    <div className="absolute inset-0 grid grid-rows-3 grid-cols-3">
                        <div onPointerDown={() => setInputState('left', true)} onPointerUp={() => setInputState('left', false)} className="row-start-2 col-start-1"></div>
                        <div onPointerDown={() => setInputState('right', true)} onPointerUp={() => setInputState('right', false)} className="row-start-2 col-start-3"></div>
                        <div onPointerDown={() => setInputState('up', true)} onPointerUp={() => setInputState('up', false)} className="row-start-1 col-start-2"></div>
                        <div onPointerDown={() => setInputState('down', true)} onPointerUp={() => setInputState('down', false)} className="row-start-3 col-start-2"></div>
                    </div>
                    <div className="w-1/3 h-1/3 rounded-full bg-current" style={{color: mobileConfig.color}}></div>
                    <ArrowUp className="absolute top-2 w-6 h-6" style={{color: mobileConfig.color}} />
                    <ArrowDown className="absolute bottom-2 w-6 h-6" style={{color: mobileConfig.color}} />
                    <ArrowRight className="absolute left-2 w-6 h-6 rotate-180" style={{color: mobileConfig.color}} />
                    <ArrowRight className="absolute right-2 w-6 h-6" style={{color: mobileConfig.color}} />
                </div>
                <div 
                    className="absolute pointer-events-auto rounded-full border-2 flex items-center justify-center font-bold text-2xl select-none touch-none"
                    style={{
                        left: `${mobileConfig.buttonX}%`, top: `${mobileConfig.buttonY}%`,
                        width: `${mobileConfig.buttonSize}px`, height: `${mobileConfig.buttonSize}px`,
                        transform: 'translate(-50%, -50%)', opacity: mobileConfig.opacity,
                        borderColor: mobileConfig.color, color: mobileConfig.color, backgroundColor: `${mobileConfig.color}20`,
                        userSelect: 'none', WebkitUserSelect: 'none'
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
