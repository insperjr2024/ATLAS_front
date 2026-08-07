import { useEffect, useMemo, useRef, useState } from "react";
import { theme } from "@/styles/theme";
import { Globe, NameSlot, Stage, Wire } from "./MembersGlobe.styled";

/**
 * O globo de nomes da tela de login — adaptado do globo de logos de
 * parceiros de outra plataforma da Jr, trocando "logo da empresa" por
 * "primeiro nome de um membro ativo" (vindo de `GET /auth/membros-nomes`,
 * ver `src/lib/auth.ts`). Mantém a mecânica 3D (esfera de Fibonacci,
 * arrasto com inércia, retorno automático) e o wireframe de meridianos;
 * o carrossel de depoimentos do componente original não faz parte disto.
 */

type Point = { x: number; y: number; z: number };

function fibonacciSphere(n: number): Point[] {
  const pts: Point[] = [];
  if (n <= 0) return pts;
  if (n === 1) return [{ x: 0, y: 1, z: 0 }];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = phi * i;
    pts.push({ x: Math.cos(theta) * radius, y, z: Math.sin(theta) * radius });
  }
  return pts;
}

/** N pontos igualmente espaçados na linha do equador (y = 0). */
function equatorPoints(n: number): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i < n; i++) {
    const theta = (i / n) * Math.PI * 2;
    pts.push({ x: Math.cos(theta), y: 0, z: Math.sin(theta) });
  }
  return pts;
}

/** Fixos, sempre no globo — o resto vem de `GET /auth/membros-nomes`. Um
 *  nome que colidisse com o do polo norte (José) durante a rotação some
 *  sozinho pelo sistema de colisão abaixo (prioridade + fade), então não
 *  precisa mais ficar de fora daqui por causa disso. */
const NOMES_FIXOS = ["Heloísa N.", "Henrique M.", "João V.", "Enzo P.", "Mateus L."];

/** Fixo no polo norte, fora da linha do equador dos outros fundadores. */
const NOME_POLO_NORTE = "José S.";

const R = 220;
const INITIAL_ANGLE = 0;
const INITIAL_TILT = -18;
const RETURN_DELAY = 10000;
const RETURN_DURATION = 1500;
const AUTO_ROT_SPEED = 12;
const FLING_DECAY_RATE = 1.6;
const FLING_SETTLE_THRESHOLD = 0.4;
const SEG = 32;

interface MembersGlobeProps {
  nomes: string[];
}

