import { useEffect, useRef, useState } from "react";
import { CalendarRange } from "lucide-react";
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
 * linhas, empurrando a timeline para baixo da dobra. Aqui os controles que se
 * usam ficam à vista (etapa, quem, período) e os dois campos de data — que
 * quase ninguém digita, porque as pastilhas de 7/30/90 dias já cobrem o caso
 * comum — se recolhem atrás de um botão.
 *
 * 📐 **Nenhum dropdown, enquanto couber.** Etapa e período são pastilhas;
 * autor também, até MAX_AUTORES_EM_PASTILHA. Passou disso, o SelectCustom com
 * busca é melhor do que a parede de pastilhas — trocar um problema de cliques
 * por um de varredura visual não seria ganho.
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
  const [datasAbertas, setDatasAbertas] = useState(false);
  const datasRef = useRef<HTMLDivElement>(null);

  // Clicar fora (ou Esc) fecha. Sem isto o popover fica aberto sobre a
  // timeline e a pessoa precisa acertar de novo o mesmo botão para sumir.
  useEffect(() => {
    if (!datasAbertas) return;
    function aoClicarFora(evento: MouseEvent) {
      if (datasRef.current && !datasRef.current.contains(evento.target as Node)) {
        setDatasAbertas(false);
      }
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") setDatasAbertas(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [datasAbertas]);

  const temDatas = dataInicio !== "" || dataFim !== "";
  const autoresEmPastilha = autoresPresentes.length <= MAX_AUTORES_EM_PASTILHA;

  return (
    <HistoricoBarraFiltros>
      {statusPresentes.length > 0 && (
        <HistoricoFiltroCampo>
          <HistoricoFiltroTitulo>Etapa</HistoricoFiltroTitulo>
          <HistoricoFiltroPills role="group" aria-label="Filtrar por etapa">
            {statusPresentes.map((status) => {
              const tons = tonsDaColuna(CORES_STATUS[status]);
              const ativo = statusFiltro.has(status);
              return (
                <HistoricoFiltroPill
                  key={status}
                  type="button"
                  $ativo={ativo}
                  $cor={tons.ponto}
                  aria-pressed={ativo}
                  onClick={() => onAlternarStatus(status)}
                >
                  <Ponto $cor={tons.ponto} />
                  {ROTULO_STATUS[status]}
                </HistoricoFiltroPill>
              );
            })}
          </HistoricoFiltroPills>
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
