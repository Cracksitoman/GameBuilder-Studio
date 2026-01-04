
import { GameObject } from '../../types';

export const executeCreateObject = (act: any, obj: any, currentObjects: any[], library: GameObject[], spawnQueue: any[]) => {
  const proto = library.find(l => l.id === act.parameters.sourceObjectId);
  if (!proto) return;

  let spawnX = obj.x + obj.width / 2 - proto.width / 2;
  let spawnY = obj.y + obj.height / 2 - proto.height / 2;

  // Si el usuario seleccionó un objeto específico como origen
  if (act.parameters.spawnOrigin === 'SPECIFIC') {
    const targetId = act.parameters.spawnTargetId;
    const anchor = currentObjects.find(o => o.id === targetId || o.prototypeId === targetId);
    if (anchor) {
      spawnX = anchor.x + anchor.width / 2 - proto.width / 2;
      spawnY = anchor.y + anchor.height / 2 - proto.height / 2;
    }
  }

  spawnQueue.push({
    ...JSON.parse(JSON.stringify(proto)),
    id: crypto.randomUUID(),
    prototypeId: proto.id,
    x: spawnX,
    y: spawnY,
    vx: 0,
    vy: 0,
    rotation: obj.rotation,
    timers: {},
    isPointerDown: false
  });
};
