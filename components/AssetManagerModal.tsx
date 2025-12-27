
import React, { useState, useRef, useEffect } from 'react';
import { Asset } from '../types';
import { X, UploadCloud, Paintbrush, Grid3x3, Trash2, Eraser, Save, PaintBucket, Check, Palette, ChevronLeft, Download, ZoomIn, ZoomOut, Plus, Maximize, Volume2, Music } from './Icons';

interface AssetManagerModalProps {
  isOpen: boolean;
  assets: Asset[];
  onClose: () => void;
  onAddAsset: (asset: Asset) => void;
  onDeleteAsset: (id: string) => void;
  onSelectAsset?: (url: string) => void;
  allowedTypes?: ('image' | 'audio')[]; // New Prop to filter view
}

type ToolType = 'BRUSH' | 'ERASER' | 'BUCKET';

// --- GENERATE EXTENSIVE PALETTE ---
const generatePalette = () => {
    const palette = [];
    // Grayscale
    for(let i=0; i<=10; i++) {
        const val = Math.round((i/10)*255);
        palette.push(`rgb(${val},${val},${val})`);
    }
    // HSL Spectrum
    const hues = 18; // Steps of hue
    const lights = [30, 50, 70]; // Steps of lightness
    const sat = 90;

    for (let l of lights) {
        for(let i=0; i<hues; i++) {
            const h = Math.round((i/hues)*360);
            palette.push(`hsl(${h}, ${sat}%, ${l}%)`);
        }
    }
    return palette;
};

const EXTENDED_PALETTE = generatePalette();

