import { Fragment, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getBancasDoProjeto,
  realizarBanca,
  registrarDescricaoCoordenador,
  ROTULO_STATUS_BANCA,
  tomDoStatusBanca,
} from "@/lib/bancas";
import { CODIGO_BANCA_ABAIXO_DO_MINIMO, codigoDoErro } from "@/lib/api";
import { createAvaliacao, getFormularioAtivo, submeterAvaliacao } from "@/lib/avaliacoes";
import { formatarDataHora } from "@/lib/projetos";
import { VotoBanca } from "@/components/VotoBanca";
import type {
  AvaliacaoDaBanca,
  AvaliadorDaBanca,
  BancaDetalhes,
  ResultadoBanca,
  SessaoDeBanca,
} from "@/types/banca";
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
  ErrorBlock,
  ErrorText,
  EmptyText,
} from "@/styles/page.styled";
import {
  ModalBody,
  ModalClose,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalTitle,
} from "@/styles/modal.styled";
import {
  FieldGroup,
  FieldLabel,
  FieldTextarea,
  FormErrorText,
} from "@/pages/Bancas.styled";
import {
  AcoesLinha,
  Ajuda,
  CriterioNota,
  CriterioResposta,
  CriterioTexto,
  Criterios,
  AvisoReprovada,
  Campo,
  CampoRotulo,
  CampoValor,
  Colunas,
  Comentario,
  Lista,
  ListaNomes,
  MeuVoto,
  Placar,
  PlacarNumero,
  Presenca,
  SecaoTitulo,
  Tentativa,
  TentativaMeta,
  TentativaNome,
  TentativaTopo,
  Voto,
  VotoAutor,
  VotoBotao,
  VotoRotulo,
  VotoTopo,
} from "./ProjetoBanca.styled";
import { useProjeto } from "./ProjetoPage";

/** "Banca" na primeira, "2ª banca" da segunda em diante — numerar a primeira
 *  sugeriria que houve outra antes dela. */
function nomeDaTentativa(numero: number): string {
  return numero <= 1 ? "Banca" : `${numero}ª banca`;
}

function rotuloDoResultado(resultado: ResultadoBanca | null): string {
  if (resultado === "aprovada") return "Aprovada";
  if (resultado === "nao_aprovada") return "Não aprovada";
  return "Sem resultado";
}

function tomDaTentativa(s: SessaoDeBanca): "aprovada" | "reprovada" | "pendente" {
  if (s.resultado === "aprovada") return "aprovada";
  if (s.resultado === "nao_aprovada") return "reprovada";
  return "pendente";
}

/**
 * Por que a banca ainda não tem veredito — em texto, não em código.
 *
 * `motivo` vem da apuração (`utils/apuracao_banca.py`) e distingue casos que
 * exigem ações opostas: esperar o último voto não é o mesmo que ninguém ter
 * votado. Mostrar "sem resultado" nos dois deixaria quem lê sem saber se
 * precisa agir.
 */
function explicarPendencia(motivo: string, esperados: number, recebidos: number): string {
  if (motivo === "aguardando") {
    return `Aguardando o voto dos avaliadores — ${recebidos} de ${esperados} já votaram.`;
  }
  if (motivo === "sem_votos") {
    return "O prazo de avaliação passou e ninguém votou. A diretoria pode registrar o resultado manualmente na tela de Bancas.";
  }
  return "Ainda sem veredito.";
}

/**
 * ⭐ A aba **Banca** do projeto — ver e AGIR sobre a banca num lugar só.
 *
 * ⚠ **O que ela resolve.** As informações da banca existiam espalhadas: a data
 * no cronograma, o resultado escondido num cadeado da Visão geral, os votos em
 * lugar nenhum, e a ficha completa só na tela `/bancas`, que é organizada por
 * ALOCAÇÃO — quem procurava "como foi a banca deste projeto" tinha de caçar a
 * banca certa numa lista de todas as bancas do semestre. Pior: para votar, o
 * avaliador precisava sair do projeto e encontrá-la lá.
 *
 * ⭐ **Mostra as TENTATIVAS, não só a atual.** Uma banca reprovada e remarcada
 * some da linha de `banca` (a coluna passa a descrever a 2ª). É aqui que a 1ª
 * continua existindo, com o veredito e os votos que a reprovaram.
 */
