'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { ShaderCanvas } from './ShaderCanvas';
import { Play, RotateCcw, AlertTriangle, Code, Box } from 'lucide-react';

// Lazy-loaded Three.js component via code-splitting
const ParametricScene3D = dynamic(
  () => import('./ParametricScene3D').then((m) => m.ParametricScene3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#0a0b0e] text-[#00f0ff] font-mono text-xs">
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
    <div className={`flex flex-col h-full bg-[#12141a] border border-[#242933] ${className}`}>
      {/* Sandbox Header / Mode Selector */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#242933] bg-[#0a0b0e]">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('shader')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-medium transition-all ${
              activeTab === 'shader'
                ? 'bg-[#181b22] text-[#00f0ff] border-b-2 border-[#00f0ff]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            GLSL FRAGMENT RUNNER (WEBGL 2.0)
          </button>
          <button
            onClick={() => setActiveTab('3d')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-medium transition-all ${
              activeTab === '3d'
                ? 'bg-[#181b22] text-[#ffb000] border-b-2 border-[#ffb000]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            PARAMETRIC 3D SCENE
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {activeTab === 'shader' ? (
            <>
              <button
                onClick={handleReset}
                title="Reset Code"
                className="p-1.5 text-slate-400 hover:text-white border border-[#242933] hover:bg-[#181b22] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleRun}
                className="flex items-center gap-1 px-3 py-1 bg-[#00f0ff] hover:bg-[#38bdf8] text-black font-mono font-bold text-xs transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                COMPILE & EXECUTE
              </button>
            </>
          ) : (
            <span className="text-[10px] font-mono text-[#ffb000] px-2 py-0.5 bg-[#ffb000]/10 border border-[#ffb000]/30 hidden sm:inline">
              VIEWPORT 3D EXPANDIDO (THREE.JS)
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
          <div className="relative w-full h-[320px] lg:h-full border-b lg:border-b-0 lg:border-r border-[#242933]">
            <ShaderCanvas
              fragmentSource={compiledCode}
              onError={(err) => setCompilerError(err)}
            />
          </div>

          {/* Right/Bottom: Code Editor & Error Diagnostic Terminal */}
          <div className="flex flex-col h-full bg-[#0a0b0e]">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#12141a] border-b border-[#242933] text-xs font-mono text-slate-400">
              <span>GLSL ES 3.0 FRAGMENT SOURCE</span>
              <span className="text-[10px] text-slate-500">Ctrl+Enter to compile</span>
            </div>

            <div className="flex-1 p-2 overflow-auto">
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
                className="w-full h-full bg-transparent text-[#00f0ff] font-mono-code text-xs resize-none outline-hidden leading-relaxed"
              />
            </div>

            {/* Compiler Diagnostics Bar */}
            {compilerError && (
              <div className="p-2.5 bg-[#ff3344]/10 border-t border-[#ff3344] text-[#ff3344] font-mono text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <pre className="whitespace-pre-wrap overflow-x-auto">{compilerError}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
