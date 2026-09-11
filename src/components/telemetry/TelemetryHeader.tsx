'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import {
  Activity,
  Cpu,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Flame,
  Award,
  BookOpen,
} from 'lucide-react';
import { StreakBadge } from '@/components/gamification/StreakBadge';
import { playTactileClick } from '@/lib/audio-feedback';
import { isAudioMuted, toggleAudioMuted, subscribeAudioMuteChange } from '@/lib/audio-feedback';

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
  const [muted, setMuted] = useState<boolean>(false);

  React.useEffect(() => {
    setMuted(isAudioMuted());
    const unsub = subscribeAudioMuteChange((val) => setMuted(val));
    return unsub;
  }, []);

  const totalNodes = Object.keys(progressMap).length || 18;
  const masteredCount = Object.values(progressMap).filter((p) => p.status === 'mastered').length;
  const decayCount = Object.values(progressMap).filter((p) => p.status === 'critical_decay').length;

  const scores = Object.values(progressMap).map((p) => p.scoreKnowledge);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return (
    <header className="w-full bg-[#090b10]/95 backdrop-blur-md border-b border-white/10 px-4 py-2.5 flex items-center justify-between z-40 shadow-md select-none">
      {/* Title & Brand */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20 text-white font-bold text-xs">
            SM
          </div>
          <div className="flex flex-col">
            <h1 className="font-mono text-sm font-bold text-white tracking-wider uppercase leading-none">
              SHADER<span className="text-sky-400">MATH</span>
            </h1>
            <span className="text-[9px] font-mono text-slate-400 tracking-wider">
              PIPELINE FSRS & 3D GPU
            </span>
          </div>
        </div>

        <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Vulkan / GLSL ES 3.0
        </span>
      </div>

      {/* Real-time Telemetry Indicators */}
      <div className="flex items-center gap-2 sm:gap-3 text-xs font-mono">
        {/* Average Knowledge Pill */}
        <div
          className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-slate-300"
          title="Média de proficiência matemática"
        >
          <Activity className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400 hidden md:inline">MÉDIA MATEMÁTICA:</span>
          <span className="text-sky-300 font-bold">{avgScore}/90</span>
        </div>

        {/* Mastered Count Pill */}
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-slate-300"
          title="Nós dominados no currículo"
        >
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400 hidden md:inline">DOMÍNIO:</span>
          <span className="text-emerald-300 font-bold">
            {masteredCount}/{totalNodes}
          </span>
        </div>

        {/* Streak & Focus Multiplier Badge */}
        <StreakBadge />

        {/* FSRS Decay Alert */}
        {decayCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[11px] animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>{decayCount} REVISÃO FSRS</span>
          </div>
        )}

        {/* Focus Mode Toggle */}
        {onToggleFocusMode && (
          <button
            onClick={() => {
              playTactileClick();
              onToggleFocusMode();
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[11px] transition-all cursor-pointer ${
              isFocusMode
                ? 'border-amber-500/40 text-amber-300 bg-amber-500/15 font-bold shadow-sm'
                : 'border-white/10 text-slate-300 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
            title={isFocusMode ? 'Restaurar visualização padrão' : 'Ativar Modo Foco'}
          >
            {isFocusMode ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">MODO FOCO: ON</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline">MODO FOCO</span>
              </>
            )}
          </button>
        )}

        {/* Gemini Web Bridge Status Button */}
        <button
          onClick={() => {
            playTactileClick();
            setShowGuideModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-sky-500/30 text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 text-[11px] transition-all cursor-pointer"
          title="Ver fluxo de conexão com o Gemini via Conta Google"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline font-bold">GEMINI: CONTA GOOGLE</span>
        </button>

        {/* Audio Mute/Unmute Toggle */}
        <button
          onClick={() => {
            const wasMuted = isAudioMuted();
            const next = toggleAudioMuted();
            if (wasMuted && !next) {
              playTactileClick();
            }
          }}
          className="p-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
          title={muted ? 'Ativar feedback sonoro táteis' : 'Silenciar feedback sonoro'}
        >
          {muted ? (
            <VolumeX className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-sky-400" />
          )}
        </button>
      </div>

      {/* Gemini Google Account Bridge Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#121622] border border-white/15 rounded-2xl p-6 shadow-2xl font-mono relative">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                FLUXO GEMINI (CONTA GOOGLE GRATUITA)
              </h3>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-white text-sm p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed font-sans">
              Você utiliza o <strong className="text-sky-300">Google Gemini oficial</strong> logado gratuitamente com a sua própria conta Google, sem precisar pagar por chaves de API nem configurar servidores em nuvem.
            </p>

            <div className="space-y-3 text-xs bg-[#090b10] p-4 rounded-xl border border-white/10">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-500 text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Ao abrir um nó, clique em <strong className="text-white">PROVA DE ESTRESSE CIRÚRGICA</strong>. O PWA compila o prompt de telemetria de Contexto Zero.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-500 text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Clique em <strong className="text-white">COPIAR PROMPT</strong> e depois em <strong className="text-white">ABRIR GEMINI</strong> (onde você já está logado na sua conta Google).
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-slate-300 leading-relaxed">
                  O prompt força o Gemini a retornar <strong className="text-amber-300">única e exclusivamente o JSON</strong>.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-black font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  4
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Copie a resposta do Gemini, volte ao projeto e clique em <strong className="text-white">COLAR DO CLIPBOARD</strong>. A prova inicia instantaneamente!
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-2">
              <a
                href="https://gemini.google.com/app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                gemini.google.com ↗
              </a>

              <button
                onClick={() => setShowGuideModal(false)}
                className="tactile-btn tactile-btn-sky px-4 py-2 text-xs font-mono"
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
