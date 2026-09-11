'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Play,
  Pause,
  Layers,
  Box,
  Maximize2,
  Sparkles,
} from 'lucide-react';

export type ParametricType = 'saddle' | 'paraboloid' | 'sphere' | 'ripple' | 'torus';

interface ParametricScene3DProps {
  functionType?: ParametricType;
  className?: string;
}

const FORMULAS: Record<ParametricType, { name: string; math: string; desc: string }> = {
  saddle: {
    name: 'Sela Hiperbólica',
    math: 'z = (x² - y²) / 2',
    desc: 'Superfície regrada com curvatura gaussiana negativa (K < 0). Base para normais diferenciais.',
  },
  paraboloid: {
    name: 'Paraboloide Elíptico',
    math: 'z = (x² + y²) / 2',
    desc: 'Ponto crítico com Hessiana positiva definida. Usado para modelar reflexões especulares e cones de luz.',
  },
  sphere: {
    name: 'Hemisfério Riemman',
    math: 'z = √(R² - x² - y²)',
    desc: 'Curvatura constante positiva. Base para distribuição de microfacetas GGX e BRDF física.',
  },
  ripple: {
    name: 'Onda Radial de Bessel',
    math: 'z = sin(√(x² + y²)) / r',
    desc: 'Função de perturbação de altura (Displacement Mapping) e dinâmica de ondas em ocean shaders.',
  },
  torus: {
    name: 'Toroide 3D (Torus)',
    math: '(R - √(x² + y²))² + z² = r²',
    desc: 'Variedade compacta bidimensional com gênero 1. Teste clássico de Ray Marching e SDFs.',
  },
};

