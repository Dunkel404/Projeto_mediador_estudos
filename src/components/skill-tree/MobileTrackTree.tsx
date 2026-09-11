'use client';

import React, { useState } from 'react';
import { CurriculumNode, UserNodeProgress, Tier } from '@/types/curriculum';
import { Lock, CheckCircle2, AlertOctagon, Sparkles, ChevronRight, ChevronDown } from 'lucide-react';

interface MobileTrackTreeProps {
  nodes: CurriculumNode[];
  progressMap: Record<string, UserNodeProgress>;
  onSelectNode: (node: CurriculumNode) => void;
  activeNodeId?: string | null;
}

const TIER_NAMES: Record<Tier, string> = {
  0: 'Tier 0: Álgebra e Trigonometria Operacional',
  1: 'Tier 1: Álgebra Linear e Transformações 3D',
  2: 'Tier 2: Cálculo Diferencial e SDFs',
  3: 'Tier 3: Cálculo Integral e Radiometria Física',
  4: 'Tier 4: Campos Vetoriais e Tensores Básicos',
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
    tierGroups[node.tier].push(node);
  }

  return (
    <div className="w-full h-full overflow-y-auto p-4 space-y-4 bg-[#0a0b0e]">
      {([0, 1, 2, 3, 4] as Tier[]).map((tier) => {
        const tierNodes = tierGroups[tier] || [];
        const isExpanded = !!expandedTiers[tier];

        return (
          <div key={tier} className="border border-[#242933] bg-[#12141a]/60">
            {/* Tier Header */}
            <button
              onClick={() => toggleTier(tier)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#181b22] text-left hover:bg-[#242933]/50 transition-colors"
            >
              <span className="font-mono text-xs font-bold text-[#00f0ff] uppercase tracking-wider">
                {TIER_NAMES[tier]}
              </span>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {/* Nodes in Tier */}
            {isExpanded && (
              <div className="p-3 space-y-2.5">
                {tierNodes.map((node) => {
                  const progress = progressMap[node.id] || {
                    status: 'locked',
                    scoreKnowledge: 0,
                    score3D: 0,
                  };
                  const isLocked = progress.status === 'locked';
                  const isActive = activeNodeId === node.id;

                  let borderStyle = 'border-[#242933]';
                  if (progress.status === 'mastered') borderStyle = 'border-[#00f0ff]';
                  else if (progress.status === 'critical_decay') borderStyle = 'border-[#ffb000]';
                  else if (progress.status === 'available') borderStyle = 'border-slate-500';

                  if (isActive) borderStyle = 'ring-1 ring-[#00f0ff] border-white';

                  return (
                    <div
                      key={node.id}
                      onClick={() => {
                        if (!isLocked) onSelectNode(node);
                      }}
                      className={`p-3 border rounded-xs transition-all ${borderStyle} ${
                        isLocked
                          ? 'bg-[#0f1117]/40 opacity-50 cursor-not-allowed'
                          : 'bg-[#12141a] hover:bg-[#181b22] cursor-pointer'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            {node.category.replace('_', ' ')}
                          </span>
                          <h4 className="text-sm font-semibold text-white mt-0.5 leading-snug">
                            {node.title}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {node.graphicApplication}
                          </p>
                        </div>

                        {/* Status Icon */}
                        <div className="shrink-0 pt-1">
                          {isLocked && <Lock className="w-4 h-4 text-slate-600" />}
                          {progress.status === 'available' && (
                            <Sparkles className="w-4 h-4 text-[#00f0ff]" />
                          )}
                          {progress.status === 'critical_decay' && (
                            <AlertOctagon className="w-4 h-4 text-[#ffb000] animate-pulse" />
                          )}
                          {progress.status === 'mastered' && (
                            <CheckCircle2 className="w-4 h-4 text-[#00f0ff]" />
                          )}
                        </div>
                      </div>

                      {/* Score Telemetry */}
                      {!isLocked && (
                        <div className="mt-3 grid grid-cols-2 gap-3 pt-2 border-t border-[#242933] font-mono text-[11px]">
                          <div>
                            <div className="flex justify-between text-slate-400">
                              <span>MAT</span>
                              <span className="text-[#00f0ff]">{progress.scoreKnowledge}/90</span>
                            </div>
                            <div className="w-full h-1 bg-[#181b22] mt-1">
                              <div
                                className="h-full bg-[#00f0ff]"
                                style={{ width: `${(progress.scoreKnowledge / 90) * 100}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-slate-400">
                              <span>3D</span>
                              <span className="text-[#ffb000]">{progress.score3D}/10</span>
                            </div>
                            <div className="w-full h-1 bg-[#181b22] mt-1">
                              <div
                                className="h-full bg-[#ffb000]"
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
