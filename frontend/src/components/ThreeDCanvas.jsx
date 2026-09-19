import React, { useEffect, useRef } from 'react';

/**
 * ThreeDCanvas
 * A high-performance 3D perspective canvas animation featuring:
 * - Rotating 3D geometric polyhedron vertices and edges
 * - Floating 3D isometric CRM cubes
 * - Interactive mouse parallax / orbit controls
 * - Glowing cyber pulse particles & constellation grid
 * - Branded Yellow Pages amber & gold aesthetic
 */
export default function ThreeDCanvas({ className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse interactive coordinates
    let targetRotX = 0;
    let targetRotY = 0;
    let rotX = 0;
    let rotY = 0;

    const handleMouseMove = (e) => {
      const halfW = width / 2;
      const halfH = height / 2;
      targetRotY = ((e.clientX - halfW) / halfW) * 0.8;
      targetRotX = -((e.clientY - halfH) / halfH) * 0.8;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // 1. Generate 3D Particle Cloud (Starfield / Data Nodes)
    const particleCount = 140;
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 1400,
        y: (Math.random() - 0.5) * 1400,
        z: (Math.random() - 0.5) * 1400,
        size: Math.random() * 2 + 1,
        speedZ: (Math.random() * 0.4 + 0.2) * (Math.random() > 0.5 ? 1 : -1),
        color: Math.random() > 0.4 ? '#f59e0b' : '#38bdf8'
      });
    }

    // 2. Define 3D Geometric Polyhedron Nodes (Icosahedron / Octahedron core)
    const phi = (1 + Math.sqrt(5)) / 2;
    const polyScale = 220;
    const coreVertices = [
      { x: -1, y: phi, z: 0 },
      { x: 1, y: phi, z: 0 },
      { x: -1, y: -phi, z: 0 },
      { x: 1, y: -phi, z: 0 },
      { x: 0, y: -1, z: phi },
      { x: 0, y: 1, z: phi },
      { x: 0, y: -1, z: -phi },
      { x: 0, y: 1, z: -phi },
      { x: phi, y: 0, z: -1 },
      { x: phi, y: 0, z: 1 },
      { x: -phi, y: 0, z: -1 },
      { x: -phi, y: 0, z: 1 }
    ].map((v) => ({
      x: v.x * polyScale,
      y: v.y * polyScale,
      z: v.z * polyScale
    }));

    // Edges connecting nearby vertices
    const coreEdges = [];
    for (let i = 0; i < coreVertices.length; i++) {
      for (let j = i + 1; j < coreVertices.length; j++) {
        const dx = coreVertices[i].x - coreVertices[j].x;
        const dy = coreVertices[i].y - coreVertices[j].y;
        const dz = coreVertices[i].z - coreVertices[j].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < polyScale * 2.1) {
          coreEdges.push([i, j]);
        }
      }
    }

    // 3. Define Satellite 3D Cubes
    const cubes = [
      { offset: { x: -360, y: -180, z: -100 }, size: 55, speed: 0.015, color: '#f59e0b' },
      { offset: { x: 380, y: 200, z: 80 }, size: 65, speed: -0.012, color: '#10b981' },
      { offset: { x: -320, y: 260, z: 150 }, size: 45, speed: 0.018, color: '#38bdf8' },
      { offset: { x: 340, y: -240, z: -120 }, size: 50, speed: -0.014, color: '#a855f7' }
    ];

    function createCubeVertices(size) {
      const s = size / 2;
      return [
        { x: -s, y: -s, z: -s },
        { x: s, y: -s, z: -s },
        { x: s, y: s, z: -s },
        { x: -s, y: s, z: -s },
        { x: -s, y: -s, z: s },
        { x: s, y: -s, z: s },
        { x: s, y: s, z: s },
        { x: -s, y: s, z: s }
      ];
    }

    const cubeEdges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];

    // 3D Rotation helper
    function rotatePoint(p, rx, ry, rz) {
      // Rotate around X
      let y1 = p.y * Math.cos(rx) - p.z * Math.sin(rx);
      let z1 = p.y * Math.sin(rx) + p.z * Math.cos(rx);

      // Rotate around Y
      let x2 = p.x * Math.cos(ry) + z1 * Math.sin(ry);
      let z2 = -p.x * Math.sin(ry) + z1 * Math.cos(ry);

      // Rotate around Z
      let x3 = x2 * Math.cos(rz) - y1 * Math.sin(rz);
      let y3 = x2 * Math.sin(rz) + y1 * Math.cos(rz);

      return { x: x3, y: y3, z: z2 };
    }

    // 3D to 2D projection
    const fov = 750;
    function project(p, cx, cy) {
      const scale = fov / (fov + p.z + 500);
      return {
        x: p.x * scale + cx,
        y: p.y * scale + cy,
        scale,
        visible: fov + p.z + 500 > 10
      };
    }

    let angle = 0;

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse follow
      rotX += (targetRotX - rotX) * 0.05;
      rotY += (targetRotY - rotY) * 0.05;
      angle += 0.007;

      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Draw subtle ambient circular grid ring in background
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, width * 0.35, height * 0.25, rotY * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.05)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(centerX, centerY, width * 0.45, height * 0.35, -rotY * 0.3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.03)';
      ctx.stroke();
      ctx.restore();

      // 2. Render 3D Background Particles
      for (let p of particles) {
        p.z += p.speedZ;
        if (p.z > 700) p.z = -700;
        if (p.z < -700) p.z = 700;

        const rotated = rotatePoint(p, rotX * 0.4, rotY * 0.4 + angle * 0.3, 0);
        const projected = project(rotated, centerX, centerY);

        if (projected.visible) {
          const alpha = Math.min(Math.max((rotated.z + 700) / 1400, 0.1), 0.7);
          ctx.beginPath();
          ctx.arc(projected.x, projected.y, Math.max(p.size * projected.scale, 0.5), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha;
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // 3. Render Central 3D Core Polyhedron (The Lead Nexus)
      const rotatedCore = coreVertices.map((v) =>
        rotatePoint(v, rotX + angle * 0.6, rotY + angle * 0.8, angle * 0.3)
      );
      const projectedCore = rotatedCore.map((v) => project(v, centerX, centerY));

      // Draw Polyhedron Edges with glowing gradient
      ctx.lineWidth = 1.2;
      for (const [i, j] of coreEdges) {
        const p1 = projectedCore[i];
        const p2 = projectedCore[j];

        if (p1.visible && p2.visible) {
          const avgZ = (rotatedCore[i].z + rotatedCore[j].z) / 2;
          const alpha = Math.min(Math.max((avgZ + 400) / 800, 0.08), 0.5);

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(245, 158, 11, ${alpha})`;
          ctx.stroke();
        }
      }

      // Draw Polyhedron Nodes (Vertices)
      for (let i = 0; i < projectedCore.length; i++) {
        const p = projectedCore[i];
        if (p.visible) {
          const depth = (rotatedCore[i].z + 400) / 800;
          const radius = Math.max(3.5 * p.scale, 1.5);

          // Outer pulse glow
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
          ctx.fill();

          // Core node
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = depth > 0.5 ? '#f59e0b' : '#fbbf24';
          ctx.shadowColor = '#f59e0b';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // 4. Render Satellite 3D Cubes (Data Blocks / CRM Modules)
      cubes.forEach((cube, cIdx) => {
        const baseVertices = createCubeVertices(cube.size);
        const cubeAngle = angle * (cIdx % 2 === 0 ? 1 : -1) * 1.5;

        // Orbit around center
        const orbitRadius = Math.sqrt(cube.offset.x * cube.offset.x + cube.offset.y * cube.offset.y);
        const currentAngle = Math.atan2(cube.offset.y, cube.offset.x) + angle * 0.4;
        const currentX = Math.cos(currentAngle) * orbitRadius;
        const currentY = Math.sin(currentAngle) * orbitRadius;

        const rotatedCubeVerts = baseVertices.map((v) => {
          // Self rotation
          const selfRot = rotatePoint(v, cubeAngle, cubeAngle * 1.2, 0);
          // Position offset
          const placed = {
            x: selfRot.x + currentX,
            y: selfRot.y + currentY,
            z: selfRot.z + cube.offset.z
          };
          // Global scene rotation
          return rotatePoint(placed, rotX * 0.8, rotY * 0.8, 0);
        });

        const projectedCube = rotatedCubeVerts.map((v) => project(v, centerX, centerY));

        // Connect cube center to core with faint beam
        const cubeCenter = project(
          rotatePoint(
            { x: currentX, y: currentY, z: cube.offset.z },
            rotX * 0.8,
            rotY * 0.8,
            0
          ),
          centerX,
          centerY
        );

        if (cubeCenter.visible) {
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(cubeCenter.x, cubeCenter.y);
          ctx.strokeStyle = `rgba(245, 158, 11, 0.08)`;
          ctx.setLineDash([4, 6]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw Cube Edges
        ctx.lineWidth = 1.2;
        cubeEdges.forEach(([i, j]) => {
          const p1 = projectedCube[i];
          const p2 = projectedCube[j];
          if (p1.visible && p2.visible) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = cube.color;
            ctx.globalAlpha = 0.6;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        });

        // Glowing points on corners
        projectedCube.forEach((p) => {
          if (p.visible) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2 * p.scale, 0, Math.PI * 2);
            ctx.fillStyle = cube.color;
            ctx.fill();
          }
        });
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ opacity: 0.95 }}
    />
  );
}
