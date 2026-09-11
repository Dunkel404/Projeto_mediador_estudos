'use client';

import React from 'react';
import { SubModule, SubModuleProgress, SubModuleDepth } from '@/types/curriculum';
import {
  Sparkles,
  CheckCircle2,
  CircleDot,
  Box,
  Brain,
  Layers,
  ArrowRight,
  Plus,
} from 'lucide-react';

interface SubModuleNavigatorProps {
  submodules: SubModule[];
  activeSubModuleId: string;
  onSelectSubModule: (id: string) => void;
  onTriggerDynamicExpansion: () => void;
  submoduleProgressMap?: Record<string, SubModuleProgress>;
  className?: string;
}

const DEPTH_LABELS: Record<SubModuleDepth, { label: string; color: string; bg: string; border: string }> = {
  base_formal_baixo_3d: {
    label: 'BASE FORMAL RIGOROSA (BAIXO 3D)',
    color: '#00f0ff',
    bg: 'rgba(0, 240, 255, 0.1)',
    border: '#00f0ff',
  },
  transicao_espacial_medio_3d: {
    label: 'TRANSIÇÃO ESPACIAL & VETORIAL (MÉDIO 3D)',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.1)',
    border: '#38bdf8',
  },
  shaders_avancados_alto_3d: {
    label: 'SHADERS & PIPELINE GPU (ALTO 3D)',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: '#10b981',
  },
  extensao_dinamica_gemini: {
    label: 'SUBDIVISÃO DINÂMICA (GEMINI PROFESSOR)',
    color: '#ffb000',
    bg: 'rgba(255, 176, 0, 0.12)',
    border: '#ffb000',
  },
};

export const SubModuleNavigator: React.FC<SubModuleNavigatorProps> = ({
  submodules,
  activeSubModuleId,
  onSelectSubModule,
  onTriggerDynamicExpansion,
  submoduleProgressMap = {},
  className = '',
}) => {
  const activeSub = submodules.find((s) => s.id === activeSubModuleId) || submodules[0];
  const depthMeta = DEPTH_LABELS[activeSub?.depthType || 'base_formal_baixo_3d'];
  const percent3D = Math.round((activeSub?.threeDApplicabilityWeight ?? 0.25) * 100);

  return (
    <div className={`flex flex-col bg-[#0d0f14] border-b border-[#242933] font-mono text-xs ${className}`}>
      {/* Top Bar: 3D Applicability Gauge & Depth Level */}
      <div className="px-4 py-2 bg-[#090a0d] border-b border-[#1e232d] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border"
            style={{
              color: depthMeta.color,
              backgroundColor: depthMeta.bg,
              borderColor: depthMeta.border,
            }}
          >
            {depthMeta.label}
          </span>
          <span className="text-slate-400 text-[11px] truncate">
            Submódulo {activeSub?.order} de {submodules.length}
          </span>
        </div>

        {/* 3D Applicability Progress Meter */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <Box className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>APLICABILIDADE 3D:</span>
            <strong className="text-white font-bold">{percent3D}%</strong>
          </div>

          <div className="w-24 sm:w-32 h-2 bg-[#181b22] border border-[#242933] overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${percent3D}%`,
                background:
                  percent3D >= 80
                    ? 'linear-gradient(90deg, #38bdf8, #10b981)'
                    : percent3D >= 50
                    ? 'linear-gradient(90deg, #00f0ff, #ffb000)'
                    : '#00f0ff',
              }}
            />
          </div>
        </div>
      </div>

      {/* Submodule Stepper Tabs */}
      <div className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto select-none">
        {submodules.map((sub, idx) => {
          const isActive = sub.id === activeSub?.id;
          const prog = submoduleProgressMap[sub.id];
          const isDone = prog?.isCompleted;
          const subMeta = DEPTH_LABELS[sub.depthType];

          return (
            <button
              key={sub.id}
              onClick={() => onSelectSubModule(sub.id)}
              className={`flex items-center gap-2 px-3 py-1.5 border transition-all shrink-0 cursor-pointer text-left ${
                isActive
                  ? 'bg-[#181d26] border-[#00f0ff] text-white shadow-[0_0_10px_rgba(0,240,255,0.15)] font-bold'
                  : 'bg-[#12141a] border-[#242933] text-slate-400 hover:text-slate-200 hover:bg-[#161922]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
                ) : isActive ? (
                  <CircleDot className="w-3.5 h-3.5 text-[#00f0ff] shrink-0" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-[#1e232d] text-slate-400 flex items-center justify-center text-[10px] shrink-0">
                    {sub.order}
                  </span>
                )}
                <span className="text-[11px] truncate max-w-[140px] sm:max-w-[180px]">
                  {sub.title}
                </span>
              </div>

              <span
                className="text-[9px] px-1 py-0.2 border ml-1 font-bold shrink-0"
                style={{
                  color: subMeta.color,
                  borderColor: `${subMeta.border}50`,
                }}
              >
                {Math.round(sub.threeDApplicabilityWeight * 100)}% 3D
              </span>
            </button>
          );
        })}

        {/* Dynamic Submodule Expansion Trigger */}
        <button
          onClick={onTriggerDynamicExpansion}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#ffb000]/10 hover:bg-[#ffb000]/20 text-[#ffb000] border border-[#ffb000]/40 transition-colors shrink-0 cursor-pointer ml-auto"
          title="Solicitar que o Professor Gemini crie uma nova subdivisão especializada para aprofundar este módulo"
        >
          <Sparkles className="w-3 h-3 animate-pulse text-[#ffb000]" />
          <span className="text-[11px] font-bold">+ EXPANDIR MÓDULO VIA GEMINI</span>
        </button>
      </div>
    </div>
  );
};
