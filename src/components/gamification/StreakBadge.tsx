'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Sparkles, Volume2, VolumeX, Zap, Info } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import {
  playTactileClick,
  isAudioMuted,
  toggleAudioMuted,
  subscribeAudioMuteChange,
} from '@/lib/audio-feedback';

interface StreakBadgeProps {
  streak?: number;
  multiplier?: number;
  className?: string;
  compact?: boolean;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  streak: propStreak,
  multiplier: propMultiplier,
  className = '',
  compact = false,
}) => {
  const storeStreak = useAppStore((s) => s.currentStreak);
  const storeMultiplier = useAppStore((s) => s.focusMultiplier);

  const streak = propStreak !== undefined ? propStreak : storeStreak;
  const multiplier = propMultiplier !== undefined ? propMultiplier : storeMultiplier;

  const [isOpen, setIsOpen] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(isAudioMuted());
    const unsub = subscribeAudioMuteChange((newMute) => {
      setMuted(newMute);
    });
    return unsub;
  }, []);

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    playTactileClick();
    const next = toggleAudioMuted();
    setMuted(next);
  };

  const handleTogglePopover = () => {
    playTactileClick();
    setIsOpen(!isOpen);
  };

  const isSupercharged = streak >= 5;
  const isActive = streak >= 3;

  // Calculate milestone progress mathematically
  let prevMilestone = 0;
  let nextMilestone = 3;
  let nextMultiplier = '1.2x';
  let isMax = false;

  if (streak >= 20) {
    isMax = true;
    prevMilestone = 20;
    nextMilestone = 20;
    nextMultiplier = '2.5x (MÁXIMO)';
  } else if (streak >= 10) {
    prevMilestone = 10;
    nextMilestone = 20;
    nextMultiplier = '2.5x';
  } else if (streak >= 5) {
    prevMilestone = 5;
    nextMilestone = 10;
    nextMultiplier = '2.0x';
  } else if (streak >= 3) {
    prevMilestone = 3;
    nextMilestone = 5;
    nextMultiplier = '1.5x';
  }

  const progressToNext = isMax
    ? 100
    : Math.min(
        100,
        Math.max(
          0,
          Math.round(((streak - prevMilestone) / (nextMilestone - prevMilestone)) * 100)
        )
      );

  return (
    <div className={`relative inline-block select-none font-mono ${className}`}>
      {/* Interactive Badge Pill */}
      <button
        onClick={handleTogglePopover}
        className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-200 cursor-pointer ${
          isSupercharged
            ? 'bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-500/20 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/20 hover:border-amber-400'
            : isActive
            ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:border-amber-400/60'
            : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
        }`}
        title="Ver multiplicador de foco e sequência de acertos"
      >
        {/* Animated Flame Icon Container */}
        <div className="relative flex items-center justify-center">
          {/* Subtle Ambient Backlight Glow */}
          {isActive && (
            <div
              className={`absolute -inset-1 rounded-full blur-xs transition-opacity duration-300 ${
                isSupercharged
                  ? 'bg-rose-500/40 animate-pulse'
                  : 'bg-amber-500/30'
              }`}
            />
          )}

          <Flame
            className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
              isSupercharged
                ? 'text-rose-400 fill-rose-500/80 animate-bounce'
                : isActive
                ? 'text-amber-400 fill-amber-500/70'
                : 'text-slate-500'
            }`}
          />

          {isSupercharged && (
            <Sparkles className="w-2.5 h-2.5 text-amber-300 absolute -top-1 -right-1 animate-ping" />
          )}
        </div>

        {/* Streak Counter */}
        <div className="flex items-center gap-1 text-xs">
          <span
            className={`font-bold ${
              isSupercharged
                ? 'text-amber-200'
                : isActive
                ? 'text-amber-300'
                : 'text-slate-400'
            }`}
          >
            {streak}
          </span>

          {!compact && (
            <span className="text-[10px] text-slate-500 uppercase tracking-tighter">
              {streak === 1 ? 'combo' : 'combos'}
            </span>
          )}
        </div>

        {/* Multiplier Tag */}
        <span
          className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold transition-colors ${
            multiplier > 1.0
              ? 'bg-amber-400/25 text-amber-200 border border-amber-400/40'
              : 'bg-white/5 text-slate-500 border border-white/5'
          }`}
        >
          {multiplier.toFixed(1)}x
        </span>
      </button>

      {/* Popover Card */}
      {isOpen && (
        <>
          {/* Backdrop dismiss */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 top-full mt-2 z-50 w-72 sm:w-80 max-w-[calc(100vw-2rem)] p-4 rounded-2xl bg-[#121622] border border-white/15 shadow-2xl font-mono text-xs animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">MOTOR DE FOCO</h4>
                  <span className="text-[10px] text-slate-400 block -mt-0.5">Dopamina & FSRS</span>
                </div>
              </div>

              {/* Sound Toggle Button */}
              <button
                onClick={handleToggleMute}
                className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                  muted
                    ? 'border-rose-500/40 text-rose-400 bg-rose-500/10'
                    : 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                }`}
                title={muted ? 'Áudio desativado (Clique para ativar som)' : 'Áudio ativado (Clique para silenciar)'}
              >
                {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Current Stats */}
            <div className="space-y-2 mb-3 bg-[#090b10] p-3 rounded-xl border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Sequência Atual:</span>
                <span className="font-bold text-amber-400 text-sm flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-amber-400" />
                  {streak} acertos
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Multiplicador FSRS:</span>
                <span className="font-bold text-sky-400 text-sm">{multiplier.toFixed(1)}x de bônus</span>
              </div>
            </div>

            {/* Progress to next milestone */}
            <div className="mb-3 space-y-1.5">
              {isMax ? (
                <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold">
                  <span>Nível Máximo Atingido:</span>
                  <span>{nextMultiplier}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Próximo nível ({nextMultiplier}):</span>
                  <span>{streak}/{nextMilestone} acertos</span>
                </div>
              )}
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-300 rounded-full"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
            </div>

            {/* Multiplier Table */}
            <div className="text-[10px] text-slate-400 space-y-1 pt-1 border-t border-white/10">
              <div className="flex justify-between">
                <span>• 3 acertos seguidos:</span>
                <span className="text-slate-300 font-bold">1.2x</span>
              </div>
              <div className="flex justify-between">
                <span>• 5 acertos seguidos:</span>
                <span className="text-amber-400 font-bold">1.5x</span>
              </div>
              <div className="flex justify-between">
                <span>• 10 acertos seguidos:</span>
                <span className="text-rose-400 font-bold">2.0x</span>
              </div>
              <div className="flex justify-between">
                <span>• 20 acertos seguidos:</span>
                <span className="text-purple-400 font-bold">2.5x</span>
              </div>
            </div>

            <div className="mt-3 pt-2 text-[10px] text-slate-500 border-t border-white/10 flex items-center gap-1.5">
              <Info className="w-3 h-3 shrink-0 text-slate-400" />
              <span>Feedback áudio-tátil nativo sintetizado via Web Audio API.</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
