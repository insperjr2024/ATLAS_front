import styled, { css } from "styled-components";
import { theme } from "@/styles/theme";
import { DayCell, MonthGrid } from "@/components/calendario/CalendarGrid.styled";
import { COR_NAO_UTIL } from "./cores";

export const CronogramaScroll = styled.div<{ $semScrollProprio?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
  padding-right: ${theme.spacing.sm};

  /* O teto de altura existe para o cronograma, onde a legenda fica grudada ao
     lado e precisa continuar visível enquanto se rola o calendário.
     Onde não há legenda ao lado, ele só produz scroll dentro de scroll — e aí
     quem rola é a página. */
  ${({ $semScrollProprio }) =>
    !$semScrollProprio &&
    css`
      max-height: 60vh;
      overflow-y: auto;
    `}

  /* Enquanto arrasta, a seleção de texto nativa sobre a grade é o item nº 1
     que faz um drag caseiro parecer quebrado. O touch-action impede o
     navegador móvel de rolar em vez de pintar. */
  user-select: none;
  touch-action: none;

  /* Durante o export, o container não pode estar cortado nem rolado.
     Atenção: seletor de DESCENDENTE, e não "&.exportando": a classe é aplicada no
     wrapper que envolve grade + legenda (CronogramaLayout), não neste
     elemento. Com "&.exportando" a regra nunca casava, e o PNG saía cortado
     na altura do scroll. */
  .exportando & {
    max-height: none;
    overflow: visible;
  }
`;

export const BlocoMes = styled(MonthGrid)`
  /* Atenção: "CronogramaScroll" é um flex column com max-height. Sem o shrink: 0, o
     flex COMPRIME os blocos para caberem em 60vh em vez de deixar o container
     rolar — as semanas viram tiras de poucos pixels e os números do dia se
     sobrepõem. O bloco tem altura de conteúdo; quem rola é o pai. */
  flex-shrink: 0;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  overflow: hidden;
  background: ${theme.colors.background};
`;

/**
 * As linhas da grade do cronograma têm colunas variáveis: 7 nas visões de mês
 * e semana, 1 na de dia.
 *
 * Atenção: não reaproveitam a `WeekRow` da primitiva de propósito. Ela traz
 * "flex: 1; min-height: 0", que serve ao calendário de bancas (um mês
 * preenchendo altura fixa) e aqui só faz a linha colapsar abaixo do conteúdo.
 */
export const CabecalhoDias = styled.div<{ $colunas: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $colunas }) => $colunas}, 1fr);
  border-bottom: 1px solid ${theme.colors.border};
`;

export const LinhaDias = styled.div<{ $colunas: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $colunas }) => $colunas}, 1fr);
`;

export const TituloMes = styled.h3`
  margin: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  text-transform: capitalize;
  color: ${theme.colors.foreground};
  background: ${theme.colors.secondary};
  border-bottom: 1px solid ${theme.colors.border};
