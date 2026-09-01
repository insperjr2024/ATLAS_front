import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import type { Escopo, Frente } from "@/types/banca";
import type { CalendariosDaFrente } from "@/lib/projetos";
import { EmptyText } from "@/styles/page.styled";
import { FieldInput, FieldSelect } from "@/pages/Bancas.styled";
import {
  CatalogoChips,
  CatalogoGrupo,
  CatalogoGrupoTitulo,
  EscopoChip,
  EscopoLinha,
  EscopoLista,
  DiasInput,
  MoverBotao,
  MoverBotoes,
  RemoverBotao,
  PickerCatalogo,
} from "./EscopoPicker.styled";

/** A hierarquia dos 4 escopos clássicos da Business, sempre nessa ordem
 *  quando aparecem juntos num projeto (a pedido do usuário, 2026-08-07).
 *  Espelha `ORDEM_PADRAO_BUSINESS` da migration `9ef5e8c8a983` no backend,
 *  só o nome muda de arquivo, a regra é a mesma. */
/** O valor do `<option>` de "ainda nao escolheu". Precisa ser distinto de `""`,
 *  que e o calendario unico da frente — uma resposta de verdade. */
const SEM_ESCOLHA = "__sem_escolha__";

const ORDEM_PADRAO_BUSINESS: Record<string, number> = {
  "Análise Mercadológica": 0,
  "Plano Operacional": 1,
  "Plano Estratégico de Marketing": 2,
  "Viabilidade Financeira": 3,
};

/** Um escopo sendo montado no formulário, antes de virar `projeto_escopo`. */
export interface EscopoEmEdicao {
  /** Vazio = é um "Outro", com o nome digitado à mão. */
  escopo_id: number | null;
  nome_customizado: string;
  frente_id: number;
  /**
   * O calendario academico em que os dias deste escopo sao contados.
   *
   * `null` e resposta legitima — e o calendario da frente que tem um so —, e
   * por isso `undefined` e o estado "ainda nao respondeu": os dois precisam se
   * distinguir para `validarEscopos` conseguir cobrar a escolha.
   */
  calendario?: string | null;
  dias_uteis_vendidos: string;
}

/** As opcoes de calendario de uma frente. Lista vazia = ainda carregando. */
function opcoesDaFrente(calendarios: CalendariosDaFrente[], frenteId: number) {
  return calendarios.find((c) => c.frente_id === frenteId)?.calendarios ?? [];
}

export function validarEscopos(
  escopos: EscopoEmEdicao[],
  calendarios: CalendariosDaFrente[] = [],
): string | null {
  if (escopos.length === 0) return "Adicione pelo menos um escopo vendido.";
  for (const escopo of escopos) {
    const ehOutro = escopo.escopo_id === null;
    if (ehOutro && !escopo.nome_customizado.trim()) {
      return "Dê um nome ao escopo 'Outro'.";
    }
    const dias = Number(escopo.dias_uteis_vendidos);
    if (!dias || dias <= 0) {
      return "Cada escopo precisa de dias úteis vendidos maiores que zero.";
    }
    // O calendario e obrigatorio quando ha mais de uma opcao. Com uma so,
    // `adicionar` ja a aplicou e nao ha o que perguntar.
    const opcoes = opcoesDaFrente(calendarios, escopo.frente_id);
    if (opcoes.length > 1 && escopo.calendario === undefined) {
      return "Escolha o calendário de cada escopo: é nele que os dias vendidos são contados.";
    }
  }
  return null;
}

export function montarEscoposPayload(escopos: EscopoEmEdicao[]) {
  return escopos.map((e) => ({
    escopo_id: e.escopo_id,
    nome_customizado: e.escopo_id === null ? e.nome_customizado.trim() : null,
    frente_id: e.frente_id,
    // `undefined` so chega aqui na frente de calendario unico, onde nulo e a
    // resposta certa — `validarEscopos` barra o resto antes.
    calendario: e.calendario ?? null,
    dias_uteis_vendidos: Number(e.dias_uteis_vendidos),
  }));
}

interface EscopoPickerProps {
  /** Catálogo completo; o componente filtra pelas frentes marcadas. */
  catalogo: Escopo[];
  frentes: Frente[];
  frentesMarcadas: number[];
  /** Os calendarios escolhiveis por frente (`GET /calendarios-para-escolha`).
   *  Vazio enquanto carrega: o seletor aparece desabilitado, nunca some. */
  calendarios?: CalendariosDaFrente[];
  valor: EscopoEmEdicao[];
  onChange: (valor: EscopoEmEdicao[]) => void;
  desabilitado?: boolean;
}

