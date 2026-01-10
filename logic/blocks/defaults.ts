export const getBlockDefaults = (type: string, library: any[], scenes: any[]): any => {
    switch(type) {
        case 'ALWAYS': return {};
        case 'PUSH_TO_ARRAY': return { varId: '', source: 'GLOBAL', value: 'Item' };
        case 'REMOVE_FROM_ARRAY': return { varId: '', source: 'GLOBAL', index: 0 };
        case 'CREATE_OBJECT': return { sourceObjectId: library[0]?.id || '', spawnOrigin: 'SELF' };
        case 'TOUCH_INTERACTION': return { subtype: 'CLICK' };
        case 'EVERY_X_SECONDS': return { interval: 1 };
        case 'COLLISION': return { targetId: library[0]?.id || '' };
        case 'COMPARE_VARIABLE': return { scope: 'LOCAL', varId: 'vida', operator: 'LESS', value: 0, targetId: '' };
        case 'MODIFY_VARIABLE': return { scope: 'LOCAL', varId: 'vida', operation: 'ADD', value: 1, targetId: '' };
        case 'MOVE_FORWARD': return { steps: 10 };
        case 'SET_VISIBLE': return { visible: true };
        case 'CHANGE_SCENE': return { sceneId: scenes[0]?.id || '' };
        case 'DESTROY': return { target: 'SELF' };
        case 'DISTANCE_TO': return { targetId: library[0]?.id || '', distance: 100, operator: 'LESS' };
        case 'APPLY_FORCE': return { forceX: 0, forceY: -500 };
        case 'REPEAT_X_TIMES': return { count: 10 };
        case 'SET_TILE': return { targetId: '', x: 0, y: 0, tileId: '' };
        // NUEVOS VALORES POR DEFECTO
        case 'PLAY_ANIMATION': return { animationId: '' };
        case 'PLAY_SOUND': return { soundId: '', loop: false };
        case 'CAMERA_SHAKE': return { duration: 0.5, intensity: 5 };
        default: return {};
    }
};