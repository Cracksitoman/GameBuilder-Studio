
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
    assets: Asset[];
    library?: GameObject[]; // Add library to export
    scenes?: any[];
  };
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, gameData }) => {
  if (!isOpen) return null;

  const handleExportJSON = () => {
    // Ensure the full data structure is preserved including library
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(gameData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "proyecto_gamebuilder.gbs");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleExportHTML = () => {
    const mobileConfig = gameData.canvasConfig.mobileControls || { 
      enabled: true, 
      joystickX: 15, joystickY: 80, joystickSize: 150, 
      buttonX: 85, buttonY: 80, buttonSize: 100, 
      opacity: 0.5, color: '#ffffff' 
    };

    // For HTML export, we only care about the Scene Objects (instances) for the runtime.
    // gameData.objects contains the current scene's objects.
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>Mi Juego - Koda Engine</title>
    <style>
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; background: #000; overflow: hidden; width: 100vw; height: 100vh; color: white; font-family: system-ui, sans-serif; touch-action: none; user-select: none; -webkit-user-select: none; display: flex; align-items: center; justify-content: center; }
        #game-wrapper { position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
        #stage-area { position: relative; box-shadow: 0 0 50px rgba(0,0,0,0.5); background: #111827; overflow: hidden; transform-origin: center center; }
        #world-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; will-change: transform; }
        #gui-layer { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }
        .obj { position: absolute; will-change: transform, left, top; display: flex; align-items: center; justify-content: center; image-rendering: pixelated; background-size: 100% 100%; background-repeat: no-repeat; background-position: center; }
        .overlay { position: fixed; inset: 0; background: #000; z-index: 9999; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px; transition: opacity 0.5s; }
        .start-btn { background: linear-gradient(135deg, #2563eb, #1d4ed8); border: none; padding: 15px 40px; color: white; font-size: 18px; font-weight: bold; border-radius: 50px; cursor: pointer; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
        #ui-layer { position: absolute; inset: 0; pointer-events: none; z-index: 100; user-select: none; -webkit-user-select: none; }
        .virtual-joystick { position: absolute; border: 4px solid ${mobileConfig.color}; background-color: ${mobileConfig.color}20; border-radius: 50%; pointer-events: auto; transform: translate(-50%, -50%); left: ${mobileConfig.joystickX}%; top: ${mobileConfig.joystickY}%; width: ${mobileConfig.joystickSize}px; height: ${mobileConfig.joystickSize}px; opacity: ${mobileConfig.opacity}; display: flex; align-items: center; justify-content: center; touch-action: none; }
        .hit-area { position: absolute; width: 33%; height: 33%; }
        .hit-up { top: 0; left: 33%; } .hit-down { bottom: 0; left: 33%; } .hit-left { top: 33%; left: 0; } .hit-right { top: 33%; right: 0; }
        .virtual-btn { position: absolute; border: 4px solid ${mobileConfig.color}; background-color: ${mobileConfig.color}20; color: ${mobileConfig.color}; border-radius: 50%; pointer-events: auto; transform: translate(-50%, -50%); left: ${mobileConfig.buttonX}%; top: ${mobileConfig.buttonY}%; width: ${mobileConfig.buttonSize}px; height: ${mobileConfig.buttonSize}px; opacity: ${mobileConfig.opacity}; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; touch-action: none; user-select: none; -webkit-user-select: none; }
        .virtual-btn:active { background-color: ${mobileConfig.color}50; transform: translate(-50%, -50%) scale(0.95); }
        .hidden { display: none !important; }
    </style>
</head>
<body>
    <div id="start-screen" class="overlay"><h1>Mi Juego</h1><button class="start-btn" id="start-btn">JUGAR</button></div>
    <div id="game-wrapper"><div id="stage-area"><div id="world-layer"></div><div id="gui-layer"></div></div></div>
    <div id="ui-layer" class="${mobileConfig.enabled ? '' : 'hidden'}">
        <div class="virtual-joystick"><div class="hit-area hit-up" data-key="up"></div><div class="hit-area hit-down" data-key="down"></div><div class="hit-area hit-left" data-key="left"></div><div class="hit-area hit-right" data-key="right"></div></div>
        <div class="virtual-btn" data-key="action">A</div>
    </div>
    <script>
        const gameData = { objects: ${JSON.stringify(gameData.objects)}, library: ${JSON.stringify(gameData.library || [])}, canvasConfig: ${JSON.stringify(gameData.canvasConfig)} };
        const { width, height } = gameData.canvasConfig;
        let objects = JSON.parse(JSON.stringify(gameData.objects)).map(o => ({ ...o, vx: 0, vy: 0, isGrounded: false, isFollowing: false }));
        let cameraX = 0, cameraY = 0;
        const inputs = { left: false, right: false, up: false, down: false, action: false, tiltX: 0, tiltY: 0 };
        const objectElements = {}; let lastTime = performance.now(); let isGameRunning = false;

        // Simplified UUID generation
        function uuid() { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) { var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); }); }

        function checkRectCollision(r1, r2) {
            return (r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y);
        }

        function checkTilemapCollision(obj, tilemap) {
            if (!tilemap.tilemap) return false;
            const ts = tilemap.tilemap.tileSize;
            const relX = obj.x - tilemap.x, relY = obj.y - tilemap.y;
            const startGx = Math.floor(relX/ts), endGx = Math.floor((relX+obj.width-0.01)/ts);
            const startGy = Math.floor(relY/ts), endGy = Math.floor((relY+obj.height-0.01)/ts);
            for(let gy=startGy; gy<=endGy; gy++) {
                for(let gx=startGx; gx<=endGx; gx++) {
                    const t = tilemap.tilemap.tiles[gx+','+gy];
                    if(t && (typeof t==='string' || t.solid)) return true;
                }
            }
            return false;
        }

        function createElementForObject(obj) {
            const el = document.createElement('div'); el.className = 'obj';
            el.id = 'el-' + obj.id;
            el.style.width = obj.width + 'px'; el.style.height = obj.height + 'px';
            el.style.backgroundColor = (obj.type !== 'TEXT' && obj.type !== 'TILEMAP') ? obj.color : 'transparent';
            el.style.zIndex = obj.zIndex; el.style.opacity = obj.opacity;
            if(obj.type === 'TEXT') { el.innerText = obj.name; el.style.color = obj.color; el.style.whiteSpace = 'nowrap'; }
            if(obj.type === 'TILEMAP' && obj.tilemap && obj.tilemap.tiles) {
                Object.entries(obj.tilemap.tiles).forEach(([k, d]) => {
                    const [gx, gy] = k.split(',').map(Number);
                    const t = document.createElement('div'); t.style.position = 'absolute'; 
                    t.style.left = (gx*obj.tilemap.tileSize)+'px'; t.style.top = (gy*obj.tilemap.tileSize)+'px';
                    t.style.width = obj.tilemap.tileSize+'px'; t.style.height = obj.tilemap.tileSize+'px';
                    const url = typeof d === 'string' ? d : d.url;
                    t.style.backgroundImage = 'url('+url+')'; 
                    t.style.backgroundSize = 'contain';
                    t.style.backgroundRepeat = 'no-repeat';
                    t.style.imageRendering = 'pixelated';
                    el.appendChild(t);
                });
            }
            if(obj.previewSpriteUrl && obj.type !== 'TILEMAP') el.style.backgroundImage = 'url('+obj.previewSpriteUrl+')';
            if(!obj.visible) el.style.display = 'none';
            (obj.isGui ? document.getElementById('gui-layer') : document.getElementById('world-layer')).appendChild(el);
            objectElements[obj.id] = el;
            
            // Interaction setup
            el.addEventListener('pointerdown', () => { obj.isPointerDown = true; obj.downStartTime = Date.now(); });
            el.addEventListener('pointerup', () => { 
                obj.lastClickTime = Date.now();
                obj.isPointerDown = false; 
            });
        }

        function init() {
            document.getElementById('stage-area').style.width = width + 'px';
            document.getElementById('stage-area').style.height = height + 'px';
            objects.forEach(obj => createElementForObject(obj));
            setupInput(); resize(); requestAnimationFrame(loop);
        }

        function resize() {
            const s = Math.min(window.innerWidth/width, window.innerHeight/height);
            document.getElementById('stage-area').style.transform = 'scale('+s+')';
        }

        function setupInput() {
            window.addEventListener('keydown', e => { if(e.code==='ArrowLeft') inputs.left=true; if(e.code==='ArrowRight') inputs.right=true; if(e.code==='ArrowUp') inputs.up=true; if(e.code==='ArrowDown') inputs.down=true; if(e.code==='Space') inputs.action=true; });
            window.addEventListener('keyup', e => { if(e.code==='ArrowLeft') inputs.left=false; if(e.code==='ArrowRight') inputs.right=false; if(e.code==='ArrowUp') inputs.up=false; if(e.code==='ArrowDown') inputs.down=false; if(e.code==='Space') inputs.action=false; });
            document.querySelectorAll('[data-key]').forEach(b => {
                const k = b.getAttribute('data-key');
                b.addEventListener('pointerdown', e => { e.preventDefault(); inputs[k]=true; });
                b.addEventListener('pointerup', e => { e.preventDefault(); inputs[k]=false; });
                b.addEventListener('pointerleave', e => { e.preventDefault(); inputs[k]=false; });
            });
            if (window.DeviceOrientationEvent) window.addEventListener('deviceorientation', e => {
               let tx = Math.max(-1, Math.min(1, (e.gamma||0)/45)); let ty = Math.max(-1, Math.min(1, (e.beta||0)/45));
               if(window.orientation===90){const t=tx;tx=-ty;ty=t;} else if(window.orientation===-90){const t=tx;tx=ty;ty=-t;}
               inputs.tiltX=tx; inputs.tiltY=ty;
            });
        }

        function loop(timestamp) {
            const dt = Math.min((timestamp - lastTime) / 1000, 0.1); lastTime = timestamp;
            const solids = objects.filter(o => o.isObstacle && o.type !== 'TILEMAP' && o.visible);
            const tilemaps = objects.filter(o => o.type === 'TILEMAP' && o.visible);
            const player = objects.find(o => o.type === 'PLAYER');

            objects.forEach(obj => {
                if(obj.events) {
                    obj.events.forEach(ev => {
                        let conditionMet = true;
                        for(let cond of ev.conditions) {
                            if(cond.type === 'TOUCH_INTERACTION') {
                                if(cond.parameters.subtype === 'CLICK' && !(obj.isPointerDown === true)) conditionMet = false;
                                if(cond.parameters.subtype === 'DOUBLE_CLICK' && !(obj.isPointerDown === true && (Date.now() - (obj.lastClickTime||0) < 300))) conditionMet = false;
                            }
                        }
                        
                        if(conditionMet) {
                            let lastCreatedObj = null;
                            for(let act of ev.actions) {
                                if(act.type === 'CREATE_OBJECT') {
                                    const proto = gameData.library.find(l => l.id === act.parameters.sourceObjectId);
                                    if(proto) {
                                        const newObj = { ...JSON.parse(JSON.stringify(proto)), id: uuid(), x: obj.x, y: obj.y, rotation: obj.rotation, vx: 0, vy: 0 };
                                        objects.push(newObj);
                                        createElementForObject(newObj);
                                        lastCreatedObj = newObj;
                                    }
                                }
                                if(act.type === 'APPLY_FORCE') {
                                    const target = act.parameters.target === 'OTHER' ? lastCreatedObj : obj;
                                    if(target) {
                                        let fx = act.parameters.forceX || 0;
                                        let fy = act.parameters.forceY || 0;
                                        if (target.rotation !== 0) {
                                            const rad = (target.rotation * Math.PI) / 180;
                                            const rotX = fx * Math.cos(rad) - fy * Math.sin(rad);
                                            const rotY = fx * Math.sin(rad) + fy * Math.cos(rad);
                                            fx = rotX; fy = rotY;
                                        }
                                        target.vx += fx; target.vy += fy;
                                    }
                                }
                                if(act.type === 'DESTROY') {
                                    const target = act.parameters.target === 'OTHER' ? lastCreatedObj : obj;
                                    if(target) { target.visible = false; const el = document.getElementById('el-'+target.id); if(el) el.style.display='none'; }
                                }
                            }
                        }
                        if(obj.isPointerDown) obj.isPointerDown = false; // Reset instant click
                    });
                }

                if(!obj.behaviors) return;
                let { x, y, vx, vy, isGrounded } = obj;
                obj.behaviors.forEach(b => {
                    if(b.type === 'PROJECTILE') {
                        const s = b.properties.speed || 400;
                        const rad = (obj.rotation * Math.PI) / 180;
                        x += (Math.cos(rad) * s + vx) * dt;
                        y += (Math.sin(rad) * s + vy) * dt;
                    }
                    if(b.type === 'TOPDOWN') {
                        const s = b.properties.speed || 200;
                        let mx=0, my=0;
                        if(inputs.left) mx=-s; else if(inputs.right) mx=s;
                        if(inputs.up) my=-s; else if(inputs.down) my=s;
                        if(inputs.tiltX) mx=inputs.tiltX*s; if(inputs.tiltY) my=inputs.tiltY*s;
                        if(mx) vx=mx; else vx*=0.8; if(my) vy=my; else vy*=0.8;
                        
                        let nextX = x + vx * dt;
                        let colX = false;
                        for(const obs of solids) if(obj.id!==obs.id && checkRectCollision({...obj, x:nextX, y}, obs)) { colX=true; break; }
                        if(!colX) for(const tm of tilemaps) if(checkTilemapCollision({...obj, x:nextX, y}, tm)) { colX=true; break; }
                        if(!colX) x = nextX;

                        let nextY = y + vy * dt;
                        let colY = false;
                        for(const obs of solids) if(obj.id!==obs.id && checkRectCollision({...obj, x, y:nextY}, obs)) { colY=true; break; }
                        if(!colY) for(const tm of tilemaps) if(checkTilemapCollision({...obj, x, y:nextY}, tm)) { colY=true; break; }
                        if(!colY) y = nextY;
                    }
                    if(b.type === 'PLATFORMER') {
                        const g = b.properties.gravity || 1000;
                        const j = b.properties.jumpForce || 500;
                        const m = b.properties.maxSpeed || 200;
                        
                        if(inputs.left) { vx = -m; obj.flipX = true; } 
                        else if(inputs.right) { vx = m; obj.flipX = false; } 
                        else { vx *= 0.8; if(Math.abs(vx)<10) vx=0; }
                        
                        if((inputs.up || inputs.action) && isGrounded) { vy = -j; isGrounded = false; }
                        vy += g * dt;

                        let nextX = x + vx * dt;
                        let colX = false;
                        for(const obs of solids) if(obj.id!==obs.id && checkRectCollision({...obj, x:nextX, y}, obs)) { colX=true; break; }
                        if(!colX) for(const tm of tilemaps) if(checkTilemapCollision({...obj, x:nextX, y}, tm)) { colX=true; break; }
                        if(!colX) x = nextX;

                        let nextY = y + vy * dt;
                        let colY = false;
                        for(const obs of solids) {
                            if(obj.id!==obs.id && checkRectCollision({...obj, x, y:nextY}, obs)) {
                                if(vy>0) { y = obs.y - obj.height; isGrounded=true; vy=0; }
                                else if(vy<0) { y = obs.y + obs.height; vy=0; }
                                colY=true; break;
                            }
                        }
                        if(!colY) {
                            for(const tm of tilemaps) {
                                if(checkTilemapCollision({...obj, x, y:nextY}, tm)) {
                                    if(vy>0) { isGrounded=true; vy=0; y=Math.floor(y); } // Simple ground snap
                                    else { vy=0; }
                                    colY=true; break;
                                }
                            }
                        }
                        if(!colY) { y = nextY; isGrounded = false; }
                        if(y+obj.height >= height) { y = height - obj.height; vy=0; isGrounded=true; }
                    }
                });
                obj.x=x; obj.y=y; obj.vx=vx; obj.vy=vy; obj.isGrounded=isGrounded;
                
                const el = objectElements[obj.id];
                if(el) {
                    el.style.left = x+'px'; el.style.top = y+'px';
                    el.style.transform = 'rotate('+obj.rotation+'deg) scaleX('+(obj.flipX?-1:1)+')';
                }
            });

            if(player) {
                const tx = (player.x+player.width/2)-width/2; const ty = (player.y+player.height/2)-height/2;
                cameraX += (tx-cameraX)*0.1; cameraY += (ty-cameraY)*0.1;
                document.getElementById('world-layer').style.transform = 'translate(' + (-cameraX) + 'px, ' + (-cameraY) + 'px)';
            }
            requestAnimationFrame(loop);
        }

        document.getElementById('start-btn').addEventListener('click', () => {
            if(document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
            document.getElementById('start-screen').style.display='none';
            if(!isGameRunning) { init(); isGameRunning=true; }
        });
        window.addEventListener('resize', resize);
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
                 <div className="text-[10px] text-gray-400">Archivo jugable con motor, controles y sensores.</div>
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
                    Usa "Website 2 APK" con el archivo HTML5 exportado para habilitar giroscopio y pantalla completa.
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
