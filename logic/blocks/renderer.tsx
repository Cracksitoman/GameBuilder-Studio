
import React from 'react';
import { InlineInput, InlineSelect } from './layoutComponents';

export const renderBlockContent = (type: string, params: any, onChange: (p: any) => void, context: any) => {
    const { library, scenes, globalVariables } = context;
    const safeParams = params || {};
    const libraryOptions = library.map((o: any) => ({ value: o.id, label: o.name }));
    const sceneOptions = scenes.map((s: any) => ({ value: s.id, label: s.name }));

    switch(type) {
        case 'MOVE_FORWARD':
            return <div className="flex items-center space-x-1"><span>Mover</span><InlineInput type="number" value={safeParams.steps} onChange={(v:any)=>onChange({steps:v})} /><span>pasos</span></div>;
        case 'CREATE_OBJECT':
            return (
                <div className="flex items-center space-x-1">
                    <span>Crear</span>
                    <InlineSelect width="w-20" value={safeParams.sourceObjectId} onChange={(v:any)=>onChange({sourceObjectId:v})} options={libraryOptions} />
                    <span>en</span>
                    <InlineSelect width="w-16" value={safeParams.spawnOrigin} onChange={(v:any)=>onChange({spawnOrigin:v})} options={[{value:'SELF', label:'Sí mismo'}, {value:'SPECIFIC', label:'Objeto...'}]} />
                </div>
            );
        case 'TOUCH_INTERACTION':
            return <div className="flex items-center space-x-1"><span>Al</span><InlineSelect width="w-24" value={safeParams.subtype} onChange={(v:any)=>onChange({subtype:v})} options={[{value:'CLICK', label:'Clic'}, {value:'LONG_PRESS', label:'Mantener'}]} /></div>;
        case 'EVERY_X_SECONDS':
            return <div className="flex items-center space-x-1"><span>Cada</span><InlineInput type="number" value={safeParams.interval} onChange={(v:any)=>onChange({interval:v})} /><span>seg</span></div>;
        case 'COLLISION':
            return <div className="flex items-center space-x-1"><span>Choca con</span><InlineSelect width="w-24" value={safeParams.targetId} onChange={(v:any)=>onChange({targetId:v})} options={libraryOptions} /></div>;
        case 'CHANGE_SCENE':
            return <div className="flex items-center space-x-1"><span>Ir a</span><InlineSelect width="w-20" value={safeParams.sceneId} onChange={(v:any)=>onChange({sceneId:v})} options={sceneOptions} /></div>;
        case 'MODIFY_VARIABLE':
            return (
                <div className="flex items-center space-x-1">
                    <InlineSelect width="w-12" value={safeParams.operation} onChange={(v:any)=>onChange({operation:v})} options={[{value:'SET',label:'='},{value:'ADD',label:'+'}]} />
                    <InlineInput width="w-16" value={safeParams.varId} onChange={(v:any)=>onChange({varId:v})} />
                    <span>a</span>
                    <InlineInput width="w-10" value={safeParams.value} onChange={(v:any)=>onChange({value:v})} />
                </div>
            );
        default:
            return <span>{type}</span>;
    }
};
