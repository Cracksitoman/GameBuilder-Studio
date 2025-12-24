import React, { useRef } from 'react';
import { Rocket, FileUp, Sparkles, Cpu, Code2, Paintbrush, MonitorSmartphone, Plus } from './Icons';

interface StartScreenProps {
  onNewProject: () => void;
  onLoadProject: (file: File) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onNewProject, onLoadProject }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadProject(file);
    }
    // Critical: Reset value to allow selecting the same file again or if selection failed
    e.target.value = '';
  };

  const onUploadClick = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex items-center justify-center relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-950 to-gray-950"></div>
         <div className="absolute inset-0 opacity-20" 
              style={{backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '40px 40px'}}>
         </div>
      </div>

      <div className="relative z-10 w-full max-w-6xl p-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left Column: Hero & Actions */}
        <div className="space-y-8 animate-in slide-in-from-left-10 duration-700 fade-in">
           <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 bg-blue-900/30 border border-blue-500/30 rounded-full px-3 py-1 text-xs font-bold text-blue-300 mb-2">
                 <Sparkles className="w-3 h-3" />
                 <span>v2.2 - Sistema de Archivos Mejorado</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500">
                 GameBuilder
                 <span className="block text-blue-500 text-3xl md:text-5xl">Studio Android</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-md">
                 Crea juegos 2D profesionales directamente en tu navegador o móvil. Sin código complejo.
              </p>
           </div>

           <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={onNewProject}
                className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-lg shadow-xl shadow-blue-900/20 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center overflow-hidden"
              >
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                 <Plus className="w-6 h-6 mr-2" />
                 Nuevo Proyecto
              </button>

              <button 
                onClick={onUploadClick}
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-2xl font-bold text-lg text-gray-200 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center"
              >
                 <FileUp className="w-6 h-6 mr-2 text-gray-400" />
                 Cargar .GBS
              </button>
              {/* Changed: Accept any file type to ensure mobile browsers enable the picker */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="*/*" 
                className="hidden" 
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0, overflow: 'hidden' }}
              />
           </div>

           {/* Features Grid Mini */}
           <div className="grid grid-cols-3 gap-4 pt-8 border-t border-gray-800/50">
               <div className="flex flex-col items-center text-center space-y-2">
                   <div className="p-3 bg-purple-900/20 rounded-xl text-purple-400"><Paintbrush /></div>
                   <span className="text-xs text-gray-500 font-medium">Pixel Art</span>
               </div>
               <div className="flex flex-col items-center text-center space-y-2">
                   <div className="p-3 bg-green-900/20 rounded-xl text-green-400"><Cpu /></div>
                   <span className="text-xs text-gray-500 font-medium">Lógica Visual</span>
               </div>
               <div className="flex flex-col items-center text-center space-y-2">
                   <div className="p-3 bg-orange-900/20 rounded-xl text-orange-400"><MonitorSmartphone /></div>
                   <span className="text-xs text-gray-500 font-medium">Exportar APK</span>
               </div>
           </div>
        </div>

        {/* Right Column: Updates / Changelog Card */}
        <div className="relative animate-in slide-in-from-right-10 duration-700 fade-in delay-100">
           {/* Decorative elements */}
           <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
           <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl"></div>

           <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center">
                     <Rocket className="w-5 h-5 mr-2 text-yellow-500" />
                     Novedades
                  </h3>
                  <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-400">Actualizado hoy</span>
               </div>

               <div className="space-y-4">
                  
                  <div className="group p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700/50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-blue-300">Nuevo Formato .GBS</span>
                          <FileUp className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
                      </div>
                      <p className="text-xs text-gray-400">
                         Hemos actualizado el formato de guardado a <b>.GBS</b> para asegurar compatibilidad total con dispositivos Android al cargar proyectos.
                      </p>
                  </div>

                  <div className="group p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700/50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-green-300">Gestión de Proyectos</span>
                          <FileUp className="w-4 h-4 text-gray-500 group-hover:text-green-400 transition-colors" />
                      </div>
                      <p className="text-xs text-gray-400">
                         Ahora puedes guardar tus proyectos completos y cargarlos más tarde sin errores de selección.
                      </p>
                  </div>

                  <div className="group p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl border border-gray-700/50 transition-colors">
                      <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-purple-300">Motor de Animación</span>
                          <Code2 className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors" />
                      </div>
                      <p className="text-xs text-gray-400">
                         Los objetos ahora previsualizan su frame 'Idle' en el editor. Mejoras en la lógica de animaciones.
                      </p>
                  </div>

               </div>
               
               <div className="mt-6 pt-4 border-t border-gray-800 text-center">
                  <p className="text-[10px] text-gray-500">GameBuilder Studio v2.2.0 • Desarrollado para Web & Android</p>
               </div>
           </div>
        </div>

      </div>
    </div>
  );
};