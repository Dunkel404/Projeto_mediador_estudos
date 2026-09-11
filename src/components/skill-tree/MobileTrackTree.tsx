'use client';

import React, { useState } from 'react';
import { CurriculumNode, UserNodeProgress, Tier } from '@/types/curriculum';
import { Lock, CheckCircle2, AlertTriangle, Sparkles, ChevronRight, ChevronDown } from 'lucide-react';

interface MobileTrackTreeProps {
  nodes: CurriculumNode[];
  progressMap: Record<string, UserNodeProgress>;
  onSelectNode: (node: CurriculumNode) => void;
  activeNodeId?: string | null;
}

const TIER_NAMES: Record<Tier, { title: string; color: string; badgeBg: string }> = {
  0: { title: 'Tier 0: Álgebra e Trigonometria Operacional', color: '#f97316', badgeBg: 'rgba(249, 115, 22, 0.15)' },
  1: { title: 'Tier 1: Álgebra Linear e Transformações 3D', color: '#f59e0b', badgeBg: 'rgba(245, 158, 11, 0.15)' },
  2: { title: 'Tier 2: Cálculo Diferencial e SDFs', color: '#8b5cf6', badgeBg: 'rgba(139, 92, 246, 0.15)' },
  3: { title: 'Tier 3: Cálculo Integral e Radiometria Física', color: '#ec4899', badgeBg: 'rgba(236, 72, 153, 0.15)' },
  4: { title: 'Tier 4: Campos Vetoriais e Tensores Básicos', color: '#10b981', badgeBg: 'rgba(16, 185, 129, 0.15)' },
};

export const MobileTrackTree: React.FC<MobileTrackTreeProps> = ({
  nodes,
  progressMap,
  onSelectNode,
  activeNodeId,
}) => {
  const [expandedTiers, setExpandedTiers] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: true,
    4: true,
  });

  const toggleTier = (tier: number) => {
    setExpandedTiers((prev) => ({ ...prev, [tier]: !prev[tier] }));
  };

  // Group nodes by Tier
  const tierGroups: Record<number, CurriculumNode[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
  for (const node of nodes) {
    if (tierGroups[node.tier]) {
      tierGroups[node.tier].push(node);
    }
  }

  return (
    <div className="w-full h-full overflow-y-auto p-4 space-y-4 bg-[#0b0d14] select-none">
      {([0, 1, 2, 3, 4] as Tier[]).map((tier) => {
        const tierNodes = tierGroups[tier] || [];
        const isExpanded = !!expandedTiers[tier];
        const tierMeta = TIER_NAMES[tier];

        const completedCount = tierNodes.filter(
          (n) => progressMap[n.id]?.status === 'mastered'
        ).length;

        return (
          <div
            key={tier}
            className="rounded-2xl border border-white/10 bg-[#0f121a] overflow-hidden shadow-lg"
          >
            {/* Tier Header */}
            <button
              onClick={() => toggleTier(tier)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#131722] hover:bg-[#181d2c] transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: tierMeta.color }}
                />
                <span
                  className="font-mono text-xs font-bold uppercase tracking-wider"
                  style={{ color: tierMeta.color }}
                >
                  {tierMeta.title}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  ({completedCount}/{tierNodes.length})
                </span>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Nodes in Tier */}
            {isExpanded && (
              <div className="p-3.5 space-y-2.5">
                {tierNodes.map((node) => {
                  const progress = progressMap[node.id] || {
                    status: 'locked',
                    scoreKnowledge: 0,
                    score3D: 0,
                  };
                  const isLocked = progress.status === 'locked';
                  const isActive = activeNodeId === node.id;

                  let borderStyle = 'border-white/5 hover:border-white/20';
                  if (progress.status === 'mastered') borderStyle = 'border-orange-500/40';
                  else if (progress.status === 'critical_decay') borderStyle = 'border-rose-500/40';
                  else if (progress.status === 'available') borderStyle = 'border-amber-500/30';

                  if (isActive) borderStyle = 'border-orange-400 ring-2 ring-orange-400/30';

                  return (
                    <div
                      key={node.id}
                      onClick={() => {
                        if (!isLocked) onSelectNode(node);
                      }}
                      className={`p-3.5 rounded-xl border transition-all ${borderStyle} ${
                        isLocked
                          ? 'bg-[#0e1017]/50 opacity-50 cursor-not-allowed'
                          : 'bg-[#141724] hover:bg-[#191d2d] cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                            {node.category.replace('_', ' ')}
                          </span>
                          <h4 className="text-sm font-semibold text-white mt-0.5 leading-snug">
                            {node.title}
                          </h4>
                          <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                            {node.graphicApplication}
                          </p>
                        </div>

                        {/* Status Icon */}
                        <div className="shrink-0 pt-0.5">
                          {isLocked && <Lock className="w-4 h-4 text-slate-600" />}
                          {progress.status === 'available' && (
                            <Sparkles className="w-4 h-4 text-amber-400" />
                          )}
                          {progress.status === 'critical_decay' && (
                            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
                          )}
                          {progress.status === 'mastered' && (
                            <CheckCircle2 className="w-4 h-4 text-orange-400" />
                          )}
                        </div>
                      </div>

                      {/* Score Telemetry */}
                      {!isLocked && (
                        <div className="mt-3 grid grid-cols-2 gap-3 pt-2.5 border-t border-white/5 font-mono text-[11px]">
                          <div>
                            <div className="flex justify-between text-slate-400 mb-1">
                              <span>MATEMÁTICA</span>
                              <span className="text-orange-300 font-bold">{progress.scoreKnowledge}/90</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-orange-400"
                                style={{ width: `${(progress.scoreKnowledge / 90) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-slate-400 mb-1">
                              <span>SHADERS 3D</span>
                              <span className="text-amber-400 font-bold">{progress.score3D}/10</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-amber-400"
                                style={{ width: `${(progress.score3D / 10) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
