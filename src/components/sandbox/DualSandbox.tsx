'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { ShaderCanvas } from './ShaderCanvas';
import { Play, RotateCcw, AlertTriangle, Code, Box } from 'lucide-react';

const ParametricScene3D = dynamic(
  () => import('./ParametricScene3D').then((m) => m.ParametricScene3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#0b0d14] text-orange-400 font-mono text-xs">
        INITIALIZING 3D ENGINE...
      </div>
    ),
  }
);

interface DualSandboxProps {
  initialGlsl: string;
  onCodeChange?: (code: string) => void;
  className?: string;
}

export const DualSandbox: React.FC<DualSandboxProps> = ({
  initialGlsl,
  onCodeChange,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'shader' | '3d'>('shader');
  const [code, setCode] = useState<string>(initialGlsl);
  const [compiledCode, setCompiledCode] = useState<string>(initialGlsl);
  const [compilerError, setCompilerError] = useState<string | null>(null);

  const handleRun = () => {
    setCompiledCode(code);
    if (onCodeChange) onCodeChange(code);
  };

  const handleReset = () => {
    setCode(initialGlsl);
    setCompiledCode(initialGlsl);
    setCompilerError(null);
  };

  return (
    <div className={`flex flex-col h-full bg-[#0b0d14] overflow-hidden select-none ${className}`}>
      {/* Sandbox Header / Mode Selector */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#0e1017]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('shader')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              activeTab === 'shader'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-orange-400" />
            <span>GLSL SHADER (WEBGL 2.0)</span>
          </button>
          <button
            onClick={() => setActiveTab('3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              activeTab === '3d'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-amber-400" />
            <span>CENA 3D PARAMÉTRICA</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {activeTab === 'shader' ? (
            <>
              <button
                onClick={handleReset}
                title="Reset Code"
                className="p-2 text-slate-400 hover:text-white rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleRun}
                className="tactile-btn tactile-btn-orange px-3.5 py-1.5 text-xs font-mono flex items-center gap-1.5"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>COMPILAR</span>
              </button>
            </>
          ) : (
            <span className="text-[10px] font-mono text-amber-300 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 hidden sm:inline font-bold">
              THREE.JS VIEWPORT
            </span>
          )}
        </div>
      </div>

      {/* Main Sandbox Area: Full Viewport for 3D, Split View for Shader Coding */}
      {activeTab === '3d' ? (
        <div className="flex-1 w-full h-full min-h-0 relative">
          <ParametricScene3D className="w-full h-full" />
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">
          {/* Left/Top: Interactive Viewport */}
          <div className="relative w-full h-[320px] lg:h-full border-b lg:border-b-0 lg:border-r border-white/10 bg-[#0b0d14]">
            <ShaderCanvas
              fragmentSource={compiledCode}
              onError={(err) => setCompilerError(err)}
            />
          </div>

          {/* Right/Bottom: Code Editor & Error Diagnostic Terminal */}
          <div className="flex flex-col h-full bg-[#0b0d14]">
            <div className="flex items-center justify-between px-3.5 py-2 bg-[#0e1017] border-b border-white/10 text-xs font-mono text-slate-400">
              <span className="text-[11px] font-bold">GLSL ES 3.0 FRAGMENT SOURCE</span>
              <span className="text-[10px] text-slate-500">Ctrl+Enter para compilar</span>
            </div>

            <div className="flex-1 p-3 overflow-auto select-text">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleRun();
                  }
                }}
                spellCheck={false}
                className="w-full h-full bg-transparent text-amber-100 font-mono-code text-xs resize-none outline-hidden leading-relaxed"
              />
            </div>

            {/* Compiler Diagnostics Bar */}
            {compilerError && (
              <div className="p-3 bg-rose-950/20 border-t border-rose-500/40 text-rose-300 font-mono text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <pre className="whitespace-pre-wrap overflow-x-auto text-[11px]">{compilerError}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
