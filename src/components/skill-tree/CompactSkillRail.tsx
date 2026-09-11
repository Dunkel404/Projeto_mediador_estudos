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
  0: { text: '#00f0ff', border: '#00f0ff', bg: 'rgba(0, 240, 255, 0.1)' },
  1: { text: '#38bdf8', border: '#38bdf8', bg: 'rgba(56, 189, 248, 0.1)' },
  2: { text: '#ffb000', border: '#ffb000', bg: 'rgba(255, 176, 0, 0.1)' },
  3: { text: '#c084fc', border: '#c084fc', bg: 'rgba(192, 132, 252, 0.1)' },
  4: { text: '#f43f5e', border: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' },
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
      className={`w-72 sm:w-80 h-full flex flex-col bg-[#0d0f14] border-r border-[#242933] select-none font-mono text-xs shrink-0 ${className}`}
    >
      {/* Top Header Controls */}
      <div className="p-3 bg-[#0a0b0e] border-b border-[#242933] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span className="font-bold text-white tracking-wider text-[11px] uppercase">
            TRILHA COMPACTA
          </span>
        </div>

        <button
          onClick={onExitFocusMode}
          className="flex items-center gap-1 px-2 py-0.5 text-[10px] bg-[#181b22] hover:bg-[#242933] text-slate-300 hover:text-white border border-[#242933] transition-colors cursor-pointer"
          title="Sair do Modo Foco e restaurar visualização do Grafo 2D"
        >
          <Maximize2 className="w-3 h-3 text-[#00f0ff]" />
          <span>GRAFO 2D</span>
        </button>
      </div>

      {/* Quick Search */}
      <div className="p-2 border-b border-[#242933] bg-[#0a0b0e]">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar tópico matemático..."
            className="w-full pl-8 pr-2.5 py-1 bg-[#12141a] border border-[#242933] text-white text-[11px] placeholder:text-slate-600 focus:border-[#00f0ff] outline-hidden transition-colors"
          />
        </div>
      </div>

      {/* Tier Node Listing */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2.5">
        {tiers.map((tier) => {
          const tierNodes = filteredNodes.filter((n) => n.tier === tier);
          if (tierNodes.length === 0) return null;

          const isCollapsed = !!collapsedTiers[tier];
          const color = TIER_COLORS[tier];

          return (
            <div key={tier} className="border border-[#1e232d] bg-[#0f1117]">
              {/* Tier Header */}
              <button
                onClick={() => toggleTierCollapse(tier)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 bg-[#141720] hover:bg-[#181b26] transition-colors text-left border-b border-[#1e232d] cursor-pointer"
              >
                <div className="flex items-center gap-1.5 truncate">
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
                        onClick={() => onSelectNode(node)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 text-left transition-all rounded-xs cursor-pointer ${
                          isSelected
                            ? 'bg-[#181d28] border-l-2 text-white font-bold'
                            : 'hover:bg-[#151821] text-slate-300 hover:text-white'
                        }`}
                        style={{
                          borderLeftColor: isSelected ? color.border : 'transparent',
                        }}
                      >
                        <div className="flex items-center gap-2 truncate min-w-0 pr-1">
                          {status === 'mastered' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#10b981] shrink-0" />
                          ) : status === 'critical_decay' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-[#ff3344] shrink-0 animate-pulse" />
                          ) : status === 'locked' ? (
                            <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          ) : (
                            <CircleDot className="w-3.5 h-3.5 text-[#00f0ff] shrink-0" />
                          )}

                          <span className="truncate text-[11px]">{node.title}</span>
                        </div>

                        <div className="shrink-0 font-mono text-[10px]">
                          {progress && progress.scoreKnowledge > 0 ? (
                            <span
                              className={`px-1 py-0.2 border ${
                                progress.scoreKnowledge >= 85
                                  ? 'border-[#10b981]/40 text-[#10b981] bg-[#10b981]/10'
                                  : 'border-[#ffb000]/40 text-[#ffb000] bg-[#ffb000]/10'
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
