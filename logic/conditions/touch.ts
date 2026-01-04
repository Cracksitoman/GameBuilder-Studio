
export const checkTouchCondition = (cond: any, obj: any): boolean => {
  if (cond.parameters.subtype === 'CLICK') {
    if (obj.isPointerDown) {
      obj.isPointerDown = false; // Consumir el clic para que no se repita
      return true;
    }
  }
  return false;
};
