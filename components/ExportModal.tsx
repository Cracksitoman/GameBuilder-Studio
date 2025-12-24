import React from 'react';
import { X, FileJson, Globe, Smartphone, Download, Share2 } from './Icons';
import { GameObject, Layer, CanvasConfig, Asset } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameData: {
    objects: GameObject[];
    layers: Layer[];
    canvasConfig: CanvasConfig;
    assets: Asset[]; // Add assets to export interface
  };
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, gameData }) => {
  if (!isOpen) return null;

  // 1. Export as JSON/GBS (Project File)
  const handleExportJSON = () => {
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(gameData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "proyecto_gamebuilder.gbs");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // 2. Export as HTML5 (Playable File with Engine)
  const handleExportHTML = () => {
    
    // NOTE: For HTML5 export, we don't strictly need the asset list separately, 
    // as the objects contain the base64 URLs in their animation frames or previewUrls.
    // However, to be cleaner, we can keep the logic focusing on objects.
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>Mi Juego - GameBuilder</title>
    <style>
        * { box-sizing: border-box; }
        body { 
            margin: 0; 
            background: #000; 
            overflow: hidden; 
            width: 100vw;
            height: 100vh;
            color: white; 
            font-family: system-ui, -apple-system, sans-serif; 
            touch-action: none; 
            user-select: none;
            -webkit-user-select: none;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        #game-wrapper {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        #stage-area {
            position: relative;
            box-shadow: 0 0 50px rgba(0,0,0,0.5);
            background: #111827;
            overflow: hidden;
            transform-origin: center center;
        }

        .obj { 
            position: absolute; 
            will-change: transform, left, top;
            display: flex;
            align-items: center;
            justify-content: center;
            image-rendering: pixelated;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
        }
        
        .debug-text {
            font-size: 10px;
            font-weight: bold;
            opacity: 0.8;
            pointer-events: none;
        }

        /* OVERLAYS */
        .overlay {
            position: fixed;
            inset: 0;
            background: #000;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 20px;
            transition: opacity 0.5s;
        }
        
        .overlay h1 { font-size: 24px; margin-bottom: 20px; color: #fff; }
        
        .start-btn {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            border: none;
            padding: 15px 40px;
            color: white;
            font-size: 18px;
            font-weight: bold;
            border-radius: 50px;
            cursor: pointer;
            box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.5);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }

        #rotate-msg {
            background: #111;
            z-index: 10000;
            display: none; /* Hidden by default */
        }
        
        .rotate-icon {
            font-size: 48px;
            margin-bottom: 20px;
            animation: rotate 2s infinite ease-in-out;
            display: inline-block;
        }

        @keyframes rotate {
            0% { transform: rotate(0deg); }
            25% { transform: rotate(-90deg); }
            75% { transform: rotate(-90deg); }
            100% { transform: rotate(0deg); }
        }

        /* CONTROLS UI */
        #ui-layer {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 100;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            padding: 20px;
        }
        .controls-container {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            width: 100%;
            height: 100%;
            pointer-events: auto;
            padding-bottom: 20px;
        }
        .dpad {
            position: relative;
            width: 160px;
            height: 160px;
            margin-bottom: 10px;
        }
        .dpad-bg {
             position: absolute;
             inset: 0;
             background: rgba(255,255,255,0.05);
             border-radius: 50%;
             backdrop-filter: blur(2px);
        }
        .dpad-btn {
            position: absolute;
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(4px);
            border: none;
            outline: none;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255,255,255,0.8);
            cursor: pointer;
            touch-action: none;
            transition: background 0.1s;
        }
        .dpad-btn:active, .dpad-btn.active { background: rgba(255,255,255,0.3); }
        
        .btn-up { top: 0; left: 33.33%; width: 33.33%; height: 45%; border-radius: 8px 8px 0 0; }
        .btn-down { bottom: 0; left: 33.33%; width: 33.33%; height: 45%; border-radius: 0 0 8px 8px; }
        .btn-left { left: 0; top: 33.33%; width: 45%; height: 33.33%; border-radius: 8px 0 0 8px; }
        .btn-right { right: 0; top: 33.33%; width: 45%; height: 33.33%; border-radius: 0 8px 8px 0; }
        
        .action-area {
            display: flex;
            align-items: flex-end;
            padding-bottom: 20px;
            padding-right: 20px;
        }

        .action-btn {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            background: rgba(239, 68, 68, 0.4);
            border: 4px solid rgba(239, 68, 68, 0.2);
            backdrop-filter: blur(4px);
            color: white;
            font-weight: 900;
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            touch-action: none;
            transition: transform 0.1s;
        }
        .action-btn:active, .action-btn.active { transform: scale(0.95); background: rgba(239, 68, 68, 0.6); }

        .hidden { display: none !important; }
        .icon-arrow { font-size: 24px; font-weight: bold; }
    </style>
