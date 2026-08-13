import styled from "styled-components";
import { theme } from "@/styles/theme";

export const VagasGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr));
  gap: ${theme.spacing.md};
`;

/** Cartão do projeto. Sem vaga fica esmaecido em vez de sumir, a pessoa
 *  precisa ver que o projeto existe e está cheio. */
export const ProjetoCard = styled.button<{ $indisponivel: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md};
  text-align: left;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.card};
  font: inherit;
  cursor: ${({ $indisponivel }) => ($indisponivel ? "default" : "pointer")};
  opacity: ${({ $indisponivel }) => ($indisponivel ? 0.6 : 1)};
  transition: border-color 0.12s ease, box-shadow 0.12s ease;

  &:hover {
    border-color: ${({ $indisponivel }) =>
      $indisponivel ? theme.colors.border : theme.colors.primary};
    box-shadow: ${({ $indisponivel }) => ($indisponivel ? "none" : theme.shadows.sm)};
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 2px;
  }
`;

export const CardTopo = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
`;

export const CardNome = styled.span`
  font-size: ${theme.fontSize.base};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.cardForeground};
`;

export const CardCliente = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

export const CardLinha = styled.span`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;

/** As bolinhas de vaga: preenchida = ocupada, vazia = livre. Um número seco
 *  ("1/3") diz o mesmo, mas isto se lê sem processar. */
export const Vagas = styled.div`
  display: flex;
  gap: 0.25rem;
  align-items: center;
`;

export const Bolinha = styled.span<{ $ocupada: boolean }>`
  width: 0.625rem;
  height: 0.625rem;
  border-radius: ${theme.borderRadius.full};
  border: 1px solid
    ${({ $ocupada }) => ($ocupada ? theme.colors.primary : theme.colors.border)};
  background: ${({ $ocupada }) => ($ocupada ? theme.colors.primary : "transparent")};
`;

/** As frentes do projeto, logo abaixo do nome: é a primeira coisa que diz
 *  se o projeto tem a ver com quem está olhando. */
export const FrentesRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
`;

export const Impedimento = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  font-style: italic;
`;

/* ------------------------------------------------------------------ */
/* Solicitações recebidas                                               */
/* ------------------------------------------------------------------ */

export const PedidoCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.card};

  & + & {
    margin-top: ${theme.spacing.sm};
  }
`;

export const PedidoTopo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
  flex-wrap: wrap;
`;

/** A justificativa é o que o coordenador vem ler, destacada, não escondida
 *  numa linha de meta. */
export const Justificativa = styled.blockquote`
  margin: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-left: 3px solid ${theme.colors.primary};
  background: ${theme.colors.muted};
  border-radius: 0 ${theme.borderRadius.md} ${theme.borderRadius.md} 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.cardForeground};
  white-space: pre-wrap;
`;

export const PedidoAcoes = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  flex-wrap: wrap;
`;

/* ------------------------------------------------------------------ */
/* Tela da gestão: filtros e alocação direta                           */
/* ------------------------------------------------------------------ */

/**
 * A barra de filtros da página.
 *
 * **Os campos não crescem.** Com `flex: 1 1`, um seletor sozinho esticava
 * de ponta a ponta do card, uma faixa larguíssima para escolher entre cinco
 * frentes. Largura fixa de 14rem cabe o nome de frente e de projeto sem
 * reticências e sem virar paisagem.
 *
 * **O respiro embaixo é maior que o de dentro.** A barra encostava na
 * grade, e ao filtrar uma frente o agrupamento sumia e os cartões subiam
 * quase até o seletor. O `margin-bottom` separa o controle do resultado —
 * são coisas diferentes e precisam parecer diferentes.
 *
 * No celular os campos voltam a ocupar a linha inteira: ali largura fixa
 * sobraria de um lado e faltaria do outro.
 */
export const LinhaDeCampos = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};

  & > * {
    flex: 0 1 14rem;
    min-width: 0;
  }

  @media (max-width: ${theme.breakpoints.sm}px) {
    & > * {
      flex: 1 1 100%;
    }
  }
`;

