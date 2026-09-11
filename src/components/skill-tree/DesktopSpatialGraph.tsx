'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CurriculumNode, UserNodeProgress, Tier } from '@/types/curriculum';
import { Lock, CheckCircle2, AlertTriangle, Sparkles, Crosshair, ZoomIn, ZoomOut } from 'lucide-react';

interface DesktopSpatialGraphProps {
  nodes: CurriculumNode[];
  progressMap: Record<string, UserNodeProgress>;
  onSelectNode: (node: CurriculumNode) => void;
  activeNodeId?: string | null;
}

const TIER_COLORS: Record<Tier, { text: string; border: string; glow: string; bg: string }> = {
  0: { text: '#f97316', border: '#f97316', glow: 'rgba(249, 115, 22, 0.25)', bg: 'rgba(249, 115, 22, 0.08)' },
  1: { text: '#f59e0b', border: '#f59e0b', glow: 'rgba(245, 158, 11, 0.25)', bg: 'rgba(245, 158, 11, 0.08)' },
  2: { text: '#8b5cf6', border: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.25)', bg: 'rgba(139, 92, 246, 0.08)' },
  3: { text: '#ec4899', border: '#ec4899', glow: 'rgba(236, 72, 153, 0.25)', bg: 'rgba(236, 72, 153, 0.08)' },
  4: { text: '#10b981', border: '#10b981', glow: 'rgba(16, 185, 129, 0.25)', bg: 'rgba(16, 185, 129, 0.08)' },
};

