import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getFormulario } from "@/lib/desempenho-formularios";
import { finalizarDesempenho, getMinhaFila, submitAvaliacao } from "@/lib/desempenho-avaliacoes";
import { getProjetos } from "@/lib/projetos";
import { NotaButtons, NotaButtonsGroup } from "@/components/desempenho/NotaButtons";
import type { DesempenhoFilaItem, DesempenhoFormulario, DesempenhoNotaInput, DesempenhoTipo } from "@/types/desempenho";
import type { ProjetoResumo } from "@/types/projeto";
import { MotivoDesabilitado } from "@/components/MotivoDesabilitado";
import {
  ErrorBlock,
  ErrorText,
  PageBadge,
  PageButton,
  PageCard,
  PageCardContent,
  PageCardHeader,
  PageCardTitle,
  PageLoadingBlock,
} from "@/styles/page.styled";
import {
  AvisoFechadoCard,
  AvisoFechadoItem,
  AvisoFechadoLinha,
  AvisoFechadoLista,
  AvisoFechadoTitulo,
  CampoContador,
  ComentariosAviso,
  DoneBlock,
  EscalaLegenda,
  EscalaLegendaNumero,
  EscalaLegendaTexto,
  FieldGroup,
  FieldLabel,
  FieldTextarea,
  FilaItem,
  FilaItemInfo,
  FilaItemMeta,
  FilaItemNome,
  FilaList,
  FormErrorText,
  FormStack,
  InfoBannerCard,
  InfoBannerLinha,
  InfoBannerTitulo,
  InstrucoesBox,
  InstrucoesTitulo,
  IntroTexto,
  NotaGeralDestaque,
  ProgressoBarFill,
  ProgressoBarTrack,
  ProgressoRow,
  ProgressoTexto,
  SecaoDescricao,
  SecaoFormulario,
  SecaoTitulo,
  TipoCard,
  TipoCardDescricao,
  TipoCardHeader,
  TipoCardTitulo,
  TipoOpcoesGrid,
  VoltarLink,
} from "./AvaliacaoDesempenho.styled";

const TIPOS: { valor: DesempenhoTipo; titulo: string; descricao: string }[] = [
  { valor: "periodico", titulo: "Avaliação periódica", descricao: "Check-in ao longo do projeto." },
  { valor: "finalizacao", titulo: "Avaliação de finalização", descricao: "Balanço final, feito quando o projeto ou um escopo dele termina." },
];

const ROTULO_PAPEL: Record<"coordenador" | "consultor", string> = {
  coordenador: "Coordenador(a)",
  consultor: "Consultor(a)",
};

const INTRO_FORMULARIO =
  "Avalie cada pilar considerando o comportamento observado ao longo do projeto. Procure utilizar toda a " +
  "escala de avaliação e diferenciar os aspectos avaliados em cada dimensão.\n\n" +
  "Cada critério deve ser avaliado utilizando a escala de 1 a 5, considerando o desempenho observado ao " +
  "longo do período avaliado.";

function escalaParaPapel(papel: "coordenador" | "consultor") {
  const singular = papel === "coordenador" ? "coordenador" : "consultor";
  const plural = papel === "coordenador" ? "coordenadores" : "consultores";
  return [
    {
      nota: 1,
      titulo: "Muito abaixo do esperado",
      texto: `apresenta dificuldades claras no critério avaliado e não cumpre adequadamente o que se espera para a função de ${singular}.`,
    },
    { nota: 2, titulo: "Abaixo do esperado", texto: "cumpre o critério apenas parcialmente ou de forma inconsistente." },
    {
      nota: 3,
      titulo: "Dentro do esperado",
      texto: `atende de forma adequada ao que se espera para a função de ${singular}.`,
    },
    { nota: 4, titulo: "Acima do esperado", texto: "demonstra desempenho acima do esperado em diversos momentos." },
    {
      nota: 5,
      titulo: "Excelente",
      texto: `desempenho excepcional, servindo como referência para outros ${plural}.`,
    },
  ];
}

type Passo = "carregando" | "escolha" | "fila" | "avaliando" | "concluido";

interface Rascunho {
  notas: Record<number, DesempenhoNotaInput>;
  notaGeral: number;
  comentarios: string;
}

function chave(item: Pick<DesempenhoFilaItem, "lote_id" | "avaliado_id">) {
  return `${item.lote_id}-${item.avaliado_id}`;
}

