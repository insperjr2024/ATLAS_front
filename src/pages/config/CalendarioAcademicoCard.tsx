import { useEffect, useState } from "react";
import { Archive, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  carregarDiasNaoLetivos,
  deleteDiaNaoLetivo,
  getDiasNaoLetivos,
  getSemestres,
  interpretarColagem,
  ROTULO_TIPO_DIA,
  updateSemestre,
  type DiaNaoLetivo,
  type Semestre,
} from "@/lib/calendario-academico";
import { formatarData } from "@/lib/projetos";
import { ConfirmarModal } from "@/components/ConfirmarModal";
import {
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageBadge,
  PageButton,
  PageButtonSm,
  EmptyText,
} from "@/styles/page.styled";
import {
  DataTable,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
  ActionsCell,
  FieldGroup,
  FieldLabel,
  FormErrorText,
} from "../Config.styled";
import { FieldTextarea } from "../Bancas.styled";
import { LIST_MAX_VISIVEIS, TableScrollWrap } from "@/styles/shared.styled";

const EXEMPLO = `07/09/2026; feriado; Independência
12/10/2026; feriado; Nossa Senhora Aparecida
28/09/2026; prova; Semana de provas P1`;

/**
 * A carga do calendário acadêmico do Insper — **é isto que define o dia
 * útil** (§5.4).
 *
 * Sem esta tela, o backend tinha a rota e o seed tinha os dados, mas a
 * diretoria não conseguia carregar o calendário de um semestre novo pela
 * aplicação. É o passo 1 do roteiro de demo, e toda contagem do sistema
 * depende dele: sem os dias não letivos, `contar_dias_uteis` só exclui fim de
 * semana e o feriado de 07/09 conta como dia trabalhado.
 */
