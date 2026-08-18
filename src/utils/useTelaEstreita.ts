import { useEffect, useState } from "react";
import { theme } from "@/styles/theme";

/**
 * `true` enquanto a viewport estiver abaixo do breakpoint dado.
 *
 * ⚠ Último recurso. Quase tudo que muda com a largura da tela é CSS, e media
 * query não re-renderiza componente nenhum. Este hook existe para o punhado de
 * casos em que a medida chega como PROP e não como estilo — o recharts recebe
 * `width`/`height` como número, e nenhuma media query alcança isso.
 *
 * `ate` é lido uma vez na montagem para o valor inicial; passe uma constante,
 * não um valor que muda durante a vida do componente.
 */
export function useTelaEstreita(ate: number = theme.breakpoints.md): boolean {
  const consulta = `(max-width: ${ate - 1}px)`;
  const [estreita, setEstreita] = useState(() => window.matchMedia(consulta).matches);

  useEffect(() => {
    const mq = window.matchMedia(consulta);
    const aoMudar = (evento: MediaQueryListEvent) => setEstreita(evento.matches);
    mq.addEventListener("change", aoMudar);
    return () => mq.removeEventListener("change", aoMudar);
  }, [consulta]);

  return estreita;
}
