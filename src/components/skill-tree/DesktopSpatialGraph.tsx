'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CurriculumNode, UserNodeProgress, Tier } from '@/types/curriculum';
import { Lock, CheckCircle2, AlertOctagon, Sparkles, Crosshair, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface DesktopSpatialGraphProps {
  nodes: CurriculumNode[];
  progressMap: Record<string, UserNodeProgress>;
  onSelectNode: (node: CurriculumNode) => void;
  activeNodeId?: string | null;
}

const TIER_COLORS: Record<Tier, { text: string; border: string; glow: string; bg: string }> = {
  0: { text: '#00f0ff', border: '#00f0ff', glow: 'rgba(0, 240, 255, 0.3)', bg: 'rgba(0, 240, 255, 0.08)' },
  1: { text: '#38bdf8', border: '#38bdf8', glow: 'rgba(56, 189, 248, 0.3)', bg: 'rgba(56, 189, 248, 0.08)' },
  2: { text: '#ffb000', border: '#ffb000', glow: 'rgba(255, 176, 0, 0.3)', bg: 'rgba(255, 176, 0, 0.08)' },
  3: { text: '#c084fc', border: '#c084fc', glow: 'rgba(192, 132, 252, 0.3)', bg: 'rgba(192, 132, 252, 0.08)' },
  4: { text: '#f43f5e', border: '#f43f5e', glow: 'rgba(244, 63, 94, 0.3)', bg: 'rgba(244, 63, 94, 0.08)' },
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
      maxX = Math.max(maxX, n.gridPosition.x + 200);
      minY = Math.min(minY, n.gridPosition.y);
      maxY = Math.max(maxY, n.gridPosition.y + 140);
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
    // Initial auto-center with slight delay for container sizing
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
      className="relative w-full h-full bg-[#0a0b0e] vulkan-grid overflow-hidden cursor-grab active:cursor-grabbing select-none"
    >
      {/* HUD Control Overlay */}
      <div className="absolute bottom-4 left-4 z-30 flex items-center gap-1.5 bg-[#12141a]/95 backdrop-blur-md p-1.5 border border-[#242933] text-xs font-mono text-slate-400 shadow-xl">
        <button
          onClick={() => setZoom((z) => Math.min(2.2, z * 1.15))}
          className="p-1.5 bg-[#181b22] hover:text-white border border-[#242933] transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.35, z * 0.85))}
          className="p-1.5 bg-[#181b22] hover:text-white border border-[#242933] transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={autoCenterGraph}
          className="flex items-center gap-1 px-2 py-1 bg-[#181b22] hover:text-white border border-[#242933] transition-colors"
          title="Centralizar e ajustar visão"
        >
          <Crosshair className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span className="text-[10px]">CENTRALIZAR</span>
        </button>
        <span className="px-1.5 text-[10px] text-slate-500 font-bold">
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
          style={{ width: '3000px', height: '3000px' }}
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
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#00f0ff" />
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
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
            </marker>
          </defs>

          {nodes.map((node) => {
            return node.prerequisites.map((prereqId) => {
              const prereq = nodeMap.get(prereqId);
              if (!prereq) return null;

              const startX = prereq.gridPosition.x + 190;
              const startY = prereq.gridPosition.y + 55;
              const endX = node.gridPosition.x;
              const endY = node.gridPosition.y + 55;

              const dx = Math.abs(endX - startX) * 0.5;
              const pathD = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

              const isMastered = progressMap[prereq.id]?.status === 'mastered';
              const isAvailable = progressMap[node.id]?.status === 'available';

              return (
                <g key={`${prereqId}->${node.id}`}>
                  {/* Glow under line */}
                  {isMastered && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#00f0ff"
                      strokeWidth={4}
                      opacity={0.25}
                    />
                  )}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isMastered ? '#00f0ff' : isAvailable ? '#94a3b8' : '#475569'}
                    strokeWidth={isMastered ? 2.2 : 1.5}
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

          let borderStyle = 'border-[#334155]';
          let bgStyle = 'bg-[#141722]';
          let glowStyle = '';

          if (progress.status === 'mastered') {
            borderStyle = 'border-[#00f0ff]';
            glowStyle = 'shadow-[0_0_18px_rgba(0,240,255,0.35)]';
            bgStyle = 'bg-[#121826]';
          } else if (progress.status === 'critical_decay') {
            borderStyle = 'border-[#ffb000]';
            glowStyle = 'shadow-[0_0_18px_rgba(255,176,0,0.4)] animate-pulse';
            bgStyle = 'bg-[#1a1712]';
          } else if (progress.status === 'available') {
            borderStyle = 'border-slate-400 hover:border-[#00f0ff]';
            bgStyle = 'bg-[#141926]';
          } else {
            bgStyle = 'bg-[#11131c] opacity-80 hover:opacity-100';
          }

          if (isActive) {
            borderStyle = 'border-white';
            glowStyle = 'ring-2 ring-[#00f0ff] shadow-[0_0_25px_rgba(0,240,255,0.5)]';
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
                width: '190px',
              }}
              className={`skill-node p-3 rounded-xs border-2 transition-all cursor-pointer select-none z-10 ${borderStyle} ${bgStyle} ${glowStyle}`}
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#242933]">
                <span
                  style={{ color: tierStyle.text }}
                  className="text-[10px] font-mono font-bold tracking-wider uppercase"
                >
                  TIER {node.tier}
                </span>

                <div className="shrink-0">
                  {progress.status === 'locked' && <Lock className="w-3 h-3 text-slate-500" />}
                  {progress.status === 'available' && <Sparkles className="w-3.5 h-3.5 text-[#00f0ff]" />}
                  {progress.status === 'critical_decay' && (
                    <AlertOctagon className="w-3.5 h-3.5 text-[#ffb000]" />
                  )}
                  {progress.status === 'mastered' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00f0ff]" />
                  )}
                </div>
              </div>

              {/* Title */}
              <h4 className="text-xs font-semibold text-white line-clamp-2 leading-tight mb-2 min-h-[32px]">
                {node.title}
              </h4>

              {/* Score Indicators */}
              <div className="space-y-1.5 font-mono text-[10px] pt-1 border-t border-[#242933]">
                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>MATEMÁTICA</span>
                    <span className="text-[#00f0ff] font-bold">{progress.scoreKnowledge}/90</span>
                  </div>
                  <div className="w-full h-1 bg-[#0a0b0e] overflow-hidden rounded-xs">
                    <div
                      className="h-full bg-[#00f0ff] transition-all"
                      style={{ width: `${(progress.scoreKnowledge / 90) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-0.5">
                    <span>3D SHADERS</span>
                    <span className="text-[#ffb000] font-bold">{progress.score3D}/10</span>
                  </div>
                  <div className="w-full h-1 bg-[#0a0b0e] overflow-hidden rounded-xs">
                    <div
                      className="h-full bg-[#ffb000] transition-all"
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
