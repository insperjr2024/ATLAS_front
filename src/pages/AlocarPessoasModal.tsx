import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { alocarUsuario } from "@/lib/bancas";
import type { Banca, Candidatura, EquipeProjeto } from "@/types/banca";
import type { UsuarioResumo } from "@/types/auth";
import {
  ModalBody,
  ModalClose,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalTitle,
} from "@/styles/modal.styled";
import { PageBadge, PageButton, PageButtonSm, EmptyText } from "@/styles/page.styled";
import { FormErrorText } from "./Bancas.styled";
import { ListScrollWrap, LIST_MAX_VISIVEIS } from "@/styles/shared.styled";
import { BancaAcoes, BancaInfo, BancaLinha, BancaMeta, BancaNome } from "./Bancas.styled";

interface Props {
  banca: Banca;
  usuarios: UsuarioResumo[];
  /** TODAS as candidaturas do sistema, é delas que sai a carga de cada um. */
  candidaturas: Candidatura[];
  /** A equipe do projeto desta banca: não pode assistir à própria. */
  equipes: EquipeProjeto[];
  token: string;
  onFechar: () => void;
  onAlocou: () => Promise<void>;
}

/**
 * Alocar gente numa banca à mão.
 *
 * A ordem é por CARGA CRESCENTE: quem está em menos bancas aparece
 * primeiro. É o mesmo espírito do rodízio automático, distribuir o trabalho —
 * mas aqui a diretoria decide caso a caso, em vez de esperar a janela de uma
 * semana do push.
 */
export function AlocarPessoasModal({
  banca,
  usuarios,
  candidaturas,
  equipes,
  token,
  onFechar,
  onAlocou,
}: Props) {
  const [salvando, setSalvando] = useState<number | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  const disponiveis = useMemo(() => {
    const jaNaBanca = new Set(
      candidaturas.filter((c) => c.banca_id === banca.id).map((c) => c.usuario_id),
    );
    // A equipe que apresenta não assiste à própria banca.
    const daEquipe = new Set(
      equipes.filter((e) => e.banca_id === banca.id).map((e) => e.usuario_id),
    );

    const carga = new Map<number, number>();
    for (const c of candidaturas) {
      carga.set(c.usuario_id, (carga.get(c.usuario_id) ?? 0) + 1);
    }

    return usuarios
      .filter((u) => !jaNaBanca.has(u.id) && !daEquipe.has(u.id))
      .map((u) => ({ usuario: u, bancas: carga.get(u.id) ?? 0 }))
      .sort((a, b) => a.bancas - b.bancas || a.usuario.nome.localeCompare(b.usuario.nome));
  }, [usuarios, candidaturas, equipes, banca.id]);

  async function alocar(usuarioId: number) {
    setErro("");
    setSalvando(usuarioId);
    try {
      await alocarUsuario(banca.id, usuarioId, token);
      await onAlocou();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao alocar");
    } finally {
      setSalvando(null);
    }
  }

  return (
    <ModalOverlay onMouseDown={onFechar}>
      <ModalContent onMouseDown={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Alocar pessoas · {banca.nome_projeto}</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onFechar}>
            <X size={16} />
          </ModalClose>
        </ModalHeader>

        <ModalBody>
          <p style={{ marginTop: 0, fontSize: "0.875rem" }}>
            {banca.alocados} alocados · mínimo {banca.piso_minimo} · cabem {banca.vagas}.
          </p>

          {erro && <FormErrorText>{erro}</FormErrorText>}

          {disponiveis.length === 0 ? (
            <EmptyText>Todo mundo já está nesta banca ou é da equipe do projeto.</EmptyText>
          ) : (
            <ListScrollWrap $scrollable={disponiveis.length > LIST_MAX_VISIVEIS}>
              {disponiveis.map(({ usuario, bancas }) => (
                <BancaLinha key={usuario.id}>
                  <BancaInfo>
                    <BancaNome>{usuario.nome}</BancaNome>
                    <BancaMeta>
                      {bancas === 0
                        ? "nenhuma banca ainda"
                        : `${bancas} banca${bancas > 1 ? "s" : ""}`}
                    </BancaMeta>
                  </BancaInfo>
                  <BancaAcoes>
                    {bancas === 0 && <PageBadge $tone="success">Sem carga</PageBadge>}
                    <PageButtonSm
                      type="button"
                      disabled={salvando != null}
                      onClick={() => alocar(usuario.id)}
                    >
                      {salvando === usuario.id ? "Alocando…" : "Alocar"}
                    </PageButtonSm>
                  </BancaAcoes>
                </BancaLinha>
              ))}
            </ListScrollWrap>
          )}
        </ModalBody>

        <ModalFooter>
          <PageButton type="button" $variant="outline" onClick={onFechar}>
            Fechar
          </PageButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
}
