import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, List, Plus, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getFrentes } from "@/lib/frentes";
import {
  carregarDiasNaoLetivos,
  definirCalendarioPadrao,
  deleteDiaNaoLetivo,
  getCalendarioDaFrente,
  getCalendariosDaFrente,
  getSemestres,
  lerCalendarioPdf,
  ROTULO_TIPO_DIA,
  type DiaNaoLetivo,
  type LeituraPdf,
  type TipoDiaNaoLetivo,
  type Semestre,
} from "@/lib/calendario-academico";
import { formatarData } from "@/lib/projetos";
import { Th, useOrdenacao, type Colunas } from "@/components/tabela/ordenacao";
import { PaintedCalendar } from "@/components/cronograma-pintado/PaintedCalendar";
import { blocosDaVisao } from "@/components/cronograma-pintado/visao";
import {
  BotaoNav,
  NavPeriodo,
  RotuloPeriodo,
} from "@/components/cronograma-pintado/PaintedCalendar.styled";
import {
  PageStack,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageBadge,
  PageButton,
  PageButtonSm,
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
import {
  CheckboxGrid,
  CheckboxLabel,
  FieldGroup,
  FieldInput,
  FieldLabel,
  NarrowModalContent,
} from "./Bancas.styled";
import {
  SegmentedButton,
  SegmentedGroup,
  TableScrollWrap,
} from "@/styles/shared.styled";
import { ConfirmarModal } from "@/components/ConfirmarModal";
import { AdicionarDiaModal } from "./AdicionarDiaModal";

interface Frente {
  id: number;
  nome: string;
}

/** Fim de semana nunca é importado: o backend já conta só seg–sex que não
 *  estejam na tabela. A caixa existe marcada e travada para deixar isso
 *  visível, sem ela, alguém procuraria onde marcar sábado. */
const FIM_DE_SEMANA_AUTOMATICO = true;

/**
 * Os calendários base por frente, a tela do diretor.
 *
 * Cada frente abrange cursos diferentes, e cada curso tem o seu calendário
 * acadêmico no Insper. É este calendário que define o dia útil dos
 * projetos daquela frente.
 *
 * O PDF é lido, mas NUNCA salvo direto: a leitura é posicional e pode errar se
 * o Insper mudar o layout, então a diretoria filtra por categoria, confere numa
 * tabela e só então grava. É o mesmo contrato do  para a grade horária.
 */
const COLUNAS_DIAS: Colunas<DiaNaoLetivo> = {
  // ISO ordena como texto, que é para o que o formato serve.
  data: { valor: (d) => d.data, inicial: "asc" },
  tipo: { valor: (d) => ROTULO_TIPO_DIA[d.tipo] ?? d.tipo, inicial: "asc" },
  descricao: { valor: (d) => d.descricao, inicial: "asc" },
  // Do mais amplo ao mais estreito: todas as frentes, depois a frente inteira,
  // depois cada curso. É a base sobre a qual cada degrau adiciona os dele.
  //
  // Ordena por texto, e não por número de degrau, porque com dois calendários
  // à vista eles empatariam no mesmo degrau — e é justamente separar um do
  // outro que faz esta coluna valer a pena.
  origem: {
    valor: (d) =>
      d.frente_id === null ? "0" : d.variante === null ? "1" : `2 ${d.variante}`,
    inicial: "asc",
  },
};

/** Por que os botões de gravar ficam travados com mais de um calendário à vista. */
const AVISO_ALVO =
  "Deixe apenas um calendário visível para gravar nele — com dois à vista não dá para " +
  "saber em qual o dia entra.";

export function CalendariosBase() {
  const { token } = useAuth();
  const inputArquivo = useRef<HTMLInputElement>(null);

  const [semestre, setSemestre] = useState<Semestre | null>(null);
  const [frentes, setFrentes] = useState<Frente[]>([]);
  const [frenteAtiva, setFrenteAtiva] = useState<number | null>(null);
  /* Os calendários DENTRO da frente ativa. Vazio é o caso normal: só a Tech
     cobre cursos que discordam sobre as datas, e o seletor nem aparece nas
     outras. */
  const [calendarios, setCalendarios] = useState<string[]>([]);
  const [padrao, setPadrao] = useState<string | null>(null);
  /* Quais calendários estão VISÍVEIS — vários ao mesmo tempo, de propósito.
     Cada dia da tabela diz de quem é na coluna Origem, então ver engenharias
     e Ciência da Computação juntas é comparar as duas, não misturá-las: é
     assim que se enxerga onde elas divergem.

     Os dias que valem para a frente inteira não entram aqui porque não são
     uma opção: eles aparecem sempre, como os feriados nacionais. */
  const [visiveis, setVisiveis] = useState<Set<string>>(new Set());
  const [criando, setCriando] = useState(false);
  const [nomeNovo, setNomeNovo] = useState("");
  const [dias, setDias] = useState<DiaNaoLetivo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const [leitura, setLeitura] = useState<LeituraPdf | null>(null);
  const [categoriasAtivas, setCategoriasAtivas] = useState<Set<string>>(new Set());
  const [salvando, setSalvando] = useState(false);

  const [paraExcluir, setParaExcluir] = useState<DiaNaoLetivo | null>(null);
  const [vendoCalendario, setVendoCalendario] = useState(false);
  const [adicionando, setAdicionando] = useState(false);
  const [mesVisivel, setMesVisivel] = useState<Date | null>(null);

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
      if (ativo) setMesVisivel((atual) => atual ?? new Date(`${ativo.inicio}T12:00:00`));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setCarregando(false);
    }
  }, [token]);

  useEffect(() => {
    carregarBase();
  }, [carregarBase]);

  const carregarCalendarios = useCallback(async () => {
    if (!token || !semestre || !frenteAtiva) return;
    try {
      const resposta = await getCalendariosDaFrente(semestre.id, frenteAtiva, token);
      setCalendarios(resposta.calendarios);
      setPadrao(resposta.padrao);
      /* Abre com TODOS ligados: a tela existe para conferir o calendário da
         frente, e conferir é ver o conjunto. Quem quiser olhar um curso só
         desliga o outro — o contrário, começar escondendo metade, faz a
         divergência entre os dois passar despercebida.

         Um calendário que a diretoria acabou de criar e ainda não gravou não
         volta do servidor; mantê-lo ligado evita que ele saia da tela no meio
         do trabalho. */
      setVisiveis((atual) => {
        const novos = resposta.calendarios.filter((c) => !atual.has(c));
        return novos.length > 0 || atual.size === 0
          ? new Set([...atual, ...resposta.calendarios])
          : atual;
      });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar os calendários da frente");
    }
  }, [token, semestre, frenteAtiva]);

  useEffect(() => {
    carregarCalendarios();
  }, [carregarCalendarios]);

  const carregarDias = useCallback(async () => {
    if (!token || !semestre || !frenteAtiva) return;
    try {
      setDias(await getCalendarioDaFrente(semestre.id, frenteAtiva, token, false, [...visiveis]));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar o calendário");
    }
  }, [token, semestre, frenteAtiva, visiveis]);

  useEffect(() => {
    carregarDias();
  }, [carregarDias]);

  const nomeFrente = frentes.find((f) => f.id === frenteAtiva)?.nome ?? "";

  /**
   * Onde a gravação cai: só existe quando UM calendário está visível.
   *
   * Ver os dois ao mesmo tempo é ótimo para conferir e ambíguo para gravar —
   * um PDF de curso não tem como cair em dois calendários, e `substituir`
   * apagaria o que não era para apagar. Com mais de um ligado a tela não
   * adivinha: pede que se escolha.
   *
   * Numa frente sem calendário de curso o alvo é nulo e continua sendo o que
   * sempre foi: o calendário da frente inteira.
   */
  const alvo = visiveis.size === 1 ? [...visiveis][0] : null;
  const precisaEscolherAlvo = calendarios.length > 0 && alvo === null;

  /* Abre pela data, como sempre abriu — calendário se lê em ordem
     cronológica. As outras colunas viram ferramenta: "quais são feriado?",
     "o que veio do calendário geral e o que é desta frente?". */
  const {
    itens: diasOrdenados,
    ordem: ordemDias,
    ordenarPor: ordenarDias,
  } = useOrdenacao(dias, COLUNAS_DIAS, "data");

  /** As datas escolhidas no filtro, e o que elas significam perante o salvo. */
  const selecionadas = useMemo(
    () => (leitura ?? { dias: [] }).dias.filter((d) => categoriasAtivas.has(d.categoria)),
    [leitura, categoriasAtivas],
  );

  const diff = useMemo(() => {
    if (!leitura) return null;
    const jaSalvas = new Set(dias.map((d) => d.data));
    const novas = selecionadas.filter((d) => !jaSalvas.has(d.data));
    const repetidas = selecionadas.filter((d) => jaSalvas.has(d.data));

    // As categorias por frente são gravadas com `substituir`: o PDF passa a ser
    // a verdade sobre elas. O que está salvo e não veio no PDF vai sumir, e
    // isso precisa estar escrito, não descoberto depois.
    const escolhidas = new Set(selecionadas.map((d) => d.data));
    // Só o que o `substituir` de fato apaga: os dias da frente que estão no
    // calendário ALVO. Um dia que vale para a frente inteira, ou o do outro
    // curso que está visível ao lado, não é tocado — e listá-lo aqui
    // prometeria um estrago que a gravação não faz.
    const removidas = dias.filter(
      (d) => d.frente_id !== null && d.variante === alvo && !escolhidas.has(d.data),
    );
    return { novas, repetidas, removidas };
  }, [leitura, dias, selecionadas, alvo]);

  async function aoEscolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    // Zera o input: sem isso, subir o MESMO arquivo de novo não dispara evento.
    e.target.value = "";
    if (!arquivo || !token || !semestre || !frenteAtiva) return;
    setAviso("");
    try {
      const resultado = await lerCalendarioPdf(
        semestre.id,
        frenteAtiva,
        arquivo,
        token,
        alvo,
      );
      setLeitura(resultado);
      // Todas as categorias que acharam algo vêm marcadas: aceitar a leitura
      // inteira é o caso comum, e desmarcar é mais rápido que marcar sete.
      setCategoriasAtivas(
        new Set(resultado.categorias.filter((c) => c.encontrados > 0).map((c) => c.chave)),
      );
    } catch (err) {
      setAviso(err instanceof Error ? err.message : "Não consegui ler o PDF");
    }
  }

  async function confirmar() {
    if (!token || !semestre || !frenteAtiva || !leitura) return;
    const paraGravar = (d: (typeof selecionadas)[number]) => ({
      data: d.data,
      tipo: d.tipo,
      descricao: d.rotulo,
    });
    setSalvando(true);
    setAviso("");
    try {
      // Dois lotes, com regras diferentes de propósito.
      //
      // O que é da frente SUBSTITUI o que ela tinha: recarregar o PDF do curso
      // é justamente para corrigir as datas dela. O lote leva tudo o que foi
      // selecionado, inclusive o que já estava salvo e por isso não aparece na
      // tabela, mandar só as novas apagaria as antigas.
      // ⚠ A `variante` é o que impede o `substituir` de estourar o
      // calendário vizinho: os dois moram na MESMA frente, e sem ela subir o
      // PDF de Ciência da Computação apagaria o das engenharias.
      await carregarDiasNaoLetivos(
        semestre.id,
        selecionadas.filter((d) => d.escopo === "frente").map(paraGravar),
        token,
        { frenteId: frenteAtiva, substituir: true, variante: alvo },
      );

      // Os feriados NÃO substituem: valem para todas as frentes, e um
      // `substituir` aqui apagaria o calendário global inteiro só porque
      // alguém recarregou o PDF de uma frente. A rota é idempotente por data.
      const globais = selecionadas.filter((d) => d.escopo === "global").map(paraGravar);
      if (globais.length > 0) {
        await carregarDiasNaoLetivos(semestre.id, globais, token, {
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

  /** Um dia só, à mão. Reusa a rota de carga em lote com uma linha. */
  async function adicionarDia(d: {
    data: string;
    tipo: TipoDiaNaoLetivo;
    descricao: string;
    destino: "global" | "frente" | "calendario";
  }) {
    if (!token || !semestre || !frenteAtiva) return;
    setAviso("");
    // `substituir: false` sempre: adicionar um dia não pode limpar o resto.
    await carregarDiasNaoLetivos(
      semestre.id,
      [{ data: d.data, tipo: d.tipo, descricao: d.descricao }],
      token,
      {
        frenteId: d.destino === "global" ? null : frenteAtiva,
        variante: d.destino === "calendario" ? alvo : null,
        substituir: false,
      },
    );
    setAdicionando(false);
    await carregarDias();
    await carregarCalendarios();
  }

  /** Cria um calendário deixando só ele visível — ele passa a existir ao ganhar
   *  o primeiro dia, então aqui não há nada a gravar no banco ainda.
   *
   *  Sozinho de propósito: quem acabou de criar vai subir o PDF em seguida, e
   *  é com um só à vista que os botões de gravar destravam. */
  function criarCalendario() {
    const nome = nomeNovo.trim();
    if (!nome) return;
    if (calendarios.includes(nome)) {
      setAviso(`${nomeFrente} já tem um calendário chamado ${nome}`);
      return;
    }
    setCalendarios((atuais) => [...atuais, nome].sort());
    setVisiveis(new Set([nome]));
    setNomeNovo("");
    setCriando(false);
    setAviso(
      `${nome} ainda está vazio. Suba o PDF do curso, ou adicione os dias à mão, para ele passar ` +
        "a existir — um calendário sem dia nenhum some quando a tela recarrega.",
    );
  }

  async function tornarPadrao() {
    if (!token || !frenteAtiva || !alvo) return;
    setAviso("");
    try {
      await definirCalendarioPadrao(frenteAtiva, alvo, token);
      await carregarCalendarios();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : "Erro ao definir o padrão");
    }
  }

  async function excluir(dia: DiaNaoLetivo) {
    if (!token) return;
    setAviso("");
    await deleteDiaNaoLetivo(dia.id, token);
    setParaExcluir(null);
    await carregarDias();
  }

  /** O mapa que o calendário usa para hachurar, mesmo formato do cronograma. */
  const mapaDeDias = useMemo(() => {
    const mapa = new Map<string, { tipo: string; descricao: string | null }>();
    for (const d of dias) {
      const chave = d.data.slice(0, 10);
      // Com dois calendários visíveis a MESMA data pode vir duas vezes — a
      // prova de um curso e a do outro. A célula é uma só, então o motivo
      // acumula em vez de a segunda leitura apagar a primeira; sem isso o
      // calendário mostraria só um dono e esconderia justamente a coincidência
      // que a diretoria veio conferir.
      const anterior = mapa.get(chave);
      const dono = d.variante ? `${d.descricao ?? d.tipo} (${d.variante})` : d.descricao;
      mapa.set(chave, {
        tipo: d.tipo,
        descricao: anterior?.descricao
          ? [...new Set([anterior.descricao, dono].filter(Boolean))].join(" · ")
          : dono,
      });
    }
    return mapa;
  }, [dias]);

  const blocos = useMemo(
    () => (mesVisivel ? blocosDaVisao("mes", mesVisivel) : []),
    [mesVisivel],
  );

  function navegarMes(passo: number) {
    setMesVisivel((atual) => {
      if (!atual) return atual;
      const proximo = new Date(atual);
      proximo.setDate(1);
      proximo.setMonth(proximo.getMonth() + passo);
      return proximo;
    });
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
  if (!semestre) {
    return <EmptyText>Nenhum semestre cadastrado, crie um em Configurações.</EmptyText>;
  }

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

      <SegmentedGroup role="tablist" aria-label="Frente">
        {frentes.map((f) => (
          <SegmentedButton
            key={f.id}
            type="button"
            role="tab"
            aria-selected={f.id === frenteAtiva}
            $ativo={f.id === frenteAtiva}
            onClick={() => {
              setFrenteAtiva(f.id);
              // Zera o que está visível: "Ciência da Computação" não existe em
              // Business, e carregar a frente nova com o nome antigo pediria
              // um calendário que não está lá. `carregarCalendarios` religa
              // todos os da frente nova em seguida.
              setVisiveis(new Set());
            }}
          >
            {f.nome}
          </SegmentedButton>
        ))}
      </SegmentedGroup>

      {/* Interruptores, não abas: ligar os dois mostra os dois, e é assim que
          se vê onde os cursos divergem. `aria-pressed` em vez de `role="tab"`
          justamente porque não há um selecionado por vez. */}
      {calendarios.length > 0 && (
        <SegmentedGroup role="group" aria-label={`Calendários de ${nomeFrente}`}>
          {calendarios.map((c) => {
            const ligado = visiveis.has(c);
            return (
              <SegmentedButton
                key={c}
                type="button"
                aria-pressed={ligado}
                $ativo={ligado}
                title={ligado ? `Esconder ${c}` : `Mostrar ${c}`}
                onClick={() =>
                  setVisiveis((atuais) => {
                    const novo = new Set(atuais);
                    if (novo.has(c)) novo.delete(c);
                    else novo.add(c);
                    return novo;
                  })
                }
              >
                {c}
                {c === padrao ? " (padrão)" : ""}
              </SegmentedButton>
            );
          })}
        </SegmentedGroup>
      )}

      {aviso && <FormErrorText>{aviso}</FormErrorText>}

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>
            {nomeFrente}
            {alvo ? ` · ${alvo}` : ""}
          </PageCardTitle>
          {alvo && alvo !== padrao && (
            <PageButton
              type="button"
              $variant="ghost"
              onClick={tornarPadrao}
              title={`Projetos de ${nomeFrente} que não escolherem calendário passam a seguir este`}
            >
              Tornar padrão
            </PageButton>
          )}
          <PageButton type="button" $variant="ghost" onClick={() => setCriando(true)}>
            <Plus size={14} />
            Novo calendário
          </PageButton>
          <PageButton
            type="button"
            $variant="ghost"
            disabled={dias.length === 0}
            onClick={() => setVendoCalendario((v) => !v)}
          >
            {vendoCalendario ? <List size={14} /> : <CalendarDays size={14} />}
            {vendoCalendario ? "Ver como lista" : "Ver como calendário"}
          </PageButton>
          {/* Gravar exige um alvo. Com dois calendários visíveis a tela não
              adivinha em qual o PDF cai, e `substituir` apagaria o errado. */}
          <PageButton
            type="button"
            $variant="ghost"
            disabled={precisaEscolherAlvo}
            title={precisaEscolherAlvo ? AVISO_ALVO : undefined}
            onClick={() => setAdicionando(true)}
          >
            <Plus size={14} />
            Adicionar dia
          </PageButton>
          <PageButton
            type="button"
            $variant="outline"
            disabled={precisaEscolherAlvo}
            title={precisaEscolherAlvo ? AVISO_ALVO : undefined}
            onClick={() => inputArquivo.current?.click()}
          >
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
          {dias.length === 0 && (
            <EmptyText>
              Nenhum dia carregado. Suba o PDF do calendário do curso desta frente.
            </EmptyText>
          )}

          {dias.length > 0 && !vendoCalendario && (
            <TableScrollWrap $min="44rem">
              <DataTable>
                <TableHead>
                  <TableRow>
                    <Th coluna="data" ordem={ordemDias} onOrdenar={ordenarDias}>
                      Data
                    </Th>
                    <Th coluna="tipo" ordem={ordemDias} onOrdenar={ordenarDias}>
                      Tipo
                    </Th>
                    <Th coluna="descricao" ordem={ordemDias} onOrdenar={ordenarDias}>
                      Descrição
                    </Th>
                    <Th coluna="origem" ordem={ordemDias} onOrdenar={ordenarDias}>
                      Origem
                    </Th>
                    <TableHeadCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {diasOrdenados
                    .map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{formatarData(d.data)}</TableCell>
                        <TableCell>{ROTULO_TIPO_DIA[d.tipo] ?? d.tipo}</TableCell>
                        <TableCell>{d.descricao ?? "—"}</TableCell>
                        <TableCell>
                          {d.frente_id === null ? (
                            <PageBadge $tone="muted">Todas as frentes</PageBadge>
                          ) : d.variante === null ? (
                            <PageBadge $tone="muted">{nomeFrente}</PageBadge>
                          ) : (
                            <PageBadge>
                              {nomeFrente} · {d.variante}
                            </PageBadge>
                          )}
                        </TableCell>
                        <ActionsCell>
                          <PageButton
                            type="button"
                            $variant="ghost"
                            aria-label={`Excluir ${formatarData(d.data)}`}
                            onClick={() => setParaExcluir(d)}
                          >
                            <Trash2 size={14} />
                          </PageButton>
                        </ActionsCell>
                      </TableRow>
                    ))}
                </TableBody>
              </DataTable>
            </TableScrollWrap>
          )}

          {dias.length > 0 && vendoCalendario && mesVisivel && (
            <>
              <NavPeriodo style={{ marginBottom: "0.75rem" }}>
                <BotaoNav type="button" aria-label="Mês anterior" onClick={() => navegarMes(-1)}>
                  <ChevronLeft size={14} />
                </BotaoNav>
                <BotaoNav type="button" aria-label="Próximo mês" onClick={() => navegarMes(1)}>
                  <ChevronRight size={14} />
                </BotaoNav>
                <RotuloPeriodo>{blocos[0]?.titulo}</RotuloPeriodo>
              </NavPeriodo>

              {/* Reusa o calendário do cronograma em só-leitura: sem etapas nem
                  marcos, sobra exatamente o que esta tela quer mostrar, os
                  dias não úteis hachurados, com o motivo no title. */}
              <PaintedCalendar
                blocos={blocos}
                visao="mes"
                etapas={[]}
                marcos={[]}
                faixas={[]}
                diasNaoUteis={mapaDeDias}
                grupoAtivo={null}
                somenteLeitura
                mostrarMotivo
                semScrollProprio
                onPaintRange={() => {}}
              />
            </>
          )}
        </PageCardContent>
      </PageCard>

      {leitura && diff && (
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
                {leitura.resumo.fora_do_semestre} ficam fora da janela.
              </p>

              {leitura.resumo.nao_reconhecidos > 0 && (
                <FormErrorText>
                  {leitura.resumo.nao_reconhecidos} marcações não foram reconhecidas, o layout do
                  PDF pode ter mudado. Confira a lista com atenção antes de salvar.
                </FormErrorText>
              )}

              <p style={{ fontSize: "0.875rem", fontWeight: 500 }}>O que importar:</p>
              <CheckboxGrid>
                {leitura.categorias.map((c) => (
                  <CheckboxLabel key={c.chave}>
                    <input
                      type="checkbox"
                      checked={categoriasAtivas.has(c.chave)}
                      disabled={c.encontrados === 0}
                      onChange={() =>
                        setCategoriasAtivas((atual) => {
                          const proximo = new Set(atual);
                          if (proximo.has(c.chave)) proximo.delete(c.chave);
                          else proximo.add(c.chave);
                          return proximo;
                        })
                      }
                    />
                    <span>
                      {c.rotulo} ({c.encontrados})
                      {c.escopo === "global" && " · todas as frentes"}
                    </span>
                  </CheckboxLabel>
                ))}
                {/* Não importa nada: existe para deixar visível que o sistema
                    já trata fim de semana, senão alguém procuraria onde marcar. */}
                <CheckboxLabel>
                  <input type="checkbox" checked={FIM_DE_SEMANA_AUTOMATICO} disabled readOnly />
                  <span>Fim de semana · já é sempre não útil, não precisa importar</span>
                </CheckboxLabel>
              </CheckboxGrid>

              {diff.repetidas.length > 0 && (
                <p style={{ fontSize: "0.875rem" }}>
                  {diff.repetidas.length} datas já estão no calendário e não aparecem abaixo, elas
                  continuam salvas.
                </p>
              )}

              {diff.removidas.length > 0 && (
                <FormErrorText>
                  {diff.removidas.length} datas de {nomeFrente} não estão nesta seleção e serão{" "}
                  <strong>removidas</strong>:{" "}
                  {diff.removidas.map((d) => formatarData(d.data)).join(", ")}
                </FormErrorText>
              )}

              {diff.novas.length === 0 ? (
                <EmptyText>Nenhuma data nova com as categorias marcadas.</EmptyText>
              ) : (
                <TableScrollWrap $min="36rem">
                  <DataTable>
                    <TableHead>
                      <TableRow>
                        <TableHeadCell>Data</TableHeadCell>
                        <TableHeadCell>Categoria</TableHeadCell>
                        <TableHeadCell>Vai gravar como</TableHeadCell>
                        <TableHeadCell>Onde</TableHeadCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {diff.novas.map((d) => (
                        <TableRow key={d.data}>
                          <TableCell>{formatarData(d.data)}</TableCell>
                          <TableCell>{d.rotulo}</TableCell>
                          <TableCell>{ROTULO_TIPO_DIA[d.tipo] ?? d.tipo}</TableCell>
                          <TableCell>
                            {d.escopo === "global" ? (
                              <PageBadge $tone="muted">Todas as frentes</PageBadge>
                            ) : (
                              <PageBadge>
                                {nomeFrente}
                                {alvo ? ` · ${alvo}` : ""}
                              </PageBadge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </DataTable>
                </TableScrollWrap>
              )}
            </ModalBody>

            <ModalFooter>
              <PageButton type="button" $variant="outline" onClick={() => setLeitura(null)}>
                Cancelar
              </PageButton>
              <PageButton type="button" disabled={salvando} onClick={confirmar}>
                {salvando ? "Salvando…" : `Adicionar ${diff.novas.length} dias`}
              </PageButton>
            </ModalFooter>
          </WideModalContent>
        </ModalOverlay>
      )}

      {criando && (
        <ModalOverlay onMouseDown={() => setCriando(false)}>
          <NarrowModalContent onMouseDown={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Novo calendário em {nomeFrente}</ModalTitle>
              <ModalClose type="button" onClick={() => setCriando(false)}>
                ×
              </ModalClose>
            </ModalHeader>
            <ModalBody>
              <FieldGroup>
                <FieldLabel htmlFor="nome-calendario">Nome do curso</FieldLabel>
                <FieldInput
                  id="nome-calendario"
                  maxLength={30}
                  autoFocus
                  value={nomeNovo}
                  onChange={(e) => setNomeNovo(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && criarCalendario()}
                />
              </FieldGroup>
            </ModalBody>
            <ModalFooter>
              <PageButton type="button" $variant="outline" onClick={() => setCriando(false)}>
                Cancelar
              </PageButton>
              <PageButton type="button" disabled={!nomeNovo.trim()} onClick={criarCalendario}>
                Criar
              </PageButton>
            </ModalFooter>
          </NarrowModalContent>
        </ModalOverlay>
      )}

      {adicionando && semestre && (
        <AdicionarDiaModal
          nomeFrente={nomeFrente}
          nomeCalendario={alvo}
          semestre={semestre}
          onCancelar={() => setAdicionando(false)}
          onSalvar={adicionarDia}
        />
      )}

      {paraExcluir && (
        <ConfirmarModal
          titulo="Excluir dia não útil"
          mensagem={
            <>
              {formatarData(paraExcluir.data)}, {paraExcluir.descricao ?? paraExcluir.tipo}
              {paraExcluir.frente_id === null && (
                <>
                  {" "}
                  <strong>
                    Este dia vale para TODAS as frentes: excluir aqui o remove de todas elas.
                  </strong>
                </>
              )}
              {paraExcluir.frente_id !== null && paraExcluir.variante === null && (
                <>
                  {" "}
                  <strong>
                    Este dia vale para {nomeFrente} inteira: excluir aqui o remove de todos os
                    cursos dela.
                  </strong>
                </>
              )}
            </>
          }
          onCancelar={() => setParaExcluir(null)}
          onConfirmar={() => excluir(paraExcluir)}
        />
      )}
    </PageStack>
  );
}
