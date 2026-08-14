import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { renomearProjeto, updateDescricao, updateEquipe } from "@/lib/projetos";
import { getUsuariosFrentes } from "@/lib/usuarios-frentes";
import {
  MemberPicker,
  montarEquipePayload,
  validarEquipe,
  type EquipeSelecionada,
} from "@/components/membros/MemberPicker";
import { CompatibilidadeHorarios } from "@/components/grade/CompatibilidadeHorarios";
import type { UsuarioFrente, UsuarioResumo } from "@/types/auth";
import type { ProjetoCompleto } from "@/types/projeto";
import type { Frente } from "@/types/banca";
import { PageButton } from "@/styles/page.styled";
import {
  FieldGroup,
  FieldInput,
  FieldLabel,
  FieldTextarea,
  FormErrorText,
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  WideModalContent,
} from "./Projetos.styled";

interface Props {
  projeto: ProjetoCompleto;
  usuarios: UsuarioResumo[];
  frentes: Frente[];
  token: string;
  onClose: () => void;
  onSalvo: () => Promise<void>;
}

/**
 * ⭐ **Um lugar só para editar o contexto do projeto**: nome, descrição e
 * equipe.
 *
 * ⚠ **O que ele substitui.** Os três campos moravam em lugares diferentes e
 * cada um tinha o próprio botão: um lápis ao lado do nome no cabeçalho, um
 * "Editar" no card de Descrição e um "Editar equipe" no card de Equipe. Três
 * afordâncias para a mesma ideia — "corrigir o cadastro deste projeto" — e o
 * cabeçalho ficava coberto de botões que ninguém usa no dia a dia.
 *
 * 📐 **Salva campo a campo, e só o que mudou.** São três endpoints distintos
 * (`renomearProjeto`, `updateDescricao`, `updateEquipe`), e mandar os três
 * sempre gravaria histórico de alteração de equipe para quem só corrigiu uma
 * vírgula na descrição.
 *
 * ⚠ A equipe é a parte cara: se ela falhar depois de o nome ter ido, o modal
 * fica aberto com o erro e o que já passou está gravado. É melhor do que
 * fingir atomicidade que a API não oferece — a pessoa vê o que faltou e tenta
 * de novo só aquilo.
 */
export function EditarProjetoModal({
  projeto,
  usuarios,
  frentes,
  token,
  onClose,
  onSalvo,
}: Props) {
  const [nome, setNome] = useState(projeto.nome);
  const [descricao, setDescricao] = useState(projeto.descricao ?? "");
  const [equipe, setEquipe] = useState<EquipeSelecionada>({
    coordenadorId: projeto.coordenador_id,
    consultorIds: projeto.consultor_ids,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [usuariosFrentes, setUsuariosFrentes] = useState<UsuarioFrente[]>([]);

  useEffect(() => {
    getUsuariosFrentes(token).then(setUsuariosFrentes);
  }, [token]);

  const ativos = usuarios
    .filter((u) => u.ativo)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const equipeMudou =
    equipe.coordenadorId !== projeto.coordenador_id ||
    equipe.consultorIds.length !== projeto.consultor_ids.length ||
    equipe.consultorIds.some((id) => !projeto.consultor_ids.includes(id));

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setErro("O nome do projeto não pode ficar vazio.");
      return;
    }
    const problema = equipeMudou ? validarEquipe(equipe) : null;
    if (problema) {
      setErro(problema);
      return;
    }

    setSalvando(true);
    setErro("");
    try {
      if (nome.trim() !== projeto.nome) {
        await renomearProjeto(projeto.id, nome.trim(), token);
      }
      if (descricao !== (projeto.descricao ?? "")) {
        await updateDescricao(projeto.id, descricao, token);
      }
      if (equipeMudou) {
        await updateEquipe(projeto.id, montarEquipePayload(equipe), token);
      }
      await onSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <WideModalContent
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="editar-projeto-titulo"
      >
        <ModalHeader>
          <ModalTitle id="editar-projeto-titulo">Editar projeto</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>
        <form onSubmit={handleSalvar}>
          <ModalBody>
            <FieldGroup>
              <FieldLabel htmlFor="editar-nome">Nome do projeto</FieldLabel>
              <FieldInput
                id="editar-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={salvando}
                autoFocus
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="editar-descricao">Descrição</FieldLabel>
              <FieldTextarea
                id="editar-descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
                disabled={salvando}
                placeholder="Do que se trata este projeto?"
              />
            </FieldGroup>

            <MemberPicker
              usuarios={ativos}
              valor={equipe}
              onChange={setEquipe}
              desabilitado={salvando}
              usuariosFrentes={usuariosFrentes}
              frentes={frentes}
              frenteIdsProjeto={projeto.frente_ids}
            />

            {/* Mesma leitura de quando o projeto nasceu: trocar alguém pode
                fechar a única janela em que o time se reunia. */}
            <CompatibilidadeHorarios consultorIds={equipe.consultorIds} usuarios={ativos} />

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
