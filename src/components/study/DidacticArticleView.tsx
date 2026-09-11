'use client';

import React, { useState } from 'react';
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
  HelpCircle,
  Clock,
  Copy,
  Check,
} from 'lucide-react';
import { CurriculumNode, SubModule } from '@/types/curriculum';
import { getOfflineAssessment } from '@/core/ai/offline-bank';
import { playTactileClick } from '@/lib/audio-feedback';

interface DidacticArticleViewProps {
  node: CurriculumNode;
  activeSubModule?: SubModule;
  assessmentData?: LessonAndAssessmentResponse;
  onOpenStressTest: () => void;
  onOpenSandbox: () => void;
  onOpenExercise?: () => void;
  className?: string;
}

export const DidacticArticleView: React.FC<DidacticArticleViewProps> = ({
  node,
  activeSubModule,
  assessmentData,
  onOpenStressTest,
  onOpenSandbox,
  onOpenExercise,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'article' | 'references'>('article');
  const [copiedFormulaIdx, setCopiedFormulaIdx] = useState<number | null>(null);
  const [copiedShader, setCopiedShader] = useState<boolean>(false);

  const resolvedData = assessmentData || getOfflineAssessment(node.id);
  const article: DidacticArticle | undefined =
    activeSubModule?.didacticArticle || resolvedData?.didactic_article;
  const activeTitle = activeSubModule?.title || article?.title || node.title;
  const activeSubtitle = article?.subtitle || activeSubModule?.mathFoundation || node.mathFoundation;
  const activeFormulas =
    (article?.mathematical_derivation_latex && article.mathematical_derivation_latex.length > 0
      ? article.mathematical_derivation_latex
      : activeSubModule?.latexFormulas && activeSubModule.latexFormulas.length > 0
      ? activeSubModule.latexFormulas
      : node.latexFormulas) || [];

  const activeGlslShader =
    activeSubModule?.defaultGlslShader ||
    resolvedData?.shader_sandbox_payload?.boilerplate_glsl ||
    node.defaultGlslShader;

  const readTime = article?.read_time_minutes ?? 6;

  const handleCopyFormula = async (latex: string, idx: number) => {
    playTactileClick();
    try {
      await navigator.clipboard.writeText(latex);
      setCopiedFormulaIdx(idx);
      setTimeout(() => setCopiedFormulaIdx(null), 2000);
    } catch {
      // Ignore clipboard write failure
    }
  };

  const handleCopyShader = async (code: string) => {
    playTactileClick();
    try {
      await navigator.clipboard.writeText(code);
      setCopiedShader(true);
      setTimeout(() => setCopiedShader(false), 2000);
    } catch {
      // Ignore clipboard write failure
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#0a0d14] text-slate-100 overflow-y-auto select-text ${className}`}>
      {/* Top Navigation Bar: Linear/Geist Style Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-5 py-3 bg-[#0a0d14]/90 backdrop-blur-md border-b border-white/[0.08] select-none">
        {/* Segmented Control Tabs */}
        <div className="flex items-center p-0.5 rounded-lg bg-[#121622] border border-white/[0.08]">
          <button
            onClick={() => {
              playTactileClick();
              setActiveTab('article');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'article'
                ? 'bg-white/[0.09] text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-orange-400" />
            <span>Aula do Professor</span>
          </button>

          <button
            onClick={() => {
              playTactileClick();
              setActiveTab('references');
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'references'
                ? 'bg-white/[0.09] text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Book className="w-3.5 h-3.5 text-amber-400" />
            <span>Referências</span>
          </button>
        </div>

        {/* Action Button: Stress Test */}
        <button
          onClick={() => {
            playTactileClick();
            onOpenStressTest();
          }}
          className="tactile-btn tactile-btn-orange px-3.5 py-1.5 text-xs flex items-center gap-1.5"
          title="Iniciar Prova de Estresse com o Professor Gemini"
        >
          <Flame className="w-3.5 h-3.5 fill-white/80 animate-pulse" />
          <span className="hidden sm:inline font-semibold">Prova de Estresse</span>
        </button>
      </div>

      {/* Main Reading Canvas */}
      <div className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-8">
        {activeTab === 'article' ? (
          /* ============================================================
             TAB 1: AULA DO PROFESSOR (ARTIGO DIDÁTICO COMPLETO)
             ============================================================ */
          <article className="space-y-8">
            {/* Header / Article Title Area */}
            <header className="space-y-3 pb-6 border-b border-white/[0.08]">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold uppercase tracking-wider text-[10px]">
                  Teoria Matemática & Computação Gráfica
                </span>
                <span className="flex items-center gap-1 text-slate-400 text-[11px]">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {readTime} min de leitura
                </span>
                {activeSubModule && (
                  <span className="text-slate-400 text-[11px]">
                    • Submódulo {activeSubModule.order}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                {activeTitle}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
                {activeSubtitle}
              </p>

              {/* Scientific Pedagogy Note Callout */}
              {article?.scientific_pedagogy_note && (
                <div className="mt-4 p-4 rounded-xl bg-violet-950/20 border border-violet-500/20 text-xs sm:text-sm text-slate-200 flex items-start gap-3 shadow-xs">
                  <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 shrink-0 mt-0.5">
                    <Brain className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-mono text-violet-300 font-bold uppercase tracking-wider text-[10px] block">
                      Nota Pedagógica (Base Científica)
                    </span>
                    <p className="text-slate-300 leading-relaxed font-sans text-xs sm:text-sm">
                      {article.scientific_pedagogy_note}
                    </p>
                  </div>
                </div>
              )}
            </header>

            {/* Section 1: Geometric Intuition */}
            <section className="p-5 sm:p-6 rounded-2xl bg-[#0e121a] border border-white/[0.08] space-y-3 shadow-sm hover:border-white/[0.12] transition-colors">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                <div className="p-1.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <span>1. Intuição Geométrica e Modelo Mental</span>
              </div>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
                {article?.geometric_intuition || activeSubModule?.graphicApplication || node.graphicApplication}
              </p>
            </section>

            {/* Section 2: Historical Context */}
            {article?.historical_context && (
              <section className="p-5 sm:p-6 rounded-2xl bg-[#121520] border border-white/[0.08] space-y-3 shadow-sm hover:border-white/[0.12] transition-colors">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-orange-400 uppercase tracking-wider">
                  <div className="p-1.5 rounded-md bg-orange-500/10 border border-orange-500/20">
                    <BookOpen className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                  <span>2. Origem Histórica na Matemática & Computação Gráfica</span>
                </div>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
                  {article.historical_context}
                </p>
              </section>
            )}

            {/* Section 3: Step-by-Step Formal Mathematical Derivations */}
            <section className="p-5 sm:p-6 rounded-2xl bg-[#0e1017] border border-white/[0.08] space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                  <div className="p-1.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <span>3. Dedução Analítica Formal Passo a Passo</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {activeFormulas.length} {activeFormulas.length === 1 ? 'equação' : 'equações'}
                </span>
              </div>

              <div className="space-y-3">
                {activeFormulas.map((formula, i) => (
                  <div
                    key={i}
                    className="group relative p-4 sm:p-5 rounded-xl bg-[#141724] border border-white/[0.06] hover:border-white/[0.12] transition-all"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.04] text-[11px] font-mono text-slate-400">
                      <span className="font-semibold text-slate-300">
                        Passo {i + 1}
                      </span>
                      <button
                        onClick={() => handleCopyFormula(formula, i)}
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-orange-300 px-2 py-0.5 rounded bg-white/[0.03] hover:bg-white/[0.08] transition-colors cursor-pointer"
                        title="Copiar código LaTeX"
                      >
                        {copiedFormulaIdx === i ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar LaTeX</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="overflow-x-auto py-1 text-slate-100 font-sans">
                      <MathRenderer latex={formula} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 4: Hardware Microarchitecture & GPU Pipeline */}
            <section className="p-5 sm:p-6 rounded-2xl bg-[#121520] border-l-4 border-emerald-500/80 border border-white/[0.08] space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                <div className="p-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span>4. Microarquitetura de Hardware & Pipeline de GPU</span>
              </div>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
                {article?.graphics_engine_pipeline ||
                  'Executado nos estágios de Shaders da GPU para computação paralela massiva.'}
              </p>
            </section>

            {/* Section 5: Subtle Code Block (Shader Pipeline) */}
            {activeGlslShader && (
              <section className="p-5 sm:p-6 rounded-2xl bg-[#0e1017] border border-white/[0.08] space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-orange-400 uppercase tracking-wider">
                    <div className="p-1.5 rounded-md bg-orange-500/10 border border-orange-500/20">
                      <Code2 className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                    <span>5. Implementação no Pipeline GLSL / Shader Execution</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyShader(activeGlslShader)}
                      className="flex items-center gap-1 text-[10px] font-mono text-slate-400 hover:text-orange-300 px-2 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors cursor-pointer"
                      title="Copiar código GLSL"
                    >
                      {copiedShader ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar GLSL</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={onOpenSandbox}
                      className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors cursor-pointer"
                      title="Abrir e executar no Shader Sandbox"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Abrir no Sandbox</span>
                    </button>
                  </div>
                </div>

                {/* Subtle Geist Code Frame */}
                <div className="rounded-xl bg-[#07090e] border border-white/[0.08] overflow-hidden">
                  <div className="px-4 py-2 bg-[#0d1017] border-b border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                      <span className="ml-2 text-slate-400 text-xs">fragment_shader.glsl</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                      GLSL 3.0 ES
                    </span>
                  </div>

                  <div className="p-4 overflow-x-auto font-mono-code text-xs text-slate-200 leading-relaxed max-h-[380px] overflow-y-auto">
                    <pre className="text-slate-300">
                      <code>
                        {activeGlslShader.split('\n').map((line, idx) => (
                          <div key={idx} className="table-row">
                            <span className="table-cell pr-4 text-right text-slate-600 select-none text-[11px] w-8">
                              {idx + 1}
                            </span>
                            <span className="table-cell whitespace-pre">{line}</span>
                          </div>
                        ))}
                      </code>
                    </pre>
                  </div>
                </div>
              </section>
            )}

            {/* Action Callout: Next Steps (Exercise or Sandbox) */}
            <footer className="p-6 rounded-2xl bg-gradient-to-br from-[#131926] to-[#0c0f17] border border-white/[0.12] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Domínio Teórico Completo?
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Valide sua compreensão com exercícios analíticos ou compile o shader em tempo real.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {onOpenExercise && (
                  <button
                    onClick={() => {
                      playTactileClick();
                      onOpenExercise();
                    }}
                    className="tactile-btn tactile-btn-amber px-4 py-2 text-xs flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Praticar Exercício</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    playTactileClick();
                    onOpenSandbox();
                  }}
                  className="tactile-btn tactile-btn-orange px-4 py-2 text-xs flex items-center gap-1.5"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Sandbox 3D</span>
                </button>
              </div>
            </footer>
          </article>
        ) : (
          /* ============================================================
             TAB 2: REFERÊNCIAS CIENTÍFICAS, LIVROS, VÍDEOS E CÓDIGO
             ============================================================ */
          <div className="space-y-8 font-mono">
            {/* Header */}
            <div className="pb-4 border-b border-white/[0.08] space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Curadoria de Literatura & Pesquisa</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Referências Científicas & Fontes Canônicas
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-sans leading-relaxed">
                Literatura acadêmica fundamental, papers da SIGGRAPH/ACM, palestras e repositórios selecionados para domínio absoluto deste tópico.
              </p>
            </div>

            {/* Academic Papers & Books */}
            {article?.curated_references?.papers_and_books &&
              article.curated_references.papers_and_books.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs text-orange-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <Book className="w-4 h-4 text-orange-400" />
                    Livros Canônicos & Papers Acadêmicos
                  </span>

                  <div className="space-y-3">
                    {article.curated_references.papers_and_books.map((ref, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-xl bg-[#121520] border border-white/[0.08] hover:border-white/[0.12] transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-white text-sm sm:text-base">
                              {ref.title}
                            </h3>
                            <span className="text-slate-400 text-xs block mt-0.5">
                              {ref.author} ({ref.year})
                            </span>
                          </div>

                          {ref.url && (
                            <a
                              href={ref.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-orange-400 hover:text-orange-300 p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] transition-colors shrink-0"
                              title="Acessar publicação"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>

                        <p className="text-slate-300 font-sans text-xs sm:text-sm leading-relaxed">
                          {ref.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Recommended Videos & Talks */}
            {article?.curated_references?.videos_and_talks &&
              article.curated_references.videos_and_talks.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-amber-400" />
                    Palestras & Aulas Recomendadas
                  </span>

                  <div className="space-y-3">
                    {article.curated_references.videos_and_talks.map((vid, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-xl bg-[#0e121a] border border-white/[0.08] hover:border-white/[0.12] transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold text-white text-sm sm:text-base">
                              {vid.title}
                            </h3>
                            <span className="text-amber-400/90 text-xs block mt-0.5">
                              Canal / Palestrante: {vid.channel_or_speaker}
                            </span>
                          </div>

                          <a
                            href={vid.search_query_or_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-400 hover:text-amber-300 p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] transition-colors shrink-0 flex items-center gap-1 text-xs"
                            title="Assistir palestra"
                          >
                            <span>Assistir</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs sm:text-sm font-sans text-slate-300 leading-relaxed">
                          <strong className="text-slate-200 block font-mono text-xs uppercase mb-1">
                            Insight Principal:
                          </strong>
                          {vid.key_takeaway}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Open-Source Projects & Shaders */}
            {article?.curated_references?.code_and_projects &&
              article.curated_references.code_and_projects.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-400" />
                    Código Aberto & Shaders para Dissecação
                  </span>

                  <div className="space-y-3">
                    {article.curated_references.code_and_projects.map((proj, idx) => (
                      <div
                        key={idx}
                        className="p-5 rounded-xl bg-[#0e121a] border border-white/[0.08] hover:border-white/[0.12] transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-bold text-white text-sm sm:text-base">
                            {proj.name}
                          </h3>

                          <a
                            href={proj.repository_or_shadertoy}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 p-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] transition-colors shrink-0 flex items-center gap-1 text-xs"
                            title="Abrir repositório ou shader"
                          >
                            <span>Abrir Código</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs sm:text-sm font-sans text-slate-300 leading-relaxed">
                          <strong className="text-slate-200 block font-mono text-xs uppercase mb-1">
                            O que analisar no código:
                          </strong>
                          {proj.what_to_analyze}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Empty state when no references are curated yet */}
            {(!article?.curated_references?.papers_and_books?.length &&
              !article?.curated_references?.videos_and_talks?.length &&
              !article?.curated_references?.code_and_projects?.length) && (
              <div className="p-8 rounded-2xl bg-[#0e121a] border border-white/[0.08] text-center space-y-3">
                <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-300">
                  Referências Adicionais em Curadoria
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed font-sans">
                  As referências canônicas deste submódulo especializado estão em processo de indexação. Consulte a fundamentação matemática na aula teórica ou teste as equações no Shader Sandbox.
                </p>
                <button
                  onClick={() => {
                    playTactileClick();
                    setActiveTab('article');
                  }}
                  className="tactile-btn tactile-btn-neutral px-4 py-1.5 text-xs text-orange-400 font-mono"
                >
                  Voltar para a Aula Teórica
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
