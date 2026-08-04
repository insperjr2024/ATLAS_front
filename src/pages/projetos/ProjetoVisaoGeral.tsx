import { useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  formatarData,
  marcarEntregaCliente,
  marcarKickoff,
  rotuloDiaSemana,
  updateEquipe,
} from "@/lib/projetos";
import {
  MemberPicker,
  montarEquipePayload,
  validarEquipe,
  type EquipeSelecionada,
} from "@/components/membros/MemberPicker";
import type { UsuarioResumo } from "@/types/auth";
import type { ProjetoCompleto } from "@/types/projeto";
import { pode } from "@/utils/permissoes";
import {
  PageStack,
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageButton,
  PageButtonSm,
  EmptyText,
} from "@/styles/page.styled";
import {
  FieldInput,
  FormErrorText,
  ModalOverlay,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
  WideModalContent,
  InfoGrid,
  DescricaoTexto,
  LinkExterno,
  DataRow,
  DataLabel,
  EquipeList,
  EquipeItem,
  PapelTag,
  EmBrevePanel,
} from "./Projetos.styled";
import { useProjeto } from "./ProjetoPage";

export function ProjetoVisaoGeral() {
  const { projeto, usuarios, recarregar } = useProjeto();
  const { usuario, token } = useAuth();
  const [editandoEquipe, setEditandoEquipe] = useState(false);

  const nomeUsuario = (id: number) => usuarios.find((u) => u.id === id)?.nome ?? `Usuário ${id}`;
  const podeEditarEquipe = pode(usuario, "editar_equipe");

  return (
    <PageStack>
      <InfoGrid>
        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Descrição</PageCardTitle>
            {projeto.link_proposta && (
              <LinkExterno href={projeto.link_proposta} target="_blank" rel="noreferrer">
                Abrir proposta
                <ExternalLink size={14} />
              </LinkExterno>
            )}
          </PageCardHeader>
          <PageCardContent>
            {projeto.descricao ? (
              <DescricaoTexto>{projeto.descricao}</DescricaoTexto>
            ) : (
              <EmptyText>Sem descrição cadastrada.</EmptyText>
            )}
          </PageCardContent>
        </PageCard>

        <PageCard>
          <PageCardHeader>
            <PageCardTitle>Equipe</PageCardTitle>
            {podeEditarEquipe && (
              <PageButtonSm type="button" $variant="outline" onClick={() => setEditandoEquipe(true)}>
                Editar equipe
              </PageButtonSm>
            )}
          </PageCardHeader>
          <PageCardContent>
            {projeto.equipe.length === 0 ? (
              <EmptyText>Nenhum membro alocado.</EmptyText>
            ) : (
              <EquipeList>
                {[...projeto.equipe]
                  .sort((a, b) => (a.papel === "coordenador" ? -1 : b.papel === "coordenador" ? 1 : 0))
                  .map((membro) => (
                    <EquipeItem key={`${membro.usuario_id}-${membro.entrou_em}`}>
                      <span>{nomeUsuario(membro.usuario_id)}</span>
                      <PapelTag $coordenador={membro.papel === "coordenador"}>
                        {membro.papel === "coordenador" ? "Coordenador(a)" : "Consultor(a)"}
                      </PapelTag>
                    </EquipeItem>
                  ))}
              </EquipeList>
            )}
          </PageCardContent>
        </PageCard>
      </InfoGrid>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Datas</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          <DataEditavel
            rotulo="Kickoff"
            valor={projeto.data_kickoff}
            projeto={projeto}
            token={token}
            recarregar={recarregar}
            tipo="kickoff"
          />
          <DataEditavel
            rotulo="Entrega ao cliente"
            valor={projeto.data_entrega_cliente}
            projeto={projeto}
            token={token}
            recarregar={recarregar}
            tipo="entrega"
          />
          <DataRow>
            <DataLabel>Dias de ambientação</DataLabel>
            <span>{projeto.dias_ambientacao} dias úteis</span>
          </DataRow>
          <DataRow>
            <DataLabel>Reunião semanal</DataLabel>
            <span>{rotuloDiaSemana(projeto.dia_reuniao_padrao)}</span>
          </DataRow>
        </PageCardContent>
      </PageCard>

      {/* A tabela de escopos vendidos (barra 6/15, banca, entrega) é a fatia
          F4 — precisa de `projeto_escopo` e da contagem de dias úteis. */}
      <EmBrevePanel>
        <h2>Escopos vendidos</h2>
        <p>
          A tabela com dias consumidos, banca e entrega por escopo entra junto com a contagem de dias
          úteis (F4).
        </p>
      </EmBrevePanel>

      {editandoEquipe && token && (
        <EditarEquipeModal
          projeto={projeto}
          usuarios={usuarios}
          token={token}
          onClose={() => setEditandoEquipe(false)}
          onSalvo={async () => {
            setEditandoEquipe(false);
            await recarregar();
          }}
        />
      )}
    </PageStack>
  );
}

