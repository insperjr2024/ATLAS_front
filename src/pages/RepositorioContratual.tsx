import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { baixarArquivoDocumento, getRepositorio } from "@/lib/contratos";
import type { ItemRepositorioContratual } from "@/types/contratos";
import {
  PageStack,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageButtonSm,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
  EmptyText,
} from "@/styles/page.styled";
import { FieldInput } from "./Bancas.styled";
import { AcoesLinha, DocumentoLista, DocumentoLinha, DocumentoTipo, DocumentoMeta } from "./projetos/ProjetoContratos.styled";

/**
 * ⭐ 2026-09-18 — o Repositório: todo documento jurídico final assinado, de
 * qualquer projeto, organizado por gestão. Porta as telas `Repositorio.tsx`/
 * `RepositorioProjeto.tsx` do sistema antigo. Gate: `pode_ver_repositorio_
 * contratos` (`AdminRoute` no `App.tsx`).
 */
export function RepositorioContratual() {
  const { token } = useAuth();
  const [itens, setItens] = useState<ItemRepositorioContratual[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [baixando, setBaixando] = useState<string | null>(null);

  async function carregar(filtroBusca?: string) {
    if (!token) return;
    setErro("");
    try {
      const { itens: lista } = await getRepositorio({ busca: filtroBusca || undefined }, token);
      setItens(lista);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar o repositório");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleBaixar(item: ItemRepositorioContratual, formato: "pdf" | "docx") {
    if (!token) return;
    const chave = `${item.id}-${formato}`;
    setBaixando(chave);
    try {
      await baixarArquivoDocumento(item.id, formato, `${item.tipo}_${item.projeto_nome}.${formato}`, token);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao baixar arquivo");
    } finally {
      setBaixando(null);
    }
  }

  if (carregando) return <PageLoadingBlock />;

  return (
    <PageStack>
      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Repositório de Contratos</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          {erro && (
            <ErrorBlock>
              <ErrorText>{erro}</ErrorText>
            </ErrorBlock>
          )}

          <FieldInput
            placeholder="Buscar por projeto ou cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && carregar(busca)}
            style={{ marginBottom: "1rem" }}
          />

          {itens.length === 0 ? (
            <EmptyText>Nenhum documento arquivado ainda.</EmptyText>
          ) : (
            <DocumentoLista>
              {itens.map((item) => (
                <DocumentoLinha key={item.id} as="div">
                  <div>
                    <DocumentoTipo>{item.projeto_nome}</DocumentoTipo>
                    <DocumentoMeta>
                      {item.tipo_rotulo}
                      {item.cliente && ` · ${item.cliente}`}
                      {item.gestao_nome && ` · ${item.gestao_nome}`}
                    </DocumentoMeta>
                  </div>
                  <AcoesLinha>
                    <PageButtonSm
                      type="button"
                      $variant="outline"
                      disabled={baixando === `${item.id}-pdf`}
                      onClick={() => handleBaixar(item, "pdf")}
                    >
                      {baixando === `${item.id}-pdf` ? "Baixando..." : "PDF"}
                    </PageButtonSm>
                    <PageButtonSm
                      type="button"
                      $variant="outline"
                      disabled={baixando === `${item.id}-docx`}
                      onClick={() => handleBaixar(item, "docx")}
                    >
                      {baixando === `${item.id}-docx` ? "Baixando..." : ".docx"}
                    </PageButtonSm>
                  </AcoesLinha>
                </DocumentoLinha>
              ))}
            </DocumentoLista>
          )}
        </PageCardContent>
      </PageCard>
    </PageStack>
  );
}
