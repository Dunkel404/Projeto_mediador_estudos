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
    <div className="relative w-full h-full flex flex-col bg-[#0b0d14]">
      {/* View Switcher Controls (Linear / Modern Pill Bar) */}
      <div className="flex items-center gap-1.5 p-2 border-b border-white/10 bg-[#121520] text-xs font-mono shrink-0 z-30">
        <span className="text-slate-500 text-[10px] uppercase tracking-wider px-2 hidden md:inline">
          VISUALIZAÇÃO:
        </span>
        
        <button
          onClick={() => {
            playTactileClick();
            setViewMode('duolingo');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            viewMode === 'duolingo'
              ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Trilha Gamificada Estilo Duolingo"
        >
          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
          <span className="hidden sm:inline">TRILHA DUOLINGO</span>
        </button>

        <button
          onClick={() => {
            playTactileClick();
            setViewMode('graph');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
            viewMode === 'graph'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Grafo Espacial 2D com Zoom e Pan"
        >
          <Network className="w-3.5 h-3.5 text-amber-400" />
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
