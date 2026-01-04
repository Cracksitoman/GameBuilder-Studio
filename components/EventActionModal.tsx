
import React, { useState, useEffect } from 'react';
import { GameObject, Scene, Variable } from '../types';
import { X, Check, MousePointer2 } from './Icons';
import { CONDITION_OPTIONS, ACTION_OPTIONS } from '../logic/eventDefinitions';

interface EventActionModalProps {
  isOpen: boolean;
  mode: 'CONDITION' | 'ACTION';
  objects: GameObject[];
  scenes?: Scene[];
  initialType?: string | null;
  initialParams?: Record<string, any>;
  onClose: () => void;
  onSave: (type: string, params: Record<string, any>) => void;
  library?: GameObject[]; 
  globalVariables?: Variable[];
}

export const EventActionModal: React.FC<EventActionModalProps> = ({ 
  isOpen, mode, objects, initialType, initialParams, onClose, onSave, library = []
}) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [params, setParams] = useState<Record<string, any>>({});

  useEffect(() => {
    if (isOpen) {
      setSelectedType(initialType || null);
      setParams(initialParams || {});
    }
  }, [isOpen, initialType, initialParams]);

  if (!isOpen) return null;

  const updateParam = (key: string, value: any) => setParams(prev => ({ ...prev, [key]: value }));

  // Lista para que el usuario elija el objeto "ancla" donde aparecerá el nuevo objeto
  const allAvailableObjects = [...library, ...objects].filter((obj, index, self) => 
    index === self.findIndex((t) => (t.id === obj.id || (t.prototypeId && t.prototypeId === obj.prototypeId)))
  );

  const options = mode === 'CONDITION' ? CONDITION_OPTIONS : ACTION_OPTIONS;
  const currentOption = options.find(o => o.id === selectedType);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-3xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-800/50">
          <h3 className="text-lg font-bold text-white uppercase tracking-tighter">
            {mode === 'CONDITION' ? 'Configurar Condición' : 'Configurar Acción'}
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/3 border-r border-gray-800 overflow-y-auto p-2 bg-gray-900">
            {options.map(opt => (
              <button key={opt.id} onClick={() => { setSelectedType(opt.id); setParams({}); }} className={`w-full text-left p-3 rounded-xl flex items-start space-x-3 mb-1 transition-all ${selectedType === opt.id ? 'bg-blue-900/40 border border-blue-500/50' : 'hover:bg-gray-800 border border-transparent'}`}>
                <div className="mt-0.5">{opt.icon}</div>
                <div>
                  <div className={`text-sm font-bold ${selectedType === opt.id ? 'text-white' : 'text-gray-300'}`}>{opt.label}</div>
                  <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{opt.description}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="w-2/3 bg-gray-950 p-6 overflow-y-auto">
            {currentOption ? (
              <div className="space-y-6">
                <h4 className="text-xl font-bold text-white">{currentOption.label}</h4>
                <div className="space-y-4">
                  {selectedType === 'CREATE_OBJECT' && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Objeto a crear</label>
                        <select value={params.sourceObjectId || ''} onChange={e => updateParam('sourceObjectId', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white">
                          <option value="">-- Seleccionar de Librería --</option>
                          {library.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Punto de aparición</label>
                        <select value={params.spawnOrigin || 'SELF'} onChange={e => updateParam('spawnOrigin', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white">
                          <option value="SELF">En este mismo objeto</option>
                          <option value="SPECIFIC">En la posición de otro objeto...</option>
                        </select>
                      </div>
                      {params.spawnOrigin === 'SPECIFIC' && (
                        <div className="p-4 bg-blue-900/10 border border-blue-500/30 rounded-xl animate-in slide-in-from-top-2">
                          <label className="block text-xs font-bold text-blue-400 uppercase mb-2">Seleccionar objeto origen</label>
                          <select value={params.spawnTargetId || ''} onChange={e => updateParam('spawnTargetId', e.target.value)} className="w-full bg-gray-900 border border-blue-500/50 rounded-lg p-3 text-white">
                            <option value="">-- Seleccionar --</option>
                            {allAvailableObjects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                          </select>
                          <p className="text-[10px] text-gray-500 mt-2 italic">* El objeto se creará donde se encuentre el objeto seleccionado.</p>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedType === 'EVERY_X_SECONDS' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2">Intervalo (segundos)</label>
                      <input type="number" step="0.1" value={params.interval || 1} onChange={e => updateParam('interval', parseFloat(e.target.value))} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white"/>
                    </div>
                  )}
                  {selectedType === 'COLLISION' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2">Choca con</label>
                      <select value={params.targetId || ''} onChange={e => updateParam('targetId', e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white">
                        <option value="">-- Seleccionar Objeto --</option>
                        {allAvailableObjects.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-600">
                <MousePointer2 className="w-12 h-12 mb-4 opacity-20" />
                <p>Selecciona una opción</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-800">
          <button onClick={() => selectedType && onSave(selectedType, params)} disabled={!selectedType} className={`w-full py-4 rounded-xl font-bold transition-all ${selectedType ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}>
            <Check className="w-5 h-5 mx-auto" />
          </button>
        </div>
      </div>
    </div>
  );
};