`;

/**
 * A célula pintável. Herda a grade compartilhada e acrescenta só o que é do
 * cronograma — a primitiva continua limpa para a tela de bancas.
 */
/** A altura da célula em cada visão — é o "expandir" ao descer o zoom.
 *
 *  O mês tem 6rem para o box de marco caber com o número do dia. A §6.4 pede um
 *  calendário "compacto", e 6rem ainda é compacto perto das 7.5rem da grade de
 *  bancas — mas é o preço de o marco ter nome escrito em vez de um glifo. */
const ALTURA_CELULA: Record<string, string> = {
  mes: "6rem",
  semana: "9rem",
  dia: "14rem",
};

export const PaintedDayCell = styled(DayCell)<{
  $cor?: string;
  $texto?: string;
  $naoUtil?: boolean;
  $preview?: boolean;
  $pintavel?: boolean;
  $vazia?: boolean;
  $visao?: string;
}>`
  min-height: ${({ $visao }) => ALTURA_CELULA[$visao ?? "mes"] ?? ALTURA_CELULA.mes};
  align-items: flex-start;
  justify-content: flex-start;
  position: relative;
  cursor: ${({ $pintavel }) => ($pintavel ? "cell" : "default")};

  /* A última linha do bloco não repete a borda do container arredondado. */
  ${LinhaDias}:last-child & {
    border-bottom: none;
  }

  ${({ $vazia }) =>
    $vazia &&
    css`
      /* Dia de mês vizinho: some por completo. Com meses empilhados, a mesma
         data apareceria em DOIS blocos — o que quebra o hit-test e fica feio
         no PNG. */
      background: transparent;
      border-color: transparent;
      pointer-events: none;
    `}

  ${({ $naoUtil }) =>
    $naoUtil &&
    css`
      /* A hachura é o que sobrevive à impressão em preto-e-branco e ao PNG
         exportado — cor sozinha não. */
      background-color: ${COR_NAO_UTIL};
      background-image: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 3px,
        rgba(0, 0, 0, 0.05) 3px,
        rgba(0, 0, 0, 0.05) 6px
      );
      cursor: not-allowed;
    `}

  /* "background" (e não "background-color"): o valor pode ser um hex chapado
     ou um linear-gradient de fatias, quando mais de uma etapa disputa o dia. */
  ${({ $cor, $naoUtil }) =>
    $cor &&
    !$naoUtil &&
    css`
      background: ${$cor};
    `}

  ${({ $preview }) =>
    $preview &&
    css`
      outline: 2px dashed ${theme.colors.foreground};
      outline-offset: -3px;
    `}
`;

export const NumeroDia = styled.span<{ $texto?: string; $hoje?: boolean }>`
  font-size: ${theme.fontSize.xs};
  font-weight: ${({ $hoje }) => ($hoje ? theme.fontWeight.bold : theme.fontWeight.medium)};
  color: ${({ $texto }) => $texto ?? theme.colors.foreground};
  ${({ $hoje }) =>
    $hoje &&
    css`
      text-decoration: underline;
      text-underline-offset: 2px;
    `}
`;

/** A pilha de boxes de marco dentro da célula. */
export const MarcosDoDia = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  width: 100%;
  min-width: 0;
  margin-top: 0.15rem;
`;

/**
 * O box do marco — borda colorida, fundo quase branco e o nome escrito.
 *
 * Substituiu os antigos glifos de símbolo. O motivo original deles era o export
 * impresso em preto-e-branco, e o nome escrito atende isso melhor do que um
 * símbolo: texto sobrevive ao P&B, símbolo depende da legenda ao lado.
 */
export const MarcoBox = styled.span<{
  $borda: string;
  $fundo: string;
  $texto: string;
  $clicavel?: boolean;
}>`
  display: block;
  width: 100%;
  padding: 0.1rem 0.3rem;
  border: 1px solid ${({ $borda }) => $borda};
  border-radius: ${theme.borderRadius.sm};
  background: ${({ $fundo }) => $fundo};
  color: ${({ $texto }) => $texto};
  font-size: 0.7rem;
  font-weight: ${theme.fontWeight.medium};
  line-height: 1.3;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  /* Marco que abre ficha vira <button> (ver \`onClick\` em MarcoRenderizavel).
     Sem afordância nenhuma ninguém descobre que dá para clicar — e o box é
     pequeno demais para um ícone caber junto do rótulo. */
  ${({ $clicavel }) =>
    $clicavel &&
    `
    cursor: pointer;
    font: inherit;
    font-size: 0.7rem;
    font-weight: ${theme.fontWeight.medium};

    &:hover {
      filter: brightness(0.95);
      text-decoration: underline;
    }

    &:focus-visible {
      outline: 2px solid ${theme.colors.primary};
      outline-offset: 1px;
    }
  `}
`;

