
export enum ObjectType {
  SPRITE = 'SPRITE',
  TEXT = 'TEXT',
  PLAYER = 'PLAYER',
  ENEMY = 'ENEMY',
  TILEMAP = 'TILEMAP' // New
}

export enum EditorTool {
  SELECT = 'SELECT', // Move objects
  RESIZE = 'RESIZE', // Resize objects
  HAND = 'HAND',      // Move camera/canvas
  BRUSH = 'BRUSH',    // Paint on Tilemaps
  ERASER = 'ERASER'   // Erase tiles
}

// --- BEHAVIORS SYSTEM ---
export enum BehaviorType {
  PLATFORMER = 'PLATFORMER', // Gravity, Jump, Walk
  TOPDOWN = 'TOPDOWN',       // 8-direction movement (RPG)
  PROJECTILE = 'PROJECTILE', // Linear movement (Bullets)
  FOLLOW = 'FOLLOW',         // Follows player (AI)
  ROTATE = 'ROTATE',         // Constant rotation
  SINE_MOVEMENT = 'SINE',    // Floating movement
  ANIMATION = 'ANIMATION'    // Sprite Animation Manager
}

export interface Asset {
  id: string;
  name: string;
  url: string; // Base64 Data URL
  type: 'image';
}

export interface AnimationFrame {
  id: string;
  imageUrl: string;
}

export interface AnimationClip {
  id: string;
  name: string; // e.g., "Idle", "Run", "Jump"
  frames: AnimationFrame[];
  fps: number;
  loop: boolean;
}

export interface Behavior {
  id: string;
  type: BehaviorType;
  name: string;
  // We use a generic record to store specific properties for each behavior
  properties: Record<string, any>; 
}
// ------------------------

// --- VARIABLE SYSTEM ---
export type VariableType = 'NUMBER' | 'BOOLEAN' | 'STRING';

export interface Variable {
  id: string;
  name: string;
  type: VariableType;
  value: any;
}

export interface TextBinding {
  source: 'GLOBAL' | 'LOCAL' | 'OBJECT'; // Added OBJECT source
  variableId: string; // Uses Variable Name as ID for simplicity in runtime lookup
  targetObjectId?: string; // ID of the object if source is OBJECT
  prefix?: string;
  suffix?: string;
}
// ------------------------

// --- EVENT SYSTEM TYPES ---
export type ConditionType = 'COLLISION' | 'START_OF_SCENE' | 'KEY_PRESSED' | 'COMPARE_VARIABLE';
export type ActionType = 'DESTROY' | 'RESTART_SCENE' | 'CHANGE_SCENE' | 'SET_VISIBLE' | 'MODIFY_VARIABLE'; 

export interface EventCondition {
  id: string;
  type: ConditionType;
  parameters: Record<string, any>; 
}

export interface EventAction {
  id: string;
  type: ActionType;
  parameters: Record<string, any>; 
}

export interface GameEvent {
  id: string;
  conditions: EventCondition[];
  actions: EventAction[];
}
// ------------------------

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
}

export interface TileData {
  url: string;
  solid: boolean;
}

export interface TilemapData {
  tileSize: number; // e.g. 32
  // Key: "x,y" (grid coords), Value: Tile object or string (legacy support handled in runtime)
  tiles: Record<string, TileData | string>; 
}

export interface GameObject {
  id: string;
  name: string;
  type: ObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  zIndex: number; 
  layerId: string;
  visible: boolean;
  opacity: number;
  previewSpriteUrl?: string; // New: Holds the static sprite for the editor
  // Physics properties
  isObstacle: boolean; // New: If true, other objects collide with this
  // List of attached behaviors
  behaviors: Behavior[]; 
  // Object Specific Events
  events: GameEvent[]; 
  // Local Variables
  variables: Variable[];
  // Text Binding (Only for TEXT objects)
  textBinding?: TextBinding;
  // Tilemap Data (Only for TILEMAP objects)
  tilemap?: TilemapData;
}

export interface Scene {
  id: string;
  name: string;
  objects: GameObject[];
  layers: Layer[]; // Layers are now per-scene
  backgroundColor: string;
}

export interface CanvasConfig {
  width: number;
  height: number;
  mode: 'LANDSCAPE' | 'PORTRAIT';
}

export interface EditorState {
  currentSceneId: string;
  selectedObjectId: string | null;
  zoom: number;
  isPreviewing: boolean;
}