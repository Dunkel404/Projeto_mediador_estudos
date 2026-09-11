'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { TelemetryHeader } from '@/components/telemetry/TelemetryHeader';
import { SkillTreeMap } from '@/components/skill-tree/SkillTreeMap';
import { InteractiveExerciseView } from '@/components/exercise/InteractiveExerciseView';
import { DualSandbox } from '@/components/sandbox/DualSandbox';
import { CurriculumNode } from '@/types/curriculum';
import { X, Code, BookOpen } from 'lucide-react';

export default function Home() {
  const { nodes, progressMap, initializeData, isLoading } = useAppStore();
  const [selectedNode, setSelectedNode] = useState<CurriculumNode | null>(null);
  const [panelMode, setPanelMode] = useState<'exercise' | 'sandbox'>('exercise');

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0a0b0e] text-white font-mono gap-3">
        <div className="w-8 h-8 border-2 border-[#00f0ff] border-t-transparent animate-spin" />
        <span className="text-xs text-[#00f0ff] tracking-widest">CARREGANDO TELEMETRIA FSRS...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0a0b0e]">
      {/* HUD Header */}
      <TelemetryHeader />

      {/* Main Content Workspace */}
      <div className="flex-1 relative flex min-h-0">
        {/* Adaptive Skill Tree Map */}
        <div className="flex-1 h-full min-h-0">
          <SkillTreeMap
            nodes={nodes}
            progressMap={progressMap}
            onSelectNode={(node) => {
              setSelectedNode(node);
              setPanelMode('exercise');
            }}
            activeNodeId={selectedNode?.id}
          />
        </div>

        {/* Selected Node Inspector Drawer (Split View on Desktop, Full Drawer on Mobile) */}
        {selectedNode && (
          <aside className="absolute lg:relative right-0 top-0 w-full lg:w-[620px] h-full z-30 flex flex-col bg-[#12141a] border-l border-[#242933] shadow-2xl transition-all">
            {/* Drawer Header Controls */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#0a0b0e] border-b border-[#242933]">
              <div className="flex items-center gap-1 font-mono text-xs">
                <button
                  onClick={() => setPanelMode('exercise')}
                  className={`flex items-center gap-1 px-3 py-1 transition-colors ${
                    panelMode === 'exercise'
                      ? 'bg-[#181b22] text-[#00f0ff] border-b border-[#00f0ff]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  TEORIA & EXERCÍCIO
                </button>
                <button
                  onClick={() => setPanelMode('sandbox')}
                  className={`flex items-center gap-1 px-3 py-1 transition-colors ${
                    panelMode === 'sandbox'
                      ? 'bg-[#181b22] text-[#ffb000] border-b border-[#ffb000]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  SANDBOX 3D
                </button>
              </div>

              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 text-slate-400 hover:text-white border border-[#242933] hover:bg-[#181b22]"
                title="Fechar painel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Panel View Content */}
            <div className="flex-1 overflow-hidden min-h-0">
              {panelMode === 'exercise' ? (
                <InteractiveExerciseView
                  node={selectedNode}
                  onOpenSandbox={() => setPanelMode('sandbox')}
                />
              ) : (
                <DualSandbox
                  initialGlsl={selectedNode.defaultGlslShader}
                  className="h-full"
                />
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
