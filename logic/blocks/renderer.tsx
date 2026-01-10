import React from 'react';
import { InlineInput, InlineSelect } from './layoutComponents';

export const renderBlockContent = (type: string, params: any, onChange: (p: any) => void, context: any) => {
    const { library, scenes, globalVariables, plugins = [], selectedObject, assets = [] } = context;
    const safeParams = params || {};
    const libraryOptions = library.map((o: any) => ({ value: o.id, label: o.name }));
    const sceneOptions = scenes.map((s: any) => ({ value: s.id, label: s.name }));

    // Filtrar assets
    const imageOptions = assets.filter((a: any) => a.type === 'image').map((a: any) => ({ value: a.id, label: a.name }));
    const soundOptions = assets.filter((a: any) => a.type === 'audio').map((a: any) => ({ value: a.id, label: a.name }));

    const getVarOptions = (scope: string, targetId?: string) => {
        let vars: any[] = [];
        if (scope === 'GLOBAL') {
            vars = globalVariables || [];
        } else if (scope === 'LOCAL' && selectedObject) {
            vars = selectedObject.variables || [];
        } else if (scope === 'OBJECT' && targetId) {
            const target = library.find(o => o.id === targetId);
            vars = target?.variables || [];
        }
        if (vars.length === 0) return null;
        const uniqueNames = Array.from(new Set(vars.map(v => v.name)));
        return uniqueNames.map(name => ({ value: name, label: name }));
    };

    const varOptions = getVarOptions(safeParams.scope || 'LOCAL', safeParams.targetId);

    const allPlugins = plugins as any[];
    const pluginBlock = allPlugins.flatMap(p => p.blocks).find(b => b.type === type);

    if (pluginBlock) {
        return (
            <div className="flex items-center space-x-1 flex-wrap">
                <span className="mr-1">{pluginBlock.label}</span>
                {pluginBlock.params.map((p: any) => (
                    <React.Fragment key={p.name}>
                        {p.label && <span className="text-white/60 mx-1">{p.label}</span>}
                        {p.type === 'select' ? (
                            <InlineSelect 
                                value={safeParams[p.name]} 
                                onChange={(v: any) => onChange({ [p.name]: v })}
                                options={p.options || []}
                            />
                        ) : p.type === 'scene' ? (
                            <InlineSelect 
                                value={safeParams[p.name]} 
                                onChange={(v: any) => onChange({ [p.name]: v })}
                                options={sceneOptions}
                            />
                        ) : (
                            <InlineInput 
                                type={p.type === 'number' ? 'number' : 'text'}
                                value={safeParams[p.name]} 
                                onChange={(v: any) => onChange({ [p.name]: v })} 
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>
        );
    }

    switch(type) {
        case 'ALWAYS':
            return <span>Siempre (en cada frame)</span>;
        case 'START_OF_SCENE':
            return <span>Al inicio de la escena</span>;
        case 'PLAY_ANIMATION':
            return (
                <div className="flex items-center space-x-1 flex-wrap">
                    <span>Animación (Sprite)</span>
                    <InlineSelect 
                        width="w-32" 
                        value={safeParams.animationId} 
                        onChange={(v:any) => onChange({animationId: v})} 
                        options={[{value: '', label: '-- Elegir --'}, ...imageOptions]} 
                    />
                </div>
            );
        case 'PLAY_SOUND':
            return (
                <div className="flex items-center space-x-1 flex-wrap">
                    <span>Sonido</span>
                    <InlineSelect 
                        width="w-32" 
                        value={safeParams.soundId} 
                        onChange={(v:any) => onChange({soundId: v})} 
                        options={[{value: '', label: '-- Elegir --'}, ...soundOptions]} 
                    />
                    <InlineSelect 
                        width="w-20"
                        value={safeParams.loop} 
                        onChange={(v:any) => onChange({loop: v === 'true'})} 
                        options={[{value: false, label: '1 vez'}, {value: true, label: 'Bucle'}]} 
                    />
                </div>
            );
        case 'CAMERA_SHAKE':
            return (
                <div className="flex items-center space-x-1 flex-wrap">
                    <span>Agitar</span>
                    <InlineInput type="number" width="w-12" value={safeParams.duration} onChange={(v:any)=>onChange({duration:v})} />
                    <span>seg, Fuerza:</span>
                    <InlineInput type="number" width="w-12" value={safeParams.intensity} onChange={(v:any)=>onChange({intensity:v})} />
                </div>
            );
        case 'MOVE_FORWARD':
            return <div className="flex items-center space-x-1"><span>Mover</span><InlineInput type="number" value={safeParams.steps} onChange={(v:any)=>onChange({steps:v})} /><span>px adelante</span></div>;
        case 'SET_X':
            return <div className="flex items-center space-x-1"><span>Fijar X a</span><InlineInput type="number" value={safeParams.val} onChange={(v:any)=>onChange({val:v})} /></div>;
        case 'SET_Y':
            return <div className="flex items-center space-x-1"><span>Fijar Y a</span><InlineInput type="number" value={safeParams.val} onChange={(v:any)=>onChange({val:v})} /></div>;
        case 'SET_ROTATION':
            return <div className="flex items-center space-x-1"><span>Rotación a</span><InlineInput type="number" value={safeParams.val} onChange={(v:any)=>onChange({val:v})} /><span>grados</span></div>;
        case 'SET_VISIBLE':
            return <div className="flex items-center space-x-1"><span>Visible:</span><InlineSelect width="w-20" value={safeParams.visible} onChange={(v:any)=>onChange({visible:v})} options={[{value:true, label:'SI'}, {value:false, label:'NO'}]} /></div>;
        case 'SET_TEXT':
            return <div className="flex items-center space-x-1"><span>Texto:</span><InlineInput type="text" width="w-32" value={safeParams.text} onChange={(v:any)=>onChange({text:v})} /></div>;
        case 'KEY_PRESSED':
            return <div className="flex items-center space-x-1"><span>Tecla</span><InlineSelect width="w-24" value={safeParams.key} onChange={(v:any)=>onChange({key:v})} options={[{value:'LEFT',label:'Izquierda'},{value:'RIGHT',label:'Derecha'},{value:'UP',label:'Arriba'},{value:'DOWN',label:'Abajo'},{value:'ACTION',label:'Acción (A)'}]} /></div>;
        case 'CREATE_OBJECT':
            return (
                <div className="flex items-center space-x-1 flex-wrap">
                    <span>Crear</span>
                    <InlineSelect width="w-24" value={safeParams.sourceObjectId} onChange={(v:any)=>onChange({sourceObjectId:v})} options={libraryOptions} />
                    <span>en</span>
                    <InlineSelect width="w-20" value={safeParams.spawnOrigin} onChange={(v:any)=>onChange({spawnOrigin:v})} options={[{value:'SELF', label:'Sí mismo'}, {value:'SPECIFIC', label:'Objeto...'}]} />
                    {safeParams.spawnOrigin === 'SPECIFIC' && <InlineSelect width="w-24" value={safeParams.spawnTargetId} onChange={(v:any)=>onChange({spawnTargetId:v})} options={libraryOptions} />}
                </div>
            );
        case 'TOUCH_INTERACTION':
            return (
                <div className="flex items-center space-x-1">
                    <span>Al</span>
                    <InlineSelect 
                        width="w-32" 
                        value={safeParams.subtype} 
                        onChange={(v:any)=>onChange({subtype:v})} 
                        options={[
                            {value:'CLICK', label:'1 Toque (Tap)'},
                            {value:'DOUBLE_CLICK', label:'Doble Toque'},
                            {value:'HOLD', label:'Mantener Presionado'}
                        ]} 
                    />
                </div>
            );
        case 'EVERY_X_SECONDS':
            return <div className="flex items-center space-x-1"><span>Cada</span><InlineInput type="number" value={safeParams.interval} onChange={(v:any)=>onChange({interval:v})} /><span>seg</span></div>;
        case 'COLLISION':
            return <div className="flex items-center space-x-1"><span>Choca con</span><InlineSelect width="w-28" value={safeParams.targetId} onChange={(v:any)=>onChange({targetId:v})} options={libraryOptions} /></div>;
        case 'DISTANCE_TO':
            return (
                <div className="flex items-center space-x-1 flex-wrap">
                    <span>Distancia a</span>
                    <InlineSelect width="w-24" value={safeParams.targetId} onChange={(v:any)=>onChange({targetId:v})} options={libraryOptions} />
                    <InlineSelect width="w-12" value={safeParams.operator} onChange={(v:any)=>onChange({operator:v})} options={[{value:'LESS', label:'<'}, {value:'GREATER', label:'>'}]} />
                    <InlineInput width="w-16" type="number" value={safeParams.distance} onChange={(v:any)=>onChange({distance:v})} />
                </div>
            );
        case 'CHANGE_SCENE':
            return (
                <div className="flex items-center space-x-1">
                    <span>Ir a</span>
                    <InlineSelect 
                        width="w-24" 
                        value={safeParams.sceneId} 
                        onChange={(v:any)=>onChange({sceneId:v})} 
                        options={sceneOptions} 
                    />
                </div>
            );
        case 'RESTART_SCENE':
            return <span>Reiniciar Escena</span>;
        case 'APPLY_FORCE':
            return <div className="flex items-center space-x-1"><span>Empujar X:</span><InlineInput type="number" value={safeParams.forceX} onChange={(v:any)=>onChange({forceX:v})} /><span>Y:</span><InlineInput type="number" value={safeParams.forceY} onChange={(v:any)=>onChange({forceY:v})} /></div>;
        case 'DESTROY':
            return <span>Destruir Objeto</span>;
        case 'COMPARE_VARIABLE':
             return (
                <div className="flex items-center space-x-1 flex-wrap">
                    <InlineSelect width="w-16" value={safeParams.scope || 'LOCAL'} onChange={(v:any)=>onChange({scope:v})} options={[{value:'LOCAL',label:'Esta'}, {value:'GLOBAL',label:'Global'}, {value:'OBJECT',label:'Objeto'}]} />
                    {safeParams.scope === 'OBJECT' && (
                        <InlineSelect width="w-24" value={safeParams.targetId} onChange={(v:any)=>onChange({targetId:v})} options={libraryOptions} />
                    )}
                    <span>Var</span>
                    {varOptions ? (
                        <InlineSelect width="w-24" value={safeParams.varId} onChange={(v:any)=>onChange({varId:v})} options={varOptions} />
                    ) : (
                        <InlineInput width="w-16" value={safeParams.varId} onChange={(v:any)=>onChange({varId:v})} placeholder="Nombre..." />
                    )}
                    <InlineSelect width="w-10" value={safeParams.operator} onChange={(v:any)=>onChange({operator:v})} options={[{value:'EQUAL',label:'='},{value:'LESS',label:'<'},{value:'GREATER',label:'>'},{value:'LESS_EQUAL',label:'<='},{value:'GREATER_EQUAL',label:'>='},{value:'NOT_EQUAL',label:'!='}]} />
                    <InlineInput width="w-12" value={safeParams.value} onChange={(v:any)=>onChange({value:v})} />
                </div>
            );
        case 'MODIFY_VARIABLE':
            return (
                <div className="flex items-center space-x-1 flex-wrap">
                    <InlineSelect width="w-16" value={safeParams.scope || 'LOCAL'} onChange={(v:any)=>onChange({scope:v})} options={[{value:'LOCAL',label:'Esta'}, {value:'GLOBAL',label:'Global'}, {value:'OBJECT',label:'Objeto'}]} />
                    {safeParams.scope === 'OBJECT' && (
                        <InlineSelect width="w-24" value={safeParams.targetId} onChange={(v:any)=>onChange({targetId:v})} options={libraryOptions} />
                    )}
                    <span>Var</span>
                    {varOptions ? (
                        <InlineSelect width="w-24" value={safeParams.varId} onChange={(v:any)=>onChange({varId:v})} options={varOptions} />
                    ) : (
                        <InlineInput width="w-16" value={safeParams.varId} onChange={(v:any)=>onChange({varId:v})} placeholder="Nombre..." />
                    )}
                    <InlineSelect width="w-10" value={safeParams.operation} onChange={(v:any)=>onChange({operation:v})} options={[{value:'SET',label:'='},{value:'ADD',label:'+'}, {value:'SUBTRACT', label:'-'}]} />
                    <InlineInput width="w-12" value={safeParams.value} onChange={(v:any)=>onChange({value:v})} />
                </div>
            );
        default:
            return <span>{type}</span>;
    }
};