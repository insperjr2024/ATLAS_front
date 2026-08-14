import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { formatarDataHora, getHistoricoProjeto, ROTULO_STATUS } from "@/lib/projetos";
import type { StatusProjeto } from "@/types/projeto";
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
} from "@/styles/modal.styled";
import { PageButton, PageLoadingBlock, ErrorText, EmptyText } from "@/styles/page.styled";
import {
  AcaoConteudo,
  AcaoDetalhe,
  AcaoDot,
  AcaoItem,
  AcaoLista,
  AcaoMeta,
  AcaoTitulo,
  HistModalSub,
} from "./Monitoramento.styled";

/** As últimas ações que o backend compõe em `/projetos/{id}/historico`: cada
 *  fonte (status, banca, entrega, reunião, ajuste) já chega com `titulo` e
 *  `detalhe` prontos, mais quem/quando. Aqui só lemos esse envelope comum. */
interface AcaoLinha {
  id: number | string;
  tipo: string;
  titulo?: string;
  detalhe?: string | null;
  alterado_em: string;
  alterado_por?: number | null;
  status_anterior?: StatusProjeto | null;
  status_novo?: StatusProjeto;
}

type CorAcao = "azul" | "roxo" | "ambar" | "verde" | "vermelho" | "neutro";

const COR_TIPO: Record<string, CorAcao> = {
  status: "azul",
  banca_realizada: "roxo",
  banca_remarcada: "roxo",
  entrega_alterada: "ambar",
  reuniao: "verde",
  justificativa_atraso: "vermelho",
  pedido_de_dias: "neutro",
  dias_de_ajuste: "neutro",
};

/** Só as mais recentes: o modal é um resumo, não a tela de histórico inteira
 *  (essa é o "Ver histórico completo" no rodapé). */
const LIMITE = 25;

/** A linha de status vem do backend com os status crus ("em_andamento"). Aqui
 *  a reescrevemos com os rótulos legíveis; as demais já vêm prontas. */
function tituloDe(l: AcaoLinha): string {
  if (l.tipo === "status" && l.status_novo) {
    const de = l.status_anterior ? ROTULO_STATUS[l.status_anterior] : "início";
    return `Status: ${de} → ${ROTULO_STATUS[l.status_novo]}`;
  }
  return l.titulo ?? "Ação registrada";
}

interface Props {
  projetoId: number;
  projetoNome: string;
  /** Resolve o id de quem fez a ação em nome — a aba já carrega os usuários. */
  nomeDoUsuario: (id: number) => string;
  onClose: () => void;
}

/**
 * As últimas ações de UM projeto, abertas a partir da linha do Histórico — sem
 * precisar entrar no projeto. Mostra o que o backend registra no nível do
 * projeto: mudanças de status, bancas realizadas/remarcadas, entregas,
 * reuniões com anotação e decisões de dias.
 *
 * ⚠ Movimentação de tarefa (mover card entre colunas) NÃO entra: o histórico
 * do projeto guarda o ciclo de vida e os marcos, não cada card do kanban —
 * isso viveria numa auditoria de tarefa, que ainda não existe.
 */
export function AcoesRecentesModal({ projetoId, projetoNome, nomeDoUsuario, onClose }: Props) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [linhas, setLinhas] = useState<AcaoLinha[] | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    getHistoricoProjeto(projetoId, token)
      .then((r) => {
        if (vivo) setLinhas(r as unknown as AcaoLinha[]);
      })
      .catch((e) => {
        if (vivo) setErro(e instanceof Error ? e.message : "Erro ao carregar as ações");
      });
    return () => {
      vivo = false;
    };
  }, [projetoId, token]);

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onClose]);

  const recentes = (linhas ?? []).slice(0, LIMITE);

  return (
    <ModalOverlay onMouseDown={onClose}>
      <ModalContent onMouseDown={(e) => e.stopPropagation()}>
        <ModalHeader>
          <div>
            <ModalTitle>Ações recentes</ModalTitle>
            <HistModalSub>{projetoNome}</HistModalSub>
          </div>
          <ModalClose type="button" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </ModalClose>
        </ModalHeader>

        <ModalBody>
          {erro ? (
            <ErrorText>{erro}</ErrorText>
          ) : linhas === null ? (
            <PageLoadingBlock />
          ) : recentes.length === 0 ? (
            <EmptyText>Nenhuma ação registrada neste projeto ainda.</EmptyText>
          ) : (
            <AcaoLista>
              {recentes.map((l) => (
                <AcaoItem key={l.id}>
                  <AcaoDot $cor={COR_TIPO[l.tipo] ?? "neutro"} aria-hidden="true" />
                  <AcaoConteudo>
                    <AcaoTitulo>{tituloDe(l)}</AcaoTitulo>
                    {l.detalhe && <AcaoDetalhe>{l.detalhe}</AcaoDetalhe>}
                    <AcaoMeta>
                      {l.alterado_por != null ? nomeDoUsuario(l.alterado_por) : "Automático"}
                      {" · "}
                      {formatarDataHora(l.alterado_em)}
                    </AcaoMeta>
                  </AcaoConteudo>
                </AcaoItem>
              ))}
            </AcaoLista>
          )}
        </ModalBody>

        <ModalFooter>
          <PageButton type="button" $variant="outline" onClick={onClose}>
            Fechar
          </PageButton>
          <PageButton
            type="button"
            onClick={() => {
              onClose();
              navigate(`/projetos/${projetoId}/historico`);
            }}
          >
            Ver histórico completo
          </PageButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
