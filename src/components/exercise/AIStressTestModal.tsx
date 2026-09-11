'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CurriculumNode } from '@/types/curriculum';
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
  FileCode,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface AIStressTestModalProps {
  node: CurriculumNode;
  onClose: () => void;
  onOpenSandbox?: () => void;
}

export const AIStressTestModal: React.FC<AIStressTestModalProps> = ({
  node,
  onClose,
  onOpenSandbox,
}) => {
  const { progressMap, fsrsMap, recordExerciseAttempt } = useAppStore();
  const progress = progressMap[node.id];
  const card = fsrsMap[node.id];

  // Workflow State: 'bridge' (Copy/Paste JSON) vs 'exam' (Solving problem)
  const [modalStage, setModalStage] = useState<'bridge' | 'exam'>('bridge');
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

  const compiledPrompt = geminiEngine.buildZeroContextPrompt(promptPayload);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(compiledPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 3000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setPastedJson(text);
        handleValidateJson(text);
      }
    } catch (err) {
      console.warn('Clipboard read error or not permitted:', err);
    }
  };

  const handleValidateJson = (textToValidate?: string) => {
    const raw = textToValidate !== undefined ? textToValidate : pastedJson;
    setJsonError(null);

    const validation = geminiEngine.parseAndValidateGeminiResponse(raw);
    if (validation.success && validation.data) {
      startExamWithAssessment(validation.data, false);
    } else {
      setJsonError(validation.error || 'JSON inválido ou fora do schema estrito.');
    }
  };

  const handleUseOffline = () => {
    const offlineData = geminiEngine.getOfflineFallback(node.id);
    startExamWithAssessment(offlineData, true);
  };

  const startExamWithAssessment = (data: LessonAndAssessmentResponse, offline: boolean) => {
    setAssessment(data);
    setIsOfflineFallback(offline);
    setModalStage('exam');

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
      scoreKnowledge: result.score,
      score3D: result.score3D,
      timeSpentSeconds: timeSpent,
      timeLimitSeconds: limit,
      userAnswer: JSON.stringify(userAnswers),
      isCorrect: result.isCorrect,
      diagnosticLogged: result.matchedTrap?.feedback,
    });
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-[#12141a] border border-[#242933] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-[#0a0b0e] border-b border-[#242933] flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#ffb000] animate-pulse" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              {modalStage === 'bridge'
                ? 'BRIDGE GEMINI // CONEXÃO VIA CONTA GOOGLE'
                : 'EXECUÇÃO DE PROVA DE ESTRESSE'}
            </h3>
            <span className="text-[10px] px-1.5 py-0.5 bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
              {node.id}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {modalStage === 'exam' && (
              <div
                className={`flex items-center gap-1.5 px-2 py-0.5 border ${
                  secondsRemaining <= 15
                    ? 'border-[#ff3344] text-[#ff3344] bg-[#ff3344]/10 animate-bounce'
                    : 'border-[#242933] text-slate-300 bg-[#181b22]'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-[#ffb000]" />
                <span>{secondsRemaining}s</span>
              </div>
            )}

            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {modalStage === 'bridge' ? (
            /* ============================================================
               ETAPA 1: FLUXO DE CÓPIA PARA GEMINI WEB & RETORNO DO JSON
               ============================================================ */
            <div className="space-y-5 font-mono">
              {/* Context Summary */}
              <div className="p-3.5 bg-[#0a0b0e] border border-[#242933] text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-400">TÓPICO ATUAL:</span>
                  <span className="text-[#00f0ff] font-bold">TIER {node.tier} // {node.category}</span>
                </div>
                <h4 className="text-white font-bold text-sm mb-1">{node.title}</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  O prompt abaixo compila sua telemetria determinística com a instrução explícita para o Gemini retornar exclusivamente o objeto JSON necessário.
                </p>
              </div>

              {/* Step 1: Copy Prompt & Open Gemini */}
              <div className="p-4 bg-[#0f1117] border-l-2 border-[#00f0ff] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white font-bold flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#00f0ff] text-black flex items-center justify-center text-[10px] font-bold">
                      1
                    </span>
                    COPIE O PROMPT & ABRA O GEMINI NA SUA CONTA GOOGLE
                  </span>
                  {copiedPrompt && (
                    <span className="text-[10px] text-[#10b981] flex items-center gap-1">
                      <Check className="w-3 h-3" /> Copiado!
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#00f0ff] hover:bg-[#38bdf8] text-black font-bold text-xs transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    COPIAR PROMPT DE CONTEXTO ZERO
                  </button>

                  <a
                    href="https://gemini.google.com/app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#181b22] hover:bg-[#242933] text-white border border-[#242933] text-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#ffb000]" />
                    ABRIR GEMINI (CONTA GOOGLE) ↗
                  </a>
                </div>

                <p className="text-[10px] text-slate-500">
                  Ao colar no Gemini logado na sua conta Google gratuita, ele gerará exclusivamente o JSON da prova.
                </p>
              </div>

              {/* Step 2: Paste Return JSON */}
              <div className="p-4 bg-[#0f1117] border-l-2 border-[#ffb000] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white font-bold flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#ffb000] text-black flex items-center justify-center text-[10px] font-bold">
                      2
                    </span>
                    COLE A RESPOSTA JSON RETORNADA PELO GEMINI
                  </span>

                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#181b22] hover:text-white border border-[#242933] text-[10px] text-slate-300"
                  >
                    <ClipboardPaste className="w-3 h-3 text-[#00f0ff]" />
                    COLAR DO CLIPBOARD
                  </button>
                </div>

                <textarea
                  value={pastedJson}
                  onChange={(e) => setPastedJson(e.target.value)}
                  placeholder={`Cole aqui o JSON gerado pelo Gemini...\n{\n  "session_id": "...",\n  "topic": { ... },\n  "interactive_exercise": { ... }\n}`}
                  rows={6}
                  className="w-full px-3 py-2 bg-[#0a0b0e] border border-[#242933] text-xs text-[#00f0ff] font-mono outline-hidden focus:border-[#00f0ff] resize-none leading-relaxed"
                />

                {jsonError && (
                  <div className="p-2.5 bg-[#ff3344]/10 border border-[#ff3344] text-[#ff3344] text-xs flex items-start gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{jsonError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleUseOffline}
                    className="text-[11px] text-slate-400 hover:text-white underline"
                  >
                    Ou usar avaliação offline instantânea →
                  </button>

                  <button
                    type="button"
                    onClick={() => handleValidateJson()}
                    disabled={!pastedJson.trim()}
                    className="flex items-center gap-1.5 px-5 py-2 bg-[#ffb000] hover:bg-[#e2b340] text-black font-bold text-xs transition-colors disabled:opacity-40"
                  >
                    <Zap className="w-3.5 h-3.5 fill-black" />
                    VALIDAR & INICIAR PROVA
                  </button>
                </div>
              </div>
            </div>
          ) : assessment ? (
            /* ============================================================
               ETAPA 2: RESOLUÇÃO DA PROVA DE ESTRESSE & FEEDBACK DIAGNÓSTICO
               ============================================================ */
            <div className="space-y-4 font-mono">
              {/* Topic Banner */}
              <div className="border border-[#242933] bg-[#0a0b0e] p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#00f0ff] uppercase">
                    {assessment.topic.title}
                  </h4>
                  {isOfflineFallback ? (
                    <span className="text-[10px] px-1.5 py-0.5 bg-[#181b22] text-[#ffb000] border border-[#242933]">
                      MODO OFFLINE
                    </span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/40">
                      GEMINI VALIDADO
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {assessment.topic.graphic_application}
                </p>
              </div>

              {/* KaTeX Problem Statement */}
              <div className="p-4 bg-[#0f1117] border-l-2 border-[#ffb000]">
                <span className="text-[10px] uppercase text-slate-400 block mb-2 font-bold">
                  ENUNCIADO MATEMÁTICO FORMAL:
                </span>
                <MathRenderer latex={assessment.interactive_exercise.statement_latex} />
              </div>

              {/* Answer Inputs Form */}
              <form onSubmit={handleSubmitAnswers} className="space-y-3">
                <span className="text-[11px] text-slate-400 uppercase font-bold block">
                  VARIÁVEIS REQUERIDAS:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.keys(assessment.interactive_exercise.expected_variables).map((varKey) => (
                    <div key={varKey} className="space-y-1">
                      <label className="text-xs text-[#00f0ff] font-bold block">
                        {varKey} =
                      </label>
                      <input
                        type="text"
                        value={userAnswers[varKey] || ''}
                        onChange={(e) => handleInputChange(varKey, e.target.value)}
                        disabled={!!evalResult || isTimeUp}
                        placeholder={`Insira valor de ${varKey}...`}
                        className="w-full px-3 py-2 bg-[#0a0b0e] border border-[#242933] text-sm text-white focus:border-[#00f0ff] outline-hidden"
                      />
                    </div>
                  ))}
                </div>

                {!evalResult && (
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isTimeUp}
                      className="flex items-center gap-1.5 px-5 py-2 bg-[#00f0ff] hover:bg-[#38bdf8] text-black font-bold text-xs transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5 fill-black" />
                      SUBMETER PARA DIAGNÓSTICO
                    </button>
                  </div>
                )}
              </form>

              {/* Time Up Alert */}
              {isTimeUp && !evalResult && (
                <div className="p-3 bg-[#ff3344]/15 border border-[#ff3344] text-[#ff3344] text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>TEMPO ESGOTADO! O motor determinístico registrou penalidade de velocidade.</span>
                </div>
              )}

              {/* Evaluation Feedback */}
              {evalResult && (
                <div
                  className={`p-4 border text-xs space-y-2 ${
                    evalResult.isCorrect
                      ? 'bg-[#10b981]/10 border-[#10b981] text-[#10b981]'
                      : 'bg-[#ff3344]/10 border-[#ff3344] text-[#ff3344]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {evalResult.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                    <span>{evalResult.isCorrect ? 'APROVADO NA PROVA' : 'DIAGNÓSTICO DE FALHA'}</span>
                  </div>

                  <p className="text-slate-200 leading-relaxed font-sans">
                    {evalResult.feedbackMessage}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#242933] text-slate-400">
                    <span>NOTA OBTIDA: {evalResult.score}/90</span>
                    <span>3D SCORE: {evalResult.score3D}/10</span>
                  </div>

                  {evalResult.isCorrect && onOpenSandbox && (
                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => {
                          onClose();
                          onOpenSandbox();
                        }}
                        className="flex items-center gap-1 text-xs text-[#00f0ff] hover:underline"
                      >
                        Abrir Shader Sandbox para validar em tempo real →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
