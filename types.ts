
export enum ObjectType {
  SPRITE = 'SPRITE',
  TEXT = 'TEXT',
  PLAYER = 'PLAYER',
  ENEMY = 'ENEMY',
  TILEMAP = 'TILEMAP'
}

export enum EditorTool {
  SELECT = 'SELECT',
  RESIZE = 'RESIZE',
  HAND = 'HAND',
  BRUSH = 'BRUSH',
  ERASER = 'ERASER'
}

export enum BehaviorType {
  PLATFORMER = 'PLATFORMER',
  TOPDOWN = 'TOPDOWN',
  PROJECTILE = 'PROJECTILE',
  FOLLOW = 'FOLLOW',
  ROTATE = 'ROTATE',
  SINE_MOVEMENT = 'SINE',
  ANIMATION = 'ANIMATION'
}

export interface Asset {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'audio'; 
}

export interface AnimationFrame {
  id: string;
  imageUrl: string;
}

export interface AnimationClip {
  id: string;
  name: string;
  frames: AnimationFrame[];
  fps: number;
  loop: boolean;
}

export interface Behavior {
  id: string;
  type: BehaviorType;
  name: string;
  properties: Record<string, any>; 
}

export type VariableType = 'NUMBER' | 'BOOLEAN' | 'STRING';

export interface Variable {
  id: string;
  name: string;
  type: VariableType;
  value: any;
}

export interface TextBinding {
  source: 'GLOBAL' | 'LOCAL' | 'OBJECT';
  variableId: string;
  targetObjectId?: string;
  prefix?: string;
  suffix?: string;
}

export type ConditionType = 
  | 'COLLISION' 
  | 'START_OF_SCENE' 
  | 'KEY_PRESSED' 
  | 'COMPARE_VARIABLE'
  | 'TOUCH_INTERACTION'
  | 'EVERY_X_SECONDS'
  | 'DISTANCE_TO'
  | 'IS_MOVING'
  | 'IS_VISIBLE'
  | 'COMPARE_POSITION';

export type ActionType = 
  | 'DESTROY' 
  | 'RESTART_SCENE' 
  | 'CHANGE_SCENE' 
  | 'SET_VISIBLE' 
  | 'MODIFY_VARIABLE'
  | 'MOVE_TO_POINTER'
  | 'CREATE_OBJECT'
  | 'SET_TEXT'
  | 'CAMERA_SHAKE'
  | 'ROTATE_TOWARD'
  | 'APPLY_FORCE'
  | 'PLAY_ANIMATION'
  | 'TOGGLE_BEHAVIOR'
  | 'SPAWN_PARTICLES'
  | 'PLAY_SOUND'
  | 'SET_VELOCITY'
  | 'STOP_MOVEMENT'
  | 'SET_COLOR'
  | 'SET_OPACITY'
  | 'SET_SIZE'
  | 'FLASH_EFFECT'
  | 'SET_CAMERA_ZOOM';

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
  tileSize: number;
  tiles: Record<string, TileData | string>; 
}

export interface GameObject {
  id: string;
  prototypeId?: string; // NEW: Links instance to library object
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
  group?: string; // Group/Folder Name
  visible: boolean;
  opacity: number;
  previewSpriteUrl?: string;
  isObstacle: boolean;
  isGui?: boolean;
  behaviors: Behavior[]; 
  events: GameEvent[]; 
  variables: Variable[];
  textBinding?: TextBinding;
  tilemap?: TilemapData;
  script?: string;
}

export interface CameraConfig {
    targetObjectId: string | null;
    smooth: boolean;
    followSpeed: number;
    zoom?: number;
}

export interface MobileControlsConfig {
    enabled: boolean;
    joystickX: number; 
    joystickY: number; 
    joystickSize: number; 
    buttonX: number; 
    buttonY: number; 
    buttonSize: number; 
    opacity: number;
    color: string;
}

export interface Scene {
  id: string;
  name: string;
  objects: GameObject[];
  layers: Layer[];
  groups?: string[]; // Defined Groups in Scene
  backgroundColor: string;
  camera?: CameraConfig;
}

export interface CanvasConfig {
  width: number;
  height: number;
  mode: 'LANDSCAPE' | 'PORTRAIT';
  mobileControls?: MobileControlsConfig; 
}

export interface EditorState {
  currentSceneId: string;
  selectedObjectId: string | null;
  zoom: number;
  isPreviewing: boolean;
}
