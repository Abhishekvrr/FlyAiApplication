import React, { useEffect, useRef } from 'react';

export default function Interactive3DBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e) => {
      targetMouseX = (e.clientX - width / 2) * 0.05;
      targetMouseY = (e.clientY - height / 2) * 0.05;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 3D Particles moving in space towards camera
    const PARTICLE_COUNT = 90;
    const particles = [];
    const FOV = 320;

    const HEX_TOKENS = ['AES-256', 'FF1-FPE', '0x9A4F', 'SHA-256', '0x1C8E', 'TOKEN', 'VAULT', 'NIST'];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 1.8,
        y: (Math.random() - 0.5) * height * 1.8,
        z: Math.random() * 800 + 50,
        speed: Math.random() * 1.8 + 0.8,
        size: Math.random() * 3 + 1.5,
        color: i % 3 === 0 ? '#6366f1' : i % 3 === 1 ? '#06b6d4' : '#10b981',
        token: i % 7 === 0 ? HEX_TOKENS[i % HEX_TOKENS.length] : null,
      });
    }

    // 3D Perspective Grid lines parameters
    let gridOffset = 0;

    const render = () => {
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2 + mouseX;
      const cy = height / 2 + mouseY;

      // 1. Draw 3D Perspective Horizon Plane Grid at bottom
      const horizonY = cy + height * 0.12;
      gridOffset = (gridOffset + 1.2) % 40;

      ctx.save();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.14)';
      ctx.lineWidth = 1;

      // Perspective vanishing point lines
      const lineCount = 24;
      for (let i = -lineCount; i <= lineCount; i++) {
        const xBottom = cx + i * (width / 16);
        ctx.beginPath();
        ctx.moveTo(cx, horizonY);
        ctx.lineTo(xBottom, height + 80);
        ctx.stroke();
      }

      // Moving horizontal depth rings (crossbars moving towards camera)
      for (let d = 0; d < 12; d++) {
        const depthFactor = Math.pow((d * 40 + gridOffset) / 480, 2.2);
        const y = horizonY + depthFactor * (height - horizonY + 80);
        if (y > horizonY && y < height + 80) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.strokeStyle = `rgba(99, 102, 241, ${Math.min(0.25, depthFactor * 0.35)})`;
          ctx.stroke();
        }
      }
      ctx.restore();

      // 2. Render 3D Flying Spatial Particles & Connecting Constellations
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.z -= p.speed;
        if (p.z <= 10) {
          p.z = 800;
          p.x = (Math.random() - 0.5) * width * 1.8;
          p.y = (Math.random() - 0.5) * height * 1.8;
        }

        const scale = FOV / (FOV + p.z);
        const screenX = cx + p.x * scale;
        const screenY = cy + p.y * scale;

        if (screenX < -50 || screenX > width + 50 || screenY < -50 || screenY > height + 50) {
          continue;
        }

        const alpha = Math.min(1, (1 - p.z / 800) * 1.2);

        // Draw particle node
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.size * scale * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0.18, alpha * 0.85);
        ctx.shadowBlur = 8 * scale;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw floating crypto tag for selected particles
        if (p.token && scale > 0.45) {
          ctx.font = `${Math.floor(10 * scale + 7)}px monospace`;
          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha * 0.7;
          ctx.fillText(p.token, screenX + 8, screenY + 4);
        }

        // Draw connecting 3D spatial lines to near particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dz = Math.abs(p.z - p2.z);
          if (dz < 90) {
            const scale2 = FOV / (FOV + p2.z);
            const s2X = cx + p2.x * scale2;
            const s2Y = cy + p2.y * scale2;
            const dist = Math.hypot(screenX - s2X, screenY - s2Y);
            if (dist < 90) {
              ctx.beginPath();
              ctx.moveTo(screenX, screenY);
              ctx.lineTo(s2X, s2Y);
              ctx.strokeStyle = '#818cf8';
              ctx.globalAlpha = (1 - dist / 90) * 0.22 * alpha;
              ctx.stroke();
            }
          }
        }
      }

      ctx.globalAlpha = 1;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 opacity-80"
    />
  );
}
