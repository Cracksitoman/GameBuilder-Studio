
import React, { useRef } from 'react';
import { Rocket, FileUp, Sparkles, Cpu, MonitorSmartphone, Plus } from './Icons';

const KodaLogoBig = ({ className = "w-32 h-32" }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="30" width="60" height="45" rx="8" fill="url(#paint0_linear_big)" />
    <rect x="28" y="42" width="44" height="22" rx="4" fill="#1F1F1F" />
    <rect x="35" y="48" width="10" height="10" rx="1" fill="#4ADE80" />
    <rect x="55" y="48" width="10" height="10" rx="1" fill="#4ADE80" />
    <rect x="30" y="20" width="10" height="12" rx="2" fill="#F97316" />
    <rect x="60" y="20" width="10" height="12" rx="2" fill="#F97316" />
    <rect x="30" y="75" width="40" height="10" rx="2" fill="#9A3412" />
    <defs>
      <linearGradient id="paint0_linear_big" x1="50" y1="30" x2="50" y2="75" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FB923C" />
        <stop offset="1" stopColor="#EA580C" />
      </linearGradient>
    </defs>
  </svg>
);

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
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans flex items-center justify-center relative overflow-hidden">
      
      <div className="absolute inset-0 z-0">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-900/10 via-gray-950 to-gray-950"></div>
         <div className="absolute inset-0 opacity-10" 
              style={{backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '40px 40px'}}>
         </div>
      </div>

      <div className="relative z-10 w-full max-w-6xl p-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        <div className="space-y-8 animate-in slide-in-from-left-10 duration-700 fade-in">
           <div className="flex items-center space-x-4 mb-4">
              <KodaLogoBig className="w-20 h-20" />
              <div className="inline-flex items-center space-x-2 bg-orange-900/30 border border-orange-500/30 rounded-full px-3 py-1 text-xs font-bold text-orange-300">
                 <Sparkles className="w-3 h-3" />
                 <span>v2.5 - Professional Edition</span>
              </div>
           </div>
           
           <div className="space-y-2">
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white">
                 KODA
                 <span className="block text-orange-500">ENGINE</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-md">
                 El motor de juegos definitivo para Android. Crea experiencias asombrosas sin límites.
              </p>
           </div>

           <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={onNewProject}
                className="group relative px-8 py-4 bg-orange-600 hover:bg-orange-500 rounded-2xl font-bold text-lg shadow-xl shadow-orange-900/20 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center overflow-hidden"
              >
                 <Plus className="w-6 h-6 mr-2" />
                 Nuevo Proyecto
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-2xl font-bold text-lg text-gray-200 transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center"
              >
                 <FileUp className="w-6 h-6 mr-2 text-gray-400" />
                 Cargar Proyecto
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="*/*" 
                className="hidden" 
              />
           </div>
        </div>

        <div className="relative animate-in slide-in-from-right-10 duration-700 fade-in delay-100">
           <div className="absolute -top-10 -right-10 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
           
           <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center text-orange-400">
                     <Rocket className="w-5 h-5 mr-2" />
                     Koda News
                  </h3>
               </div>

               <div className="space-y-4">
                  <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                      <span className="text-sm font-bold text-orange-300">Bienvenido a Koda</span>
                      <p className="text-xs text-gray-400 mt-1">
                         Hemos renombrado el estudio para reflejar nuestra nueva potencia. Koda Engine es más rápido y estable.
                      </p>
                  </div>
                  <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50">
                      <span className="text-sm font-bold text-green-300">Modo Cámara Mejorado</span>
                      <p className="text-xs text-gray-400 mt-1">
                         Ahora los bordes de la cámara son negros para mejor visibilidad en el modo edición.
                      </p>
                  </div>
               </div>
               
               <div className="mt-8 pt-4 border-t border-gray-800 text-center">
                  <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">KODA ENGINE SYSTEM v2.5.0</p>
               </div>
           </div>
        </div>
      </div>
    </div>
  );
};
