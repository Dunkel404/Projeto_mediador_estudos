'use client';

import React, { useEffect, useRef } from 'react';
import {
  Trophy,
  Award,
  Sparkles,
  Flame,
  CheckCircle2,
  Cpu,
  ArrowRight,
  X,
} from 'lucide-react';
import {
  playMasteryFanfare,
  playLevelUpArpeggio,
  playCorrectChime,
  playTactileClick,
} from '@/lib/audio-feedback';

export interface CelebrationEvent {
  id: string;
  type: 'mastery' | 'fsrs_milestone' | 'submodule_complete' | 'level_up' | 'streak_milestone';
  title: string;
  subtitle?: string;
  badgeText?: string;
  scoreKnowledge?: number;
  score3D?: number;
  streak?: number;
  multiplier?: number;
  onContinue?: () => void;
}

interface CelebrationOverlayProps {
  event: CelebrationEvent | null;
  onDismiss: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'confetti' | 'math' | 'star';
  color: string;
  size: number;
  rotation: number;
  angularVelocity: number;
  wobble: number;
  wobbleSpeed: number;
  alpha: number;
  decay: number;
  symbol?: string;
}

const MATH_SYMBOLS = ['∇', '∫', 'λ', 'θ', 'Σ', 'π', '×', '⭐', '✦', '★', '3D', 'FSRS'];
const CONFETTI_COLORS = [
  '#38bdf8', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#a855f7', // violet
  '#fbbf24', // gold
  '#34d399', // mint
  '#ffffff', // bright white
];

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  event,
  onDismiss,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const audioPlayedForId = useRef<string | null>(null);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  // Play appropriate sound effect on event trigger
  useEffect(() => {
    if (!event) return;

    if (audioPlayedForId.current !== event.id) {
      audioPlayedForId.current = event.id;

      if (event.type === 'mastery' || event.type === 'fsrs_milestone') {
        playMasteryFanfare();
      } else if (event.type === 'level_up' || event.type === 'streak_milestone') {
        playLevelUpArpeggio();
      } else {
        playCorrectChime();
      }
    }

    // Auto-dismiss after 6.5 seconds without restarting on callback identity changes
    const timer = setTimeout(() => {
      onDismissRef.current();
    }, 6500);

    return () => clearTimeout(timer);
  }, [event]);

  // Handle Escape key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        playTactileClick();
        onDismissRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // High performance Canvas Confetti & Math Particle Loop
  useEffect(() => {
    if (!event) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-DPI buffer scaling (capped at 2x for rock-solid 60 FPS)
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeCanvas();

    const particles: Particle[] = [];
    const particleCount = 130;

    // Spawn burst from center
    const originX = window.innerWidth / 2;
    const originY = window.innerHeight * 0.45;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = 4 + Math.random() * 16;
      const isMath = Math.random() < 0.32;
      const isStar = !isMath && Math.random() < 0.25;

      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (3 + Math.random() * 6), // Initial upward bias
        type: isMath ? 'math' : isStar ? 'star' : 'confetti',
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: isMath ? 16 + Math.random() * 8 : isStar ? 12 + Math.random() * 6 : 8 + Math.random() * 8,
        rotation: Math.random() * Math.PI * 2,
        angularVelocity: (Math.random() - 0.5) * 0.2,
        wobble: Math.random() * Math.PI,
        wobbleSpeed: 0.08 + Math.random() * 0.08,
        alpha: 1.0,
        decay: 0.005 + Math.random() * 0.006,
        symbol: MATH_SYMBOLS[Math.floor(Math.random() * MATH_SYMBOLS.length)],
      });
    }

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      // Clear using CSS viewport dimensions (scaled by dpr transform)
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      let aliveCount = 0;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.alpha <= 0.01) continue;

        aliveCount++;

        // Physics updates
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22; // Gravity
        p.vx *= 0.985; // Drag
        p.vy *= 0.985;
        p.rotation += p.angularVelocity;
        p.wobble += p.wobbleSpeed;
        p.alpha = Math.max(0, p.alpha - p.decay);

        ctx.save();
        ctx.globalAlpha = p.alpha;

        if (p.type === 'confetti') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          const xTilt = Math.cos(p.wobble);
          ctx.scale(xTilt, 1);

          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else if (p.type === 'math' && p.symbol) {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation * 0.5);
          ctx.font = `bold ${Math.round(p.size)}px "JetBrains Mono", monospace`;
          ctx.fillStyle = p.color;
          // Zero shadowBlur to avoid heavy GPU blur rasterization passes
          ctx.fillText(p.symbol, 0, 0);
        } else if (p.type === 'star') {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.font = `bold ${Math.round(p.size)}px sans-serif`;
          ctx.fillStyle = p.color;
          ctx.fillText('✦', 0, 0);
        }

        ctx.restore();
      }

      if (aliveCount > 0) {
        animFrameId.current = requestAnimationFrame(render);
      }
    };

    animFrameId.current = requestAnimationFrame(render);
    window.addEventListener('resize', resizeCanvas);

    return () => {
      isRunning = false;
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [event]);

  if (!event) return null;

  const handleDismiss = () => {
    playTactileClick();
    if (event.onContinue) {
      event.onContinue();
    }
    onDismiss();
  };

  const isMastery = event.type === 'mastery' || event.type === 'fsrs_milestone';
  const isStreak = event.type === 'streak_milestone';
  const isLevelUp = event.type === 'level_up';

  return (
    <div
      onClick={handleDismiss}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm select-none animate-in fade-in duration-200 p-4 cursor-pointer"
    >
      {/* 60 FPS Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10 w-full h-full"
      />

      {/* Central Celebration HUD Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative z-20 w-full max-w-lg rounded-3xl p-6 sm:p-8 border shadow-2xl backdrop-blur-md overflow-hidden animate-in zoom-in-90 duration-300 cursor-default ${
          isMastery
            ? 'bg-[#0e1320]/95 border-amber-500/40 shadow-amber-500/15'
            : isStreak
            ? 'bg-[#140e1f]/95 border-rose-500/40 shadow-rose-500/15'
            : isLevelUp
            ? 'bg-[#130e22]/95 border-purple-500/40 shadow-purple-500/15'
            : 'bg-[#141724]/95 border-orange-500/40 shadow-orange-500/15'
        }`}
      >
        {/* Subtle radial ambient illumination */}
        <div
          className={`absolute -top-24 -left-24 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-20 ${
            isMastery ? 'bg-amber-400' : isStreak ? 'bg-rose-500' : 'bg-orange-500'
          }`}
        />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          title="Fechar (Esc)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon with Radiant Ring */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shadow-lg border ${
                isMastery
                  ? 'bg-gradient-to-br from-amber-400/25 to-yellow-600/30 border-amber-400/50 text-amber-300'
                  : isStreak
                  ? 'bg-gradient-to-br from-rose-500/25 to-amber-500/30 border-rose-500/50 text-rose-300'
                  : isLevelUp
                  ? 'bg-gradient-to-br from-purple-500/25 to-indigo-600/30 border-purple-400/50 text-purple-300'
                  : 'bg-gradient-to-br from-orange-400/25 to-amber-600/30 border-orange-400/50 text-orange-300'
              }`}
            >
              {isMastery ? (
                <Trophy className="w-9 h-9 drop-shadow-md animate-bounce" />
              ) : isStreak ? (
                <Flame className="w-9 h-9 drop-shadow-md animate-bounce fill-rose-400" />
              ) : isLevelUp ? (
                <Award className="w-9 h-9 drop-shadow-md animate-bounce text-purple-300" />
              ) : (
                <Sparkles className="w-9 h-9 drop-shadow-md animate-spin" />
              )}
            </div>

            {/* Sparkle badge */}
            <span
              className={`absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase tracking-wider border shadow-md ${
                isMastery
                  ? 'bg-amber-500 text-black border-amber-300'
                  : isStreak
                  ? 'bg-rose-500 text-white border-rose-300'
                  : isLevelUp
                  ? 'bg-purple-500 text-white border-purple-300'
                  : 'bg-orange-500 text-white border-orange-400'
              }`}
            >
              {event.badgeText || 'CONQUISTA'}
            </span>
          </div>

          {/* Title & Subtitle */}
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-mono mb-2">
            {event.title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-sm mb-6">
            {event.subtitle ||
              'Excelente raciocínio espacial e consolidação das estruturas vetoriais no pipeline.'}
          </p>

          {/* Telemetry Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 w-full font-mono text-xs mb-6">
            {event.scoreKnowledge !== undefined && (
              <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/25 flex flex-col items-center">
                <span className="text-slate-400 text-[10px] uppercase">CONHECIMENTO</span>
                <span className="text-orange-300 font-bold text-sm">+{event.scoreKnowledge} XP</span>
              </div>
            )}

            {event.score3D !== undefined && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex flex-col items-center">
                <span className="text-slate-400 text-[10px] uppercase">APLICAÇÃO 3D</span>
                <span className="text-amber-300 font-bold text-sm">{event.score3D}/10 GPU</span>
              </div>
            )}

            {event.multiplier !== undefined && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col items-center col-span-2 sm:col-span-1">
                <span className="text-slate-400 text-[10px] uppercase">BÔNUS RETENÇÃO</span>
                <span className="text-emerald-300 font-bold text-sm">{event.multiplier.toFixed(1)}x FOCO</span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={handleDismiss}
            className={`w-full py-3 px-5 rounded-xl font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
              isMastery
                ? 'tactile-btn tactile-btn-amber text-white'
                : 'tactile-btn tactile-btn-orange text-white'
            }`}
          >
            <span>CONTINUAR ESTUDOS</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
