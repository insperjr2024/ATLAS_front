/**
 * Trava o pinch-zoom no celular.
 *
 * A meta viewport do `index.html` já traz `maximum-scale=1, user-scalable=no`,
 * e isso basta no Android. O Safari do iOS ignora `user-scalable=no` desde o
 * iOS 10 (foi uma decisão deliberada da Apple, por acessibilidade), então lá a
 * trava precisa ser feita no evento. Daí este arquivo existir.
 *
 * Por que travar: dar zoom out desmonta a organização das telas. Elas são
 * pensadas para caber na largura da viewport — sidebar em drawer, tabelas com
 * rolagem própria, boards com scroll-snap —, não para serem lidas de longe.
 *
 * O preço é conhecido: isto fere a WCAG 1.4.4. Só se sustenta porque o resto do
 * app não depende de zoom para ser lido. Se alguma tela voltar a estourar a
 * viewport, a decisão certa é consertar a tela, não afrouxar isto aqui.
 */

/**
 * Eventos `gesture*` são proprietários do WebKit e não existem no lib.dom, por
 * isso a assinatura genérica de `Event`.
 */
const EVENTOS_GESTO = ["gesturestart", "gesturechange", "gestureend"] as const;

function impedir(evento: Event) {
  evento.preventDefault();
}

/**
 * Dois dedos ou mais é pinça; um dedo é rolagem, e bloquear isso mataria a
 * navegação da página inteira. É essa checagem que separa os dois casos.
 *
 * `passive: false` no listener não é detalhe: sem ele o navegador assume que o
 * handler não vai chamar `preventDefault()`, e ignora a chamada em silêncio.
 */
function impedirPinca(evento: TouchEvent) {
  if (evento.touches.length > 1) {
    evento.preventDefault();
  }
}

/**
 * Duplo toque também amplia no iOS. O `touch-action: manipulation` do
 * `index.css` já cobre a maioria dos casos; isto é o cinto além do suspensório,
 * porque o Safari volta a aceitar o duplo toque em elementos que ganham
 * `touch-action` próprio (os containers com rolagem horizontal, por exemplo).
 */
function impedirDuploToque(evento: Event) {
  const alvo = evento.target as HTMLElement | null;
  // Um duplo clique dentro de um campo de texto é seleção de palavra, e é
  // legítimo: bloquear ali atrapalharia editar o que já foi digitado.
  if (alvo?.closest("input, textarea, [contenteditable]")) return;
  evento.preventDefault();
}

/**
 * Registra os bloqueios. Deve ser chamada uma única vez, antes do `createRoot`.
 * Devolve uma função de limpeza — usada só em teste, a aplicação nunca desmonta.
 */
export function travarZoom(): () => void {
  for (const nome of EVENTOS_GESTO) {
    document.addEventListener(nome, impedir, { passive: false });
  }
  document.addEventListener("touchmove", impedirPinca, { passive: false });
  document.addEventListener("dblclick", impedirDuploToque, { passive: false });

  return () => {
    for (const nome of EVENTOS_GESTO) {
      document.removeEventListener(nome, impedir);
    }
    document.removeEventListener("touchmove", impedirPinca);
    document.removeEventListener("dblclick", impedirDuploToque);
  };
}
