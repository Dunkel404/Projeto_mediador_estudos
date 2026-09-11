'use client';

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface ParametricScene3DProps {
  functionType?: 'saddle' | 'sphere' | 'paraboloid' | 'vector_field';
  className?: string;
}

export const ParametricScene3D: React.FC<ParametricScene3DProps> = ({
  functionType = 'saddle',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Setup Three.js Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0b0e);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(4, 3, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Grid & Axes
    const gridHelper = new THREE.GridHelper(6, 12, 0x242933, 0x181b22);
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(2.5);
    scene.add(axesHelper);

    // Parametric Geometry
    const size = 30;
    const geometry = new THREE.PlaneGeometry(3, 3, size, size);
    geometry.rotateX(-Math.PI / 2);

    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      let y = 0;
      if (functionType === 'saddle') {
        y = (x * x - z * z) * 0.4; // Hyperbolic paraboloid z = x^2 - y^2
      } else if (functionType === 'paraboloid') {
        y = (x * x + z * z) * 0.3 - 0.8;
      } else if (functionType === 'sphere') {
        const r2 = x * x + z * z;
        y = r2 <= 1.5 ? Math.sqrt(Math.max(0, 1.5 - r2)) - 0.5 : -0.5;
      }
      pos.setY(i, y);
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      wireframe: true,
      roughness: 0.2,
      metalness: 0.8,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Lights
    const ambLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambLight);

    const dirLight = new THREE.DirectionalLight(0xffb000, 1.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Animation & simple rotation
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let rotX = 0.3;
    let rotY = 0.5;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouse.x;
      const dy = e.clientY - prevMouse.y;
      rotY += dx * 0.01;
      rotX += dy * 0.01;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    let reqId = 0;
    const animate = () => {
      reqId = requestAnimationFrame(animate);

      // Camera orbit around origin
      const dist = 6;
      camera.position.x = dist * Math.sin(rotY) * Math.cos(rotX);
      camera.position.y = dist * Math.sin(rotX);
      camera.position.z = dist * Math.cos(rotY) * Math.cos(rotX);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(reqId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      if (container.contains(dom)) container.removeChild(dom);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [functionType]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-[#0a0b0e] border border-[#242933] overflow-hidden ${className}`}
    >
      <div className="absolute top-2 left-2 bg-[#12141a]/80 backdrop-blur-xs px-2.5 py-1 border border-[#242933] text-xs font-mono text-[#e2b340]">
        3D Surface: <span className="text-white font-bold">{functionType.toUpperCase()}</span> (Arcball Orbit)
      </div>
    </div>
  );
};
