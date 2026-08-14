import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import type { Escopo, Frente } from "@/types/banca";
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
  dias_uteis_vendidos: string;
}

export function validarEscopos(escopos: EscopoEmEdicao[]): string | null {
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
  }
  return null;
}

export function montarEscoposPayload(escopos: EscopoEmEdicao[]) {
  return escopos.map((e) => ({
    escopo_id: e.escopo_id,
    nome_customizado: e.escopo_id === null ? e.nome_customizado.trim() : null,
    frente_id: e.frente_id,
    dias_uteis_vendidos: Number(e.dias_uteis_vendidos),
  }));
}

interface EscopoPickerProps {
  /** Catálogo completo; o componente filtra pelas frentes marcadas. */
  catalogo: Escopo[];
  frentes: Frente[];
  frentesMarcadas: number[];
  valor: EscopoEmEdicao[];
  onChange: (valor: EscopoEmEdicao[]) => void;
  desabilitado?: boolean;
}

export function EscopoPicker({
  catalogo,
  frentes,
  frentesMarcadas,
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
    const novo: EscopoEmEdicao = {
      escopo_id: escopoId,
      nome_customizado: "",
      frente_id: frentePadrao,
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
              onChange={(e) => alterar(indice, { frente_id: Number(e.target.value) })}
              aria-label="Frente do escopo"
            >
              {frentesMarcadas.map((id) => (
                <option key={id} value={id}>
                  {nomeFrente(id)}
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
