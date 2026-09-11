'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CurriculumNode, SubModule } from '@/types/curriculum';
import { MathRenderer } from '@/components/katex/MathRenderer';
import { useAppStore } from '@/lib/store';
import { evaluateSubmission } from '@/core/ai/evaluator';
import { getOfflineAssessment } from '@/core/ai/offline-bank';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Award,
  Play,
  Flame,
  GraduationCap,
  Code2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { AIStressTestModal } from './AIStressTestModal';
import { playCorrectChime, playGentleError, playTactileClick } from '@/lib/audio-feedback';
import { StreakBadge } from '@/components/gamification/StreakBadge';

interface InteractiveExerciseViewProps {
  node: CurriculumNode;
  activeSubModule?: SubModule;
  onOpenSandbox: () => void;
  onOpenArticle?: () => void;
  onSelectSubModule?: (id: string) => void;
  className?: string;
}

export const InteractiveExerciseView: React.FC<InteractiveExerciseViewProps> = ({
  node,
  activeSubModule,
  onOpenSandbox,
  onOpenArticle,
  onSelectSubModule,
  className = '',
}) => {
  const { progressMap, recordExerciseAttempt } = useAppStore();
  const progress = progressMap[node.id];

  const offlineAssessment = getOfflineAssessment(node.id);
  const activeExercise =
    activeSubModule?.interactiveExercise || offlineAssessment?.interactive_exercise;

  const expectedVars = activeExercise?.expected_variables || {};
  const varKeys = Object.keys(expectedVars);

  const [inputVal, setInputVal] = useState<string>('');
  const [varAnswers, setVarAnswers] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
    scoreDelta?: number;
  } | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showStressModal, setShowStressModal] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSecondsElapsed(0);
    setFeedback(null);
    setInputVal('');
    setVarAnswers({});

    timerRef.current = setInterval(() => {
      setSecondsElapsed((s) => s + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [node.id, activeSubModule?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const hasVarInput =
      varKeys.length > 0 && varKeys.some((k) => (varAnswers[k] || '').trim().length > 0);
    const hasSingleInput = inputVal.trim().length > 0;
    if (!hasVarInput && !hasSingleInput) return;

    playTactileClick();
    setIsSubmitting(true);

    const timeSpent = secondsElapsed;
    const timeLimit = 90; // Standard 90s threshold

    let isCorrect = false;
    let score = 0;
    let score3D = 1;
    let diagnosticMsg: string | undefined = undefined;
    let feedbackMsg = '';
    let isWarningTrap = false;

    // Consolidate answers for evaluator
    const finalAnswers: Record<string, string> = {};
    if (varKeys.length === 1) {
      const singleKey = varKeys[0];
      finalAnswers[singleKey] = (varAnswers[singleKey] || inputVal).trim();
    } else if (varKeys.length > 1) {
      for (const k of varKeys) {
        finalAnswers[k] = (varAnswers[k] || '').trim();
      }
    } else {
      finalAnswers['default'] = inputVal.trim();
    }

    if (activeExercise && varKeys.length > 0) {
      const evalResult = evaluateSubmission(
        activeExercise.expected_variables,
        activeExercise.diagnostic_traps || [],
        finalAnswers
      );

      isCorrect = evalResult.isCorrect;
      score = evalResult.score;
      const target3D = activeSubModule ? activeSubModule.targetScore3D : 10;
      score3D = isCorrect ? target3D : Math.max(1, Math.round((evalResult.score3D / 10) * target3D));
      diagnosticMsg = evalResult.matchedTrap?.feedback;
      isWarningTrap = Boolean(evalResult.matchedTrap);
      feedbackMsg = evalResult.feedbackMessage;
    } else {
      // Deterministic diagnostic evaluation based on node domain
      const cleanInput = inputVal.replace(/\s+/g, '').toLowerCase();

      // Node-specific deterministic problem checks
      if (node.id === 't0_algebra_fma') {
        if (
          cleanInput.includes('x*(2*x+5)+3') ||
          cleanInput.includes('x*(2x+5)+3') ||
          cleanInput === 'x(2x+5)+3' ||
          cleanInput.includes('1/(sqrt(x+1)+sqrt(x))') ||
          cleanInput === '3' ||
          cleanInput.includes('t*t*t*(t*(6*t-15)+10)')
        ) {
          isCorrect = true;
          score = 90;
        } else if (cleanInput.includes('2*x*x') || cleanInput.includes('6*t*t*t*t*t')) {
          score = 40;
          diagnosticMsg =
            'Você manteve multiplicação de alta ordem em vez de encadear via Horner: x*(ax + b) + c.';
          isWarningTrap = true;
        } else {
          score = 30;
          diagnosticMsg = 'Erro de fatoração na decomposição para Horner / FMA.';
        }
      } else if (node.id === 't1_vectors_dot') {
        const val = parseFloat(cleanInput);
        if (Math.abs(val - 0.8) < 0.02 || Math.abs(val - 0.6) < 0.02 || Math.abs(val - 1.0) < 0.02) {
          isCorrect = true;
          score = 90;
        } else {
          score = 30;
          diagnosticMsg = 'Erro de cálculo do produto interno escalar ou componente refletida.';
        }
      } else {
        if (cleanInput.length > 0 && !isNaN(Number(cleanInput))) {
          isCorrect = true;
          score = 88;
        } else {
          isCorrect = true;
          score = 85;
        }
      }

      const target3D = activeSubModule ? activeSubModule.targetScore3D : 10;
      score3D = isCorrect ? target3D : 1;
      feedbackMsg = isCorrect
        ? `Correto! Pontuação: ${score}/90 — Aplicabilidade 3D: ${score3D}/${target3D}. Tempo: ${timeSpent}s.`
        : diagnosticMsg ||
          'Resposta incorreta. O algoritmo FSRS registrou repetição imediata para reforço deste tópico.';
    }

    await recordExerciseAttempt({
      nodeId: node.id,
      subModuleId: activeSubModule?.id,
      scoreKnowledge: score,
      score3D,
      timeSpentSeconds: timeSpent,
      timeLimitSeconds: timeLimit,
      userAnswer: JSON.stringify(finalAnswers),
      isCorrect,
      diagnosticLogged: diagnosticMsg,
    });

    if (isCorrect) {
      const hasCelebration = Boolean(useAppStore.getState().activeCelebration);
      if (!hasCelebration) {
        playCorrectChime();
      }
      setFeedback({
        type: 'success',
        message: feedbackMsg,
        scoreDelta: score,
      });
    } else if (isWarningTrap) {
      playGentleError();
      setFeedback({
        type: 'warning',
        message: feedbackMsg,
      });
    } else {
      playGentleError();
      setFeedback({
        type: 'error',
        message: feedbackMsg,
      });
    }

    setIsSubmitting(false);
  };

  const formulas = activeSubModule?.latexFormulas || node.latexFormulas;

  return (
    <div className={`flex flex-col h-full bg-[#0a0d14] text-slate-100 overflow-y-auto ${className}`}>
      {/* Top Header: Ergonomic & Calibrated */}
      <header className="sticky top-0 z-20 px-5 py-3.5 bg-[#0a0d14]/90 backdrop-blur-md border-b border-white/[0.08] select-none">
        <div className="flex items-center justify-between text-xs font-mono mb-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold uppercase tracking-wider text-[10px]">
              TIER {node.tier} // {node.category.toUpperCase().replace('_', ' ')}
            </span>
            {activeSubModule && (
              <span className="text-slate-400 text-[11px]">
                Submódulo {activeSubModule.order}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <StreakBadge compact />
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#121622] border border-white/[0.06] text-slate-300 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{secondsElapsed}s decorridos</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {activeSubModule?.title || node.title}
            </h1>
            {activeSubModule && (
              <span className="text-xs font-mono text-amber-400/90 block mt-0.5">
                Peso 3D: {Math.round(activeSubModule.threeDApplicabilityWeight * 100)}% na progressão espacial
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenArticle && (
              <button
                onClick={() => {
                  playTactileClick();
                  onOpenArticle();
                }}
                className="tactile-btn tactile-btn-neutral px-3.5 py-1.5 text-xs flex items-center gap-1.5"
                title="Voltar para a aula didática"
              >
                <GraduationCap className="w-3.5 h-3.5 text-orange-400" />
                <span className="hidden sm:inline">Aula Teórica</span>
              </button>
            )}

            <button
              onClick={() => {
                playTactileClick();
                setShowStressModal(true);
              }}
              className="tactile-btn tactile-btn-amber px-3.5 py-1.5 text-xs flex items-center gap-1.5"
              title="Iniciar Prova de Estresse adaptativa com Gemini"
            >
              <Flame className="w-3.5 h-3.5 fill-white/80 animate-pulse" />
              <span>Prova de Estresse</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Exercise Content Container */}
      <main className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6">
        {/* Theory Summary Badges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#0e121a] border border-orange-500/20 space-y-1.5 shadow-xs">
            <h2 className="text-xs font-mono font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              Fundamento Matemático
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              {activeSubModule?.mathFoundation || node.mathFoundation}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#0e121a] border border-amber-500/20 space-y-1.5 shadow-xs">
            <h2 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Aplicação Prática em Shaders
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              {activeSubModule?.graphicApplication || node.graphicApplication}
            </p>
          </div>
        </div>

        {/* LaTeX Math Formula Render */}
        {formulas && formulas.length > 0 && (
          <div className="p-4 rounded-xl bg-[#0e121a] border border-white/[0.08] space-y-2 shadow-xs">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold tracking-wider block">
              Formulação Analítica Rigorosa:
            </span>
            <div className="flex flex-wrap gap-4 items-center">
              {formulas.map((eq, i) => (
                <div key={i} className="px-3 py-1.5 rounded-lg bg-[#080a10] border border-white/[0.06] overflow-x-auto text-xs">
                  <MathRenderer latex={eq} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Telemetry Status Card (if user has interacted with this node) */}
        {progress && (
          <div className="p-4 rounded-xl bg-[#0e121a] border border-white/[0.08] shadow-xs">
            <h3 className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold mb-3">
              Telemetria de Domínio Atual:
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-[#121622] border border-white/[0.04]">
                <span className="text-slate-400 block text-[10px]">CONHECIMENTO</span>
                <span className="text-orange-400 text-sm font-bold">{progress.scoreKnowledge}/90</span>
              </div>
              <div className="p-3 rounded-lg bg-[#121622] border border-white/[0.04]">
                <span className="text-slate-400 block text-[10px]">PROFICIÊNCIA 3D</span>
                <span className="text-amber-400 text-sm font-bold">{progress.score3D}/10</span>
              </div>
              <div className="p-3 rounded-lg bg-[#121622] border border-white/[0.04]">
                <span className="text-slate-400 block text-[10px]">VELOCIDADE</span>
                <span className="text-white text-sm font-semibold">{progress.responseSpeed}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#121622] border border-white/[0.04]">
                <span className="text-slate-400 block text-[10px]">NÍVEL DE RETENÇÃO</span>
                <span className="text-emerald-400 text-sm font-semibold">{progress.proficiencyLevel}</span>
              </div>
            </div>
          </div>
        )}

        {/* Attention Points Alert */}
        {progress && progress.attentionPoints.length > 0 && (
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300 text-xs sm:text-sm font-sans flex items-start gap-3 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-mono font-bold uppercase tracking-wider text-xs block text-rose-200">
                Pontos de Atenção Detectados:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-xs">
                {progress.attentionPoints.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Interactive Validation Form */}
        <div className="p-6 rounded-2xl bg-[#0e121a] border border-white/[0.08] shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-orange-500/10 border border-orange-500/20">
              <Award className="w-4 h-4 text-orange-400" />
            </div>
            <h2 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
              {activeExercise ? 'Desafio Analítico do Submódulo' : 'Validação Mecânica da Expressão'}
            </h2>
          </div>

          {/* KaTeX Mathematical Problem Statement */}
          {activeExercise?.statement_latex && (
            <div className="p-4 rounded-xl bg-[#0c0f17] border-l-4 border-amber-500/80 border border-white/[0.08] space-y-2 shadow-xs">
              <span className="text-[11px] font-mono uppercase text-amber-400 font-bold tracking-wider block">
                Enunciado Matemático do Exercício:
              </span>
              <div className="py-1 text-slate-100 font-sans overflow-x-auto">
                <MathRenderer latex={activeExercise.statement_latex} />
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {varKeys.length > 1 ? (
              /* Multi-variable input grid */
              <div className="space-y-3">
                <span className="text-xs font-mono text-slate-400 uppercase font-semibold block tracking-wider">
                  Variáveis Analíticas Requeridas:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {varKeys.map((key) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-xs text-orange-300 font-mono font-bold block">
                        {key} =
                      </label>
                      <input
                        type="text"
                        value={varAnswers[key] || ''}
                        onChange={(e) =>
                          setVarAnswers((prev) => ({ ...prev, [key]: e.target.value }))
                        }
                        disabled={isSubmitting}
                        placeholder={`Insira a resposta de ${key}...`}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#080a10] border border-white/10 text-slate-100 font-mono-code text-sm placeholder:text-slate-500 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all disabled:opacity-50"
                        autoComplete="off"
                        spellCheck="false"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : varKeys.length === 1 ? (
              /* Single variable input */
              <div className="space-y-2">
                <label className="text-xs text-orange-300 font-mono font-bold block">
                  {varKeys[0]} =
                </label>
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => {
                    setInputVal(e.target.value);
                    setVarAnswers({ [varKeys[0]]: e.target.value });
                  }}
                  disabled={isSubmitting}
                  placeholder={`Insira a fórmula analítica ou valor de ${varKeys[0]}...`}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080a10] border border-white/10 text-slate-100 font-mono-code text-sm placeholder:text-slate-500 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all disabled:opacity-50"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
            ) : (
              /* Fallback single input */
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm text-slate-300 font-sans">
                  {node.id === 't0_algebra_fma' &&
                    'Converta o polinômio 2x² + 5x + 3 para a forma de Horner ótima para instruções FMA (ex: x*(2*x + 5) + 3):'}
                  {node.id === 't1_vectors_dot' &&
                    'Calcule o produto escalar N · L para N = (0, 0.6, 0.8) e L = (0, 0, 1):'}
                  {node.id === 't2_tetrahedron_normals' &&
                    'Quantas avaliações de SDF a técnica do tetraedro exige para computar a normal?'}
                  {!['t0_algebra_fma', 't1_vectors_dot', 't2_tetrahedron_normals'].includes(
                    node.id
                  ) && 'Insira o resultado analítico ou a expressão escalar correspondente:'}
                </label>
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Insira sua resposta analítica..."
                  className="w-full px-4 py-2.5 rounded-xl bg-[#080a10] border border-white/10 text-slate-100 font-mono-code text-sm placeholder:text-slate-500 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all disabled:opacity-50"
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  playTactileClick();
                  onOpenSandbox();
                }}
                className="tactile-btn tactile-btn-neutral px-4 py-2 text-xs flex items-center justify-center gap-1.5"
              >
                <Code2 className="w-3.5 h-3.5 text-orange-400" />
                <span>Abrir Shader Sandbox</span>
              </button>

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  (varKeys.length > 0
                    ? !varKeys.some((k) => (varAnswers[k] || '').trim().length > 0) &&
                      !inputVal.trim()
                    : !inputVal.trim())
                }
                className="tactile-btn tactile-btn-orange px-5 py-2 text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Validar Submissão</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Feedback Display */}
          {feedback && (
            <div
              className={`mt-4 p-4 rounded-xl border text-xs sm:text-sm font-sans flex items-start gap-3 shadow-xs transition-all ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/25 border-emerald-500/35 text-emerald-200'
                  : feedback.type === 'warning'
                  ? 'bg-amber-950/25 border-amber-500/35 text-amber-200'
                  : 'bg-rose-950/25 border-rose-500/35 text-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    feedback.type === 'warning' ? 'text-amber-400' : 'text-rose-400'
                  }`}
                />
              )}
              <div className="space-y-2 flex-1">
                <p className="font-medium leading-relaxed">{feedback.message}</p>
                {feedback.type === 'success' && (
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      onClick={onOpenSandbox}
                      className="inline-flex items-center gap-1 text-xs text-orange-300 hover:text-orange-200 underline font-medium cursor-pointer"
                    >
                      <span>Ir para o Shader Sandbox e testar em GLSL</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    {node.submodules?.find(
                      (s) => s.order === (activeSubModule?.order || 1) + 1
                    ) &&
                      onSelectSubModule && (
                        <button
                          onClick={() => {
                            const next = node.submodules?.find(
                              (s) => s.order === (activeSubModule?.order || 1) + 1
                            );
                            if (next) onSelectSubModule(next.id);
                          }}
                          className="tactile-btn tactile-btn-neutral px-3 py-1 text-xs text-amber-300 border border-amber-500/30 flex items-center gap-1 cursor-pointer"
                        >
                          <span>Avançar para Submódulo {(activeSubModule?.order || 1) + 1}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* AI Stress Test Modal */}
      {showStressModal && (
        <AIStressTestModal
          node={node}
          activeSubModule={activeSubModule}
          onClose={() => setShowStressModal(false)}
          onOpenSandbox={onOpenSandbox}
        />
      )}
    </div>
  );
};
