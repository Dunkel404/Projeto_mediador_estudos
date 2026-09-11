'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

interface ShaderCanvasProps {
  fragmentSource: string;
  onError?: (error: string | null) => void;
  className?: string;
}

const VERTEX_SHADER_SRC = `#version 300 es
in vec2 a_position;
void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const ShaderCanvas: React.FC<ShaderCanvasProps> = ({
  fragmentSource,
  onError,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [fps, setFps] = useState<number>(60);
  const [isRunning, setIsRunning] = useState<boolean>(true);

  // Compile and link shader program
  const initShader = useCallback(
    (gl: WebGL2RenderingContext, fragSrc: string): boolean => {
      // Vertex shader
      const vertShader = gl.createShader(gl.VERTEX_SHADER);
      if (!vertShader) return false;
      gl.shaderSource(vertShader, VERTEX_SHADER_SRC);
      gl.compileShader(vertShader);

      if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(vertShader);
        gl.deleteShader(vertShader);
        if (onError) onError(`Vertex Shader Error: ${info}`);
        return false;
      }

      // Fragment shader
      const fullFragSrc = fragSrc.trim().startsWith('#version')
        ? fragSrc
        : `#version 300 es\nprecision highp float;\n${fragSrc}`;

      const fragShader = gl.createShader(gl.FRAGMENT_SHADER);
      if (!fragShader) {
        gl.deleteShader(vertShader);
        return false;
      }
      gl.shaderSource(fragShader, fullFragSrc);
      gl.compileShader(fragShader);

      if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(fragShader);
        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
        if (onError) onError(`Fragment Shader Error:\n${info}`);
        return false;
      }

      // Program
      const program = gl.createProgram();
      if (!program) return false;
      gl.attachShader(program, vertShader);
      gl.attachShader(program, fragShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
        if (onError) onError(`Shader Link Error:\n${info}`);
        return false;
      }

      // Cleanup old program
      if (programRef.current) {
        gl.deleteProgram(programRef.current);
      }
      programRef.current = program;
      if (onError) onError(null); // Success, clear errors
      return true;
    },
    [onError]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {
      antialias: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });

    if (!gl) {
      if (onError) onError('WebGL 2.0 is not supported on this hardware/browser.');
      return;
    }
    glRef.current = gl;

    // Fullscreen quad buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    initShader(gl, fragmentSource);

    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const render = () => {
      if (!isRunning) return;

      const currentGl = glRef.current;
      const currentProgram = programRef.current;

      if (currentGl && currentProgram) {
        // Resize canvas if needed
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
          canvas.width = displayWidth;
          canvas.height = displayHeight;
          currentGl.viewport(0, 0, displayWidth, displayHeight);
        }

        currentGl.useProgram(currentProgram);

        // Bind attributes
        const posAttr = currentGl.getAttribLocation(currentProgram, 'a_position');
        if (posAttr !== -1) {
          currentGl.enableVertexAttribArray(posAttr);
          currentGl.vertexAttribPointer(posAttr, 2, currentGl.FLOAT, false, 0, 0);
        }

        // Set uniforms
        const resLoc = currentGl.getUniformLocation(currentProgram, 'u_resolution');
        if (resLoc) currentGl.uniform2f(resLoc, canvas.width, canvas.height);

        const timeLoc = currentGl.getUniformLocation(currentProgram, 'u_time');
        if (timeLoc) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000.0;
          currentGl.uniform1f(timeLoc, elapsed);
        }

        const mouseLoc = currentGl.getUniformLocation(currentProgram, 'u_mouse');
        if (mouseLoc) currentGl.uniform2f(mouseLoc, mouseRef.current.x, mouseRef.current.y);

        // Draw quad
        currentGl.drawArrays(currentGl.TRIANGLES, 0, 6);

        // FPS Calculation
        frameCount++;
        const now = performance.now();
        if (now - lastFpsUpdate >= 500) {
          setFps(Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
          frameCount = 0;
          lastFpsUpdate = now;
        }
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [fragmentSource, initShader, isRunning, onError]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: canvas.height - (e.clientY - rect.top),
    };
  };

  return (
    <div className={`relative w-full h-full bg-[#0a0b0e] border border-[#242933] overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        className="w-full h-full block cursor-crosshair"
      />
      {/* HUD Telemetry Overlay */}
      <div className="absolute top-2 right-2 flex items-center gap-2 bg-[#12141a]/80 backdrop-blur-xs px-2.5 py-1 border border-[#242933] text-xs font-mono">
        <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
        <span className="text-[#00f0ff]">{fps} FPS</span>
        <span className="text-slate-500">|</span>
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          {isRunning ? 'PAUSE' : 'RUN'}
        </button>
      </div>
    </div>
  );
};
