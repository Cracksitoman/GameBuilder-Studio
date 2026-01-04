
import { checkRectCollision } from '../eventRuntime';

export const checkCollisionCondition = (cond: any, obj: any, currentObjects: any[]): boolean => {
  const targetId = cond.parameters.targetId;
  if (!targetId) return false;

  return currentObjects.some(other => 
    other.id !== obj.id && 
    (other.id === targetId || other.prototypeId === targetId) && 
    checkRectCollision(obj, other)
  );
};