/** Separa a caixa de alocar do restante da lista, que é outra tarefa. */
export const BlocoAlocar = styled.div`
  padding: ${theme.spacing.md};
  border: 1px dashed ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing.lg};
`;

export const ContagemFiltro = styled.p`
  margin: ${theme.spacing.sm} 0 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;

/* ------------------------------------------------------------------ */
/* Visão do coordenador: os projetos dele, só leitura                  */
/* ------------------------------------------------------------------ */

/**
 * A tela responde a duas perguntas ("quem está no time?" e "quem quer
 * entrar?") e não aceita nenhuma ação. Por isso nada aqui tem hover, cursor
 * de clique ou sombra de elevação: dar aparência de clicável a um cartão que
 * não faz nada é a forma mais rápida de a pessoa achar que a tela quebrou.
 */
export const CoordLista = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

export const CoordCard = styled.article`
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.card};
  overflow: hidden;
`;

/**
 * O título envolve o botão, mesmo padrão de acordeão da lista da gestão:
 * o `h3` mantém o projeto na estrutura de cabeçalhos, o `button` carrega a
 * interação, e nenhum dos dois fica dentro do outro de forma inválida.
 */
export const CoordCabecalhoTitulo = styled.h3`
  margin: 0;
  font-size: inherit;
  font-weight: inherit;
`;

/**
 * Faixa de identificação, e também o que abre e fecha o cartão.
 *
 * Ela continua sendo o resumo do projeto, nome, cliente, status, frentes e
 * ocupação, então serve de conteúdo fechado sem precisar de uma linha
 * separada só para o título. O corpo com time e pedidos é que colapsa.
 */
export const CoordCabecalho = styled.button`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  background: ${theme.colors.secondary};
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background ${theme.transitions.fast};

  &:hover {
    background: ${theme.colors.muted};
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.ring};
    outline-offset: -2px;
  }
`;

/** Alinhada com a primeira linha do nome, não com o centro do bloco: o
 *  cartão tem três linhas de identidade e a seta centralizada flutuaria. */
export const CoordSeta = styled.span`
  flex-shrink: 0;
  display: inline-flex;
  padding-top: 0.125rem;
  color: ${theme.colors.mutedForeground};
`;

/** A seta e o bloco de identidade andam juntos à esquerda. */
export const CoordIdentidadeLinha = styled.span`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: ${theme.spacing.sm};
`;

export const CoordIdentidade = styled.span`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

export const CoordNome = styled.span`
  font-size: ${theme.fontSize.base};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.cardForeground};
  line-height: 1.3;
`;

export const CoordCliente = styled.span`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;

export const CoordTags = styled.span`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.xs};
  margin-top: ${theme.spacing.xs};
`;

/**
 * A ocupação fica alinhada à direita e com números tabulares: é a coluna que
 * o coordenador compara entre projetos, e dígito de largura variável faz
 * "1/3" e "2/3" dançarem na vertical.
 */
export const CoordOcupacao = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: ${theme.spacing.xs};
  font-variant-numeric: tabular-nums;

  @media (max-width: ${theme.breakpoints.sm}px) {
    align-items: flex-start;
  }
`;

export const CoordContagem = styled.span`
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.cardForeground};
`;

/** A barra é redundante de propósito, o número ao lado é a fonte da verdade
 *  para quem usa leitor de tela, e por isso ela fica `aria-hidden`. */
export const CoordBarraTrilho = styled.span`
  display: block;
  width: 7rem;
  height: 0.375rem;
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.border};
  overflow: hidden;
`;

