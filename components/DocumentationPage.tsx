
import React, { useState } from 'react';
import { Book, Code, Box, Wind, MonitorSmartphone, Hash, Sidebar, ArrowLeft, Menu, Smartphone } from './Icons';

interface DocumentationPageProps {
  onBack: () => void;
}

export const DocumentationPage: React.FC<DocumentationPageProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('BASICS');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768); // Default open on desktop, closed on mobile

  const handleTabClick = (id: string) => {
      setActiveTab(id);
      // Auto close on mobile when selecting
      if (window.innerWidth < 768) {
          setIsSidebarOpen(false);
      }
  };

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => handleTabClick(id)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all mb-2 ${
        activeTab === id ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="font-bold text-sm">{label}</span>
    </button>
  );

  const CodeBlock = ({ code }: { code: string }) => (
    <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto my-4 relative group shadow-inner">
      <pre>{code.trim()}</pre>
      <div className="absolute top-2 right-2 text-[10px] text-gray-600 uppercase font-bold bg-gray-900 px-2 py-1 rounded">JS</div>
    </div>
  );

  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex flex-col overflow-hidden animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="h-16 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-4 z-40 shrink-0 relative">
          <div className="flex items-center space-x-4">
              <button 
                onClick={onBack}
                className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors flex items-center"
              >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  <span className="font-bold text-sm hidden sm:inline">Volver</span>
                  <span className="font-bold text-sm sm:hidden">Atrás</span>
              </button>
              <div className="h-6 w-px bg-gray-800 mx-2"></div>
              <button 
                 onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                 className={`p-2 rounded-lg transition-colors ${isSidebarOpen ? 'bg-blue-900/30 text-blue-400' : 'text-gray-400 hover:bg-gray-800'}`}
              >
                  <Sidebar className="w-5 h-5" />
              </button>
              <span className="font-bold text-lg tracking-tight flex items-center">
                  <Book className="w-5 h-5 mr-2 text-orange-500" />
                  Koda Docs
              </span>
          </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Mobile Overlay */}
        {isSidebarOpen && (
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden animate-in fade-in"
                onClick={() => setIsSidebarOpen(false)}
            />
        )}

        {/* Sidebar Responsive */}
        <div className={`
            bg-gray-900 border-r border-gray-800 flex flex-col 
            transition-all duration-300 ease-in-out
            absolute inset-y-0 left-0 z-40 h-full
            md:relative md:z-0
            ${isSidebarOpen ? 'translate-x-0 w-72 shadow-2xl md:shadow-none' : '-translate-x-full w-72 md:translate-x-0 md:w-0 md:overflow-hidden'}
        `}>
          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-2">Temas</div>
            <TabButton id="BASICS" label="Conceptos Básicos" icon={Box} />
            <TabButton id="MOVEMENT" label="Movimiento" icon={Wind} />
            <TabButton id="INPUT" label="Controles (Input)" icon={MonitorSmartphone} />
            <TabButton id="MOBILE" label="Desarrollo Móvil" icon={Smartphone} />
            <TabButton id="VARS" label="Variables" icon={Hash} />
            <TabButton id="API" label="Referencia API" icon={Code} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-[#0d1117] relative scroll-smooth w-full">
          <div className="max-w-4xl mx-auto p-6 sm:p-12 pb-24">
            
            {activeTab === 'BASICS' && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="border-b border-gray-800 pb-4">
                    <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Conceptos Básicos</h1>
                    <p className="text-lg sm:text-xl text-gray-400">Introducción al scripting en Koda Engine.</p>
                </div>
                
                <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 leading-relaxed">
                    Koda Engine utiliza <strong>JavaScript</strong> estándar. Cada objeto en tu escena tiene su propio bucle de actualización que se ejecuta aproximadamente 60 veces por segundo.
                    </p>

                    <div className="bg-blue-900/10 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
                    <h3 className="text-blue-400 font-bold mb-1 flex items-center text-lg">La variable 'me'</h3>
                    <p className="text-gray-300 text-sm">
                        La palabra clave <code>me</code> es mágica. Se refiere al objeto actual que está ejecutando el código.
                        Úsala para acceder a sus propiedades como posición, tamaño y velocidad.
                    </p>
                    </div>

                    <h3 className="text-2xl font-bold text-white mt-8 mb-4">Ejemplo Simple</h3>
                    <CodeBlock code={`
// Mover el objeto 1 pixel a la derecha en cada frame
me.x = me.x + 1;

// Rotar el objeto lentamente
me.rotation += 2;
                    `} />
                </div>
              </div>
            )}

            {activeTab === 'MOVEMENT' && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="border-b border-gray-800 pb-4">
                    <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Movimiento y Física</h1>
                    <p className="text-lg sm:text-xl text-gray-400">Cómo mover cosas suavemente.</p>
                </div>

                <div className="prose prose-invert max-w-none">
                    <h3 className="text-2xl font-bold text-white mt-8">Delta Time (dt)</h3>
                    <p className="text-gray-300">
                        Para que el juego funcione a la misma velocidad en móviles rápidos y lentos, debes multiplicar todos los movimientos por <code>dt</code> (Delta Time).
                        <code>dt</code> es el tiempo en segundos que pasó desde el último frame (aprox 0.016s).
                    </p>

                    <CodeBlock code={`
// INCORRECTO (Depende de los FPS)
me.x += 5; 

// CORRECTO (Independiente de los FPS)
// Mover 300 píxeles por segundo
me.x += 300 * dt;
                    `} />

                    <h3 className="text-2xl font-bold text-white mt-8">Usando Velocidad (Física)</h3>
                    <p className="text-gray-300">
                        Si tu objeto tiene comportamientos como "Plataforma" o "TopDown", es mejor modificar <code>me.vx</code> (velocidad X) y <code>me.vy</code> (velocidad Y) en lugar de <code>me.x</code> directamente.
                    </p>
                    <CodeBlock code={`
// Saltar (Velocidad negativa en Y es hacia arriba)
if (inputs.action) {
    me.vy = -600;
}

// Detener movimiento horizontal
me.vx = 0;
                    `} />
                </div>
              </div>
            )}

            {activeTab === 'INPUT' && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="border-b border-gray-800 pb-4">
                    <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Controles (Input)</h1>
                    <p className="text-lg sm:text-xl text-gray-400">Detectar teclado y gamepad virtual.</p>
                </div>

                <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300">
                    El objeto global <code>inputs</code> contiene el estado actual de los botones virtuales y teclas físicas.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex items-center justify-between">
                            <code className="text-green-400 font-bold text-lg">inputs.left</code>
                            <span className="text-gray-500 text-sm">Flecha Izq / D-Pad</span>
                        </div>
                        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex items-center justify-between">
                            <code className="text-green-400 font-bold text-lg">inputs.right</code>
                            <span className="text-gray-500 text-sm">Flecha Der / D-Pad</span>
                        </div>
                        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex items-center justify-between">
                            <code className="text-green-400 font-bold text-lg">inputs.up</code>
                            <span className="text-gray-500 text-sm">Flecha Arriba</span>
                        </div>
                        <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex items-center justify-between">
                            <code className="text-green-400 font-bold text-lg">inputs.action</code>
                            <span className="text-gray-500 text-sm">Espacio / Botón A</span>
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-white mt-8">Ejemplo Completo: Movimiento Top-Down</h3>
                    <CodeBlock code={`
const speed = 300;

// Movimiento Horizontal
if (inputs.left) {
    me.x -= speed * dt;
    me.flipX = true; // Mirar a la izquierda
}
if (inputs.right) {
    me.x += speed * dt;
    me.flipX = false; // Mirar a la derecha
}

// Movimiento Vertical
if (inputs.up) {
    me.y -= speed * dt;
}
if (inputs.down) {
    me.y += speed * dt;
}
                    `} />
                </div>
              </div>
            )}

            {activeTab === 'MOBILE' && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="border-b border-gray-800 pb-4">
                    <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Desarrollo Móvil</h1>
                    <p className="text-lg sm:text-xl text-gray-400">Eventos táctiles y adaptación a pantallas.</p>
                </div>

                <div className="prose prose-invert max-w-none">
                    
                    <h3 className="text-2xl font-bold text-white mt-8">1. Gamepad Virtual</h3>
                    <p className="text-gray-300">
                        Al exportar tu juego, Koda Engine detecta automáticamente si estás en un móvil y muestra controles táctiles (D-Pad y Botón A).
                        <br/>
                        <span className="text-orange-400 italic">No necesitas programar nada extra:</span> <code>inputs.left</code>, <code>inputs.right</code>, etc., funcionan automáticamente con los botones táctiles.
                    </p>

                    <h3 className="text-2xl font-bold text-white mt-8">2. Detectar Toques (Touch)</h3>
                    <p className="text-gray-300">
                        Puedes detectar si el jugador está tocando un objeto específico usando la propiedad <code>me.isPointerDown</code>. Esto es útil para crear tus propios botones o mecánicas de arrastrar.
                    </p>
                    
                    <CodeBlock code={`
// Ejemplo: Un botón que cambia de tamaño al tocarlo
if (me.isPointerDown) {
    // El dedo está sobre el objeto y presionando
    me.width = 60;
    me.height = 60;
    
    // Acción personalizada
    globals.Puntos += 1;
} else {
    // Estado normal
    me.width = 50;
    me.height = 50;
}
                    `} />

                    <h3 className="text-2xl font-bold text-white mt-8">3. Arrastrar Objetos (Drag & Drop)</h3>
                    <p className="text-gray-300">
                        Para saber si un objeto está siendo arrastrado por el dedo, usa <code>me.isDragging</code>. 
                        El motor se encarga de moverlo, pero puedes añadir lógica extra.
                    </p>

                    <CodeBlock code={`
if (me.isDragging) {
    me.opacity = 0.5; // Hacer semi-transparente al arrastrar
} else {
    me.opacity = 1.0;
}
                    `} />
                    
                     <h3 className="text-2xl font-bold text-white mt-8">4. Resolución y Orientación</h3>
                    <p className="text-gray-300">
                        Asegúrate de configurar tu lienzo en <strong>Vertical</strong> o <strong>Horizontal</strong> desde el menú lateral según el tipo de juego que desees. 
                        El motor escalará el juego automáticamente para llenar la pantalla del teléfono.
                    </p>
                </div>
              </div>
            )}

            {activeTab === 'VARS' && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="border-b border-gray-800 pb-4">
                    <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Variables</h1>
                    <p className="text-lg sm:text-xl text-gray-400">Guardar datos y estados.</p>
                </div>

                <div className="prose prose-invert max-w-none">
                    
                    <h3 className="text-2xl font-bold text-white mt-8">1. Variables Globales (globals)</h3>
                    <p className="text-gray-300">
                        Estas variables persisten entre escenas y son accesibles por todos los objetos. Debes crearlas primero en el "Gestor de Variables" del menú principal.
                    </p>
                    <CodeBlock code={`
// Sumar puntos
globals.Puntos = globals.Puntos + 10;

// Verificar condición global
if (globals.TieneLlave == true) {
    log("Puerta Abierta");
    me.destroy(); // Destruir la puerta
}
                    `} />

                    <h3 className="text-2xl font-bold text-white mt-8">2. Variables Locales (me.localVars)</h3>
                    <p className="text-gray-300">
                        Son exclusivas de cada instancia del objeto. Se configuran en el panel de Propiedades del objeto.
                    </p>
                    <CodeBlock code={`
// Ejemplo: Un enemigo que tiene vida propia
me.localVars.Vida -= 10;

if (me.localVars.Vida <= 0) {
    // Crear explosión antes de morir (opcional)
    // me.destroy(); 
}
                    `} />
                </div>
              </div>
            )}

            {activeTab === 'API' && (
              <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="border-b border-gray-800 pb-4">
                    <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Referencia API</h1>
                    <p className="text-lg sm:text-xl text-gray-400">Lista completa de métodos y propiedades disponibles.</p>
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                        <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 font-bold text-gray-300">Propiedades del Objeto (me)</div>
                        <div className="divide-y divide-gray-800">
                            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                                <code className="text-blue-400 font-bold">me.x, me.y</code>
                                <div className="col-span-2 text-gray-400 text-sm">Posición en píxeles (coordenadas del mundo).</div>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                                <code className="text-blue-400 font-bold">me.width, me.height</code>
                                <div className="col-span-2 text-gray-400 text-sm">Tamaño del objeto.</div>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                                <code className="text-blue-400 font-bold">me.rotation</code>
                                <div className="col-span-2 text-gray-400 text-sm">Ángulo en grados.</div>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                                <code className="text-blue-400 font-bold">me.visible</code>
                                <div className="col-span-2 text-gray-400 text-sm">Booleano. Si es falso, no se renderiza.</div>
                            </div>
                             <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                                <code className="text-blue-400 font-bold">me.opacity</code>
                                <div className="col-span-2 text-gray-400 text-sm">Transparencia de 0.0 a 1.0.</div>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                                <code className="text-blue-400 font-bold">me.flipX</code>
                                <div className="col-span-2 text-gray-400 text-sm">Voltear sprite horizontalmente (true/false).</div>
                            </div>
                             <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                                <code className="text-blue-400 font-bold">me.isPointerDown</code>
                                <div className="col-span-2 text-gray-400 text-sm">Booleano. True si el dedo/mouse está presionando el objeto.</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                        <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 font-bold text-gray-300">Métodos y Funciones</div>
                         <div className="divide-y divide-gray-800">
                            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                                <code className="text-yellow-400 font-bold">me.destroy()</code>
                                <div className="col-span-2 text-gray-400 text-sm">Elimina el objeto del juego inmediatamente.</div>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-2">
                                <code className="text-yellow-400 font-bold">log(mensaje)</code>
                                <div className="col-span-2 text-gray-400 text-sm">Imprime en la consola (F12) para depurar.</div>
                            </div>
                         </div>
                    </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};