/**
 * O que a célula ganha quando há espaço (semana e dia): o nome da etapa e os
 * marcos por extenso. Na visão de mês a célula tem 3rem e nada disso cabe —
 * lá o título fica no `title` e a cor faz o trabalho, com a legenda ao lado.
 */
export const DetalheCelula = styled.div<{ $texto?: string }>`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin-top: 0.15rem;
  min-width: 0;
  font-size: ${theme.fontSize.xs};
  line-height: 1.25;
  color: ${({ $texto }) => $texto ?? theme.colors.mutedForeground};

  strong {
    font-weight: ${theme.fontWeight.medium};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    font-size: 0.7rem;
    opacity: 0.85;
  }
`;

/* ------------------------------------------------------------------ */
/* Barra de ferramentas e legenda                                      */
/* ------------------------------------------------------------------ */

export const Barra = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding-bottom: ${theme.spacing.md};
`;

/**
 * Os botões da barra, na mesma caixa do select de escopo ao lado.
 *
 * O PageButtonSm tem 1.75rem e fonte xs; o FieldSelect, 2.25rem, raio maior e
 * fonte sm. Lado a lado a diferença aparece como desalinhamento. Aqui o botão
 * herda a métrica do campo, que é quem manda na linha.
 */
export const BotaoBarra = styled.button<{ $variant?: "outline" | "ghost" }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  height: 2.25rem;
  padding: 0 0.75rem;
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid
    ${({ $variant }) => ($variant === "ghost" ? "transparent" : theme.colors.input)};
  background: ${({ $variant }) =>
    $variant === "ghost" ? "transparent" : theme.colors.background};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${theme.colors.muted};
  }

  &:focus-visible {
    outline: none;
    border-color: ${theme.colors.ring};
    box-shadow: 0 0 0 3px color-mix(in srgb, ${theme.colors.ring} 25%, transparent);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/** O seletor de visão — dia · semana · mês, como um segmented control. */
export const GrupoVisao = styled.div`
  display: inline-flex;
  height: 2.25rem;
  border: 1px solid ${theme.colors.input};
  border-radius: ${theme.borderRadius.lg};
  overflow: hidden;
`;

export const BotaoVisao = styled.button<{ $ativo?: boolean }>`
  padding: 0 0.75rem;
  border: none;
  border-right: 1px solid ${theme.colors.border};
  background: ${({ $ativo }) => ($ativo ? theme.colors.secondary : "transparent")};
  font-size: ${theme.fontSize.xs};
  font-weight: ${({ $ativo }) =>
    $ativo ? theme.fontWeight.semibold : theme.fontWeight.medium};
  color: ${({ $ativo }) => ($ativo ? theme.colors.foreground : theme.colors.mutedForeground)};
  cursor: pointer;

  &:last-child {
    border-right: none;
  }

  &:hover:not(:disabled) {
    background: ${theme.colors.muted};
  }
`;

/**
 * A data de entrega do escopo, na barra do cronograma.
 *
 * Mesma métrica do select de escopo ao lado (2.25rem, raio lg), para a linha
 * não ficar com alturas diferentes.
 */
export const FieldEntrega = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.25rem;
  padding: 0 0.75rem;
  border: 1px solid ${theme.colors.input};
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.background};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};

  input {
    border: none;
    background: transparent;
    font-size: ${theme.fontSize.sm};
    color: ${theme.colors.foreground};
    outline: none;
  }

  &:focus-within {
    border-color: ${theme.colors.ring};
    box-shadow: 0 0 0 3px color-mix(in srgb, ${theme.colors.ring} 25%, transparent);
  }

  input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const NavPeriodo = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
`;

export const BotaoNav = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 1px solid ${theme.colors.input};
  border-radius: ${theme.borderRadius.lg};
  background: transparent;
  color: ${theme.colors.foreground};
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: ${theme.colors.muted};
  }
`;

export const RotuloPeriodo = styled.span`
  min-width: 12rem;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
