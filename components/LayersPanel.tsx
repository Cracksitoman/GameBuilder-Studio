
import React from 'react';
import { Layer, GameObject } from '../types';
import { Plus, Eye, EyeOff, Lock, Unlock, Trash2, ChevronUp, ChevronDown, Check, X } from './Icons';

interface LayersPanelProps {
  layers: Layer[];
  selectedObjectId: string | null;
  activeLayerId?: string | null; // NEW: Track active layer
  onSelectLayer?: (id: string) => void; // NEW: Set active layer
  objects: GameObject[];
  onAddLayer: () => void;
  onRemoveLayer: (id: string) => void;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
  onAssignObjectToLayer: (objectId: string, layerId: string) => void;
  onClose: () => void;
  className?: string;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  layers,
  selectedObjectId,
  activeLayerId,
  onSelectLayer,
  objects,
  onAddLayer,
  onRemoveLayer,
  onUpdateLayer,
  onMoveLayer,
  onAssignObjectToLayer,
  onClose,
  className = ""
}) => {
  
  // Find which layer the selected object belongs to
  const selectedObject = objects.find(o => o.id === selectedObjectId);

  return (
    <div className={`bg-gray-900 flex flex-col h-full border-t border-gray-700 shadow-2xl ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between bg-gray-800">
        <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Capas</h2>
        <div className="flex items-center space-x-2">
           <button onClick={onAddLayer} className="p-1 text-blue-400 hover:text-white bg-blue-900/30 hover:bg-blue-600 rounded">
             <Plus className="w-4 h-4" />
           </button>
           <button onClick={onClose} className="p-1 text-gray-400 hover:text-white bg-gray-700 rounded-full">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-3 bg-gray-900/50 text-[10px] text-gray-400 border-b border-gray-800">
         Selecciona una capa para editar sus objetos.
      </div>

      {/* Layers List (Reversed so top layer is visually at top) */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {[...layers].reverse().map((layer) => {
           // Highlight if this is the active layer
           const isActive = activeLayerId === layer.id;
           
           // Indicate if selected object is here
           const isObjectHere = selectedObject && selectedObject.layerId === layer.id;

           return (
            <div
              key={layer.id}
              onClick={() => {
                // Set as active layer
                if (onSelectLayer) onSelectLayer(layer.id);
                // If an object is selected, move it to this layer on click
                if (selectedObjectId && selectedObject && selectedObject.layerId !== layer.id) {
                    onAssignObjectToLayer(selectedObjectId, layer.id);
                }
              }}
              className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                isActive
                  ? 'bg-orange-900/20 border-orange-500/50' 
                  : (isObjectHere ? 'bg-blue-900/10 border-blue-500/30' : 'bg-gray-800 border-gray-700 hover:border-gray-500')
              }`}
            >
              <div className="flex items-center space-x-3 flex-1">
                {/* Visibility Toggle */}
                <button 
                  onClick={(e) => { e.stopPropagation(); onUpdateLayer(layer.id, { visible: !layer.visible }); }}
                  className={`p-1 rounded ${layer.visible ? 'text-gray-400 hover:text-white' : 'text-gray-600'}`}
                >
                  {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                
                {/* Lock Toggle */}
                 <button 
                  onClick={(e) => { e.stopPropagation(); onUpdateLayer(layer.id, { locked: !layer.locked }); }}
                  className={`p-1 rounded ${layer.locked ? 'text-yellow-500' : 'text-gray-600 hover:text-gray-400'}`}
                >
                  {layer.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </button>

                <span className={`font-medium text-sm truncate ${isActive ? 'text-orange-300' : 'text-gray-300'}`}>
                  {layer.name}
                </span>

                {isObjectHere && <span className="text-[9px] bg-blue-900 text-blue-300 px-1.5 rounded">OBJ</span>}
                {isActive && <Check className="w-3 h-3 text-orange-500 ml-auto" />}
              </div>

              <div className="flex items-center space-x-1 pl-2 border-l border-gray-700 ml-2">
                 {/* Reorder Buttons */}
                 <div className="flex flex-col">
                    <button onClick={(e) => { e.stopPropagation(); onMoveLayer(layer.id, 'up'); }} className="text-gray-500 hover:text-white">
                        <ChevronUp className="w-3 h-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onMoveLayer(layer.id, 'down'); }} className="text-gray-500 hover:text-white">
                        <ChevronDown className="w-3 h-3" />
                    </button>
                 </div>
                 
                 {/* Delete Button (prevent deleting the last layer) */}
                 {layers.length > 1 && (
                    <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if(confirm('¿Eliminar capa y sus objetos?')) onRemoveLayer(layer.id);
                    }}
                    className="p-1.5 rounded hover:bg-red-900/50 text-gray-500 hover:text-red-400 ml-1"
                    >
                    <Trash2 className="w-4 h-4" />
                    </button>
                 )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="p-2 bg-gray-800 border-t border-gray-700 text-center">
           <span className="text-[9px] text-gray-400">
               Solo puedes editar objetos en la <span className="text-orange-400 font-bold">Capa Activa</span>.
           </span>
      </div>
    </div>
  );
};
