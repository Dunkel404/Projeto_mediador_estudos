'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { TelemetryHeader } from '@/components/telemetry/TelemetryHeader';
import { SkillTreeMap } from '@/components/skill-tree/SkillTreeMap';
import { CompactSkillRail } from '@/components/skill-tree/CompactSkillRail';
import { DidacticArticleView } from '@/components/study/DidacticArticleView';
import { InteractiveExerciseView } from '@/components/exercise/InteractiveExerciseView';
import { DualSandbox } from '@/components/sandbox/DualSandbox';
import { AIStressTestModal } from '@/components/exercise/AIStressTestModal';
import { CurriculumNode } from '@/types/curriculum';
import { LessonAndAssessmentResponse } from '@/types/ai-contract';
import { getOfflineAssessment } from '@/core/ai/offline-bank';
import { X, Code, BookOpen, GraduationCap, Maximize2, Minimize2 } from 'lucide-react';

export default function Home() {
  const { nodes, progressMap, initializeData, isLoading } = useAppStore();
  const [selectedNode, setSelectedNode] = useState<CurriculumNode | null>(null);
  const [panelMode, setPanelMode] = useState<'article' | 'exercise' | 'sandbox'>('article');
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [showStressModal, setShowStressModal] = useState<boolean>(false);
  const [currentAssessment, setCurrentAssessment] = useState<LessonAndAssessmentResponse | null>(null);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  const handleSelectNode = (node: CurriculumNode) => {
    setSelectedNode(node);
    setCurrentAssessment(getOfflineAssessment(node.id));
    setPanelMode('article');
  };

  const toggleFocusMode = () => {
    setIsFocusMode((prev) => {
      const next = !prev;
      // If entering focus mode with no node selected, select first node
      if (next && !selectedNode && nodes.length > 0) {
        handleSelectNode(nodes[0]);
      }
      return next;
    });
  };

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
      <TelemetryHeader
        isFocusMode={isFocusMode}
        onToggleFocusMode={toggleFocusMode}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 relative flex min-h-0">
        {/* Left Side: Full Skill Tree (Normal) OR Compact Rail (Focus Mode) */}
        {isFocusMode ? (
          <CompactSkillRail
            nodes={nodes}
            progressMap={progressMap}
            selectedNodeId={selectedNode?.id}
            onSelectNode={handleSelectNode}
            onExitFocusMode={() => setIsFocusMode(false)}
          />
        ) : (
          <div className="flex-1 h-full min-h-0">
            <SkillTreeMap
              nodes={nodes}
              progressMap={progressMap}
              onSelectNode={handleSelectNode}
              activeNodeId={selectedNode?.id}
            />
          </div>
        )}

        {/* Right Side: Study & Practice Panel (Drawer in Normal Mode, Expanded Main in Focus Mode) */}
        {selectedNode && (
          <aside
            className={`h-full z-30 flex flex-col bg-[#12141a] border-l border-[#242933] shadow-2xl transition-all ${
              isFocusMode
                ? 'flex-1 min-w-0'
                : 'absolute lg:relative right-0 top-0 w-full lg:w-[680px] xl:w-[740px]'
            }`}
          >
            {/* Drawer Header Controls */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#0a0b0e] border-b border-[#242933]">
              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 font-mono text-xs overflow-x-auto">
                <button
                  onClick={() => setPanelMode('article')}
                  className={`flex items-center gap-1.5 px-3 py-1 transition-colors cursor-pointer shrink-0 ${
                    panelMode === 'article'
                      ? 'bg-[#181b22] text-[#00f0ff] border-b-2 border-[#00f0ff] font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  AULA DO PROFESSOR
                </button>

                <button
                  onClick={() => setPanelMode('exercise')}
                  className={`flex items-center gap-1.5 px-3 py-1 transition-colors cursor-pointer shrink-0 ${
                    panelMode === 'exercise'
                      ? 'bg-[#181b22] text-[#ffb000] border-b-2 border-[#ffb000] font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  EXERCÍCIO & TESTE
                </button>

                <button
                  onClick={() => setPanelMode('sandbox')}
                  className={`flex items-center gap-1.5 px-3 py-1 transition-colors cursor-pointer shrink-0 ${
                    panelMode === 'sandbox'
                      ? 'bg-[#181b22] text-[#10b981] border-b-2 border-[#10b981] font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  SANDBOX 3D
                </button>
              </div>

              {/* Action Buttons: Focus Mode Toggle & Close */}
              <div className="flex items-center gap-1 shrink-0 ml-2">
                <button
                  onClick={toggleFocusMode}
                  className={`flex items-center gap-1 px-2 py-1 border text-xs font-mono transition-colors cursor-pointer ${
                    isFocusMode
                      ? 'bg-[#ffb000]/15 text-[#ffb000] border-[#ffb000]/40'
                      : 'bg-[#181b22] text-slate-400 hover:text-white border-[#242933]'
                  }`}
                  title={isFocusMode ? 'Restaurar visualização padrão' : 'Expandir painel (Modo Foco)'}
                >
                  {isFocusMode ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">SAIR DO FOCO</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">MODO FOCO</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setSelectedNode(null);
                    if (isFocusMode) setIsFocusMode(false);
                  }}
                  className="p-1 text-slate-400 hover:text-white border border-[#242933] hover:bg-[#181b22] transition-colors cursor-pointer"
                  title="Fechar painel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Panel View Content */}
            <div className="flex-1 overflow-hidden min-h-0">
              {panelMode === 'article' ? (
                <DidacticArticleView
                  node={selectedNode}
                  assessmentData={currentAssessment || undefined}
                  onOpenStressTest={() => setShowStressModal(true)}
                  onOpenSandbox={() => setPanelMode('sandbox')}
                  onOpenExercise={() => setPanelMode('exercise')}
                />
              ) : panelMode === 'exercise' ? (
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

      {/* AI Stress Test / Gemini Bridge Modal */}
      {showStressModal && selectedNode && (
        <AIStressTestModal
          node={selectedNode}
          onClose={() => setShowStressModal(false)}
          onOpenSandbox={() => {
            setShowStressModal(false);
            setPanelMode('sandbox');
          }}
          onAssessmentLoaded={(newAssessment) => {
            setCurrentAssessment(newAssessment);
          }}
        />
      )}
    </div>
  );
}
