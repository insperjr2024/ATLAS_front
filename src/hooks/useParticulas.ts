import { useEffect } from "react";
import type { RefObject } from "react";

/**
 * Fundo de partículas em vinho, o mesmo do painel de Contratos e do site
 * institucional da Insper Jr (portado de `useParticleBackground.ts` de lá).
 * Cobre o retângulo inteiro do container e segue o mouse de leve.
 */
export function useParticulas(
  containerRef: RefObject<HTMLDivElement | null>,
  canvasRef: RefObject<HTMLCanvasElement | null>,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId = 0;
    const mouse = { x: -9999, y: -9999 };

    interface P {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
    }
    let particulas: P[] = [];
    let W = 0;
    let H = 0;
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      const rect = container!.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
    }

    function nova(): P {
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1,
      };
    }

    function atualizar(p: P) {
      p.vx += (Math.random() - 0.5) * 0.06;
      p.vy += (Math.random() - 0.5) * 0.06;
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      const maxSpeed = 0.8;
      if (speed > maxSpeed) {
        p.vx = (p.vx / speed) * maxSpeed;
        p.vy = (p.vy / speed) * maxSpeed;
      }
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const repel = 90;
      if (dist < repel && dist > 0) {
        const force = ((repel - dist) / repel) * 1.2;
        p.vx += (dx / dist) * force * 0.3;
        p.vy += (dy / dist) * force * 0.3;
      }
      p.vx *= 0.99;
      p.vy *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = W;
      if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H;
      if (p.y > H) p.y = 0;
    }

    function desenhar() {
      ctx!.save();
      ctx!.scale(dpr, dpr);
      ctx!.clearRect(0, 0, W, H);
      const maxDist = 130;
      for (let i = 0; i < particulas.length; i++) {
        atualizar(particulas[i]);
        ctx!.beginPath();
        ctx!.arc(particulas[i].x, particulas[i].y, particulas[i].r, 0, Math.PI * 2);
        ctx!.fillStyle = "rgba(105,18,18,0.35)";
        ctx!.fill();
        for (let j = i + 1; j < particulas.length; j++) {
          const dx = particulas[i].x - particulas[j].x;
          const dy = particulas[i].y - particulas[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < maxDist) {
            ctx!.beginPath();
            ctx!.moveTo(particulas[i].x, particulas[i].y);
            ctx!.lineTo(particulas[j].x, particulas[j].y);
            ctx!.strokeStyle = `rgba(105,18,18,${0.12 * (1 - d / maxDist)})`;
            ctx!.lineWidth = 0.8;
            ctx!.stroke();
          }
        }
      }
      ctx!.restore();
      animId = requestAnimationFrame(desenhar);
    }

    const onMove = (e: MouseEvent) => {
      const rect = container!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    container.addEventListener("mousemove", onMove);
    container.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", resize);
    const observer = new ResizeObserver(resize);
    observer.observe(container);

    resize();
    particulas = Array.from({ length: 70 }, nova);
    desenhar();

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", resize);
    };
  }, [canvasRef, containerRef]);
}
