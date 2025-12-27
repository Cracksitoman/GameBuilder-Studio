
import React, { useState, useEffect } from 'react';
import { X, Smartphone, ArrowRight, ArrowUp, ArrowDown, Settings, ChevronLeft, ChevronRight, Check, Menu } from './Icons';
import { MobileControlsConfig, CanvasConfig } from '../types';

interface MobileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MobileControlsConfig;
  onSave: (newConfig: MobileControlsConfig) => void;
  canvasConfig: CanvasConfig;
}

export const MobileSettingsModal: React.FC<MobileSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  canvasConfig
}) => {
  const [currentConfig, setCurrentConfig] = useState<MobileControlsConfig>(config);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setCurrentConfig(config || {
          enabled: true,
          joystickX: 15, joystickY: 80, joystickSize: 150,
          buttonX: 85, buttonY: 80, buttonSize: 100,
          opacity: 0.5, color: '#ffffff'
      });
      // Always collapse on load for mobile to show the game area first
      if (window.innerWidth < 768) {
          setIsPanelOpen(false);
      }
    }
  }, [isOpen, config]);

  const handleChange = (key: keyof MobileControlsConfig, value: any) => {
      setCurrentConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
      onSave(currentConfig);
      onClose();
  };

  if (!isOpen) return null;

  const isLandscape = canvasConfig.mode === 'LANDSCAPE';

  return (
    <div className="fixed inset-0 z-[150] bg-black">
      
      {/* HEADER / TOOLBAR (Always Visible but unobtrusive) */}
      <div className="absolute top-0 left-0 right-0 z-20 flex justify-between items-start p-4 pointer-events-none">
          <div className={`pointer-events-auto transition-all duration-300 ${isPanelOpen ? 'opacity-0' : 'opacity-100'}`}>
              <button 
                onClick={() => setIsPanelOpen(true)} 
                className="bg-gray-800/80 backdrop-blur text-white p-3 rounded-xl border border-gray-600 shadow-lg flex items-center space-x-2"
              >
                  <Settings className="w-6 h-6" />
                  <span className="font-bold text-xs">Editar</span>
              </button>
          </div>

          <div className="flex space-x-3 pointer-events-auto">
              <button onClick={handleSave} className="p-3 bg-green-600 hover:bg-green-500 text-white rounded-full shadow-lg border border-green-400">
                  <Check className="w-6 h-6" />
              </button>
              <button onClick={onClose} className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-lg border border-red-400">
                  <X className="w-6 h-6" />
              </button>
          </div>
      </div>

      {/* MAIN PREVIEW AREA (FULLSCREEN) */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[#111] z-0">
            <div 
                className="relative border border-dashed border-gray-700 bg-gray-900/50 shadow-2xl"
                style={{
                    aspectRatio: `${isLandscape ? '16/9' : '9/16'}`,
                    width: isLandscape ? '100%' : 'auto',
                    height: isLandscape ? 'auto' : '100%',
                    maxHeight: '100dvh',
                    maxWidth: '100vw'
                }}
            >
                <div className="absolute inset-0 flex items-center justify-center text-gray-700 font-bold text-2xl md:text-4xl opacity-20 pointer-events-none select-none">
                    VISTA PREVIA
                </div>

                {/* VIRTUAL JOYSTICK PREVIEW */}
                {currentConfig.enabled && (
                    <>
                        <div 
                            className="absolute rounded-full border-4 flex items-center justify-center touch-none select-none"
                            style={{
                                left: `${currentConfig.joystickX}%`,
                                top: `${currentConfig.joystickY}%`,
                                width: `${currentConfig.joystickSize}px`,
                                height: `${currentConfig.joystickSize}px`,
                                transform: 'translate(-50%, -50%)',
                                opacity: currentConfig.opacity,
                                borderColor: currentConfig.color,
                                backgroundColor: `${currentConfig.color}20`,
                                zIndex: 10,
                                userSelect: 'none'
                            }}
                        >
                            <div className="w-1/3 h-1/3 rounded-full bg-current" style={{color: currentConfig.color}}></div>
                            <ArrowUp className="absolute top-2 w-6 h-6" style={{color: currentConfig.color}} />
                            <ArrowDown className="absolute bottom-2 w-6 h-6" style={{color: currentConfig.color}} />
                            <ArrowRight className="absolute left-2 w-6 h-6 rotate-180" style={{color: currentConfig.color}} />
                            <ArrowRight className="absolute right-2 w-6 h-6" style={{color: currentConfig.color}} />
                        </div>

                        <div 
                            className="absolute rounded-full border-4 flex items-center justify-center font-bold text-3xl touch-none select-none"
                            style={{
                                left: `${currentConfig.buttonX}%`,
                                top: `${currentConfig.buttonY}%`,
                                width: `${currentConfig.buttonSize}px`,
                                height: `${currentConfig.buttonSize}px`,
                                transform: 'translate(-50%, -50%)',
                                opacity: currentConfig.opacity,
                                borderColor: currentConfig.color,
                                color: currentConfig.color,
                                backgroundColor: `${currentConfig.color}20`,
                                zIndex: 10,
                                userSelect: 'none'
                            }}
                        >
                            A
                        </div>
                    </>
                )}
            </div>
      </div>

      {/* DRAWER SETTINGS PANEL */}
      <div 
        className={`absolute top-0 bottom-0 left-0 w-full sm:w-80 bg-gray-900/95 backdrop-blur-xl border-r border-gray-700 shadow-2xl transform transition-transform duration-300 ease-out z-30 flex flex-col ${isPanelOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
          <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900">
              <div className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-blue-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Ajustes Táctiles</h2>
              </div>
              <button onClick={() => setIsPanelOpen(false)} className="p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700">
                  <ChevronLeft className="w-6 h-6" />
              </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-20">
                
                <div className="flex items-center justify-between bg-gray-800 p-4 rounded-xl border border-gray-700">
                    <label className="text-sm font-bold text-white">Activar Controles</label>
                    <div className="relative inline-block w-12 mr-2 align-middle select-none">
                        <input type="checkbox" checked={currentConfig.enabled} onChange={e => handleChange('enabled', e.target.checked)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-green-500"/>
                        <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${currentConfig.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></label>
                    </div>
                </div>

                {currentConfig.enabled && (
                    <>
                        {/* JOYSTICK */}
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 space-y-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <h4 className="text-sm font-bold text-gray-200">Joystick</h4>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-2">Posición X <span className="text-white">{currentConfig.joystickX}%</span></div>
                                <input type="range" min="0" max="100" value={currentConfig.joystickX} onChange={e => handleChange('joystickX', parseInt(e.target.value))} className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-2">Posición Y <span className="text-white">{currentConfig.joystickY}%</span></div>
                                <input type="range" min="0" max="100" value={currentConfig.joystickY} onChange={e => handleChange('joystickY', parseInt(e.target.value))} className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-2">Tamaño <span className="text-white">{currentConfig.joystickSize}px</span></div>
                                <input type="range" min="50" max="400" value={currentConfig.joystickSize} onChange={e => handleChange('joystickSize', parseInt(e.target.value))} className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"/>
                            </div>
                        </div>

                        {/* BUTTON */}
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 space-y-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <h4 className="text-sm font-bold text-gray-200">Botón Acción</h4>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-2">Posición X <span className="text-white">{currentConfig.buttonX}%</span></div>
                                <input type="range" min="0" max="100" value={currentConfig.buttonX} onChange={e => handleChange('buttonX', parseInt(e.target.value))} className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"/>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-2">Posición Y <span className="text-white">{currentConfig.buttonY}%</span></div>
                                <input type="range" min="0" max="100" value={currentConfig.buttonY} onChange={e => handleChange('buttonY', parseInt(e.target.value))} className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"/>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-2">Tamaño <span className="text-white">{currentConfig.buttonSize}px</span></div>
                                <input type="range" min="40" max="300" value={currentConfig.buttonSize} onChange={e => handleChange('buttonSize', parseInt(e.target.value))} className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"/>
                            </div>
                        </div>

                        {/* VISUALS */}
                        <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 space-y-4">
                            <h4 className="text-sm font-bold text-gray-200 mb-2">Estilo Visual</h4>
                            <div>
                                <div className="flex justify-between text-xs text-gray-400 mb-2">Opacidad</div>
                                <input type="range" min="0.1" max="1" step="0.1" value={currentConfig.opacity} onChange={e => handleChange('opacity', parseFloat(e.target.value))} className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"/>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-400">Color Base</span>
                                <input type="color" value={currentConfig.color} onChange={e => handleChange('color', e.target.value)} className="w-10 h-10 bg-transparent border-0 p-0 cursor-pointer rounded-lg"/>
                            </div>
                        </div>
                    </>
                )}
          </div>
      </div>
    </div>
  );
};
