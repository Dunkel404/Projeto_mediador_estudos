'use client';

import React, { useState, useEffect } from 'react';
import { CurriculumNode, UserNodeProgress } from '@/types/curriculum';
import { DesktopSpatialGraph } from './DesktopSpatialGraph';
import { MobileTrackTree } from './MobileTrackTree';
import { DuolingoTrackView } from './DuolingoTrackView';
import { LayoutGrid, Network, Compass, Sparkles } from 'lucide-react';
import { playTactileClick } from '@/lib/audio-feedback';

interface SkillTreeMapProps {
  nodes: CurriculumNode[];
  progressMap: Record<string, UserNodeProgress>;
  onSelectNode: (node: CurriculumNode, initialMode?: 'article' | 'exercise' | 'sandbox') => void;
  activeNodeId?: string | null;
}

export const SkillTreeMap: React.FC<SkillTreeMapProps> = ({
  nodes,
  progressMap,
  onSelectNode,
  activeNodeId,
}) => {
  const [viewMode, setViewMode] = useState<'duolingo' | 'graph' | 'tree'>('duolingo');

  return (
    <div className="relative w-full h-full flex flex-col bg-[#090b10]">
      {/* View Switcher Controls (Linear / Modern Pill Bar) */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-[#0f121a]/90 backdrop-blur-md p-1 rounded-xl border border-white/10 text-xs font-mono shadow-xl">
        <button
          onClick={() => {
            playTactileClick();
            setViewMode('duolingo');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            viewMode === 'duolingo'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Trilha Gamificada Estilo Duolingo"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">TRILHA DUOLINGO</span>
        </button>

        <button
          onClick={() => {
            playTactileClick();
            setViewMode('graph');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            viewMode === 'graph'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Grafo Espacial 2D com Zoom e Pan"
        >
          <Network className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">GRAFO 2D</span>
        </button>

        <button
          onClick={() => {
            playTactileClick();
            setViewMode('tree');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            viewMode === 'tree'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Visão em Lista Modular por Tiers"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">LISTA MODULAR</span>
        </button>
      </div>

      {/* Render selected view */}
      <div className="flex-1 w-full h-full min-h-0">
        {viewMode === 'duolingo' ? (
          <DuolingoTrackView
            nodes={nodes}
            progressMap={progressMap}
            onSelectNode={onSelectNode}
            activeNodeId={activeNodeId}
          />
        ) : viewMode === 'graph' ? (
          <DesktopSpatialGraph
            nodes={nodes}
            progressMap={progressMap}
            onSelectNode={onSelectNode}
            activeNodeId={activeNodeId}
          />
        ) : (
          <MobileTrackTree
            nodes={nodes}
            progressMap={progressMap}
            onSelectNode={onSelectNode}
            activeNodeId={activeNodeId}
          />
        )}
      </div>
    </div>
  );
};
