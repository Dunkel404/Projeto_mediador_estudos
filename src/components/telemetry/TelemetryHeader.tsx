'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Activity, Cpu, ShieldAlert, Key, Check } from 'lucide-react';

export const TelemetryHeader: React.FC = () => {
  const { progressMap, fsrsMap, apiKey, setApiKey } = useAppStore();
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [tempKey, setTempKey] = useState<string>(apiKey);

  const totalNodes = Object.keys(progressMap).length || 18;
  const masteredCount = Object.values(progressMap).filter((p) => p.status === 'mastered').length;
  const decayCount = Object.values(progressMap).filter((p) => p.status === 'critical_decay').length;

  // Average score
  const scores = Object.values(progressMap).map((p) => p.scoreKnowledge);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    await setApiKey(tempKey);
    setShowKeyModal(false);
  };

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

        {/* API Key Config */}
        <button
          onClick={() => {
            setTempKey(apiKey);
            setShowKeyModal(true);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 border text-[11px] transition-colors ${
            apiKey
              ? 'border-[#10b981]/50 text-[#10b981] bg-[#10b981]/10'
              : 'border-[#242933] text-slate-400 hover:text-white bg-[#12141a]'
          }`}
          title="Configurar Gemini API Key"
        >
          <Key className="w-3 h-3" />
          <span className="hidden sm:inline">{apiKey ? 'GEMINI ON' : 'CONFIG API'}</span>
        </button>
      </div>

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-[#12141a] border border-[#242933] p-5 shadow-2xl font-mono">
            <div className="flex items-center justify-between mb-3 border-b border-[#242933] pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-[#00f0ff]" />
                CONFIGURAÇÃO DA IA (GEMINI API)
              </h3>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              O ShaderMath opera <strong className="text-white">100% offline</strong> e determinístico via FSRS local.
              Para gerar avaliações adaptativas adicionais e diagnósticos estritos de contexto zero via Gemini, insira sua chave (BYOK) abaixo. Ela fica salva exclusivamente no seu navegador (IndexedDB local).
            </p>

            <form onSubmit={handleSaveKey} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">CHAVE DE API GEMINI:</label>
                <input
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 bg-[#0a0b0e] border border-[#242933] text-[#00f0ff] text-xs outline-hidden focus:border-[#00f0ff]"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-3 py-1.5 border border-[#242933] text-xs text-slate-400 hover:text-white"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#00f0ff] text-black font-bold text-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  SALVAR CHAVE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
