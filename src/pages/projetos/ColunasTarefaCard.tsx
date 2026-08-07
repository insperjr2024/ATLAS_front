import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  CORES_SUGERIDAS,
  createColuna,
  deleteColuna,
  getColunas,
  reordenarColunas,
  tonsDaColuna,
  updateColuna,
  type ColunaTarefa,
} from "@/lib/colunas-tarefa";
import {
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageButton,
  PageButtonSm,
  EmptyText,
} from "@/styles/page.styled";
import {
  FieldGroup,
  FieldLabel,
  FieldInput,
  FormErrorText,
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  WideModalContent,
} from "./Projetos.styled";
import { CheckboxLabel } from "../Bancas.styled";
import {
  Amostra,
  AmostraBotao,
  ColunaLinha,
  ColunaNome,
  ColunaPreview,
  PaletaGrid,
  Reordenar,
} from "./ColunasTarefa.styled";

/**
 * A configuração das colunas do kanban **deste projeto** (§3: gerir é da
 * diretoria).
 *
 * Eram um ENUM de 5 valores no banco, depois uma configuração global em
 * /config. Hoje moram dentro do projeto: cada projeto tem um fluxo, e mudar
 * o board de um não pode mexer no dos outros.
 *
 * ⭐ O campo que mais importa é **"encerra a tarefa"**: "vencida" não é
 * campo, é prazo passado + tarefa ainda aberta. Com colunas livres, é a
 * diretoria que diz o que "aberta" significa em cada uma — sem isso, uma
 * coluna "Arquivado" deixaria tudo que cai ali vencido para sempre.
 */
export function ColunasTarefaCard({
  projetoId,
  onMudou,
}: {
  projetoId: number;
  /** O board ao lado precisa redesenhar quando uma coluna muda. */
  onMudou?: () => void;
}) {
  const { token } = useAuth();
  const [colunas, setColunas] = useState<ColunaTarefa[]>([]);
  const [editando, setEditando] = useState<ColunaTarefa | "nova" | null>(null);
  const [erro, setErro] = useState("");

  async function carregar() {
    if (!token) return;
    setErro("");
    try {
      setColunas(await getColunas(projetoId, token));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar as colunas");
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, projetoId]);

  async function mover(indice: number, direcao: -1 | 1) {
    if (!token) return;
    const destino = indice + direcao;
    if (destino < 0 || destino >= colunas.length) return;
    const ids = colunas.map((c) => c.id);
    [ids[indice], ids[destino]] = [ids[destino], ids[indice]];
    setErro("");
    try {
      setColunas(await reordenarColunas(projetoId, ids, token));
      onMudou?.();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao reordenar");
    }
  }

  async function excluir(coluna: ColunaTarefa) {
    if (!token) return;
    setErro("");
    try {
      await deleteColuna(projetoId, coluna.id, token);
      await carregar();
      onMudou?.();
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : "Erro ao excluir";
      // A coluna tem tarefas: o backend recusa e pede um destino. Em vez de
      // só mostrar o erro, a tela oferece para onde mover.
      if (mensagem.includes("tarefa(s)")) {
        const outras = colunas.filter((c) => c.id !== coluna.id);
        const destino = prompt(
          `${mensagem}\n\nPara qual coluna? Digite o número:\n` +
            outras.map((c, i) => `${i + 1} — ${c.nome}`).join("\n"),
        );
        const escolhida = outras[Number(destino) - 1];
        if (!escolhida) return;
        try {
          await deleteColuna(projetoId, coluna.id, token, escolhida.id);
          await carregar();
          onMudou?.();
          return;
        } catch (err2) {
          setErro(err2 instanceof Error ? err2.message : "Erro ao excluir");
          return;
        }
      }
      setErro(mensagem);
    }
  }

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>Colunas do kanban</PageCardTitle>
        <PageButtonSm type="button" onClick={() => setEditando("nova")}>
          <Plus size={14} />
          Nova coluna
        </PageButtonSm>
      </PageCardHeader>
      <PageCardContent>
        {colunas.length === 0 ? (
          <EmptyText>Nenhuma coluna cadastrada.</EmptyText>
        ) : (
          colunas.map((coluna, indice) => {
            const tons = tonsDaColuna(coluna.cor);
            return (
              <ColunaLinha key={coluna.id}>
                <Reordenar>
                  <button
                    type="button"
                    aria-label="Mover para a esquerda"
                    disabled={indice === 0}
                    onClick={() => mover(indice, -1)}
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    type="button"
                    aria-label="Mover para a direita"
                    disabled={indice === colunas.length - 1}
                    onClick={() => mover(indice, 1)}
                  >
                    <ChevronDown size={13} />
                  </button>
                </Reordenar>

                <ColunaPreview $fundo={tons.fundo} $texto={tons.texto}>
                  <Amostra $cor={coluna.cor} />
                  {coluna.nome}
                </ColunaPreview>

                <ColunaNome>
                  {coluna.encerra_tarefa ? "encerra a tarefa" : "tarefa segue aberta"}
                </ColunaNome>

                <PageButtonSm type="button" $variant="ghost" onClick={() => setEditando(coluna)}>
                  Editar
                </PageButtonSm>
                <PageButtonSm
                  type="button"
                  $variant="ghost"
                  aria-label={`Excluir ${coluna.nome}`}
                  onClick={() => excluir(coluna)}
                >
                  <Trash2 size={14} />
                </PageButtonSm>
              </ColunaLinha>
            );
          })
        )}

        {erro && <FormErrorText>{erro}</FormErrorText>}
      </PageCardContent>

      {editando && token && (
        <ColunaModal
          projetoId={projetoId}
          coluna={editando === "nova" ? null : editando}
          token={token}
          onClose={() => setEditando(null)}
          onSalvo={async () => {
            setEditando(null);
            await carregar();
            onMudou?.();
          }}
        />
      )}
    </PageCard>
  );
}

