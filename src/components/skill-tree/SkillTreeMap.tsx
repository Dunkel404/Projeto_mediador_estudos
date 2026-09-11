'use client';

import React, { useState, useEffect } from 'react';
import { CurriculumNode, UserNodeProgress } from '@/types/curriculum';
import { DesktopSpatialGraph } from './DesktopSpatialGraph';
import { MobileTrackTree } from './MobileTrackTree';
import { LayoutGrid, Network } from 'lucide-react';

interface SkillTreeMapProps {
  nodes: CurriculumNode[];
  progressMap: Record<string, UserNodeProgress>;
  onSelectNode: (node: CurriculumNode) => void;
  activeNodeId?: string | null;
}

export const SkillTreeMap: React.FC<SkillTreeMapProps> = ({
  nodes,
  progressMap,
  onSelectNode,
  activeNodeId,
}) => {
  const [viewMode, setViewMode] = useState<'auto' | 'graph' | 'tree'>('auto');
  const [isDesktop, setIsDesktop] = useState<boolean>(true);

  useEffect(() => {
    const checkWidth = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const effectiveMode = viewMode === 'auto' ? (isDesktop ? 'graph' : 'tree') : viewMode;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0a0b0e]">
      {/* View Switcher Controls */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-[#12141a]/90 backdrop-blur-xs p-1 border border-[#242933] text-xs font-mono">
        <button
          onClick={() => setViewMode('graph')}
          className={`flex items-center gap-1 px-2.5 py-1 transition-colors ${
            effectiveMode === 'graph'
              ? 'bg-[#181b22] text-[#00f0ff] border border-[#00f0ff]/40'
              : 'text-slate-400 hover:text-white'
          }`}
          title="2D Spatial Graph"
        >
          <Network className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">GRAFO 2D</span>
        </button>
        <button
          onClick={() => setViewMode('tree')}
          className={`flex items-center gap-1 px-2.5 py-1 transition-colors ${
            effectiveMode === 'tree'
              ? 'bg-[#181b22] text-[#ffb000] border border-[#ffb000]/40'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Vertical Modular Tracks"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">TRILHAS</span>
        </button>
      </div>

      {/* Render selected view */}
      <div className="flex-1 w-full h-full min-h-0">
        {effectiveMode === 'graph' ? (
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
