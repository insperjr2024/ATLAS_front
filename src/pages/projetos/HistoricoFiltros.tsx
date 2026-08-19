import { useEffect, useRef, useState } from "react";
import { CalendarRange, Check, ChevronDown, ChevronUp } from "lucide-react";
import { theme } from "@/styles/theme";
import { CORES_STATUS, ROTULO_STATUS } from "@/lib/projetos";
import { tonsDaColuna } from "@/lib/colunas-tarefa";
import { Ponto } from "@/components/kanban/Kanban.styled";
import { SegmentedButton, SegmentedGroup } from "@/styles/shared.styled";
import { FieldSelect } from "@/pages/Bancas.styled";
import type { StatusProjeto } from "@/types/projeto";
import {
  FieldInput,
  HistoricoBarraFiltros,
  HistoricoDatasPopover,
  HistoricoDatasWrap,
  HistoricoEtapaNome,
  HistoricoEtapaOpcao,
  HistoricoEtapasPopover,
  HistoricoEtapasWrap,
  HistoricoFiltroCampo,
  HistoricoFiltroLabel,
  HistoricoFiltroPill,
  HistoricoFiltroPills,
  HistoricoFiltroTitulo,
  HistoricoLimparFiltros,
} from "./Projetos.styled";

/**
 * Acima disto, uma pastilha por pessoa vira uma parede que empurra a timeline
 * para fora da tela — e a essa altura procurar um nome numa lista com busca é
 * mais rápido do que varrer trinta pastilhas. O corte é de largura, não de
 * gosto.
 */
const MAX_AUTORES_EM_PASTILHA = 8;

const PERIODOS = [7, 30, 90];

/**
 * Fecha um popover ao clicar fora dele ou apertar Esc.
 *
 * Sem isto o popover fica aberto sobre a linha do tempo e a pessoa precisa
 * acertar de novo o mesmo botão para ele sumir.
 *
 * 📐 Um hook, e não dois efeitos iguais colados: a barra tem DOIS popovers
 * ("Etapas" e "Datas") e eles têm de fechar do mesmo jeito — um deles ganhar
 * um comportamento que o outro não tem seria um bug esperando a hora.
 *
 * ⚠ `fechar` é o próprio `setState`, que o React garante estável entre
 * renders. Uma seta criada no corpo do componente seria nova a cada render e
 * remontaria os dois listeners junto.
 */
