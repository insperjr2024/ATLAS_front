import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import {
  alocarDireto,
  getCandidatos,
  type CandidatoAlocacao,
  type ProjetoComVaga,
} from "@/lib/vagas";
import { PageButtonSm, EmptyText, ErrorText } from "@/styles/page.styled";
import { FieldGroup, FieldLabel, FieldSelect } from "./Bancas.styled";
import {
  PainelOverlay,
  PainelLateral,
  PainelCabecalho,
  PainelTitulo,
  PainelFechar,
  PainelFiltros,
  PainelCorpo,
  PainelSecao,
  PainelSecaoTitulo,
  PainelGrupo,
  PainelGrupoTitulo,
  CandidatoLista,
  CandidatoLinha,
  CandidatoTopo,
  CandidatoInfo,
  CandidatoNome,
  CandidatoMeta,
  CandidatoSituacao,
  BotaoDeTexto,
  CandidatoProjetos,
  CardNome,
  CardLinha,
} from "./Vagas.styled";

const TODAS = "__todas__";

/**
 * Distribui a lista por frente, da frente com mais gente para a com menos.
 *
 * Com uma frente selecionada devolve um grupo só — o cabeçalho some na
 * renderização, porque repetiria o que o filtro já diz.
 *
 * Quem tem duas frentes aparece nos dois grupos, de propósito: o gerente que
 * procura gente da frente dele precisa encontrá-la ali, e não num grupo
 * combinado que ele não pensaria em abrir.
 */
function agruparPorFrente(
  lista: CandidatoAlocacao[],
  frente: string,
): [string, CandidatoAlocacao[]][] {
  if (frente !== TODAS) return [[frente, lista]];
  const mapa = new Map<string, CandidatoAlocacao[]>();
  for (const c of lista) {
    for (const chave of c.frentes.length > 0 ? c.frentes : [SEM_FRENTE]) {
      mapa.set(chave, [...(mapa.get(chave) ?? []), c]);
    }
  }
  return [...mapa.entries()].sort((a, b) =>
    a[0] === SEM_FRENTE ? 1 : b[0] === SEM_FRENTE ? -1 : b[1].length - a[1].length,
  );
}

/**
 * Uma pessoa na lista: nome e uma linha de apoio em texto corrido.
 *
 * Fora do componente do painel de propósito — declarada dentro, ela seria uma
 * função nova a cada render e o React remontaria todas as linhas a cada
 * clique, em vez de atualizar.
 */
