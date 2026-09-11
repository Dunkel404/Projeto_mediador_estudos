'use client';

import React, { useRef, useState, useEffect } from 'react';
import { CurriculumNode, UserNodeProgress } from '@/types/curriculum';
import { Lock, CheckCircle2, AlertOctagon, Sparkles } from 'lucide-react';

interface DesktopSpatialGraphProps {
  nodes: CurriculumNode[];
  progressMap: Record<string, UserNodeProgress>;
  onSelectNode: (node: CurriculumNode) => void;
  activeNodeId?: string | null;
}

export const DesktopSpatialGraph: React.FC<DesktopSpatialGraphProps> = ({
  nodes,
  progressMap,
  onSelectNode,
  activeNodeId,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [zoom, setZoom] = useState<number>(0.95);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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
    setZoom((prev) => Math.min(Math.max(0.5, prev * zoomFactor), 2.0));
  };

  // Node lookup map
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
      {/* Controls Overlay */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-[#12141a]/90 backdrop-blur-xs p-1.5 border border-[#242933] text-xs font-mono text-slate-400">
        <button
          onClick={() => setZoom((z) => Math.min(2.0, z * 1.15))}
          className="px-2 py-1 bg-[#181b22] hover:text-white border border-[#242933]"
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.5, z * 0.85))}
          className="px-2 py-1 bg-[#181b22] hover:text-white border border-[#242933]"
        >
          -
        </button>
        <button
          onClick={() => {
            setPan({ x: 50, y: 50 });
            setZoom(0.95);
          }}
          className="px-2 py-1 bg-[#181b22] hover:text-white border border-[#242933]"
        >
          RESET
        </button>
        <span className="px-1 text-[10px] text-slate-500">{Math.round(zoom * 100)}%</span>
      </div>

      {/* SVG Canvas for Bezier Connectors */}
      <svg
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <defs>
          <linearGradient id="gradMastered" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="gradLocked" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#242933" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#242933" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {nodes.map((node) => {
          return node.prerequisites.map((prereqId) => {
            const prereq = nodeMap.get(prereqId);
            if (!prereq) return null;

            const startX = prereq.gridPosition.x + 130;
            const startY = prereq.gridPosition.y + 40;
            const endX = node.gridPosition.x;
            const endY = node.gridPosition.y + 40;

            const dx = endX - startX;
            const ctrl1X = startX + dx * 0.5;
            const ctrl1Y = startY;
            const ctrl2X = startX + dx * 0.5;
            const ctrl2Y = endY;

            const isMastered = progressMap[prereq.id]?.status === 'mastered';

            return (
              <path
                key={`${prereqId}->${node.id}`}
                d={`M ${startX} ${startY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${endX} ${endY}`}
                fill="none"
                stroke={isMastered ? '#00f0ff' : '#242933'}
                strokeWidth={isMastered ? 2 : 1.5}
                strokeDasharray={isMastered ? undefined : '4 4'}
              />
            );
          });
        })}
      </svg>

      {/* Nodes Layer */}
      <div
        className="absolute top-0 left-0 w-full h-full z-10"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {nodes.map((node) => {
          const progress = progressMap[node.id] || {
            status: 'locked',
            scoreKnowledge: 0,
            score3D: 0,
          };
          const isActive = activeNodeId === node.id;

          let statusBorder = 'border-[#242933]';
          let statusBg = 'bg-[#12141a]/90';
          let statusGlow = '';

          if (progress.status === 'mastered') {
            statusBorder = 'border-[#00f0ff]';
            statusGlow = 'shadow-[0_0_15px_rgba(0,240,255,0.25)]';
          } else if (progress.status === 'critical_decay') {
            statusBorder = 'border-[#ffb000]';
            statusGlow = 'shadow-[0_0_15px_rgba(255,176,0,0.3)] animate-pulse';
          } else if (progress.status === 'available') {
            statusBorder = 'border-slate-500 hover:border-[#00f0ff]';
          } else {
            statusBg = 'bg-[#0f1117]/60 opacity-60';
          }

          if (isActive) {
            statusBorder = 'border-white';
            statusGlow = 'ring-2 ring-[#00f0ff]';
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
                width: '180px',
              }}
              className={`skill-node p-2.5 rounded-xs border transition-all cursor-pointer ${statusBorder} ${statusBg} ${statusGlow}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  TIER {node.tier}
                </span>
                {progress.status === 'locked' && <Lock className="w-3 h-3 text-slate-600" />}
                {progress.status === 'available' && <Sparkles className="w-3 h-3 text-slate-300" />}
                {progress.status === 'critical_decay' && (
                  <AlertOctagon className="w-3.5 h-3.5 text-[#ffb000]" />
                )}
                {progress.status === 'mastered' && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00f0ff]" />
                )}
              </div>

              {/* Title */}
              <h4 className="text-xs font-semibold text-white line-clamp-2 leading-tight mb-2">
                {node.title}
              </h4>

              {/* Telemetry Progress Bars */}
              <div className="space-y-1 font-mono text-[10px]">
                <div className="flex justify-between text-slate-400">
                  <span>MAT</span>
                  <span className="text-[#00f0ff]">{progress.scoreKnowledge}/90</span>
                </div>
                <div className="w-full h-1 bg-[#181b22] overflow-hidden">
                  <div
                    className="h-full bg-[#00f0ff]"
                    style={{ width: `${(progress.scoreKnowledge / 90) * 100}%` }}
                  />
                </div>

                <div className="flex justify-between text-slate-400">
                  <span>3D</span>
                  <span className="text-[#ffb000]">{progress.score3D}/10</span>
                </div>
                <div className="w-full h-1 bg-[#181b22] overflow-hidden">
                  <div
                    className="h-full bg-[#ffb000]"
                    style={{ width: `${(progress.score3D / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
