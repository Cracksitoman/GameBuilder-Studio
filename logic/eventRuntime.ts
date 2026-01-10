import { GameObject } from '../types';
import { checkTouchCondition } from './conditions/touch';
import { checkCollisionCondition } from './conditions/collision';
import { checkTimerCondition } from './conditions/timer';
import { executeCreateObject } from './actions/createObject';
import { executeDestroy } from './actions/destroy';
import { executeApplyForce } from './actions/force';

export const checkRectCollision = (r1: any, r2: any) => 
  (r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y);

// Helper para normalizar nombres de variables (Trim + Lowercase)
const normalize = (str: string) => str ? str.toString().trim().toLowerCase() : '';

// Resolver el valor de una variable con fallback al prototipo de la librería
export const resolveVariableValue = (scope: string, varName: string, obj: any, currentObjects: any[], globals: any[], library: any[] = [], targetId?: string) => {
    const targetName = normalize(varName);

    if (scope === 'GLOBAL') {
        const v = globals.find(g => normalize(g.name) === targetName);
        return v ? v.value : 0;
    }
    
    // Función auxiliar para buscar variable en un objeto o su prototipo
    const findVarInObject = (targetObj: any) => {
        if (!targetObj) return 0;
        
        // 1. Buscar en la instancia actual (Normalizado)
        const localVar = (targetObj.variables || []).find((v: any) => normalize(v.name) === targetName);
        if (localVar !== undefined) return localVar.value;

        // 2. Si no está y tiene prototypeId, buscar en la librería (valor por defecto)
        if (targetObj.prototypeId) {
            const proto = library.find(p => p.id === targetObj.prototypeId);
            if (proto) {
                const protoVar = (proto.variables || []).find((v: any) => normalize(v.name) === targetName);
                if (protoVar !== undefined) return protoVar.value;
            }
        }
        
        // 3. Si no existe, devolver 0 por defecto
        return 0;
    };

    if (scope === 'LOCAL') {
        return findVarInObject(obj);
    }
    
    if (scope === 'OBJECT' && targetId) {
        const target = currentObjects.find(o => o.id === targetId || o.prototypeId === targetId);
        return findVarInObject(target);
    }
    
    return 0;
};