`;

export const PincelAtivo = styled.span<{ $cor: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: ${theme.borderRadius.full};
  border: 1px solid ${({ $cor }) => $cor};
  background: color-mix(in srgb, ${({ $cor }) => $cor} 12%, white);
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
`;

export const ContadorDias = styled.span`
  font-size: ${theme.fontSize.xs};
  font-variant-numeric: tabular-nums;
  color: ${theme.colors.mutedForeground};
`;

/**
 * "Como funciona" — destacado de propósito.
 *
 * 📐 Não é um `BotaoVisao` como os outros: perdido entre os modos de marcação
 * ele virava mais um botão cinza numa fileira de botões cinza, e quem não
 * conhece a tela não achava justamente o que existe para essa pessoa. Fica
 * ao lado da data, em vermelho claro, lido como ajuda e não como ação.
 */
export const BotaoAjuda = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.3rem 0.7rem;
  border-radius: ${theme.borderRadius.md};
  border: 1px solid color-mix(in srgb, ${theme.colors.primary} 35%, transparent);
  background: color-mix(in srgb, ${theme.colors.primary} 10%, white);
  color: ${theme.colors.primary};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  white-space: nowrap;
  cursor: pointer;
  /* O espacamento do NavPeriodo e de 0.25rem, pensado para as setas — sem
     isto o botao encosta no rotulo da data. */
  margin-left: ${theme.spacing.sm};

  &:hover {
    background: color-mix(in srgb, ${theme.colors.primary} 18%, white);
  }

  &:focus-visible {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 1px;
  }
`;

/**
 * A caixa que ocupa o lugar dos botões escondidos.
 *
 * 📐 Botão desabilitado com tooltip não serve para quem não conhece a tela:
 * a explicação só aparece no hover, e no celular nunca aparece. Aqui o texto
 * fica visível e diz a AÇÃO a tomar ("escolha um escopo"), não só que algo
 * está indisponível.
 *
 * ⚠ **Linha inteira, e não uma pílula ao lado dos botões.** Era uma pílula
 * cinza pequena no meio da barra, e passava despercebida justamente por quem
 * ela existe para socorrer: quem abre a tela pela primeira vez, não encontra
 * o botão de banca e não desconfia que a causa é o seletor acima. Ocupando a
 * linha, ela vira o próximo lugar para onde o olho vai depois dos botões.
 *
 * 📐 Tom neutro, não de alerta: nada deu errado, só falta um passo. Vermelho
 * aqui ensinaria a pessoa a ignorar o vermelho que importa.
 */
export const DicaEscopo = styled.div`
  /* Quebra a linha da barra flex e ocupa a largura toda. */
  flex-basis: 100%;

  display: flex;
  align-items: flex-start;
  gap: ${theme.spacing.sm};

  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.muted};

  font-size: ${theme.fontSize.sm};
  line-height: 1.45;
  color: ${theme.colors.mutedForeground};

  svg {
    flex-shrink: 0;
    margin-top: 0.1rem;
  }

  strong {
    color: ${theme.colors.foreground};
    font-weight: ${theme.fontWeight.semibold};
  }
`;

/**
 * Esconde a cópia do export sem tirá-la do layout.
 *
 * Fora da tela por deslocamento, e não por `display: none`: o html-to-image
 * precisa de layout calculado, e um elemento sem display tem largura zero.
 *
 * Atenção: quem é fotografado é a MOLDURA lá dentro, nunca este elemento.
 * O html-to-image clona o nó COM os estilos dele; capturar este aqui levaria
 * o `position: fixed; left: -20000px` para dentro do clone, e o conteúdo
 * cairia fora da área renderizada. O resultado é um PDF em branco.
 */
export const AreaExportOculta = styled.div`
  position: fixed;
  top: 0;
  left: -20000px;
  pointer-events: none;
