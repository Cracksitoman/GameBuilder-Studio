
export const executeApplyForce = (act: any, obj: any) => {
  const fx = act.parameters.forceX || 0;
  const fy = act.parameters.forceY || 0;
  
  // Aplicar a la velocidad del objeto actual
  obj.vx += fx;
  obj.vy += fy;
};
