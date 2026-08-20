import { apiFetch } from "@/lib/api";
import { paraDataUtc } from "@/lib/projetos";
import type {
  Banca,
  BancaDetalhes,
  BancaFrente,
  BancaParaAvaliar,
  Candidatura,
  EquipeProjeto,
  Escopo,
  EscopoVendidoResumo,
  Frente,
  StatusBanca,
} from "@/types/banca";

/**
 * Marca que a banca ACONTECEU, o passo que separa "a data passou" de "foi
 * feita". Sem ele a banca fica `atrasada` para sempre e o  conta isso
 * como atraso do projeto.
 *
 * `presentes` é a lista de quem compareceu; o backend confirma essas
 * candidaturas e desmarca o resto.
 *
 * `forcar` registra mesmo abaixo do mínimo de alocados, o backend só aceita
 * de diretor (a exceção de composição é da diretoria).
 */
export function realizarBanca(
  bancaId: number,
  dados: { realizado_em?: string | null; presentes?: number[]; forcar?: boolean },
  token: string,
) {
  return apiFetch(`/bancas/${bancaId}/realizar`, {
    method: "POST",
    token,
    body: JSON.stringify(dados),
  });
}

/**
 * Aprovada ou não aprovada.
 *
 * É este resultado que libera a entrega ao cliente. Enquanto ele não
 * existe, o escopo não pode ser entregue, a trava vive no backend.
 */
export function registrarResultado(
  bancaId: number,
  resultado: "aprovada" | "nao_aprovada",
  token: string,
) {
  return apiFetch(`/bancas/${bancaId}/resultado`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ resultado }),
  });
}


/**
 * O relato do coordenador do projeto sobre a banca, ele não é avaliador
 * dela (ver "ninguém avalia o próprio grupo"), então isto substitui o
 * formulário de avaliação/notas pra ele, não se soma a ele. Só aceito depois
 * de `realizado_em` e só pelo próprio `banca.coordenador_id` (o backend
 * confere os dois).
 */
export function registrarDescricaoCoordenador(bancaId: number, descricao: string, token: string) {
  return apiFetch(`/bancas/${bancaId}/descricao-coordenador`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ descricao }),
  });
}

/**
 * A escalação automática do uma semana antes, preenche as bancas que ainda
 * estão sem gente, por rodízio e priorizando a mesma frente.
 */
export interface ResultadoPush {
  banca_id: number;
  nome_projeto: string;
  alocados_antes: number;
  alocados_depois: number;
  usuarios_alocados: number[];
}

export function pushAlocacao(token: string) {
  return apiFetch<ResultadoPush[]>("/bancas/push-alocacao", { method: "POST", token });
}

/**
 * Aloca OUTRA pessoa numa banca. Só a diretoria, escalar alguém mexe na
 * agenda dele sem que tenha pedido.
 */
export function alocarUsuario(bancaId: number, usuarioId: number, token: string) {
  return apiFetch("/candidaturas", {
    method: "POST",
    token,
    body: JSON.stringify({ banca_id: bancaId, usuario_id: usuarioId }),
  });
}

export function getBancas(token: string) {
  return apiFetch<Banca[]>("/bancas", { token });
}

/**
 * A ficha da banca com os NOMES já resolvidos, uma chamada só.
 *
 * Não confundir com `getBancas()` + os cruzamentos de `lib/nucleo.ts`, que é
 * como a tela `/bancas` monta a mesma informação. Lá o custo já foi pago (ela
 * carrega usuários, frentes, candidaturas e equipes para desenhar os cards);
 * em qualquer outra tela, puxar cinco listagens inteiras para escrever sete
 * linhas seria caro à toa. E o backend resolve `membros` melhor: ele conhece a
 * equipe REAL do projeto, não só a tabela legada `equipe_projeto`, que fica
 * vazia em toda banca marcada pelo cronograma.
 */
export function getBancaDetalhes(bancaId: number, token: string) {
  return apiFetch<BancaDetalhes>(`/bancas/${bancaId}/detalhes`, { token });
}

export function getCandidaturas(token: string) {
  return apiFetch<Candidatura[]>("/candidaturas", { token });
}

export function getBancasParaAvaliar(usuarioId: number, token: string) {
  return apiFetch<BancaParaAvaliar[]>(`/usuarios/${usuarioId}/bancas-para-avaliar`, { token });
}

export function alocar(bancaId: number, token: string) {
  return apiFetch<Candidatura>("/candidaturas", {
    method: "POST",
    token,
    body: JSON.stringify({ banca_id: bancaId }),
  });
}

export function desalocar(candidaturaId: number, token: string) {
  return apiFetch("/candidaturas/" + candidaturaId, { method: "DELETE", token });
}

export function getEscopos(token: string) {
  return apiFetch<Escopo[]>("/escopos", { token });
}

