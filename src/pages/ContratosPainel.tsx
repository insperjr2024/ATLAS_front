import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getPainelContratual } from "@/lib/contratos";
import type { ItemPainelContratual } from "@/types/contratos";
import { ROTULO_STATUS_DOCUMENTO } from "@/types/contratos";
import {
  PageStack,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageButton,
  PageBadge,
  PageLoadingBlock,
  ErrorBlock,
  ErrorText,
  EmptyText,
} from "@/styles/page.styled";
import { AcoesLinha, DocumentoLista, DocumentoLinha, DocumentoTipo, DocumentoMeta } from "./projetos/ProjetoContratos.styled";

function tomDoStatus(status: ItemPainelContratual["status"]): "default" | "success" | "muted" | "warning" | "danger" {
  if (status === "aprovado_pelo_cliente") return "success";
  if (status === "alteracao_solicitada") return "warning";
  if (status === "aguardando_preenchimento") return "muted";
  return "default";
}

/**
 * ⭐ 2026-09-21 — a pedido: a aba Contratos, fila de trabalho cross-projeto
 * (diferente do Repositório, que é só arquivado). Cada linha abre a MESMA
 * tela de documento que já existe dentro do projeto — este painel só junta
 * tudo num lugar só, pra quem cuida de contrato não precisar abrir projeto
 * por projeto pra achar o que está esperando aprovação. O recorte de quem
 * vê qual linha já vem filtrado do backend (`GET /contratos-painel`).
 */
export function ContratosPainel() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [itens, setItens] = useState<ItemPainelContratual[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!token) return;
    getPainelContratual(token)
      .then(({ itens: lista }) => setItens(lista))
      .catch((err) => setErro(err instanceof Error ? err.message : "Erro ao carregar"))
      .finally(() => setCarregando(false));
  }, [token]);

  if (carregando) return <PageLoadingBlock />;

  const ordenados = [...itens].sort((a, b) => b.atualizado_em.localeCompare(a.atualizado_em));

  return (
    <PageStack>
      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Contratos</PageCardTitle>
          <PageButton type="button" onClick={() => navigate("/projetos/novo")}>
            + Novo projeto
          </PageButton>
        </PageCardHeader>
        <PageCardContent>
          <p style={{ marginTop: 0, fontSize: "0.85rem", color: "var(--muted-foreground, inherit)" }}>
            Todo documento jurídico em andamento — o que está esperando aprovação, o que já foi
            mandado pro cliente. Documento assinado e arquivado fica no Repositório.
          </p>

          {erro && (
            <ErrorBlock>
              <ErrorText>{erro}</ErrorText>
            </ErrorBlock>
          )}

          {ordenados.length === 0 ? (
            <EmptyText>Nenhum documento em andamento.</EmptyText>
          ) : (
            <DocumentoLista>
              {ordenados.map((item) => (
                <DocumentoLinha
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/projetos/${item.projeto_id}/contratos/${item.id}`)}
                >
                  <div>
                    <DocumentoTipo>{item.projeto_nome}</DocumentoTipo>
                    <DocumentoMeta>
                      {item.tipo_rotulo}
                      {item.cliente && ` · ${item.cliente}`}
                    </DocumentoMeta>
                  </div>
                  <AcoesLinha>
                    {!!item.ultima_versao && <span>v{item.ultima_versao}</span>}
                    <PageBadge $tone={tomDoStatus(item.status)}>{ROTULO_STATUS_DOCUMENTO[item.status]}</PageBadge>
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
