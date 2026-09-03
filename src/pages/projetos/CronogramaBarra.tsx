import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Download,
  HelpCircle,
  Lock,
  Plus,
} from "lucide-react";
import { InfoDica } from "@/components/InfoDica";
import { SegmentedButton, SegmentedGroup } from "@/styles/shared.styled";
import { VISOES, type Visao } from "@/components/cronograma-pintado/visao";
import {
  BarraEspaco,
  BarraLinha,
  BarraRotuloZona,
  BarraZonas,
  BotaoAjuda,
  BotaoBarra,
  BotaoNav,
  FaixaEstado,
  FaixaEstadoAmostra,
  FieldEntrega,
  NavPeriodo,
  RotuloPeriodo,
} from "@/components/cronograma-pintado/PaintedCalendar.styled";
import { EscopoFiltroBotao, EscopoFiltroLista } from "./Projetos.styled";

/** O que a barra precisa saber de um escopo — o resto do `EscopoComEtapas`
 *  não interessa a ela. */
export interface EscopoDaBarra {
  id: number;
  nome: string;
}

/** Um modo de marcação, como `MODOS` os define em `ProjetoCronograma`. */
export interface ModoDaBarra {
  valor: string;
  rotulo: string;
  /** O modo só existe com um escopo escolhido. */
  escopo: boolean;
}

interface Props {
  /* ---- zona 1: onde estou ---- */
  escopos: EscopoDaBarra[];
  escopoSelecionado: number | "geral";
  onEscopo: (id: number | "geral") => void;

  visao: Visao;
  onVisao: (valor: Visao) => void;

  tituloPeriodo: string;
  limites: { recuar: boolean; avancar: boolean };
  onNavegar: (passo: number) => void;

  onAjuda: () => void;
  onExportar: () => void;
  /**
   * Cria uma etapa no escopo escolhido na barra.
   *
   * 📐 O botão fica encostado no fim da lista de escopos, e não solto na zona
   * de edição: o escopo em que a etapa vai nascer é o que está selecionado ali
   * do lado, e a vizinhança é o que diz isso sem precisar de rótulo.
   */
  onNovaEtapa: () => void;

  /* ---- zona 2: o que faço ---- */
  podeEditar: boolean;
  modos: readonly ModoDaBarra[];
  modoMarcacao: string | null;
  onModo: (valor: string) => void;

  /** O escopo escolhido, ou `null` na visão "Todos os escopos". */
  escopoAtual:
    | (EscopoDaBarra & {
        data_entrega_planejada: string | null;
        pedido_ajuste_aberto: boolean;
        prazo_pedido_ajuste: string | null;
        reajuste_pendente: unknown | null;
      })
    | null;
  onEntregaPlanejada: (valor: string) => void;

  /** O coordenador deste projeto ou a diretoria de projetos pedem dias, e só
   *  dentro do prazo. */
  podePedirDias: boolean;
  rotuloPrazoPedido: string | null;
  diasUteisRestantesDoPedido: number;
  onPedirDias: () => void;

  mostrarOficializar: boolean;
  onOficializar: () => void;

  /* ---- zona 3: o que está armado ---- */
  /** A etapa que o pincel está usando, se houver. */
  pincel: { nome: string; cor: string } | null;
  /** Dias úteis do arrasto em andamento, para o contador ao vivo. */
  diasPreview: number | null;
  /** Há etapas na legenda para pintar — muda o convite quando não há pincel. */
  temEtapas: boolean;
}

/**
 * A barra do Cronograma, em três zonas.
 *
 * ⭐ **Era uma linha só**, com treze controles e quatro frases de instrução
 * disputando o mesmo espaço e quebrando em três ou quatro linhas. Aqui a
 * primeira zona responde **onde estou** (escopo, período, visão), a segunda
 * **o que faço** (marcar, criar etapa, oficializar) e só aparece para quem
 * pode editar, e a terceira é **o que está armado agora** — e some quando não
 * há nada armado.
 *
 * 📐 **Nenhuma instrução permanente.** As frases que ficavam fixas na barra
 * (como desmarcar, como pedir dias arrastando, por que faltam modos sem
 * escopo) migraram para o modal "Como funciona" e para a dica do grupo
 * "Marcar": são coisas que se lê uma vez, e ocupavam a tela para sempre.
 */
