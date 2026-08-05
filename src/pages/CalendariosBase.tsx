import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getFrentes } from "@/lib/frentes";
import {
  carregarDiasNaoLetivos,
  deleteDiaNaoLetivo,
  getCalendarioDaFrente,
  getSemestres,
  lerCalendarioPdf,
  ROTULO_TIPO_DIA,
  type DiaNaoLetivo,
  type LeituraPdf,
  type Semestre,
} from "@/lib/calendario-academico";
import { formatarData } from "@/lib/projetos";
import {
  PageStack,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageBadge,
  PageButton,
  PageLoadingBlock,
  EmptyText,
  ErrorBlock,
  ErrorText,
} from "@/styles/page.styled";
import {
  PageHeaderRow,
  PageHeaderText,
  PageHeading,
  PageSubheading,
  DataTable,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
  ActionsCell,
  FormErrorText,
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  WideModalContent,
} from "./Config.styled";
import { TableScrollWrap } from "@/styles/shared.styled";
import { GrupoVisao, BotaoVisao } from "@/components/cronograma-pintado/PaintedCalendar.styled";

interface Frente {
  id: number;
  nome: string;
}

/**
 * Os calendários base por frente — a tela do diretor.
 *
 * Cada frente abrange cursos diferentes, e cada curso tem o seu calendário
 * acadêmico no Insper. É este calendário que define o dia útil (§5.4) dos
 * projetos daquela frente.
 *
 * O PDF é lido, mas NUNCA salvo direto: a leitura é posicional e pode errar se
 * o Insper mudar o layout, então a diretoria confere numa tabela e só então
 * grava. É o mesmo contrato do §11 para a grade horária.
 */