/* ------------------------------------------------------------------ */

function DataEditavel({
  rotulo,
  valor,
  projeto,
  token,
  recarregar,
  tipo,
}: {
  rotulo: string;
  valor: string | null;
  projeto: ProjetoCompleto;
  token: string | null;
  recarregar: () => Promise<void>;
  tipo: "kickoff" | "entrega";
}) {
  const [editando, setEditando] = useState(false);
  const [data, setData] = useState(valor?.slice(0, 10) ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  // 🤖 O kickoff é o gatilho de Vendido → Ambientação, e o backend só aceita
  // a marcação enquanto o projeto está Vendido.
  const travado = tipo === "kickoff" && projeto.status !== "vendido";

  async function salvar() {
    if (!token || !data) return;
    setSalvando(true);
    setErro("");
    try {
      if (tipo === "kickoff") await marcarKickoff(projeto.id, data, token);
      else await marcarEntregaCliente(projeto.id, data, token);
      setEditando(false);
      await recarregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar a data");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <DataRow>
        <DataLabel>{rotulo}</DataLabel>
        {editando ? (
          <>
            <FieldInput
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              aria-label={rotulo}
            />
            <PageButtonSm type="button" disabled={salvando || !data} onClick={salvar}>
              {salvando ? "Salvando…" : "Salvar"}
            </PageButtonSm>
            <PageButtonSm
              type="button"
              $variant="ghost"
              onClick={() => {
                setEditando(false);
                setData(valor?.slice(0, 10) ?? "");
                setErro("");
              }}
            >
              Cancelar
            </PageButtonSm>
          </>
        ) : (
          <>
            <span>{formatarData(valor)}</span>
            {!travado && (
              <PageButtonSm type="button" $variant="ghost" onClick={() => setEditando(true)}>
                {valor ? "Alterar" : "Marcar"}
              </PageButtonSm>
            )}
          </>
        )}
      </DataRow>
      {erro && <FormErrorText>{erro}</FormErrorText>}
    </>
  );
}

/* ------------------------------------------------------------------ */

function EditarEquipeModal({
  projeto,
  usuarios,
  token,
  onClose,
  onSalvo,
}: {
  projeto: ProjetoCompleto;
  usuarios: UsuarioResumo[];
  token: string;
  onClose: () => void;
  onSalvo: () => Promise<void>;
}) {
  const [equipe, setEquipe] = useState<EquipeSelecionada>({
    coordenadorId: projeto.coordenador_id,
    consultorIds: projeto.consultor_ids,
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const ativos = usuarios
    .filter((u) => u.ativo)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    const problema = validarEquipe(equipe);
    if (problema) {
      setErro(problema);
      return;
    }
    setSalvando(true);
    setErro("");
    try {
      await updateEquipe(projeto.id, montarEquipePayload(equipe), token);
      await onSalvo();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar a equipe");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalOverlay onClick={onClose} role="presentation">
      <WideModalContent onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="equipe-titulo">
        <ModalHeader>
          <ModalTitle id="equipe-titulo">Editar equipe</ModalTitle>
          <ModalClose type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </ModalClose>
        </ModalHeader>
        <form onSubmit={handleSalvar}>
          <ModalBody>
            <MemberPicker
              usuarios={ativos}
              valor={equipe}
              onChange={setEquipe}
              desabilitado={salvando}
            />
            <EmptyText>
              Trocar alguém não apaga o passado: a linha antiga é fechada e uma nova é aberta, para o
              histórico de quem participou continuar de pé.
            </EmptyText>
            {erro && <FormErrorText>{erro}</FormErrorText>}
          </ModalBody>
          <ModalFooter>
            <PageButton type="button" $variant="outline" onClick={onClose}>
              Cancelar
            </PageButton>
            <PageButton type="submit" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar equipe"}
            </PageButton>
          </ModalFooter>
        </form>
      </WideModalContent>
    </ModalOverlay>
  );
}
