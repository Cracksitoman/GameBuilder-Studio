
export const executeDestroy = (act: any, obj: any) => {
  // Por ahora destruye el objeto que tiene el evento
  // Se puede expandir para destruir el 'OTHER' en colisiones
  obj.isMarkedForDestroy = true;
};
