'use client';

import React from 'react';
import { SubModule, SubModuleProgress, SubModuleDepth } from '@/types/curriculum';
import {
  Sparkles,
  CheckCircle2,
  CircleDot,
  Box,
  Layers,
  Cpu,
} from 'lucide-react';
import { playTactileClick } from '@/lib/audio-feedback';

interface SubModuleNavigatorProps {
  submodules: SubModule[];
  activeSubModuleId: string;
  onSelectSubModule: (id: string) => void;
  onTriggerDynamicExpansion: () => void;
  submoduleProgressMap?: Record<string, SubModuleProgress>;
  className?: string;
}

interface DepthBadgeMeta {
  label: string;
  badgeClass: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEPTH_METADATA: Record<SubModuleDepth, DepthBadgeMeta> = {
  base_formal_baixo_3d: {
    label: 'Base Formal • Baixo 3D',
    badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    icon: Box,
  },
  transicao_espacial_medio_3d: {
    label: 'Transição Espacial • Médio 3D',
    badgeClass: 'text-violet-400 bg-violet-500/10 border-violet-500/25',
    icon: Layers,
  },
  shaders_avancados_alto_3d: {
    label: 'Shaders GPU • Alto 3D',
    badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
    icon: Cpu,
  },
  extensao_dinamica_gemini: {
    label: 'Subdivisão Gemini • Especializada',
    badgeClass: 'text-orange-400 bg-orange-500/10 border-orange-500/25',
    icon: Sparkles,
  },
};

export const SubModuleNavigator: React.FC<SubModuleNavigatorProps> = ({
  submodules = [],
  activeSubModuleId,
  onSelectSubModule,
  onTriggerDynamicExpansion,
  submoduleProgressMap = {},
  className = '',
}) => {
  if (!submodules || submodules.length === 0) {
    return null;
  }

  const activeSub = submodules.find((s) => s.id === activeSubModuleId) || submodules[0];
  const depthType: SubModuleDepth = activeSub?.depthType || 'base_formal_baixo_3d';
  const depthMeta = DEPTH_METADATA[depthType] || DEPTH_METADATA.base_formal_baixo_3d;
  const DepthIcon = depthMeta.icon;

  const percent3D = Math.round((activeSub?.threeDApplicabilityWeight ?? 0.25) * 100);

  return (
    <nav
      aria-label="Navegador de submódulos"
      className={`flex flex-col bg-[#0b0d14] border-b border-white/[0.08] select-none text-xs ${className}`}
    >
      {/* Top Bar: Metallic 3D Applicability Gauge & Depth Pill */}
      <div className="px-4 py-2.5 bg-[#0e1017] border-b border-white/[0.05] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Submodule Depth Badge & Counter */}
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border font-mono ${depthMeta.badgeClass}`}
          >
            <DepthIcon className="w-3 h-3 shrink-0" />
            <span>{depthMeta.label}</span>
          </span>

          <span className="text-slate-400 text-[11px] font-mono">
            Módulo {activeSub?.order || 1} de {submodules.length}
          </span>
        </div>

        {/* 3D Applicability Gauge with Precision Brushed Metallic Finish */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-300">
            <Box className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-slate-400">APLICABILIDADE 3D:</span>
            <span className="text-white font-bold tracking-tight">{percent3D}%</span>
          </div>

          {/* Precision Matte Metallic Gauge Housing */}
          <div
            className="relative w-28 sm:w-36 h-3 rounded-full p-0.5 overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #181c26 0%, #0d1017 50%, #151822 100%)',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            role="progressbar"
            aria-valuenow={percent3D}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Porcentagem de aplicabilidade 3D"
          >
            {/* Matte Brushed Gradient Fill with Subtle Metallic Luster */}
            <div
              className="h-full rounded-full transition-all duration-400 ease-out relative overflow-hidden"
              style={{
                width: `${percent3D}%`,
                background:
                  percent3D >= 80
                    ? 'linear-gradient(90deg, #0284c7 0%, #38bdf8 40%, #10b981 100%)'
                    : percent3D >= 50
                    ? 'linear-gradient(90deg, #0284c7 0%, #818cf8 50%, #f59e0b 100%)'
                    : 'linear-gradient(90deg, #0369a1 0%, #38bdf8 100%)',
                boxShadow: '0 0 6px rgba(56, 189, 248, 0.35)',
              }}
            >
              {/* Metallic highlight overlay sheen */}
              <div
                className="absolute inset-0 opacity-25"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)',
                }}
              />
            </div>

            {/* Precision Metallic Needle Indicator */}
            <div
              className="absolute top-0 bottom-0 w-1.5 -ml-0.75 rounded-full bg-white shadow-[0_0_6px_#38bdf8,0_1px_2px_rgba(0,0,0,0.8)] z-10 transition-all duration-400 ease-out pointer-events-none"
              style={{ left: `${Math.min(97, Math.max(3, percent3D))}%` }}
            />

            {/* Subtle Metallic Calibration Tick Marks */}
            <div className="absolute inset-0 flex justify-between px-3 pointer-events-none opacity-25">
              <div className="w-px h-full bg-white" />
              <div className="w-px h-full bg-white" />
              <div className="w-px h-full bg-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Submodule Stepper Tabs Rail */}
      <div className="px-3 py-2 flex items-center gap-2 overflow-x-auto select-none scrollbar-none">
        {submodules.map((sub) => {
          const isActive = sub.id === activeSub?.id;
          const prog = submoduleProgressMap[sub.id];
          const isDone = prog?.isCompleted;
          const subMeta = DEPTH_METADATA[sub.depthType] || DEPTH_METADATA.base_formal_baixo_3d;
          const subPercent = Math.round(sub.threeDApplicabilityWeight * 100);

          return (
            <button
              key={sub.id}
              onClick={() => {
                playTactileClick();
                onSelectSubModule(sub.id);
              }}
              className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-left font-mono transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#181a24] text-white border border-orange-500/40 border-b-2 border-b-orange-400 shadow-[0_2px_8px_rgba(249,115,22,0.18),inset_0_1px_0_rgba(255,255,255,0.12)] ring-1 ring-orange-500/20'
                  : 'bg-[#11131c] text-slate-400 border border-white/[0.06] hover:text-slate-200 hover:bg-[#161924] hover:border-white/[0.12] shadow-xs active:translate-y-0.5'
              }`}
            >
              {/* Status Indicator Icon */}
              <div className="shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]" />
                ) : isActive ? (
                  <CircleDot className="w-4 h-4 text-orange-400 animate-pulse" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center text-[9px] text-slate-500">
                    {sub.order}
                  </div>
                )}
              </div>

              {/* Submodule Title */}
              <div className="flex flex-col">
                <span
                  className={`text-xs font-semibold line-clamp-1 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'
                  }`}
                >
                  {sub.title}
                </span>
              </div>

              {/* 3D Applicability Mini Badge */}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md border font-semibold shrink-0 ml-1 ${subMeta.badgeClass}`}
              >
                {subPercent}% 3D
              </span>
            </button>
          );
        })}

        {/* Elegant Gemini Dynamic Submodule Expansion Trigger */}
        <button
          onClick={() => {
            playTactileClick();
            onTriggerDynamicExpansion();
          }}
          className="tactile-btn tactile-btn-neutral px-3.5 py-2 text-[11px] font-mono font-semibold text-amber-300 border border-amber-500/30 hover:border-amber-500/50 hover:text-amber-200 flex items-center gap-1.5 shrink-0 ml-auto transition-all shadow-[0_3px_0_#131722,0_0_12px_rgba(245,158,11,0.08)] active:translate-y-0.5"
          title="Solicitar que o Professor Gemini crie uma nova subdivisão especializada para aprofundar este módulo"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>+ EXPANDIR VIA GEMINI</span>
        </button>
      </div>
    </nav>
  );
};
