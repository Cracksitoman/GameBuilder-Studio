import React, { useState, useRef, useEffect } from 'react';
import { Asset } from '../types';
import { X, UploadCloud, Paintbrush, Grid3x3, Trash2, Eraser, Save, PaintBucket, Check, Palette, ChevronLeft, Download, ZoomIn, ZoomOut, Plus, Maximize, Volume2, Music, Scissors, ImagePlus, Hand, Star, MousePointerSquareDashed, Undo, Redo } from './Icons';

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

type ToolType = 'BRUSH' | 'ERASER' | 'BUCKET' | 'HAND' | 'SELECT';
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
  const [favorites, setFavorites] = useState<string[]>(['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']);
  
  // History State
  const [past, setPast] = useState<string[][]>([]);
  const [future, setFuture] = useState<string[][]>([]);

  // Selection State
  const [selection, setSelection] = useState<{ x1: number, y1: number, x2: number, y2: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isMovingSelection, setIsMovingSelection] = useState(false);
  const [floatingPixels, setFloatingPixels] = useState<{ color: string, dx: number, dy: number }[] | null>(null);
  const [selectionOffset, setSelectionOffset] = useState({ x: 0, y: 0 });

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
          setSelection(null);
          setFloatingPixels(null);
          setPast([]);
          setFuture([]);
      }
  }, [isOpen, initialMode]);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (mode !== 'DRAW' || !isOpen) return;
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            performUndo();
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
            e.preventDefault();
            performRedo();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, isOpen, past, future, pixels]);

  const visibleAssets = assets.filter(a => allowedTypes.includes(a.type));

  const recordHistory = () => {
    setPast(prev => [...prev, [...pixels]]);
    setFuture([]);
  };

  const performUndo = () => {
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    setFuture(f => [[...pixels], ...f]);
    setPixels(prev);
    setPast(p => p.slice(0, p.length - 1));
  };

  const performRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setPast(p => [...p, [...pixels]]);
    setPixels(next);
    setFuture(f => f.slice(1));
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
      setSelection(null);
      setFloatingPixels(null);
      setPast([]);
      setFuture([]);
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
          setSelection(null);
          setFloatingPixels(null);
          setPast([]);
          setFuture([]);
      };
  };

  const commitFloatingPixels = () => {
    if (!floatingPixels || !selection) return;
    recordHistory();
    const newPixels = [...pixels];
    const sx = Math.min(selection.x1, selection.x2);
    const sy = Math.min(selection.y1, selection.y2);
    floatingPixels.forEach(p => {
        const nx = sx + p.dx;
        const ny = sy + p.dy;
        if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
            newPixels[ny * gridSize + nx] = p.color;
        }
    });
    setPixels(newPixels);
    setFloatingPixels(null);
    setSelection(null);
  };

  const paintPixel = (index: number, forceColor?: string) => {
    if (index < 0 || index >= pixels.length) return;
    if (currentTool === 'SELECT') return;

    if (currentTool === 'BUCKET') {
        const targetColor = pixels[index];
        const newPixels = [...pixels];
        const stack = [index];
        const visited = new Set<number>();
        const replacement = forceColor || selectedColor;
        if (targetColor === replacement) return;
        recordHistory();
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
        const newColor = currentTool === 'ERASER' ? 'transparent' : (forceColor || selectedColor);
        if (pixels[index] === newColor) return;
        // Optimization: only record history on the start of a stroke (handled in handlePointerDown)
        const newPixels = [...pixels];
        newPixels[index] = newColor;
        setPixels(newPixels);
    }
  };

  const toggleFavorite = (color: string) => {
    if (favorites.includes(color)) {
        setFavorites(f => f.filter(c => c !== color));
    } else {
        setFavorites(f => [...f, color]);
    }
  };

  const handlePointerDown = (e: React.PointerEvent, index: number | null) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      
      const rect = e.currentTarget.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const totalGridSize = gridSize * pixelSize;
      const gridOriginX = cx + canvasOffset.x - (totalGridSize / 2);
      const gridOriginY = cy + canvasOffset.y - (totalGridSize / 2);
      const mouseXInGrid = (e.clientX - rect.left) - gridOriginX;
      const mouseYInGrid = (e.clientY - rect.top) - gridOriginY;
      const gx = Math.floor(mouseXInGrid / pixelSize);
      const gy = Math.floor(mouseYInGrid / pixelSize);

      if (activePointers.current.size === 1) {
          if (currentTool === 'SELECT') {
              if (selection && gx >= Math.min(selection.x1, selection.x2) && gx <= Math.max(selection.x1, selection.x2) && gy >= Math.min(selection.y1, selection.y2) && gy <= Math.max(selection.y1, selection.y2)) {
                  // Start moving existing selection
                  if (!floatingPixels) {
                      const data = [];
                      const sx = Math.min(selection.x1, selection.x2);
                      const sy = Math.min(selection.y1, selection.y2);
                      const ex = Math.max(selection.x1, selection.x2);
                      const ey = Math.max(selection.y1, selection.y2);
                      const newPixels = [...pixels];
                      recordHistory();
                      for(let j = sy; j <= ey; j++) {
                          for(let i = sx; i <= ex; i++) {
                              const idx = j * gridSize + i;
                              data.push({ color: pixels[idx], dx: i - sx, dy: j - sy });
                              newPixels[idx] = 'transparent';
                          }
                      }
                      setPixels(newPixels);
                      setFloatingPixels(data);
                  }
                  setIsMovingSelection(true);
                  setSelectionOffset({ x: gx, y: gy });
              } else {
                  // Start new selection
                  if (floatingPixels) commitFloatingPixels();
                  setIsSelecting(true);
                  setSelection({ x1: gx, y1: gy, x2: gx, y2: gy });
              }
              return;
          }
          
          if (currentTool !== 'HAND' && index !== null) {
              if (currentTool !== 'BUCKET') recordHistory(); // Bucket records its own to handle empty fills
              setIsDrawing(true);
              paintPixel(index);
          }
      }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
      const prevPos = activePointers.current.get(e.pointerId);
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.current.size === 2) {
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
          const rect = e.currentTarget.getBoundingClientRect();
          const cx = rect.width / 2;
          const cy = rect.height / 2;
          const totalGridSize = gridSize * pixelSize;
          const gridOriginX = cx + canvasOffset.x - (totalGridSize / 2);
          const gridOriginY = cy + canvasOffset.y - (totalGridSize / 2);
          const mouseXInGrid = (e.clientX - rect.left) - gridOriginX;
          const mouseYInGrid = (e.clientY - rect.top) - gridOriginY;
          const gx = Math.floor(mouseXInGrid / pixelSize);
          const gy = Math.floor(mouseYInGrid / pixelSize);

          if (isSelecting && selection) {
              setSelection({ ...selection, x2: gx, y2: gy });
              return;
          }

          if (isMovingSelection && selection) {
              const dx = gx - selectionOffset.x;
              const dy = gy - selectionOffset.y;
              setSelection({
                  x1: selection.x1 + dx,
                  y1: selection.y1 + dy,
                  x2: selection.x2 + dx,
                  y2: selection.y2 + dy
              });
              setSelectionOffset({ x: gx, y: gy });
              return;
          }

          if (currentTool === 'HAND' || (e.buttons === 4)) { 
              if (prevPos) {
                  setCanvasOffset(o => ({
                      x: o.x + (e.clientX - prevPos.x),
                      y: o.y + (e.clientY - prevPos.y)
                  }));
              }
          } else if (isDrawing) {
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
      setIsSelecting(false);
      setIsMovingSelection(false);
  };

  const handleImportToCanvas = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
              recordHistory();
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
    if (floatingPixels) commitFloatingPixels();
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
        if (onAddAsset) onAddAsset({ id: crypto.randomUUID(), name: file.name.split('.')[0].substring(0, 16), url: reader.result as string, type: file.type.startsWith('audio') || file.name.endsWith('.mp3') || file.name.endsWith('.wav') ? 'audio' : 'image' });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ''; // Reset input to allow re-uploading same file if needed
  };

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
                        <input ref={fileInputRef} type="file" accept="image/*,audio/*,.mp3,.wav,.ogg" className="hidden" onChange={handleUpload} />
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
                                {asset.type === 'image' && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); loadSpriteForEditing(asset); }} 
                                    className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white"
                                    title="Editar"
                                >
                                    <Paintbrush className="w-3 h-3" />
                                </button>
                                )}
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
                 <div className="w-20 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-4 space-y-4 z-10 shrink-0">
                     <button onClick={() => setCurrentTool('BRUSH')} className={`p-3 rounded-xl transition-colors ${currentTool === 'BRUSH' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`} title="Pincel"><Paintbrush className="w-5 h-5" /></button>
                     <button onClick={() => setCurrentTool('BUCKET')} className={`p-3 rounded-xl transition-colors ${currentTool === 'BUCKET' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`} title="Cubo"><PaintBucket className="w-5 h-5" /></button>
                     <button onClick={() => setCurrentTool('SELECT')} className={`p-3 rounded-xl transition-colors ${currentTool === 'SELECT' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`} title="Seleccionar"><MousePointerSquareDashed className="w-5 h-5" /></button>
                     <button onClick={() => setCurrentTool('ERASER')} className={`p-3 rounded-xl transition-colors ${currentTool === 'ERASER' ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`} title="Borrador"><Eraser className="w-5 h-5" /></button>
                     <button onClick={() => setCurrentTool('HAND')} className={`p-3 rounded-xl transition-colors ${currentTool === 'HAND' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-800'}`} title="Mover Lienzo"><Hand className="w-5 h-5" /></button>
                     
                     <div className="h-px w-8 bg-gray-700"></div>
                     <div className="flex flex-col space-y-2">
                        <button onClick={performUndo} disabled={past.length === 0} className={`p-2 rounded ${past.length > 0 ? 'text-white hover:bg-gray-800' : 'text-gray-600'}`} title="Deshacer (Ctrl+Z)"><Undo className="w-5 h-5" /></button>
                        <button onClick={performRedo} disabled={future.length === 0} className={`p-2 rounded ${future.length > 0 ? 'text-white hover:bg-gray-800' : 'text-gray-600'}`} title="Rehacer (Ctrl+Y)"><Redo className="w-5 h-5" /></button>
                     </div>

                     <div className="h-px w-8 bg-gray-700"></div>
                     <button onClick={() => importToCanvasRef.current?.click()} className="p-3 text-gray-400 hover:text-white" title="Importar Imagen"><ImagePlus className="w-5 h-5" /><input ref={importToCanvasRef} type="file" accept="image/*" className="hidden" onChange={handleImportToCanvas} /></button>
                     
                     <div className="h-px w-8 bg-gray-700"></div>
                     <div className="flex flex-col items-center space-y-2">
                        <div className="relative group">
                            <input type="color" value={selectedColor} onChange={e => setSelectedColor(e.target.value)} className="w-10 h-10 rounded-full border-2 border-gray-700 bg-transparent cursor-pointer overflow-hidden p-0" />
                        </div>
                        <input type="text" value={selectedColor.toUpperCase()} onChange={e => setSelectedColor(e.target.value)} className="w-16 bg-gray-800 border border-gray-700 rounded text-[9px] text-white text-center py-1 font-mono outline-none focus:border-blue-500" />
                        <button onClick={() => toggleFavorite(selectedColor)} className={`p-1.5 rounded transition-colors ${favorites.includes(selectedColor) ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-600 hover:text-gray-400'}`}>
                            <Star className="w-4 h-4 fill-current" />
                        </button>
                     </div>

                     <div className="h-px w-8 bg-gray-700"></div>
                     <button onClick={() => setPixelSize(p => Math.min(100, p + 5))} className="p-2 text-gray-400 hover:text-white"><ZoomIn className="w-4 h-4" /></button>
                     <button onClick={() => setPixelSize(p => Math.max(2, p - 5))} className="p-2 text-gray-400 hover:text-white"><ZoomOut className="w-4 h-4" /></button>
                 </div>

                 <div className="flex-1 flex flex-col relative bg-[#1a1a1a] overflow-hidden">
                      <div className="p-3 bg-gray-900 border-b border-gray-800 flex justify-between items-center px-6">
                        <input type="text" value={drawName} onChange={e => setDrawName(e.target.value)} className="bg-transparent border-b border-gray-700 text-sm font-bold text-white outline-none w-48 focus:border-blue-500 transition-colors" />
                        
                        <div className="flex items-center space-x-2">
                            {selection && (
                                <button onClick={() => { if(floatingPixels) commitFloatingPixels(); else setSelection(null); }} className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-[10px] text-gray-300 rounded border border-gray-700">Deshacer Selección</button>
                            )}
                            <div className="text-[10px] text-gray-500 font-mono">Zoom: {Math.round((pixelSize/20)*100)}%</div>
                        </div>
                      </div>

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
                                  cursor: currentTool === 'HAND' ? 'grab' : (currentTool === 'SELECT' ? (selection ? 'move' : 'crosshair') : 'crosshair')
                              }}
                          >
                              {pixels.map((color, i) => (
                                  <div key={i} style={{ backgroundColor: color }} className="w-full h-full border-[0.1px] border-white/5" onPointerDown={(e) => handlePointerDown(e, i)} />
                              ))}

                              {/* Selection Overlay */}
                              {selection && (
                                  <div 
                                    className="absolute border-2 border-dashed border-blue-400 pointer-events-none z-10"
                                    style={{
                                        left: Math.min(selection.x1, selection.x2) * pixelSize,
                                        top: Math.min(selection.y1, selection.y2) * pixelSize,
                                        width: (Math.abs(selection.x1 - selection.x2) + 1) * pixelSize,
                                        height: (Math.abs(selection.y1 - selection.y2) + 1) * pixelSize,
                                        backgroundColor: 'rgba(59, 130, 246, 0.1)'
                                    }}
                                  >
                                      {/* Floating Pixels during Move */}
                                      {floatingPixels && (
                                          <div className="relative w-full h-full">
                                              {floatingPixels.map((p, idx) => (
                                                  <div key={idx} style={{ 
                                                      position: 'absolute',
                                                      left: p.dx * pixelSize,
                                                      top: p.dy * pixelSize,
                                                      width: pixelSize,
                                                      height: pixelSize,
                                                      backgroundColor: p.color
                                                  }} />
                                              ))}
                                          </div>
                                      )}
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* Favorites & Palette Bar */}
                      <div className="bg-gray-900 border-t border-gray-800 p-2 overflow-x-auto flex items-center space-x-4 shrink-0">
                          <div className="flex items-center space-x-1 shrink-0 px-2 border-r border-gray-800 mr-2">
                             <Star className="w-3 h-3 text-yellow-500 mr-1" />
                             {favorites.map((c, i) => (
                                 <button key={i} style={{backgroundColor: c}} onClick={() => setSelectedColor(c)} className={`w-6 h-6 rounded-full border border-black/20 ${selectedColor === c ? 'ring-2 ring-white' : ''}`} />
                             ))}
                          </div>
                          <div className="flex items-center space-x-1">
                             <Palette className="w-3 h-3 text-gray-500 mr-1" />
                             {EXTENDED_PALETTE.slice(0, 30).map((c, i) => (
                                 <button key={i} style={{backgroundColor: c}} onClick={() => setSelectedColor(c)} className={`w-5 h-5 rounded-sm border border-black/20 ${selectedColor === c ? 'ring-1 ring-white' : ''}`} />
                             ))}
                             <button onClick={() => setShowExtendedPalette(true)} className="px-2 text-[10px] text-blue-400 hover:text-white transition-colors">Ver Más...</button>
                          </div>
                      </div>

                      <div className="absolute bottom-16 right-6 flex space-x-3">
                          <button onClick={handleSaveDrawing} className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded-full font-bold shadow-xl flex items-center space-x-2 transition-all transform active:scale-95"><Save className="w-5 h-5" /><span>Guardar Sprite</span></button>
                      </div>
                 </div>
            </div>
        )}

        {showExtendedPalette && (
            <div className="absolute inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center" onClick={() => setShowExtendedPalette(false)}>
                <div className="bg-gray-800 border border-gray-600 p-5 rounded-2xl shadow-2xl w-[90%] max-w-md" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4"><h4 className="font-bold text-white">Paleta Completa</h4><button onClick={() => setShowExtendedPalette(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button></div>
                    <div className="grid grid-cols-10 gap-1 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                         {EXTENDED_PALETTE.map((c, idx) => (
                             <button key={idx} style={{backgroundColor: c}} onClick={() => { setSelectedColor(c); if(currentTool === 'ERASER') setCurrentTool('BRUSH'); setShowExtendedPalette(false); }} className={`aspect-square rounded-sm border border-black/20 ${selectedColor === c ? 'ring-2 ring-white' : ''} hover:scale-110 transition-transform`} />
                         ))}
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};