function ColunaModal({
  projetoId,
  coluna,
  token,
  onClose,
  onSalvo,
}: {
  projetoId: number;
  coluna: ColunaTarefa | null;
  token: string;
  onClose: () => void;
  onSalvo: () => void;
}) {
  const [nome, setNome] = useState(coluna?.nome ?? "");
  const [cor, setCor] = useState(coluna?.cor ?? CORES_SUGERIDAS[0]);
  const [encerra, setEncerra] = useState(coluna?.encerra_tarefa ?? false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const tons = tonsDaColuna(cor);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro("");
    try {
      if (coluna) {
        await updateColuna(projetoId, coluna.id, { nome, cor, encerra_tarefa: encerra }, token);
      } else {
        await createColuna(projetoId, { nome, cor, encerra_tarefa: encerra }, token);
      }
      onSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar a coluna");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <WideModalContent onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="coluna-titulo">
        <ModalHeader>
          <ModalTitle id="coluna-titulo">{coluna ? "Editar coluna" : "Nova coluna"}</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>
        <form onSubmit={salvar}>
          <ModalBody>
            <FieldGroup>
              <FieldLabel htmlFor="coluna-nome">Nome</FieldLabel>
              <FieldInput
                id="coluna-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Em espera"
                required
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Cor</FieldLabel>
              <PaletaGrid>
                {CORES_SUGERIDAS.map((sugerida) => (
                  <AmostraBotao
                    key={sugerida}
                    type="button"
                    $cor={sugerida}
                    $ativa={sugerida.toUpperCase() === cor.toUpperCase()}
                    aria-label={`Cor ${sugerida}`}
                    onClick={() => setCor(sugerida)}
                  />
                ))}
                {/* A paleta é atalho, não limite: qualquer cor serve. */}
                <input
                  type="color"
                  value={cor}
                  aria-label="Escolher outra cor"
                  onChange={(e) => setCor(e.target.value.toUpperCase())}
                />
              </PaletaGrid>
              <ColunaPreview $fundo={tons.fundo} $texto={tons.texto}>
                <Amostra $cor={cor} />
                {nome || "Prévia da coluna"}
              </ColunaPreview>
            </FieldGroup>

            <FieldGroup>
              <CheckboxLabel>
                <input
                  type="checkbox"
                  checked={encerra}
                  onChange={(e) => setEncerra(e.target.checked)}
                />
                Tarefa nesta coluna está <strong>encerrada</strong>
              </CheckboxLabel>
              <EmptyText style={{ fontSize: "0.7rem" }}>
                Tarefas aqui deixam de contar como vencidas e saem do trabalho ativo no
                monitoramento.
                {coluna && " Mudar isto afeta as tarefas que já estão na coluna."}
              </EmptyText>
            </FieldGroup>

            {erro && <FormErrorText>{erro}</FormErrorText>}
          </ModalBody>
          <ModalFooter>
            <PageButton type="button" $variant="outline" onClick={onClose}>
              Cancelar
            </PageButton>
            <PageButton type="submit" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar"}
            </PageButton>
          </ModalFooter>
        </form>
      </WideModalContent>
    </ModalOverlay>
  );
}
