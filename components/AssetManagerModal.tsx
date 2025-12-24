import React, { useState, useRef, useEffect } from 'react';
import { Asset } from '../types';
import { X, UploadCloud, Paintbrush, Grid3x3, Trash2, Eraser, Save, PaintBucket, Check } from './Icons';

interface AssetManagerModalProps {
  isOpen: boolean;
  assets: Asset[];
  onClose: () => void;
  onAddAsset: (asset: Asset) => void;
  onDeleteAsset: (id: string) => void;
  onSelectAsset?: (url: string) => void;
}

const COLORS = [
  '#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
  '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA',
  '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF', '#808080'
];

const GRID_SIZE = 16;
type ToolType = 'BRUSH' | 'ERASER' | 'BUCKET';

export const AssetManagerModal: React.FC<AssetManagerModalProps> = ({
  isOpen,
  assets,
  onClose,
  onAddAsset,
  onDeleteAsset,
  onSelectAsset
}) => {
  const [mode, setMode] = useState<'GALLERY' | 'DRAW'>('GALLERY');
  
  // Drawing State
  const [pixels, setPixels] = useState<string[]>(Array(GRID_SIZE * GRID_SIZE).fill('transparent'));
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [currentTool, setCurrentTool] = useState<ToolType>('BRUSH');
  const [drawName, setDrawName] = useState('Nuevo Sprite');
  const [editingId, setEditingId] = useState<string | null>(null); // To track if we are updating an existing asset
  
  // UI State
  const [showColorPicker, setShowColorPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset when entering draw mode fresh
  const startNewDrawing = () => {
      setPixels(Array(GRID_SIZE * GRID_SIZE).fill('transparent'));
      setDrawName(`Sprite ${assets.length + 1}`);
      setEditingId(null);
      setMode('DRAW');
  };

  // Load existing sprite into grid
  const loadSpriteForEditing = (asset: Asset) => {
      const img = new Image();
      img.src = asset.url;
      img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = GRID_SIZE;
          canvas.height = GRID_SIZE;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
          ctx.drawImage(img, 0, 0, GRID_SIZE, GRID_SIZE);
          
          const imageData = ctx.getImageData(0, 0, GRID_SIZE, GRID_SIZE).data;
          const newPixels = [];
          
          for (let i = 0; i < imageData.length; i += 4) {
              const r = imageData[i];
              const g = imageData[i+1];
              const b = imageData[i+2];
              const a = imageData[i+3];
              
              if (a === 0) {
                  newPixels.push('transparent');
              } else {
                  // Convert RGB to Hex
                  const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
                  newPixels.push(hex);
              }
          }
          setPixels(newPixels);
          setDrawName(asset.name);
          setEditingId(asset.id);
          setMode('DRAW');
      };
  };

  if (!isOpen) return null;

  // --- TOOLS LOGIC ---

  const getPixelIndex = (x: number, y: number) => y * GRID_SIZE + x;

  const floodFill = (startIndex: number, targetColor: string, replacementColor: string) => {
      if (targetColor === replacementColor) return;
      
      const newPixels = [...pixels];
      const stack = [startIndex];
      
      while (stack.length > 0) {
          const idx = stack.pop()!;
          if (newPixels[idx] === targetColor) {
              newPixels[idx] = replacementColor;
              
              const x = idx % GRID_SIZE;
              const y = Math.floor(idx / GRID_SIZE);
              
              if (x > 0) stack.push(getPixelIndex(x - 1, y)); // Left
              if (x < GRID_SIZE - 1) stack.push(getPixelIndex(x + 1, y)); // Right
              if (y > 0) stack.push(getPixelIndex(x, y - 1)); // Top
              if (y < GRID_SIZE - 1) stack.push(getPixelIndex(x, y + 1)); // Bottom
          }
      }
      setPixels(newPixels);
  };

  const handlePixelAction = (index: number) => {
    if (currentTool === 'BUCKET') {
        const targetColor = pixels[index];
        floodFill(index, targetColor, selectedColor);
    } else {
        const newPixels = [...pixels];
        newPixels[index] = currentTool === 'ERASER' ? 'transparent' : selectedColor;
        setPixels(newPixels);
    }
  };

  const handlePointerEnter = (e: React.PointerEvent, index: number) => {
      if (e.buttons === 1 && currentTool !== 'BUCKET') { 
          handlePixelAction(index);
      }
  };

  // --- SAVE LOGIC ---
  const handleSaveDrawing = () => {
    const canvas = document.createElement('canvas');
    canvas.width = GRID_SIZE;
    canvas.height = GRID_SIZE;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      pixels.forEach((color, i) => {
        if (color !== 'transparent') {
          const x = i % GRID_SIZE;
          const y = Math.floor(i / GRID_SIZE);
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      });
      
      const url = canvas.toDataURL('image/png');
      
      // Check if we are updating existing or creating new
      if (editingId) {
          onDeleteAsset(editingId); 
          const updatedAsset: Asset = {
              id: editingId,
              name: drawName,
              url: url,
              type: 'image'
          };
          onAddAsset(updatedAsset);
      } else {
          const newAsset: Asset = {
            id: crypto.randomUUID(),
            name: drawName,
            url: url,
            type: 'image'
          };
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
      reader.onloadend = () => {
        onAddAsset({
          id: crypto.randomUUID(),
          name: file.name.split('.')[0].substring(0, 12),
          url: reader.result as string,
          type: 'image'
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-800 bg-gray-800/50">
          <div className="flex items-center space-x-3">
             <div className="p-1.5 bg-blue-900/30 rounded-lg">
                {mode === 'GALLERY' ? <Grid3x3 className="w-4 h-4 text-blue-400" /> : <Paintbrush className="w-4 h-4 text-purple-400" />}
             </div>
             <div>
                <h3 className="text-sm font-bold text-white">
                    {mode === 'GALLERY' ? 'Sprites' : 'Pixel Art'}
                </h3>
             </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* --- GALLERY MODE --- */}
        {mode === 'GALLERY' && (
            <div className="flex-1 overflow-y-auto p-4">
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <button 
                       onClick={startNewDrawing}
                       className="flex flex-col items-center justify-center p-4 bg-purple-900/20 border border-purple-500/30 hover:bg-purple-900/40 rounded-xl transition-all group"
                    >
                        <Paintbrush className="w-6 h-6 text-purple-400 mb-2" />
                        <span className="text-xs font-bold text-purple-200">Crear Nuevo</span>
                    </button>

                    <button 
                       onClick={() => fileInputRef.current?.click()}
                       className="flex flex-col items-center justify-center p-4 bg-blue-900/20 border border-blue-500/30 hover:bg-blue-900/40 rounded-xl transition-all group"
                    >
                        <UploadCloud className="w-6 h-6 text-blue-400 mb-2" />
                        <span className="text-xs font-bold text-blue-200">Subir Imagen</span>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                    </button>
                </div>

                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mis Sprites ({assets.length})</div>

                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                    {assets.map(asset => (
                        <div 
                           key={asset.id} 
                           className="relative group bg-gray-950 border border-gray-800 rounded-lg aspect-square flex items-center justify-center overflow-hidden hover:border-blue-500 cursor-pointer"
                           onClick={() => onSelectAsset && onSelectAsset(asset.url)}
                           onDoubleClick={() => loadSpriteForEditing(asset)}
                        >
                            <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)', backgroundSize: '10px 10px'}}></div>
                            
                            <img src={asset.url} alt={asset.name} className="relative z-10 w-full h-full object-contain p-2 image-pixelated" />
                            
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex gap-1 z-20">
                                <button 
                                onClick={(e) => { e.stopPropagation(); loadSpriteForEditing(asset); }}
                                className="p-1 bg-blue-600 hover:bg-blue-500 text-white rounded shadow-sm"
                                >
                                    <Paintbrush className="w-3 h-3" />
                                </button>
                                <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteAsset(asset.id); }}
                                className="p-1 bg-red-600 hover:bg-red-500 text-white rounded shadow-sm"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- DRAW MODE (Horizontal Layout) --- */}
        {mode === 'DRAW' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                 
                 {/* HORIZONTAL TOOLBAR */}
                 <div className="w-full bg-gray-950 p-2 border-b border-gray-800 flex items-center justify-between z-20 shrink-0 overflow-x-auto">
                     
                     {/* Tools Group */}
                     <div className="flex items-center space-x-2">
                         <button 
                           onClick={() => setCurrentTool('BRUSH')}
                           className={`p-2 rounded-lg transition-all ${currentTool === 'BRUSH' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'}`}
                           title="Pincel"
                         >
                            <Paintbrush className="w-5 h-5" />
                         </button>
                         <button 
                           onClick={() => setCurrentTool('BUCKET')}
                           className={`p-2 rounded-lg transition-all ${currentTool === 'BUCKET' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'}`}
                           title="Relleno"
                         >
                            <PaintBucket className="w-5 h-5" />
                         </button>
                         <button 
                           onClick={() => setCurrentTool('ERASER')}
                           className={`p-2 rounded-lg transition-all ${currentTool === 'ERASER' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800'}`}
                           title="Borrador"
                         >
                            <Eraser className="w-5 h-5" />
                         </button>
                     </div>

                     <div className="h-6 w-px bg-gray-800 mx-2"></div>

                     {/* Color Selector */}
                     <div className="relative flex items-center">
                         <button 
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className="w-8 h-8 rounded-lg border-2 border-gray-600 shadow-inner"
                            style={{backgroundColor: selectedColor}}
                         />
                         
                         {/* POPUP COLOR PICKER (Re-positioned for horizontal bar) */}
                         {showColorPicker && (
                             <div className="absolute right-0 top-full mt-2 bg-gray-900 border border-gray-600 p-3 rounded-xl shadow-2xl w-64 z-50 animate-in zoom-in-95 duration-200">
                                 <div className="flex justify-between items-center mb-2">
                                     <span className="text-xs font-bold text-gray-300">Paleta</span>
                                     <button onClick={() => setShowColorPicker(false)}><X className="w-4 h-4 text-gray-500" /></button>
                                 </div>
                                 
                                 {/* Presets */}
                                 <div className="grid grid-cols-6 gap-1.5 mb-3">
                                     {COLORS.map(c => (
                                         <button
                                            key={c}
                                            style={{backgroundColor: c}}
                                            onClick={() => { setSelectedColor(c); if(currentTool === 'ERASER') setCurrentTool('BRUSH'); }}
                                            className={`w-7 h-7 rounded hover:scale-110 transition-transform ${selectedColor === c ? 'border-2 border-white' : 'border border-gray-700'}`}
                                         />
                                     ))}
                                 </div>

                                 {/* Custom Input */}
                                 <div className="pt-2 border-t border-gray-700">
                                     <div className="flex items-center space-x-2">
                                         <input 
                                            type="color" 
                                            value={selectedColor} 
                                            onChange={(e) => { setSelectedColor(e.target.value); if(currentTool === 'ERASER') setCurrentTool('BRUSH'); }} 
                                            className="h-8 w-8 rounded cursor-pointer bg-transparent border-0 p-0" 
                                         />
                                         <input 
                                            type="text" 
                                            value={selectedColor.toUpperCase()} 
                                            onChange={(e) => { setSelectedColor(e.target.value); if(currentTool === 'ERASER') setCurrentTool('BRUSH'); }}
                                            className="flex-1 bg-gray-950 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                                         />
                                     </div>
                                 </div>
                             </div>
                         )}
                     </div>

                 </div>

                 {/* Canvas Area (Flex Grow) */}
                 <div className="flex-1 bg-gray-800 relative overflow-hidden flex flex-col">
                      
                      {/* Name Input Bar */}
                      <div className="p-2 bg-gray-900/50 border-b border-gray-800 flex justify-center shrink-0">
                          <input 
                             type="text" 
                             value={drawName} 
                             onChange={e => setDrawName(e.target.value)}
                             className="bg-transparent border-b border-gray-600 text-center text-sm text-white focus:border-blue-500 outline-none px-2 w-full max-w-xs"
                             placeholder="Nombre del Sprite"
                          />
                      </div>

                      {/* The Canvas Center Wrapper */}
                      <div className="flex-1 flex items-center justify-center p-4 bg-gray-900 overflow-auto touch-manipulation">
                          <div 
                            className="bg-white shadow-2xl relative select-none touch-none"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                                width: 'min(90vw, 400px)', // Very responsive max width
                                aspectRatio: '1/1',
                                border: '1px solid #333',
                                backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                                backgroundSize: '20px 20px',
                                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                            }}
                            onPointerLeave={() => {}} // Stop drawing
                          >
                             {pixels.map((color, i) => (
                                 <div 
                                   key={i}
                                   style={{ backgroundColor: color }}
                                   className={`w-full h-full border-[0.5px] border-black/5 ${currentTool === 'BUCKET' ? 'cursor-crosshair' : 'cursor-pointer'} hover:border-white/50`}
                                   onPointerDown={() => handlePixelAction(i)}
                                   onPointerEnter={(e) => handlePointerEnter(e, i)}
                                 />
                             ))}
                          </div>
                      </div>
                 </div>
            </div>
        )}

        {/* Footer */}
        <div className="p-3 border-t border-gray-800 bg-gray-800/30 flex justify-between items-center z-10 shrink-0">
             {mode === 'DRAW' ? (
                 <>
                    <button onClick={() => setMode('GALLERY')} className="text-xs text-gray-400 hover:text-white px-4">Cancelar</button>
                    <button 
                       onClick={handleSaveDrawing}
                       className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center shadow-lg transform active:scale-95 transition-transform"
                    >
                        <Save className="w-3 h-3 mr-2" /> 
                        {editingId ? 'Actualizar' : 'Guardar'}
                    </button>
                 </>
             ) : (
                 <button onClick={onClose} className="text-sm text-gray-400 hover:text-white mx-auto">Cerrar</button>
             )}
        </div>

      </div>
    </div>
  );
};