function chaveRascunhos(usuarioId: number) {
  return `desempenho-rascunhos-${usuarioId}`;
}

export function AvaliacaoDesempenho() {
  const { usuario, token } = useAuth();
  const [passo, setPasso] = useState<Passo>("carregando");
  const [erro, setErro] = useState("");
  const [fila, setFila] = useState<DesempenhoFilaItem[]>([]);
  const [projetos, setProjetos] = useState<ProjetoResumo[]>([]);
  const [tipoEscolhido, setTipoEscolhido] = useState<DesempenhoTipo | null>(null);
  // Snapshot tirado ao entrar na fila de um tipo: quem já saiu dela nesta
  // sessão aparece riscado como "Concluída" em vez de simplesmente sumir.
  const [filaOriginalDoTipo, setFilaOriginalDoTipo] = useState<DesempenhoFilaItem[]>([]);
  const [loteIdsPorTipo, setLoteIdsPorTipo] = useState<Record<DesempenhoTipo, Set<number>>>({
    periodico: new Set(),
    finalizacao: new Set(),
  });

  const [pessoaAtual, setPessoaAtual] = useState<DesempenhoFilaItem | null>(null);
  const [formulario, setFormulario] = useState<DesempenhoFormulario | null>(null);
  const [notas, setNotas] = useState<Record<number, DesempenhoNotaInput>>({});
  const [notaGeral, setNotaGeral] = useState<number | null>(null);
  const [comentarios, setComentarios] = useState("");
  const [erroForm, setErroForm] = useState("");

  // Respostas ficam salvas aqui até o envio final, dá pra reabrir e editar
  // qualquer uma antes de enviar. Só vai pro backend quando o tipo inteiro
  // (periódica ou finalização) estiver com todo mundo respondido. Espelhado
  // no localStorage (ver os dois efeitos abaixo): sem isso, sair da tela no
  // meio de uma fila de 4 apagava quem já tinha sido preenchido, mesmo a
  // pessoa lendo aquilo como "já enviei essa".
  const [rascunhos, setRascunhos] = useState<Record<string, Rascunho>>({});
  const [rascunhosCarregados, setRascunhosCarregados] = useState(false);
  const [enviandoTudo, setEnviandoTudo] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");

  // Restaura rascunhos salvos de uma sessão anterior antes de qualquer outro
  // efeito começar a espelhar `rascunhos` de volta pro localStorage, senão a
  // primeira gravação (com o estado inicial vazio) apagaria o que já existia.
  useEffect(() => {
    if (!usuario) return;
    try {
      const salvo = localStorage.getItem(chaveRascunhos(usuario.id));
      if (salvo) setRascunhos(JSON.parse(salvo));
    } catch {
      // Rascunho corrompido ou localStorage indisponível: segue do zero.
    } finally {
      setRascunhosCarregados(true);
    }
  }, [usuario?.id]);

  // Espelha pro localStorage a cada mudança, é o que sobrevive a sair da
  // tela (ou fechar a aba) no meio de uma fila de várias avaliações.
  useEffect(() => {
    if (!usuario || !rascunhosCarregados) return;
    try {
      if (Object.keys(rascunhos).length === 0) {
        localStorage.removeItem(chaveRascunhos(usuario.id));
      } else {
        localStorage.setItem(chaveRascunhos(usuario.id), JSON.stringify(rascunhos));
      }
    } catch {
      // Modo privado ou quota cheia: perde a persistência, não a tela.
    }
  }, [rascunhos, usuario, rascunhosCarregados]);

  const nomesProjeto = useMemo(() => new Map(projetos.map((p) => [p.id, p.nome])), [projetos]);

  // O backend só mantém um lote fechado na fila por uma janela (regra
  // 2.3-bis), o suficiente pra pessoa descobrir que perdeu o prazo, sem
  // acumular pendência de rodada antiga pra sempre. Aparece já na tela
  // inicial, antes de qualquer escolha de tipo.
  const itensFechados = useMemo(() => fila.filter((item) => !item.aberto), [fila]);

  // `getProjetos` já aplica o recorte de visão: pra coordenador e
  // consultor devolve só os projetos onde eles estão hoje, daí dá pra
  // derivar o papel de cada um sem endpoint novo (coordenador_ids/
  // consultor_ids já vêm no resumo).
  //
  // ⚠ `coordenador_ids.includes`, não `coordenador_id ===`: projeto pode
  // ter mais de um coordenador (2026-08-20), e comparar só com o primeiro
  // classificaria o segundo coordenador como consultor.
  const minhasParticipacoes = useMemo(() => {
    if (!usuario) return [];
    return projetos.map((p) => ({
      projeto: p.nome,
      papel: (p.coordenador_ids.includes(usuario.id) ? "coordenador" : "consultor") as "coordenador" | "consultor",
    }));
  }, [projetos, usuario]);

  const textoParticipacoes = useMemo(() => {
    const partes = minhasParticipacoes.map((p) => `${p.projeto} (${ROTULO_PAPEL[p.papel]})`);
    if (partes.length <= 1) return partes.join("");
    return `${partes.slice(0, -1).join(", ")} e ${partes[partes.length - 1]}`;
  }, [minhasParticipacoes]);

  async function carregarFila() {
    if (!usuario || !token) return;
    const nova = await getMinhaFila(usuario.id, token);
    setFila(nova);
    return nova;
  }

  useEffect(() => {
    if (!usuario || !token) return;
    setPasso("carregando");
    setErro("");
    Promise.all([getMinhaFila(usuario.id, token), getProjetos(token)])
      .then(([nova, listaProjetos]) => {
        setFila(nova);
        setProjetos(listaProjetos);
        setLoteIdsPorTipo((atual) => {
          const proximo = { periodico: new Set(atual.periodico), finalizacao: new Set(atual.finalizacao) };
          for (const item of nova) proximo[item.lote_tipo].add(item.lote_id);
          return proximo;
        });
        setPasso("escolha");
      })
      .catch((err) => setErro(err instanceof Error ? err.message : "Erro ao carregar sua fila de avaliações"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id, token]);

  // Só conta como "pendente" quem ainda tem lote aberto, os fechados vão
  // pro aviso à parte (`itensFechados`), nunca travam um tipo como
  // "concluído" nem entram na conta do que falta responder.
  const filaDoTipo = (tipo: DesempenhoTipo) =>
    fila.filter((item) => item.lote_tipo === tipo && item.aberto);

  function projetosDaPessoa(item: DesempenhoFilaItem): string {
    return item.projeto_ids.map((id) => nomesProjeto.get(id)).filter(Boolean).join(", ") || "—";
  }

  async function abrirFilaDoTipo(tipo: DesempenhoTipo) {
    setTipoEscolhido(tipo);
    setErroForm("");
    setPasso("fila");
    // Recarrega na hora de entrar, se algum lote fechou enquanto a pessoa
    // estava parada na tela de escolha, ela já vê o aviso "Fechado" na
    // lista, em vez de só descobrir isso ao tentar enviar.
    const novaFila = (await carregarFila()) ?? fila;
    setFilaOriginalDoTipo(novaFila.filter((item) => item.lote_tipo === tipo));
  }

  async function abrirPessoa(item: DesempenhoFilaItem) {
    if (!token) return;
    setErroForm("");
    if (!item.aberto) {
      setErroForm(`O formulário "${item.lote_nome}" está fechado, não dá mais pra responder por ele.`);
      return;
    }
    try {
      const form = await getFormulario(item.lote_tipo, item.form_type, token);
      const rascunho = rascunhos[chave(item)];
      setPessoaAtual(item);
      setFormulario(form);
      setNotas(rascunho?.notas ?? {});
      setNotaGeral(rascunho?.notaGeral ?? null);
      setComentarios(rascunho?.comentarios ?? "");
      setPasso("avaliando");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar o formulário");
    }
  }

  async function finalizarLotesDoTipo(tipo: DesempenhoTipo) {
    if (!usuario || !token) return;
    const ids = Array.from(loteIdsPorTipo[tipo]);
    await Promise.all(ids.map((loteId) => finalizarDesempenho(usuario.id, loteId, token)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pessoaAtual || !formulario) return;

    const criterios = formulario.secoes.flatMap((s) => s.criterios);
    const faltando = criterios.filter((c) => {
      const resposta = notas[c.id];
      if (c.tipo_resposta === "nota") return !resposta || resposta.nota == null;
      return !resposta || !resposta.resposta_texto?.trim();
    });
    if (faltando.length > 0) {
      setErroForm("Responda todos os critérios antes de continuar.");
      return;
    }
    if (notaGeral == null) {
      setErroForm("Escolha uma nota geral.");
      return;
    }

    // Não envia pro backend ainda, só guarda como rascunho. O envio de
    // verdade só acontece quando todo mundo do tipo estiver respondido
    // (ver handleEnviarTodas), e dá pra reabrir e editar até lá.
    setErroForm("");
    setRascunhos((atual) => ({
      ...atual,
      [chave(pessoaAtual)]: { notas: { ...notas }, notaGeral, comentarios },
    }));
    setPessoaAtual(null);
    setFormulario(null);
    setPasso("fila");
  }

  async function handleEnviarTodas() {
    if (!token || !usuario || !tipoEscolhido) return;
    setEnviandoTudo(true);
    setErroEnvio("");
    try {
      // Confere de novo bem na hora de enviar, pode ter fechado entre abrir
      // a fila e clicar aqui. Melhor avisar antes do que deixar cada envio
      // estourar um erro do backend no meio do loop.
      const filaFresca = (await carregarFila()) ?? [];
      const porChave = new Map(filaFresca.map((item) => [chave(item), item]));
      const fecharamAgora = filaOriginalDoTipo.filter((item) => {
        if (!item.aberto) return false;
        const atualizado = porChave.get(chave(item));
        return !atualizado || !atualizado.aberto;
      });
      if (fecharamAgora.length > 0) {
        setFilaOriginalDoTipo((atual) => atual.map((item) => porChave.get(chave(item)) ?? item));
        setErroEnvio(
          `${fecharamAgora.length === 1 ? "Um formulário fechou" : `${fecharamAgora.length} formulários fecharam`} agora, revise a lista antes de tentar de novo.`,
        );
        setEnviandoTudo(false);
        return;
      }

      for (const item of filaOriginalDoTipo) {
        const rascunho = rascunhos[chave(item)];
        if (!rascunho) continue;
        await submitAvaliacao(
          {
            lote_id: item.lote_id,
            avaliado_id: item.avaliado_id,
            nota_geral: rascunho.notaGeral,
            comentarios: rascunho.comentarios,
            notas: Object.values(rascunho.notas),
          },
          token,
        );
        // Remove assim que confirma o envio: se um item seguinte falhar,
        // os já enviados não ficam pendurados pra reenvio duplicado.
        setRascunhos((atual) => {
          const proximo = { ...atual };
          delete proximo[chave(item)];
          return proximo;
        });
      }

      const novaFila = (await carregarFila()) ?? [];
      const loteIdsDaRodada = new Set(filaOriginalDoTipo.map((item) => item.lote_id));
      const lotesAindaPendentes = new Set(
        novaFila.filter((item) => loteIdsDaRodada.has(item.lote_id)).map((item) => item.lote_id),
      );
      const lotesParaFinalizar = Array.from(loteIdsDaRodada).filter((id) => !lotesAindaPendentes.has(id));
      await Promise.all(lotesParaFinalizar.map((loteId) => finalizarDesempenho(usuario.id, loteId, token)));

      const restamNoTipo = novaFila.filter((item) => item.lote_tipo === tipoEscolhido);
      if (restamNoTipo.length > 0) {
        setFilaOriginalDoTipo(restamNoTipo);
        setPasso("fila");
        return;
      }

      const outroTipo: DesempenhoTipo = tipoEscolhido === "periodico" ? "finalizacao" : "periodico";
      const restamNoOutroTipo = novaFila.filter((item) => item.lote_tipo === outroTipo);
      setTipoEscolhido(null);
      setPasso(restamNoOutroTipo.length > 0 ? "escolha" : "concluido");
    } catch (err) {
      setErroEnvio(err instanceof Error ? err.message : "Erro ao enviar avaliações");
    } finally {
      setEnviandoTudo(false);
    }
  }

  async function handleFinalizarAgora() {
    const tiposPendentes = TIPOS.filter((t) => filaDoTipo(t.valor).length > 0);
    await Promise.all(tiposPendentes.map((t) => finalizarLotesDoTipo(t.valor)));
    setPasso("concluido");
  }

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>{erro}</ErrorText>
        <PageButton $variant="outline" onClick={() => window.location.reload()}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (passo === "carregando") return <PageLoadingBlock />;

  // Quem já fechou sai da conta do progresso, nunca vai dar pra responder,
  // então não pode travar o "Enviar avaliações" das pessoas que ainda dá.
  const itensAindaAbertos = filaOriginalDoTipo.filter((item) => item.aberto);
  const totalNaRodada = itensAindaAbertos.length;
  const concluidosNaRodada = itensAindaAbertos.filter((item) => !!rascunhos[chave(item)]).length;
  const progressoPercent = totalNaRodada > 0 ? (concluidosNaRodada / totalNaRodada) * 100 : 0;
  const prontoParaEnviar = totalNaRodada > 0 && concluidosNaRodada === totalNaRodada;
  const algumFechado = filaOriginalDoTipo.some((item) => !item.aberto);

  // "Não quero responder o outro agora" só faz sentido quando sobra
  // exatamente UM tipo com pendência, se os dois já estão vazios (tudo
  // concluído) não existe "outro" pra declinar.
  const algumTipoConcluido = TIPOS.some((t) => filaDoTipo(t.valor).length === 0);
  const algumTipoPendente = TIPOS.some((t) => filaDoTipo(t.valor).length > 0);
  const mostrarBotaoFinalizarAgora = algumTipoConcluido && algumTipoPendente;

  return (
    <>
      {usuario && (
        <InfoBannerCard>
          <InfoBannerTitulo>Olá, {usuario.nome.split(" ")[0]}!</InfoBannerTitulo>
          {minhasParticipacoes.length > 0 && (
            <InfoBannerLinha>Você faz parte de {textoParticipacoes}.</InfoBannerLinha>
          )}
          <InfoBannerLinha>
            {fila.filter((item) => item.aberto).length > 0
              ? `Você tem ${fila.filter((item) => item.aberto).length} ${
                  fila.filter((item) => item.aberto).length === 1
                    ? "avaliação pendente"
                    : "avaliações pendentes"
                }.`
              : "Você não tem avaliações pendentes no momento."}
          </InfoBannerLinha>
        </InfoBannerCard>
      )}

      {itensFechados.length > 0 && (
        <AvisoFechadoCard>
          <AvisoFechadoTitulo>
            {itensFechados.length === 1
              ? "Um formulário fechou antes de você responder"
              : `${itensFechados.length} formulários fecharam antes de você responder`}
          </AvisoFechadoTitulo>
          <AvisoFechadoLista>
            {itensFechados.map((item) => (
              <AvisoFechadoItem key={chave(item)}>
                {item.avaliado_nome}, {item.lote_nome}
              </AvisoFechadoItem>
            ))}
          </AvisoFechadoLista>
          <AvisoFechadoLinha>
            Não dá mais pra enviar essas avaliações. Se sobrar alguma outra pendência, ela continua
            valendo normalmente.
          </AvisoFechadoLinha>
        </AvisoFechadoCard>
      )}

      {passo === "escolha" && (
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Qual avaliação você vai responder?</PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            <TipoOpcoesGrid>
              {TIPOS.map((t) => {
                const pendentes = filaDoTipo(t.valor);
                const fechadosDoTipo = itensFechados.filter((item) => item.lote_tipo === t.valor);
                const concluido = pendentes.length === 0;
                const soFechado = concluido && fechadosDoTipo.length > 0;
                return (
                  <TipoCard
                    key={t.valor}
                    type="button"
                    $disabled={concluido}
                    disabled={concluido}
                    onClick={() => abrirFilaDoTipo(t.valor)}
                  >
                    <TipoCardHeader>
                      <TipoCardTitulo>{t.titulo}</TipoCardTitulo>
                      {soFechado ? (
                        <PageBadge $tone="danger">Fechada sem resposta</PageBadge>
                      ) : (
                        concluido && <PageBadge $tone="success">Concluída</PageBadge>
                      )}
                    </TipoCardHeader>
                    <TipoCardDescricao>{t.descricao}</TipoCardDescricao>
                    {!concluido && (
                      <TipoCardDescricao>
                        {pendentes.length} {pendentes.length === 1 ? "pessoa" : "pessoas"} pendente
                        {pendentes.length === 1 ? "" : "s"}
                      </TipoCardDescricao>
                    )}
                  </TipoCard>
                );
              })}
            </TipoOpcoesGrid>
          </PageCardContent>
        </PageCard>
      )}

      {passo === "fila" && tipoEscolhido && (
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Suas avaliações</PageCardTitle>
            {/* ⭐ 2026-09-05, corrigido a pedido: era "Suas avaliações, Avaliação
                de finalização" tudo junto, na mesma linha e no mesmo peso —
                virava uma frase só, difícil de separar de relance. Um badge,
                como o resto da ficha já usa pra status, separa visualmente o
                TIPO do título sem inventar um padrão novo. */}
            <PageBadge $tone="default">
              {TIPOS.find((t) => t.valor === tipoEscolhido)?.titulo}
            </PageBadge>
          </PageCardHeader>
          <PageCardContent>
            <VoltarLink type="button" onClick={() => setPasso("escolha")}>
              ← Início
            </VoltarLink>
            <ProgressoRow>
              <ProgressoBarTrack>
                <ProgressoBarFill $percent={progressoPercent} />
              </ProgressoBarTrack>
              <ProgressoTexto>
                {concluidosNaRodada} de {totalNaRodada} concluídas
              </ProgressoTexto>
            </ProgressoRow>

            {algumFechado && (
              <FormErrorText>
                Alguns formulários fecharam enquanto você respondia, não dá mais pra enviar essas
                avaliações. As outras continuam valendo normalmente.
              </FormErrorText>
            )}

            <FilaList>
              {filaOriginalDoTipo.map((item) => {
                const fechado = !item.aberto;
                const concluido = !!rascunhos[chave(item)];
                return (
                  <MotivoDesabilitado
                    key={chave(item)}
                    motivo={
                      fechado
                        ? "O lote de avaliação foi fechado antes de você responder, e a plataforma não aceita mais o envio. " +
                          "Avise a diretoria se esta avaliação ainda precisa entrar."
                        : null
                    }
                  >
                  <FilaItem
                    type="button"
                    $clicavel={!fechado}
                    disabled={fechado}
                    onClick={() => abrirPessoa(item)}
                  >
                    <FilaItemInfo>
                      <FilaItemNome>{item.avaliado_nome}</FilaItemNome>
                      <FilaItemMeta>{projetosDaPessoa(item)}</FilaItemMeta>
                    </FilaItemInfo>
                    <PageBadge $tone={fechado ? "danger" : concluido ? "success" : "warning"}>
                      {fechado ? "Fechado" : concluido ? "Concluída · editar" : "Pendente"}
                    </PageBadge>
                  </FilaItem>
                  </MotivoDesabilitado>
                );
              })}
            </FilaList>

            {erroForm && <FormErrorText>{erroForm}</FormErrorText>}
            {erroEnvio && <FormErrorText>{erroEnvio}</FormErrorText>}

            {/* ⭐ Quantas faltam, e não só que falta. O envio é tudo-ou-nada,
                então o número é a única informação capaz de dizer quanto ainda
                há pela frente — sem ele, quem tem 12 colegas para avaliar não
                sabe se parou na segunda ou na décima primeira. */}
            <MotivoDesabilitado
              motivo={
                prontoParaEnviar
                  ? null
                  : totalNaRodada === 0
                    ? "Não há ninguém para avaliar nesta rodada."
                    : `Faltam ${totalNaRodada - concluidosNaRodada} de ${totalNaRodada} — ` +
                      "as avaliações são enviadas todas juntas, então preencha as que ficaram abertas na lista acima."
              }
            >
              <PageButton
                type="button"
                disabled={!prontoParaEnviar || enviandoTudo}
                onClick={handleEnviarTodas}
              >
                {enviandoTudo ? "Enviando..." : "Enviar avaliações"}
              </PageButton>
            </MotivoDesabilitado>
          </PageCardContent>
        </PageCard>
      )}

      {passo === "avaliando" && pessoaAtual && formulario && (
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>
              Avaliando {pessoaAtual.avaliado_nome} · {ROTULO_PAPEL[pessoaAtual.form_type]} ·{" "}
              {projetosDaPessoa(pessoaAtual)}
            </PageCardTitle>
          </PageCardHeader>
          <PageCardContent>
            <VoltarLink type="button" onClick={() => setPasso("fila")}>
              ← Voltar pra fila
            </VoltarLink>

            <InstrucoesBox>
              <InstrucoesTitulo>Como avaliar</InstrucoesTitulo>
              <IntroTexto>{INTRO_FORMULARIO}</IntroTexto>
              <EscalaLegenda>
                {escalaParaPapel(pessoaAtual.form_type).map((e) => [
                  <EscalaLegendaNumero key={`n-${e.nota}`}>{e.nota}</EscalaLegendaNumero>,
                  <EscalaLegendaTexto key={`t-${e.nota}`}>
                    <strong>{e.titulo}:</strong> {e.texto}
                  </EscalaLegendaTexto>,
                ])}
              </EscalaLegenda>
            </InstrucoesBox>

            <FormStack onSubmit={handleSubmit}>
              {formulario.secoes.map((secao) => {
                // Nas seções de critério único do formulário de coordenador,
                // o rótulo do critério é idêntico ao título da seção, não
                // repete visualmente (mas mantém pra acessibilidade).
                const labelRedundante =
                  secao.criterios.length === 1 && secao.criterios[0].label.trim() === secao.titulo.trim();
                return (
                <SecaoFormulario key={secao.id}>
                  <SecaoTitulo>{secao.titulo}</SecaoTitulo>
                  {secao.descricao && <SecaoDescricao>{secao.descricao}</SecaoDescricao>}
                  <NotaButtonsGroup titulo="">
                    {secao.criterios.map((criterio) =>
                      criterio.tipo_resposta === "nota" ? (
                        <NotaButtons
                          key={criterio.id}
                          id={`criterio-${criterio.id}`}
                          label={criterio.label}
                          descricao={criterio.descricao}
                          esconderLabel={labelRedundante}
                          value={notas[criterio.id]?.nota ?? null}
                          onChange={(valor) =>
                            setNotas((atual) => ({ ...atual, [criterio.id]: { criterio_id: criterio.id, nota: valor } }))
                          }
                        />
                      ) : (
                        <FieldGroup key={criterio.id}>
                          <FieldLabel htmlFor={`criterio-${criterio.id}`}>{criterio.label}</FieldLabel>
                          {criterio.descricao && <SecaoDescricao>{criterio.descricao}</SecaoDescricao>}
                          <FieldTextarea
                            id={`criterio-${criterio.id}`}
                            value={notas[criterio.id]?.resposta_texto ?? ""}
                            maxLength={criterio.limite_caracteres ?? undefined}
                            onChange={(e) =>
                              setNotas((atual) => ({
                                ...atual,
                                [criterio.id]: { criterio_id: criterio.id, resposta_texto: e.target.value },
                              }))
                            }
                          />
                          {criterio.limite_caracteres && (
                            <CampoContador $excedido={false}>
                              {(notas[criterio.id]?.resposta_texto ?? "").length}/{criterio.limite_caracteres}
                            </CampoContador>
                          )}
                        </FieldGroup>
                      ),
                    )}
                  </NotaButtonsGroup>
                </SecaoFormulario>
                );
              })}

              <NotaGeralDestaque>
                <SecaoTitulo>{formulario.nota_geral_titulo}</SecaoTitulo>
                <SecaoDescricao>{formulario.nota_geral_descricao}</SecaoDescricao>
                <NotaButtons label="Nota geral" value={notaGeral} onChange={setNotaGeral} />
              </NotaGeralDestaque>

              <FieldGroup>
                <FieldLabel htmlFor="comentarios">{formulario.comentarios_titulo}</FieldLabel>
                <SecaoDescricao>{formulario.comentarios_descricao}</SecaoDescricao>
                <FieldTextarea
                  id="comentarios"
                  value={comentarios}
                  onChange={(e) => setComentarios(e.target.value)}
                  required
                />
                <ComentariosAviso>{formulario.comentarios_aviso}</ComentariosAviso>
              </FieldGroup>

              {erroForm && <FormErrorText>{erroForm}</FormErrorText>}

              <PageButton type="submit">Concluir avaliação</PageButton>
            </FormStack>
          </PageCardContent>
        </PageCard>
      )}

      {passo === "escolha" && mostrarBotaoFinalizarAgora && (
        <PageButton $variant="ghost" type="button" onClick={handleFinalizarAgora}>
          Não quero responder o outro agora
        </PageButton>
      )}

      {passo === "concluido" && (
        <PageCard>
          <PageCardContent>
            <DoneBlock>
              <FilaList>
                <FilaItem type="button" $clicavel={false} disabled>
                  <FilaItemInfo>
                    <FilaItemNome>Tudo certo por aqui!</FilaItemNome>
                    <FilaItemMeta>Você concluiu as avaliações pendentes no momento.</FilaItemMeta>
                  </FilaItemInfo>
                </FilaItem>
              </FilaList>
            </DoneBlock>
          </PageCardContent>
        </PageCard>
      )}
    </>
  );
}