export const DesktopSpatialGraph: React.FC<DesktopSpatialGraphProps> = ({
  nodes,
  progressMap,
  onSelectNode,
  activeNodeId,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 60, y: 40 });
  const [zoom, setZoom] = useState<number>(0.85);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Auto-center all nodes within container
  const autoCenterGraph = useCallback(() => {
    const container = containerRef.current;
    if (!container || nodes.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of nodes) {
      minX = Math.min(minX, n.gridPosition.x);
      maxX = Math.max(maxX, n.gridPosition.x + 220);
      minY = Math.min(minY, n.gridPosition.y);
      maxY = Math.max(maxY, n.gridPosition.y + 150);
    }

    const graphW = maxX - minX;
    const graphH = maxY - minY;
    const containerW = container.clientWidth || 1000;
    const containerH = container.clientHeight || 700;

    const targetZoom = Math.min(
      Math.max(0.45, Math.min((containerW * 0.9) / graphW, (containerH * 0.9) / graphH)),
      1.1
    );

    const targetPanX = (containerW - graphW * targetZoom) / 2 - minX * targetZoom;
    const targetPanY = (containerH - graphH * targetZoom) / 2 - minY * targetZoom;

    setZoom(targetZoom);
    setPan({ x: targetPanX, y: targetPanY });
  }, [nodes]);

  useEffect(() => {
    const timer = setTimeout(autoCenterGraph, 50);
    return () => clearTimeout(timer);
  }, [autoCenterGraph]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.skill-node')) return;
    setIsPanning(true);
    startPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - startPanRef.current.x,
      y: e.clientY - startPanRef.current.y,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.min(Math.max(0.35, prev * zoomFactor), 2.2));
  };

  const nodeMap = new Map<string, CurriculumNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="relative w-full h-full bg-[#0b0d14] ambient-grid overflow-hidden cursor-grab active:cursor-grabbing select-none"
    >
      {/* HUD Control Overlay */}
      <div className="absolute bottom-4 left-4 z-30 flex items-center gap-1.5 bg-[#121520]/95 backdrop-blur-md p-1.5 rounded-xl border border-white/10 text-xs font-mono text-slate-400 shadow-xl">
        <button
          onClick={() => setZoom((z) => Math.min(2.2, z * 1.15))}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white border border-white/5 transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.35, z * 0.85))}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white border border-white/5 transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={autoCenterGraph}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white border border-white/5 transition-colors cursor-pointer"
          title="Centralizar e ajustar visão"
        >
          <Crosshair className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-[10px]">CENTRALIZAR</span>
        </button>
        <span className="px-2 text-[10px] text-slate-400 font-bold">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Main Transform World */}
      <div
        className="absolute top-0 left-0 w-full h-full origin-top-left"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        {/* SVG Connector Layer */}
        <svg
          className="overflow-visible absolute top-0 left-0 w-full h-full pointer-events-none z-0"
          style={{ width: '3200px', height: '3200px' }}
        >
          <defs>
            <marker
              id="arrow-mastered"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f97316" />
            </marker>
            <marker
              id="arrow-locked"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#334155" />
            </marker>
          </defs>

          {nodes.map((node) => {
            return node.prerequisites.map((prereqId) => {
              const prereq = nodeMap.get(prereqId);
              if (!prereq) return null;

              const startX = prereq.gridPosition.x + 200;
              const startY = prereq.gridPosition.y + 60;
              const endX = node.gridPosition.x;
              const endY = node.gridPosition.y + 60;

              const dx = Math.abs(endX - startX) * 0.5;
              const pathD = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

              const isMastered = progressMap[prereq.id]?.status === 'mastered';
              const isAvailable = progressMap[node.id]?.status === 'available';

              return (
                <g key={`${prereqId}->${node.id}`}>
                  {isMastered && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#f97316"
                      strokeWidth={3}
                      opacity={0.25}
                    />
                  )}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isMastered ? '#f97316' : isAvailable ? '#f59e0b' : '#334155'}
                    strokeWidth={isMastered ? 2 : 1.5}
                    strokeDasharray={isMastered ? undefined : '5 4'}
                    markerEnd={isMastered ? 'url(#arrow-mastered)' : 'url(#arrow-locked)'}
                  />
                </g>
              );
            });
          })}
        </svg>

        {/* Nodes Layer */}
        {nodes.map((node) => {
          const progress = progressMap[node.id] || {
            status: 'locked',
            scoreKnowledge: 0,
            score3D: 0,
          };
          const isActive = activeNodeId === node.id;
          const tierStyle = TIER_COLORS[node.tier] || TIER_COLORS[0];

          let borderStyle = 'border-white/10';
          let bgStyle = 'bg-[#141724]';
          let glowStyle = 'shadow-md shadow-black/40';

          if (progress.status === 'mastered') {
            borderStyle = 'border-orange-500/50';
            glowStyle = 'shadow-lg shadow-orange-950/40';
            bgStyle = 'bg-[#1c150e]';
          } else if (progress.status === 'critical_decay') {
            borderStyle = 'border-rose-500/50';
            glowStyle = 'shadow-lg shadow-rose-950/30 animate-pulse';
            bgStyle = 'bg-[#1c1214]';
          } else if (progress.status === 'available') {
            borderStyle = 'border-amber-500/35 hover:border-amber-400';
            bgStyle = 'bg-[#19161a]';
          } else {
            bgStyle = 'bg-[#0e1017] opacity-75 hover:opacity-95';
          }

          if (isActive) {
            borderStyle = 'border-orange-400 ring-2 ring-orange-400/40';
            glowStyle = 'shadow-xl shadow-orange-950/50';
          }

          return (
            <div
              key={node.id}
              onClick={() => {
                if (progress.status !== 'locked') onSelectNode(node);
              }}
              style={{
                left: `${node.gridPosition.x}px`,
                top: `${node.gridPosition.y}px`,
                position: 'absolute',
                width: '205px',
              }}
              className={`skill-node p-3.5 rounded-xl border transition-all cursor-pointer select-none z-10 hover:-translate-y-0.5 ${borderStyle} ${bgStyle} ${glowStyle}`}
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/5">
                <span
                  style={{ color: tierStyle.text }}
                  className="text-[10px] font-mono font-bold tracking-wider uppercase"
                >
                  TIER {node.tier}
                </span>

                <div className="shrink-0">
                  {progress.status === 'locked' && <Lock className="w-3.5 h-3.5 text-slate-600" />}
                  {progress.status === 'available' && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                  {progress.status === 'critical_decay' && (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  )}
                  {progress.status === 'mastered' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-400" />
                  )}
                </div>
              </div>

              {/* Title */}
              <h4 className="text-xs font-semibold text-white line-clamp-2 leading-snug mb-2.5 min-h-[32px]">
                {node.title}
              </h4>

              {/* Score Indicators */}
              <div className="space-y-1.5 font-mono text-[10px] pt-1.5 border-t border-white/5">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>MATEMÁTICA</span>
                    <span className="text-orange-300 font-bold">{progress.scoreKnowledge}/90</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/40 overflow-hidden rounded-full">
                    <div
                      className="h-full bg-orange-400 rounded-full transition-all"
                      style={{ width: `${(progress.scoreKnowledge / 90) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>SHADERS 3D</span>
                    <span className="text-amber-400 font-bold">{progress.score3D}/10</span>
                  </div>
                  <div className="w-full h-1.5 bg-black/40 overflow-hidden rounded-full">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${(progress.score3D / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
