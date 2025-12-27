
import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Code, Box, MonitorSmartphone, Wind, AlertTriangle, Sidebar } from './Icons';

interface ScriptEditorModalProps {
  isOpen: boolean;
  objectName: string;
  initialCode: string;
  onClose: () => void;
  onSave: (code: string) => void;
}

// Improved Syntax Highlighter Logic with Placeholders
const highlightSyntax = (code: string) => {
  if (!code) return '';

  const placeholders: string[] = [];
  const addPlaceholder = (content: string) => {
    placeholders.push(content);
    return `%%%PH${placeholders.length - 1}%%%`;
  };

  // 1. Extract Strings and Comments to protect them from further replacements
  // Regex matches: "string" OR 'string' OR `string` OR // comment
  let processed = code.replace(/((['"`])(?:\\.|[^\\])*?\2|\/\/.*)/g, (match) => {
      // Safe HTML escaping
      const escaped = match.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      
      if (match.startsWith('//')) {
          return addPlaceholder(`<span class="text-gray-500 italic">${escaped}</span>`);
      } else {
          return addPlaceholder(`<span class="text-green-400">${escaped}</span>`);
      }
  });

  // 2. Escape remaining HTML structure (operators, logic)
  processed = processed.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // 3. Highlight Numbers (Moved before keywords/API to prevent matching numbers inside injected HTML classes like 'text-purple-400')
  processed = processed.replace(/\b(\d+)\b/g, '<span class="text-orange-400">$1</span>');

  // 4. Highlight Keywords
  processed = processed.replace(/\b(if|else|return|var|let|const|function|true|false|new|null|undefined|while|for)\b/g, '<span class="text-purple-400 font-bold">$1</span>');

  // 5. Highlight Koda Engine API
  processed = processed.replace(/\b(me|inputs|dt|globals|log)\b/g, '<span class="text-yellow-400 font-bold">$1</span>');

  // 6. Highlight Function Calls
  processed = processed.replace(/\b([a-zA-Z0-9_]+)(?=\()/g, '<span class="text-blue-400">$1</span>');

  // 7. Restore Placeholders
  placeholders.forEach((ph, i) => {
      processed = processed.replace(`%%%PH${i}%%%`, ph);
  });

  return processed;
};

export const ScriptEditorModal: React.FC<ScriptEditorModalProps> = ({ isOpen, objectName, initialCode, onClose, onSave }) => {
  const [code, setCode] = useState(initialCode || '');
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const isFirstRun = useRef(true);

  // Initialize Code only when opening the modal freshly
  useEffect(() => {
    if (isOpen) {
        if (isFirstRun.current) {
             const defaultCode = '// Escribe tu código aquí\n// Ejemplo: Mover a la derecha\n// if (inputs.right) me.x += 200 * dt;';
             setCode(initialCode || defaultCode);
             setError(null);
             isFirstRun.current = false;
        }
    } else {
        isFirstRun.current = true; // Reset for next open
    }
  }, [isOpen, initialCode]);

  // Real-time error checking (Debounced)
  useEffect(() => {
      const timer = setTimeout(() => {
          try {
              // Try to compile the code (dry run)
              new Function('me', 'dt', 'inputs', 'globals', 'log', code);
              setError(null);
          } catch (err: any) {
              let msg = err.message;
              setError(msg);
          }
      }, 600); 

      return () => clearTimeout(timer);
  }, [code]);

  // Sync scroll between textarea and pre
  const handleScroll = () => {
      if (textareaRef.current && preRef.current) {
          preRef.current.scrollTop = textareaRef.current.scrollTop;
          preRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Tab') {
          e.preventDefault();
          const target = e.currentTarget as HTMLTextAreaElement; // Explicit cast
          const start = target.selectionStart;
          const end = target.selectionEnd;
          const value = target.value;
          
          const newValue = value.substring(0, start) + "  " + value.substring(end);
          setCode(newValue);
          
          setTimeout(() => {
              if (textareaRef.current) {
                  textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
              }
          }, 0);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-gray-900 border w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-colors duration-300 ${error ? 'border-red-500 shadow-red-900/20' : 'border-gray-700'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-950">
          <div className="flex items-center space-x-3">
             <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Code className="w-5 h-5 text-yellow-500" />
             </div>
             <div>
                <h3 className="text-sm font-bold text-white">Editor de Script</h3>
                <p className="text-[10px] text-gray-500 font-mono">Objeto: <span className="text-blue-400">{objectName}</span></p>
             </div>
          </div>
          <div className="flex items-center space-x-2">
             <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-2 rounded-lg transition-colors ${isSidebarOpen ? 'bg-blue-900/30 text-blue-400' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                title="Alternar Referencia API"
             >
                 <Sidebar className="w-4 h-4" />
             </button>
             <div className="w-px h-6 bg-gray-800 mx-2"></div>
             <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Cancelar</button>
             <button 
                onClick={() => { if(!error) { onSave(code); onClose(); } }} 
                disabled={!!error}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-bold text-sm shadow-lg transition-all ${error ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/20'}`}
             >
                <Check className="w-4 h-4" />
                <span>Guardar Código</span>
             </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
            {/* Code Area Container */}
            <div className="flex-1 relative bg-[#0d1117] flex font-mono text-sm leading-6">
                
                {/* Line Numbers */}
                <div className="w-12 bg-[#0d1117] border-r border-gray-800 text-right pr-3 pt-4 text-gray-600 select-none overflow-hidden shrink-0">
                    {code.split('\n').map((_, i) => (
                        <div key={i} className="h-6">{i+1}</div>
                    ))}
                </div>

                <div className="relative flex-1 h-full">
                    {/* Syntax Highlighter Layer (Bottom) */}
                    <pre
                        ref={preRef}
                        className="absolute inset-0 p-4 m-0 overflow-hidden whitespace-pre pointer-events-none z-0"
                        style={{ fontFamily: 'monospace', lineHeight: '1.5rem' }} 
                        dangerouslySetInnerHTML={{ __html: highlightSyntax(code) }}
                    />

                    {/* Text Input Layer (Top, Transparent text, visible caret) */}
                    <textarea 
                        ref={textareaRef}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        onScroll={handleScroll}
                        onKeyDown={handleKeyDown}
                        className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-white p-4 outline-none resize-none z-10 whitespace-pre font-mono"
                        style={{ fontFamily: 'monospace', lineHeight: '1.5rem', color: 'transparent' }}
                        spellCheck={false}
                        autoCapitalize="off"
                        autoComplete="off"
                        autoCorrect="off"
                    />
                </div>
            </div>

            {/* Sidebar Docs */}
            <div className={`bg-gray-900 border-l border-gray-800 overflow-y-auto custom-scrollbar transition-all duration-300 ${isSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
                <div className="p-4 border-b border-gray-800">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Referencia Rápida</h4>
                </div>
                
                <div className="p-4 space-y-6">
                    <div>
                        <div className="flex items-center space-x-2 mb-2 text-blue-400">
                            <Box className="w-4 h-4" />
                            <span className="font-bold text-sm">El Objeto (me)</span>
                        </div>
                        <ul className="space-y-2 text-xs text-gray-400 font-mono">
                            <li className="bg-gray-800 p-2 rounded border border-gray-700">
                                <span className="text-blue-300">me.x</span> / <span className="text-blue-300">me.y</span>
                                <div className="text-[10px] text-gray-500 mt-1">Posición en píxeles.</div>
                            </li>
                            <li className="bg-gray-800 p-2 rounded border border-gray-700">
                                <span className="text-blue-300">me.vx</span> / <span className="text-blue-300">me.vy</span>
                                <div className="text-[10px] text-gray-500 mt-1">Velocidad actual (Física).</div>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <div className="flex items-center space-x-2 mb-2 text-green-400">
                            <MonitorSmartphone className="w-4 h-4" />
                            <span className="font-bold text-sm">Controles</span>
                        </div>
                        <div className="bg-gray-800 p-2 rounded border border-gray-700 text-xs text-gray-400 font-mono space-y-1">
                            <div>inputs.left</div>
                            <div>inputs.right</div>
                            <div>inputs.up</div>
                            <div>inputs.action <span className="text-gray-600">// Espacio</span></div>
                            <div className="mt-2 text-orange-300">Sensores (Móvil)</div>
                            <div>inputs.tiltX <span className="text-gray-600">// -1 a 1 (L/R)</span></div>
                            <div>inputs.tiltY <span className="text-gray-600">// -1 a 1 (F/B)</span></div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center space-x-2 mb-2 text-purple-400">
                            <Wind className="w-4 h-4" />
                            <span className="font-bold text-sm">Utilidades</span>
                        </div>
                        <ul className="space-y-2 text-xs text-gray-400 font-mono">
                            <li className="bg-gray-800 p-2 rounded border border-gray-700">
                                <span className="text-purple-300">dt</span>
                                <div className="text-[10px] text-gray-500 mt-1">Delta Time (imprescindible).</div>
                            </li>
                            <li className="bg-gray-800 p-2 rounded border border-gray-700">
                                <span className="text-purple-300">log("msg")</span>
                                <div className="text-[10px] text-gray-500 mt-1">Imprime en consola.</div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        {/* Error Footer */}
        {error && (
            <div className="bg-red-900/90 text-red-200 text-xs p-3 border-t border-red-700 font-mono flex items-center animate-in slide-in-from-bottom-2">
                <AlertTriangle className="w-4 h-4 mr-2 text-red-400 flex-shrink-0" />
                <span>{error}</span>
            </div>
        )}

      </div>
    </div>
  );
};