export function CalendariosBase() {
  const { token } = useAuth();
  const inputArquivo = useRef<HTMLInputElement>(null);

  const [semestre, setSemestre] = useState<Semestre | null>(null);
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [frenteAtiva, setFrenteAtiva] = useState<number | null>(null);
  const [dias, setDias] = useState<DiaNaoLetivo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const [leitura, setLeitura] = useState<LeituraPdf | null>(null);
  const [escolhidos, setEscolhidos] = useState<Set<string>>(new Set());
  const [salvando, setSalvando] = useState(false);

  const carregarBase = useCallback(async () => {
    if (!token) return;
    setErro("");
    try {
      const [semestres, listaFrentes] = await Promise.all([
        getSemestres(token),
        getFrentes(token),
      ]);
      const ativo = semestres.find((s) => s.status === "ativa") ?? semestres[0] ?? null;
      setSemestre(ativo);
      setFrentes(listaFrentes as Frente[]);
      setFrenteAtiva((atual) => atual ?? (listaFrentes as Frente[])[0]?.id ?? null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => {
    carregarBase();
  }, [carregarBase]);

  const carregarDias = useCallback(async () => {
    if (!token || !semestre || !frenteAtiva) return;
    try {
      setDias(await getCalendarioDaFrente(semestre.id, frenteAtiva, token));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar o calendário");
    }
  }, [token, semestre, frenteAtiva]);

  useEffect(() => {
    carregarDias();
  }, [carregarDias]);

  const nomeFrente = frentes.find((f) => f.id === frenteAtiva)?.nome ?? "";

  const { daFrente, globais } = useMemo(
    () => ({
      daFrente: dias.filter((d) => d.frente_id !== null),
      globais: dias.filter((d) => d.frente_id === null),
    }),
    [dias],
  );

  /**
   * O que a leitura do PDF significa perante o calendário que já está salvo.
   *
   * Mostrar as datas que já estão lá só faz a lista crescer sem informação —
   * o que a diretoria precisa conferir é o que MUDA.
   */
  const diff = useMemo(() => {
    if (!leitura) return null;
    const jaSalvas = new Set(dias.map((d) => d.data));

    const novas = leitura.dias.filter((d) => !jaSalvas.has(d.data));
    const repetidas = leitura.dias.filter((d) => jaSalvas.has(d.data));

    // As avaliações são gravadas com `substituir`: o PDF passa a ser a verdade
    // sobre as datas de prova desta frente. Então o que está salvo e NÃO veio
    // no PDF vai sumir — e isso precisa estar escrito, não descoberto depois.
    const noPdf = new Set(leitura.dias.map((d) => d.data));
    const removidas = daFrente.filter((d) => d.tipo === "prova" && !noPdf.has(d.data));

    return { novas, repetidas, removidas };
  }, [leitura, dias, daFrente]);

  async function aoEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    // Zera o input: sem isso, subir o MESMO arquivo de novo não dispara evento.
    e.target.value = "";
    if (!arquivo || !token || !semestre || !frenteAtiva) return;
    setAviso("");
    try {
      const resultado = await lerCalendarioPdf(semestre.id, frenteAtiva, arquivo, token);
      setLeitura(resultado);
      // Marca tudo: o caso comum é aceitar a leitura inteira. O que já está
      // salvo some da tabela, mas continua no lote — ver `confirmar`.
      setEscolhidos(new Set(resultado.dias.map((d) => d.data)));
    } catch (err) {
      setAviso(err instanceof Error ? err.message : "Não consegui ler o PDF");
    }
  }

  async function confirmar() {
    if (!token || !semestre || !frenteAtiva || !leitura) return;
    const escolha = leitura.dias.filter((d) => escolhidos.has(d.data));
    const paraGravar = (d: (typeof escolha)[number]) => ({
      data: d.data,
      tipo: d.tipo,
      descricao: d.descricao,
    });
    setSalvando(true);
    setAviso("");
    try {
      // Dois lotes, com regras diferentes de propósito.
      //
      // As avaliações SUBSTITUEM o que a frente tinha: recarregar o PDF do
      // curso é justamente para corrigir as datas de prova dela.
      //
      // Atenção: o lote leva TODAS as avaliações do PDF, inclusive as que já estavam
      // salvas e por isso não aparecem na tabela de conferência. Mandar só as
      // novas, com `substituir` ligado, apagaria as antigas — a tabela esconde
      // o que não mudou, mas o lote precisa continuar completo.
      await carregarDiasNaoLetivos(
        semestre.id,
        escolha.filter((d) => d.escopo === "frente").map(paraGravar),
        token,
        { frenteId: frenteAtiva, substituir: true },
      );

      // Os feriados NÃO substituem: eles valem para todas as frentes, e um
      // `substituir` aqui apagaria o calendário global inteiro só porque
      // alguém recarregou o PDF de uma frente. A rota é idempotente por data,
      // então subir o mesmo feriado de novo é inofensivo.
      const feriados = escolha.filter((d) => d.escopo === "global").map(paraGravar);
      if (feriados.length > 0) {
        await carregarDiasNaoLetivos(semestre.id, feriados, token, {
          frenteId: null,
          substituir: false,
        });
      }

      setLeitura(null);
      await carregarDias();
    } catch (err) {
      setAviso(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(dia: DiaNaoLetivo) {
    if (!token) return;
    setAviso("");
    try {
      await deleteDiaNaoLetivo(dia.id, token);
      await carregarDias();
    } catch (err) {
      setAviso(err instanceof Error ? err.message : "Erro ao excluir");
    }
  }

  if (carregando) return <PageLoadingBlock />;
  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>{erro}</ErrorText>
        <PageButton $variant="outline" onClick={carregarBase}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }
  if (!semestre) return <EmptyText>Cadastre um semestre antes de montar os calendários.</EmptyText>;

  return (
    <PageStack>
      <PageHeaderRow>
        <PageHeaderText>
          <PageHeading>Calendários base</PageHeading>
          <PageSubheading>
            O calendário acadêmico de cada frente em {semestre.nome}. É ele que define o dia útil
            dos projetos daquela frente.
          </PageSubheading>
        </PageHeaderText>
      </PageHeaderRow>

      <GrupoVisao role="tablist" aria-label="Frente">
        {frentes.map((f) => (
          <BotaoVisao
            key={f.id}
            type="button"
            role="tab"
            aria-selected={f.id === frenteAtiva}
            $ativo={f.id === frenteAtiva}
            onClick={() => setFrenteAtiva(f.id)}
          >
            {f.nome}
          </BotaoVisao>
        ))}
      </GrupoVisao>

      {aviso && <FormErrorText>{aviso}</FormErrorText>}

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>{nomeFrente}</PageCardTitle>
          <PageButton type="button" $variant="outline" onClick={() => inputArquivo.current?.click()}>
            <Upload size={14} />
            Subir PDF do calendário
          </PageButton>
          <input
            ref={inputArquivo}
            type="file"
            accept="application/pdf,.pdf"
            hidden
            onChange={aoEscolherArquivo}
          />
        </PageCardHeader>

        <PageCardContent>
          {daFrente.length === 0 && globais.length === 0 && (
            <EmptyText>
              Nenhum dia carregado. Suba o PDF do calendário do curso desta frente.
            </EmptyText>
          )}

          {(daFrente.length > 0 || globais.length > 0) && (
            <TableScrollWrap>
              <DataTable>
                <TableHead>
                  <TableRow>
                    <TableHeadCell>Data</TableHeadCell>
                    <TableHeadCell>Tipo</TableHeadCell>
                    <TableHeadCell>Descrição</TableHeadCell>
                    <TableHeadCell>Origem</TableHeadCell>
                    <TableHeadCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[...daFrente, ...globais]
                    .sort((a, b) => a.data.localeCompare(b.data))
                    .map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{formatarData(d.data)}</TableCell>
                        <TableCell>{ROTULO_TIPO_DIA[d.tipo] ?? d.tipo}</TableCell>
                        <TableCell>{d.descricao ?? "—"}</TableCell>
                        <TableCell>
                          {d.frente_id === null ? (
                            <PageBadge $tone="muted">Todas as frentes</PageBadge>
                          ) : (
                            <PageBadge>{nomeFrente}</PageBadge>
                          )}
                        </TableCell>
                        <ActionsCell>
                          {/* Um dia global não se apaga de dentro de uma frente:
                              ele vale para as outras também, e some para todas. */}
                          {d.frente_id !== null && (
                            <PageButton
                              type="button"
                              $variant="ghost"
                              aria-label={`Excluir ${formatarData(d.data)}`}
                              onClick={() => excluir(d)}
                            >
                              <Trash2 size={14} />
                            </PageButton>
                          )}
                        </ActionsCell>
                      </TableRow>
                    ))}
                </TableBody>
              </DataTable>
            </TableScrollWrap>
          )}
        </PageCardContent>
      </PageCard>

      {leitura && (
        <ModalOverlay onMouseDown={() => !salvando && setLeitura(null)}>
          <WideModalContent onMouseDown={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Conferir a leitura do PDF</ModalTitle>
              <ModalClose type="button" aria-label="Fechar" onClick={() => setLeitura(null)}>
                ×
              </ModalClose>
            </ModalHeader>

            <ModalBody>
              <p style={{ marginTop: 0, fontSize: "0.875rem" }}>
                Li <strong>{leitura.resumo.lidos}</strong> marcações no PDF.{" "}
                <strong>{leitura.resumo.no_semestre}</strong> caem dentro de {semestre.nome};{" "}
                {leitura.resumo.fora_do_semestre} ficam fora da janela e{" "}
                {leitura.resumo.recessos_ignorados} são recessos, que não contam como dia não útil.
              </p>

              {leitura.resumo.nao_reconhecidos > 0 && (
                <FormErrorText>
                  {leitura.resumo.nao_reconhecidos} marcações não foram reconhecidas — o layout do
                  PDF pode ter mudado. Confira a lista com atenção antes de salvar.
                </FormErrorText>
              )}

              <p style={{ fontSize: "0.875rem" }}>
                Os <strong>{leitura.resumo.globais} feriados</strong> vão para o calendário de{" "}
                <strong>todas as frentes</strong> — feriado é do país, não do curso. As{" "}
                <strong>{leitura.resumo.da_frente} datas de avaliação</strong> ficam só em{" "}
                {nomeFrente} e <strong>substituem</strong> as que ela tinha, já que cada curso tem
                as suas. As outras frentes não são afetadas.
              </p>
              {diff && diff.repetidas.length > 0 && (
                <p style={{ fontSize: "0.875rem" }}>
                  {diff.repetidas.length} datas do PDF já estão no calendário e não aparecem
                  abaixo — elas continuam salvas.
                </p>
              )}

              {diff && diff.removidas.length > 0 && (
                <FormErrorText>
                  {diff.removidas.length} datas de avaliação que estão hoje em {nomeFrente} não
                  vieram neste PDF e serão <strong>removidas</strong>:{" "}
                  {diff.removidas.map((d) => formatarData(d.data)).join(", ")}
                </FormErrorText>
              )}

              <p style={{ fontSize: "0.875rem" }}>Desmarque o que não deve entrar.</p>

              {diff && diff.novas.length === 0 && (
                <EmptyText>Nenhuma data nova — o calendário já está em dia com este PDF.</EmptyText>
              )}

              <TableScrollWrap>
                <DataTable>
                  <TableHead>
                    <TableRow>
                      <TableHeadCell />
                      <TableHeadCell>Data</TableHeadCell>
                      <TableHeadCell>Código</TableHeadCell>
                      <TableHeadCell>Vai gravar como</TableHeadCell>
                      <TableHeadCell>Onde</TableHeadCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(diff?.novas ?? []).map((d) => (
                      <TableRow key={d.data}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={escolhidos.has(d.data)}
                            aria-label={`Incluir ${formatarData(d.data)}`}
                            onChange={() =>
                              setEscolhidos((atual) => {
                                const proximo = new Set(atual);
                                if (proximo.has(d.data)) proximo.delete(d.data);
                                else proximo.add(d.data);
                                return proximo;
                              })
                            }
                          />
                        </TableCell>
                        <TableCell>{formatarData(d.data)}</TableCell>
                        <TableCell>
                          <PageBadge $tone="muted">{d.codigo}</PageBadge> {d.descricao}
                        </TableCell>
                        <TableCell>{ROTULO_TIPO_DIA[d.tipo] ?? d.tipo}</TableCell>
                        <TableCell>
                          {d.escopo === "global" ? (
                            <PageBadge $tone="muted">Todas as frentes</PageBadge>
                          ) : (
                            <PageBadge>{nomeFrente}</PageBadge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </DataTable>
              </TableScrollWrap>
            </ModalBody>

            <ModalFooter>
              <PageButton type="button" $variant="outline" onClick={() => setLeitura(null)}>
                Cancelar
              </PageButton>
              <PageButton type="button" disabled={salvando} onClick={confirmar}>
                {salvando
                  ? "Salvando…"
                  : `Adicionar ${(diff?.novas ?? []).filter((d) => escolhidos.has(d.data)).length} dias`}
              </PageButton>
            </ModalFooter>
          </WideModalContent>
        </ModalOverlay>
      )}
    </PageStack>
  );
}
