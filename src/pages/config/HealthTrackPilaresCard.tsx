import { useEffect, useState, type FormEvent } from "react";
import styled from "styled-components";
import { ArrowDown, ArrowUp } from "lucide-react";
import { theme } from "@/styles/theme";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { ehDiretoriaDeProjetos } from "@/utils/permissoes";
import { criarPilar, editarPilar, getPilares, type Pilar } from "@/lib/health-track";
import {
  EmptyText,
  ErrorText,
  PageBadge,
  PageButton,
  PageButtonSm,
  PageCard,
  PageCardContent,
  PageCardHeader,
  PageCardTitle,
} from "@/styles/page.styled";

const Lista = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
`;

const Item = styled.li<{ $inativo: boolean }>`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: ${theme.spacing.sm};
  align-items: start;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.lg};
  opacity: ${({ $inativo }) => ($inativo ? 0.6 : 1)};

  @media (max-width: ${theme.breakpoints.sm - 1}px) {
    grid-template-columns: auto minmax(0, 1fr);
  }
`;

const Setas = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;

  button {
    display: flex;
    padding: 0.15rem;
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.sm};
    background: ${theme.colors.card};
    color: ${theme.colors.mutedForeground};
    cursor: pointer;

    &:disabled {
      opacity: 0.35;
      cursor: default;
    }

    svg {
      width: 0.9rem;
      height: 0.9rem;
    }
  }
`;

const Campos = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;

  input + input {
    font-size: ${theme.fontSize.sm};
  }
`;

const Nome = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-weight: ${theme.fontWeight.medium};
`;

const Descricao = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;

const Acoes = styled.div`
  display: flex;
  gap: ${theme.spacing.xs};
  flex-wrap: wrap;
  justify-content: flex-end;
`;

