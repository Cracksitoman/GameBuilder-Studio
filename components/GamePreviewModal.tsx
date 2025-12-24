import React, { useEffect, useRef, useState } from 'react';
import { GameObject, ObjectType, CanvasConfig, BehaviorType, AnimationClip, Variable, Scene } from '../types';
import { X, ArrowRight, ArrowUp, ArrowDown } from './Icons';

interface GamePreviewModalProps {
  objects: GameObject[]; 
  scenes: Scene[]; 
  initialSceneId: string; 
  isOpen: boolean;
  canvasConfig?: CanvasConfig;
  onClose: () => void;
  globalVariables?: Variable[]; 
}

// Extend GameObject for internal simulation state
interface SimObject extends GameObject {
  vx: number;
  vy: number;
  isGrounded: boolean;
  isFollowing: boolean; 
  currentAnimId: string | null;
  frameIndex: number;
  animTimer: number;
  flipX: boolean;
  isMarkedForDestroy?: boolean; 
  localVars: Record<string, any>; 
}

export const GamePreviewModal: React.FC<GamePreviewModalProps> = ({ 
  scenes, 
  initialSceneId,
  isOpen, 
  canvasConfig = { width: 800, height: 450, mode: 'LANDSCAPE' }, 
  onClose, 
  globalVariables = [] 
}) => {
  const [simObjects, setSimObjects] = useState<SimObject[]>([]);
  const [showControls, setShowControls] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [inputs, setInputs] = useState({ left: false, right: false, up: false, down: false, action: false });
  const inputsRef = useRef({ left: false, right: false, up: false, down: false, action: false });
  
  const requestRef = useRef<number>(0);
  const previousTimeRef = useRef<number>(0);
  const objectsRef = useRef<SimObject[]>([]); 
  
  // Scene Management Refs
  const nextSceneIdRef = useRef<string | null>(null);
  const currentSceneIdRef = useRef<string>(initialSceneId);

  // Runtime Global Variables State
  const globalsRef = useRef<Record<string, any>>({}); 

  const setInputState = (key: 'left' | 'right' | 'up' | 'down' | 'action', value: boolean) => {
    setInputs(prev => ({ ...prev, [key]: value }));
    inputsRef.current = { ...inputsRef.current, [key]: value };
  };

  // Full Screen Logic
  useEffect(() => {
    if (isOpen) {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch((err) => console.log("Fullscreen denied", err));
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch((err) => console.log("Exit Fullscreen error", err));
      }
    }
  }, [isOpen]);

  const loadScene = (sceneId: string) => {
      const scene = scenes.find(s => s.id === sceneId);
      if (!scene) return;

      // 2. Prepare Objects for this scene
      const initialSimObjects = scene.objects.map(obj => {
          const localsMap: Record<string, any> = {};
          (obj.variables || []).forEach(v => {
              localsMap[v.name] = v.value;
          });

          return {
            ...obj,
            vx: 0,
            vy: 0,
            isGrounded: false,
            isFollowing: false,
            currentAnimId: null,
            frameIndex: 0,
            animTimer: 0,
            flipX: false,
            localVars: localsMap
          };
      });

      setSimObjects(initialSimObjects);
      objectsRef.current = initialSimObjects;
      
      // 3. Check behaviors
      const hasPlatformer = scene.objects.some(obj => obj.behaviors?.some(b => b.type === BehaviorType.PLATFORMER));
      const hasTopDown = scene.objects.some(obj => obj.behaviors?.some(b => b.type === BehaviorType.TOPDOWN));
      setShowControls(hasPlatformer || hasTopDown);

      // 4. Reset Inputs (Optional, usually good to reset)
      inputsRef.current = { left: false, right: false, up: false, down: false, action: false };
      setInputs({ left: false, right: false, up: false, down: false, action: false });

      // 5. Run Start of Scene Events
      runStartEvents(initialSimObjects);
  };

  const initGame = () => {
      // 1. Initialize Globals Map (Only once on open)
      const globalsMap: Record<string, any> = {};
      globalVariables.forEach(v => {
          globalsMap[v.name] = v.value; 
      });
      globalsRef.current = globalsMap;
      
      currentSceneIdRef.current = initialSceneId;
      nextSceneIdRef.current = null;

      loadScene(initialSceneId);
  };

  // Run Events marked as 'START_OF_SCENE'
  const runStartEvents = (currentObjects: SimObject[]) => {
      currentObjects.forEach(obj => {
          if (!obj.events) return;

          obj.events.forEach(event => {
              const hasStartCondition = event.conditions.some(c => c.type === 'START_OF_SCENE');
              
              if (hasStartCondition) {
                  executeActions(obj, event.actions, null, currentObjects);
              }
          });
      });

      const survivors = currentObjects.filter(o => !o.isMarkedForDestroy);
      objectsRef.current = survivors;
      setSimObjects(survivors);
  };

  const executeActions = (obj: SimObject, actions: any[], collidedObject: SimObject | null, allObjects: SimObject[]) => {
     actions.forEach((action: any) => {
          if (action.type === 'DESTROY') {
              const targetParam = action.parameters.target; 
              if (targetParam === 'SELF') {
                  obj.isMarkedForDestroy = true;
              } else if (targetParam === 'OTHER' && collidedObject) {
                  collidedObject.isMarkedForDestroy = true;
              }
          }

          if (action.type === 'RESTART_SCENE') {
              nextSceneIdRef.current = currentSceneIdRef.current;
          }

          if (action.type === 'CHANGE_SCENE') {
              if (action.parameters.sceneId) {
                  nextSceneIdRef.current = action.parameters.sceneId;
              }
          }

          if (action.type === 'SET_VISIBLE') {
              obj.visible = action.parameters.visible;
          }

          if (action.type === 'MODIFY_VARIABLE') {
              const { source, varId, operation, value, targetObjectId } = action.parameters;
              const numericVal = parseFloat(value);
              
              let targetCollection: Record<string, any> | undefined;

              if (source === 'GLOBAL') {
                  targetCollection = globalsRef.current;
              } else if (source === 'LOCAL') {
                  targetCollection = obj.localVars;
              } else if (source === 'OBJECT' && targetObjectId) {
                  const targetObj = allObjects.find(o => o.id === targetObjectId);
                  if (targetObj) targetCollection = targetObj.localVars;
              }
              
              if (targetCollection) {
                   // Allow dynamic creation of variables if they don't exist
                   let currentVal = targetCollection[varId];
                   if (currentVal === undefined) currentVal = 0; 
                   
                   if (typeof currentVal === 'number' && !isNaN(numericVal)) {
                        if (operation === 'SET') currentVal = numericVal;
                        else if (operation === 'ADD') currentVal += numericVal;
                        else if (operation === 'SUBTRACT') currentVal -= numericVal;
                   } else {
                        // String or Boolean logic
                        if (operation === 'SET') {
                             if (value === 'true') currentVal = true;
                             else if (value === 'false') currentVal = false;
                             else currentVal = value;
                        }
                   }
                   targetCollection[varId] = currentVal;
              }
          }
      });
  };

  useEffect(() => {
    if (isOpen) {
      initGame();
      previousTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(requestRef.current);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.code) {
        case 'ArrowLeft': setInputState('left', true); break;
        case 'ArrowRight': setInputState('right', true); break;
        case 'ArrowUp': setInputState('up', true); break;
        case 'ArrowDown': setInputState('down', true); break;
        case 'Space': setInputState('action', true); break;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      switch(e.code) {
        case 'ArrowLeft': setInputState('left', false); break;
        case 'ArrowRight': setInputState('right', false); break;
        case 'ArrowUp': setInputState('up', false); break;
        case 'ArrowDown': setInputState('down', false); break;
        case 'Space': setInputState('action', false); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen]);

  const checkRectCollision = (x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) => {
      return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  };

  // Advanced Collision (Handles Tilemaps and standard objects)
  // requireSolid: If true, only detects Obstacles/Solid Tiles (For Physics)
  // requireSolid: If false, detects EVERYTHING (For Events like Bullets, Coins, etc.)
  const checkIntersection = (player: any, target: SimObject, requireSolid: boolean = false) => { 
      if (!target.visible) return false;

      // 1. Tilemap Collision
      if (target.type === ObjectType.TILEMAP && target.tilemap) {
          const tileSize = target.tilemap.tileSize || 32;
          
          // Optimization: Check tiles near the player
          const relX = player.x - target.x;
          const relY = player.y - target.y;
          
          const startGx = Math.floor(relX / tileSize);
          const endGx = Math.floor((relX + player.width) / tileSize);
          const startGy = Math.floor(relY / tileSize);
          const endGy = Math.floor((relY + player.height) / tileSize);

          for (let gx = startGx; gx <= endGx; gx++) {
              for (let gy = startGy; gy <= endGy; gy++) {
                  const key = `${gx},${gy}`;
                  const tile = target.tilemap.tiles[key];
                  
                  if (tile) {
                      // Determine if this tile is solid
                      let isSolid = target.isObstacle;
                      if (!isSolid && typeof tile === 'object') {
                          isSolid = tile.solid;
                      }

                      // LOGIC:
                      // If requireSolid is TRUE, we only match if tile isSolid.
                      // If requireSolid is FALSE, we match ANY tile (even water/background).
                      if (requireSolid && !isSolid) continue;

                      const tileX = target.x + gx * tileSize;
                      const tileY = target.y + gy * tileSize;
                      if (checkRectCollision(player.x, player.y, player.width, player.height, tileX, tileY, tileSize, tileSize)) {
                          return { x: tileX, y: tileY, width: tileSize, height: tileSize }; // Collision detected
                      }
                  }
              }
          }
          return false;
      }

      // 2. Standard Object Collision
      // LOGIC:
      // If requireSolid is TRUE, target MUST be an obstacle.
      // If requireSolid is FALSE, we ignore isObstacle and just check rect.
      if (requireSolid && !target.isObstacle) return false;

      if (checkRectCollision(player.x, player.y, player.width, player.height, target.x, target.y, target.width, target.height)) {
          return target; // Return target as truthy
      }

      return false;
  };

  const animate = (time: number) => {
    const deltaTime = Math.min((time - previousTimeRef.current) / 1000, 0.1); 
    previousTimeRef.current = time;

    if (nextSceneIdRef.current) {
        const nextId = nextSceneIdRef.current;
        nextSceneIdRef.current = null;
        currentSceneIdRef.current = nextId;
        loadScene(nextId);
        requestRef.current = requestAnimationFrame(animate);
        return;
    }

    const currentInputs = inputsRef.current;
    let currentObjects = [...objectsRef.current];
    // Filter potential obstacles (Sprites with isObstacle, OR Tilemaps)
    // We include ALL Tilemaps here because the checkIntersection logic handles the isObstacle check internally per tile
    const obstacles = currentObjects.filter(o => (o.isObstacle && o.type !== ObjectType.TILEMAP) || o.type === ObjectType.TILEMAP);

    // --- 1. PHYSICS LOOP ---
    const nextObjects = currentObjects.map(obj => {
      if (!obj.behaviors || obj.behaviors.length === 0) return obj;
      let { x, y, vx, vy, rotation, isGrounded, flipX } = obj;
      
      obj.behaviors.forEach(b => {
          if (b.type === BehaviorType.TOPDOWN) {
             const speed = b.properties.speed || 200;
             let moveX = 0; let moveY = 0;
             if (currentInputs.left) moveX = -speed;
             if (currentInputs.right) moveX = speed;
             if (currentInputs.up) moveY = -speed;
             if (currentInputs.down) moveY = speed;
             x += moveX * deltaTime;
             y += moveY * deltaTime;
          }
          if (b.type === BehaviorType.PLATFORMER) {
            let gravity = b.properties.gravity || 1000;
            let jumpForce = b.properties.jumpForce || 500;
            let maxSpeed = b.properties.maxSpeed || 200;
            vx = 0;
            if (currentInputs.left) vx = -maxSpeed;
            if (currentInputs.right) vx = maxSpeed;
            if ((currentInputs.up || currentInputs.action) && isGrounded) {
                vy = -jumpForce;
                isGrounded = false;
            }
            vy += gravity * deltaTime;
            
            // X Movement
            const nextX = x + vx * deltaTime;
            let collidedX = false;
            
            // FIX: Reduce height slightly for X checks to avoid friction with the floor (stuck bug)
            const tempObjX = { 
                ...obj, 
                x: nextX, 
                y, 
                height: Math.max(1, obj.height - 2) 
            };
            
            for (const obs of obstacles) {
                if (obj.id === obs.id) continue;
                // PHYSICS CHECK: REQUIRE SOLID = TRUE
                const collision = checkIntersection(tempObjX, obs, true);
                if (collision) {
                    collidedX = true;
                    break;
                }
            }
            if (!collidedX) x = nextX;

            // Y Movement
            const nextY = y + vy * deltaTime;
            let collidedY = false;
            const tempObjY = { ...obj, x, y: nextY };
            
            for (const obs of obstacles) {
                if (obj.id === obs.id) continue;
                // PHYSICS CHECK: REQUIRE SOLID = TRUE
                const collision = checkIntersection(tempObjY, obs, true);
                
                if (collision) {
                    // Resolve Collision
                    let obsY = obs.y; 
                    let obsH = obs.height;
                    
                    if (collision && !('id' in collision) && 'y' in collision) {
                        obsY = (collision as any).y;
                        obsH = (collision as any).height;
                    }

                    if (vy > 0) {
                        y = obsY - obj.height;
                        isGrounded = true;
                        vy = 0;
                    } else if (vy < 0) {
                        y = obsY + obsH;
                        vy = 0;
                    }
                    collidedY = true;
                    break;
                }
            }
            
            if (!collidedY) {
                if (nextY + obj.height >= canvasConfig.height) { // Canvas Floor as fallback
                    y = canvasConfig.height - obj.height; 
                    isGrounded = true; 
                    vy = 0; 
                } else {
                    y = nextY;
                    isGrounded = false;
                }
            }
          }
      });
      
      return { ...obj, x, y, vx, vy, rotation, isGrounded, flipX };
    });

    // --- 2. OBJECT-ORIENTED EVENT SYSTEM EXECUTION ---
    nextObjects.forEach(obj => {
        if (!obj.events || obj.events.length === 0) return;

        obj.events.forEach(event => {
            let conditionsMet = true;
            let collidedObject: SimObject | null = null; 

            for (const cond of event.conditions) {
                if (cond.type === 'START_OF_SCENE') continue; 

                if (cond.type === 'COLLISION') {
                    const targetId = cond.parameters.targetId;
                    const target = nextObjects.find(o => o.id === targetId);
                    
                    if (target) {
                        // EVENT CHECK: REQUIRE SOLID = FALSE (Trigger on anything)
                        if (checkIntersection(obj, target, false)) {
                            collidedObject = target;
                        } else {
                            conditionsMet = false;
                            break;
                        }
                    } else {
                        conditionsMet = false;
                        break;
                    }
                }

                if (cond.type === 'KEY_PRESSED') {
                    const key = cond.parameters.key;
                    let isPressed = false;
                    if (key === 'Space') isPressed = currentInputs.action;
                    else if (key === 'ArrowLeft') isPressed = currentInputs.left;
                    else if (key === 'ArrowRight') isPressed = currentInputs.right;
                    else if (key === 'ArrowUp') isPressed = currentInputs.up;
                    else if (key === 'ArrowDown') isPressed = currentInputs.down;
                    else if (key === 'Enter') isPressed = currentInputs.action; 
                    
                    if (!isPressed) {
                        conditionsMet = false;
                        break;
                    }
                }

                if (cond.type === 'COMPARE_VARIABLE') {
                     const { source, varId, operator, value, targetObjectId } = cond.parameters;
                     
                     let targetCollection: Record<string, any> | undefined;

                     if (source === 'GLOBAL') {
                         targetCollection = globalsRef.current;
                     } else if (source === 'LOCAL') {
                         targetCollection = obj.localVars;
                     } else if (source === 'OBJECT' && targetObjectId) {
                         const targetObj = nextObjects.find(o => o.id === targetObjectId);
                         if (targetObj) targetCollection = targetObj.localVars;
                     }

                     if (!targetCollection) { conditionsMet = false; break; }

                     let currentVal = targetCollection[varId];
                     if (currentVal === undefined) currentVal = 0; 

                     let compareVal: any = value;
                     if (!isNaN(parseFloat(value))) compareVal = parseFloat(value);
                     if (value === 'true') compareVal = true;
                     if (value === 'false') compareVal = false;

                     let passed = false;
                     if (operator === 'EQUAL') passed = currentVal == compareVal;
                     else if (operator === 'NOT_EQUAL') passed = currentVal != compareVal;
                     else if (operator === 'GREATER') passed = currentVal > compareVal;
                     else if (operator === 'LESS') passed = currentVal < compareVal;
                     else if (operator === 'GREATER_EQUAL') passed = currentVal >= compareVal;
                     else if (operator === 'LESS_EQUAL') passed = currentVal <= compareVal;

                     if (!passed) {
                         conditionsMet = false;
                         break;
                     }
                }
            }

            if (conditionsMet && event.actions.length > 0) {
                executeActions(obj, event.actions, collidedObject, nextObjects);
            }
        });
    });

    const finalObjects = nextObjects.filter(o => !o.isMarkedForDestroy);

    if (nextSceneIdRef.current) {
         // Loop will handle switch
    } else {
        objectsRef.current = finalObjects;
        setSimObjects(finalObjects);
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  const getRenderInfo = (obj: SimObject) => {
      if (obj.previewSpriteUrl && !obj.behaviors?.some(b => b.type === BehaviorType.ANIMATION)) return obj.previewSpriteUrl;
      const animBehavior = obj.behaviors?.find(b => b.type === BehaviorType.ANIMATION);
      if (!animBehavior || !obj.currentAnimId) return obj.previewSpriteUrl || null;
      const animations = animBehavior.properties.animations as AnimationClip[];
      const clip = animations.find(a => a.id === obj.currentAnimId);
      if (!clip || clip.frames.length === 0) return obj.previewSpriteUrl || null;
      const frame = clip.frames[obj.frameIndex];
      return frame ? frame.imageUrl : null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden touch-none">
      
      {/* Game Scaled Container */}
      <div 
         ref={containerRef}
         className="relative bg-gray-900 shadow-2xl"
         style={{ 
             aspectRatio: `${canvasConfig.width}/${canvasConfig.height}`,
             width: '100%',
             height: '100%',
             maxHeight: '100vh',
             maxWidth: '100vw',
             objectFit: 'contain'
         }}
      >
        <div className="absolute inset-0 w-full h-full">
            <div className="absolute inset-0 bg-gray-900" style={{backgroundColor: '#111827'}}></div>
            <div className="absolute inset-0 w-full h-full relative overflow-hidden">
                 <div 
                    style={{
                       position: 'absolute',
                       left: '50%',
                       top: '50%',
                       width: `${canvasConfig.width}px`,
                       height: `${canvasConfig.height}px`,
                       transform: `translate(-50%, -50%) scale(${Math.min(
                         (containerRef.current?.clientWidth || window.innerWidth) / canvasConfig.width,
                         (containerRef.current?.clientHeight || window.innerHeight) / canvasConfig.height
                       )})`,
                       transformOrigin: 'center center'
                    }}
                 >
                     {simObjects.map(obj => {
                        const imgUrl = getRenderInfo(obj);
                        const isTilemap = obj.type === ObjectType.TILEMAP;
                        
                        let displayText = obj.name;
                        if (obj.type === ObjectType.TEXT && obj.textBinding) {
                            const { source, variableId, targetObjectId, prefix = '', suffix = '' } = obj.textBinding;
                            let val: any;

                            if (source === 'GLOBAL') {
                                val = globalsRef.current[variableId];
                            } else if (source === 'LOCAL') {
                                val = obj.localVars[variableId];
                            } else if (source === 'OBJECT' && targetObjectId) {
                                const targetObj = simObjects.find(o => o.id === targetObjectId);
                                if (targetObj) {
                                    val = targetObj.localVars[variableId];
                                }
                            }

                            if (val !== undefined) {
                                displayText = `${prefix}${val}${suffix}`;
                            }
                        }

                        return (
                            <div
                            key={obj.id}
                            style={{
                                position: 'absolute',
                                left: `${obj.x}px`,
                                top: `${obj.y}px`,
                                width: `${obj.width}px`,
                                height: `${obj.height}px`,
                                transform: `rotate(${obj.rotation}deg) scaleX(${obj.flipX ? -1 : 1})`,
                                zIndex: obj.zIndex,
                                opacity: obj.opacity,
                                backgroundColor: (!imgUrl && obj.type !== ObjectType.TEXT && !isTilemap) ? obj.color : undefined,
                                imageRendering: 'pixelated',
                                display: obj.visible ? 'block' : 'none',
                                backgroundSize: 'contain',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'center',
                                backgroundImage: (!isTilemap && imgUrl) ? `url(${imgUrl})` : undefined
                            }}
                            >
                            {obj.type === ObjectType.TEXT ? (
                                <div style={{color: obj.color, transform: `scaleX(${obj.flipX ? -1 : 1})`}} className="w-full h-full flex items-center justify-center font-sans whitespace-nowrap">
                                {displayText}
                                </div>
                            ) : isTilemap ? (
                                // RUNTIME TILEMAP RENDERER
                                <div className="w-full h-full relative">
                                    {obj.tilemap && Object.entries(obj.tilemap.tiles).map(([key, data]) => {
                                        const [gx, gy] = key.split(',').map(Number);
                                        const tileSize = obj.tilemap?.tileSize || 32;
                                        // Handle legacy string vs new object
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
                                                    backgroundRepeat: 'no-repeat'
                                                }}
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                !imgUrl && (
                                    <div className="w-full h-full flex items-center justify-center">
                                        {(obj.type === ObjectType.PLAYER || obj.type === ObjectType.ENEMY) && (
                                            <span className="text-white text-[10px] font-bold opacity-80">{obj.type[0]}</span>
                                        )}
                                    </div>
                                )
                            )}
                            </div>
                        );
                     })}
                 </div>
            </div>
        </div>
      </div>

      {/* Floating UI Layer */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 sm:p-6 z-[110]">
         <div className="flex justify-between items-start pointer-events-auto">
             <div className="bg-black/50 text-white p-2 rounded text-[10px] font-mono backdrop-blur pointer-events-none opacity-50 hover:opacity-100 transition-opacity">
                 {Object.entries(globalsRef.current).map(([key, val]) => (
                     <div key={key}>{key}: {String(val)}</div>
                 ))}
             </div>

            <button 
               onClick={onClose}
               className="bg-black/40 hover:bg-red-500/80 text-white/70 hover:text-white p-3 rounded-full backdrop-blur transition-all"
            >
               <X className="w-6 h-6" />
            </button>
         </div>

         {showControls && (
             <div className="w-full max-w-5xl mx-auto flex justify-between items-end pb-4 sm:pb-8">
                {/* Controls */}
                <div className="pointer-events-auto relative w-40 h-40 sm:w-48 sm:h-48">
                   <div className="absolute inset-0 bg-white/5 rounded-full backdrop-blur-[2px]"></div>
                   <button className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1/2 flex pt-2 justify-center active:bg-white/20 rounded-t-lg ${inputs.up ? 'bg-white/20' : ''}`} onPointerDown={() => setInputState('up', true)} onPointerUp={() => setInputState('up', false)} onPointerLeave={() => setInputState('up', false)}><ArrowUp className="w-8 h-8 text-white/80" /></button>
                   <button className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-1/2 flex pb-2 items-end justify-center active:bg-white/20 rounded-b-lg ${inputs.down ? 'bg-white/20' : ''}`} onPointerDown={() => setInputState('down', true)} onPointerUp={() => setInputState('down', false)} onPointerLeave={() => setInputState('down', false)}><ArrowDown className="w-8 h-8 text-white/80" /></button>
                   <button className={`absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-1/3 flex pl-2 items-center justify-start active:bg-white/20 rounded-l-lg ${inputs.left ? 'bg-white/20' : ''}`} onPointerDown={() => setInputState('left', true)} onPointerUp={() => setInputState('left', false)} onPointerLeave={() => setInputState('left', false)}><ArrowRight className="w-8 h-8 text-white/80 rotate-180" /></button>
                   <button className={`absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-1/3 flex pr-2 items-center justify-end active:bg-white/20 rounded-r-lg ${inputs.right ? 'bg-white/20' : ''}`} onPointerDown={() => setInputState('right', true)} onPointerUp={() => setInputState('right', false)} onPointerLeave={() => setInputState('right', false)}><ArrowRight className="w-8 h-8 text-white/80" /></button>
                </div>
                <div className="pointer-events-auto">
                   <button className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-red-500/40 backdrop-blur border-4 border-red-500/20 flex items-center justify-center active:bg-red-500/60 active:scale-95 transition-all shadow-lg ${inputs.action ? 'bg-red-500/60 scale-95' : ''}`} onPointerDown={() => setInputState('action', true)} onPointerUp={() => setInputState('action', false)} onPointerLeave={() => setInputState('action', false)}><div className="text-white/90 font-black text-lg sm:text-xl uppercase tracking-widest">A</div></button>
                </div>
             </div>
         )}
      </div>
    </div>
  );
}