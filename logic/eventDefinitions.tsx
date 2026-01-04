
import React from 'react';
import { 
  Hand, Box, MonitorSmartphone, Timer, Ruler, Calculator, Play, 
  Crosshair, Wind, Trash2, Hash, Clapperboard, User, RefreshCw, List 
} from '../components/Icons';

export const CONDITION_OPTIONS = [
  { id: 'TOUCH_INTERACTION', label: 'Entrada Táctil / Ratón', description: 'Clics, toques o arrastrar.', icon: <Hand className="w-5 h-5 text-yellow-400"/> },
  { id: 'COLLISION', label: 'Colisión con objeto', description: 'Cuando choca con otro.', icon: <Box className="w-5 h-5 text-blue-400"/> },
  { id: 'KEY_PRESSED', label: 'Tecla presionada', description: 'Teclado físico.', icon: <MonitorSmartphone className="w-5 h-5 text-pink-400"/> },
  { id: 'EVERY_X_SECONDS', label: 'Cada X Segundos', description: 'Repetir cíclicamente.', icon: <Timer className="w-5 h-5 text-purple-400"/> },
  { id: 'DISTANCE_TO', label: 'Distancia a Objeto', description: 'Cerca o lejos.', icon: <Ruler className="w-5 h-5 text-cyan-400"/> },
  { id: 'COMPARE_VARIABLE', label: 'Comparar Variable', description: 'Valor numérico o texto.', icon: <Calculator className="w-5 h-5 text-gray-400"/> },
  { id: 'START_OF_SCENE', label: 'Al inicio de la escena', description: 'Inicializar datos.', icon: <Play className="w-5 h-5 text-green-400"/> },
];

export const ACTION_OPTIONS = [
  { id: 'CREATE_OBJECT', label: 'Crear Objeto (Disparar)', description: 'Instancia un objeto de la librería.', icon: <Crosshair className="w-5 h-5 text-green-400"/> },
  { id: 'APPLY_FORCE', label: 'Aplicar Fuerza (Física)', description: 'Empuja el objeto.', icon: <Wind className="w-5 h-5 text-indigo-400"/> },
  { id: 'DESTROY', label: 'Destruir objeto', description: 'Elimina del juego.', icon: <Trash2 className="w-5 h-5 text-red-400"/> },
  { id: 'MODIFY_VARIABLE', label: 'Modificar Variable', description: 'Cambia valores.', icon: <Hash className="w-5 h-5 text-pink-400"/> },
  { id: 'CHANGE_SCENE', label: 'Cambiar de Escena', description: 'Carga otro nivel.', icon: <Clapperboard className="w-5 h-5 text-orange-500"/> },
  { id: 'SET_VISIBLE', label: 'Cambiar Visibilidad', description: 'Oculta o muestra.', icon: <User className="w-5 h-5 text-blue-400"/> },
  { id: 'RESTART_SCENE', label: 'Reiniciar Escena', description: 'Vuelve a empezar.', icon: <RefreshCw className="w-5 h-5 text-red-400"/> },
];