const Novo = styled.form`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) auto;
  gap: ${theme.spacing.sm};
  align-items: center;
  margin-top: ${theme.spacing.md};

  @media (max-width: ${theme.breakpoints.sm - 1}px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/**
 * Os pilares do Health Track como configuração (§18): nome, descrição, ordem
 * e ativar/desativar. Só a diretoria de projetos edita; quem mais abre
 * Configurações só lê.
 *
 * Desativar não apaga: o pilar some do preenchimento e do mapa, mas o
 * histórico dele continua existindo. Reativar devolve. Por isso não há
 * botão de excluir.
 */
export function HealthTrackPilaresCard() {
  const { token, usuario } = useAuth();
  const podeEditar = ehDiretoriaDeProjetos(usuario);
  const [pilares, setPilares] = useState<Pilar[] | null>(null);
  const [erro, setErro] = useState("");
  const [editando, setEditando] = useState<number | null>(null);
  const [rascunho, setRascunho] = useState({ nome: "", descricao: "" });
  const [novo, setNovo] = useState({ nome: "", descricao: "" });
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    getPilares(token, true)
      .then((p) => vivo && setPilares(p))
      .catch((err) => vivo && setErro(err instanceof Error ? err.message : "Erro ao carregar os pilares"));
    return () => {
      vivo = false;
    };
  }, [token]);

  async function recarregar() {
    if (!token) return;
    setPilares(await getPilares(token, true));
  }

  async function executar(acao: () => Promise<unknown>) {
    if (!token) return;
    setOcupado(true);
    setErro("");
    try {
      await acao();
      await recarregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar");
    } finally {
      setOcupado(false);
    }
  }

  function comecarEdicao(p: Pilar) {
    setEditando(p.id);
    setRascunho({ nome: p.nome, descricao: p.descricao ?? "" });
  }

  async function salvarEdicao(p: Pilar) {
    await executar(() =>
      editarPilar(p.id, { nome: rascunho.nome.trim(), descricao: rascunho.descricao.trim() || null }, token!),
    );
    setEditando(null);
  }

  /** Troca a ordem com o vizinho; só entre os ativos, que é onde a ordem aparece. */
  async function mover(p: Pilar, direcao: -1 | 1) {
    if (!pilares) return;
    const ativos = pilares.filter((x) => x.ativo);
    const i = ativos.findIndex((x) => x.id === p.id);
    const vizinho = ativos[i + direcao];
    if (!vizinho) return;
    // Posições novas explícitas (0, 1, 2...) em vez de trocar os valores
    // gravados: dois pilares com a mesma ordem herdada da migration trocariam
    // valores iguais e nada mudaria.
    const nova = ativos.map((x) => x.id);
    nova[i] = vizinho.id;
    nova[i + direcao] = p.id;
    await executar(() => Promise.all(nova.map((id, ordem) => editarPilar(id, { ordem }, token!))));
  }

  async function criar(e: FormEvent) {
    e.preventDefault();
    if (!novo.nome.trim()) return;
    await executar(() => criarPilar({ nome: novo.nome.trim(), descricao: novo.descricao.trim() || null }, token!));
    setNovo({ nome: "", descricao: "" });
  }

  const ativos = pilares?.filter((p) => p.ativo) ?? [];

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>Pilares do Health Track</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        <Descricao style={{ marginBottom: theme.spacing.md }}>
          O que cada projeto é avaliado. A ordem aqui é a ordem no preenchimento e no mapa. Desativar tira o pilar das
          próximas avaliações sem apagar o histórico.
        </Descricao>
        {erro && <ErrorText>{erro}</ErrorText>}
        {pilares === null ? (
          <EmptyText>Carregando…</EmptyText>
        ) : pilares.length === 0 ? (
          <EmptyText>Nenhum pilar cadastrado.</EmptyText>
        ) : (
          <Lista>
            {pilares.map((p) => {
              const posicao = ativos.findIndex((x) => x.id === p.id);
              return (
                <Item key={p.id} $inativo={!p.ativo}>
                  <Setas>
                    <button
                      type="button"
                      aria-label={`Subir ${p.nome}`}
                      disabled={!podeEditar || ocupado || !p.ativo || posicao <= 0}
                      onClick={() => mover(p, -1)}
                    >
                      <ArrowUp aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Descer ${p.nome}`}
                      disabled={!podeEditar || ocupado || !p.ativo || posicao === ativos.length - 1}
                      onClick={() => mover(p, 1)}
                    >
                      <ArrowDown aria-hidden="true" />
                    </button>
                  </Setas>
                  {editando === p.id ? (
                    <Campos>
                      <Input
                        value={rascunho.nome}
                        onChange={(e) => setRascunho((r) => ({ ...r, nome: e.target.value }))}
                        maxLength={60}
                        aria-label="Nome do pilar"
                      />
                      <Input
                        value={rascunho.descricao}
                        onChange={(e) => setRascunho((r) => ({ ...r, descricao: e.target.value }))}
                        placeholder="Descrição (o que este pilar avalia)"
                        aria-label="Descrição do pilar"
                      />
                    </Campos>
                  ) : (
                    <div>
                      <Nome>
                        {p.nome}
                        {!p.ativo && <PageBadge $tone="muted">Desativado</PageBadge>}
                      </Nome>
                      {p.descricao && <Descricao>{p.descricao}</Descricao>}
                    </div>
                  )}
                  {podeEditar && (
                    <Acoes>
                      {editando === p.id ? (
                        <>
                          <PageButtonSm type="button" onClick={() => salvarEdicao(p)} disabled={ocupado || !rascunho.nome.trim()}>
                            Salvar
                          </PageButtonSm>
                          <PageButtonSm type="button" $variant="ghost" onClick={() => setEditando(null)} disabled={ocupado}>
                            Cancelar
                          </PageButtonSm>
                        </>
                      ) : (
                        <>
                          <PageButtonSm type="button" $variant="outline" onClick={() => comecarEdicao(p)} disabled={ocupado}>
                            Editar
                          </PageButtonSm>
                          <PageButtonSm
                            type="button"
                            $variant="ghost"
                            onClick={() => executar(() => editarPilar(p.id, { ativo: !p.ativo }, token!))}
                            disabled={ocupado}
                          >
                            {p.ativo ? "Desativar" : "Reativar"}
                          </PageButtonSm>
                        </>
                      )}
                    </Acoes>
                  )}
                </Item>
              );
            })}
          </Lista>
        )}

        {podeEditar && (
          <Novo onSubmit={criar}>
            <Input
              value={novo.nome}
              onChange={(e) => setNovo((n) => ({ ...n, nome: e.target.value }))}
              placeholder="Novo pilar"
              maxLength={60}
              aria-label="Nome do novo pilar"
            />
            <Input
              value={novo.descricao}
              onChange={(e) => setNovo((n) => ({ ...n, descricao: e.target.value }))}
              placeholder="Descrição (opcional)"
              aria-label="Descrição do novo pilar"
            />
            <PageButton type="submit" $variant="outline" disabled={ocupado || !novo.nome.trim()}>
              Adicionar
            </PageButton>
          </Novo>
        )}
      </PageCardContent>
    </PageCard>
  );
}