function useFecharAoClicarFora(
  aberto: boolean,
  ref: React.RefObject<HTMLDivElement | null>,
  fechar: (v: boolean) => void,
) {
  useEffect(() => {
    if (!aberto) return;
    function aoClicarFora(evento: MouseEvent) {
      if (ref.current && !ref.current.contains(evento.target as Node)) fechar(false);
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") fechar(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto, ref, fechar]);
}

interface Props {
  statusPresentes: StatusProjeto[];
  statusFiltro: Set<StatusProjeto>;
  onAlternarStatus: (status: StatusProjeto) => void;

  autoresPresentes: number[];
  nomeUsuario: (id: number) => string;
  temAutomatico: boolean;
  autorFiltro: string;
  onAutorFiltro: (valor: string) => void;

  periodoRapido: number | null;
  onPeriodoRapido: (dias: number) => void;

  dataInicio: string;
  dataFim: string;
  onDataManual: (campo: "inicio" | "fim", valor: string) => void;

  filtroAtivo: boolean;
  onLimpar: () => void;
}

/**
 * A barra de filtros do Histórico.
 *
 * ⭐ **Era um card "Filtros"** aberto o tempo todo, com cinco grupos em duas
 * linhas, empurrando a timeline para baixo da dobra. Quem, período e a
 * contagem de etapas filtrando ficam à vista; a lista de etapas e os dois
 * campos de data se recolhem atrás de um botão.
 *
 * 📐 **Recolhido não é escondido.** Os dois botões que fecham conteúdo
 * ("Etapas" e "Datas") ficam MARCADOS quando o que está lá dentro está
 * filtrando, e o de etapas ainda diz quantas — senão a lista apareceria
 * cortada sem que nada na tela explicasse o porquê.
 *
 * 📐 **Nenhum dropdown, enquanto couber.** Período é pastilha; autor também,
 * até MAX_AUTORES_EM_PASTILHA. Passou disso, o SelectCustom com busca é melhor
 * do que a parede de pastilhas — trocar um problema de cliques por um de
 * varredura visual não seria ganho.
 */
export function HistoricoFiltros({
  statusPresentes,
  statusFiltro,
  onAlternarStatus,
  autoresPresentes,
  nomeUsuario,
  temAutomatico,
  autorFiltro,
  onAutorFiltro,
  periodoRapido,
  onPeriodoRapido,
  dataInicio,
  dataFim,
  onDataManual,
  filtroAtivo,
  onLimpar,
}: Props) {
  /** A lista de etapas nasce fechada: ela é o primeiro controle da barra, e
   *  aberta o tempo todo era ela que empurrava "Quem" e "Período" para baixo. */
  const [etapasAbertas, setEtapasAbertas] = useState(false);
  const [datasAbertas, setDatasAbertas] = useState(false);
  const etapasRef = useRef<HTMLDivElement>(null);
  const datasRef = useRef<HTMLDivElement>(null);
  useFecharAoClicarFora(etapasAbertas, etapasRef, setEtapasAbertas);
  useFecharAoClicarFora(datasAbertas, datasRef, setDatasAbertas);

  const temDatas = dataInicio !== "" || dataFim !== "";
  const autoresEmPastilha = autoresPresentes.length <= MAX_AUTORES_EM_PASTILHA;

  return (
    <HistoricoBarraFiltros>
      {statusPresentes.length > 0 && (
        <HistoricoFiltroCampo>
          <HistoricoFiltroTitulo>Etapa</HistoricoFiltroTitulo>
          <HistoricoEtapasWrap ref={etapasRef}>
            <SegmentedGroup>
              <SegmentedButton
                type="button"
                // Marcado quando há etapa filtrando, pela mesma razão do botão
                // "Datas" ao lado: fechado, o filtro sumiria de vista e a
                // linha do tempo apareceria cortada sem explicação. A contagem
                // diz QUANTAS sem precisar abrir.
                $ativo={statusFiltro.size > 0}
                aria-expanded={etapasAbertas}
                aria-controls="historico-etapas"
                onClick={() => setEtapasAbertas((v) => !v)}
              >
                {etapasAbertas ? (
                  <ChevronUp size={13} aria-hidden />
                ) : (
                  <ChevronDown size={13} aria-hidden />
                )}
                Etapas
                {statusFiltro.size > 0 && ` · ${statusFiltro.size}`}
              </SegmentedButton>
            </SegmentedGroup>

            {etapasAbertas && (
              <HistoricoEtapasPopover
                id="historico-etapas"
                role="group"
                aria-label="Filtrar por etapa"
              >
                {statusPresentes.map((status) => {
                  const tons = tonsDaColuna(CORES_STATUS[status]);
                  const ativo = statusFiltro.has(status);
                  return (
                    <HistoricoEtapaOpcao
                      key={status}
                      type="button"
                      $ativo={ativo}
                      $cor={tons.ponto}
                      aria-pressed={ativo}
                      onClick={() => onAlternarStatus(status)}
                    >
                      <Ponto $cor={tons.ponto} />
                      <HistoricoEtapaNome>{ROTULO_STATUS[status]}</HistoricoEtapaNome>
                      {/* O check, e não só o fundo colorido: cor não pode ser
                          o único indicador de que a etapa está selecionada. */}
                      {ativo && <Check size={14} aria-hidden />}
                    </HistoricoEtapaOpcao>
                  );
                })}
              </HistoricoEtapasPopover>
            )}
          </HistoricoEtapasWrap>
        </HistoricoFiltroCampo>
      )}

      <HistoricoFiltroCampo>
        <HistoricoFiltroTitulo>Quem</HistoricoFiltroTitulo>
        {autoresEmPastilha ? (
          <HistoricoFiltroPills role="group" aria-label="Filtrar por quem alterou">
            {/* "Todo mundo" é o estado sem filtro, e como pastilha ele PRECISA
                aparecer: sem ela não há como voltar atrás depois de escolher
                alguém — no select, a opção vazia fazia esse papel. */}
            <HistoricoFiltroPill
              type="button"
              $ativo={autorFiltro === ""}
              $cor={theme.colors.primary}
              aria-pressed={autorFiltro === ""}
              onClick={() => onAutorFiltro("")}
            >
              Todo mundo
            </HistoricoFiltroPill>
            {autoresPresentes.map((id) => {
              const ativo = autorFiltro === String(id);
              return (
                <HistoricoFiltroPill
                  key={id}
                  type="button"
                  $ativo={ativo}
                  $cor={theme.colors.primary}
                  aria-pressed={ativo}
                  onClick={() => onAutorFiltro(ativo ? "" : String(id))}
                >
                  {nomeUsuario(id)}
                </HistoricoFiltroPill>
              );
            })}
            {temAutomatico && (
              <HistoricoFiltroPill
                type="button"
                $ativo={autorFiltro === "automatico"}
                $cor={theme.colors.mutedForeground}
                aria-pressed={autorFiltro === "automatico"}
                onClick={() => onAutorFiltro(autorFiltro === "automatico" ? "" : "automatico")}
              >
                Automático
              </HistoricoFiltroPill>
            )}
          </HistoricoFiltroPills>
        ) : (
          <FieldSelect
            id="historico-autor"
            value={autorFiltro}
            pesquisavel
            onChange={(e) => onAutorFiltro(e.target.value)}
            aria-label="Filtrar por quem alterou"
          >
            <option value="">Todo mundo</option>
            {autoresPresentes.map((id) => (
              <option key={id} value={id}>
                {nomeUsuario(id)}
              </option>
            ))}
            {temAutomatico && <option value="automatico">Automático</option>}
          </FieldSelect>
        )}
      </HistoricoFiltroCampo>

      <HistoricoFiltroCampo>
        <HistoricoFiltroTitulo>Período</HistoricoFiltroTitulo>
        <SegmentedGroup role="group" aria-label="Filtrar por período">
          {PERIODOS.map((dias) => {
            const ativo = periodoRapido === dias;
            return (
              <SegmentedButton
                key={dias}
                type="button"
                $ativo={ativo}
                aria-pressed={ativo}
                onClick={() => onPeriodoRapido(dias)}
              >
                {dias} dias
              </SegmentedButton>
            );
          })}
        </SegmentedGroup>

        {/* As duas datas exatas atrás de um botão: as pastilhas acima cobrem o
            recorte que se pede todo dia, e dois campos de data sempre abertos
            custavam mais largura do que o uso justifica. O botão fica marcado
            quando há data valendo, para o recorte não ficar escondido. */}
        <HistoricoDatasWrap ref={datasRef}>
          <SegmentedGroup>
            <SegmentedButton
              type="button"
              $ativo={temDatas}
              aria-expanded={datasAbertas}
              aria-pressed={temDatas}
              onClick={() => setDatasAbertas((v) => !v)}
            >
              <CalendarRange size={13} aria-hidden />
              Datas
            </SegmentedButton>
          </SegmentedGroup>

          {datasAbertas && (
            <HistoricoDatasPopover>
              <HistoricoFiltroLabel htmlFor="historico-data-inicio">De</HistoricoFiltroLabel>
              <FieldInput
                id="historico-data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => onDataManual("inicio", e.target.value)}
              />
              <HistoricoFiltroLabel htmlFor="historico-data-fim">Até</HistoricoFiltroLabel>
              <FieldInput
                id="historico-data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => onDataManual("fim", e.target.value)}
              />
            </HistoricoDatasPopover>
          )}
        </HistoricoDatasWrap>
      </HistoricoFiltroCampo>

      {filtroAtivo && (
        <HistoricoLimparFiltros type="button" onClick={onLimpar}>
          Limpar filtros
        </HistoricoLimparFiltros>
      )}
    </HistoricoBarraFiltros>
  );
}
