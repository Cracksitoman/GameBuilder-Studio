
import { 
    Zap, Move, Eye, Grid, Music, Settings, List, Wind, 
    Play, Hand, Box, Timer, Ruler, MonitorSmartphone,
    Film, Sparkles, Type, Palette, Volume2, Vibrate,
    RefreshCw, Copy, Trash2, Navigation, Activity, Hash
} from '../../components/Icons';

export type BlockCategory = 'EVENTS' | 'MOTION' | 'LOOKS' | 'SOUND' | 'CONTROL' | 'DATA' | 'PHYSICS' | 'SCENERY';

export const BLOCK_CATEGORIES: { id: BlockCategory, label: string, color: string }[] = [
    { id: 'EVENTS', label: 'Eventos', color: 'text-yellow-500' },
    { id: 'MOTION', label: 'Movimiento', color: 'text-blue-500' },
    { id: 'LOOKS', label: 'Apariencia', color: 'text-purple-500' },
    { id: 'SCENERY', label: 'Escenario', color: 'text-cyan-500' },
    { id: 'SOUND', label: 'Sonido y FX', color: 'text-pink-500' },
    { id: 'CONTROL', label: 'Control', color: 'text-orange-500' },
    { id: 'DATA', label: 'Datos / Listas', color: 'text-green-500' },
    { id: 'PHYSICS', label: 'Física', color: 'text-indigo-500' },
];

export const BLOCKS_CATALOG = {
    EVENTS: [
        { type: 'ALWAYS', label: 'Siempre (Verificación)', color: 'bg-yellow-600', icon: RefreshCw, mode: 'CONDITION' },
        { type: 'START_OF_SCENE', label: 'Al empezar nivel', color: 'bg-yellow-600', icon: Play, mode: 'CONDITION' },
        { type: 'TOUCH_INTERACTION', label: 'Interacción Táctil', color: 'bg-yellow-600', icon: Hand, mode: 'CONDITION' },
        { type: 'COLLISION', label: 'Al chocar con...', color: 'bg-yellow-600', icon: Box, mode: 'CONDITION' },
        { type: 'EVERY_X_SECONDS', label: 'Temporizador', color: 'bg-yellow-600', icon: Timer, mode: 'CONDITION' },
        { type: 'DISTANCE_TO', label: 'Distancia a...', color: 'bg-yellow-600', icon: Ruler, mode: 'CONDITION' },
        { type: 'KEY_PRESSED', label: 'Tecla presionada', color: 'bg-yellow-600', icon: MonitorSmartphone, mode: 'CONDITION' },
    ],
    MOTION: [
        { type: 'MOVE_FORWARD', label: 'Mover Pasos', color: 'bg-blue-600', icon: Move, mode: 'ACTION' },
        { type: 'SET_X', label: 'Fijar X', color: 'bg-blue-600', icon: Move, mode: 'ACTION' },
        { type: 'SET_Y', label: 'Fijar Y', color: 'bg-blue-600', icon: Move, mode: 'ACTION' },
        { type: 'SET_ROTATION', label: 'Fijar Rotación', color: 'bg-blue-600', icon: RefreshCw, mode: 'ACTION' },
    ],
    LOOKS: [
        { type: 'SET_VISIBLE', label: 'Mostrar/Ocultar', color: 'bg-purple-600', icon: Eye, mode: 'ACTION' },
        { type: 'PLAY_ANIMATION', label: 'Reproducir Anim', color: 'bg-purple-600', icon: Film, mode: 'ACTION' },
        { type: 'SET_TEXT', label: 'Cambiar Texto', color: 'bg-purple-600', icon: Type, mode: 'ACTION' },
    ],
    SCENERY: [
        { type: 'SET_TILE', label: 'Cambiar Tile', color: 'bg-cyan-600', icon: Grid, mode: 'ACTION' },
    ],
    SOUND: [
        { type: 'PLAY_SOUND', label: 'Reproducir Sonido', color: 'bg-pink-600', icon: Music, mode: 'ACTION' },
        { type: 'CAMERA_SHAKE', label: 'Agitar Cámara', color: 'bg-pink-600', icon: Vibrate, mode: 'ACTION' },
    ],
    CONTROL: [
        { type: 'REPEAT_X_TIMES', label: 'Repetir X veces', color: 'bg-orange-600', icon: RefreshCw, mode: 'ACTION' },
        { type: 'CREATE_OBJECT', label: 'Crear Objeto', color: 'bg-orange-600', icon: Copy, mode: 'ACTION' },
        { type: 'DESTROY', label: 'Destruir Objeto', color: 'bg-red-600', icon: Trash2, mode: 'ACTION' },
        { type: 'CHANGE_SCENE', label: 'Ir a Escena', color: 'bg-orange-600', icon: Navigation, mode: 'ACTION' },
    ],
    DATA: [
        { type: 'COMPARE_VARIABLE', label: 'Verificar Var', color: 'bg-yellow-700', icon: Hash, mode: 'CONDITION' },
        { type: 'MODIFY_VARIABLE', label: 'Modificar Var', color: 'bg-green-600', icon: Hash, mode: 'ACTION' },
        { type: 'PUSH_TO_ARRAY', label: 'Añadir a Lista', color: 'bg-green-600', icon: List, mode: 'ACTION' },
    ],
    PHYSICS: [
        { type: 'APPLY_FORCE', label: 'Aplicar Fuerza', color: 'bg-indigo-600', icon: Wind, mode: 'ACTION' },
        { type: 'DAMAGE_OBJECT', label: 'Dañar Salud', color: 'bg-red-600', icon: Activity, mode: 'ACTION' },
    ]
};