</head>
<body>
    <!-- START SCREEN (Needed for Fullscreen API trigger) -->
    <div id="start-screen" class="overlay">
        <h1>Mi Juego</h1>
        <button class="start-btn" id="start-btn">JUGAR AHORA</button>
        <p style="margin-top:20px; font-size: 12px; opacity: 0.6">Toca para iniciar en pantalla completa</p>
    </div>

    <!-- ROTATION WARNING -->
    <div id="rotate-msg" class="overlay">
        <div class="rotate-icon">📱</div>
        <h2>Por favor, gira tu dispositivo</h2>
        <p>Este juego está diseñado para jugarse en modo <span id="req-mode"></span>.</p>
    </div>

    <!-- GAME CONTAINER -->
    <div id="game-wrapper">
        <div id="stage-area"></div>
    </div>

    <!-- CONTROLS -->
    <div id="ui-layer" class="hidden">
        <div class="controls-container">
            <div class="dpad">
                <div class="dpad-bg"></div>
                <div class="dpad-btn btn-up" data-key="up"><span class="icon-arrow">↑</span></div>
                <div class="dpad-btn btn-down" data-key="down"><span class="icon-arrow">↓</span></div>
                <div class="dpad-btn btn-left" data-key="left"><span class="icon-arrow">←</span></div>
                <div class="dpad-btn btn-right" data-key="right"><span class="icon-arrow">→</span></div>
            </div>
            <div class="action-area">
                <div class="action-btn" data-key="action">A</div>
            </div>
        </div>
    </div>

    <script>
        // --- GAME DATA INJECTION ---
        // We only export objects, layers and config to the runtime.
        // Assets are implicitly embedded in the object sprite URLs.
        const gameData = {
           objects: ${JSON.stringify(gameData.objects)},
           canvasConfig: ${JSON.stringify(gameData.canvasConfig)}
        };
        
        // --- VARIABLES ---
        const container = document.getElementById('stage-area');
        const uiLayer = document.getElementById('ui-layer');
        const startScreen = document.getElementById('start-screen');
        const rotateMsg = document.getElementById('rotate-msg');
        const startBtn = document.getElementById('start-btn');
        const reqModeText = document.getElementById('req-mode');
        
        const { width, height, mode } = gameData.canvasConfig;
        const requiredMode = mode; // 'LANDSCAPE' or 'PORTRAIT'
        
        reqModeText.innerText = requiredMode === 'LANDSCAPE' ? 'Horizontal' : 'Vertical';

        // Prepare simulation objects
        let objects = JSON.parse(JSON.stringify(gameData.objects)).map(o => ({
            ...o, 
            vx: 0, 
            vy: 0, 
            isGrounded: false,
            isFollowing: false,
            // Anim State
            currentAnimId: null,
            frameIndex: 0,
            animTimer: 0,
            flipX: false
        }));
        
        const inputs = { left: false, right: false, up: false, down: false, action: false };
        let lastTime = performance.now();
        const objectElements = {}; 
        let isGameRunning = false;

        // --- FULLSCREEN & ORIENTATION LOGIC ---
        
        function checkOrientation() {
            const w = window.innerWidth;
            const h = window.innerHeight;
            const isLandscape = w > h;
            const isMobile = /Mobi|Android/i.test(navigator.userAgent);
            
            if (isMobile) {
                if (requiredMode === 'LANDSCAPE' && !isLandscape) {
                    rotateMsg.style.display = 'flex';
                    document.querySelector('.rotate-icon').style.transform = 'rotate(90deg)';
                } else if (requiredMode === 'PORTRAIT' && isLandscape) {
                    rotateMsg.style.display = 'flex';
                    document.querySelector('.rotate-icon').style.transform = 'rotate(0deg)';
                } else {
                    rotateMsg.style.display = 'none';
                }
            }
            resize();
        }

        async function enterFullScreen() {
            const docEl = document.documentElement;
            try {
                if (docEl.requestFullscreen) await docEl.requestFullscreen();
                else if (docEl.webkitRequestFullscreen) await docEl.webkitRequestFullscreen();
                else if (docEl.msRequestFullscreen) await docEl.msRequestFullscreen();
            } catch(e) { console.log("Fullscreen not allowed", e); }

            try {
                if (screen.orientation && screen.orientation.lock) {
                    const lockType = requiredMode === 'LANDSCAPE' ? 'landscape' : 'portrait';
                    await screen.orientation.lock(lockType);
                }
            } catch(e) { console.log("Orientation lock not supported", e); }
        }

        startBtn.addEventListener('click', () => {
            enterFullScreen();
            startScreen.style.opacity = '0';
            setTimeout(() => {
                startScreen.style.display = 'none';
                if (!isGameRunning) {
                    init();
                    isGameRunning = true;
                }
                checkOrientation(); 
            }, 500);
        });

        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', () => {
            setTimeout(checkOrientation, 200);
        });

        // --- GAME ENGINE ---

        function init() {
            container.style.width = width + 'px';
            container.style.height = height + 'px';
            
            // Create DOM Elements
            objects.forEach(obj => {
                const el = document.createElement('div');
                el.className = 'obj';
                el.style.width = obj.width + 'px';
                el.style.height = obj.height + 'px';
                el.style.backgroundColor = obj.type !== 'TEXT' ? obj.color : 'transparent';
                el.style.zIndex = obj.zIndex;
                el.style.opacity = obj.opacity;
                
                if (obj.type === 'TEXT') {
                    el.innerText = obj.name;
                    el.style.color = obj.color;
                    el.style.whiteSpace = 'nowrap';
                } else if (obj.type === 'PLAYER' || obj.type === 'ENEMY') {
                     // Add placeholder if no animation logic overwrites it later
                     const span = document.createElement('span');
                     span.className = 'debug-text';
                     span.style.color = 'white';
                     span.innerText = obj.type[0];
                     // span.style.display = 'none'; // Will hide if anim active
                     el.appendChild(span);
                }

                if (!obj.visible) el.style.display = 'none';

                container.appendChild(el);
                objectElements[obj.id] = el;
            });

            // Setup Controls
            const hasPlatformer = objects.some(obj => obj.behaviors?.some(b => b.type === 'PLATFORMER'));
            const hasTopDown = objects.some(obj => obj.behaviors?.some(b => b.type === 'TOPDOWN'));
            
            if (hasPlatformer || hasTopDown) {
                uiLayer.classList.remove('hidden');
                setupInputListeners();
            }

            requestAnimationFrame(loop);
        }

        function resize() {
            const winW = window.innerWidth;
            const winH = window.innerHeight;
            const scale = Math.min(winW / width, winH / height);
            container.style.transform = 'scale(' + scale + ')';
        }

        function setupInputListeners() {
            // Keyboard
            window.addEventListener('keydown', (e) => {
                if(e.code === 'ArrowLeft') inputs.left = true;
                if(e.code === 'ArrowRight') inputs.right = true;
                if(e.code === 'ArrowUp') inputs.up = true;
                if(e.code === 'ArrowDown') inputs.down = true;
                if(e.code === 'Space') inputs.action = true;
            });
            window.addEventListener('keyup', (e) => {
                if(e.code === 'ArrowLeft') inputs.left = false;
                if(e.code === 'ArrowRight') inputs.right = false;
                if(e.code === 'ArrowUp') inputs.up = false;
                if(e.code === 'ArrowDown') inputs.down = false;
                if(e.code === 'Space') inputs.action = false;
            });

            // Touch UI
            const btns = document.querySelectorAll('[data-key]');
            btns.forEach(btn => {
                const key = btn.getAttribute('data-key');
                const activate = (e) => {
                   if(e.cancelable) e.preventDefault();
                   inputs[key] = true; 
                   btn.classList.add('active'); 
                };
                const deactivate = (e) => {
                   if(e.cancelable) e.preventDefault();
                   inputs[key] = false; 
                   btn.classList.remove('active'); 
                };
                btn.addEventListener('pointerdown', activate);
                btn.addEventListener('pointerup', deactivate);
                btn.addEventListener('pointerleave', deactivate);
                btn.addEventListener('touchstart', activate, {passive: false});
                btn.addEventListener('touchend', deactivate, {passive: false});
            });
        }

        function checkCollision(rect1, rect2) {
             return (
                rect1.x < rect2.x + rect2.width &&
                rect1.x + rect1.width > rect2.x &&
                rect1.y < rect2.y + rect2.height &&
                rect1.y + rect1.height > rect2.y
            );
        }

        function loop(timestamp) {
            const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
            lastTime = timestamp;

            const obstacles = objects.filter(o => o.isObstacle && o.visible);
            const playerObj = objects.find(o => o.type === 'PLAYER');

            objects.forEach(obj => {
                if (!obj.behaviors || obj.behaviors.length === 0) return;
                
                let { x, y, vx, vy, rotation, isGrounded } = obj;
                let isFollowing = obj.isFollowing; // LOCAL STATE

                obj.behaviors.forEach(b => {
                    if (b.type === 'ROTATE') rotation += (b.properties.speed || 0) * deltaTime;
                    
                    if (b.type === 'PROJECTILE') {
                        const speed = b.properties.speed || 400;
                        const angleDeg = b.properties.angle || 0;
                        const angleRad = angleDeg * (Math.PI / 180);
                        x += Math.cos(angleRad) * speed * deltaTime;
                        y += Math.sin(angleRad) * speed * deltaTime;
                    }
                    
                    if (b.type === 'FOLLOW') {
                        let target = null;
                        if (b.properties.targetId) {
                            target = objects.find(o => o.id === b.properties.targetId);
                        }
                        if (!target) target = playerObj;

                        if (target) {
                            const speed = b.properties.speed || 100;
                            const stopDist = b.properties.stopDistance || 5;
                            const detectRange = b.properties.detectionRange || 300;
                            const releaseRange = b.properties.releaseRange || 500;
                            const mode = b.properties.movementType || 'TOPDOWN';
                            
                            const dx = target.x - x;
                            const dy = target.y - y;
                            const dist = Math.sqrt(dx*dx + dy*dy);
                            
                            if (isFollowing) {
                                if (dist > releaseRange) isFollowing = false;
                            } else {
                                if (dist < detectRange) isFollowing = true;
                            }
                            
                            if (mode === 'PLATFORMER') {
                                const gravity = b.properties.gravity || 1000;
                                const jumpForce = b.properties.jumpForce || 500;
                                
                                if (isFollowing) {
                                    vx = 0;
                                    if (Math.abs(dx) > stopDist) {
                                        vx = (dx > 0 ? 1 : -1) * speed;
                                    }

                                    // Check if we hit a wall to jump
                                    const nextX = x + vx * deltaTime;
                                    let hitWall = false;
                                    const tempObjX = { ...obj, x: nextX, y }; 
                                    for (const obs of obstacles) {
                                        if (obj.id === obs.id) continue;
                                        if (checkCollision(tempObjX, obs)) { hitWall = true; break; }
                                    }

                                    if (isGrounded) {
                                        if (hitWall || (target.y < y - 50 && Math.abs(dx) < 100)) {
                                            vy = -jumpForce;
                                            isGrounded = false;
                                        }
                                    }
                                } else {
                                    vx = 0; // Stop horizontal movement
                                }
                                
                                // Always apply gravity
                                if (!isGrounded) vy += gravity * deltaTime;

                            } else {
                                // TOP DOWN
                                if (isFollowing) {
                                    if (dist > stopDist) {
                                        const moveX = (dx / dist) * speed;
                                        const moveY = (dy / dist) * speed;

                                        const nextX = x + moveX * deltaTime;
                                        let hitX = false;
                                        const tempObjX = { ...obj, x: nextX, y }; 
                                        for (const obs of obstacles) {
                                            if (obj.id === obs.id) continue;
                                            if (checkCollision(tempObjX, obs)) { hitX = true; break; }
                                        }
                                        if (!hitX) x = nextX;

                                        const nextY = y + moveY * deltaTime;
                                        let hitY = false;
                                        const tempObjY = { ...obj, x, y: nextY }; 
                                        for (const obs of obstacles) {
                                            if (obj.id === obs.id) continue;
                                            if (checkCollision(tempObjY, obs)) { hitY = true; break; }
                                        }
                                        if (!hitY) y = nextY;
                                    }
                                }
                            }
                        }
                    }
                    
                    if (b.type === 'TOPDOWN') {
                         const speed = b.properties.speed || 200;
                         let moveX = 0; let moveY = 0;
                         if (inputs.left) moveX = -speed;
                         if (inputs.right) moveX = speed;
                         if (inputs.up) moveY = -speed;
                         if (inputs.down) moveY = speed;

                         const nextX = x + moveX * deltaTime;
                         const tempObjX = { ...obj, x: nextX, y }; 
                         let collidedX = false;
                         for (const obs of obstacles) {
                           if (obj.id === obs.id) continue;
                           if (checkCollision(tempObjX, obs)) { collidedX = true; break; }
                         }
                         if (!collidedX) x = nextX;

                         const nextY = y + moveY * deltaTime;
                         const tempObjY = { ...obj, x, y: nextY }; 
                         let collidedY = false;
                         for (const obs of obstacles) {
                           if (obj.id === obs.id) continue;
                           if (checkCollision(tempObjY, obs)) { collidedY = true; break; }
                         }
                         if (!collidedY) y = nextY;
                    }
                    
                    // PLATFORMER PHYSICS RESOLUTION (shared by Player and AI in platform mode)
                    if (b.type === 'PLATFORMER' || (b.type === 'FOLLOW' && b.properties.movementType === 'PLATFORMER')) {
                        let gravity = b.properties.gravity || 1000;
                        let jumpForce = b.properties.jumpForce || 500;
                        let maxSpeed = b.properties.maxSpeed || b.properties.speed || 200;

                        // Player Input override
                        if (b.type === 'PLATFORMER') {
                            vx = 0;
                            if (inputs.left) vx = -maxSpeed;
                            if (inputs.right) vx = maxSpeed;
                            if ((inputs.up || inputs.action) && isGrounded) {
                                vy = -jumpForce;
                                isGrounded = false;
                            }
                            vy += gravity * deltaTime;
                        }
                        
                        const nextX = x + vx * deltaTime;
                        let collidedX = false;
                        const tempObjX = { ...obj, x: nextX, y };
                        for (const obs of obstacles) {
                            if (obj.id === obs.id) continue;
                            if (checkCollision(tempObjX, obs)) { collidedX = true; break; }
                        }
                        if (!collidedX) x = nextX;

                        const nextY = y + vy * deltaTime;
                        let collidedY = false;
                        const tempObjY = { ...obj, x, y: nextY };
                        for (const obs of obstacles) {
                            if (obj.id === obs.id) continue;
                            if (checkCollision(tempObjY, obs)) {
                                if (vy > 0) {
                                    y = obs.y - obj.height;
                                    isGrounded = true;
                                    vy = 0;
                                } else if (vy < 0) {
                                    y = obs.y + obs.height;
                                    vy = 0;
                                }
                                collidedY = true;
                                break;
                            }
                        }
                        
                        if (!collidedY) {
                            if (nextY + obj.height >= height) {
                                y = height - obj.height;
                                vy = 0;
                                isGrounded = true;
                            } else {
                                y = nextY;
                                isGrounded = false;
                            }
                        }
                    }
                });

                // Update Internal State
                obj.x = x; obj.y = y; obj.vx = vx; obj.vy = vy; obj.rotation = rotation; obj.isGrounded = isGrounded;
                obj.isFollowing = isFollowing; // UPDATE PERSISTENT STATE

                // --- ANIMATION UPDATE ---
                if (vx > 0.1) obj.flipX = false;
                if (vx < -0.1) obj.flipX = true;

                const animBehavior = obj.behaviors.find(b => b.type === 'ANIMATION');
                if (animBehavior && animBehavior.properties.animations) {
                    const animations = animBehavior.properties.animations;
                    
                    // State Machine for Anim Name
                    let targetName = "Idle";
                    if (!isGrounded && vy !== 0) {
                        targetName = "Jump";
                    } else if (Math.abs(vx) > 10 || Math.abs(vy) > 10 && isGrounded) {
                        targetName = "Run";
                    }

                    // Find Clip
                    let clip = animations.find(a => a.name === targetName);
                    if (!clip && targetName === 'Jump') clip = animations.find(a => a.name === 'Idle');
                    if (!clip) clip = animations[0];

                    if (clip) {
                        // Switch Logic
                        if (obj.currentAnimId !== clip.id) {
                            obj.currentAnimId = clip.id;
                            obj.frameIndex = 0;
                            obj.animTimer = 0;
                        }
                        
                        // Frame Advance
                        if (clip.frames.length > 0) {
                            obj.animTimer += deltaTime;
                            if (obj.animTimer >= (1 / (clip.fps || 1))) {
                                obj.animTimer = 0;
                                if (obj.frameIndex < clip.frames.length - 1) {
                                    obj.frameIndex++;
                                } else if (clip.loop) {
                                    obj.frameIndex = 0;
                                }
                            }
                        }
                    }
                }

                // Update DOM
                const el = objectElements[obj.id];
                if (el) {
                    el.style.left = x + 'px';
                    el.style.top = y + 'px';
                    el.style.transform = 'rotate(' + rotation + 'deg) scaleX(' + (obj.flipX ? -1 : 1) + ')';
                    
                    // Update Texture
                    if (animBehavior && obj.currentAnimId) {
                         const animations = animBehavior.properties.animations;
                         const clip = animations.find(a => a.id === obj.currentAnimId);
                         if (clip && clip.frames.length > 0) {
                             const frame = clip.frames[obj.frameIndex];
                             if (frame) {
                                 el.style.backgroundImage = 'url(' + frame.imageUrl + ')';
                                 el.style.backgroundColor = 'transparent'; // Hide default color
                                 // Hide debug text if anim exists
                                 const debugText = el.querySelector('.debug-text');
                                 if (debugText) debugText.style.display = 'none';
                             }
                         }
                    }
                }
            });

            requestAnimationFrame(loop);
        }
        
        // Initial resize for correct letterboxing
        resize();
    </script>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "index.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-800/50">
          <h3 className="text-sm font-bold text-white flex items-center">
            <Share2 className="w-4 h-4 mr-2 text-blue-400" />
            Exportar Juego
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
           {/* Option 1: JSON/GBS */}
           <button 
             onClick={handleExportJSON}
             className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-4 flex items-center transition-all group"
           >
              <div className="p-3 bg-yellow-500/20 rounded-lg mr-4 group-hover:bg-yellow-500/30">
                 <FileJson className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="text-left">
                 <div className="font-bold text-gray-200 text-sm">Guardar Proyecto (.gbs)</div>
                 <div className="text-[10px] text-gray-400">Guarda el código fuente para editarlo después.</div>
              </div>
              <Download className="w-5 h-5 text-gray-500 ml-auto group-hover:text-white" />
           </button>

           {/* Option 2: HTML5 */}
           <button 
             onClick={handleExportHTML}
             className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-4 flex items-center transition-all group"
           >
              <div className="p-3 bg-orange-500/20 rounded-lg mr-4 group-hover:bg-orange-500/30">
                 <Globe className="w-6 h-6 text-orange-500" />
              </div>
              <div className="text-left">
                 <div className="font-bold text-gray-200 text-sm">Web HTML5 (.html)</div>
                 <div className="text-[10px] text-gray-400">Archivo jugable con motor incluido.</div>
              </div>
              <Download className="w-5 h-5 text-gray-500 ml-auto group-hover:text-white" />
           </button>

           {/* Option 3: APK Hint */}
           <div className="w-full bg-gray-800/50 border border-dashed border-gray-700 rounded-xl p-4 flex items-center opacity-75">
              <div className="p-3 bg-green-500/10 rounded-lg mr-4">
                 <Smartphone className="w-6 h-6 text-green-500" />
              </div>
              <div className="text-left">
                 <div className="font-bold text-gray-300 text-sm">Android APK</div>
                 <div className="text-[10px] text-gray-500">
                    Exporta como <b>HTML5</b> y usa herramientas como "Website 2 APK" para crear el instalable.
                 </div>
              </div>
           </div>
        </div>

        <div className="p-4 bg-gray-950/50 text-center">
           <button onClick={onClose} className="text-xs text-gray-500 hover:text-white underline">Cerrar</button>
        </div>
      </div>
    </div>
  );
};