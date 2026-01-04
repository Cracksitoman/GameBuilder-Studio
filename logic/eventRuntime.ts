
import { GameObject } from '../types';
import { checkTouchCondition } from './conditions/touch';
import { checkCollisionCondition } from './conditions/collision';
import { checkTimerCondition } from './conditions/timer';
import { executeCreateObject } from './actions/createObject';
import { executeDestroy } from './actions/destroy';
import { executeApplyForce } from './actions/force';

export const checkRectCollision = (r1: any, r2: any) => 
  (r1.x < r2.x + r2.width && r1.x + r1.width > r2.x && r1.y < r2.y + r2.height && r1.y + r1.height > r2.y);

export const checkCondition = (cond: any, obj: any, currentObjects: any[], dt: number, time: number): boolean => {
  switch (cond.type) {
    case 'START_OF_SCENE':
      return time < 100;
    case 'TOUCH_INTERACTION':
      return checkTouchCondition(cond, obj);
    case 'COLLISION':
      return checkCollisionCondition(cond, obj, currentObjects);
    case 'EVERY_X_SECONDS':
      return checkTimerCondition(cond, obj, dt);
    default:
      return false;
  }
};

export const executeAction = (act: any, obj: any, currentObjects: any[], library: GameObject[], spawnQueue: any[]) => {
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
  }
  return null;
};