export function getEscoposVendidos(token: string) {
  return apiFetch<EscopoVendidoResumo[]>("/escopos-projeto", { token });
}

export function getFrentes(token: string) {
  return apiFetch<Frente[]>("/frentes", { token });
}

export function getBancasFrentes(token: string) {
  return apiFetch<BancaFrente[]>("/bancas-frentes", { token });
}

export function getEquipesProjeto(token: string) {
  return apiFetch<EquipeProjeto[]>("/equipes-projeto", { token });
}

export interface CreateBancaPayload {
  nome_projeto: string;
  escopo_id: number;
  data_hora: string;
  consultor_ids: number[];
  frente_ids: number[];
  /** Só a diretoria manda isto, ver `require_diretor` no backend. */
  piso_minimo_override?: number | null;
}

export interface UpdateBancaPayload {
  nome_projeto?: string;
  escopo_id?: number;
  data_hora?: string;
  piso_minimo_override?: number | null;
}

export function createBanca(dados: CreateBancaPayload, token: string) {
  return apiFetch<Banca>("/bancas", {
    method: "POST",
    token,
    body: JSON.stringify(dados),
  });
}

export function updateBanca(bancaId: number, dados: UpdateBancaPayload, token: string) {
  return apiFetch<Banca>(`/bancas/${bancaId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(dados),
  });
}

export function deleteBanca(bancaId: number, token: string) {
  return apiFetch(`/bancas/${bancaId}`, { method: "DELETE", token });
}

function createEquipeProjeto(dados: { banca_id: number; usuario_id: number }, token: string) {
  return apiFetch<EquipeProjeto>("/equipes-projeto", {
    method: "POST",
    token,
    body: JSON.stringify(dados),
  });
}

function deleteEquipeProjeto(equipeId: number, token: string) {
  return apiFetch(`/equipes-projeto/${equipeId}`, { method: "DELETE", token });
}

function createBancaFrente(dados: { banca_id: number; frente_id: number }, token: string) {
  return apiFetch<BancaFrente>("/bancas-frentes", {
    method: "POST",
    token,
    body: JSON.stringify(dados),
  });
}

function deleteBancaFrente(bancaFrenteId: number, token: string) {
  return apiFetch(`/bancas-frentes/${bancaFrenteId}`, { method: "DELETE", token });
}

export async function syncEquipeProjeto(
  bancaId: number,
  consultorIds: number[],
  equipesProjeto: EquipeProjeto[],
  token: string,
) {
  const atuais = equipesProjeto.filter((e) => e.banca_id === bancaId);
  const desejados = new Set(consultorIds);
  const atuaisIds = new Set(atuais.map((e) => e.usuario_id));

  await Promise.all(
    atuais.filter((e) => !desejados.has(e.usuario_id)).map((e) => deleteEquipeProjeto(e.id, token)),
  );

  await Promise.all(
    consultorIds.filter((id) => !atuaisIds.has(id)).map((usuarioId) => createEquipeProjeto({ banca_id: bancaId, usuario_id: usuarioId }, token)),
  );
}

export async function syncBancaFrentes(
  bancaId: number,
  frenteIds: number[],
  bancasFrentes: BancaFrente[],
  token: string,
) {
  const atuais = bancasFrentes.filter((bf) => bf.banca_id === bancaId);
  const desejados = new Set(frenteIds);
  const atuaisIds = new Set(atuais.map((bf) => bf.frente_id));

  await Promise.all(
    atuais.filter((bf) => !desejados.has(bf.frente_id)).map((bf) => deleteBancaFrente(bf.id, token)),
  );

  await Promise.all(
    frenteIds.filter((id) => !atuaisIds.has(id)).map((frenteId) => createBancaFrente({ banca_id: bancaId, frente_id: frenteId }, token)),
  );
}

/**
 * Espelho de `utils/banca_status.py::aceita_inscricao`.
 *
 * Uma banca `atrasada` (venceu e não aconteceu) **continua aceitando gente** —
 * ela ainda vai acontecer. Quem fecha a inscrição é a realização, não o
 * calendário. O backend revalida.
 */
export function aceitaInscricao(status: StatusBanca): boolean {
  return status === "aberta" || status === "atrasada";
}

export const ROTULO_STATUS_BANCA: Record<StatusBanca, string> = {
  nao_marcada: "Não marcada",
  aberta: "Aberta para inscrições",
  realizada: "Realizada",
  atrasada: "Atrasada",
};

/** Vermelho só para `atrasada`, é o estado que precisa gritar na tela. */
export function tomDoStatusBanca(status: StatusBanca): "default" | "success" | "muted" | "danger" {
  if (status === "atrasada") return "danger";
  if (status === "realizada") return "success";
  if (status === "nao_marcada") return "muted";
  return "default";
}

export function podeGerenciarBanca(
  banca: Banca,
  usuarioId: number,
  ehDiretor = false,
): boolean {
  // Banca atrasada continua gerenciável: é justamente quando o coordenador
  // precisa entrar para marcar que ela aconteceu (ou remarcar).
  //
  // ⭐ A diretoria também. A banca nasce com o coordenador do PROJETO como
  // dono, mesmo quando quem a criou foi a diretoria pela tela de Bancas — e
  // então quem acabara de criá-la não via Editar nem Excluir no próprio card.
  // O backend sempre permitiu (`require_pode_definir_cronograma` + acesso ao
  // projeto); era só a tela que escondia.
  return (
    (banca.coordenador_id === usuarioId || ehDiretor) && aceitaInscricao(banca.status)
  );
}

export function toDateInputValue(iso: string): string {
  const d = paraDataUtc(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toTimeInputValue(iso: string): string {
  const d = paraDataUtc(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * ⭐ Pedir para marcar a banca num horário já ocupado (§8).
 *
 * ⚠ **O caminho que faltava.** O backend bloqueia duas bancas no mesmo horário
 * e anuncia que a exceção é da diretoria — mas até aqui nenhuma tela sabia como
 * pedi-la. Quem esbarrava no choque lia a regra e não tinha o que fazer.
 */
export function solicitarExcecaoChoque(
  dados: { projeto_escopo_id: number; data_hora_pretendida: string; justificativa: string },
  token: string,
) {
  return apiFetch<{ id: number; status: string }>("/bancas/excecoes-choque", {
    method: "POST",
    token,
    body: JSON.stringify(dados),
  });
}

/** Um pedido de exceção esperando a diretoria. */
export interface ExcecaoChoquePendente {
  id: number;
  projeto_id: number | null;
  projeto_nome: string;
  projeto_escopo_id: number;
  data_hora_pretendida: string;
  /** Com QUEM está chocando — o contexto sem o qual a decisão é no escuro. */
  conflita_com: string;
  justificativa: string;
  solicitado_por: number;
  solicitado_por_nome: string | null;
  criado_em: string;
}

export function getExcecoesChoquePendentes(token: string) {
  return apiFetch<ExcecaoChoquePendente[]>("/bancas/excecoes-choque/pendentes", { token });
}

/** A decisão da diretoria — `resposta` é obrigatória nos dois sentidos. */
export function decidirExcecaoChoque(
  pedidoId: number,
  dados: { aprovar: boolean; resposta: string },
  token: string,
) {
  return apiFetch(`/bancas/excecoes-choque/${pedidoId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(dados),
  });
}

