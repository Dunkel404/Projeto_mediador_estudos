'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CurriculumNode } from '@/types/curriculum';
import { useAppStore } from '@/lib/store';
import { geminiEngine } from '@/core/ai/gemini-engine';
import { evaluateSubmission, EvaluationResult } from '@/core/ai/evaluator';
import { LessonAndAssessmentResponse } from '@/types/ai-contract';
import { MathRenderer } from '@/components/katex/MathRenderer';
import { Flame, Clock, CheckCircle2, AlertTriangle, X, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

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
  const { progressMap, fsrsMap, apiKey, recordExerciseAttempt } = useAppStore();
  const progress = progressMap[node.id];
  const card = fsrsMap[node.id];

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [assessment, setAssessment] = useState<LessonAndAssessmentResponse | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(90);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    geminiEngine.setApiKey(apiKey);

    const loadAssessment = async () => {
      setIsLoading(true);

      const triggerMode =
        (progress?.scoreKnowledge ?? 0) >= 88
          ? 'SHADER_CHALLENGE_90'
          : (progress?.scoreKnowledge ?? 0) >= 80
          ? 'STRESS_TEST_85'
          : (progress?.scoreKnowledge ?? 0) >= 50
          ? 'DEEP_DIVE_50'
          : 'NORMAL';

      const payload = {
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

      const res = await geminiEngine.generateAssessment(payload);
      setAssessment(res.data);
      setIsOfflineMode(res.isOfflineFallback);

      const limit = res.data.rubric_criteria.time_threshold_seconds || 90;
      setSecondsRemaining(limit);
      setIsLoading(false);

      // Start countdown
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

    loadAssessment();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [apiKey, card, node.id, node.title, progress]);

  const handleInputChange = (varName: string, val: string) => {
    setUserAnswers((prev) => ({ ...prev, [varName]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessment || evalResult) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const timeSpent =
      (assessment.rubric_criteria.time_threshold_seconds || 90) - secondsRemaining;
    const timeLimit = assessment.rubric_criteria.time_threshold_seconds || 90;

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
      timeLimitSeconds: timeLimit,
      userAnswer: JSON.stringify(userAnswers),
      isCorrect: result.isCorrect,
      diagnosticLogged: result.matchedTrap?.feedback,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-[#12141a] border border-[#242933] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-[#0a0b0e] border-b border-[#242933] flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#ffb000] animate-pulse" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              PROVA DE ESTRESSE // CONTEXTO ZERO
            </h3>
            {isOfflineMode ? (
              <span className="text-[10px] px-1.5 py-0.5 bg-[#181b22] text-[#00f0ff] border border-[#242933]">
                MODO OFFLINE LOCAL
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/40">
                GEMINI 2.5 REAL-TIME
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs">
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

            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center font-mono gap-3">
              <div className="w-7 h-7 border-2 border-[#00f0ff] border-t-transparent animate-spin" />
              <p className="text-xs text-[#00f0ff] tracking-widest uppercase">
                COMPILANDO TELEMETRIA DETERMINÍSTICA...
              </p>
              <span className="text-[11px] text-slate-500">
                Gerando teste de manipulação algébrica profunda.
              </span>
            </div>
          ) : assessment ? (
            <>
              {/* Problem Topic Context */}
              <div className="border border-[#242933] bg-[#0a0b0e] p-3.5 space-y-2">
                <h4 className="font-mono text-xs font-bold text-[#00f0ff] uppercase">
                  {assessment.topic.title}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {assessment.topic.graphic_application}
                </p>
              </div>

              {/* Problem Statement in KaTeX */}
              <div className="p-4 bg-[#0f1117] border-l-2 border-[#ffb000]">
                <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2 font-bold">
                  ENUNCIADO MATEMÁTICO FORMAL:
                </span>
                <MathRenderer latex={assessment.interactive_exercise.statement_latex} />
              </div>

              {/* Input Form */}
              <form onSubmit={handleSubmit} className="space-y-3 font-mono">
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
                        placeholder={`Valor de ${varKey}...`}
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
                      SUBMETER RESPOSTAS PARA DIAGNÓSTICO
                    </button>
                  </div>
                )}
              </form>

              {/* Time Up Alert */}
              {isTimeUp && !evalResult && (
                <div className="p-3 bg-[#ff3344]/15 border border-[#ff3344] text-[#ff3344] font-mono text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>TEMPO ESGOTADO! O motor FSRS registrou penalidade por lentidão.</span>
                </div>
              )}

              {/* Evaluation Feedback */}
              {evalResult && (
                <div
                  className={`p-4 border font-mono text-xs space-y-2 ${
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
                    <span>{evalResult.isCorrect ? 'APROVADO' : 'REPROVADO'}</span>
                  </div>

                  <p className="text-slate-200 leading-relaxed">
                    {evalResult.feedbackMessage}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#242933] text-slate-400">
                    <span>NOTA OBTIDA: {evalResult.score}/90</span>
                    <span>PROFICIÊNCIA 3D: {evalResult.score3D}/10</span>
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
                        Abrir no Shader Runner e verificar visualmente →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