export const CoordBarraPreenchida = styled.span<{ $proporcao: number; $cheio: boolean }>`
  display: block;
  width: ${({ $proporcao }) => Math.round($proporcao * 100)}%;
  height: 100%;
  border-radius: inherit;
  background: ${({ $cheio }) => ($cheio ? theme.colors.success : theme.colors.info)};
  transition: width ${theme.transitions.normal};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/**
 * Duas colunas em tela larga, empilhadas no celular.
 *
 * Colunas explícitas em vez de `auto-fit`: com a divisória entre elas, o
 * ponto de quebra precisa ser conhecido, `auto-fit` decide sozinho quantas
 * colunas cabem, e a linha ora apareceria na vertical, ora na horizontal, sem
 * a media query saber qual dos dois casos está na tela.
 *
 * O `minmax(0, 1fr)` impede que nome longo estoure a coluna em vez de quebrar.
 */
export const CoordCorpo = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: ${theme.spacing.lg};
  padding: ${theme.spacing.md};

  @media (max-width: ${theme.breakpoints.md}px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/**
 * A divisória entre "Time" e "Pedidos". Fica na SEGUNDA coluna e não como
 * borda do contêiner: assim ela existe só quando há de fato duas colunas, e
 * vira linha horizontal quando o cartão empilha, em vez de sumir.
 *
 * O respiro é igual dos dois lados, o `gap` da grade antes da linha, o
 * `padding` depois dela.
 */
export const CoordColuna = styled.section`
  min-width: 0;

  & + & {
    padding-left: ${theme.spacing.lg};
    border-left: 1px solid ${theme.colors.border};
  }

  @media (max-width: ${theme.breakpoints.md}px) {
    & + & {
      padding-left: 0;
      padding-top: ${theme.spacing.lg};
      border-left: none;
      border-top: 1px solid ${theme.colors.border};
    }
  }
`;

export const CoordColunaTitulo = styled.h4`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  margin: 0 0 ${theme.spacing.sm};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${theme.colors.mutedForeground};
`;

export const CoordPessoa = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.xs} 0;
  min-width: 0;
`;

/**
 * Iniciais em vez de foto: o sistema não guarda avatar, e um círculo com
 * inicial dá âncora visual para percorrer a lista sem ler nome por nome.
 */
export const CoordAvatar = styled.span<{ $destaque?: boolean }>`
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.semibold};
  background: ${({ $destaque }) =>
    $destaque ? theme.alpha(theme.colors.primary, 0.12) : theme.colors.muted};
  color: ${({ $destaque }) =>
    $destaque ? theme.colors.primary : theme.colors.mutedForeground};
`;

export const CoordPessoaNome = styled.span`
  flex: 1;
  min-width: 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.cardForeground};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const CoordPapel = styled.span`
  flex-shrink: 0;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

/** As vagas restantes aparecem como lugares vazios na lista do time: a
 *  ausência fica visível, em vez de virar um número que ninguém soma. */
export const CoordVaga = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.xs} 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;

export const CoordVagaMarca = styled.span`
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: ${theme.borderRadius.full};
  border: 1px dashed ${theme.colors.border};
`;

export const CoordPedido = styled.div`
  padding: ${theme.spacing.sm} 0;

  & + & {
    border-top: 1px solid ${theme.colors.border};
  }
`;

export const CoordPedidoTopo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
`;

export const CoordPedidoMeta = styled.span`
  display: block;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

/** Limite de linha para a justificativa continuar legível, texto corrido de
 *  ponta a ponta da coluna é onde o olho se perde ao voltar para a esquerda. */
export const CoordJustificativa = styled.p`
  margin: ${theme.spacing.xs} 0 0;
  max-width: 60ch;
  font-size: ${theme.fontSize.sm};
  line-height: 1.6;
  color: ${theme.colors.cardForeground};
`;

export const CoordVazio = styled.p`
  margin: 0;
  padding: ${theme.spacing.sm} 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;

/* ------------------------------------------------------------------ */
/* Fila de solicitações e histórico                                    */
/* ------------------------------------------------------------------ */

/**
 * As duas abas são a MESMA lista recortada por status, e por isso partilham
 * o agrupamento por projeto. O que muda é o peso: a fila é feita para agir
 * (cartão com ar, ação visível), o histórico para consultar (linhas densas,
 * sem botão).
 */
/**
 * Cada projeto é um bloco que abre e fecha.
 *
 * Com tudo aberto a página crescia por projeto E por pedido: dez projetos com
 * cinco pedidos cada davam cinquenta cartões numa rolagem só, e achar o
 * projeto certo virava caça. Fechado, cada projeto ocupa uma linha e a página
 * inteira cabe na tela, quem decide escolhe onde entrar.
 */
export const SolGrupo = styled.section`
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  overflow: hidden;

  & + & {
    margin-top: ${theme.spacing.sm};
  }