`;

/**
 * O nó que vira imagem. Posicionamento estático de propósito (ver acima).
 *
 * A largura fixa tira o PDF da mão do tamanho da janela: o arquivo sai igual
 * em qualquer monitor. O fundo branco é explícito porque o clone não herda o
 * fundo da página.
 */
export const MolduraExport = styled.div`
  width: 60rem;
  padding: ${theme.spacing.lg};
  background: #ffffff;
`;

export const CronogramaLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${theme.spacing.lg};

  @media (min-width: ${theme.breakpoints.lg}px) {
    grid-template-columns: 1fr 15rem;
    align-items: start;
  }
`;

export const LegendaBox = styled.aside`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.card};

  @media (min-width: ${theme.breakpoints.lg}px) {
    position: sticky;
    top: ${theme.spacing.md};
  }

  .exportando & {
    position: static;
  }
`;

export const LegendaGrupo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

export const LegendaTitulo = styled.h4`
  margin: 0;
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.semibold};
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${theme.colors.mutedForeground};
`;

/**
 * A linha da legenda: o botão do pincel e, ao lado, o de excluir.
 *
 * São irmãos, e não aninhados, porque botão dentro de botão é HTML inválido —
 * o clique no interno dispararia o externo, e escolher excluir também trocaria
 * o pincel.
 */
export const LegendaLinha = styled.div`
  display: flex;
  align-items: center;
  gap: 0.125rem;

  /* O excluir só aparece no hover ou com foco, para a legenda não virar uma
     parede de lixeiras. O :focus-within não é opcional: sem ele o botão fica
     invisível para quem navega por teclado. */
  &:hover [data-excluir],
  &:focus-within [data-excluir] {
    opacity: 1;
  }
`;

export const BotaoExcluir = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  border: none;
  border-radius: ${theme.borderRadius.sm};
  background: transparent;
  color: ${theme.colors.mutedForeground};
  opacity: 0;
  cursor: pointer;

  &:hover {
    background: ${theme.colors.muted};
    color: ${theme.colors.destructive};
  }
`;

export const LegendaItem = styled.button<{ $ativa?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  width: 100%;
  padding: 0.3rem 0.375rem;
  border: 1px solid ${({ $ativa }) => ($ativa ? theme.colors.ring : "transparent")};
  border-radius: ${theme.borderRadius.md};
  background: ${({ $ativa }) => ($ativa ? theme.colors.secondary : "transparent")};
  font-size: ${theme.fontSize.xs};
  color: ${theme.colors.foreground};
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${theme.colors.muted};
  }
`;

/**
 * ⭐ O alerta de estouro **ao lado do calendário** — um por escopo, dentro da
 * legenda.
 *
 * Fica aqui, e não só no banner do topo, porque a pergunta que ele responde é
 * sobre UM escopo ("as etapas deste escopo passaram do que foi vendido?") e a
 * resposta precisa estar encostada na lista de etapas daquele escopo. No topo,
 * um projeto com três escopos daria três avisos empilhados sem dizer de quem é
 * cada um.
 *
 * Âmbar, não vermelho: passar do previsto é um aviso para negociar dias, não
 * um erro — e vermelho é a cor de `destructive` no tema.
 */
export const AvisoEscopo = styled.div<{ $tom?: "alerta" | "atraso" }>`
  display: flex;
  gap: 0.375rem;
  padding: 0.5rem 0.625rem;
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSize.xs};
  line-height: 1.4;
  border: 1px solid
    ${({ $tom }) =>
      $tom === "atraso" ? theme.alpha(theme.colors.destructive, 0.35) : theme.alpha(theme.colors.warning, 0.4)};
  background: ${({ $tom }) =>
    $tom === "atraso" ? theme.alpha(theme.colors.destructive, 0.08) : theme.alpha(theme.colors.warning, 0.12)};
  color: ${theme.colors.foreground};

  strong {
    font-weight: ${theme.fontWeight.semibold};
  }
`;

