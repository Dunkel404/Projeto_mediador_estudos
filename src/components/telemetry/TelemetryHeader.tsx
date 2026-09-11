'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Activity, Cpu, ShieldAlert, Sparkles, ExternalLink, CheckCircle2, ShieldCheck, Maximize2 } from 'lucide-react';

interface TelemetryHeaderProps {
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export const TelemetryHeader: React.FC<TelemetryHeaderProps> = ({
  isFocusMode = false,
  onToggleFocusMode,
}) => {
  const { progressMap } = useAppStore();
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  const totalNodes = Object.keys(progressMap).length || 18;
  const masteredCount = Object.values(progressMap).filter((p) => p.status === 'mastered').length;
  const decayCount = Object.values(progressMap).filter((p) => p.status === 'critical_decay').length;

  const scores = Object.values(progressMap).map((p) => p.scoreKnowledge);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return (
    <header className="w-full bg-[#0a0b0e] border-b border-[#242933] px-4 py-2.5 flex items-center justify-between z-40">
      {/* Title & Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]" />
          <h1 className="font-mono text-sm font-bold text-white tracking-widest uppercase">
            SHADER<span className="text-[#00f0ff]">MATH</span> // PROFILER
          </h1>
        </div>
        <span className="hidden md:inline text-[10px] font-mono px-2 py-0.5 bg-[#12141a] border border-[#242933] text-slate-400">
          VULKAN LOW-LEVEL PIPELINE
        </span>
      </div>

      {/* Real-time Telemetry Indicators */}
      <div className="flex items-center gap-4 text-xs font-mono">
        <div className="hidden sm:flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span className="text-slate-400">CONHECIMENTO MÉDIO:</span>
          <span className="text-[#00f0ff] font-bold">{avgScore}/90</span>
        </div>

        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-[#ffb000]" />
          <span className="text-slate-400 hidden sm:inline">DOMÍNIO:</span>
          <span className="text-[#ffb000] font-bold">
            {masteredCount}/{totalNodes}
          </span>
        </div>

        {decayCount > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#ff3344]/15 border border-[#ff3344] text-[#ff3344] text-[11px] animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{decayCount} DECAIMENTO FSRS</span>
          </div>
        )}

        {/* Focus Mode Toggle */}
        {onToggleFocusMode && (
          <button
            onClick={onToggleFocusMode}
            className={`flex items-center gap-1.5 px-2.5 py-1 border text-[11px] transition-colors cursor-pointer ${
              isFocusMode
                ? 'border-[#ffb000] text-[#ffb000] bg-[#ffb000]/15'
                : 'border-[#242933] text-slate-300 hover:text-white bg-[#12141a] hover:bg-[#181b22]'
            }`}
            title={isFocusMode ? 'Desativar Modo Foco (Expandir Grafo 2D)' : 'Ativar Modo Foco (Trilha compacta)'}
          >
            <Maximize2 className="w-3.5 h-3.5 text-[#ffb000]" />
            <span className="hidden md:inline">
              {isFocusMode ? 'MODO FOCO: ATIVO' : 'MODO FOCO'}
            </span>
          </button>
        )}

        {/* Gemini Web Bridge Status Button */}
        <button
          onClick={() => setShowGuideModal(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 border border-[#00f0ff]/40 text-[#00f0ff] bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[11px] transition-colors cursor-pointer"
          title="Ver fluxo de conexão com o Gemini via Conta Google"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">GEMINI: CONTA GOOGLE</span>
        </button>
      </div>

      {/* Gemini Google Account Bridge Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#12141a] border border-[#242933] p-5 shadow-2xl font-mono">
            <div className="flex items-center justify-between mb-3 border-b border-[#242933] pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00f0ff]" />
                FLUXO GEMINI (CONTA GOOGLE)
              </h3>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed font-sans">
              Você utiliza o <strong className="text-[#00f0ff]">Google Gemini oficial</strong> logado gratuitamente com a sua própria conta Google, sem precisar pagar por chaves de API nem configurar credenciais em nuvem.
            </p>

            <div className="space-y-2.5 text-xs bg-[#0a0b0e] p-3.5 border border-[#242933]">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#00f0ff] text-black font-bold flex items-center justify-center text-[10px] shrink-0">
                  1
                </span>
                <p className="text-slate-300">
                  Ao abrir um nó, clique em <strong className="text-white">PROVA DE ESTRESSE CIRÚRGICA</strong>. O PWA compila o prompt de telemetria de Contexto Zero.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#00f0ff] text-black font-bold flex items-center justify-center text-[10px] shrink-0">
                  2
                </span>
                <p className="text-slate-300">
                  Clique em <strong className="text-white">COPIAR PROMPT</strong> e depois em <strong className="text-white">ABRIR GEMINI</strong> (onde você já está logado na sua conta Google).
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#00f0ff] text-black font-bold flex items-center justify-center text-[10px] shrink-0">
                  3
                </span>
                <p className="text-slate-300">
                  O prompt força o Gemini a retornar <strong className="text-[#ffb000]">única e exclusivamente o JSON</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-[#10b981] text-black font-bold flex items-center justify-center text-[10px] shrink-0">
                  4
                </span>
                <p className="text-slate-300">
                  Copie a resposta do Gemini, volte ao projeto e clique em <strong className="text-white">COLAR DO CLIPBOARD</strong>. A prova inicia instantaneamente!
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <a
                href="https://gemini.google.com/app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#00f0ff] hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                gemini.google.com ↗
              </a>

              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-1.5 bg-[#00f0ff] hover:bg-[#38bdf8] text-black font-bold text-xs transition-colors"
              >
                ENTENDIDO
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