export function MembersGlobe({ nomes }: MembersGlobeProps) {
  const [angle, setAngle] = useState(0);
  const [tilt, setTilt] = useState(INITIAL_TILT);
  const [isDragging, setIsDragging] = useState(false);

  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(performance.now());
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragStartAngleRef = useRef(0);
  const dragStartTiltRef = useRef(0);
  const lastMoveXRef = useRef(0);
  const lastMoveTimeRef = useRef(0);
  const dragVelocityRef = useRef(0);
  const angularVelocityRef = useRef(AUTO_ROT_SPEED);
  // Visibilidade do frame anterior, pra dar histerese na colisão de nomes —
  // sem isso, um nome bem na borda do limiar pisca a cada pixel de diferença
  // durante o arrasto.
  const visivelAnteriorRef = useRef<Map<number, boolean>>(new Map());
  const returnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const returningRef = useRef(false);
  const returnStartRef = useRef(0);
  const returnFromTiltRef = useRef(0);
  const returnFromAngleRef = useRef(0);
  const returnToAngleRef = useRef(0);
  const tiltRef = useRef(tilt);
  const angleRef = useRef(angle);

  useEffect(() => {
    tiltRef.current = tilt;
  }, [tilt]);

  useEffect(() => {
    angleRef.current = angle;
  }, [angle]);

  // O laço de animação: rotação automática (some enquanto arrasta) +
  // desaceleração do "arremesso" depois de soltar + retorno suave da
  // inclinação após RETURN_DELAY parado.
  useEffect(() => {
    const tick = (now: number) => {
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      if (!draggingRef.current && !returningRef.current) {
        const v = angularVelocityRef.current;
        setAngle((a) => {
          let next = (a + v * dt) % 360;
          if (next < 0) next += 360;
          return next;
        });
        const target = AUTO_ROT_SPEED;
        const next = target + (v - target) * Math.exp(-dt * FLING_DECAY_RATE);
        angularVelocityRef.current =
          Math.abs(next - target) < FLING_SETTLE_THRESHOLD ? target : next;
      }
      if (returningRef.current) {
        const elapsed = now - returnStartRef.current;
        const t = Math.min(1, elapsed / RETURN_DURATION);
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        setTilt(returnFromTiltRef.current + (INITIAL_TILT - returnFromTiltRef.current) * eased);
        setAngle(
          returnFromAngleRef.current + (returnToAngleRef.current - returnFromAngleRef.current) * eased
        );
        if (t >= 1) {
          returningRef.current = false;
          angularVelocityRef.current = AUTO_ROT_SPEED;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!draggingRef.current) return;
      const now = performance.now();
      const dt = (now - lastMoveTimeRef.current) / 1000;
      if (dt > 0 && lastMoveTimeRef.current > 0) {
        const dxStep = e.clientX - lastMoveXRef.current;
        const v = (dxStep * 0.4) / dt;
        dragVelocityRef.current = dragVelocityRef.current * 0.6 + v * 0.4;
      }
      lastMoveXRef.current = e.clientX;
      lastMoveTimeRef.current = now;

      const dx = e.clientX - dragStartXRef.current;
      const dy = e.clientY - dragStartYRef.current;
      const nextAngle = (dragStartAngleRef.current + dx * 0.4) % 360;
      setAngle(nextAngle < 0 ? nextAngle + 360 : nextAngle);
      const nextTilt = Math.max(-85, Math.min(85, dragStartTiltRef.current + dy * 0.4));
      setTilt(nextTilt);
    }
    function onUp() {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setIsDragging(false);
      lastRef.current = performance.now();
      angularVelocityRef.current = Math.max(-1200, Math.min(1200, dragVelocityRef.current));
      if (returnTimerRef.current) clearTimeout(returnTimerRef.current);
      returnTimerRef.current = setTimeout(() => {
        returnFromTiltRef.current = tiltRef.current;
        // Caminho mais curto até o ângulo inicial (não dá a volta inteira
        // só porque o usuário girou "pro lado errado").
        const atual = angleRef.current;
        const delta = ((INITIAL_ANGLE - atual + 540) % 360) - 180;
        returnFromAngleRef.current = atual;
        returnToAngleRef.current = atual + delta;
        returnStartRef.current = performance.now();
        returningRef.current = true;
      }, RETURN_DELAY);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  function onPointerDown(e: React.PointerEvent) {
    e.preventDefault();
    if (returnTimerRef.current) {
      clearTimeout(returnTimerRef.current);
      returnTimerRef.current = null;
    }
    returningRef.current = false;
    draggingRef.current = true;
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragStartYRef.current = e.clientY;
    dragStartAngleRef.current = angle;
    dragStartTiltRef.current = tilt;
    lastMoveXRef.current = e.clientX;
    lastMoveTimeRef.current = performance.now();
    dragVelocityRef.current = 0;
  }

  /** Fixos na linha do equador + o resto da esfera pros nomes vindos do
   *  banco — duas distribuições distintas, uma lista só de pontos. */
  const entries = useMemo(() => {
    const fixos = equatorPoints(NOMES_FIXOS.length).map((p, i) => ({
      ponto: p,
      nome: NOMES_FIXOS[i],
      fixo: true,
    }));
    const poloNorte = { ponto: { x: 0, y: 1, z: 0 }, nome: NOME_POLO_NORTE, fixo: true };
    const dinamicos = fibonacciSphere(nomes.length).map((p, i) => ({
      ponto: p,
      nome: nomes[i],
      fixo: false,
    }));
    return [...fixos, poloNorte, ...dinamicos];
  }, [nomes]);

  const angleRad = (angle * Math.PI) / 180;
  const tiltRad = (tilt * Math.PI) / 180;
  const cosA = Math.cos(angleRad);
  const sinA = Math.sin(angleRad);
  const cosT = Math.cos(tiltRad);
  const sinT = Math.sin(tiltRad);

  function project(px: number, py: number, pz: number) {
    const x = px * cosA + pz * sinA;
    const z = -px * sinA + pz * cosA;
    const y2 = py * cosT - z * sinT;
    const z2 = py * sinT + z * cosT;
    return { x: x * R, y: -y2 * R, z: z2 };
  }

  const placed = entries.map((entry, i) => {
    const proj = project(entry.ponto.x, entry.ponto.y, entry.ponto.z);
    const depth = (proj.z + 1) / 2;
    const eased = Math.pow(depth, 1.6);
    const scale = 0.55 + eased * 0.85;
    const opacity = 0.12 + eased * 0.88;
    const blur = (1 - depth) * 2.2;
    const zIndex = Math.round(proj.z * 1000);
    // Estimativa de largura do rótulo (não temos medida real de texto aqui)
    // pra decidir colisão — negrito dos fixos é um pouco mais largo por letra.
    const largura = entry.nome.length * (entry.fixo ? 8.5 : 7.5) + 14;
    return {
      idx: i,
      left: proj.x,
      top: proj.y,
      scale,
      opacity,
      blur,
      zIndex,
      largura,
      nome: entry.nome,
      fixo: entry.fixo,
    };
  });

  // Nenhum nome pode sobrepor outro: prioridade pros fixos, depois por
  // ordem fixa de índice — cada candidato só fica visível se não colidir
  // (bounding box) com um rótulo de prioridade maior que já ficou.
  //
  // A prioridade NÃO pode depender de profundidade (z): dois nomes cruzando
  // caminho têm profundidades quase iguais, e um empate que troca de lado a
  // cada frame troca o "vencedor" da colisão — cada um pisca no lugar do
  // outro, mesmo com a histerese abaixo (que só protege contra o PRÓPRIO
  // limiar de cada nome, não contra trocar de vencedor). Índice fixo garante
  // que, entre dois que colidem, sempre é o mesmo que aparece.
  //
  // Com histerese: o limiar pra ESCONDER quem já estava visível é mais
  // apertado, e pra MOSTRAR quem já estava escondido é mais largo — sem
  // isso, um nome bem em cima da borda do limiar pisca a cada frame durante
  // o arrasto (a posição varia 1px e ele cruza o limiar pra lá e pra cá).
  const HISTERESE = 10;
  const visivelAntes = visivelAnteriorRef.current;
  const visiveis = new Set<number>();
  const porPrioridade = [...placed].sort((a, b) => {
    if (a.fixo !== b.fixo) return a.fixo ? -1 : 1;
    return a.idx - b.idx;
  });
  for (const candidato of porPrioridade) {
    const estavaVisivel = visivelAntes.get(candidato.idx) ?? true;
    const ajuste = estavaVisivel ? -HISTERESE : HISTERESE;
    const colide = [...visiveis].some((idx) => {
      const v = placed[idx];
      const folgaX = (candidato.largura + v.largura) / 2 + 6 + ajuste;
      const folgaY = 22 + ajuste;
      return Math.abs(candidato.left - v.left) < folgaX && Math.abs(candidato.top - v.top) < folgaY;
    });
    if (!colide) visiveis.add(candidato.idx);
  }
  visivelAnteriorRef.current = new Map(placed.map((it) => [it.idx, visiveis.has(it.idx)]));

  const meridianLines = useMemo(() => {
    const lines: { d: string; key: string }[] = [];
    const count = 8;
    for (let m = 0; m < count; m++) {
      const phi = (m / count) * Math.PI * 2;
      const cosP = Math.cos(phi);
      const sinP = Math.sin(phi);
      const pts: string[] = [];
      for (let s = 0; s <= SEG; s++) {
        const lat = -Math.PI / 2 + (s / SEG) * Math.PI;
        const r = Math.cos(lat);
        const proj = project(r * cosP, Math.sin(lat), r * sinP);
        pts.push(`${proj.x.toFixed(2)},${proj.y.toFixed(2)}`);
      }
      lines.push({ d: `M ${pts.join(" L ")}`, key: `mer-${m}` });
    }
    return lines;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [angle, tilt]);

  const parallelLines = useMemo(() => {
    const lines: { d: string; key: string }[] = [];
    const count = 5;
    for (let p = 1; p < count; p++) {
      const lat = -Math.PI / 2 + (p / count) * Math.PI;
      const r = Math.cos(lat);
      const py = Math.sin(lat);
      const pts: string[] = [];
      for (let s = 0; s <= SEG; s++) {
        const lon = (s / SEG) * Math.PI * 2;
        const proj = project(r * Math.cos(lon), py, r * Math.sin(lon));
        pts.push(`${proj.x.toFixed(2)},${proj.y.toFixed(2)}`);
      }
      lines.push({ d: `M ${pts.join(" L ")} Z`, key: `par-${p}` });
    }
    return lines;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [angle, tilt]);

  return (
    <Stage>
      <Globe
        $dragging={isDragging}
        onPointerDown={onPointerDown}
        style={{ width: R * 2, height: R * 2 }}
      >
        <Wire viewBox={`${-R} ${-R} ${R * 2} ${R * 2}`} width={R * 2} height={R * 2}>
          <circle
            cx="0"
            cy="0"
            r={R}
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.5"
            strokeWidth="1"
          />
          {parallelLines.map(({ d, key }) => (
            <path key={key} d={d} fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1" />
          ))}
          {meridianLines.map(({ d, key }) => (
            <path key={key} d={d} fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1" />
          ))}
        </Wire>

        {placed.map((it) => (
          <NameSlot
            key={it.idx}
            style={{
              transform: `translate(-50%, -50%) translate3d(${it.left}px, ${it.top}px, 0) scale(${it.scale})`,
              opacity: visiveis.has(it.idx) ? it.opacity : 0,
              filter: it.blur > 0.05 ? `blur(${it.blur.toFixed(2)}px)` : "none",
              zIndex: it.zIndex,
              fontWeight: it.fixo ? theme.fontWeight.bold : theme.fontWeight.medium,
            }}
          >
            {it.nome}
          </NameSlot>
        ))}
      </Globe>
    </Stage>
  );
}