/**
 * A etiqueta "correção" no trecho da legenda.
 *
 * ⭐ Depois que a banca do escopo é realizada, tudo que se pinta ali é correção
 * do que ela apontou — e sem rótulo os dois ficam indistinguíveis: o mesmo
 * retângulo colorido pode ser o trabalho vendido ou a correção. É a diferença
 * entre "o escopo levou 14 dias" e "levou 10 + 4 de correção".
 *
 * ⚠️ Correção não é "dia de ajuste": ajuste aumenta a JANELA do escopo e é
 * pedido à diretoria nos 3 primeiros dias úteis depois da largada.
 */
export const TagCorrecao = styled.span`
  display: inline-block;
  margin-left: 0.375rem;
  padding: 0 0.3rem;
  border-radius: ${theme.borderRadius.sm};
  border: 1px solid ${theme.alpha(theme.colors.info, 0.4)};
  background: ${theme.alpha(theme.colors.info, 0.12)};
  font-size: 0.6875rem;
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.foreground};
  white-space: nowrap;
`;

export const Amostra = styled.span<{ $cor: string }>`
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
  border-radius: ${theme.borderRadius.sm};
  background: ${({ $cor }) => $cor};
`;

/**
 * O seletor de cor da etapa: as 8 amostras da `PALETA`, e só elas.
 *
 * Sem color picker livre de propósito — a paleta é fechada justamente para o
 * cronograma não virar arco-íris e para nenhuma etapa cair na matiz que o
 * design system reserva para status (vermelho = atrasado, verde = ok).
 */
export const PaletaGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const AmostraBotao = styled.button<{ $cor: string; $ativa: boolean }>`
  width: 2rem;
  height: 2rem;
  border-radius: ${theme.borderRadius.md};
  background: ${({ $cor }) => $cor};
  cursor: pointer;

  /* A seleção é um anel POR FORA, e não uma borda: borda encolheria a amostra
     e faria a cor selecionada parecer diferente das outras. */
  border: 2px solid ${theme.colors.card};
  outline: 2px solid ${({ $cor, $ativa }) => ($ativa ? $cor : "transparent")};
  outline-offset: 0;

  &:focus-visible {
    outline-color: ${theme.colors.ring};
  }
`;

export const LegendaTexto = styled.span`
  display: flex;
  flex-direction: column;
  min-width: 0;

  strong {
    font-weight: ${theme.fontWeight.medium};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  small {
    font-size: 0.65rem;
    color: ${theme.colors.mutedForeground};
  }
`;

export const AmostraHachurada = styled.span`
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
  border-radius: ${theme.borderRadius.sm};
  background-color: ${COR_NAO_UTIL};
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.12) 2px,
    rgba(0, 0, 0, 0.12) 4px
  );
`;

/* ------------------------------------------------------------------ */
/* Desfazer                                                             */
/* ------------------------------------------------------------------ */

/**
 * A barra de desfazer, fixa no rodapé.
 *
 * 📐 Flutuante e não dentro da barra de ferramentas: quem acabou de clicar
 * num dia está olhando para o calendário, não para o topo da tela. A janela
 * é curta de propósito — desfazer eterno viraria mais um estado para a
 * pessoa administrar.
 */
export const BarraDesfazer = styled.div`
  position: fixed;
  left: 50%;
  bottom: ${theme.spacing.lg};
  transform: translateX(-50%);
  z-index: 60;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  background: ${theme.colors.foreground};
  color: ${theme.colors.background};
  box-shadow: ${theme.shadows.lg};
  font-size: ${theme.fontSize.sm};
  max-width: calc(100vw - 2rem);
`;

export const BotaoDesfazer = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: ${theme.borderRadius.md};
  border: 1px solid currentColor;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: rgb(255 255 255 / 15%);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/** Os segundos restantes. `tabular-nums` para o texto não dançar a cada tique. */
export const ContagemDesfazer = styled.span`
  font-variant-numeric: tabular-nums;
  opacity: 0.75;
  font-size: ${theme.fontSize.xs};
`;
