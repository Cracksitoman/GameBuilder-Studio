import React, { useState } from 'react';
import { X, Book, Code, Box, Wind, MonitorSmartphone, Layers, Hash } from './Icons';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('BASICS');

  if (!isOpen) return null;

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all mb-2 ${
        activeTab === id ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-bold text-sm">{label}</span>
    </button>
  );

  const CodeBlock = ({ code }: { code: string }) => (
    <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 font-mono text-xs text-gray-300 overflow-x-auto my-3 relative group">
      <pre>{code.trim()}</pre>
      <div className="absolute top-2 right-2 text-[9px] text-gray-600 uppercase">JS</div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-gray-900 border border-gray-700 w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col">
          <div className="flex items-center space-x-2 mb-8 px-2">
            <Book className="w-6 h-6 text-orange-500" />
            <span className="text-lg font-black text-white tracking-tight">Koda Docs</span>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-1">
            <TabButton id="BASICS" label="Conceptos Básicos" icon={Box} />
            <TabButton id="MOVEMENT" label="Movimiento" icon={Wind} />
            <TabButton id="INPUT" label="Controles (Input)" icon={MonitorSmartphone} />
            <TabButton id="VARS" label="Variables" icon={Hash} />
            <TabButton id="API" label="Referencia API" icon={Code} />
          </div>

          <button onClick={onClose} className="mt-4 w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold transition-colors">
            Cerrar
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-[#0d1117]">
          <div className="max-w-3xl mx-auto">
            
            {activeTab === 'BASICS' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h2 className="text-3xl font-black text-white mb-4">Bienvenido a Koda Script</h2>
                <p className="text-gray-400 leading-relaxed">
                  Koda Engine utiliza <strong>JavaScript</strong> estándar para potenciar tus juegos. 
                  Cada objeto tiene acceso a un script que se ejecuta 60 veces por segundo (Game Loop).
                </p>
                
                <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-xl">
                  <h3 className="text-blue-400 font-bold mb-2 flex items-center"><Code className="w-4 h-4 mr-2"/> La variable 'me'</h3>
                  <p className="text-sm text-gray-300">
                    La palabra clave <code>me</code> se refiere al objeto actual. Puedes usarla para cambiar su posición, tamaño, color, etc.
                  </p>
                </div>

                <CodeBlock code={`
// Mover el objeto hacia la derecha constantemente
me.x = me.x + 1;

// Rotar el objeto
me.rotation += 5;
                `} />
              </div>
            )}

            {activeTab === 'MOVEMENT' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h2 className="text-3xl font-black text-white mb-4">Movimiento y Física</h2>
                <p className="text-gray-400">
                  Para lograr un movimiento suave en todos los dispositivos, siempre multiplica tus valores por <code>dt</code> (Delta Time).
                </p>

                <h3 className="text-xl font-bold text-white mt-6">Movimiento Simple</h3>
                <CodeBlock code={`
// Mover 200 píxeles por segundo a la derecha
me.x += 200 * dt;

// Mover en diagonal
me.x += 100 * dt;
me.y += 100 * dt;
                `} />

                <h3 className="text-xl font-bold text-white mt-6">Usando Velocidad (Física)</h3>
                <p className="text-sm text-gray-400 mb-2">
                  Si tu objeto tiene comportamientos de física, usa <code>me.vx</code> y <code>me.vy</code>.
                </p>
                <CodeBlock code={`
// Saltar (Velocidad negativa en Y es hacia arriba)
if (inputs.action) {
    me.vy = -500;
}
                `} />
              </div>
            )}

            {activeTab === 'INPUT' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h2 className="text-3xl font-black text-white mb-4">Entrada del Jugador</h2>
                <p className="text-gray-400">
                  El objeto <code>inputs</code> contiene el estado actual de los controles (teclado y táctil).
                </p>

                <div className="grid grid-cols-2 gap-4 my-6">
                   <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                      <code className="text-green-400 font-bold">inputs.left</code>
                      <p className="text-xs text-gray-500 mt-1">Flecha Izquierda / D-Pad</p>
                   </div>
                   <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                      <code className="text-green-400 font-bold">inputs.right</code>
                      <p className="text-xs text-gray-500 mt-1">Flecha Derecha / D-Pad</p>
                   </div>
                   <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                      <code className="text-green-400 font-bold">inputs.up</code>
                      <p className="text-xs text-gray-500 mt-1">Flecha Arriba</p>
                   </div>
                   <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                      <code className="text-green-400 font-bold">inputs.action</code>
                      <p className="text-xs text-gray-500 mt-1">Espacio / Botón A</p>
                   </div>
                </div>

                <h3 className="text-xl font-bold text-white">Ejemplo: Control Top-Down</h3>
                <CodeBlock code={`
const speed = 300;

if (inputs.left) {
    me.x -= speed * dt;
    me.flipX = true; // Voltear sprite
}
if (inputs.right) {
    me.x += speed * dt;
    me.flipX = false;
}
if (inputs.up) {
    me.y -= speed * dt;
}
if (inputs.down) {
    me.y += speed * dt;
}
                `} />
              </div>
            )}

            {activeTab === 'VARS' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h2 className="text-3xl font-black text-white mb-4">Variables</h2>
                
                <h3 className="text-xl font-bold text-white">Variables Globales</h3>
                <p className="text-gray-400 text-sm mb-2">Accesibles desde cualquier objeto usando <code>globals</code>.</p>
                <CodeBlock code={`
// Aumentar puntuación
globals.Puntos += 10;

// Verificar vida
if (globals.Vida <= 0) {
    log("Game Over");
}
                `} />

                <h3 className="text-xl font-bold text-white mt-6">Variables Locales</h3>
                <p className="text-gray-400 text-sm mb-2">
                  Variables propias del objeto. Debes crearlas primero en el panel de Propiedades.
                  Se accede a ellas a través de <code>me.localVars</code>.
                </p>
                <CodeBlock code={`
// Reducir salud del enemigo
me.localVars.Salud -= 10;

if (me.localVars.Salud <= 0) {
    me.destroy();
}
                `} />
              </div>
            )}

            {activeTab === 'API' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <h2 className="text-3xl font-black text-white mb-4">Referencia API</h2>
                
                <div className="space-y-4">
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                        <code className="text-yellow-400 font-bold text-lg">me.destroy()</code>
                        <p className="text-gray-400 text-sm mt-1">Elimina el objeto del juego inmediatamente.</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                        <code className="text-yellow-400 font-bold text-lg">me.visible</code>
                        <p className="text-gray-400 text-sm mt-1">Booleano (true/false). Controla si el objeto se dibuja.</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                        <code className="text-yellow-400 font-bold text-lg">log(mensaje)</code>
                        <p className="text-gray-400 text-sm mt-1">Imprime un mensaje en la consola del navegador (F12) para depuración.</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                        <code className="text-yellow-400 font-bold text-lg">Math.random()</code>
                        <p className="text-gray-400 text-sm mt-1">Función estándar de JS. Devuelve un número entre 0 y 1.</p>
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