export const ParametricScene3D: React.FC<ParametricScene3DProps> = ({
  functionType: initialFunctionType = 'saddle',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [funcType, setFuncType] = useState<ParametricType>(initialFunctionType);
  const [isWireframe, setIsWireframe] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // References to communicate with the Three.js render loop
  const controlsRef = useRef<{
    setDistance: (cb: (prev: number) => number) => void;
    resetCamera: () => void;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0b0e);

    const initialW = container.clientWidth || 800;
    const initialH = container.clientHeight || 600;

    const camera = new THREE.PerspectiveCamera(45, initialW / initialH, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(initialW, initialH);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 2. Grids and Environment Helpers
    const gridHelper = new THREE.GridHelper(5, 16, 0x00f0ff, 0x1e2430);
    gridHelper.position.y = -1.2;
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(2.0);
    axesHelper.position.y = -1.2;
    scene.add(axesHelper);

    // 3. Geometry Generation based on funcType
    let geometry: THREE.BufferGeometry;
    const segments = 48;

    if (funcType === 'torus') {
      geometry = new THREE.TorusGeometry(1.2, 0.45, 32, 64);
      geometry.rotateX(Math.PI / 2);
    } else {
      const planeSize = 3.6;
      geometry = new THREE.PlaneGeometry(planeSize, planeSize, segments, segments);
      geometry.rotateX(-Math.PI / 2);

      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);
        let y = 0;

        if (funcType === 'saddle') {
          y = (x * x - z * z) * 0.35;
        } else if (funcType === 'paraboloid') {
          y = (x * x + z * z) * 0.28 - 0.8;
        } else if (funcType === 'sphere') {
          const r2 = x * x + z * z;
          const maxR2 = 2.8;
          y = r2 <= maxR2 ? Math.sqrt(Math.max(0, maxR2 - r2)) * 0.9 - 0.4 : -0.4;
        } else if (funcType === 'ripple') {
          const r = Math.sqrt(x * x + z * z);
          y = Math.sin(r * 4.5) * 0.4;
        }
        pos.setY(i, y);
      }
      geometry.computeVertexNormals();
    }

    // 4. Materials (Wireframe or PBR Metallic)
    const material = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      wireframe: isWireframe,
      roughness: 0.15,
      metalness: 0.85,
      emissive: 0x002233,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Wireframe overlay if in solid mode for contour appreciation
    let wireframeMesh: THREE.Mesh | null = null;
    if (!isWireframe) {
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        wireframe: true,
        transparent: true,
        opacity: 0.25,
      });
      wireframeMesh = new THREE.Mesh(geometry, wireMat);
      scene.add(wireframeMesh);
    }

    // 5. Illumination
    const ambLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambLight);

    const dirLight1 = new THREE.DirectionalLight(0x00f0ff, 2.5);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffb000, 2.0);
    dirLight2.position.set(-5, -3, -5);
    scene.add(dirLight2);

    // 6. Camera Orbit & Zoom Controls
    let dist = 3.6; // Framed close so the object is prominent!
    let rotX = 0.45;
    let rotY = 0.65;
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let touchStartDist = 0;

    const updateCameraPos = () => {
      camera.position.x = dist * Math.sin(rotY) * Math.cos(rotX);
      camera.position.y = dist * Math.sin(rotX);
      camera.position.z = dist * Math.cos(rotY) * Math.cos(rotX);
      camera.lookAt(0, 0, 0);
    };
    updateCameraPos();

    controlsRef.current = {
      setDistance: (cb) => {
        dist = Math.min(Math.max(1.6, cb(dist)), 9.0);
        updateCameraPos();
      },
      resetCamera: () => {
        dist = 3.6;
        rotX = 0.45;
        rotY = 0.65;
        updateCameraPos();
      },
    };

    const onMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.hud-control')) return;
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      rotY += dx * 0.008;
      rotX = Math.min(Math.max(-1.4, rotX + dy * 0.008), 1.4);
      prevMouse = { x: e.clientX, y: e.clientY };
      updateCameraPos();
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      dist = Math.min(Math.max(1.6, dist + e.deltaY * 0.0035), 9.0);
      updateCameraPos();
    };

    // Touch controls for mobile
    const onTouchStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest('.hud-control')) return;
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDist = Math.sqrt(dx * dx + dy * dy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isDragging) {
        const dx = e.touches[0].clientX - prevMouse.x;
        const dy = e.touches[0].clientY - prevMouse.y;
        rotY += dx * 0.008;
        rotX = Math.min(Math.max(-1.4, rotX + dy * 0.008), 1.4);
        prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        updateCameraPos();
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.sqrt(dx * dx + dy * dy);
        const delta = touchStartDist - currentDist;
        dist = Math.min(Math.max(1.6, dist + delta * 0.01), 9.0);
        touchStartDist = currentDist;
        updateCameraPos();
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel, { passive: false });
    dom.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    // 7. ResizeObserver for Automatic Container Tracking
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
          renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        }
      }
    });
    resizeObserver.observe(container);

    // 8. Animation Loop
    let reqId = 0;
    const animate = () => {
      reqId = requestAnimationFrame(animate);

      if (autoRotate && !isDragging) {
        rotY += 0.003;
        updateCameraPos();
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(reqId);
      resizeObserver.disconnect();
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      dom.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      if (container.contains(dom)) container.removeChild(dom);
      geometry.dispose();
      material.dispose();
      if (wireframeMesh) {
        wireframeMesh.geometry.dispose();
        (wireframeMesh.material as THREE.Material).dispose();
      }
      renderer.dispose();
    };
  }, [funcType, isWireframe, autoRotate]);

  const activeMeta = FORMULAS[funcType];

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[380px] bg-[#0a0b0e] overflow-hidden select-none cursor-grab active:cursor-grabbing ${className}`}
    >
      {/* Top HUD: Surface Info & Formulas */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1 max-w-[calc(100%-24px)] sm:max-w-md pointer-events-none">
        <div className="hud-control pointer-events-auto bg-[#12141a]/90 backdrop-blur-md px-3 py-2 border border-[#242933] shadow-xl text-xs font-mono">
          <div className="flex items-center justify-between gap-2 border-b border-[#242933] pb-1.5 mb-1.5">
            <span className="text-[#00f0ff] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5" />
              {activeMeta.name}
            </span>
            <span className="text-[#ffb000] font-bold text-[11px] bg-[#ffb000]/10 px-1.5 py-0.5 border border-[#ffb000]/30">
              {activeMeta.math}
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed font-sans">
            {activeMeta.desc}
          </p>
        </div>

        {/* Function Type Selector Buttons */}
        <div className="hud-control pointer-events-auto flex flex-wrap gap-1 bg-[#12141a]/90 backdrop-blur-md p-1 border border-[#242933] shadow-lg text-[11px] font-mono">
          {(['saddle', 'paraboloid', 'sphere', 'ripple', 'torus'] as ParametricType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFuncType(type)}
              className={`px-2 py-1 transition-colors cursor-pointer capitalize ${
                funcType === type
                  ? 'bg-[#00f0ff] text-black font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-[#181b22]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Camera & Shading HUD Controls */}
      <div className="hud-control absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-[#12141a]/90 backdrop-blur-md p-1.5 border border-[#242933] shadow-2xl font-mono text-xs text-slate-300">
        {/* Toggle Wireframe vs Solid */}
        <button
          onClick={() => setIsWireframe((w) => !w)}
          className={`flex items-center gap-1 px-2.5 py-1 border transition-colors cursor-pointer ${
            isWireframe
              ? 'border-[#00f0ff]/50 bg-[#00f0ff]/15 text-[#00f0ff]'
              : 'border-[#242933] bg-[#181b22] text-slate-300 hover:text-white'
          }`}
          title="Alternar entre malha wireframe e sólido sombreado"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isWireframe ? 'WIREFRAME' : 'SÓLIDO'}</span>
        </button>

        {/* Toggle Auto-Rotation */}
        <button
          onClick={() => setAutoRotate((r) => !r)}
          className={`p-1.5 border transition-colors cursor-pointer ${
            autoRotate
              ? 'border-[#10b981]/50 bg-[#10b981]/15 text-[#10b981]'
              : 'border-[#242933] bg-[#181b22] text-slate-400 hover:text-white'
          }`}
          title={autoRotate ? 'Pausar rotação' : 'Ativar rotação automática'}
        >
          {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <div className="h-4 w-px bg-[#242933]" />

        {/* Zoom Controls */}
        <button
          onClick={() => controlsRef.current?.setDistance((d) => d * 0.82)}
          className="p-1.5 bg-[#181b22] hover:bg-[#242933] text-slate-300 hover:text-white border border-[#242933] transition-colors cursor-pointer"
          title="Aproximar (Zoom In)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => controlsRef.current?.setDistance((d) => d * 1.2)}
          className="p-1.5 bg-[#181b22] hover:bg-[#242933] text-slate-300 hover:text-white border border-[#242933] transition-colors cursor-pointer"
          title="Afastar (Zoom Out)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => controlsRef.current?.resetCamera()}
          className="p-1.5 bg-[#181b22] hover:bg-[#242933] text-slate-300 hover:text-white border border-[#242933] transition-colors cursor-pointer"
          title="Redefinir Câmera"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Orbit Instruction Hint */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none hidden md:block">
        <span className="text-[10px] font-mono text-slate-500 bg-[#0a0b0e]/70 px-2 py-1 border border-[#242933]">
          Arraste para orbitar 360° // Roda do mouse para Zoom // Pinch no touch
        </span>
      </div>
    </div>
  );
};