`;

/**
 * O título envolve o botão, e não o contrário.
 *
 * É o padrão de acordeão do ARIA: o `h3` mantém o projeto na estrutura de
 * cabeçalhos (leitor de tela navega de projeto em projeto) e o `button`
 * carrega a interação. Colocar o `h3` DENTRO do botão seria HTML inválido —
 * botão só aceita conteúdo de frase.
 */
export const SolGrupoCabecalho = styled.h3`
  margin: 0;
  font-size: inherit;
  font-weight: inherit;
`;

/** O cabeçalho é o botão inteiro, e não só a seta: alvo pequeno num item de
 *  lista é o tipo de coisa que faz errar o clique no celular. */
export const SolGrupoBotao = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: none;
  background: ${theme.colors.secondary};
  text-align: left;
  cursor: pointer;
  transition: background ${theme.transitions.fast};

  &:hover {
    background: ${theme.colors.muted};
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.ring};
    outline-offset: -2px;
  }
`;

export const SolGrupoTitulo = styled.span`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.cardForeground};
`;

export const SolGrupoFrentes = styled.span`
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.normal};
  color: ${theme.colors.mutedForeground};
`;

/** A contagem fica no cabeçalho porque é ela que decide se vale abrir. */
export const SolGrupoContagem = styled.span`
  flex-shrink: 0;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.mutedForeground};
  font-variant-numeric: tabular-nums;
`;

export const SolGrupoSeta = styled.span`
  flex-shrink: 0;
  display: inline-flex;
  color: ${theme.colors.mutedForeground};
`;

export const SolGrupoConteudo = styled.div`
  padding: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.border};
`;

/**
 * O pedido pendente é um cartão: ele pede uma decisão, e decisão precisa de
 * ar em volta para não ser tomada por engano no meio de uma lista corrida.
 */
export const SolCard = styled.article`
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.card};

  & + & {
    margin-top: ${theme.spacing.sm};
  }
`;

export const SolTopo = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
`;

export const SolNome = styled.span`
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.cardForeground};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const SolQuando = styled.time`
  flex-shrink: 0;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
  font-variant-numeric: tabular-nums;
`;

export const SolMeta = styled.p`
  margin: 0.125rem 0 0;
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

/** A justificativa é o texto que embasa a decisão, limite de linha para não
 *  virar uma faixa de ponta a ponta que o olho perde ao voltar. */
export const SolTexto = styled.p`
  margin: ${theme.spacing.sm} 0 0;
  max-width: 65ch;
  font-size: ${theme.fontSize.sm};
  line-height: 1.6;
  color: ${theme.colors.cardForeground};
`;

export const SolAcoes = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.md};
  padding-top: ${theme.spacing.sm};
  border-top: 1px solid ${theme.colors.border};
`;

/* --- histórico: mesma informação, densidade de consulta --- */

export const HistLista = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const HistItem = styled.li`
  padding: ${theme.spacing.sm} 0;

  & + & {
    border-top: 1px solid ${theme.colors.border};
  }
`;

export const HistTopo = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
`;

/**
 * O desfecho em palavra, com cor de apoio. Não é pílula: numa lista longa,
 * uma caixa colorida por linha vira serrilhado e compete com o nome, que é
 * o que se procura ao varrer o histórico.
 */
export const HistDesfecho = styled.span<{ $aprovada: boolean }>`
  flex-shrink: 0;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${({ $aprovada }) =>
    $aprovada ? theme.colors.success : theme.colors.mutedForeground};
`;

/** Duas linhas e corta: no histórico a justificativa é contexto, não a
 *  decisão, quem precisa do texto inteiro procura o pedido, não a lista. */
export const HistTexto = styled.p`
  margin: ${theme.spacing.xs} 0 0;
  max-width: 65ch;
  font-size: ${theme.fontSize.xs};
  line-height: 1.5;
  color: ${theme.colors.mutedForeground};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/* ------------------------------------------------------------------ */
