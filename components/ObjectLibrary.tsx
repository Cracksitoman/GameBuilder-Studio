import React from 'react';
import { ObjectType, GameObject } from '../types';
import { Plus, Box, Type, User, Ghost, Trash2, X, Grid } from './Icons';

interface ObjectLibraryProps {
  objects: GameObject[];
  selectedObjectId: string | null;
  onAddObject: (type: ObjectType) => void;
  onSelectObject: (id: string) => void;
  onDeleteObject: (id: string) => void;
  onClose?: () => void;
  className?: string;
}

export const ObjectLibrary: React.FC<ObjectLibraryProps> = ({
  objects,
  selectedObjectId,
  onAddObject,
  onSelectObject,
  onDeleteObject,
  onClose,
  className = ""
}) => {
  
  const getIcon = (type: ObjectType) => {
    switch (type) {
      case ObjectType.TEXT: return <Type className="w-4 h-4 text-yellow-400" />;
      case ObjectType.PLAYER: return <User className="w-4 h-4 text-green-400" />;
      case ObjectType.ENEMY: return <Ghost className="w-4 h-4 text-red-400" />;
      case ObjectType.TILEMAP: return <Grid className="w-4 h-4 text-cyan-400" />;
      default: return <Box className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className={`bg-gray-900 flex flex-col h-full border-t border-gray-700 shadow-2xl ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-gray-700 flex items-center justify-between bg-gray-800">
        <h2 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Añadir Objetos</h2>
        {onClose && (
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white bg-gray-700 rounded-full">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Grid of Add Buttons */}
      <div className="p-3 grid grid-cols-5 gap-2 bg-gray-900">
          <button 
            onClick={() => onAddObject(ObjectType.SPRITE)}
            className="flex flex-col items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 active:border-blue-500 transition-all group"
          >
            <Box className="w-5 h-5 text-blue-400 mb-1" />
            <span className="text-[9px] text-gray-400">Bloque</span>
          </button>
          <button 
            onClick={() => onAddObject(ObjectType.TILEMAP)}
            className="flex flex-col items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 active:border-cyan-500 transition-all group"
          >
            <Grid className="w-5 h-5 text-cyan-400 mb-1" />
            <span className="text-[9px] text-gray-400">Tilemap</span>
          </button>
          <button 
            onClick={() => onAddObject(ObjectType.TEXT)}
            className="flex flex-col items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 active:border-yellow-500 transition-all group"
          >
            <Type className="w-5 h-5 text-yellow-400 mb-1" />
            <span className="text-[9px] text-gray-400">Texto</span>
          </button>
           <button 
            onClick={() => onAddObject(ObjectType.PLAYER)}
            className="flex flex-col items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 active:border-green-500 transition-all group"
          >
            <User className="w-5 h-5 text-green-400 mb-1" />
            <span className="text-[9px] text-gray-400">Jugador</span>
          </button>
           <button 
            onClick={() => onAddObject(ObjectType.ENEMY)}
            className="flex flex-col items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 active:border-red-500 transition-all group"
          >
            <Ghost className="w-5 h-5 text-red-400 mb-1" />
            <span className="text-[9px] text-gray-400">Enemigo</span>
          </button>
      </div>

      <div className="px-3 pb-2 text-xs font-bold text-gray-500 uppercase mt-2">Lista de Objetos</div>
      
      {/* Object List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-gray-900 pb-20">
        {objects.map((obj) => (
          <div
            key={obj.id}
            onClick={() => onSelectObject(obj.id)}
            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer border ${
              selectedObjectId === obj.id
                ? 'bg-blue-900/30 border-blue-500/50 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3 truncate">
              {getIcon(obj.type)}
              <span className="font-medium truncate">{obj.name}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteObject(obj.id);
              }}
              className="p-2 rounded hover:bg-red-900/50 text-gray-400 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {objects.length === 0 && (
          <div className="text-center p-8 text-gray-600 text-sm">
            No hay objetos creados.
          </div>
        )}
      </div>
    </div>
  );
};