export function ProjetoBanca() {
  const { projeto } = useProjeto();
  const { token } = useAuth();
  const [bancas, setBancas] = useState<BancaDetalhes[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!token) return;
    setErro("");
    try {
      setBancas(await getBancasDoProjeto(projeto.id, token));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar as bancas");
    } finally {
      setCarregando(false);
    }
  }, [token, projeto.id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (carregando) return <PageLoadingBlock />;

  if (erro && bancas.length === 0) {
    return (
      <ErrorBlock>
        <ErrorText>{erro}</ErrorText>
        <PageButton $variant="outline" onClick={carregar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (bancas.length === 0) {
    return (
      <PageCard>
        <PageCardContent>
          <EmptyText>
            Nenhuma banca marcada para os escopos deste projeto. A banca é marcada na aba{" "}
            <strong>Cronograma</strong>, clicando no dia.
          </EmptyText>
        </PageCardContent>
      </PageCard>
    );
  }

  return (
    <PageStack>
      {bancas.map((banca) => (
        <FichaDaBanca key={banca.id} banca={banca} projetoId={projeto.id} onMudou={carregar} />
      ))}
    </PageStack>
  );
}

function FichaDaBanca({
  banca,
  projetoId,
  onMudou,
}: {
  banca: BancaDetalhes;
  projetoId: number;
  onMudou: () => Promise<void>;
}) {
  const { usuario, token } = useAuth();
  const [realizando, setRealizando] = useState(false);
  const recebidos = banca.apuracao.aprovacoes + banca.apuracao.reprovacoes;

  // Quem marca a banca também registra que ela aconteceu — a MESMA permissão
  // que o backend cobra em `POST /bancas/{id}/realizar`
  // (`require_pode_definir_cronograma`) e que o Cronograma já lê para decidir
  // quem pode marcar.
  const podeRegistrar = !!usuario?.permissoes.pode_definir_cronograma;
  const eu = banca.avaliadores.find((a) => a.usuario_id === usuario?.id);

  const porSessao = new Map<number, AvaliacaoDaBanca[]>();
  for (const a of banca.avaliacoes) {
    const lista = porSessao.get(a.sessao) ?? [];
    lista.push(a);
    porSessao.set(a.sessao, lista);
  }

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>{banca.escopos.join(" + ") || banca.nome_projeto}</PageCardTitle>
        <PageBadge $tone={tomDoStatusBanca(banca.status)}>
          {ROTULO_STATUS_BANCA[banca.status]}
        </PageBadge>
        {/* O veredito ao lado do status: "realizada" e "aprovada" são coisas
            diferentes, e é a segunda que libera a entrega ao cliente (§5.5). */}
        <PageBadge
          $tone={
            banca.resultado === "aprovada"
              ? "success"
              : banca.resultado === "nao_aprovada"
                ? "danger"
                : "muted"
          }
        >
          {rotuloDoResultado(banca.resultado)}
        </PageBadge>
        {/* ⭐ A banca aconteceu — o passo que abre a votação. Sem ele, ninguém
            consegue avaliar: o backend recusa voto em banca não realizada. */}
        {podeRegistrar && !banca.realizado_em && banca.data_hora && (
          <PageButtonSm type="button" onClick={() => setRealizando(true)}>
            Registrar realização
          </PageButtonSm>
        )}
      </PageCardHeader>

      <PageCardContent>
        {/* ⚠ Primeiro de tudo quando reprovou: é a informação que muda o que a
            pessoa faz a seguir, e ela não pode estar no fim da página. */}
        {banca.resultado === "nao_aprovada" && (
          <AvisoReprovada>
            <AlertTriangle size={18} />
            <span>
              <strong>Esta banca não foi aprovada.</strong> A entrega ao cliente segue travada até
              que uma nova banca aconteça e aprove.{" "}
              <Link to={`/projetos/${projetoId}/cronograma`}>
                Marque a próxima banca no Cronograma
              </Link>{" "}
              — a tentativa reprovada fica registrada abaixo.
            </span>
          </AvisoReprovada>
        )}

        <Colunas>
          <Campo>
            <CampoRotulo>Data</CampoRotulo>
            <CampoValor>{formatarDataHora(banca.data_hora)}</CampoValor>
          </Campo>
          <Campo>
            <CampoRotulo>Realizada em</CampoRotulo>
            <CampoValor>
              {banca.realizado_em ? formatarDataHora(banca.realizado_em) : "ainda não aconteceu"}
            </CampoValor>
          </Campo>
          <Campo>
            <CampoRotulo>Frentes</CampoRotulo>
            <CampoValor>{banca.frentes.join(", ") || "—"}</CampoValor>
          </Campo>
          <Campo>
            <CampoRotulo>Nota final</CampoRotulo>
            {/* ⚠ Nota e voto medem coisas diferentes: a nota diz QUÃO BEM o
                trabalho foi feito, o voto diz se ele pode ir ao cliente. */}
            <CampoValor>
              {banca.nota_final !== null ? banca.nota_final.toFixed(1) : "sem notas"}
            </CampoValor>
          </Campo>
        </Colunas>

        {/* ⭐ O voto de quem está lendo, sem sair do projeto. */}
        {eu && (
          <MeuVotoBloco
            banca={banca}
            eu={eu}
            token={token}
            onEnviou={onMudou}
          />
        )}

        <SecaoTitulo>Quem participou</SecaoTitulo>
        <Colunas>
          <Campo>
            <CampoRotulo>Coordenação</CampoRotulo>
            <CampoValor>{banca.coordenador}</CampoValor>
          </Campo>
          <Campo>
            <CampoRotulo>Equipe do projeto</CampoRotulo>
            {banca.membros.length ? (
              <ListaNomes>
                {banca.membros.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ListaNomes>
            ) : (
              <CampoValor>—</CampoValor>
            )}
          </Campo>
          <Campo>
            <CampoRotulo>Avaliadores escalados</CampoRotulo>
            {banca.avaliadores.length ? (
              <ListaNomes>
                {banca.avaliadores.map((a) => (
                  <li key={a.usuario_id}>
                    {a.nome}
                    {/* Escalado e compareceu são coisas diferentes: só quem
                        esteve lá entra na conta dos votos. */}
                    {banca.realizado_em && !a.presente && " · faltou"}
                    {a.ja_votou && " · votou"}
                  </li>
                ))}
              </ListaNomes>
            ) : (
              <CampoValor>ninguém escalado</CampoValor>
            )}
          </Campo>
        </Colunas>

        <SecaoTitulo>Apuração</SecaoTitulo>
        <Placar>
          <span>
            <PlacarNumero $tom="aprova">{banca.apuracao.aprovacoes}</PlacarNumero> a favor ·{" "}
            <PlacarNumero $tom="reprova">{banca.apuracao.reprovacoes}</PlacarNumero> contra
          </span>
          <span>
            <PlacarNumero $tom="neutro">
              {recebidos}/{banca.apuracao.esperados}
            </PlacarNumero>{" "}
            votos recebidos
          </span>
        </Placar>
        {!banca.resultado && (
          <Ajuda>
            {explicarPendencia(banca.apuracao.motivo, banca.apuracao.esperados, recebidos)}
          </Ajuda>
        )}

        {banca.sessoes.length > 1 && (
          <>
            <SecaoTitulo>Tentativas</SecaoTitulo>
            <Ajuda>
              A banca reprovada não some do registro: cada tentativa fica aqui com o veredito que
              recebeu.
            </Ajuda>
            <Lista>
              {banca.sessoes.map((s) => (
                <Tentativa key={s.id} $tom={tomDaTentativa(s)}>
                  <TentativaTopo>
                    <TentativaNome>{nomeDaTentativa(s.numero)}</TentativaNome>
                    <TentativaMeta>{formatarDataHora(s.data_hora)}</TentativaMeta>
                    <TentativaMeta>· {rotuloDoResultado(s.resultado)}</TentativaMeta>
                  </TentativaTopo>
                  <TentativaMeta>
                    {s.realizado_em
                      ? `Realizada em ${formatarDataHora(s.realizado_em)}`
                      : "Ainda não aconteceu"}
                  </TentativaMeta>
                </Tentativa>
              ))}
            </Lista>
          </>
        )}

        <SecaoTitulo>Avaliações</SecaoTitulo>
        {banca.avaliacoes.length === 0 ? (
          <EmptyText>Nenhuma avaliação enviada ainda.</EmptyText>
        ) : (
          [...porSessao.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([numero, avaliacoes]) => (
              <div key={numero}>
                {porSessao.size > 1 && <SecaoTitulo>{nomeDaTentativa(numero)}</SecaoTitulo>}
                <Lista>
                  {avaliacoes.map((a) => (
                    <AvaliacaoLinha key={a.id} avaliacao={a} />
                  ))}
                </Lista>
              </div>
            ))
        )}

        <SecaoTitulo>Relato da coordenação</SecaoTitulo>
        <RelatoDaCoordenacao banca={banca} token={token} onSalvou={onMudou} />
      </PageCardContent>

      {realizando && token && (
        <RegistrarRealizacaoModal
          banca={banca}
          token={token}
          onFechar={() => setRealizando(false)}
          onRegistrou={async () => {
            setRealizando(false);
            await onMudou();
          }}
        />
      )}
    </PageCard>
  );
}

/**
 * ⭐ O voto do usuário logado, dado de dentro do projeto.
 *
 * ⚠ **Voto e comentário, sem as notas por critério.** O formulário completo
 * (Bloco 1, notas de 1 a 5 por critério, escopo avaliado) continua em
 * `/bancas` — ele é longo e existe para alimentar a NOTA da banca. O que decide
 * o resultado, e o que faltava perto de onde a banca é vista, é o VOTO. Quem
 * quiser dar notas usa o link para a tela de Bancas.
 *
 * O backend aceita os dois caminhos: a avaliação é criada, as notas são
 * opcionais e o voto entra pela rota de submissão, que é quem dispara a
 * apuração.
 */
function MeuVotoBloco({
  banca,
  eu,
  token,
  onEnviou,
}: {
  banca: BancaDetalhes;
  eu: AvaliadorDaBanca;
  token: string | null;
  onEnviou: () => Promise<void>;
}) {
  const [voto, setVoto] = useState<boolean | null>(null);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  if (eu.ja_votou) {
    return (
      <MeuVoto>
        <SecaoTitulo>Seu voto</SecaoTitulo>
        <Voto $aprova={eu.voto_aprovacao}>
          <VotoTopo>
            <VotoAutor>Você</VotoAutor>
            <VotoRotulo $aprova={eu.voto_aprovacao}>
              {eu.voto_aprovacao ? "aprovou" : "não aprovou"}
            </VotoRotulo>
          </VotoTopo>
          {eu.comentario_feedback && <Comentario>{eu.comentario_feedback}</Comentario>}
        </Voto>
        <Ajuda>Voto enviado — ele não pode mais ser alterado.</Ajuda>
      </MeuVoto>
    );
  }

  if (!banca.realizado_em) {
    return (
      <MeuVoto>
        <SecaoTitulo>Seu voto</SecaoTitulo>
        <Ajuda>
          Você está escalado para esta banca. A votação abre quando alguém registrar que ela
          aconteceu.
        </Ajuda>
      </MeuVoto>
    );
  }

  async function enviar() {
    if (!token) return;
    if (voto === null) {
      setErro("Diga se você aprova ou não este escopo — é o seu voto que decide a banca.");
      return;
    }
    setEnviando(true);
    setErro("");
    try {
      // Reaproveita o rascunho que a pessoa já tenha aberto na tela de Bancas:
      // criar um segundo deixaria duas linhas do mesmo avaliador na sessão.
      let avaliacaoId = eu.avaliacao_id;
      if (!avaliacaoId) {
        const formulario = await getFormularioAtivo(token);
        const criada = await createAvaliacao(
          { banca_id: banca.id, formulario_id: formulario.id },
          token,
        );
        avaliacaoId = criada.id;
      }
      await submeterAvaliacao(avaliacaoId, voto, comentario.trim() || null, token);
      await onEnviou();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar o voto");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <MeuVoto>
      <SecaoTitulo>Seu voto</SecaoTitulo>
      <VotoBanca value={voto} onChange={setVoto} disabled={enviando} />
      <FieldGroup>
        <FieldLabel htmlFor={`comentario-${banca.id}`}>Comentário (opcional)</FieldLabel>
        <FieldTextarea
          id={`comentario-${banca.id}`}
          rows={3}
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="O que o grupo precisa saber sobre esta avaliação"
        />
      </FieldGroup>
      {erro && <FormErrorText>{erro}</FormErrorText>}
      <AcoesLinha>
        <PageButton type="button" disabled={enviando} onClick={enviar}>
          {enviando ? "Enviando..." : "Enviar voto"}
        </PageButton>
        <Ajuda>
          Para dar as notas por critério, use o formulário completo na tela de{" "}
          <Link to="/bancas">Bancas</Link>.
        </Ajuda>
      </AcoesLinha>
    </MeuVoto>
  );
}

/**
 * ⭐ "A banca aconteceu" — o passo que abre a votação.
 *
 * ⚠ A lista de presença não é formalidade: `candidatura.confirmado` é o
 * ELEITORADO da apuração (§8). Quem foi escalado e faltou não deve voto, e
 * contá-lo como abstenção puniria o projeto pela ausência de outra pessoa.
 */
function RegistrarRealizacaoModal({
  banca,
  token,
  onFechar,
  onRegistrou,
}: {
  banca: BancaDetalhes;
  token: string;
  onFechar: () => void;
  onRegistrou: () => Promise<void>;
}) {
  // Todos marcados por padrão: o caso comum é a banca acontecer com quem foi
  // escalado, e a exceção é a falta.
  const [presentes, setPresentes] = useState<number[]>(
    banca.avaliadores.map((a) => a.usuario_id),
  );
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [recusaDeComposicao, setRecusaDeComposicao] = useState(false);

  async function confirmar(forcar = false) {
    setSalvando(true);
    setErro("");
    try {
      await realizarBanca(banca.id, { presentes, forcar }, token);
      await onRegistrou();
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : "Não foi possível registrar";
      setErro(mensagem);
      // ⭐ Pelo CÓDIGO da recusa, não por palavras na mensagem.
      //
      // Este `includes` procurava "mínimo" ou "composição", e o texto atual do
      // backend ("Esta banca tem 0 de 2 pessoas alocadas...") não tem nenhuma
      // das duas — o botão de forçar da diretoria nunca aparecia. Quem decide
      // continua sendo a rota; o que mudou é como a tela pergunta.
      setRecusaDeComposicao(codigoDoErro(err) === CODIGO_BANCA_ABAIXO_DO_MINIMO);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalOverlay onClick={onFechar} role="presentation">
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Registrar que a banca aconteceu</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onFechar}>
            ×
          </ModalClose>
        </ModalHeader>
        <ModalBody>
          <Ajuda>
            Marque quem esteve presente. Só quem compareceu vota — é esta lista que forma o
            eleitorado da apuração.
          </Ajuda>
          {banca.avaliadores.length === 0 ? (
            <EmptyText>Nenhum avaliador escalado nesta banca.</EmptyText>
          ) : (
            banca.avaliadores.map((a) => (
              <Presenca key={a.usuario_id}>
                <input
                  type="checkbox"
                  checked={presentes.includes(a.usuario_id)}
                  onChange={(e) =>
                    setPresentes((atuais) =>
                      e.target.checked
                        ? [...atuais, a.usuario_id]
                        : atuais.filter((id) => id !== a.usuario_id),
                    )
                  }
                />
                {a.nome}
              </Presenca>
            ))
          )}
          {erro && <FormErrorText>{erro}</FormErrorText>}
          <AcoesLinha>
            <PageButton type="button" disabled={salvando} onClick={() => confirmar(false)}>
              {salvando ? "Registrando..." : "Confirmar"}
            </PageButton>
            {recusaDeComposicao && (
              <PageButton
                type="button"
                $variant="outline"
                disabled={salvando}
                onClick={() => confirmar(true)}
              >
                Registrar assim mesmo
              </PageButton>
            )}
            <PageButton type="button" $variant="ghost" onClick={onFechar}>
              Cancelar
            </PageButton>
          </AcoesLinha>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
}

/**
 * ⭐ Uma avaliação na lista — o nome ABRE o que a pessoa respondeu.
 *
 * ⚠ O voto sem a avaliação que o justifica é um oráculo: "Gabi não aprovou" não
 * diz ao grupo o que arrumar. As notas por critério e o comentário existiam no
 * banco desde sempre e não apareciam em tela nenhuma fora do formulário de quem
 * escreveu.
 *
 * Fechado por padrão, e não expandido: numa banca de cinco avaliadores com dez
 * critérios cada, tudo aberto vira uma parede de números que esconde o que
 * importa primeiro — quem votou o quê.
 */
function AvaliacaoLinha({ avaliacao }: { avaliacao: AvaliacaoDaBanca }) {
  const [aberta, setAberta] = useState(false);
  const temDetalhe = !!avaliacao.comentario_feedback || avaliacao.notas.length > 0;

  const conteudo = (
    <VotoTopo>
      <VotoAutor>{avaliacao.avaliador}</VotoAutor>
      <VotoRotulo $aprova={avaliacao.voto_aprovacao}>
        {avaliacao.voto_aprovacao === true
          ? "aprovou"
          : avaliacao.voto_aprovacao === false
            ? "não aprovou"
            : "sem voto registrado"}
      </VotoRotulo>
      {avaliacao.submetida_em && (
        <TentativaMeta>{formatarDataHora(avaliacao.submetida_em)}</TentativaMeta>
      )}
      {temDetalhe && (
        <TentativaMeta>{aberta ? "▲ ocultar" : "▼ ver avaliação"}</TentativaMeta>
      )}
    </VotoTopo>
  );

  return (
    <Voto $aprova={avaliacao.voto_aprovacao}>
      {/* Sem detalhe não vira botão: um clique que não faz nada é pior que
          nenhum clique. */}
      {temDetalhe ? (
        <VotoBotao
          type="button"
          aria-expanded={aberta}
          onClick={() => setAberta((v) => !v)}
        >
          {conteudo}
        </VotoBotao>
      ) : (
        conteudo
      )}

      {aberta && (
        <>
          {avaliacao.comentario_feedback && (
            <Comentario>{avaliacao.comentario_feedback}</Comentario>
          )}
          {avaliacao.notas.length > 0 && (
            <Criterios>
              {avaliacao.notas.map((n, i) => (
                <Fragment key={`${n.pergunta}-${i}`}>
                  <CriterioTexto>{n.pergunta}</CriterioTexto>
                  {n.nota !== null ? (
                    <CriterioNota>{n.nota.toFixed(1)}</CriterioNota>
                  ) : (
                    <CriterioNota>—</CriterioNota>
                  )}
                  {n.resposta_texto && <CriterioResposta>{n.resposta_texto}</CriterioResposta>}
                </Fragment>
              ))}
            </Criterios>
          )}
        </>
      )}
    </Voto>
  );
}

/**
 * ⭐ O relato da coordenação, escrito aqui mesmo.
 *
 * O coordenador NÃO avalia a própria banca (§8: "ninguém avalia o próprio
 * grupo") — este texto livre é o lugar dele, e é a única coisa que ele registra
 * sobre a banca. Estava só na tela `/bancas`, longe do projeto de que fala.
 *
 * ⚠ Quem escreve é o coordenador da BANCA, e o backend cobra isso
 * (`RegistrarDescricaoCoordenadorUseCase`). A tela esconde o formulário de
 * quem não é — mostrar um campo que devolve 403 no salvar é pior que não
 * mostrar.
 */
function RelatoDaCoordenacao({
  banca,
  token,
  onSalvou,
}: {
  banca: BancaDetalhes;
  token: string | null;
  onSalvou: () => Promise<void>;
}) {
  const { usuario } = useAuth();
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(banca.descricao_coordenador ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const souCoordenador = !!usuario && usuario.id === banca.coordenador_id;
  // Só depois que a banca aconteceu: relatar o que ainda não ocorreu não faz
  // sentido, e o backend recusa.
  const podeEscrever = souCoordenador && !!banca.realizado_em;

  async function salvar() {
    if (!token) return;
    setSalvando(true);
    setErro("");
    try {
      await registrarDescricaoCoordenador(banca.id, texto.trim(), token);
      setEditando(false);
      await onSalvou();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar o relato");
    } finally {
      setSalvando(false);
    }
  }

  if (editando) {
    return (
      <>
        <FieldGroup>
          <FieldLabel htmlFor={`relato-${banca.id}`}>
            Como foi a banca, na visão da coordenação
          </FieldLabel>
          <FieldTextarea
            id={`relato-${banca.id}`}
            rows={4}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="O que os avaliadores apontaram, o que o grupo precisa ajustar…"
          />
        </FieldGroup>
        {erro && <FormErrorText>{erro}</FormErrorText>}
        <AcoesLinha>
          <PageButton type="button" disabled={salvando} onClick={salvar}>
            {salvando ? "Salvando..." : "Salvar relato"}
          </PageButton>
          <PageButton
            type="button"
            $variant="ghost"
            onClick={() => {
              setTexto(banca.descricao_coordenador ?? "");
              setEditando(false);
              setErro("");
            }}
          >
            Cancelar
          </PageButton>
        </AcoesLinha>
      </>
    );
  }

  return (
    <>
      {banca.descricao_coordenador ? (
        <Comentario>{banca.descricao_coordenador}</Comentario>
      ) : (
        <EmptyText>
          {podeEscrever
            ? "Nada escrito ainda."
            : "Nada escrito. O relato é registrado pela coordenação depois que a banca acontece."}
        </EmptyText>
      )}
      {podeEscrever && (
        <AcoesLinha>
          <PageButtonSm $variant="outline" type="button" onClick={() => setEditando(true)}>
            {banca.descricao_coordenador ? "Editar relato" : "Escrever relato"}
          </PageButtonSm>
        </AcoesLinha>
      )}
    </>
  );
}