/* Grade da gestão: projetos agrupados por frente                      */
/* ------------------------------------------------------------------ */

export const GrupoFrente = styled.section`
  & + & {
    margin-top: ${theme.spacing.xl};
  }
`;

/**
 * O título do grupo carrega a contagem porque os grupos vêm ordenados por
 * ela: sem o número, a ordem pareceria arbitrária para quem chega na tela.
 */
export const GrupoFrenteTitulo = styled.h3`
  display: flex;
  align-items: baseline;
  gap: ${theme.spacing.sm};
  margin: 0 0 ${theme.spacing.sm};
  padding-bottom: ${theme.spacing.xs};
  border-bottom: 1px solid ${theme.colors.border};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.cardForeground};
`;

export const GrupoFrenteContagem = styled.span`
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.normal};
  color: ${theme.colors.mutedForeground};
`;

/* ------------------------------------------------------------------ */
/* Painel lateral de alocação                                          */
/* ------------------------------------------------------------------ */

/**
 * Painel lateral, e não modal centralizado: a grade de projetos fica visível
 * atrás enquanto se aloca, que é o que permite comparar "este está cheio,
 * aquele não" sem fechar e reabrir.
 */
export const PainelOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 40;
  background: rgb(0 0 0 / 0.4);
`;

export const PainelLateral = styled.aside`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  width: min(28rem, 100vw);
  display: flex;
  flex-direction: column;
  background: ${theme.colors.card};
  border-left: 1px solid ${theme.colors.border};
  box-shadow: ${theme.shadows.lg};
  animation: entrar ${theme.transitions.normal};

  @keyframes entrar {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/**
 * O nome do projeto e a ocupação, um sobre o outro.
 *
 * `CardNome` e `CardLinha` são spans inline, soltos no cabeçalho eles
 * encostavam um no outro e o texto saía "Fluxo Orion2 de 3 consultores".
 * Empilhar resolve sem depender de `<br>` nem de espaço fabricado.
 */
export const PainelTitulo = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

export const PainelCabecalho = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border};
`;

export const PainelFechar = styled.button`
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border: none;
  border-radius: ${theme.borderRadius.md};
  background: transparent;
  color: ${theme.colors.mutedForeground};
  cursor: pointer;
  transition: background ${theme.transitions.fast}, color ${theme.transitions.fast};

  &:hover {
    background: ${theme.colors.muted};
    color: ${theme.colors.foreground};
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.ring};
    outline-offset: 2px;
  }
`;

/** Os filtros ficam fora da área rolável: some do campo de visão bem quando a
 *  lista fica longa é justamente quando ele é mais necessário. */
export const PainelFiltros = styled.div`
  padding: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border};
`;

export const PainelCorpo = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${theme.spacing.md};
`;

export const PainelGrupo = styled.div`
  & + & {
    margin-top: ${theme.spacing.lg};
  }
`;

export const PainelGrupoTitulo = styled.h4`
  margin: 0 0 ${theme.spacing.xs};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${theme.colors.mutedForeground};
`;

/**
 * A lista de candidatos.
 *
 * Cada pessoa ocupa DUAS linhas e nada mais: o nome e uma linha de apoio em
 * texto corrido. A versão anterior empilhava carga, pílula de situação,
 * posição e "pediu" como quatro etiquetas soltas na mesma linha, quatro
 * caixas coloridas por pessoa, vinte pessoas, e a única coisa que a tela
 * precisava responder ("quem está mais livre?") sumia no meio.
 *
 * `ul`/`li` de verdade: é uma lista, e leitor de tela anuncia o tamanho dela.
 */
export const CandidatoLista = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const CandidatoLinha = styled.li`
  padding: ${theme.spacing.sm} 0;
  min-width: 0;

  & + & {
    border-top: 1px solid ${theme.colors.border};
  }
`;

