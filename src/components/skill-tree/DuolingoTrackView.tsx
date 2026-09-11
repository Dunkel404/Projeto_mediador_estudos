'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { CurriculumNode, UserNodeProgress, Tier } from '@/types/curriculum';
import {
  Check,
  Lock,
  Sparkles,
  Flame,
  Crown,
  Star,
  Play,
  Gift,
  BookOpen,
  Code,
  GraduationCap,
  HelpCircle,
  ChevronRight,
  Zap,
  Award,
  ShieldCheck,
  X,
} from 'lucide-react';
import { playTactileClick, playMasteryFanfare } from '@/lib/audio-feedback';
import { StreakBadge } from '@/components/gamification/StreakBadge';

export interface DuolingoTrackViewProps {
  nodes: CurriculumNode[];
  progressMap: Record<string, UserNodeProgress>;
  onSelectNode: (node: CurriculumNode, initialMode?: 'article' | 'exercise' | 'sandbox') => void;
  activeNodeId?: string | null;
}

import {
  UNIT_CONFIGS,
  TRACK_WIDTH,
  CENTER_X,
  START_Y,
  NODE_SPACING_Y,
  CHEST_SPACING_Y,
  S_CURVE_OFFSETS,
  TrackPoint,
  UnitConfig,
  generateBezierSegment,
  computeUnitNodePoints,
  computeUnitChestPoint,
  generateFullUnitBasePath,
} from '@/core/curriculum/duolingo-path';

export {
  UNIT_CONFIGS,
  TRACK_WIDTH,
  CENTER_X,
  START_Y,
  NODE_SPACING_Y,
  CHEST_SPACING_Y,
  S_CURVE_OFFSETS,
  generateBezierSegment,
  computeUnitNodePoints,
  computeUnitChestPoint,
  generateFullUnitBasePath,
};
export type { UnitConfig, TrackPoint };