export function EscopoPicker({
  catalogo,
  frentes,
  frentesMarcadas,
  calendarios = [],
  valor,
  onChange,
  desabilitado,
}: EscopoPickerProps) {
  const nomeFrente = (id: number) => frentes.find((f) => f.id === id)?.nome ?? `Frente ${id}`;
  // Um escopo do catálogo só entra uma vez por projeto, "Outro" fica de
  // fora dessa checagem porque cada um tem nome próprio, não colide.
  const idsJaEscolhidos = new Set(valor.map((e) => e.escopo_id).filter((id) => id !== null));
  const disponiveis = catalogo.filter(
    (e) => e.frente_id !== null && frentesMarcadas.includes(e.frente_id) && !idsJaEscolhidos.has(e.id),
  );

  function alterar(indice: number, mudanca: Partial<EscopoEmEdicao>) {
    onChange(valor.map((e, i) => (i === indice ? { ...e, ...mudanca } : e)));
  }

  /** Trocar a frente invalida o calendario: o rotulo vale DENTRO de uma frente,
   *  e "Engenharias" nao existe em Business. Volta a `undefined` quando a nova
   *  frente tem escolha a fazer, e se resolve sozinho quando nao tem. */
  function trocarFrente(indice: number, frenteId: number) {
    const opcoes = opcoesDaFrente(calendarios, frenteId);
    alterar(indice, {
      frente_id: frenteId,
      calendario: opcoes.length === 1 ? opcoes[0].valor : undefined,
    });
  }

  function remover(indice: number) {
    onChange(valor.filter((_, i) => i !== indice));
  }

  /** Troca de posição com o vizinho, é isso que "ordem" significa aqui: a
   *  sequência em que a lista vai ser enviada na criação do projeto. */
  function mover(indice: number, direcao: -1 | 1) {
    const alvo = indice + direcao;
    if (alvo < 0 || alvo >= valor.length) return;
    const nova = [...valor];
    [nova[indice], nova[alvo]] = [nova[alvo], nova[indice]];
    onChange(nova);
  }

  function adicionar(escopoId: number | null) {
    const catalogoItem = escopoId !== null ? catalogo.find((e) => e.id === escopoId) : null;
    const frentePadrao = catalogoItem?.frente_id ?? frentesMarcadas[0];
    // Com uma opcao so nao ha pergunta a fazer: ja nasce resolvido. Com mais
    // de uma fica `undefined`, e `validarEscopos` cobra a escolha.
    const opcoesNovo = opcoesDaFrente(calendarios, frentePadrao);
    const novo: EscopoEmEdicao = {
      escopo_id: escopoId,
      nome_customizado: "",
      frente_id: frentePadrao,
      calendario: opcoesNovo.length === 1 ? opcoesNovo[0].valor : undefined,
      dias_uteis_vendidos: "",
    };

    // Um dos 4 clássicos da Business: entra já no lugar certo da hierarquia
    // em vez de sempre no fim, antes do primeiro que já esteja na lista com
    // ordem maior que a dele. Escopo "Outro" ou de catálogo fora dessa lista
    // simplesmente vai pro fim, como sempre foi.
    const ordemNovo = catalogoItem ? ORDEM_PADRAO_BUSINESS[catalogoItem.nome] : undefined;
    if (ordemNovo === undefined) {
      onChange([...valor, novo]);
      return;
    }
    const posicao = valor.findIndex((e) => {
      const nomeExistente = catalogo.find((c) => c.id === e.escopo_id)?.nome;
      const ordemExistente = nomeExistente ? ORDEM_PADRAO_BUSINESS[nomeExistente] : undefined;
      return ordemExistente !== undefined && ordemExistente > ordemNovo;
    });
    onChange(
      posicao === -1
        ? [...valor, novo]
        : [...valor.slice(0, posicao), novo, ...valor.slice(posicao)],
    );
  }

  if (frentesMarcadas.length === 0) {
    return <EmptyText>Marque uma frente acima para escolher os escopos vendidos.</EmptyText>;
  }

  return (
    <EscopoLista>
      {valor.length === 0 && (
        <EmptyText>Nenhum escopo adicionado. Escolha abaixo o que foi vendido.</EmptyText>
      )}

      {valor.map((escopo, indice) => {
        const ehOutro = escopo.escopo_id === null;
        return (
          <EscopoLinha key={indice}>
            <MoverBotoes>
              <MoverBotao
                type="button"
                aria-label="Mover pra cima"
                disabled={desabilitado || indice === 0}
                onClick={() => mover(indice, -1)}
              >
                <ChevronUp size={12} />
              </MoverBotao>
              <MoverBotao
                type="button"
                aria-label="Mover pra baixo"
                disabled={desabilitado || indice === valor.length - 1}
                onClick={() => mover(indice, 1)}
              >
                <ChevronDown size={12} />
              </MoverBotao>
            </MoverBotoes>

            {ehOutro ? (
              <FieldInput
                value={escopo.nome_customizado}
                placeholder="Nome do escopo customizado"
                disabled={desabilitado}
                onChange={(e) => alterar(indice, { nome_customizado: e.target.value })}
                aria-label="Nome do escopo customizado"
              />
            ) : (
              <FieldInput
                value={catalogo.find((c) => c.id === escopo.escopo_id)?.nome ?? ""}
                readOnly
                tabIndex={-1}
              />
            )}

            <FieldSelect
              value={String(escopo.frente_id)}
              disabled={desabilitado || frentesMarcadas.length === 1}
              onChange={(e) => trocarFrente(indice, Number(e.target.value))}
              aria-label="Frente do escopo"
            >
              {frentesMarcadas.map((id) => (
                <option key={id} value={id}>
                  {nomeFrente(id)}
                </option>
              ))}
            </FieldSelect>

            {/* O calendario em que os dias deste escopo sao contados. Sempre
                visivel, mesmo com uma opcao so: e o campo que diz QUAL
                calendario esta valendo, e esconde-lo e o que deixou 22
                projetos rodando sem ninguem ter escolhido nada. */}
            <FieldSelect
              value={escopo.calendario === undefined ? SEM_ESCOLHA : escopo.calendario ?? ""}
              disabled={
                desabilitado || opcoesDaFrente(calendarios, escopo.frente_id).length <= 1
              }
              onChange={(e) =>
                alterar(indice, {
                  calendario: e.target.value === "" ? null : e.target.value,
                })
              }
              aria-label="Calendário do escopo"
            >
              {escopo.calendario === undefined && (
                <option value={SEM_ESCOLHA} disabled>
                  Calendário…
                </option>
              )}
              {opcoesDaFrente(calendarios, escopo.frente_id).map((opcao) => (
                <option key={opcao.rotulo} value={opcao.valor ?? ""}>
                  {opcao.rotulo}
                </option>
              ))}
            </FieldSelect>

            <DiasInput
              type="number"
              min={1}
              max={200}
              value={escopo.dias_uteis_vendidos}
              placeholder="dias"
              disabled={desabilitado}
              onChange={(e) => alterar(indice, { dias_uteis_vendidos: e.target.value })}
              aria-label="Dias úteis vendidos"
            />

            <RemoverBotao
              type="button"
              aria-label="Remover escopo"
              disabled={desabilitado}
              onClick={() => remover(indice)}
            >
              <X size={14} />
            </RemoverBotao>
          </EscopoLinha>
        );
      })}

      <PickerCatalogo>
        {/* Um bloco por frente MARCADA, na ordem em que foram marcadas. Uma
            frente sem escopo livre continua aparecendo, com o motivo escrito:
            sumir o bloco faria parecer que a frente não foi marcada. */}
        {frentesMarcadas.map((frenteId) => {
          const doGrupo = disponiveis.filter((e) => e.frente_id === frenteId);
          return (
            <CatalogoGrupo key={frenteId}>
              <CatalogoGrupoTitulo>{nomeFrente(frenteId)}</CatalogoGrupoTitulo>
              {doGrupo.length === 0 ? (
                <EmptyText>
                  {catalogo.some((e) => e.frente_id === frenteId)
                    ? "Todos os escopos desta frente já foram adicionados."
                    : "Esta frente ainda não tem escopo no catálogo."}
                </EmptyText>
              ) : (
                <CatalogoChips>
                  {doGrupo.map((escopo) => (
                    <EscopoChip
                      key={escopo.id}
                      type="button"
                      disabled={desabilitado}
                      onClick={() => adicionar(escopo.id)}
                    >
                      <Plus size={12} aria-hidden="true" />
                      {escopo.nome}
                    </EscopoChip>
                  ))}
                </CatalogoChips>
              )}
            </CatalogoGrupo>
          );
        })}

        {/* Além dos do catálogo, sempre existe a opção "Outro". */}
        <CatalogoChips>
          <EscopoChip $outro type="button" disabled={desabilitado} onClick={() => adicionar(null)}>
            <Plus size={12} aria-hidden="true" />
            Outro (nome customizado)
          </EscopoChip>
        </CatalogoChips>
      </PickerCatalogo>
    </EscopoLista>
  );
}