/**
 * ⭐ Pedir autorização para marcar a banca fora da janela do escopo (§13).
 *
 * ⚠ **O caminho que faltava.** Marcar fora da janela era um atalho de um ato
 * só: só quem tinha `posicao === "diretor"` conseguia, e marcava sozinho, na
 * mesma chamada que gravava a data. Agora quem marca PEDE aqui, com
 * justificativa, e a diretoria decide depois, em ato separado — mesmo
 * desenho do pedido de exceção de choque acima.
 */
export function solicitarForaJanela(
  dados: { projeto_escopo_id: number; data_hora_pretendida: string; justificativa: string },
  token: string,
) {
  return apiFetch<{ id: number; status: string }>("/bancas/fora-janela", {
    method: "POST",
    token,
    body: JSON.stringify(dados),
  });
}

/** Um pedido de autorização de banca fora da janela, esperando a diretoria. */
export interface ForaJanelaPendente {
  id: number;
  projeto_id: number | null;
  projeto_nome: string;
  projeto_escopo_id: number;
  escopo_nome: string | null;
  data_hora_pretendida: string;
  /** O fim da janela hoje — o contexto de quanto a data pretendida passa dela. */
  fim_janela: string | null;
  justificativa: string;
  solicitado_por: number;
  solicitado_por_nome: string | null;
  criado_em: string;
}

export function getForaJanelaPendentes(token: string) {
  return apiFetch<ForaJanelaPendente[]>("/bancas/fora-janela/pendentes", { token });
}

/** A decisão da diretoria — `resposta` é obrigatória nos dois sentidos. */
export function decidirForaJanela(
  pedidoId: number,
  dados: { aprovar: boolean; resposta: string },
  token: string,
) {
  return apiFetch(`/bancas/fora-janela/${pedidoId}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(dados),
  });
}

/**
 * ⭐ Todas as bancas de um PROJETO, cada uma com a ficha completa.
 *
 * É o que a aba "Banca" do projeto consome. Rota própria, e não N chamadas a
 * `/bancas/{id}/detalhes`: quem abre a aba não sabe os ids das bancas, e
 * descobri-los exigiria buscar os escopos antes só para saber o que pedir.
 */
export function getBancasDoProjeto(projetoId: number, token: string) {
  return apiFetch<BancaDetalhes[]>(`/projetos/${projetoId}/bancas`, { token });
}
