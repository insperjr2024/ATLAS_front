import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getFrentes } from "@/lib/bancas";
import { getPainelContratual } from "@/lib/contratos";
import { tonsDaColuna } from "@/lib/colunas-tarefa";
import { ETAPAS_DOCUMENTO, indiceDaEtapaDocumento } from "@/lib/contratos-etapas";
import type { ItemPainelContratual, TipoDocumentoContratual } from "@/types/contratos";
import { ROTULO_TIPO_DOCUMENTO } from "@/types/contratos";
import type { Frente } from "@/types/banca";
import {
  PageStack,
  PageButton,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
} from "@/styles/page.styled";
import { FieldInput, FieldSelect, PageHeaderRow, PageHeaderText, PageHeading } from "./Bancas.styled";
import {
  Board,
  Coluna,
  ColunaTitulo,
  ColunaRotuloTexto,
  Ponto,
  Contador,
  Card,
  CardTitulo,
  CardMeta,
  CardFrentes,
  CardFrenteTag,
  ColunaVazia,
} from "@/components/kanban/Kanban.styled";
import { StatusPilula } from "./projetos/Projetos.styled";
import { NovoContratoModal } from "./NovoContratoModal";

/** Uma cor por etapa — mesma ideia de `CORES_STATUS` (`lib/projetos.ts`),
 *  só que pro ciclo de vida do DOCUMENTO, não do projeto. Progressão
 *  neutra → âmbar (esperando alguém agir) → verde (resolvido). */
const CORES_ETAPA = [
  "#9CA3AF", // Preenchimento — cinza, ainda começando
  "#6366F1", // Geração — índigo
  "#F59E0B", // Revisão interna — âmbar, esperando o Jurídico
  "#8B5CF6", // Aprovado internamente — roxo, pronto pra mandar
  "#F97316", // Aprovação do cliente — laranja, esperando resposta de fora
  "#10B981", // Aprovado — verde
  "#6B7280", // Arquivado — cinza escuro, encerrado
];

/**
 * ⭐ 2026-09-21 — a aba Contratos: Kanban por ETAPA DO DOCUMENTO (não etapa
 * de projeto), cross-projeto — substitui a lista simples de antes e a aba
 * "Contratos" que existia dentro de cada projeto (removida). Sem arrastar:
 * cada ação (aprovar internamente, gerar, exportar...) tem validação e
 * permissão própria, então o card só abre a página do documento, que já
 * tem todos os botões certos — a mudança de coluna acontece sozinha.
 */
export function ContratosPainel() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [itens, setItens] = useState<ItemPainelContratual[]>([]);
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mostrarNovoContrato, setMostrarNovoContrato] = useState(false);

  const [frenteSelecionada, setFrenteSelecionada] = useState<number | "">("");
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoDocumentoContratual | "">("");
  const [buscaProjeto, setBuscaProjeto] = useState("");

  useEffect(() => {
    if (!token) return;
    Promise.all([getPainelContratual(token), getFrentes(token)])
      .then(([{ itens: lista }, listaFrentes]) => {
        setItens(lista);
        setFrentes(listaFrentes);
      })
      .catch((err) => setErro(err instanceof Error ? err.message : "Erro ao carregar"))
      .finally(() => setCarregando(false));
  }, [token]);

  const nomeFrente = useMemo(() => {
    const mapa = new Map(frentes.map((f) => [f.id, f.nome]));
    return (id: number) => mapa.get(id) ?? `Frente ${id}`;
  }, [frentes]);

  const tons = useMemo(() => CORES_ETAPA.map((cor) => tonsDaColuna(cor)), []);

  const itensFiltrados = itens.filter((item) => {
    if (frenteSelecionada !== "" && !item.frente_ids.includes(frenteSelecionada)) return false;
    if (tipoSelecionado !== "" && item.tipo !== tipoSelecionado) return false;
    if (buscaProjeto && !item.projeto_nome.toLowerCase().includes(buscaProjeto.toLowerCase())) return false;
    return true;
  });

  if (carregando) return <PageLoadingBlock />;

  return (
    <PageStack>
      <PageHeaderRow>
        <PageHeaderText>
          <PageHeading>Contratos</PageHeading>
        </PageHeaderText>
        <PageButton type="button" onClick={() => setMostrarNovoContrato(true)}>
          + Novo Contrato
        </PageButton>
      </PageHeaderRow>

      {erro && (
        <ErrorBlock>
          <ErrorText>{erro}</ErrorText>
        </ErrorBlock>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
        <FieldSelect
          value={frenteSelecionada}
          onChange={(e) => setFrenteSelecionada(e.target.value ? Number(e.target.value) : "")}
          style={{ maxWidth: "14rem" }}
        >
          <option value="">Todas as frentes</option>
          {frentes.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nome}
            </option>
          ))}
        </FieldSelect>
        <FieldSelect
          value={tipoSelecionado}
          onChange={(e) => setTipoSelecionado(e.target.value as TipoDocumentoContratual | "")}
          style={{ maxWidth: "14rem" }}
        >
          <option value="">Todos os tipos</option>
          {Object.entries(ROTULO_TIPO_DOCUMENTO).map(([tipo, rotulo]) => (
            <option key={tipo} value={tipo}>
              {rotulo}
            </option>
          ))}
        </FieldSelect>
        <FieldInput
          placeholder="Buscar por projeto..."
          value={buscaProjeto}
          onChange={(e) => setBuscaProjeto(e.target.value)}
          style={{ maxWidth: "16rem" }}
        />
      </div>

      <Board $colunas={ETAPAS_DOCUMENTO.length}>
        {ETAPAS_DOCUMENTO.map((rotulo, i) => {
          const itensDaColuna = itensFiltrados.filter((item) => indiceDaEtapaDocumento(item) === i);
          return (
            <Coluna key={rotulo} $cor={tons[i]}>
              <ColunaTitulo>
                <StatusPilula $cor={tons[i]}>
                  <Ponto $cor={tons[i].ponto} />
                  <ColunaRotuloTexto>{rotulo}</ColunaRotuloTexto>
                </StatusPilula>
                <Contador>{itensDaColuna.length}</Contador>
              </ColunaTitulo>

              {itensDaColuna.length === 0 && <ColunaVazia>—</ColunaVazia>}
              {itensDaColuna.map((item) => (
                <Card
                  key={item.id}
                  $cor={tons[i]}
                  role="button"
                  tabIndex={0}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/contratos/${item.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") navigate(`/contratos/${item.id}`);
                  }}
                >
                  <CardTitulo>{item.tipo_rotulo}</CardTitulo>
                  <CardMeta title={item.cliente ?? undefined}>
                    {item.projeto_nome}
                    {item.cliente ? ` · ${item.cliente}` : ""}
                  </CardMeta>
                  {item.frente_ids.length > 0 && (
                    <CardFrentes>
                      {item.frente_ids.map((fid) => (
                        <CardFrenteTag key={fid}>{nomeFrente(fid)}</CardFrenteTag>
                      ))}
                    </CardFrentes>
                  )}
                </Card>
              ))}
            </Coluna>
          );
        })}
      </Board>

      {mostrarNovoContrato && <NovoContratoModal onClose={() => setMostrarNovoContrato(false)} />}
    </PageStack>
  );
}
