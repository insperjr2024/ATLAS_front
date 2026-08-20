import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  renomearProjeto,
  updateCliente,
  updateDescricao,
  updateEquipe,
  updateFrentes,
  updateLinkProposta,
  updateMaxConsultores,
} from "@/lib/projetos";
import { getUsuariosFrentes } from "@/lib/usuarios-frentes";
import {
  MemberPicker,
  montarEquipePayload,
  validarEquipe,
  type EquipeSelecionada,
} from "@/components/membros/MemberPicker";
import { CompatibilidadeHorarios } from "@/components/grade/CompatibilidadeHorarios";
import { MultiSelect } from "@/components/MultiSelect";
import type { UsuarioFrente, UsuarioResumo } from "@/types/auth";
import type { ProjetoCompleto } from "@/types/projeto";
import type { Frente } from "@/types/banca";
import { PageButton } from "@/styles/page.styled";
import { FrenteLista, FrenteToggle } from "./ProjetoNovo.styled";
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
  const [cliente, setCliente] = useState(projeto.cliente ?? "");
  const [descricao, setDescricao] = useState(projeto.descricao ?? "");
  const [linkProposta, setLinkProposta] = useState(projeto.link_proposta ?? "");
  const [frenteIds, setFrenteIds] = useState(projeto.frente_ids);
  const [equipe, setEquipe] = useState<EquipeSelecionada>({
    coordenadorIds: projeto.coordenador_ids,
    consultorIds: projeto.consultor_ids,
  });
  // Separado da equipe de propósito: quem vendeu não é do time. Vender não
  // ocupa vaga de consultor nem entra na conta de capacidade.
  const [vendedorIds, setVendedorIds] = useState<number[]>(projeto.vendedor_ids ?? []);
  const [maxConsultores, setMaxConsultores] = useState(String(projeto.max_consultores));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [usuariosFrentes, setUsuariosFrentes] = useState<UsuarioFrente[]>([]);

  function toggleFrente(id: number) {
    setFrenteIds((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
    );
  }

  const frenteIdsMudaram =
    frenteIds.length !== projeto.frente_ids.length ||
    frenteIds.some((id) => !projeto.frente_ids.includes(id));

  useEffect(() => {
    getUsuariosFrentes(token).then(setUsuariosFrentes);
  }, [token]);

  const ativos = usuarios
    .filter((u) => u.ativo)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const equipeMudou =
    equipe.coordenadorIds.length !== projeto.coordenador_ids.length ||
    equipe.coordenadorIds.some((id) => !projeto.coordenador_ids.includes(id)) ||
    equipe.consultorIds.length !== projeto.consultor_ids.length ||
    equipe.consultorIds.some((id) => !projeto.consultor_ids.includes(id));

  const vendedoresAtuais = projeto.vendedor_ids ?? [];
  const vendedoresMudaram =
    vendedorIds.length !== vendedoresAtuais.length ||
    vendedorIds.some((id) => !vendedoresAtuais.includes(id));

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) {
      setErro("O nome do projeto não pode ficar vazio.");
      return;
    }
    if (frenteIds.length === 0) {
      setErro("Escolha pelo menos uma frente.");
      return;
    }
    const problema = equipeMudou ? validarEquipe(equipe) : null;
    if (problema) {
      setErro(problema);
      return;
    }
    const numeroTeto = Number(maxConsultores);
    if (!Number.isInteger(numeroTeto) || numeroTeto < 0 || numeroTeto > 20) {
      setErro("O teto de consultores precisa ser um número de 0 a 20.");
      return;
    }

    setSalvando(true);
    setErro("");
    try {
      if (nome.trim() !== projeto.nome) {
        await renomearProjeto(projeto.id, nome.trim(), token);
      }
      if (cliente.trim() !== (projeto.cliente ?? "")) {
        await updateCliente(projeto.id, cliente.trim(), token);
      }
      if (descricao !== (projeto.descricao ?? "")) {
        await updateDescricao(projeto.id, descricao, token);
      }
      if (linkProposta.trim() !== (projeto.link_proposta ?? "")) {
        await updateLinkProposta(projeto.id, linkProposta.trim(), token);
      }
      // Antes da equipe: se uma frente saiu, quem ela habilitava no
      // MemberPicker precisa já ter sumido da lista antes de a equipe ser
      // validada do lado do servidor.
      if (frenteIdsMudaram) {
        await updateFrentes(projeto.id, frenteIds, token);
      }
      // Antes da equipe: se o teto estiver baixando, o backend recusa a
      // equipe grande demais primeiro, e a pessoa corrige a ordem errada
      // sem entender por quê. Aqui o teto sempre vai primeiro.
      if (numeroTeto !== projeto.max_consultores) {
        await updateMaxConsultores(projeto.id, numeroTeto, token);
      }
      // A mesma rota grava os dois, mas `vendedor_ids` só vai quando mudou:
      // mandar sempre apagaria a lista de quem salvou só a equipe, e omitir
      // é o jeito de dizer "não mexa nos vendedores".
      if (equipeMudou || vendedoresMudaram) {
        await updateEquipe(
          projeto.id,
          montarEquipePayload(equipe),
          token,
          vendedoresMudaram ? vendedorIds : undefined,
        );
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
              <FieldLabel htmlFor="editar-cliente">Cliente</FieldLabel>
              <FieldInput
                id="editar-cliente"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                disabled={salvando}
                placeholder="Padaria do Zé"
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

            <FieldGroup>
              <FieldLabel htmlFor="editar-link-proposta">Link da proposta</FieldLabel>
              <FieldInput
                id="editar-link-proposta"
                value={linkProposta}
                onChange={(e) => setLinkProposta(e.target.value)}
                disabled={salvando}
                placeholder="https://…"
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel as="span">Frente(s)</FieldLabel>
              <FrenteLista>
                {frentes.map((frente) => {
                  const marcada = frenteIds.includes(frente.id);
                  return (
                    <FrenteToggle key={frente.id} $marcada={marcada}>
                      <input
                        type="checkbox"
                        checked={marcada}
                        disabled={salvando}
                        onChange={() => toggleFrente(frente.id)}
                      />
                      {frente.nome}
                    </FrenteToggle>
                  );
                })}
              </FrenteLista>
            </FieldGroup>

            <FieldGroup>
              <FieldLabel htmlFor="editar-max-consultores">Teto de consultores</FieldLabel>
              <FieldInput
                id="editar-max-consultores"
                type="number"
                min={0}
                max={20}
                value={maxConsultores}
                onChange={(e) => setMaxConsultores(e.target.value)}
                disabled={salvando}
              />
            </FieldGroup>

            <MemberPicker
              usuarios={ativos}
              valor={equipe}
              onChange={setEquipe}
              desabilitado={salvando}
              usuariosFrentes={usuariosFrentes}
              frentes={frentes}
              frenteIdsProjeto={frenteIds}
            />

            <FieldGroup>
              <FieldLabel htmlFor="vendedores">Quem vendeu o projeto</FieldLabel>
              <MultiSelect
                valores={vendedorIds.map(String)}
                onChange={(ids) => setVendedorIds(ids.map(Number))}
                opcoes={ativos.map((u) => ({ value: String(u.id), label: u.nome }))}
                rotuloVazio="Ninguém marcado"
                resumo={(n) => `${n} vendedores`}
                aria-label="Quem vendeu o projeto"
              />
            </FieldGroup>

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
