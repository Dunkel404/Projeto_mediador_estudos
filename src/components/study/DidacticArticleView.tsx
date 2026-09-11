'use client';

import React, { useState } from 'react';
import { CurriculumNode } from '@/types/curriculum';
import { LessonAndAssessmentResponse, DidacticArticle } from '@/types/ai-contract';
import { MathRenderer } from '@/components/katex/MathRenderer';
import {
  BookOpen,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Youtube,
  Book,
  Code2,
  Brain,
  Lightbulb,
  Layers,
  Flame,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { getOfflineAssessment } from '@/core/ai/offline-bank';

interface DidacticArticleViewProps {
  node: CurriculumNode;
  assessmentData?: LessonAndAssessmentResponse;
  onOpenStressTest: () => void;
  onOpenSandbox: () => void;
  onOpenExercise?: () => void;
  className?: string;
}

export const DidacticArticleView: React.FC<DidacticArticleViewProps> = ({
  node,
  assessmentData,
  onOpenStressTest,
  onOpenSandbox,
  onOpenExercise,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'article' | 'references'>('article');

  const resolvedData = assessmentData || getOfflineAssessment(node.id);
  const article: DidacticArticle | undefined = resolvedData?.didactic_article;

  return (
    <div className={`flex flex-col h-full bg-[#12141a] border border-[#242933] overflow-y-auto ${className}`}>
      {/* Article Sub-Header with Navigation Tabs */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a0b0e] border-b border-[#242933] sticky top-0 z-20 font-mono text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('article')}
            className={`flex items-center gap-1.5 px-3 py-1 font-bold transition-all ${
              activeTab === 'article'
                ? 'bg-[#181b22] text-[#00f0ff] border-b-2 border-[#00f0ff]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            AULA DO PROFESSOR DIGITAL
          </button>

          <button
            onClick={() => setActiveTab('references')}
            className={`flex items-center gap-1.5 px-3 py-1 font-bold transition-all ${
              activeTab === 'references'
                ? 'bg-[#181b22] text-[#ffb000] border-b-2 border-[#ffb000]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Book className="w-3.5 h-3.5" />
            REFERÊNCIAS & LEITURAS RECOMENDADAS
          </button>
        </div>

        <button
          onClick={onOpenStressTest}
          className="flex items-center gap-1 px-3 py-1 bg-[#ffb000]/15 hover:bg-[#ffb000]/25 text-[#ffb000] border border-[#ffb000]/40 text-xs font-bold transition-colors"
        >
          <Flame className="w-3.5 h-3.5 animate-pulse" />
          <span className="hidden sm:inline">PROVA DE ESTRESSE</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="p-5 space-y-6">
        {activeTab === 'article' ? (
          /* ============================================================
             TAB 1: AULA DO PROFESSOR DIGITAL (ARTIGO COMPLETO)
             ============================================================ */
          <div className="space-y-6">
            {/* Title & Scientific Pedagogy Note */}
            <div className="border-b border-[#242933] pb-4">
              <span className="text-[11px] font-mono text-[#00f0ff] font-bold uppercase tracking-wider block mb-1">
                TEORIA MATEMÁTICA ANCORADA EM COMPUTAÇÃO GRÁFICA
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {article?.title || node.title}
              </h2>
              <p className="text-sm text-slate-300 mt-1 font-sans">
                {article?.subtitle || node.mathFoundation}
              </p>

              {article?.scientific_pedagogy_note && (
                <div className="mt-3 p-3 bg-[#00f0ff]/8 border-l-2 border-[#00f0ff] text-xs font-mono text-slate-300 flex items-start gap-2">
                  <Brain className="w-4 h-4 text-[#00f0ff] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#00f0ff] block mb-0.5">NOTA PEDAGÓGICA (BASE CIENTÍFICA):</strong>
                    {article.scientific_pedagogy_note}
                  </div>
                </div>
              )}
            </div>

            {/* Geometric Intuition */}
            <div className="p-4 bg-[#0a0b0e] border border-[#242933] space-y-2">
              <h3 className="text-xs font-mono font-bold text-[#ffb000] uppercase flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-[#ffb000]" />
                1. Intuição Geométrica e Modelo Mental
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {article?.geometric_intuition || node.graphicApplication}
              </p>
            </div>

            {/* Historical Context */}
            {article?.historical_context && (
              <div className="p-4 bg-[#0f1117] border border-[#242933] space-y-2">
                <h3 className="text-xs font-mono font-bold text-[#38bdf8] uppercase flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#38bdf8]" />
                  2. Origem Histórica na Matemática e Computação Gráfica
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {article.historical_context}
                </p>
              </div>
            )}

            {/* Analytical Mathematical Derivations */}
            <div className="p-4 bg-[#0a0b0e] border border-[#242933] space-y-3">
              <h3 className="text-xs font-mono font-bold text-[#c084fc] uppercase flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#c084fc]" />
                3. Dedução Analítica Formal Passo a Passo
              </h3>

              <div className="space-y-2">
                {(article?.mathematical_derivation_latex || node.latexFormulas).map(
                  (formula, i) => (
                    <div key={i} className="p-3 bg-[#12141a] border border-[#242933]">
                      <MathRenderer latex={formula} />
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Graphics Engine Pipeline (Where it runs on GPU) */}
            <div className="p-4 bg-[#0f1117] border-l-2 border-[#10b981] space-y-2">
              <h3 className="text-xs font-mono font-bold text-[#10b981] uppercase flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#10b981]" />
                4. Microarquitetura de Hardware & Pipeline de GPU
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {article?.graphics_engine_pipeline ||
                  'Executado nos estágios de Shaders da GPU para computação paralela massiva.'}
              </p>
            </div>

            {/* Direct Exercise and Sandbox Callout */}
            <div className="p-4 bg-[#141824] border border-[#00f0ff]/30 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-mono font-bold text-white uppercase">
                  Domínio Teórico Completo?
                </h4>
                <p className="text-xs text-slate-400">
                  Valide a mecânica algébrica com exercícios cirúrgicos ou compile o shader em tempo real.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {onOpenExercise && (
                  <button
                    onClick={onOpenExercise}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#ffb000] hover:bg-[#ffc033] text-black font-mono font-bold text-xs transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    PRATICAR EXERCÍCIO →
                  </button>
                )}
                <button
                  onClick={onOpenSandbox}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#00f0ff] hover:bg-[#38bdf8] text-black font-mono font-bold text-xs transition-colors cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  SANDBOX 3D →
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================
             TAB 2: REFERÊNCIAS CIENTÍFICAS, LIVROS, VÍDEOS E CÓDIGO
             ============================================================ */
          <div className="space-y-6 font-mono">
            {/* Header */}
            <div className="border-b border-[#242933] pb-3">
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#ffb000]" />
                REFERÊNCIAS CIENTÍFICAS & CURADORIA DE ESTUDOS
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Literatura acadêmica fundamental, papers da SIGGRAPH/ACM, palestras e repositórios de código aberto selecionados para domínio absoluto deste tópico.
              </p>
            </div>

            {/* Academic Papers & Books */}
            <div className="space-y-3">
              <span className="text-xs text-[#00f0ff] font-bold uppercase flex items-center gap-1.5">
                <Book className="w-3.5 h-3.5 text-[#00f0ff]" />
                LIVROS CANÔNICOS & ARTIGOS ACADÊMICOS:
              </span>

              <div className="space-y-2.5">
                {article?.curated_references?.papers_and_books?.map((ref, idx) => (
                  <div key={idx} className="p-3.5 bg-[#0a0b0e] border border-[#242933] text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-white text-sm">{ref.title}</h4>
                        <span className="text-slate-400 text-[11px] block mt-0.5">
                          {ref.author} ({ref.year})
                        </span>
                      </div>
                      {ref.url && (
                        <a
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00f0ff] hover:underline shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    <p className="text-slate-300 font-sans mt-2 text-[11px] leading-relaxed">
                      {ref.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Videos & Talks */}
            <div className="space-y-3">
              <span className="text-xs text-[#ffb000] font-bold uppercase flex items-center gap-1.5">
                <Youtube className="w-3.5 h-3.5 text-[#ffb000]" />
                VÍDEOS & PALESTRAS RECOMENDADAS:
              </span>

              <div className="space-y-2.5">
                {article?.curated_references?.videos_and_talks?.map((vid, idx) => (
                  <div key={idx} className="p-3.5 bg-[#0a0b0e] border border-[#242933] text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-white text-sm">{vid.title}</h4>
                        <span className="text-[#ffb000] text-[11px] block mt-0.5">
                          Canal / Palestrante: {vid.channel_or_speaker}
                        </span>
                      </div>
                      <a
                        href={vid.search_query_or_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#ffb000] hover:underline shrink-0 flex items-center gap-1 text-[11px]"
                      >
                        <span>Assistir</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-slate-300 font-sans mt-2 text-[11px] leading-relaxed">
                      <strong>Takeaway Chave:</strong> {vid.key_takeaway}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Open-Source Projects & Shaders to Analyze */}
            <div className="space-y-3">
              <span className="text-xs text-[#10b981] font-bold uppercase flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[#10b981]" />
                CÓDIGO ABERTO & PROJETOS PARA ANALISAR:
              </span>

              <div className="space-y-2.5">
                {article?.curated_references?.code_and_projects?.map((proj, idx) => (
                  <div key={idx} className="p-3.5 bg-[#0a0b0e] border border-[#242933] text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-white text-sm">{proj.name}</h4>
                      <a
                        href={proj.repository_or_shadertoy}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#10b981] hover:underline shrink-0 flex items-center gap-1 text-[11px]"
                      >
                        <span>Abrir Código</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-slate-300 font-sans mt-2 text-[11px] leading-relaxed">
                      <strong>O que dissecar:</strong> {proj.what_to_analyze}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
