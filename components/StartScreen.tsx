import React, { useRef, useState } from 'react';
import { Rocket, FileUp, Sparkles, Plus, Book, FolderOpen, Clock } from './Icons';
import { NewProjectDialog } from './NewProjectDialog';

const KodaIcon = () => (
  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
    <span className="text-black font-black text-2xl">K</span>
  </div>
);

interface StartScreenProps {
  onNewProject: (config: { name: string, orientation: 'LANDSCAPE' | 'PORTRAIT' }) => void;
  onLoadProject: (file: File) => void;
  onOpenDocs?: () => void; 
}

export const StartScreen: React.FC<StartScreenProps> = ({ onNewProject, onLoadProject, onOpenDocs }) => {
  const [showNewProject, setShowNewProject] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadProject(file);
    }
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-[#0f1014] text-white font-sans flex items-center justify-center p-4">
      {/* Main Card */}
      <div className="w-full max-w-md bg-[#18181b] border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
         
         {/* Header */}
         <div className="flex items-center space-x-3 mb-2">
            <KodaIcon />
            <h1 className="text-3xl font-black tracking-tighter text-white">KODA</h1>
         </div>
         
         <p className="text-gray-400 text-sm mb-4">Crea juegos increíbles, en cualquier lugar.</p>
         
         <div className="inline-block bg-[#27272a] text-gray-400 text-[10px] font-bold px-2 py-1 rounded mb-8 border border-gray-700">
            BETA v0.1.0
         </div>

         {/* Actions */}
         <div className="space-y-3 mb-10">
            <button 
                onClick={() => setShowNewProject(true)}
                className="w-full bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-3 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-orange-900/20 active:scale-95"
            >
                <Plus className="w-5 h-5 mr-2" />
                Crear Nuevo Proyecto
            </button>
            
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-[#27272a] hover:bg-[#3f3f46] text-white font-bold py-3 rounded-xl flex items-center justify-center transition-all border border-gray-700 active:scale-95"
            >
                <FolderOpen className="w-5 h-5 mr-2 text-gray-400" />
                Abrir Proyecto
            </button>
            <input ref={fileInputRef} type="file" accept=".gbs" className="hidden" onChange={handleFileChange} />

            <button 
                onClick={onOpenDocs}
                className="w-full bg-[#27272a] hover:bg-[#3f3f46] text-white font-bold py-3 rounded-xl flex items-center justify-center transition-all border border-gray-700 active:scale-95"
            >
                <Book className="w-5 h-5 mr-2 text-blue-400" />
                Documentación
            </button>
         </div>

         {/* Footer Info */}
         <div className="text-[10px] text-gray-600 mb-6 text-center">
             © 2024 Koda Engine Team.
         </div>

         {/* Recents Section */}
         <div>
             <div className="flex items-center space-x-2 mb-2">
                 <Clock className="w-3 h-3 text-gray-500" />
                 <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recientes</span>
             </div>
             <div className="border border-dashed border-gray-800 rounded-xl h-32 flex flex-col items-center justify-center text-gray-600 bg-[#131316]">
                 <FolderOpen className="w-8 h-8 mb-2 opacity-20" />
                 <span className="text-xs">No hay proyectos recientes.</span>
                 <span className="text-[10px] opacity-50">Crea uno nuevo para empezar.</span>
             </div>
         </div>

      </div>

      <NewProjectDialog 
        isOpen={showNewProject} 
        onClose={() => setShowNewProject(false)} 
        onCreate={(name, orientation) => {
            onNewProject({ name, orientation });
            setShowNewProject(false);
        }}
      />
    </div>
  );
};