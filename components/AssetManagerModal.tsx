
import React, { useState, useRef, useEffect } from 'react';
import { Asset } from '../types';
import { X, UploadCloud, Paintbrush, Grid3x3, Trash2, Eraser, Save, PaintBucket, Check, Palette, ChevronLeft, Download, ZoomIn, ZoomOut, Plus, Maximize, Volume2, Music, Scissors, ImagePlus, Hand } from './Icons';

interface AssetManagerModalProps {
  isOpen: boolean;
  assets: Asset[];
  onClose: () => void;
  onAddAsset?: (asset: Asset) => void;
  onDeleteAsset: (id: string) => void;
  onSelectAsset?: (url: string) => void;
  onMultiSelectAssets?: (urls: string[]) => void;
  allowedTypes?: ('image' | 'audio')[];
  initialMode?: 'GALLERY' | 'SHEET_SLICER';
}

type ToolType = 'BRUSH' | 'ERASER' | 'BUCKET' | 'HAND';
type ViewMode = 'GALLERY' | 'DRAW' | 'SIZE_SELECT' | 'SHEET_SLICER';

const generatePalette = () => {
    const palette = [];
    for(let i=0; i<=10; i++) {
        const val = Math.round((i/10)*255);
        palette.push(`rgb(${val},${val},${val})`);
    }
    const hues = 18;
    const lights = [30, 50, 70];
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
  onMultiSelectAssets,
  allowedTypes = ['image', 'audio'],
  initialMode = 'GALLERY'
}) => {
  const [mode, setMode] = useState<ViewMode>(initialMode);
  
  // Editor Config State
  const [gridSize, setGridSize] = useState(16);
  const [pixelSize, setPixelSize] = useState(25);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  
  // Drawing State
  const [pixels, setPixels] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [currentTool, setCurrentTool] = useState<ToolType>('BRUSH');
  const [drawName, setDrawName] = useState('Nuevo Sprite');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Sheet Slicer State
  const [sheetImage, setSheetImage] = useState<HTMLImageElement | null>(null);
  const [sheetCols, setSheetCols] = useState(4);
  const [sheetRows, setSheetRows] = useState(1);
  const [sheetName, setSheetName] = useState('Sheet');
  
  // UI & Touch State
  const [showExtendedPalette, setShowExtendedPalette] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sheetInputRef = useRef<HTMLInputElement>(null);
  const importToCanvasRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Touch Tracking for Pan & Zoom
  const activePointers = useRef<Map<number, { x: number, y: number }>>(new Map());
  const lastPinchDist = useRef<number | null>(null);

  useEffect(() => {
      if(isOpen) {
          setMode(initialMode);
          setCanvasOffset({ x: 0, y: 0 });
      }
  }, [isOpen, initialMode]);

  const visibleAssets = assets.filter(a => allowedTypes.includes(a.type));

  const colorToHex = (color: string) => {
      const ctx = document.createElement('canvas').getContext('2d');
      if(!ctx) return '#000000';
      ctx.fillStyle = color;
      return ctx.fillStyle;
  };

  const handleInitNewDrawing = () => setMode('SIZE_SELECT');

  const confirmNewDrawing = (size: number) => {
      setGridSize(size);
      setPixels(Array(size * size).fill('transparent'));
      setDrawName(`Sprite ${assets.length + 1}`);
      setEditingId(null);
      setPixelSize(size > 32 ? 10 : 20);
      setCanvasOffset({ x: 0, y: 0 });
      setMode('DRAW');
      setShowExtendedPalette(false);
  };

  const loadSpriteForEditing = (asset: Asset) => {
      if (asset.type !== 'image') return;
      const img = new Image();
      img.src = asset.url;
      img.onload = () => {
          let size = img.width === img.height ? img.width : 32;
          if (![16, 32, 64, 128].includes(size)) size = 32;
          
          setGridSize(size);
          const canvas = document.createElement('canvas');
          canvas.width = size; canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, size, size);
          const imageData = ctx.getImageData(0, 0, size, size).data;
          const newPixels = [];
          for (let i = 0; i < imageData.length; i += 4) {
              if (imageData[i+3] < 10) newPixels.push('transparent');
              else {
                  const hex = "#" + ((1 << 24) + (imageData[i] << 16) + (imageData[i+1] << 8) + imageData[i+2]).toString(16).slice(1).toUpperCase();
                  newPixels.push(hex);
              }
          }
          setPixels(newPixels);
          setDrawName(asset.name);
          setEditingId(asset.id);
          setPixelSize(size > 32 ? 10 : 20);
          setCanvasOffset({ x: 0, y: 0 });
          setMode('DRAW');
      };
  };

  const paintPixel = (index: number) => {
    if (index < 0 || index >= pixels.length) return;
    if (currentTool === 'BUCKET') {
        const targetColor = pixels[index];
        const newPixels = [...pixels];
        const stack = [index];
        const visited = new Set<number>();
        const replacement = selectedColor;
        if (targetColor === replacement) return;
        while(stack.length > 0) {
            const idx = stack.pop()!;
            if (visited.has(idx)) continue;
            visited.add(idx);
            if (newPixels[idx] === targetColor) {
                newPixels[idx] = replacement;
                const x = idx % gridSize;
                const y = Math.floor(idx / gridSize);
                if (x > 0) stack.push(idx - 1);
                if (x < gridSize - 1) stack.push(idx + 1);
                if (y > 0) stack.push(idx - gridSize);
                if (y < gridSize - 1) stack.push(idx + gridSize);
            }
        }
        setPixels(newPixels);
    } else {
        const newColor = currentTool === 'ERASER' ? 'transparent' : selectedColor;
        if (pixels[index] === newColor) return;
        const newPixels = [...pixels];
        newPixels[index] = newColor;
        setPixels(newPixels);
    }
  };

  const handlePointerDown = (e: React.PointerEvent, index: number | null) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      
      if (activePointers.current.size === 1 && currentTool !== 'HAND' && index !== null) {
          setIsDrawing(true);
          paintPixel(index);
      }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      const prevPos = activePointers.current.get(e.pointerId);
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.current.size === 2) {
          // Pinch to Zoom & Pan
          setIsDrawing(false);
          const points = Array.from(activePointers.current.values()) as { x: number, y: number }[];
          const dist = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
          
          if (lastPinchDist.current !== null) {
              const delta = dist - lastPinchDist.current;
              setPixelSize(p => Math.max(2, Math.min(100, p + (delta / 10))));
          }
          lastPinchDist.current = dist;

          if (prevPos) {
              setCanvasOffset(o => ({
                  x: o.x + (e.clientX - prevPos.x),
                  y: o.y + (e.clientY - prevPos.y)
              }));
          }
          return;
      }

      if (activePointers.current.size === 1) {
          if (currentTool === 'HAND' || (e.buttons === 4)) { 
              if (prevPos) {
                  setCanvasOffset(o => ({
                      x: o.x + (e.clientX - prevPos.x),
                      y: o.y + (e.clientY - prevPos.y)
                  }));
              }
          } else if (isDrawing) {
              const rect = e.currentTarget.getBoundingClientRect();
              
              // CORRECTED MATH: Account for centered layout and offsets
              const cx = rect.width / 2;
              const cy = rect.height / 2;
              const totalGridSize = gridSize * pixelSize;
              
              // Start position of the grid relative to the container
              const gridOriginX = cx + canvasOffset.x - (totalGridSize / 2);
              const gridOriginY = cy + canvasOffset.y - (totalGridSize / 2);
              
              // Mouse position relative to the grid origin
              const mouseXInGrid = (e.clientX - rect.left) - gridOriginX;
              const mouseYInGrid = (e.clientY - rect.top) - gridOriginY;
              
              // Convert to grid index
              const gx = Math.floor(mouseXInGrid / pixelSize);
              const gy = Math.floor(mouseYInGrid / pixelSize);
              
              if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) {
                  paintPixel(gy * gridSize + gx);
              }
          }
      }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
      activePointers.current.delete(e.pointerId);
      if (activePointers.current.size < 2) {
          lastPinchDist.current = null;
      }
      setIsDrawing(false);
  };

  const handleImportToCanvas = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = gridSize; canvas.height = gridSize;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;
              ctx.imageSmoothingEnabled = false;
              ctx.drawImage(img, 0, 0, gridSize, gridSize);
              const imageData = ctx.getImageData(0, 0, gridSize, gridSize).data;
              const newPixels = [];
              for (let i = 0; i < imageData.length; i += 4) {
                  if (imageData[i+3] < 128) newPixels.push('transparent');
                  else {
                      const hex = "#" + ((1 << 24) + (imageData[i] << 16) + (imageData[i+1] << 8) + imageData[i+2]).toString(16).slice(1).toUpperCase();
                      newPixels.push(hex);
                  }
              }
              setPixels(newPixels);
          };
          img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
  };

  const handleSaveDrawing = () => {
    const canvas = document.createElement('canvas');
    canvas.width = gridSize; canvas.height = gridSize;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      pixels.forEach((color, i) => {
        if (color !== 'transparent') {
          ctx.fillStyle = color;
          ctx.fillRect(i % gridSize, Math.floor(i / gridSize), 1, 1);
        }
      });
      const url = canvas.toDataURL('image/png');
      if (editingId) {
          onDeleteAsset(editingId); 
          if (onAddAsset) onAddAsset({ id: editingId, name: drawName, url: url, type: 'image' });
      } else {
          const newAsset: Asset = { id: crypto.randomUUID(), name: drawName, url: url, type: 'image' };
          if (onAddAsset) onAddAsset(newAsset);
          if (onSelectAsset) onSelectAsset(newAsset.url);
      }
      setMode('GALLERY');
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (onAddAsset) onAddAsset({ id: crypto.randomUUID(), name: file.name.split('.')[0].substring(0, 16), url: reader.result as string, type: file.type.startsWith('audio') ? 'audio' : 'image' });
      };
      reader.readAsDataURL(file);
    }
  };

  // --- DOWNLOAD HELPER ---
  const handleDownloadAsset = (asset: Asset) => {
      const link = document.createElement('a');
      link.href = asset.url;
      link.download = `${asset.name}.${asset.type === 'audio' ? 'mp3' : 'png'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-6xl h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
        
        <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-gray-900 z-20 shrink-0">
          <div className="flex items-center space-x-3">
             {(mode !== 'GALLERY') && (
                 <button onClick={() => setMode('GALLERY')} className="p-1 rounded hover:bg-gray-800 text-gray-400"><ChevronLeft className="w-5 h-5" /></button>
             )}
             <div className="p-1.5 bg-blue-900/30 rounded-lg">
                {mode === 'GALLERY' && <Grid3x3 className="w-4 h-4 text-blue-400" />}
                {mode === 'DRAW' && <Paintbrush className="w-4 h-4 text-purple-400" />}
                {mode === 'SHEET_SLICER' && <Scissors className="w-4 h-4 text-orange-400" />}
             </div>
             <h3 className="text-sm font-bold text-white tracking-wide">
                {mode === 'GALLERY' && 'Galería de Assets'}
                {mode === 'SIZE_SELECT' && 'Configuración de Sprite'}
                {mode === 'DRAW' && `Editor ${gridSize}x${gridSize}`}
                {mode === 'SHEET_SLICER' && 'Cortar Sprite Sheet'}
             </h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {mode === 'GALLERY' && (
            <div className="flex-1 overflow-y-auto p-6 bg-gray-950">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <button onClick={handleInitNewDrawing} className="flex flex-col items-center justify-center p-6 bg-gray-900 border border-gray-800 hover:border-purple-500 rounded-xl group transition-all">
                        <div className="w-12 h-12 bg-purple-900/20 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Plus className="w-6 h-6 text-purple-400" /></div>
                        <span className="text-sm font-bold text-gray-200">Crear Sprite</span>
                    </button>
                    <button onClick={() => sheetInputRef.current?.click()} className="flex flex-col items-center justify-center p-6 bg-gray-900 border border-gray-800 hover:border-orange-500 rounded-xl group transition-all">
                        <div className="w-12 h-12 bg-orange-900/20 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Scissors className="w-6 h-6 text-orange-400" /></div>
                        <span className="text-sm font-bold text-gray-200">Cortar Sheet</span>
                        <input ref={sheetInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                    const img = new Image();
                                    img.onload = () => { setSheetImage(img); setSheetName(file.name.split('.')[0]); setMode('SHEET_SLICER'); };
                                    img.src = ev.target?.result as string;
                                };
                                reader.readAsDataURL(file);
                            }
                        }} />
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-6 bg-gray-900 border border-gray-800 hover:border-blue-500 rounded-xl group transition-all">
                        <div className="w-12 h-12 bg-blue-900/20 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><UploadCloud className="w-6 h-6 text-blue-400" /></div>
                        <span className="text-sm font-bold text-gray-200">Subir Archivo</span>
                        <input ref={fileInputRef} type="file" accept={allowedTypes.includes('audio') ? "image/*,audio/*" : "image/*"} className="hidden" onChange={handleUpload} />
                    </button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {visibleAssets.map(asset => (
                        <div key={asset.id} className="relative group bg-gray-900 border border-gray-800 rounded-lg aspect-square flex items-center justify-center overflow-hidden hover:border-blue-500 cursor-pointer shadow-md transition-all" onClick={() => onSelectAsset && onSelectAsset(asset.url)}>
                            {asset.type === 'audio' ? <Music className="w-8 h-8 text-green-500" /> : <img src={asset.url} className="w-full h-full object-contain p-2 image-pixelated" />}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDownloadAsset(asset); }} 
                                    className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white"
                                    title="Descargar"
                                >
                                    <Download className="w-3 h-3" />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); if(asset.type==='image') loadSpriteForEditing(asset); }} 
                                    className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white"
                                    title="Editar"
                                >
                                    <Paintbrush className="w-3 h-3" />
                                </button>
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        if(confirm("¿Eliminar este asset permanentemente?")) onDeleteAsset(asset.id); 
                                    }} 
                                    className="p-1.5 bg-red-600 hover:bg-red-500 rounded text-white"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {mode === 'SHEET_SLICER' && sheetImage && (
            <div className="flex-1 flex bg-gray-950 overflow-hidden">
                <div className="w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col space-y-4 shadow-xl z-10">
                    <div><label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Cols (X)</label><input type="number" value={sheetCols} onChange={e => setSheetCols(Math.max(1, parseInt(e.target.value)))} className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-white" /></div>
                    <div><label className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Rows (Y)</label><input type="number" value={sheetRows} onChange={e => setSheetRows(Math.max(1, parseInt(e.target.value)))} className="w-full bg-gray-950 border border-gray-700 rounded p-2 text-sm text-white" /></div>
                    <div className="flex-1"></div>
                    <button onClick={() => {
                        const fw = Math.floor(sheetImage.width/sheetCols);
                        const fh = Math.floor(sheetImage.height/sheetRows);
                        const canvas = document.createElement('canvas'); canvas.width = fw; canvas.height = fh;
                        const ctx = canvas.getContext('2d'); if(!ctx) return;
                        const urls: string[] = [];
                        for(let y=0; y<sheetRows; y++){
                            for(let x=0; x<sheetCols; x++){
                                ctx.clearRect(0,0,fw,fh);
                                ctx.drawImage(sheetImage, x*fw, y*fh, fw, fh, 0, 0, fw, fh);
                                const url = canvas.toDataURL('image/png');
                                const id = crypto.randomUUID();
                                if (onAddAsset) onAddAsset({ id, name: `${sheetName}_${x}_${y}`, url, type: 'image' });
                                urls.push(url);
                            }
                        }
                        if(onMultiSelectAssets) onMultiSelectAssets(urls);
                        setMode('GALLERY');
                    }} className="w-full bg-orange-600 py-3 rounded-xl font-bold flex items-center justify-center space-x-2"><Scissors className="w-5 h-5" /><span>Cortar Todo</span></button>
                </div>
                <div className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[#1a1a1a]">
                    <div className="relative border border-gray-700">
                        <img src={sheetImage.src} className="block image-pixelated" />
                        <div className="absolute inset-0 pointer-events-none" style={{ display: 'grid', gridTemplateColumns: `repeat(${sheetCols}, 1fr)`, gridTemplateRows: `repeat(${sheetRows}, 1fr)` }}>
                            {Array.from({length: sheetCols * sheetRows}).map((_, i) => <div key={i} className="border border-cyan-500/30" />)}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {mode === 'SIZE_SELECT' && (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 p-6">
                <h3 className="text-xl font-bold text-white mb-6">Selecciona Tamaño</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[16, 32, 64, 128].map(size => (
                        <button key={size} onClick={() => confirmNewDrawing(size)} className="flex flex-col items-center p-6 bg-gray-900 border border-gray-700 hover:border-purple-500 rounded-2xl transition-all">
                            <Grid3x3 className="w-8 h-8 text-gray-500 mb-2" /><span className="text-lg font-bold text-white">{size} x {size}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {mode === 'DRAW' && (
            <div className="flex-1 flex overflow-hidden bg-gray-950">
                 <div className="w-16 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 space-y-4 z-10 shrink-0">
                     <button onClick={() => setCurrentTool('BRUSH')} className={`p-3 rounded-xl ${currentTool === 'BRUSH' ? 'bg-purple-600' : 'text-gray-400'}`}><Paintbrush className="w-5 h-5" /></button>
                     <button onClick={() => setCurrentTool('BUCKET')} className={`p-3 rounded-xl ${currentTool === 'BUCKET' ? 'bg-blue-600' : 'text-gray-400'}`}><PaintBucket className="w-5 h-5" /></button>
                     <button onClick={() => setCurrentTool('ERASER')} className={`p-3 rounded-xl ${currentTool === 'ERASER' ? 'bg-red-600' : 'text-gray-400'}`}><Eraser className="w-5 h-5" /></button>
                     <button onClick={() => setCurrentTool('HAND')} className={`p-3 rounded-xl ${currentTool === 'HAND' ? 'bg-orange-600' : 'text-gray-400'}`}><Hand className="w-5 h-5" /></button>
                     <div className="h-px w-8 bg-gray-700"></div>
                     <button onClick={() => importToCanvasRef.current?.click()} className="p-3 text-gray-400 hover:text-white"><ImagePlus className="w-5 h-5" /><input ref={importToCanvasRef} type="file" accept="image/*" className="hidden" onChange={handleImportToCanvas} /></button>
                     <div className="h-px w-8 bg-gray-700"></div>
                     <button onDoubleClick={() => setShowExtendedPalette(true)} className="w-10 h-10 rounded-full border-4 border-gray-700" style={{backgroundColor: selectedColor}} />
                     <div className="h-px w-8 bg-gray-700"></div>
                     <button onClick={() => setPixelSize(p => Math.min(100, p + 5))} className="p-2 text-gray-400"><ZoomIn className="w-4 h-4" /></button>
                     <button onClick={() => setPixelSize(p => Math.max(2, p - 5))} className="p-2 text-gray-400"><ZoomOut className="w-4 h-4" /></button>
                 </div>

                 <div className="flex-1 flex flex-col relative bg-[#1a1a1a] overflow-hidden">
                      <div className="p-3 bg-gray-900 border-b border-gray-800 flex justify-center"><input type="text" value={drawName} onChange={e => setDrawName(e.target.value)} className="bg-transparent border-b border-gray-700 text-center text-sm font-bold text-white outline-none w-48" /></div>
                      <div className="flex-1 relative overflow-hidden" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
                          <div 
                              className="absolute bg-white select-none touch-none"
                              style={{
                                  display: 'grid',
                                  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                                  width: `${gridSize * pixelSize}px`,
                                  height: `${gridSize * pixelSize}px`,
                                  left: `calc(50% + ${canvasOffset.x}px)`,
                                  top: `calc(50% + ${canvasOffset.y}px)`,
                                  transform: 'translate(-50%, -50%)',
                                  backgroundImage: 'linear-gradient(45deg, #2a2a2a 25%, transparent 25%), linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #2a2a2a 75%), linear-gradient(-45deg, transparent 75%, #2a2a2a 75%)',
                                  backgroundSize: `${pixelSize * 2}px ${pixelSize * 2}px`,
                                  backgroundColor: '#111',
                                  cursor: currentTool === 'HAND' ? 'grab' : 'crosshair'
                              }}
                          >
                              {pixels.map((color, i) => (
                                  <div key={i} style={{ backgroundColor: color }} className="w-full h-full border-[0.1px] border-white/5" onPointerDown={(e) => handlePointerDown(e, i)} />
                              ))}
                          </div>
                      </div>
                      <div className="absolute bottom-6 right-6"><button onClick={handleSaveDrawing} className="bg-green-600 px-6 py-3 rounded-full font-bold shadow-lg flex items-center space-x-2 transition-transform active:scale-95"><Save className="w-5 h-5" /><span>Guardar Sprite</span></button></div>
                 </div>
            </div>
        )}

        {showExtendedPalette && (
            <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowExtendedPalette(false)}>
                <div className="bg-gray-800 border border-gray-600 p-5 rounded-2xl shadow-2xl w-[90%] max-w-md" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4"><h4 className="font-bold text-white">Paleta</h4><button onClick={() => setShowExtendedPalette(false)} className="text-gray-400"><X className="w-5 h-5"/></button></div>
                    <div className="grid grid-cols-10 gap-1 max-h-60 overflow-y-auto pr-1">
                         {EXTENDED_PALETTE.map((c, idx) => (
                             <button key={idx} style={{backgroundColor: c}} onClick={() => { setSelectedColor(c); if(currentTool === 'ERASER') setCurrentTool('BRUSH'); setShowExtendedPalette(false); }} className={`aspect-square rounded-sm border border-black/20 ${selectedColor === c ? 'ring-2 ring-white' : ''}`} />
                         ))}
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
