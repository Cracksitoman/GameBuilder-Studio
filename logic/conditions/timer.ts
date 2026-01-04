
export const checkTimerCondition = (cond: any, obj: any, dt: number): boolean => {
  const interval = cond.parameters.interval || 1;
  if (!obj.timers) obj.timers = {};
  
  obj.timers[cond.id] = (obj.timers[cond.id] || 0) + dt;
  
  if (obj.timers[cond.id] >= interval) {
    obj.timers[cond.id] = 0;
    return true;
  }
  return false;
};
