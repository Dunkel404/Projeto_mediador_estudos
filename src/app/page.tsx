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
import { SubModuleNavigator } from '@/components/study/SubModuleNavigator';
import { CurriculumNode } from '@/types/curriculum';
import { LessonAndAssessmentResponse } from '@/types/ai-contract';
import { getOfflineAssessment } from '@/core/ai/offline-bank';
import { X, Code, BookOpen, GraduationCap, Maximize2, Minimize2 } from 'lucide-react';

export default function Home() {
  const { nodes, progressMap, initializeData, isLoading } = useAppStore();
  const [selectedNode, setSelectedNode] = useState<CurriculumNode | null>(null);
  const [activeSubModuleId, setActiveSubModuleId] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<'article' | 'exercise' | 'sandbox'>('article');
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [showStressModal, setShowStressModal] = useState<boolean>(false);
  const [stressModalMode, setStressModalMode] = useState<'stress_test' | 'expand_submodule'>('stress_test');
  const [currentAssessment, setCurrentAssessment] = useState<LessonAndAssessmentResponse | null>(null);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  // Keep selectedNode synchronized with dynamic updates in the store
  const currentNode = nodes.find((n) => n.id === selectedNode?.id) || selectedNode;
  const currentSubmodules = currentNode?.submodules || [];
  const activeSubModule = currentSubmodules.find((s) => s.id === activeSubModuleId) || currentSubmodules[0];

  const handleSelectNode = (node: CurriculumNode) => {
    setSelectedNode(node);
    const subs = node.submodules || [];
    setActiveSubModuleId(subs[0]?.id || null);
    setCurrentAssessment(getOfflineAssessment(node.id));
    setPanelMode('article');
  };

  const toggleFocusMode = () => {
    setIsFocusMode((prev) => {
      const next = !prev;
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
            selectedNodeId={currentNode?.id}
            onSelectNode={handleSelectNode}
            onExitFocusMode={() => setIsFocusMode(false)}
          />
        ) : (
          <div className="flex-1 h-full min-h-0">
            <SkillTreeMap
              nodes={nodes}
              progressMap={progressMap}
              onSelectNode={handleSelectNode}
              activeNodeId={currentNode?.id}
            />
          </div>
        )}

        {/* Right Side: Study & Practice Panel */}
        {currentNode && (
          <aside
            className={`h-full z-30 flex flex-col bg-[#12141a] border-l border-[#242933] shadow-2xl transition-all ${
              isFocusMode
                ? 'flex-1 min-w-0'
                : 'absolute lg:relative right-0 top-0 w-full lg:w-[680px] xl:w-[760px]'
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

            {/* SubModule Stepper Navigator with 3D Applicability Gauge */}
            {currentSubmodules.length > 0 && (
              <SubModuleNavigator
                submodules={currentSubmodules}
                activeSubModuleId={activeSubModule?.id || currentSubmodules[0].id}
                onSelectSubModule={(subId) => setActiveSubModuleId(subId)}
                onTriggerDynamicExpansion={() => {
                  setStressModalMode('expand_submodule');
                  setShowStressModal(true);
                }}
                submoduleProgressMap={progressMap[currentNode.id]?.submoduleProgressMap}
              />
            )}

            {/* Panel View Content */}
            <div className="flex-1 overflow-hidden min-h-0">
              {panelMode === 'article' ? (
                <DidacticArticleView
                  node={currentNode}
                  activeSubModule={activeSubModule}
                  assessmentData={currentAssessment || undefined}
                  onOpenStressTest={() => {
                    setStressModalMode('stress_test');
                    setShowStressModal(true);
                  }}
                  onOpenSandbox={() => setPanelMode('sandbox')}
                  onOpenExercise={() => setPanelMode('exercise')}
                />
              ) : panelMode === 'exercise' ? (
                <InteractiveExerciseView
                  node={currentNode}
                  activeSubModule={activeSubModule}
                  onOpenSandbox={() => setPanelMode('sandbox')}
                  onOpenArticle={() => setPanelMode('article')}
                />
              ) : (
                <DualSandbox
                  initialGlsl={activeSubModule?.defaultGlslShader || currentNode.defaultGlslShader}
                  className="h-full"
                />
              )}
            </div>
          </aside>
        )}
      </div>

      {/* AI Stress Test / Dynamic Submodule Expansion Modal */}
      {showStressModal && currentNode && (
        <AIStressTestModal
          node={currentNode}
          activeSubModule={activeSubModule}
          mode={stressModalMode}
          onClose={() => setShowStressModal(false)}
          onOpenSandbox={() => {
            setShowStressModal(false);
            setPanelMode('sandbox');
          }}
          onAssessmentLoaded={(newAssessment) => {
            setCurrentAssessment(newAssessment);
          }}
          onSubModuleCreated={(newSub) => {
            setActiveSubModuleId(newSub.id);
          }}
        />
      )}
    </div>
  );
}