// Check condition ahora recibe frameCount en lugar de 'time' absoluto para ser determinista
export const checkCondition = (cond: any, obj: any, currentObjects: any[], dt: number, frameCount: number, globals: any[] = [], inputs: any = {}, library: any[] = []): boolean => {
  switch (cond.type) {
    case 'ALWAYS':
      return true;
    case 'START_OF_SCENE':
      // Se ejecuta SOLO en el frame 0. Esto garantiza que las variables se inicialicen antes de que corran otros eventos.
      return frameCount === 0;
    case 'TOUCH_INTERACTION':
      return checkTouchCondition(cond, obj);
    case 'COLLISION':
      return checkCollisionCondition(cond, obj, currentObjects);
    case 'EVERY_X_SECONDS':
      return checkTimerCondition(cond, obj, dt);
    case 'DISTANCE_TO': {
        const targetId = cond.parameters.targetId;
        const target = currentObjects.find(o => o.id === targetId || o.prototypeId === targetId);
        if (!target) return false;
        
        const cx1 = obj.x + obj.width / 2;
        const cy1 = obj.y + obj.height / 2;
        const cx2 = target.x + target.width / 2;
        const cy2 = target.y + target.height / 2;
        
        const dist = Math.sqrt(Math.pow(cx2 - cx1, 2) + Math.pow(cy2 - cy1, 2));
        const threshold = parseFloat(cond.parameters.distance) || 100;
        const operator = cond.parameters.operator || 'LESS';

        if (operator === 'LESS') return dist < threshold;
        if (operator === 'GREATER') return dist > threshold;
        return false;
    }
    case 'KEY_PRESSED': {
        const key = cond.parameters.key || 'ACTION'; 
        if (key === 'LEFT') return !!inputs.left;
        if (key === 'RIGHT') return !!inputs.right;
        if (key === 'UP') return !!inputs.up;
        if (key === 'DOWN') return !!inputs.down;
        if (key === 'ACTION' || key === 'SPACE') return !!inputs.action;
        return false;
    }
    case 'COMPARE_VARIABLE': {
        const { scope, varId, operator, value, targetId } = cond.parameters;
        // Pasamos library para resolver valores por defecto correctamente
        const currentVal = resolveVariableValue(scope, varId, obj, currentObjects, globals, library, targetId);
        
        // Detectar si el operador implica una comparación numérica estricta
        const isNumericOperator = ['LESS', 'GREATER', 'LESS_EQUAL', 'GREATER_EQUAL'].includes(operator);
        
        let targetVal = parseFloat(value);
        // Si el valor objetivo no es un número válido (ej. vacío), usamos 0 para operadores numéricos
        if (isNaN(targetVal) && isNumericOperator) targetVal = 0;

        if (isNumericOperator) {
            // FORZAR MODO NUMÉRICO
            const nCur = parseFloat(currentVal);
            const finalCur = isNaN(nCur) ? 0 : nCur; // Si la variable actual es texto o vacía, es 0

            switch(operator) {
                case 'LESS': return finalCur < targetVal;
                case 'GREATER': return finalCur > targetVal;
                case 'LESS_EQUAL': return finalCur <= targetVal;
                case 'GREATER_EQUAL': return finalCur >= targetVal;
            }
        } else {
            // MODO MIXTO (IGUAL / NO IGUAL)
            // Si targetVal es NaN, comparamos como String
            if (isNaN(targetVal)) {
                const sCur = String(currentVal);
                const sTar = String(value);
                switch(operator) {
                    case 'EQUAL': return sCur === sTar;
                    case 'NOT_EQUAL': return sCur !== sTar;
                    default: return false;
                }
            } else {
                // Comparamos como Número
                const nCur = parseFloat(currentVal) || 0;
                switch(operator) {
                    case 'EQUAL': return Math.abs(nCur - targetVal) < 0.0001; 
                    case 'NOT_EQUAL': return Math.abs(nCur - targetVal) > 0.0001;
                    default: return false;
                }
            }
        }
        return false;
    }
    default:
      return false;
  }
};

