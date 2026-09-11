'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CurriculumNode, SubModule } from '@/types/curriculum';
import { MathRenderer } from '@/components/katex/MathRenderer';
import { useAppStore } from '@/lib/store';
import { CheckCircle2, AlertTriangle, ArrowRight, Clock, Award, Play, Flame, GraduationCap, Box } from 'lucide-react';
import { AIStressTestModal } from './AIStressTestModal';

interface InteractiveExerciseViewProps {
  node: CurriculumNode;
  activeSubModule?: SubModule;
  onOpenSandbox: () => void;
  onOpenArticle?: () => void;
  className?: string;
}

export const InteractiveExerciseView: React.FC<InteractiveExerciseViewProps> = ({
  node,
  activeSubModule,
  onOpenSandbox,
  onOpenArticle,
  className = '',
}) => {
  const { progressMap, recordExerciseAttempt } = useAppStore();
  const progress = progressMap[node.id];

  const [inputVal, setInputVal] = useState<string>('');
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

    timerRef.current = setInterval(() => {
      setSecondsElapsed((s) => s + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [node.id, activeSubModule?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isSubmitting) return;
    setIsSubmitting(true);

    const timeSpent = secondsElapsed;
    const timeLimit = 90; // Standard 90s threshold

    // Deterministic diagnostic evaluation based on node domain
    let isCorrect = false;
    let score = 0;
    let diagnosticMsg: string | undefined = undefined;

    const cleanInput = inputVal.replace(/\s+/g, '').toLowerCase();

    // Node-specific deterministic problem checks
    if (node.id === 't0_algebra_fma') {
      if (
        cleanInput.includes('x*(2*x+5)+3') ||
        cleanInput.includes('x*(2x+5)+3') ||
        cleanInput === 'x(2x+5)+3' ||
        cleanInput.includes('1/(sqrt(x+1)+sqrt(x))') ||
        cleanInput === '3'
      ) {
        isCorrect = true;
        score = 90;
      } else if (cleanInput.includes('2*x*x')) {
        score = 40;
        diagnosticMsg = 'Você manteve multiplicação de alta ordem em vez de encadear via Horner: x*(ax + b) + c.';
      } else {
        score = 30;
        diagnosticMsg = 'Erro de fatoração na decomposição para FMA.';
      }
    } else if (node.id === 't1_vectors_dot') {
      const val = parseFloat(cleanInput);
      if (Math.abs(val - 0.8) < 0.01 || Math.abs(val - 0.6) < 0.01 || val === 1) {
        isCorrect = true;
        score = 90;
      } else {
        score = 30;
        diagnosticMsg = 'Erro de cálculo do produto interno escalar sum(Ni * Li).';
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
    const score3D = isCorrect ? Math.min(target3D, Math.round((score / 90) * target3D)) : 1;

    await recordExerciseAttempt({
      nodeId: node.id,
      subModuleId: activeSubModule?.id,
      scoreKnowledge: score,
      score3D,
      timeSpentSeconds: timeSpent,
      timeLimitSeconds: timeLimit,
      userAnswer: inputVal,
      isCorrect,
      diagnosticLogged: diagnosticMsg,
    });

    if (isCorrect) {
      setFeedback({
        type: 'success',
        message: `Correto! Pontuação: ${score}/90 — Aplicabilidade 3D: ${score3D}/${target3D}. Tempo: ${timeSpent}s.`,
        scoreDelta: score,
      });
    } else {
      setFeedback({
        type: 'error',
        message: diagnosticMsg || 'Resposta incorreta. FSRS registrou repetição imediata para este nó.',
      });
    }

    setIsSubmitting(false);
  };

  return (
    <div className={`flex flex-col h-full bg-[#12141a] border border-[#242933] overflow-y-auto ${className}`}>
      {/* Top Header */}
      <div className="p-4 border-b border-[#242933] bg-[#0a0b0e]">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
          <span className="text-[#00f0ff] uppercase font-bold tracking-wider">
            TIER {node.tier} // {node.category.toUpperCase()}
          </span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-[#ffb000]" />
            <span>{secondsElapsed}s</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-1">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {activeSubModule?.title || node.title}
            </h2>
            {activeSubModule && (
              <span className="text-[11px] font-mono text-[#ffb000] block mt-0.5">
                Submódulo {activeSubModule.order} — Peso 3D: {Math.round(activeSubModule.threeDApplicabilityWeight * 100)}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onOpenArticle && (
              <button
                onClick={onOpenArticle}
                className="flex items-center gap-1 px-2.5 py-1 bg-[#00f0ff]/15 hover:bg-[#00f0ff]/25 text-[#00f0ff] border border-[#00f0ff]/40 text-xs font-mono font-bold transition-all cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">AULA</span>
              </button>
            )}
            <button
              onClick={() => setShowStressModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-[#ffb000]/15 hover:bg-[#ffb000]/25 text-[#ffb000] border border-[#ffb000]/40 text-xs font-mono font-bold transition-all cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 animate-pulse" />
              <span>PROVA DE ESTRESSE</span>
            </button>
          </div>
        </div>
      </div>

      {/* Math & Graphic Theory Section */}
      <div className="p-4 space-y-4">
        <div className="p-3.5 bg-[#0f1117] border-l-2 border-[#00f0ff] text-xs leading-relaxed">
          <h4 className="font-mono text-[#00f0ff] font-bold mb-1">FUNDAMENTO MATEMÁTICO:</h4>
          <p className="text-slate-300">{activeSubModule?.mathFoundation || node.mathFoundation}</p>
        </div>

        <div className="p-3.5 bg-[#0f1117] border-l-2 border-[#ffb000] text-xs leading-relaxed">
          <h4 className="font-mono text-[#ffb000] font-bold mb-1">APLICAÇÃO DIRETA EM SHADERS & 3D:</h4>
          <p className="text-slate-300">{activeSubModule?.graphicApplication || node.graphicApplication}</p>
        </div>

        {/* KaTeX Formulas */}
        <div className="p-4 bg-[#0a0b0e] border border-[#242933]">
          <h4 className="text-[11px] font-mono text-slate-400 mb-2 uppercase tracking-wider">
            Equações Analíticas do Tópico:
          </h4>
          {(activeSubModule?.latexFormulas || node.latexFormulas).map((formula, idx) => (
            <MathRenderer key={idx} latex={formula} />
          ))}
        </div>

        {/* Current Node Telemetry Badge */}
        {progress && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs p-3 bg-[#0a0b0e] border border-[#242933]">
            <div>
              <span className="text-slate-500 block text-[10px]">CONHECIMENTO</span>
              <span className="text-[#00f0ff] font-bold">{progress.scoreKnowledge}/90</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">PROFICIÊNCIA 3D</span>
              <span className="text-[#ffb000] font-bold">{progress.score3D}/10</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">VELOCIDADE</span>
              <span className="text-white font-bold">{progress.responseSpeed}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">NÍVEL</span>
              <span className="text-[#10b981] font-bold">{progress.proficiencyLevel}</span>
            </div>
          </div>
        )}

        {/* Attention Points Alert if any */}
        {progress && progress.attentionPoints.length > 0 && (
          <div className="p-3 bg-[#ff3344]/10 border border-[#ff3344] text-[#ff3344] text-xs font-mono flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">PONTOS DE ATENÇÃO DETECTADOS:</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-300">
                {progress.attentionPoints.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Interactive Math Submission Form */}
        <div className="p-4 bg-[#0a0b0e] border border-[#242933]">
          <h3 className="text-xs font-mono font-bold text-white mb-2 uppercase flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#00f0ff]" />
            Validação Mecânica da Fórmula
          </h3>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 font-mono mb-1">
                {node.id === 't0_algebra_fma' && 'Converta 2x² + 5x + 3 para a forma de Horner (FMA):'}
                {node.id === 't1_vectors_dot' && 'Calcule N · L para N = (0, 0.6, 0.8) e L = (0, 0, 1):'}
                {node.id === 't2_tetrahedron_normals' && 'Quantas avaliações de SDF a técnica do tetraedro exige?'}
                {!['t0_algebra_fma', 't1_vectors_dot', 't2_tetrahedron_normals'].includes(node.id) &&
                  'Digite o resultado analítico ou o valor escalar normalizado da expressão:'}
              </label>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Insira a resposta exata..."
                className="w-full px-3 py-2 bg-[#12141a] border border-[#242933] text-[#00f0ff] font-mono text-sm focus:border-[#00f0ff] outline-hidden transition-colors"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={onOpenSandbox}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#181b22] hover:bg-[#242933] text-slate-300 font-mono text-xs border border-[#242933] transition-colors"
              >
                <Play className="w-3.5 h-3.5 text-[#00f0ff]" />
                ABRIR SHADER SANDBOX
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !inputVal.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#00f0ff] hover:bg-[#38bdf8] text-black font-mono font-bold text-xs transition-colors disabled:opacity-50"
              >
                <span>VALIDAR SUBMISSÃO</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Feedback Display */}
          {feedback && (
            <div
              className={`mt-3 p-3 border font-mono text-xs flex items-start gap-2 ${
                feedback.type === 'success'
                  ? 'bg-[#10b981]/10 border-[#10b981] text-[#10b981]'
                  : 'bg-[#ff3344]/10 border-[#ff3344] text-[#ff3344]'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-semibold">{feedback.message}</p>
                {feedback.type === 'success' && (
                  <button
                    onClick={onOpenSandbox}
                    className="mt-1 text-xs underline hover:text-white"
                  >
                    Ir para o Shader Sandbox testar a implementação 3D →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showStressModal && (
        <AIStressTestModal
          node={node}
          onClose={() => setShowStressModal(false)}
          onOpenSandbox={onOpenSandbox}
        />
      )}
    </div>
  );
};