export const DuolingoTrackView: React.FC<DuolingoTrackViewProps> = ({
  nodes,
  progressMap,
  onSelectNode,
  activeNodeId,
}) => {
  const [activeCardNode, setActiveCardNode] = useState<CurriculumNode | null>(null);
  const [openedChestUnit, setOpenedChestUnit] = useState<number | null>(null);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveCardNode(null);
        setOpenedChestUnit(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Group nodes by Tier / Unit
  const units = useMemo(() => {
    const map: Record<number, CurriculumNode[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
    for (const node of nodes) {
      if (map[node.tier]) {
        map[node.tier].push(node);
      }
    }
    return ([0, 1, 2, 3, 4] as Tier[]).map((tier) => ({
      config: UNIT_CONFIGS[tier],
      nodes: map[tier] || [],
    }));
  }, [nodes]);

  // Overall Gamification Telemetry Calculations
  const totalMastered = Object.values(progressMap).filter((p) => p.status === 'mastered').length;
  const totalScore = Object.values(progressMap).reduce((sum, p) => sum + (p.scoreKnowledge || 0), 0);
  const totalStars = Object.values(progressMap).reduce((sum, p) => {
    if (p.status === 'mastered') return sum + 3;
    if (p.scoreKnowledge >= 60) return sum + 2;
    if (p.scoreKnowledge >= 30) return sum + 1;
    return sum;
  }, 0);

  // Helper to get stone state
  const getNodeState = (nodeId: string) => {
    const prog = progressMap[nodeId] || { status: 'locked', scoreKnowledge: 0, score3D: 0 };
    return {
      status: prog.status,
      scoreKnowledge: prog.scoreKnowledge || 0,
      score3D: prog.score3D || 0,
      isMastered: prog.status === 'mastered',
      isDecaying: prog.status === 'critical_decay',
      isAvailable: prog.status === 'available',
      isLocked: prog.status === 'locked',
    };
  };

  const handleStoneClick = (node: CurriculumNode) => {
    const state = getNodeState(node.id);
    if (!state.isLocked) {
      playTactileClick();
      setActiveCardNode(node);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#090b10] subtle-mesh overflow-hidden select-none">
      {/* Gamification Top Ribbon (Linear / Duolingo Hybrid) */}
      <div className="w-full px-4 py-2.5 bg-[#0f121a]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between z-20 shadow-lg shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md shadow-amber-500/20 text-white font-bold text-sm">
            <Crown className="w-4 h-4 fill-white" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-wider uppercase text-slate-400 block leading-none">
              TRILHA DE APRENDIZADO FSRS
            </span>
            <span className="text-xs font-bold text-white">
              Caminho Matemático Interativo
            </span>
          </div>
        </div>

        {/* Dopaminergic Stats Pills */}
        <div className="flex items-center gap-2 sm:gap-4 font-mono text-xs">
          {/* Dynamic Streak Flame & Focus Multiplier */}
          <StreakBadge />

          {/* Stars Collected */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 font-bold"
            title="Estrelas de Maestria Conquistadas"
          >
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span>{totalStars}</span>
          </div>

          {/* Mastered Crowns */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold"
            title="Tópicos com Domínio Absoluto"
          >
            <Crown className="w-4 h-4 text-emerald-400" />
            <span>{totalMastered}/{nodes.length}</span>
          </div>

          {/* Total Knowledge XP */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 font-bold"
            title="Pontuação Total de Conhecimento"
          >
            <Zap className="w-4 h-4 fill-sky-400 text-sky-400" />
            <span>{totalScore} XP</span>
          </div>
        </div>
      </div>

      {/* Main Sinuous Scroll Track */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden p-4 pb-28 ambient-grid">
        <div className="max-w-xl mx-auto flex flex-col items-center">
          {units.map((unit) => {
            const { config, nodes: unitNodes } = unit;
            const masteredInUnit = unitNodes.filter(
              (n) => progressMap[n.id]?.status === 'mastered'
            ).length;
            const unitProgressPct = Math.round((masteredInUnit / Math.max(unitNodes.length, 1)) * 100);

            // Compute exact (x, y) coordinates for all nodes in this unit
            const nodePoints: TrackPoint[] = unitNodes.map((_, idx) => {
              const offset = S_CURVE_OFFSETS[idx % S_CURVE_OFFSETS.length];
              return {
                x: CENTER_X + offset,
                y: START_Y + idx * NODE_SPACING_Y,
              };
            });

            // Chest is positioned at the end of the unit path
            const chestPoint: TrackPoint = {
              x: CENTER_X,
              y: START_Y + Math.max(unitNodes.length - 1, 0) * NODE_SPACING_Y + CHEST_SPACING_Y,
            };

            const trackHeight = chestPoint.y + 90;

            // Generate full base path from start to chest
            let fullBasePath = '';
            if (nodePoints.length > 0) {
              fullBasePath = `M ${nodePoints[0].x.toFixed(1)} ${nodePoints[0].y.toFixed(1)}`;
              for (let i = 1; i < nodePoints.length; i++) {
                const dy = nodePoints[i].y - nodePoints[i - 1].y;
                fullBasePath += ` C ${nodePoints[i - 1].x.toFixed(1)} ${(nodePoints[i - 1].y + dy * 0.5).toFixed(1)}, ${nodePoints[i].x.toFixed(1)} ${(nodePoints[i].y - dy * 0.5).toFixed(1)}, ${nodePoints[i].x.toFixed(1)} ${nodePoints[i].y.toFixed(1)}`;
              }
              const lastNode = nodePoints[nodePoints.length - 1];
              const dyChest = chestPoint.y - lastNode.y;
              fullBasePath += ` C ${lastNode.x.toFixed(1)} ${(lastNode.y + dyChest * 0.5).toFixed(1)}, ${chestPoint.x.toFixed(1)} ${(chestPoint.y - dyChest * 0.5).toFixed(1)}, ${chestPoint.x.toFixed(1)} ${chestPoint.y.toFixed(1)}`;
            }

            return (
              <div key={config.tier} className="w-full flex flex-col items-center mb-14">
                {/* Unit Thematic Banner (Duolingo Header Style) */}
                <div
                  className={`w-full rounded-2xl p-5 mb-8 border border-white/10 shadow-xl bg-gradient-to-r ${config.bannerGradient} relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 w-36 h-36 rounded-full bg-white/5 blur-2xl pointer-events-none -mr-10 -mt-10" />

                  <div className="flex items-start justify-between gap-3 relative z-10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold tracking-widest uppercase"
                          style={{
                            backgroundColor: `${config.themeColor}20`,
                            color: config.themeColor,
                            border: `1px solid ${config.themeColor}50`,
                          }}
                        >
                          UNIDADE {config.number}
                        </span>
                        <span className="text-slate-400 text-xs font-mono">
                          Tier {config.tier}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {config.title}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans max-w-md">
                        {config.subtitle}
                      </p>
                    </div>

                    {/* Unit Crown Badge */}
                    <div className="shrink-0 flex flex-col items-center bg-black/30 rounded-xl p-2.5 border border-white/10">
                      <Crown
                        className="w-5 h-5 mb-1"
                        style={{
                          color: unitProgressPct === 100 ? '#facc15' : 'rgba(255,255,255,0.4)',
                          fill: unitProgressPct === 100 ? '#facc15' : 'transparent',
                        }}
                      />
                      <span className="text-[10px] font-mono text-slate-300 font-bold">
                        {masteredInUnit}/{unitNodes.length}
                      </span>
                    </div>
                  </div>

                  {/* Unit Progress Bar */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-black/40 overflow-hidden p-0.5 border border-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${unitProgressPct}%`,
                          backgroundColor: config.themeColor,
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-mono font-bold text-slate-300 shrink-0">
                      {unitProgressPct}%
                    </span>
                  </div>
                </div>

                {/* Sinuous Path & Stepping Stones Relative Coordinate Container */}
                <div
                  className="relative mx-auto"
                  style={{
                    width: `${TRACK_WIDTH}px`,
                    height: `${trackHeight}px`,
                  }}
                >
                  {/* Continuous Mathematical SVG S-Curve Path Layer */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-0"
                    viewBox={`0 0 ${TRACK_WIDTH} ${trackHeight}`}
                    style={{ width: `${TRACK_WIDTH}px`, height: `${trackHeight}px` }}
                  >
                    {/* Layer 1: Dark Track Shadow Bed */}
                    {fullBasePath && (
                      <path
                        d={fullBasePath}
                        fill="none"
                        stroke="#131722"
                        strokeWidth={22}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Layer 2: Cobblestone Highway Bed */}
                    {fullBasePath && (
                      <path
                        d={fullBasePath}
                        fill="none"
                        stroke="#1e2433"
                        strokeWidth={14}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Layer 3: Inner Guide Rail */}
                    {fullBasePath && (
                      <path
                        d={fullBasePath}
                        fill="none"
                        stroke="#0d1017"
                        strokeWidth={4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Layer 4: Segment-by-segment illuminated progress trails */}
                    {unitNodes.map((currNode, idx) => {
                      if (idx === 0) return null;
                      const prevPt = nodePoints[idx - 1];
                      const currPt = nodePoints[idx];
                      const segmentD = generateBezierSegment(prevPt, currPt);

                      const currState = getNodeState(currNode.id);
                      const isMastered = currState.isMastered;
                      const isAvailable = currState.isAvailable;
                      const isDecaying = currState.isDecaying;

                      if (isMastered) {
                        return (
                          <g key={`seg-${currNode.id}`}>
                            <path
                              d={segmentD}
                              fill="none"
                              stroke={config.themeColor}
                              strokeWidth={8}
                              strokeLinecap="round"
                              opacity={0.85}
                            />
                            <path
                              d={segmentD}
                              fill="none"
                              stroke="#ffffff"
                              strokeWidth={2}
                              strokeLinecap="round"
                              opacity={0.4}
                            />
                          </g>
                        );
                      }

                      if (isDecaying) {
                        return (
                          <path
                            key={`seg-${currNode.id}`}
                            d={segmentD}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth={8}
                            strokeLinecap="round"
                            strokeDasharray="8 6"
                            className="animate-trail-flow"
                            opacity={0.9}
                          />
                        );
                      }

                      if (isAvailable) {
                        return (
                          <path
                            key={`seg-${currNode.id}`}
                            d={segmentD}
                            fill="none"
                            stroke={config.themeColor}
                            strokeWidth={8}
                            strokeLinecap="round"
                            strokeDasharray="8 8"
                            className="animate-trail-flow"
                            opacity={0.9}
                          />
                        );
                      }

                      return null;
                    })}

                    {/* Final segment leading to Milestone Chest */}
                    {nodePoints.length > 0 && (
                      (() => {
                        const lastPt = nodePoints[nodePoints.length - 1];
                        const chestSegD = generateBezierSegment(lastPt, chestPoint);
                        const isUnitComplete = unitProgressPct === 100;
                        return isUnitComplete ? (
                          <path
                            d={chestSegD}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth={8}
                            strokeLinecap="round"
                            opacity={0.9}
                          />
                        ) : null;
                      })()
                    )}
                  </svg>

                  {/* Stepping Stones Components */}
                  {unitNodes.map((node, nodeIdx) => {
                    const pt = nodePoints[nodeIdx];
                    const state = getNodeState(node.id);
                    const isActive = activeNodeId === node.id;

                    // Stars for this node (0-3)
                    const stars = state.isMastered
                      ? 3
                      : state.scoreKnowledge >= 60
                      ? 2
                      : state.scoreKnowledge >= 30
                      ? 1
                      : 0;

                    return (
                      <div
                        key={node.id}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center"
                        style={{
                          left: `${pt.x}px`,
                          top: `${pt.y}px`,
                        }}
                      >
                        {/* Active Speech Bubble Indicator (Duolingo Mascot / Start Tag) */}
                        {state.isAvailable && !state.isMastered && (
                          <div className="absolute -top-11 z-20 animate-float pointer-events-none">
                            <div
                              className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider text-white shadow-lg flex items-center gap-1 border border-white/20 whitespace-nowrap"
                              style={{ backgroundColor: config.themeDarkColor }}
                            >
                              <Play className="w-2.5 h-2.5 fill-white" />
                              <span>COMEÇAR</span>
                              {/* Speech bubble triangle */}
                              <div
                                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px]"
                                style={{ borderTopColor: config.themeDarkColor }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Decaying Warning Pill */}
                        {state.isDecaying && (
                          <div className="absolute -top-10 z-20 animate-bounce pointer-events-none">
                            <div className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold text-white bg-rose-600 shadow-lg flex items-center gap-1">
                              <Flame className="w-2.5 h-2.5 fill-white" />
                              <span>REVISAR FSRS</span>
                            </div>
                          </div>
                        )}

                        {/* Tactile 3D Circular Stone */}
                        <div
                          onClick={() => handleStoneClick(node)}
                          className={`duo-stone w-18 h-18 sm:w-20 sm:h-20 ${
                            state.isLocked
                              ? 'opacity-50 cursor-not-allowed'
                              : 'cursor-pointer active:scale-95'
                          }`}
                          title={node.title}
                        >
                          {/* Outer Pulsing Aura Ring if Active */}
                          {isActive && (
                            <div
                              className="absolute -inset-2 rounded-full animate-ping opacity-30"
                              style={{ backgroundColor: config.themeColor }}
                            />
                          )}

                          {/* 3D Tactile Stone Body */}
                          <div
                            className={`w-full h-full rounded-full flex flex-col items-center justify-center relative transition-all ${
                              state.isMastered
                                ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 border-2 border-emerald-400 border-b-[6px] border-b-emerald-800 text-white shadow-[0_6px_20px_rgba(16,185,129,0.35)]'
                                : state.isDecaying
                                ? 'bg-gradient-to-b from-amber-500 to-amber-600 border-2 border-amber-400 border-b-[6px] border-b-amber-800 text-white shadow-[0_6px_20px_rgba(245,158,11,0.35)] animate-pulse'
                                : state.isAvailable
                                ? 'bg-gradient-to-b from-sky-500 to-sky-600 border-2 border-sky-300 border-b-[6px] border-b-sky-800 text-white shadow-[0_6px_20px_rgba(56,189,248,0.35)]'
                                : 'bg-[#181d28] border border-white/10 border-b-[5px] border-b-[#0e1118] text-slate-500'
                            }`}
                          >
                            {/* Inner Icon */}
                            {state.isMastered ? (
                              <Crown className="w-7 h-7 fill-white drop-shadow-md" />
                            ) : state.isDecaying ? (
                              <Flame className="w-7 h-7 fill-white drop-shadow-md" />
                            ) : state.isAvailable ? (
                              <Sparkles className="w-7 h-7 fill-white drop-shadow-md" />
                            ) : (
                              <Lock className="w-6 h-6 text-slate-500" />
                            )}
                          </div>

                          {/* Star Level Badge Below Stone */}
                          {!state.isLocked && (
                            <div className="absolute -bottom-2.5 flex items-center gap-0.5 bg-[#0e121a] px-2 py-0.5 rounded-full border border-white/15 shadow-md">
                              {[1, 2, 3].map((starIdx) => (
                                <Star
                                  key={starIdx}
                                  className="w-2.5 h-2.5"
                                  style={{
                                    color: starIdx <= stars ? '#facc15' : 'rgba(255,255,255,0.2)',
                                    fill: starIdx <= stars ? '#facc15' : 'transparent',
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Node Label Below Stone */}
                        <div className="mt-3.5 text-center max-w-[135px] bg-[#0f121a]/90 backdrop-blur-xs px-2 py-1 rounded-xl border border-white/10 shadow-sm pointer-events-none">
                          <span
                            className={`text-xs font-bold line-clamp-1 leading-tight block ${
                              state.isLocked
                                ? 'text-slate-500'
                                : isActive
                                ? 'text-sky-300 font-extrabold'
                                : 'text-slate-200'
                            }`}
                          >
                            {node.title}
                          </span>
                          {!state.isLocked && (
                            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                              {state.scoreKnowledge}/90 pts
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Interstitial Milestone Chest (Baú de Revisão / Bônus da Unidade) */}
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center"
                    style={{
                      left: `${chestPoint.x}px`,
                      top: `${chestPoint.y}px`,
                    }}
                  >
                    <button
                      onClick={() => {
                        playMasteryFanfare();
                        setOpenedChestUnit(config.number);
                      }}
                      className="tactile-btn relative group p-3.5 rounded-2xl bg-gradient-to-b from-amber-600 to-amber-700 border-2 border-amber-400 border-b-[6px] border-b-amber-900 text-white shadow-xl shadow-amber-950/50 flex flex-col items-center gap-1.5 cursor-pointer hover:brightness-110 active:scale-95 transition-all"
                    >
                      <Gift className="w-8 h-8 text-white fill-amber-300 animate-bounce" />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-100">
                        BAÚ DA UNIDADE {config.number}
                      </span>
                    </button>
                    <span className="text-[11px] text-slate-400 font-mono mt-1">
                      Revisão FSRS & Recompensa
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Action Card Popover for Selected Node (Duolingo Lesson Launcher) */}
      {activeCardNode && (
        <div
          onClick={() => setActiveCardNode(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#121622] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 relative cursor-default"
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveCardNode(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              title="Fechar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Badge */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 uppercase tracking-wider">
                TIER {activeCardNode.tier} // {activeCardNode.category.replace('_', ' ')}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {activeCardNode.submodules?.length || 3} Submódulos
              </span>
            </div>

            {/* Title & Graphic Application */}
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                {activeCardNode.title}
              </h3>
              <p className="text-xs text-slate-300 font-sans mt-1 leading-relaxed">
                {activeCardNode.graphicApplication}
              </p>
            </div>

            {/* Telemetry Metrics Bar */}
            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-black/40 border border-white/10 font-mono text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">CONHECIMENTO</span>
                <span className="text-sky-400 font-bold text-sm">
                  {progressMap[activeCardNode.id]?.scoreKnowledge || 0}/90
                </span>
                <div className="w-full h-1.5 rounded-full bg-white/10 mt-1 overflow-hidden">
                  <div
                    className="h-full bg-sky-400 rounded-full"
                    style={{
                      width: `${((progressMap[activeCardNode.id]?.scoreKnowledge || 0) / 90) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">SHADERS 3D</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {progressMap[activeCardNode.id]?.score3D || 0}/10
                </span>
                <div className="w-full h-1.5 rounded-full bg-white/10 mt-1 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{
                      width: `${((progressMap[activeCardNode.id]?.score3D || 0) / 10) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons: Lesson, Exercise, 3D Sandbox with Direct Routing */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  playTactileClick();
                  onSelectNode(activeCardNode, 'article');
                  setActiveCardNode(null);
                }}
                className="tactile-btn tactile-btn-sky w-full py-3 px-4 flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <GraduationCap className="w-4 h-4" />
                <span>INICIAR AULA COMPLETA</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    playTactileClick();
                    onSelectNode(activeCardNode, 'exercise');
                    setActiveCardNode(null);
                  }}
                  className="tactile-btn tactile-btn-neutral py-2.5 px-3 flex items-center justify-center gap-1.5 text-xs font-mono cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>EXERCÍCIO</span>
                </button>

                <button
                  onClick={() => {
                    playTactileClick();
                    onSelectNode(activeCardNode, 'sandbox');
                    setActiveCardNode(null);
                  }}
                  className="tactile-btn tactile-btn-neutral py-2.5 px-3 flex items-center justify-center gap-1.5 text-xs font-mono cursor-pointer"
                >
                  <Code className="w-3.5 h-3.5 text-emerald-400" />
                  <span>SANDBOX 3D</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interstitial Chest Reward Modal */}
      {openedChestUnit !== null && (
        <div
          onClick={() => setOpenedChestUnit(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 cursor-pointer animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#121622] border border-amber-500/30 rounded-3xl p-6 text-center shadow-2xl space-y-4 cursor-default relative"
          >
            {/* Close Button */}
            <button
              onClick={() => setOpenedChestUnit(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              title="Fechar (Esc)"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 mx-auto flex items-center justify-center">
              <Gift className="w-9 h-9 text-amber-400 animate-bounce" />
            </div>

            <h3 className="text-lg font-bold text-white tracking-tight">
              Baú de Maestria da Unidade {openedChestUnit}!
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Parabéns pelo avanço! A telemetria matemática do algoritmo FSRS analisou sua retenção de memória e agendou as repetições ideais para consolidação permanente nos seus neurônios.
            </p>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-amber-300 flex items-center justify-center gap-2">
              <Award className="w-4 h-4" />
              <span>+100 XP DE TELEMETRIA MATEMÁTICA</span>
            </div>

            <button
              onClick={() => setOpenedChestUnit(null)}
              className="tactile-btn tactile-btn-amber w-full py-2.5 text-xs font-mono cursor-pointer"
            >
              COLETAR E CONTINUAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
