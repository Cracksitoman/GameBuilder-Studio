export const checkTouchCondition = (cond: any, obj: any): boolean => {
  const subtype = cond.parameters.subtype || 'CLICK';

  if (subtype === 'CLICK') {
    // 1 Toque (Tap)
    return !!obj.justTapped;
  }
  if (subtype === 'DOUBLE_CLICK') {
    // Doble Toque
    return !!obj.isDoubleTapped;
  }
  if (subtype === 'HOLD') {
    // Mantener presionado (Hold) más de 500ms
    return obj.isPointerDown && (obj.holdDuration > 0.5);
  }
  return false;
};