export function CronogramaBarra({
  escopos,
  escopoSelecionado,
  onEscopo,
  visao,
  onVisao,
  tituloPeriodo,
  limites,
  onNavegar,
  onAjuda,
  onExportar,
  onNovaEtapa,
  podeEditar,
  modos,
  modoMarcacao,
  onModo,
  escopoAtual,
  onEntregaPlanejada,
  podePedirDias,
  rotuloPrazoPedido,
  diasUteisRestantesDoPedido,
  onPedirDias,
  mostrarOficializar,
  onOficializar,
  pincel,
  diasPreview,
  temEtapas,
}: Props) {
  const modoGeral = escopoSelecionado === "geral";
  const modosVisiveis = modos.filter((modo) => !modo.escopo || escopoAtual);
  const modoAtivo = modos.find((m) => m.valor === modoMarcacao);

  /* ⚠ A porta de aumentar a JANELA do escopo, e nada além disso. Para o
     coordenador do projeto ou a diretoria de projetos (2026-08-31), com escopo
     escolhido, e só dentro do prazo — até o último dia da ambientação no
     primeiro escopo vendido, nos 3 dias úteis depois da largada nos demais. É
     aí que dá para perceber que o escopo foi vendido apertado. Fora disso o
     botão some, porque a porta não existe mais.

     Quem decide o prazo é o backend (`pedido_ajuste_aberto` /
     `prazo_pedido_ajuste`): a régua tem duas metades e recalculá-la aqui era
     garantir que a tela e a decisão discordassem em algum caso.

     Não confundir com as CORREÇÕES pós-banca: aquilo é tempo gasto arrumando
     o que a banca apontou, não se pede a ninguém e não aumenta janela. */
  const botaoPedirDias = podePedirDias && (
    <BotaoBarra
      type="button"
      $variant="outline"
      title={rotuloPrazoPedido ? `O prazo vai até ${rotuloPrazoPedido}` : undefined}
      onClick={onPedirDias}
    >
      <CalendarPlus size={14} />
      Pedir mais dias
      {diasUteisRestantesDoPedido > 0 && ` · ${diasUteisRestantesDoPedido} dias úteis`}
    </BotaoBarra>
  );

  return (
    <BarraZonas>
      {/* ---------------- Zona 1 · onde estou ---------------- */}
      <BarraLinha>
        {/* O escopo vem primeiro porque é o recorte de que tudo o mais
            depende: período, modos e etapas só fazem sentido dentro dele. */}
        <EscopoFiltroLista role="group" aria-label="Escopo">
          {/* "Todos os escopos" e não "Geral": para quem chega agora, Geral não
              diz se é um escopo chamado assim ou a soma de todos. Só aparece
              com mais de um escopo — com um só ele já vem escolhido, e o botão
              seria idêntico ao do escopo único. */}
          {escopos.length > 1 && (
            <EscopoFiltroBotao
              type="button"
              $ativo={modoGeral}
              aria-pressed={modoGeral}
              onClick={() => onEscopo("geral")}
            >
              Todos os escopos
            </EscopoFiltroBotao>
          )}
          {escopos.map((e) => {
            const ativo = !modoGeral && escopoSelecionado === e.id;
            return (
              <EscopoFiltroBotao
                key={e.id}
                type="button"
                $ativo={ativo}
                aria-pressed={ativo}
                onClick={() => onEscopo(e.id)}
              >
                {e.nome}
              </EscopoFiltroBotao>
            );
          })}
        </EscopoFiltroLista>

        {podeEditar && (
          <BotaoBarra type="button" onClick={onNovaEtapa}>
            <Plus size={14} aria-hidden />
            Nova etapa
          </BotaoBarra>
        )}

        <BarraEspaco />

        <SegmentedGroup role="group" aria-label="Visão do cronograma">
          {VISOES.map((opcao) => {
            const ativo = visao === opcao.valor;
            return (
              <SegmentedButton
                key={opcao.valor}
                type="button"
                $ativo={ativo}
                aria-pressed={ativo}
                onClick={() => onVisao(opcao.valor)}
              >
                {opcao.rotulo}
              </SegmentedButton>
            );
          })}
        </SegmentedGroup>

        <NavPeriodo>
          <BotaoNav
            type="button"
            aria-label="Período anterior"
            disabled={limites.recuar}
            onClick={() => onNavegar(-1)}
          >
            <ChevronLeft size={14} />
          </BotaoNav>
          <BotaoNav
            type="button"
            aria-label="Próximo período"
            disabled={limites.avancar}
            onClick={() => onNavegar(1)}
          >
            <ChevronRight size={14} />
          </BotaoNav>
          <RotuloPeriodo>{tituloPeriodo}</RotuloPeriodo>
        </NavPeriodo>

        <BotaoAjuda type="button" onClick={onAjuda}>
          <HelpCircle size={13} aria-hidden />
          Como funciona
        </BotaoAjuda>

        {/* Exportar é a única ação liberada ao consultor, por isso mora na
            zona que todo mundo vê, e não na de edição. */}
        <BotaoBarra type="button" $variant="ghost" onClick={onExportar}>
          <Download size={14} />
          Exportar
        </BotaoBarra>
      </BarraLinha>

      {/* ---------------- Zona 2 · o que faço ---------------- */}
      {podeEditar && (
        <BarraLinha $secundaria>
          <BarraRotuloZona>
            Marcar
            {/* A explicação de por que faltam modos sem escopo escolhido era
                uma caixa de quatro linhas presa na barra. Vira dica: quem já
                sabe não lê de novo a cada visita. */}
            <InfoDica rotulo="Sobre os modos de marcação">
              Reunião inicial, banca e entrega pertencem a um <strong>escopo</strong> específico,
              e cada um tem a própria janela de dias vendidos. Os botões deles aparecem quando
              você escolhe um escopo ali em cima. Kickoff e reunião semanal são do projeto inteiro
              e valem sempre.
            </InfoDica>
          </BarraRotuloZona>

          <SegmentedGroup role="group" aria-label="Marcar no calendário">
            {modosVisiveis.map((modo) => {
              const ativo = modoMarcacao === modo.valor;
              return (
                <SegmentedButton
                  key={modo.valor}
                  type="button"
                  $ativo={ativo}
                  aria-pressed={ativo}
                  onClick={() => onModo(modo.valor)}
                >
                  {modo.rotulo}
                </SegmentedButton>
              );
            })}
          </SegmentedGroup>

          <BarraEspaco />

          {escopoAtual && (
            <FieldEntrega>
              <span>Entrega prevista</span>
              <input
                type="date"
                value={escopoAtual.data_entrega_planejada?.slice(0, 10) ?? ""}
                title={`Entrega planejada de ${escopoAtual.nome}`}
                onChange={(e) => onEntregaPlanejada(e.target.value)}
              />
            </FieldEntrega>
          )}

          {botaoPedirDias}

          {/* O carimbo, depois da banca marcada: "este é o cronograma
              combinado". Some depois de carimbado porque carimbar de novo não
              diz nada de novo. */}
          {mostrarOficializar && (
            <BotaoBarra type="button" $variant="outline" onClick={onOficializar}>
              <Lock size={14} />
              Oficializar
            </BotaoBarra>
          )}
        </BarraLinha>
      )}

      {/* O pedido de dias é do COORDENADOR — papel no projeto, validado no
          backend sem a caixa `pode_definir_cronograma` (ver o comentário da
          rota de reajuste). Um coordenador sem a caixa não vê a zona de
          edição, mas a porta de pedir dias continua sendo dele. */}
      {!podeEditar && botaoPedirDias && (
        <BarraLinha $secundaria>{botaoPedirDias}</BarraLinha>
      )}

      {/* ---------------- Zona 3 · o que está armado ----------------
          UMA faixa, e só quando há algo armado. Antes eram até cinco frases
          simultâneas, nenhuma delas sobre o que a pessoa estava fazendo. */}
      {podeEditar && modoAtivo && (
        <FaixaEstado>
          <span>
            Clique num dia para marcar <strong>{modoAtivo.rotulo.toLowerCase()}</strong>
            {escopoAtual ? ` em ${escopoAtual.nome}` : ""}.
          </span>
          <BarraRotuloZona>Esc para sair</BarraRotuloZona>
        </FaixaEstado>
      )}

      {podeEditar && !modoAtivo && pincel && (
        <FaixaEstado $cor={pincel.cor}>
          <FaixaEstadoAmostra $cor={pincel.cor} />
          <span>
            Pintando <strong>{pincel.nome}</strong>
            {diasPreview !== null && ` · ${diasPreview} dias úteis`}
          </span>
          <BarraRotuloZona>Clique na etapa de novo para soltar o pincel</BarraRotuloZona>
        </FaixaEstado>
      )}

      {/* O convite inicial: sem ele, ninguém descobre que a legenda é clicável.
          Some no instante em que o pincel é pego. */}
      {podeEditar && !modoAtivo && !pincel && temEtapas && (
        <FaixaEstado>
          <span>Clique numa etapa da legenda para começar a pintar.</span>
        </FaixaEstado>
      )}
    </BarraZonas>
  );
}