export const executeAction = (act: any, obj: any, currentObjects: any[], library: GameObject[], spawnQueue: any[], plugins: any[] = [], globals: any[] = [], assets: any[] = []) => {
  
  // 1. Verificar si la acción pertenece a un Plugin
  const plugin = plugins.find(p => p.blocks.some((b: any) => b.type === act.type));
  if (plugin && plugin.code) {
      try {
          // Ejecutar el código del plugin de forma dinámica
          const fn = new Function('type', 'params', 'obj', 'currentObjects', 'library', 'spawnQueue', 'globals', plugin.code);
          const result = fn(act.type, act.parameters || {}, obj, currentObjects, library, spawnQueue, globals);
          
          // Si el plugin devuelve un resultado (ej. cambio de escena), lo retornamos
          if (result) return result;
      } catch (err) {
          console.warn("Error ejecutando plugin:", err);
      }
  }

  // 2. Acciones Nativas
  switch (act.type) {
    case 'CREATE_OBJECT':
      executeCreateObject(act, obj, currentObjects, library, spawnQueue);
      break;
    case 'DESTROY':
      executeDestroy(act, obj);
      break;
    case 'APPLY_FORCE':
      executeApplyForce(act, obj);
      break;
    case 'RESTART_SCENE':
      return 'RESTART';
    case 'CHANGE_SCENE':
        return { type: 'CHANGE_SCENE', sceneId: act.parameters.sceneId };
    case 'SET_VISIBLE':
        obj.visible = act.parameters.visible !== 'false' && act.parameters.visible !== false; 
        break;
    case 'SET_X':
        obj.x = parseFloat(act.parameters.val) || 0;
        break;
    case 'SET_Y':
        obj.y = parseFloat(act.parameters.val) || 0;
        break;
    case 'SET_ROTATION':
        obj.rotation = parseFloat(act.parameters.val) || 0;
        break;
    case 'SET_TEXT':
        obj.name = String(act.parameters.text);
        break;
    
    // MEJORAS IMPLEMENTADAS AQUÍ
    case 'PLAY_ANIMATION': {
        const animId = act.parameters.animationId;
        const asset = assets.find(a => a.id === animId);
        if (asset && asset.url) {
            obj.previewSpriteUrl = asset.url; // Cambia el sprite del objeto en tiempo real
        }
        break;
    }
    case 'PLAY_SOUND': {
        const soundId = act.parameters.soundId;
        const asset = assets.find(a => a.id === soundId);
        const loop = act.parameters.loop === true || act.parameters.loop === 'true';
        if (asset && asset.url) {
            return { type: 'PLAY_SOUND', url: asset.url, loop };
        }
        break;
    }
    case 'CAMERA_SHAKE': {
        const duration = parseFloat(act.parameters.duration) || 0.5;
        const intensity = parseFloat(act.parameters.intensity) || 5;
        return { type: 'CAMERA_SHAKE', duration, intensity };
    }

    case 'MOVE_FORWARD': {
        const steps = parseFloat(act.parameters.steps) || 0;
        const rad = (obj.rotation * Math.PI) / 180;
        obj.x += Math.cos(rad) * steps;
        obj.y += Math.sin(rad) * steps;
        break;
    }
    case 'MODIFY_VARIABLE': {
        const scope = act.parameters.scope || 'LOCAL';
        const varName = act.parameters.varId;
        const op = act.parameters.operation || 'SET';
        const val = parseFloat(act.parameters.value) || 0;

        if (scope === 'GLOBAL') {
             const targetName = normalize(varName);
             let variable = globals.find(v => normalize(v.name) === targetName);
             if (!variable) {
                 variable = { id: crypto.randomUUID(), name: varName, type: 'NUMBER', value: 0 };
                 globals.push(variable);
             }
             applyOperation(variable, op, val);
        } else if (scope === 'LOCAL') {
             // Pasamos la librería para inicializar con el valor correcto si no existe en la instancia
             modifyVarOnObject(obj, varName, op, val, library);
        } else if (scope === 'OBJECT') {
            const targetId = act.parameters.targetId;
            const targets = currentObjects.filter(o => o.id === targetId || o.prototypeId === targetId);
            targets.forEach(t => modifyVarOnObject(t, varName, op, val, library));
        }
        break;
    }
  }
  return null;
};

function modifyVarOnObject(obj: any, varName: string, op: string, val: number, library: any[] = []) {
    if (!obj.variables) obj.variables = [];
    const targetName = normalize(varName);
    let variable = obj.variables.find((v: any) => normalize(v.name) === targetName);
    
    // Si la variable no existe en la instancia, intentamos obtener su valor inicial del prototipo
    if (!variable) {
        let initialValue = 0;
        if (obj.prototypeId) {
            const proto = library.find(p => p.id === obj.prototypeId);
            const protoVar = (proto?.variables || []).find((v: any) => normalize(v.name) === targetName);
            if (protoVar) initialValue = parseFloat(protoVar.value) || 0;
        }

        variable = { id: crypto.randomUUID(), name: varName, type: 'NUMBER', value: initialValue };
        obj.variables.push(variable);
    }
    applyOperation(variable, op, val);
}

function applyOperation(variable: any, op: string, val: number) {
    const current = parseFloat(variable.value);
    const nCur = isNaN(current) ? 0 : current;

    if (op === 'SET') {
        variable.value = val;
    } else if (op === 'ADD') {
        variable.value = nCur + val;
    } else if (op === 'SUBTRACT' || op === 'SUB') {
        variable.value = nCur - val;
    }
}

export const resolveTextContent = (obj: GameObject, currentObjects: any[], globals: any[], library: any[] = []) => {
    if (!obj.textBinding?.enabled) return obj.name;
    const { source, variableName, targetObjectId } = obj.textBinding;
    
    if (!variableName) return obj.name;

    const value = resolveVariableValue(source, variableName, obj, currentObjects, globals, library, targetObjectId);
    const displayValue = (value === null || value === undefined) ? '0' : value;
    
    if (obj.name === 'Texto Nuevo' || !obj.name || obj.name === 'Text') return String(displayValue);
    
    return `${obj.name}: ${displayValue}`;
};