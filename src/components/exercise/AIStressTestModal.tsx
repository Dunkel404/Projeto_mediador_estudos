'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CurriculumNode, SubModule } from '@/types/curriculum';
import { useAppStore } from '@/lib/store';
import { geminiEngine } from '@/core/ai/gemini-engine';
import { evaluateSubmission, EvaluationResult } from '@/core/ai/evaluator';
import { LessonAndAssessmentResponse } from '@/types/ai-contract';
import { MathRenderer } from '@/components/katex/MathRenderer';
import {
  Flame,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Zap,
  Copy,
  ExternalLink,
  ClipboardPaste,
  Check,
  ArrowRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { playTactileClick, playCorrectChime, playGentleError } from '@/lib/audio-feedback';

interface AIStressTestModalProps {
  node: CurriculumNode;
  activeSubModule?: SubModule;
  mode?: 'stress_test' | 'expand_submodule';
  onClose: () => void;
  onOpenSandbox?: () => void;
  onAssessmentLoaded?: (data: LessonAndAssessmentResponse) => void;
  onSubModuleCreated?: (newSubModule: SubModule) => void;
}

export const AIStressTestModal: React.FC<AIStressTestModalProps> = ({
  node,
  activeSubModule,
  mode = 'stress_test',
  onClose,
  onOpenSandbox,
  onAssessmentLoaded,
  onSubModuleCreated,
}) => {
  const { progressMap, fsrsMap, recordExerciseAttempt, appendDynamicSubModule } = useAppStore();
  const progress = progressMap[node.id];
  const card = fsrsMap[node.id];

  // Workflow State: 'bridge' (Copy/Paste JSON) vs 'exam' (Solving problem) vs 'submodule_created'
  const [modalStage, setModalStage] = useState<'bridge' | 'exam' | 'submodule_created'>('bridge');
  const [createdSubModule, setCreatedSubModule] = useState<SubModule | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [pastedJson, setPastedJson] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Exam State
  const [assessment, setAssessment] = useState<LessonAndAssessmentResponse | null>(null);
  const [isOfflineFallback, setIsOfflineFallback] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(90);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Build the zero-context prompt payload for this node
  const triggerMode =
    (progress?.scoreKnowledge ?? 0) >= 88
      ? 'SHADER_CHALLENGE_90'
      : (progress?.scoreKnowledge ?? 0) >= 80
      ? 'STRESS_TEST_85'
      : (progress?.scoreKnowledge ?? 0) >= 50
      ? 'DEEP_DIVE_50'
      : 'NORMAL';

  const promptPayload = {
    user_profile: {
      node_id: node.id,
      node_title: node.title,
      telemetry: {
        nota_conhecimento: progress?.scoreKnowledge ?? 0,
        nota_3d: progress?.score3D ?? 0,
        nivel_proficiencia: progress?.proficiencyLevel ?? 'Inicial',
        rapidez_resposta: progress?.responseSpeed ?? 'Moderada',
        pontos_atencao: progress?.attentionPoints ?? [],
      },
      fsrs_state: {
        stability: card?.stability ?? 0,
        difficulty: card?.difficulty ?? 0,
        repetitions: card?.reps ?? 0,
        lapses: card?.lapses ?? 0,
      },
      trigger_mode: triggerMode as any,
    },
  };

  const compiledPrompt =
    mode === 'expand_submodule'
      ? geminiEngine.buildDynamicSubmoduleExpansionPrompt({
          nodeId: node.id,
          nodeTitle: node.title,
          currentSubmodulesCount: node.submodules?.length || 3,
          telemetry: progress,
        })
      : geminiEngine.buildZeroContextPrompt(promptPayload);

  const handleCopyPrompt = async () => {
    playTactileClick();
    try {
      await navigator.clipboard.writeText(compiledPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 3000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  const handlePasteFromClipboard = async () => {
    playTactileClick();
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setPastedJson(text);
        handleValidateJson(text);
      } else {
        setJsonError('O clipboard está vazio. Copie o JSON retornado pelo Gemini e tente novamente.');
      }
    } catch (err) {
      console.warn('Clipboard read error or not permitted:', err);
      setJsonError(
        'Acesso ao clipboard bloqueado pelo navegador. Por favor, cole o JSON gerado diretamente na caixa de texto abaixo usando Ctrl+V.'
      );
    }
  };

  const handleValidateJson = (textToValidate?: string) => {
    const raw = textToValidate !== undefined ? textToValidate : pastedJson;
    setJsonError(null);

    const validation = geminiEngine.parseAndValidateGeminiResponse(raw);
    if (validation.success && validation.data) {
      // If a new dynamic submodule is generated, append it to the node
      if (validation.data.new_submodule_to_append) {
        const rawSub = validation.data.new_submodule_to_append;
        const newSub: SubModule = {
          id: rawSub.submodule_id,
          moduleId: node.id,
          order: rawSub.order,
          title: rawSub.title,
          depthType: rawSub.depth_type as any,
          threeDApplicabilityWeight: rawSub.three_d_applicability_weight,
          mathFoundation: validation.data.topic.math_foundation,
          graphicApplication: validation.data.topic.graphic_application,
          latexFormulas: rawSub.didactic_article.mathematical_derivation_latex,
          didacticArticle: rawSub.didactic_article,
          interactiveExercise: rawSub.interactive_exercise,
          defaultGlslShader: rawSub.shader_sandbox_payload?.boilerplate_glsl,
          targetScoreKnowledge: rawSub.rubric_criteria.minimum_score_to_advance,
          targetScore3D: 10,
          isDynamicGenerated: true,
        };
        appendDynamicSubModule(node.id, newSub);
        onSubModuleCreated?.(newSub);
        setCreatedSubModule(newSub);
        setAssessment(validation.data);
        onAssessmentLoaded?.(validation.data);

        if (mode === 'expand_submodule') {
          setModalStage('submodule_created');
          return;
        }
      }

      startExamWithAssessment(validation.data, false);
    } else {
      setJsonError(validation.error || 'JSON inválido ou incompatível com o contrato Zod.');
    }
  };

  const handleUseOffline = () => {
    playTactileClick();
    const offlineData = geminiEngine.getOfflineFallback(node.id);
    startExamWithAssessment(offlineData, true);
  };

  const startExamWithAssessment = (data: LessonAndAssessmentResponse, offline: boolean) => {
    setAssessment(data);
    setIsOfflineFallback(offline);
    setModalStage('exam');
    onAssessmentLoaded?.(data);

    const limit = data.rubric_criteria.time_threshold_seconds || 90;
    setSecondsRemaining(limit);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleInputChange = (varName: string, val: string) => {
    setUserAnswers((prev) => ({ ...prev, [varName]: val }));
  };

  const handleSubmitAnswers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessment || evalResult) return;
    playTactileClick();

    if (timerRef.current) clearInterval(timerRef.current);

    const limit = assessment.rubric_criteria.time_threshold_seconds || 90;
    const timeSpent = limit - secondsRemaining;

    const result = evaluateSubmission(
      assessment.interactive_exercise.expected_variables,
      assessment.interactive_exercise.diagnostic_traps,
      userAnswers
    );

    setEvalResult(result);

    await recordExerciseAttempt({
      nodeId: node.id,
      subModuleId: activeSubModule?.id,
      scoreKnowledge: result.score,
      score3D: result.score3D,
      timeSpentSeconds: timeSpent,
      timeLimitSeconds: limit,
      userAnswer: JSON.stringify(userAnswers),
      isCorrect: result.isCorrect,
      diagnosticLogged: result.matchedTrap?.feedback,
    });

    if (result.isCorrect) {
      const hasCelebration = Boolean(useAppStore.getState().activeCelebration);
      if (!hasCelebration) {
        playCorrectChime();
      }
    } else {
      playGentleError();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none animate-in fade-in duration-200"
    >
      <div className="w-full max-w-2xl bg-[#0d1017] border border-white/[0.12] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Top Header */}
        <header className="px-5 py-3.5 bg-[#080a0f] border-b border-white/[0.08] flex items-center justify-between font-mono">
          <div className="flex items-center gap-2.5">
            {mode === 'expand_submodule' ? (
              <div className="p-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>
            ) : (
              <div className="p-1 rounded-md bg-amber-500/10 border border-amber-500/20">
                <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>
            )}

            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                {mode === 'expand_submodule'
                  ? 'Expansão de Submódulo • Gemini'
                  : modalStage === 'bridge'
                  ? 'Bridge Gemini • Conexão Google'
                  : 'Execução de Prova de Estresse'}
              </h2>
            </div>

            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold">
              {node.id}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {modalStage === 'exam' && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11px] border ${
                  secondsRemaining <= 15
                    ? 'border-rose-500/40 text-rose-400 bg-rose-950/30 animate-pulse'
                    : 'border-white/[0.08] text-slate-300 bg-[#121622]'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{secondsRemaining}s</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Fechar janela"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-100 select-text">
          {modalStage === 'bridge' ? (
            /* ============================================================
               ETAPA 1: FLUXO DE CÓPIA PARA GEMINI WEB & RETORNO DO JSON
               ============================================================ */
            <div className="space-y-5">
              {/* Context Summary */}
              <div className="p-4 rounded-xl bg-[#0a0d14] border border-white/[0.08] text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span className="text-slate-400">TÓPICO SELECIONADO:</span>
                  <span className="text-sky-400 font-semibold">
                    TIER {node.tier} // {node.category}
                  </span>
                </div>
                <h3 className="text-white font-bold text-sm">{node.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-sans pt-1">
                  O prompt abaixo compila sua telemetria determinística com instruções explícitas para o Gemini retornar exclusivamente o objeto JSON validado pelo contrato Zod.
                </p>
              </div>

              {/* Step 1: Copy Prompt & Open Gemini */}
              <div className="p-5 rounded-xl bg-[#0e121a] border-l-4 border-sky-500/80 border border-white/[0.08] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white font-bold flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-500 text-black flex items-center justify-center text-[11px] font-bold">
                      1
                    </span>
                    <span>Copie o prompt e acesse o Gemini</span>
                  </span>

                  {copiedPrompt && (
                    <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Copiado!
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    onClick={handleCopyPrompt}
                    className="tactile-btn tactile-btn-sky px-4 py-2 text-xs flex items-center gap-2"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Prompt de Contexto Zero</span>
                  </button>

                  <a
                    href="https://gemini.google.com/app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tactile-btn tactile-btn-neutral px-4 py-2 text-xs flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                    <span>Abrir Gemini (Google) ↗</span>
                  </a>
                </div>

                <p className="text-[11px] text-slate-400 font-sans">
                  Cole no chat do Gemini autenticado na sua conta Google. Ele gerará estritamente o payload da prova.
                </p>
              </div>

              {/* Step 2: Paste Return JSON */}
              <div className="p-5 rounded-xl bg-[#0e121a] border-l-4 border-amber-500/80 border border-white/[0.08] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white font-bold flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center text-[11px] font-bold">
                      2
                    </span>
                    <span>Cole a resposta JSON retornada</span>
                  </span>

                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] text-[11px] font-mono transition-colors cursor-pointer"
                  >
                    <ClipboardPaste className="w-3 h-3 text-sky-400" />
                    <span>Colar do Clipboard</span>
                  </button>
                </div>

                {/* Ergonomic Monospace Textarea */}
                <textarea
                  value={pastedJson}
                  onChange={(e) => setPastedJson(e.target.value)}
                  placeholder={`Cole aqui o JSON gerado pelo Gemini...\n{\n  "session_id": "...",\n  "topic": { ... },\n  "interactive_exercise": { ... }\n}`}
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl bg-[#07090e] border border-white/10 text-slate-200 font-mono-code text-xs placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 outline-none resize-none leading-relaxed transition-all"
                  spellCheck="false"
                />

                {jsonError && (
                  <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{jsonError}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleUseOffline}
                    className="text-xs text-slate-400 hover:text-slate-200 underline text-left font-sans cursor-pointer"
                  >
                    Ou usar avaliação offline instantânea →
                  </button>

                  <button
                    type="button"
                    onClick={() => handleValidateJson()}
                    disabled={!pastedJson.trim()}
                    className="tactile-btn tactile-btn-amber px-5 py-2 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>Validar & Iniciar Prova</span>
                  </button>
                </div>
              </div>
            </div>
          ) : assessment ? (
            /* ============================================================
               ETAPA 2: RESOLUÇÃO DA PROVA DE ESTRESSE & FEEDBACK DIAGNÓSTICO
               ============================================================ */
            <div className="space-y-5">
              {/* Topic Banner */}
              <div className="rounded-xl border border-white/[0.08] bg-[#0a0d14] p-4 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold font-mono text-sky-400 uppercase tracking-wider">
                    {assessment.topic.title}
                  </h3>

                  {isOfflineFallback ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25">
                      MODO OFFLINE
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
                      GEMINI VALIDADO
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {assessment.topic.graphic_application}
                </p>
              </div>

              {/* KaTeX Problem Statement */}
              <div className="p-5 rounded-xl bg-[#0c0f17] border-l-4 border-amber-500/80 border border-white/[0.08] space-y-2 shadow-xs">
                <span className="text-[11px] font-mono uppercase text-amber-400/90 block font-bold tracking-wider">
                  Enunciado Matemático Formal:
                </span>
                <div className="py-1 text-slate-100 font-sans overflow-x-auto">
                  <MathRenderer latex={assessment.interactive_exercise.statement_latex} />
                </div>
              </div>

              {/* Answer Inputs Form */}
              <form onSubmit={handleSubmitAnswers} className="space-y-4">
                <span className="text-xs font-mono text-slate-400 uppercase font-semibold block tracking-wider">
                  Variáveis Requeridas para Resolução:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {Object.keys(assessment.interactive_exercise.expected_variables).map((varKey) => (
                    <div key={varKey} className="space-y-1.5">
                      <label className="text-xs text-sky-300 font-mono font-bold block">
                        {varKey} =
                      </label>
                      <input
                        type="text"
                        value={userAnswers[varKey] || ''}
                        onChange={(e) => handleInputChange(varKey, e.target.value)}
                        disabled={!!evalResult || isTimeUp}
                        placeholder={`Insira o valor de ${varKey}...`}
                        className="w-full px-3.5 py-2 rounded-xl bg-[#07090e] border border-white/10 text-sm font-mono-code text-slate-100 placeholder:text-slate-600 focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all disabled:opacity-60"
                        autoComplete="off"
                        spellCheck="false"
                      />
                    </div>
                  ))}
                </div>

                {!evalResult && (
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isTimeUp}
                      className="tactile-btn tactile-btn-sky px-5 py-2.5 text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      <span>Submeter para Diagnóstico FSRS</span>
                    </button>
                  </div>
                )}
              </form>

              {/* Time Up Alert */}
              {isTimeUp && !evalResult && (
                <div className="p-4 rounded-xl bg-rose-950/25 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2.5 shadow-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    Tempo limite esgotado. O motor determinístico registrou penalidade de latência temporal.
                  </span>
                </div>
              )}

              {/* Evaluation Feedback */}
              {evalResult && (
                <div
                  className={`p-5 rounded-xl border text-xs sm:text-sm space-y-3 shadow-md ${
                    evalResult.isCorrect
                      ? 'bg-emerald-950/25 border-emerald-500/35 text-emerald-200'
                      : 'bg-rose-950/25 border-rose-500/35 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold font-mono text-sm">
                    {evalResult.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>
                      {evalResult.isCorrect ? 'APROVADO NA PROVA DE ESTRESSE' : 'DIAGNÓSTICO DE FALHA CONCEITUAL'}
                    </span>
                  </div>

                  <p className="text-slate-200 leading-relaxed font-sans">
                    {evalResult.feedbackMessage}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10 font-mono text-xs text-slate-300">
                    <span>
                      NOTA DE CONHECIMENTO:{' '}
                      <strong className="text-white font-bold">{evalResult.score}/90</strong>
                    </span>
                    <span>
                      SCORE 3D:{' '}
                      <strong className="text-amber-400 font-bold">{evalResult.score3D}/10</strong>
                    </span>
                  </div>

                  {evalResult.isCorrect && onOpenSandbox && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          onClose();
                          onOpenSandbox();
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-sky-300 hover:text-white underline font-semibold transition-colors cursor-pointer"
                      >
                        <span>Abrir Shader Sandbox para validar a mecânica em tempo real</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : modalStage === 'submodule_created' && createdSubModule ? (
            /* ============================================================
               ETAPA 3: CONFIRMAÇÃO DE SUBMÓDULO CRIADO COM SUCESSO
               ============================================================ */
            <div className="space-y-5">
              <div className="p-6 rounded-2xl bg-[#0e121a] border border-amber-500/30 text-center space-y-4 shadow-lg">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-mono text-amber-400 uppercase font-bold tracking-wider">
                    Novo Submódulo Integrado
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    {createdSubModule.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 font-sans max-w-lg mx-auto leading-relaxed pt-1">
                    {createdSubModule.mathFoundation}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto font-mono text-xs pt-1">
                  <div className="p-2.5 rounded-lg bg-[#121622] border border-white/[0.06]">
                    <span className="text-slate-400 text-[10px] block">ORDEM</span>
                    <span className="text-sky-400 font-bold">Submódulo {createdSubModule.order}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#121622] border border-white/[0.06]">
                    <span className="text-slate-400 text-[10px] block">PESO ESPACIAL 3D</span>
                    <span className="text-amber-400 font-bold">
                      {Math.round(createdSubModule.threeDApplicabilityWeight * 100)}% 3D
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="tactile-btn tactile-btn-sky px-5 py-2.5 text-xs flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <span>Estudar Novo Submódulo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {assessment && (
                    <button
                      type="button"
                      onClick={() => startExamWithAssessment(assessment, false)}
                      className="tactile-btn tactile-btn-neutral px-5 py-2.5 text-xs flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>Fazer Prova Deste Submódulo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