/** A linha em si. A lista de projetos, quando aberta, cai por baixo dela. */
export const CandidatoTopo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  min-width: 0;
`;

/**
 * "3 projetos" clicável.
 *
 * Botão de verdade, com aparência de texto: precisa de teclado e de
 * `aria-expanded`, e um `span` com `onClick` não dá nenhum dos dois. A seta
 * é o que avisa que há algo a abrir, sem ela a única pista seria o cursor,
 * que não existe no celular.
 */
export const BotaoDeTexto = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.15rem;
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
  transition: color ${theme.transitions.fast};

  &:hover {
    color: ${theme.colors.foreground};
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.ring};
    outline-offset: 2px;
    border-radius: ${theme.borderRadius.sm};
  }
`;

/** Os projetos da pessoa, recuados para se lerem como detalhe da linha. */
export const CandidatoProjetos = styled.ul`
  margin: ${theme.spacing.xs} 0 0;
  padding: ${theme.spacing.xs} 0 0 ${theme.spacing.md};
  list-style: none;
  border-top: 1px dashed ${theme.colors.border};

  li {
    font-size: ${theme.fontSize.xs};
    color: ${theme.colors.mutedForeground};
    line-height: 1.6;
  }
`;


export const CandidatoInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

export const CandidatoNome = styled.span`
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.cardForeground};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** Linha de apoio: "3 projetos · Carga alta". Texto, não etiquetas. */
export const CandidatoMeta = styled.span`
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.mutedForeground};
`;

/**
 * A situação dentro da linha de apoio. A cor reforça, mas quem carrega o
 * significado é a palavra, "Carga alta" continua legível em preto e branco,
 * e por isso ela é `<strong>` e não um ponto colorido.
 */
export const CandidatoSituacao = styled.strong<{ $tom: "ok" | "atencao" | "alerta" | "neutro" }>`
  font-weight: ${theme.fontWeight.medium};
  color: ${({ $tom }) =>
    $tom === "alerta"
      ? theme.colors.destructive
      : $tom === "atencao"
        ? theme.colors.warningForeground
        : theme.colors.mutedForeground};
`;

/** Cabeçalho de seção do painel ("Pediram para entrar", "Disponíveis"). */
export const PainelSecaoTitulo = styled.h4`
  margin: 0 0 ${theme.spacing.xs};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${theme.colors.mutedForeground};
`;

export const PainelSecao = styled.section`
  & + & {
    margin-top: ${theme.spacing.lg};
    padding-top: ${theme.spacing.lg};
    border-top: 1px solid ${theme.colors.border};
  }
`;

/**
 * A carga do solicitante na tela de decisão — badge, não linha de apoio.
 *
 * ⭐ **É a informação que decide o pedido.** Quem aprova precisa saber em
 * quantos projetos a pessoa já está antes de colocá-la em mais um; a
 * justificativa diz por que ela quer entrar, não se ela cabe. Como linha de
 * meta cinza, do mesmo tamanho da data, essa informação passava batido.
 *
 * ⚠ O vermelho vem do `tom` da escala de `situacao_carga`, e nunca de um
 * número cravado aqui. A diretoria edita o limiar de "Demanda alta" nas
 * configurações — hoje 3 — e o destaque tem de seguir essa decisão sozinho.
 * Um `>= 3` no front voltaria a ser a régua paralela que o núcleo acabou de
 * remover do backend.
 */
export const CargaBadge = styled.span<{ $alerta: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  align-self: flex-start;

  margin: 0.25rem 0 0;
  padding: 0.25rem 0.5rem;
  border-radius: ${theme.borderRadius.md};

  font-size: ${theme.fontSize.xs};
  font-weight: ${({ $alerta }) =>
    $alerta ? theme.fontWeight.semibold : theme.fontWeight.medium};

  color: ${({ $alerta }) =>
    $alerta ? theme.colors.destructive : theme.colors.mutedForeground};
  background: ${({ $alerta }) =>
    $alerta ? "hsl(0, 72%, 51%, 0.1)" : theme.colors.muted};
  border: 1px solid
    ${({ $alerta }) => ($alerta ? "hsl(0, 72%, 51%, 0.35)" : "transparent")};

  svg {
    flex-shrink: 0;
  }
`;

/** O complemento do badge: o que a carga significa para quem decide. */
export const CargaRecado = styled.span`
  font-weight: ${theme.fontWeight.normal};
  opacity: 0.9;
`;
