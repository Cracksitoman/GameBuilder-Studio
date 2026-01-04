
import React from 'react';

export const InlineInput = ({ value, onChange, type = "text", width = "w-16" }: any) => (
    <input 
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) : e.target.value)}
        onPointerDown={(e) => e.stopPropagation()} 
        className={`bg-black/30 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-white focus:border-blue-400 outline-none transition-colors ${width}`}
    />
);

export const InlineSelect = ({ value, onChange, options, width = "w-28" }: any) => (
    <select 
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        className={`bg-black/30 border border-white/10 rounded px-1 py-0.5 text-[10px] text-white focus:border-blue-400 outline-none appearance-none cursor-pointer ${width}`}
    >
        {options.map((opt: any) => (
            <option key={opt.value} value={opt.value} className="bg-gray-800 text-white">{opt.label}</option>
        ))}
    </select>
);

export const BlockPaletteItem = ({ label, color, icon: Icon, onPointerDown, type, mode }: any) => (
    <div 
        onPointerDown={(e) => onPointerDown(e, { type, label, color, icon: Icon, mode })}
        className={`flex items-center space-x-1.5 px-3 py-3 rounded-xl cursor-grab active:cursor-grabbing mb-2 shadow-md border select-none ${color} text-white font-bold text-[10px] leading-tight hover:brightness-110 active:scale-95 border-black/20 touch-none w-full`}
    >
        <div className="pointer-events-none flex items-center space-x-2 w-full">
            {Icon && <Icon className="w-4 h-4 opacity-80 shrink-0" />}
            <span className="truncate">{label}</span>
        </div>
    </div>
);