function Pessoa({
  candidato: c,
  bloqueado,
  alocando,
  onAlocar,
}: {
  candidato: CandidatoAlocacao;
  bloqueado: boolean;
  alocando: boolean;
  onAlocar: (usuarioId: number) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const idProjetos = `projetos-de-${c.usuario_id}`;

  return (
    <CandidatoLinha>
      <CandidatoTopo>
        <CandidatoInfo>
          <CandidatoNome>{c.nome}</CandidatoNome>
          <CandidatoMeta>
            {c.carga === 0 ? (
              "nenhum projeto"
            ) : (
              <BotaoDeTexto
                type="button"
                aria-expanded={aberto}
                aria-controls={idProjetos}
                onClick={() => setAberto((v) => !v)}
              >
                {c.carga} {c.carga === 1 ? "projeto" : "projetos"}
                {aberto ? (
                  <ChevronDown size={12} aria-hidden="true" />
                ) : (
                  <ChevronRight size={12} aria-hidden="true" />
                )}
              </BotaoDeTexto>
            )}
            {c.situacao && (
              <>
                {" · "}
                <CandidatoSituacao $tom={c.situacao.tom}>{c.situacao.nome}</CandidatoSituacao>
              </>
            )}
            {c.posicao !== "consultor" && ` · ${c.posicao}`}
          </CandidatoMeta>
        </CandidatoInfo>
        <PageButtonSm
          type="button"
          disabled={bloqueado || alocando}
          onClick={() => onAlocar(c.usuario_id)}
        >
          {alocando ? "Alocando…" : "Alocar"}
        </PageButtonSm>
      </CandidatoTopo>

      {aberto && c.carga > 0 && (
        <CandidatoProjetos id={idProjetos}>
          {c.projetos.map((p) => (
            <li key={p.id}>{p.nome}</li>
          ))}
        </CandidatoProjetos>
      )}
    </CandidatoLinha>
  );
}

/** Sem frente cadastrada. Vai por último e não some: quem não tem vínculo
 *  continua alocável, e escondê-lo deixaria o gerente sem entender a ausência. */
const SEM_FRENTE = "Sem frente";

interface Props {
  projeto: ProjetoComVaga;
  token: string;
  onFechar: () => void;
  /** Recarrega a grade — a ocupação do projeto muda a cada alocação. */
  onAlocou: () => void;
}

/**
 * O painel de alocar gente num projeto (§7.3).
 *
 * A lista vem do back ordenada por carga crescente — a mesma régua do
 * `AlocarPessoasModal` das bancas. A decisão que se quer favorecer é
 * distribuir, e ordenar por nome obrigaria a varrer tudo para achar quem está
 * livre.
 *
 * Cada pessoa mostra DUAS linhas: nome e "3 projetos · Carga alta". Antes
 * eram quatro etiquetas soltas por pessoa (carga, situação, posição, "pediu")
 * e a pergunta que o painel existe para responder — quem está mais livre —
 * se perdia no meio delas. Quem pediu para entrar virou uma seção no topo,
 * que é informação sobre a FILA, não sobre a pessoa.
 */
export function VagasAlocarPainel({ projeto, token, onFechar, onAlocou }: Props) {
  const [candidatos, setCandidatos] = useState<CandidatoAlocacao[] | null>(null);
  const [frente, setFrente] = useState(TODAS);
  const [alocando, setAlocando] = useState<number | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  useEffect(() => {
    let ativo = true;
    getCandidatos(projeto.id, token)
      .then((lista) => {
        if (ativo) setCandidatos(lista);
      })
      .catch((e) => {
        if (ativo) setErro(e instanceof Error ? e.message : "Erro ao carregar os candidatos");
      });
    return () => {
      ativo = false;
    };
  }, [projeto.id, token]);

  async function alocar(usuarioId: number) {
    setAlocando(usuarioId);
    setErro("");
    try {
      await alocarDireto(projeto.id, usuarioId, token);
      setCandidatos((atual) => (atual ?? []).filter((c) => c.usuario_id !== usuarioId));
      onAlocou();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao alocar");
    } finally {
      setAlocando(null);
    }
  }

  const frentesDisponiveis = useMemo(() => {
    const nomes = new Set<string>();
    for (const c of candidatos ?? []) {
      if (c.frentes.length === 0) nomes.add(SEM_FRENTE);
      for (const f of c.frentes) nomes.add(f);
    }
    return [...nomes].sort((a, b) =>
      a === SEM_FRENTE ? 1 : b === SEM_FRENTE ? -1 : a.localeCompare(b),
    );
  }, [candidatos]);

  const visiveis = useMemo(
    () =>
      (candidatos ?? []).filter(
        (c) =>
          frente === TODAS ||
          (frente === SEM_FRENTE ? c.frentes.length === 0 : c.frentes.includes(frente)),
      ),
    [candidatos, frente],
  );

  // Quem levantou a mão vem primeiro, fora do agrupamento por frente: é a
  // fila que já existe, e ignorá-la para alocar um terceiro é justamente a
  // decisão que a tela deveria deixar consciente.
  const pediram = visiveis.filter((c) => c.pediu_para_entrar);
  const demais = visiveis.filter((c) => !c.pediu_para_entrar);

  // As duas seções usam a mesma distribuição por frente: quem pediu para
  // entrar também precisa ser lido por frente, senão a seção do topo é a
  // única da tela em que o gerente não consegue localizar a dele de relance.
  const gruposPediram = useMemo(() => agruparPorFrente(pediram, frente), [pediram, frente]);
  const gruposDemais = useMemo(() => agruparPorFrente(demais, frente), [demais, frente]);

  const semVaga = projeto.vagas === 0;

  function linhaDe(c: CandidatoAlocacao) {
    return (
      <Pessoa
        key={c.usuario_id}
        candidato={c}
        bloqueado={semVaga}
        alocando={alocando === c.usuario_id}
        onAlocar={alocar}
      />
    );
  }

  /** O cabeçalho do grupo some com uma frente selecionada: repetiria o filtro. */
  function renderGrupos(grupos: [string, CandidatoAlocacao[]][]) {
    return grupos.map(([nomeGrupo, doGrupo]) =>
      doGrupo.length === 0 ? null : (
        <PainelGrupo key={nomeGrupo}>
          {frente === TODAS && (
            <PainelGrupoTitulo>
              {nomeGrupo} · {doGrupo.length}
            </PainelGrupoTitulo>
          )}
          <CandidatoLista>{doGrupo.map(linhaDe)}</CandidatoLista>
        </PainelGrupo>
      ),
    );
  }

  return (
    <>
      <PainelOverlay onClick={onFechar} />
      <PainelLateral role="dialog" aria-modal="true" aria-label={`Alocar em ${projeto.nome}`}>
        <PainelCabecalho>
          <PainelTitulo>
            <CardNome>{projeto.nome}</CardNome>
            <CardLinha>
              {projeto.alocados} de {projeto.max_consultores} consultores
              {semVaga ? " · time completo" : ` · ${projeto.vagas} em aberto`}
            </CardLinha>
          </PainelTitulo>
          <PainelFechar type="button" aria-label="Fechar painel" onClick={onFechar}>
            <X size={18} />
          </PainelFechar>
        </PainelCabecalho>

        {frentesDisponiveis.length > 1 && (
          <PainelFiltros>
            <FieldGroup>
              <FieldLabel htmlFor="painel-frente">Frente</FieldLabel>
              <FieldSelect
                id="painel-frente"
                value={frente}
                onChange={(e) => setFrente(e.target.value)}
              >
                <option value={TODAS}>Todas as frentes</option>
                {frentesDisponiveis.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </FieldSelect>
            </FieldGroup>
          </PainelFiltros>
        )}

        <PainelCorpo>
          {erro && <ErrorText>{erro}</ErrorText>}
          {semVaga && (
            <EmptyText>
              O time está completo. Aumente o limite de consultores do projeto antes de alocar mais
              alguém.
            </EmptyText>
          )}

          {candidatos === null ? (
            <EmptyText>Carregando…</EmptyText>
          ) : visiveis.length === 0 ? (
            <EmptyText>
              {(candidatos ?? []).length === 0
                ? "Não há ninguém disponível para este projeto."
                : "Ninguém desta frente está fora do projeto."}
            </EmptyText>
          ) : (
            <>
              {/* A seção existe mesmo vazia. Sumindo, o painel não distinguia
                  "ninguém se candidatou" de "esta tela não mostra pedidos" —
                  e quem aloca precisa saber que olhou e não havia fila, e não
                  ficar com a dúvida. */}
              <PainelSecao>
                <PainelSecaoTitulo>
                  Pediram para entrar{pediram.length > 0 && ` · ${pediram.length}`}
                </PainelSecaoTitulo>
                {pediram.length === 0 ? (
                  <EmptyText>Nenhum consultor se candidatou ainda.</EmptyText>
                ) : (
                  renderGrupos(gruposPediram)
                )}
              </PainelSecao>

              <PainelSecao>
                <PainelSecaoTitulo>Demais disponíveis</PainelSecaoTitulo>
                {renderGrupos(gruposDemais)}
              </PainelSecao>
            </>
          )}
        </PainelCorpo>
      </PainelLateral>
    </>
  );
}