export const AssetManagerModal: React.FC<AssetManagerModalProps> = ({
  isOpen,
  assets,
  onClose,
  onAddAsset,
  onDeleteAsset,
  onSelectAsset,
  allowedTypes = ['image', 'audio']
}) => {
  const [mode, setMode] = useState<'GALLERY' | 'DRAW' | 'SIZE_SELECT'>('GALLERY');
  
  // Editor Config State
  const [gridSize, setGridSize] = useState(16); // Default 16x16
  const [pixelSize, setPixelSize] = useState(25); // Zoom level (px per block)
  
  // Drawing State
  const [pixels, setPixels] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [currentTool, setCurrentTool] = useState<ToolType>('BRUSH');
  const [drawName, setDrawName] = useState('Nuevo Sprite');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // UI State
  const [showExtendedPalette, setShowExtendedPalette] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false); // Track dragging state

  // Filter assets based on allowedTypes
  const visibleAssets = assets.filter(a => allowedTypes.includes(a.type));

  // Helper to convert any color to Hex for input display
  const colorToHex = (color: string) => {
      const ctx = document.createElement('canvas').getContext('2d');
      if(!ctx) return '#000000';
      ctx.fillStyle = color;
      return ctx.fillStyle;
  };

  const handleInitNewDrawing = () => {
      setMode('SIZE_SELECT');
  };

  const confirmNewDrawing = (size: number) => {
      setGridSize(size);
      setPixels(Array(size * size).fill('transparent'));
      setDrawName(`Sprite ${assets.length + 1}`);
      setEditingId(null);
      // Auto adjust zoom based on size to fit screen
      setPixelSize(size > 32 ? 15 : 25);
      setMode('DRAW');
      setShowExtendedPalette(false);
  };

  const loadSpriteForEditing = (asset: Asset) => {
      if (asset.type !== 'image') return; // Cannot edit audio
      const img = new Image();
      img.src = asset.url;
      img.onload = () => {
          // Detect dimensions (assuming square for simplicity or use natural dimensions)
          let size = 16;
          if (img.width > 16) size = 32;
          if (img.width > 32) size = 64;
          
          setGridSize(size);

          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          ctx.clearRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);
          
          const imageData = ctx.getImageData(0, 0, size, size).data;
          const newPixels = [];
          
          for (let i = 0; i < imageData.length; i += 4) {
              const r = imageData[i];
              const g = imageData[i+1];
              const b = imageData[i+2];
              const a = imageData[i+3];
              
              if (a === 0) {
                  newPixels.push('transparent');
              } else {
                  const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
                  newPixels.push(hex);
              }
          }
          setPixels(newPixels);
          setDrawName(asset.name);
          setEditingId(asset.id);
          setPixelSize(size > 32 ? 15 : 25);
          setMode('DRAW');
      };
  };

  // --- TOOLS LOGIC ---
  const getPixelIndex = (x: number, y: number) => y * gridSize + x;

  const floodFill = (startIndex: number, targetColor: string, replacementColor: string) => {
      if (targetColor === replacementColor) return;
      
      const newPixels = [...pixels];
      const stack = [startIndex];
      const visited = new Set<number>(); 
      
      while (stack.length > 0) {
          const idx = stack.pop()!;
          if(visited.has(idx)) continue;
          visited.add(idx);

          if (newPixels[idx] === targetColor) {
              newPixels[idx] = replacementColor;
              
              const x = idx % gridSize;
              const y = Math.floor(idx / gridSize);
              
              if (x > 0) stack.push(getPixelIndex(x - 1, y)); // Left
              if (x < gridSize - 1) stack.push(getPixelIndex(x + 1, y)); // Right
              if (y > 0) stack.push(getPixelIndex(x, y - 1)); // Top
              if (y < gridSize - 1) stack.push(getPixelIndex(x, y + 1)); // Bottom
          }
      }
      setPixels(newPixels);
  };

  const paintPixel = (index: number) => {
    if (currentTool === 'BUCKET') {
        const targetColor = pixels[index];
        floodFill(index, targetColor, selectedColor);
    } else {
        const newColor = currentTool === 'ERASER' ? 'transparent' : selectedColor;
        if (pixels[index] === newColor) return;

        const newPixels = [...pixels];
        newPixels[index] = newColor;
        setPixels(newPixels);
    }
  };

  const handlePointerDown = (index: number, e: React.PointerEvent) => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDrawing(true);
      paintPixel(index);
  };

  const handlePointerEnter = (index: number, e: React.PointerEvent) => {
      if (isDrawing || (e.buttons === 1 && currentTool !== 'BUCKET')) {
          paintPixel(index);
      }
  };

  const handlePointerUp = () => {
      setIsDrawing(false);
  };

  useEffect(() => {
      if (isOpen) {
        window.addEventListener('pointerup', handlePointerUp);
      }
      return () => window.removeEventListener('pointerup', handlePointerUp);
  }, [isOpen]);

  const handleSaveDrawing = () => {
    const canvas = document.createElement('canvas');
    canvas.width = gridSize;
    canvas.height = gridSize;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      pixels.forEach((color, i) => {
        if (color !== 'transparent') {
          const x = i % gridSize;
          const y = Math.floor(i / gridSize);
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      });
      
      const url = canvas.toDataURL('image/png');
      
      if (editingId) {
          onDeleteAsset(editingId); 
          onAddAsset({ id: editingId, name: drawName, url: url, type: 'image' });
      } else {
          const newAsset: Asset = { id: crypto.randomUUID(), name: drawName, url: url, type: 'image' };
          onAddAsset(newAsset);
          if (onSelectAsset) onSelectAsset(newAsset.url);
      }
      setMode('GALLERY');
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      const isAudio = file.type.startsWith('audio');
      
      reader.onloadend = () => {
        onAddAsset({
          id: crypto.randomUUID(),
          name: file.name.split('.')[0].substring(0, 16),
          url: reader.result as string,
          type: isAudio ? 'audio' : 'image'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-6xl h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-gray-900 z-20 shrink-0">
          <div className="flex items-center space-x-3">
             {(mode === 'DRAW' || mode === 'SIZE_SELECT') && (
                 <button onClick={() => setMode('GALLERY')} className="p-1 rounded hover:bg-gray-800 text-gray-400">
                     <ChevronLeft className="w-5 h-5" />
                 </button>
             )}
             <div className="p-1.5 bg-blue-900/30 rounded-lg">
                {mode === 'GALLERY' ? <Grid3x3 className="w-4 h-4 text-blue-400" /> : <Paintbrush className="w-4 h-4 text-purple-400" />}
             </div>
             <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                    {mode === 'GALLERY' && 'Galería de Assets'}
                    {mode === 'SIZE_SELECT' && 'Configuración de Sprite'}
                    {mode === 'DRAW' && `Editor ${gridSize}x${gridSize}`}
                </h3>
             </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-full bg-gray-800 hover:bg-gray-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* --- GALLERY MODE --- */}
        {mode === 'GALLERY' && (
            <div className="flex-1 overflow-y-auto p-6 bg-gray-950">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {allowedTypes.includes('image') && (
                        <button 
                        onClick={handleInitNewDrawing}
                        className="flex flex-col items-center justify-center p-6 bg-gray-900 border border-gray-800 hover:border-purple-500 hover:bg-gray-800 rounded-xl transition-all group shadow-lg"
                        >
                            <div className="w-12 h-12 bg-purple-900/20 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Plus className="w-6 h-6 text-purple-400" />
                            </div>
                            <span className="text-sm font-bold text-gray-200">Crear Sprite</span>
                        </button>
                    )}

                    <button 
                       onClick={() => fileInputRef.current?.click()}
                       className="flex flex-col items-center justify-center p-6 bg-gray-900 border border-gray-800 hover:border-blue-500 hover:bg-gray-800 rounded-xl transition-all group shadow-lg"
                    >
                        <div className="w-12 h-12 bg-blue-900/20 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                             <UploadCloud className="w-6 h-6 text-blue-400" />
                        </div>
                        <span className="text-sm font-bold text-gray-200">Subir Archivo</span>
                        <div className="text-[10px] text-gray-500 mt-1">
                            {allowedTypes.includes('audio') ? 'Imágenes o Sonidos' : 'Solo Imágenes'}
                        </div>
                        <input ref={fileInputRef} type="file" accept={allowedTypes.includes('audio') ? "image/*,audio/*" : "image/*"} className="hidden" onChange={handleUpload} />
                    </button>
                </div>

                <div className="flex items-center space-x-2 mb-3 border-t border-gray-800 pt-4">
                    <Grid3x3 className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mis Assets ({visibleAssets.length})</span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {visibleAssets.map(asset => (
                        <div 
                           key={asset.id} 
                           className="relative group bg-gray-900 border border-gray-800 rounded-lg aspect-square flex items-center justify-center overflow-hidden hover:border-blue-500 cursor-pointer shadow-md transition-all"
                           onClick={() => onSelectAsset && onSelectAsset(asset.url)}
                           onDoubleClick={() => loadSpriteForEditing(asset)}
                        >
                            {asset.type === 'audio' ? (
                                <div className="flex flex-col items-center justify-center space-y-2">
                                    <Music className="w-8 h-8 text-green-500" />
                                    <span className="text-[10px] text-green-300 font-mono bg-green-900/30 px-1 rounded">AUDIO</span>
                                </div>
                            ) : (
                                <>
                                    <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)', backgroundSize: '8px 8px'}}></div>
                                    <img src={asset.url} alt={asset.name} className="relative z-10 w-full h-full object-contain p-2 image-pixelated" />
                                </>
                            )}
                            
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity z-20 backdrop-blur-[1px]">
                                <span className="text-[9px] text-white font-mono truncate max-w-[80%] px-1">{asset.name}</span>
                                <div className="flex gap-1">
                                    {asset.type === 'image' && (
                                        <button onClick={(e) => { e.stopPropagation(); loadSpriteForEditing(asset); }} className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded"><Paintbrush className="w-3 h-3" /></button>
                                    )}
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteAsset(asset.id); }} className="p-1.5 bg-red-600 hover:bg-red-500 text-white rounded"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- SIZE SELECTION MODE --- */}
        {mode === 'SIZE_SELECT' && (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 p-6 animate-in fade-in">
                <h3 className="text-xl font-bold text-white mb-6">Selecciona el Tamaño del Lienzo</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
                    {[16, 32, 64].map(size => (
                        <button 
                            key={size}
                            onClick={() => confirmNewDrawing(size)}
                            className="flex flex-col items-center p-6 bg-gray-900 border border-gray-700 hover:border-purple-500 hover:bg-gray-800 rounded-2xl transition-all"
                        >
                            <Grid3x3 className="w-8 h-8 text-gray-500 mb-2" />
                            <span className="text-lg font-bold text-white">{size} x {size}</span>
                            <span className="text-xs text-gray-500">px</span>
                        </button>
                    ))}
                    <button 
                        onClick={() => confirmNewDrawing(128)}
                        className="flex flex-col items-center p-6 bg-gray-900 border border-gray-700 hover:border-purple-500 hover:bg-gray-800 rounded-2xl transition-all"
                    >
                         <Maximize className="w-8 h-8 text-gray-500 mb-2" />
                         <span className="text-lg font-bold text-white">128 x 128</span>
                         <span className="text-xs text-gray-500">Grande</span>
                    </button>
                </div>
            </div>
        )}

        {/* --- DRAW MODE --- */}
        {mode === 'DRAW' && (
            <div className="flex-1 flex overflow-hidden bg-gray-950">
                 
                 {/* LEFT SIDEBAR: TOOLS */}
                 <div className="w-16 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 space-y-4 z-10 shadow-xl shrink-0">
                     <div className="flex flex-col space-y-2 w-full px-2">
                         <button onClick={() => setCurrentTool('BRUSH')} className={`p-3 rounded-xl transition-all flex justify-center ${currentTool === 'BRUSH' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`} title="Pincel">
                            <Paintbrush className="w-5 h-5" />
                         </button>
                         <button onClick={() => setCurrentTool('BUCKET')} className={`p-3 rounded-xl transition-all flex justify-center ${currentTool === 'BUCKET' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`} title="Relleno">
                            <PaintBucket className="w-5 h-5" />
                         </button>
                         <button onClick={() => setCurrentTool('ERASER')} className={`p-3 rounded-xl transition-all flex justify-center ${currentTool === 'ERASER' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`} title="Borrador">
                            <Eraser className="w-5 h-5" />
                         </button>
                     </div>

                     <div className="h-px w-8 bg-gray-700"></div>

                     {/* CURRENT COLOR */}
                     <div className="flex flex-col items-center space-y-2">
                         <label className="text-[9px] text-gray-500 font-bold uppercase">Color</label>
                         <div className="relative group">
                            <button 
                                onDoubleClick={() => setShowExtendedPalette(true)}
                                className="w-10 h-10 rounded-full border-4 border-gray-700 shadow-xl transition-transform transform active:scale-95 group-hover:border-gray-500"
                                style={{backgroundColor: selectedColor}}
                                title="Doble Clic para Paleta Extendida"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-gray-800 rounded-full p-0.5 border border-gray-600 pointer-events-none">
                                <Palette className="w-3 h-3 text-white" />
                            </div>
                         </div>
                     </div>

                     <div className="h-px w-8 bg-gray-700"></div>

                     {/* ZOOM CONTROLS */}
                     <div className="flex flex-col items-center space-y-2">
                         <label className="text-[9px] text-gray-500 font-bold uppercase">Zoom</label>
                         <button onClick={() => setPixelSize(p => Math.min(60, p + 2))} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300">
                             <ZoomIn className="w-4 h-4" />
                         </button>
                         <span className="text-[10px] text-gray-400 font-mono">{pixelSize}px</span>
                         <button onClick={() => setPixelSize(p => Math.max(2, p - 2))} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300">
                             <ZoomOut className="w-4 h-4" />
                         </button>
                     </div>
                 </div>

                 {/* MAIN CANVAS AREA */}
                 <div className="flex-1 flex flex-col relative bg-[#1a1a1a]">
                      
                      {/* Top Bar for Name */}
                      <div className="p-3 bg-gray-900 border-b border-gray-800 flex justify-center items-center shrink-0">
                          <input 
                             type="text" 
                             value={drawName} 
                             onChange={e => setDrawName(e.target.value)}
                             className="bg-transparent border-b border-gray-700 text-center text-sm font-bold text-white focus:border-purple-500 outline-none px-2 py-1 w-48 transition-colors"
                             placeholder="Nombre del Sprite"
                          />
                      </div>

                      {/* Canvas Wrapper - SCROLLABLE */}
                      <div className="flex-1 flex overflow-auto relative p-8">
                          <div className="m-auto relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                            {/* Grid Container */}
                            <div 
                                className="bg-white relative select-none"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                                    width: `${gridSize * pixelSize}px`,
                                    height: `${gridSize * pixelSize}px`,
                                    border: '1px solid #333',
                                    backgroundImage: `
                                    linear-gradient(45deg, #2a2a2a 25%, transparent 25%), 
                                    linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), 
                                    linear-gradient(45deg, transparent 75%, #2a2a2a 75%), 
                                    linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)
                                    `,
                                    backgroundColor: '#1a1a1a',
                                    backgroundSize: `${pixelSize * 2}px ${pixelSize * 2}px`, 
                                    backgroundPosition: `0 0, 0 ${pixelSize}px, ${pixelSize}px -${pixelSize}px, -${pixelSize}px 0px`,
                                    touchAction: 'none'
                                }}
                                onPointerLeave={() => handlePointerUp()}
                            >
                                {pixels.map((color, i) => (
                                    <div 
                                    key={i}
                                    style={{ backgroundColor: color }}
                                    className={`w-full h-full border-[0.5px] border-white/5 hover:border-white/20 ${currentTool === 'BUCKET' ? 'cursor-crosshair' : 'cursor-cell'}`}
                                    onPointerDown={(e) => handlePointerDown(i, e)}
                                    onPointerEnter={(e) => handlePointerEnter(i, e)}
                                    />
                                ))}
                            </div>
                          </div>
                      </div>

                      {/* Save Action */}
                      <div className="absolute bottom-6 right-6">
                           <button 
                                onClick={handleSaveDrawing}
                                className="flex items-center space-x-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-green-900/30 transform transition-all hover:scale-105 active:scale-95"
                           >
                               <Save className="w-5 h-5" />
                               <span>{editingId ? 'Actualizar Sprite' : 'Guardar Sprite'}</span>
                           </button>
                      </div>
                 </div>
            </div>
        )}

        {/* --- PALETTE MODAL (Same as before) --- */}
        {showExtendedPalette && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200" onClick={() => setShowExtendedPalette(false)}>
                <div className="bg-gray-800 border border-gray-600 p-5 rounded-2xl shadow-2xl w-[90%] max-w-md" onClick={e => e.stopPropagation()}>
                    {/* ... Existing Palette Code ... */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-2">
                             <Palette className="w-5 h-5 text-purple-400" />
                             <h4 className="font-bold text-white">Paleta Profesional</h4>
                        </div>
                        <button onClick={() => setShowExtendedPalette(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
                    </div>
                    
                    <div className="flex items-center space-x-3 mb-4 bg-gray-900 p-3 rounded-xl border border-gray-700">
                         <div className="w-12 h-12 rounded-lg border-2 border-gray-500 shadow-inner" style={{backgroundColor: selectedColor}}></div>
                         <div className="flex-1">
                             <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Código Hex</label>
                             <div className="flex items-center space-x-2">
                                 <span className="text-gray-400 font-mono">#</span>
                                 <input 
                                    type="text" 
                                    value={colorToHex(selectedColor).replace('#', '')}
                                    onChange={(e) => setSelectedColor('#' + e.target.value)}
                                    className="bg-transparent text-white font-mono outline-none w-full uppercase"
                                    maxLength={6}
                                 />
                             </div>
                         </div>
                         <input 
                            type="color" 
                            value={colorToHex(selectedColor)}
                            onChange={(e) => setSelectedColor(e.target.value)}
                            className="w-10 h-10 p-0 border-0 bg-transparent cursor-pointer"
                         />
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] text-gray-500 uppercase font-bold">Espectro Cromático</label>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(24px,1fr))] gap-1 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                             {EXTENDED_PALETTE.map((c, idx) => (
                                 <button
                                    key={idx}
                                    style={{backgroundColor: c}}
                                    onClick={() => { setSelectedColor(c); if(currentTool === 'ERASER') setCurrentTool('BRUSH'); }}
                                    className={`aspect-square rounded-sm hover:scale-125 hover:z-10 hover:shadow-lg transition-transform border border-black/20 ${selectedColor === c ? 'ring-2 ring-white z-10' : ''}`}
                                    title={c}
                                 />
                             ))}
                        </div>
                    </div>

                    <button onClick={() => setShowExtendedPalette(false)} className="w-full mt-5 bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-bold shadow-lg">
                        Seleccionar Color
                    </button>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