export function CalendarioAcademicoCard() {
  const { token } = useAuth();
  const [semestres, setSemestres] = useState<Semestre[]>([]);
  const [ativo, setAtivo] = useState<Semestre | null>(null);
  const [dias, setDias] = useState<DiaNaoLetivo[]>([]);
  const [colagem, setColagem] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [confirmandoArquivamento, setConfirmandoArquivamento] = useState(false);

  async function carregar() {
    if (!token) return;
    setErro("");
    try {
      const lista = await getSemestres(token);
      setSemestres(lista);
      const emAndamento = lista.find((s) => s.status === "ativa") ?? lista[0] ?? null;
      setAtivo(emAndamento);
      setDias(emAndamento ? await getDiasNaoLetivos(emAndamento.id, token) : []);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar o calendário");
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function carregarColagem() {
    if (!token || !ativo) return;
    const { dias: interpretados, erros } = interpretarColagem(colagem);
    if (erros.length > 0) {
      setErro(erros.join(" · "));
      return;
    }
    if (interpretados.length === 0) {
      setErro("Nenhuma data reconhecida. Use uma linha por dia.");
      return;
    }
    setSalvando(true);
    setErro("");
    setAviso("");
    try {
      const resultado = await carregarDiasNaoLetivos(ativo.id, interpretados, token);
      setColagem("");
      setAviso(
        `${resultado.criados} dia(s) carregado(s)` +
          (resultado.ignorados > 0 ? ` · ${resultado.ignorados} já estavam no calendário.` : "."),
      );
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar os dias");
    } finally {
      setSalvando(false);
    }
  }

  async function arquivar() {
    if (!token || !ativo) return;
    await updateSemestre(ativo.id, { status: "arquivada" }, token);
    setConfirmandoArquivamento(false);
    await carregar();
  }

  async function remover(dia: DiaNaoLetivo) {
    if (!token) return;
    try {
      await deleteDiaNaoLetivo(dia.id, token);
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao remover o dia");
    }
  }

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>
          Calendário do Insper{ativo ? ` · ${ativo.nome}` : ""}
        </PageCardTitle>
        {ativo && (
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <PageBadge $tone={ativo.status === "ativa" ? "success" : "muted"}>
              {ativo.status === "ativa" ? "gestão ativa" : "arquivada"}
            </PageBadge>
            {ativo.status === "ativa" && (
              <PageButtonSm
                type="button"
                $variant="outline"
                onClick={() => setConfirmandoArquivamento(true)}
              >
                <Archive size={14} />
                Arquivar gestão
              </PageButtonSm>
            )}
          </div>
        )}
      </PageCardHeader>

      <PageCardContent>
        {!ativo ? (
          <EmptyText>
            Nenhuma gestão cadastrada. Crie um semestre para poder carregar o calendário.
          </EmptyText>
        ) : (
          <>
            <EmptyText style={{ marginBottom: "0.75rem" }}>
              É esta carga que define o <strong>dia útil</strong> do sistema. Sem ela, só o
              fim de semana é excluído — feriados e semanas de prova contariam como dias
              trabalhados em todos os escopos. De {formatarData(ativo.inicio)} a{" "}
              {formatarData(ativo.fim)}.
            </EmptyText>

            <FieldGroup>
              <FieldLabel htmlFor="colagem-calendario">
                Colar o calendário — uma linha por dia: <code>data; tipo; descrição</code>
              </FieldLabel>
              <FieldTextarea
                id="colagem-calendario"
                value={colagem}
                onChange={(e) => setColagem(e.target.value)}
                placeholder={EXEMPLO}
                rows={5}
              />
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <PageButton type="button" disabled={salvando || !colagem.trim()} onClick={carregarColagem}>
                  <Upload size={14} />
                  {salvando ? "Carregando…" : "Carregar dias"}
                </PageButton>
                <EmptyText style={{ fontSize: "0.7rem" }}>
                  tipos aceitos: feriado · prova · recesso · outro
                </EmptyText>
              </div>
            </FieldGroup>

            {erro && <FormErrorText>{erro}</FormErrorText>}
            {aviso && <EmptyText style={{ color: "green" }}>{aviso}</EmptyText>}

            <div style={{ marginTop: "1rem" }}>
              {dias.length === 0 ? (
                <EmptyText>
                  ⚠ Nenhum dia não letivo carregado — a contagem de dias úteis está considerando
                  todos os dias de semana como trabalháveis.
                </EmptyText>
              ) : (
                <TableScrollWrap $scrollable={dias.length > LIST_MAX_VISIVEIS}>
                  <DataTable>
                    <TableHead>
                      <TableRow>
                        <TableHeadCell>Data</TableHeadCell>
                        <TableHeadCell>Tipo</TableHeadCell>
                        <TableHeadCell>Descrição</TableHeadCell>
                        <TableHeadCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dias.map((dia) => (
                        <TableRow key={dia.id}>
                          <TableCell>{formatarData(dia.data)}</TableCell>
                          <TableCell>{ROTULO_TIPO_DIA[dia.tipo] ?? dia.tipo}</TableCell>
                          <TableCell>{dia.descricao ?? "—"}</TableCell>
                          <ActionsCell>
                            <PageButtonSm
                              type="button"
                              $variant="ghost"
                              aria-label={`Remover ${dia.data}`}
                              onClick={() => remover(dia)}
                            >
                              <Trash2 size={14} />
                            </PageButtonSm>
                          </ActionsCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </DataTable>
                </TableScrollWrap>
              )}
            </div>

            {semestres.length > 1 && (
              <EmptyText style={{ marginTop: "0.75rem" }}>
                {semestres.length} gestões cadastradas. As arquivadas ficam acessíveis no histórico.
              </EmptyText>
            )}
          </>
        )}
      </PageCardContent>

      {confirmandoArquivamento && ativo && (
        <ConfirmarModal
          titulo="Arquivar gestão"
          mensagem={`Arquivar a gestão ${ativo.nome}? Os indicadores reiniciam na próxima.`}
          rotuloConfirmar="Arquivar"
          onCancelar={() => setConfirmandoArquivamento(false)}
          onConfirmar={arquivar}
        />
      )}
    </PageCard>
  );
}
