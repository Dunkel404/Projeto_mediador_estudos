'use client';

import React, { useState, useMemo } from 'react';
import { CurriculumNode, UserNodeProgress, Tier } from '@/types/curriculum';
import {
  Lock,
  CheckCircle2,
  AlertTriangle,
  CircleDot,
  Search,
  Maximize2,
  ChevronDown,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { playTactileClick } from '@/lib/audio-feedback';

interface CompactSkillRailProps {
  nodes: CurriculumNode[];
  progressMap: Record<string, UserNodeProgress>;
  selectedNodeId?: string | null;
  onSelectNode: (node: CurriculumNode) => void;
  onExitFocusMode: () => void;
  className?: string;
}

const TIER_NAMES: Record<Tier, string> = {
  0: 'T0: Pré-Cálculo & GPU',
  1: 'T1: Álgebra Linear 3D',
  2: 'T2: Cálculo & SDFs',
  3: 'T3: Óptica & Iluminação',
  4: 'T4: Tensores & BRDF',
};

const TIER_COLORS: Record<Tier, { text: string; border: string; bg: string }> = {
  0: { text: '#f97316', border: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
  1: { text: '#f59e0b', border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  2: { text: '#8b5cf6', border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
  3: { text: '#ec4899', border: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
  4: { text: '#10b981', border: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
};

export const CompactSkillRail: React.FC<CompactSkillRailProps> = ({
  nodes,
  progressMap,
  selectedNodeId,
  onSelectNode,
  onExitFocusMode,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedTiers, setCollapsedTiers] = useState<Record<number, boolean>>({});

  const toggleTierCollapse = (tier: number) => {
    playTactileClick();
    setCollapsedTiers((prev) => ({ ...prev, [tier]: !prev[tier] }));
  };

  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    const query = searchQuery.toLowerCase();
    return nodes.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.category.toLowerCase().includes(query) ||
        n.id.toLowerCase().includes(query)
    );
  }, [nodes, searchQuery]);

  const tiers: Tier[] = [0, 1, 2, 3, 4];

  return (
    <div
      className={`w-72 sm:w-80 h-full flex flex-col bg-[#0b0d14] border-r border-white/10 select-none font-mono text-xs shrink-0 ${className}`}
    >
      {/* Top Header Controls */}
      <div className="p-3 bg-[#0e1017] border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-orange-400" />
          <span className="font-bold text-white tracking-wider text-[11px] uppercase">
            TRILHA COMPACTA
          </span>
        </div>

        <button
          onClick={() => {
            playTactileClick();
            onExitFocusMode();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
          title="Sair do Modo Foco e restaurar visualização da Trilha"
        >
          <Maximize2 className="w-3 h-3 text-orange-400" />
          <span>EXPANDIR</span>
        </button>
      </div>

      {/* Quick Search */}
      <div className="p-2 border-b border-white/10 bg-[#0e1017]">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar tópico matemático..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#141724] rounded-lg border border-white/10 text-white text-[11px] placeholder:text-slate-500 focus:border-orange-400 outline-hidden transition-colors"
          />
        </div>
      </div>

      {/* Tier Node Listing */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {tiers.map((tier) => {
          const tierNodes = filteredNodes.filter((n) => n.tier === tier);
          if (tierNodes.length === 0) return null;

          const isCollapsed = !!collapsedTiers[tier];
          const color = TIER_COLORS[tier];

          return (
            <div key={tier} className="rounded-xl border border-white/5 bg-[#0f121a] overflow-hidden">
              {/* Tier Header */}
              <button
                onClick={() => toggleTierCollapse(tier)}
                className="w-full flex items-center justify-between px-3 py-2 bg-[#131722] hover:bg-[#181d2a] transition-colors text-left border-b border-white/5 cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  {isCollapsed ? (
                    <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
                  )}
                  <span
                    className="font-bold text-[10px] uppercase truncate tracking-wider"
                    style={{ color: color.text }}
                  >
                    {TIER_NAMES[tier]}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0 ml-1">
                  ({tierNodes.length})
                </span>
              </button>

              {/* Node List within Tier */}
              {!isCollapsed && (
                <div className="p-1 space-y-0.5">
                  {tierNodes.map((node) => {
                    const progress = progressMap[node.id];
                    const isSelected = selectedNodeId === node.id;
                    const status = progress?.status || 'locked';

                    return (
                      <button
                        key={node.id}
                        onClick={() => {
                          playTactileClick();
                          onSelectNode(node);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-left transition-all rounded-lg cursor-pointer ${
                          isSelected
                            ? 'bg-[#1a2030] border-l-2 text-white font-bold shadow-sm'
                            : 'hover:bg-[#151924] text-slate-300 hover:text-white'
                        }`}
                        style={{
                          borderLeftColor: isSelected ? color.border : 'transparent',
                        }}
                      >
                        <div className="flex items-center gap-2 truncate min-w-0 pr-1">
                          {status === 'mastered' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : status === 'critical_decay' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
                          ) : status === 'locked' ? (
                            <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          ) : (
                            <CircleDot className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                          )}

                          <span className="truncate text-[11px]">{node.title}</span>
                        </div>

                        <div className="shrink-0 font-mono text-[10px]">
                          {progress && progress.scoreKnowledge > 0 ? (
                            <span
                              className={`px-1.5 py-0.2 rounded-md border ${
                                progress.scoreKnowledge >= 85
                                  ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                                  : 'border-amber-500/40 text-amber-300 bg-amber-500/10'
                              }`}
                            >
                              {progress.scoreKnowledge}
                            </span>
                          ) : (
                            <span className="text-slate-600">--</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
