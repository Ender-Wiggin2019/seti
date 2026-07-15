import { useEffect, useRef } from 'react';

export const StarField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    interface Star {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
      twinkleSpeed: number;
      twinklePhase: number;
    }

    const stars: Star[] = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.2 + 0.05,
        opacity: Math.random() * 0.6 + 0.2,
        twinkleSpeed: Math.random() * 0.015 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        star.twinklePhase += star.twinkleSpeed;
        const twinkle = Math.sin(star.twinklePhase) * 0.3 + 0.7;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`;
        ctx.fill();

        if (star.size > 1.2) {
          const gradient = ctx.createRadialGradient(
            star.x,
            star.y,
            0,
            star.x,
            star.y,
            star.size * 3,
          );
          gradient.addColorStop(0, `rgba(156, 163, 175, ${0.25 * twinkle})`);
          gradient.addColorStop(1, 'rgba(156, 163, 175, 0)');
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        star.y += star.speed;
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className='fixed inset-0 pointer-events-none'
      style={{ zIndex: 0 }}
    />
  );
};

export const HexPattern = () => (
  <svg className='absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none'>
    <defs>
      <pattern
        id='hexagons'
        width='56'
        height='100'
        patternUnits='userSpaceOnUse'
        patternTransform='scale(2)'
      >
        <path
          d='M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100'
          fill='none'
          stroke='rgba(156, 163, 175, 0.5)'
          strokeWidth='0.5'
        />
        <path
          d='M28 0L28 34L0 50L0 84L28 100L56 84L56 50L28 34'
          fill='none'
          stroke='rgba(156, 163, 175, 0.5)'
          strokeWidth='0.5'
        />
      </pattern>
    </defs>
    <rect width='100%' height='100%' fill='url(#hexagons)' />
  </svg>
);

export const ScanLines = () => (
  <div
    className='absolute inset-0 pointer-events-none opacity-[0.02]'
    style={{
      background: `repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.03) 2px,
        rgba(255, 255, 255, 0.03) 4px
      )`,
    }}
  />
);

export const GradientOrbs = () => (
  <div
    className='absolute inset-0 pointer-events-none'
    style={{
      backgroundImage: `
        radial-gradient(ellipse at 15% 20%, rgba(156, 163, 175, 0.08) 0%, transparent 50%),
        radial-gradient(ellipse at 85% 80%, rgba(103, 232, 249, 0.05) 0%, transparent 45%),
        radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.03) 0%, transparent 60%)
      `,
    }}
  />
);

export const GridOverlay = () => (
  <div
    className='absolute inset-0 opacity-[0.012] pointer-events-none'
    style={{
      backgroundImage: `
        linear-gradient(rgba(156, 163, 175, 0.2) 1px, transparent 1px),
        linear-gradient(90deg, rgba(156, 163, 175, 0.2) 1px, transparent 1px)
      `,
      backgroundSize: '50px 50px',
    }}
  />
);
