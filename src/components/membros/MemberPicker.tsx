import { useState } from "react";
import { X } from "lucide-react";
import type { Posicao, UsuarioResumo } from "@/types/auth";
import type { MembroEquipePayload } from "@/types/projeto";
import { ROTULO_POSICAO } from "@/utils/permissoes";
import { PageButtonSm } from "@/styles/page.styled";
import { FieldGroup, FieldLabel, Required, FieldSelect } from "@/pages/Bancas.styled";
import { AddRow, Chip, ChipRemove, ChipRow, CountHint, PickerStack } from "./MemberPicker.styled";

export interface EquipeSelecionada {
  coordenadorId: number | null;
  consultorIds: number[];
}

/**
 * Cada papel do projeto (§6.3) só é ocupado por quem tem a posição
 * correspondente (§3): coordenador coordena, consultor consulta. Diretoria e
 * gerência acompanham pelo recorte de visão, sem ocupar vaga na equipe.
 * Espelha `POSICAO_EXIGIDA_POR_PAPEL` de `src/utils/validacao_equipe.py`.
 */
export const POSICAO_COORDENADOR: Posicao = "coordenador";
export const POSICAO_CONSULTOR: Posicao = "consultor";

/**
 * A regra do coordenador (§6.3) numa função só, para o formulário de criação
 * e o modal de editar equipe dizerem exatamente a mesma coisa. O backend
 * revalida em `create_projeto.py` e `update_equipe_projeto.py`. Consultores
 * não têm mínimo nem máximo — o projeto pode até não ter nenhum.
 *
 * Ninguém tem limite de projetos: a mesma pessoa pode coordenar (ou consultar)
 * vários ao mesmo tempo, por isso não há checagem contra outros projetos.
 */
export function validarEquipe({ coordenadorId, consultorIds }: EquipeSelecionada): string | null {
  if (!coordenadorId) return "Escolha o coordenador do projeto.";
  if (consultorIds.includes(coordenadorId)) {
    return "O coordenador não pode ser também consultor do mesmo projeto.";
  }
  return null;
}

export function montarEquipePayload({
  coordenadorId,
  consultorIds,
}: EquipeSelecionada): MembroEquipePayload[] {
  return [
    ...(coordenadorId ? [{ usuario_id: coordenadorId, papel: "coordenador" as const }] : []),
    ...consultorIds.map((id) => ({ usuario_id: id, papel: "consultor" as const })),
  ];
}

interface MemberPickerProps {
  usuarios: UsuarioResumo[];
  valor: EquipeSelecionada;
  onChange: (valor: EquipeSelecionada) => void;
  desabilitado?: boolean;
}

export function MemberPicker({ usuarios, valor, onChange, desabilitado }: MemberPickerProps) {
  const [consultorPendente, setConsultorPendente] = useState("");

  const nomePorId = new Map(usuarios.map((u) => [u.id, u.nome]));
  const { coordenadorId, consultorIds } = valor;

  // A carga atual entra no rótulo para a alocação ser decidida sem sair da
  // tela — 3+ projetos é o limiar de gargalo do §7.3.
  const rotulo = (usuario: UsuarioResumo) => {
    const total = usuario.projetos_alocados;
    const carga =
      total === 0 ? "livre" : `${total} projeto${total > 1 ? "s" : ""}${total >= 3 ? " ⚠" : ""}`;
    return `${usuario.nome} · ${ROTULO_POSICAO[usuario.posicao]} · ${carga}`;
  };

  // O backend recusa quem não tem a posição do papel, então nem oferecemos:
  // diretoria e gerência não aparecem em nenhuma das duas listas.
  const elegiveisCoordenador = usuarios.filter((u) => u.posicao === POSICAO_COORDENADOR);

  // Ninguém aparece duas vezes: quem já foi escolhido como consultor sai da
  // lista de opções.
  const disponiveisParaConsultor = usuarios.filter(
    (u) => u.posicao === POSICAO_CONSULTOR && !consultorIds.includes(u.id),
  );

  function adicionarConsultor() {
    const id = Number(consultorPendente);
    if (!id || consultorIds.includes(id)) return;
    onChange({ coordenadorId, consultorIds: [...consultorIds, id] });
    setConsultorPendente("");
  }

  function removerConsultor(id: number) {
    onChange({ coordenadorId, consultorIds: consultorIds.filter((x) => x !== id) });
  }

  function trocarCoordenador(novoId: number | null) {
    // As duas listas são disjuntas por posição, mas equipes salvas antes desta
    // regra podem ter a mesma pessoa nos dois papéis — tira da lista de baixo.
    onChange({
      coordenadorId: novoId,
      consultorIds: novoId ? consultorIds.filter((x) => x !== novoId) : consultorIds,
    });
  }

  return (
    <PickerStack>
      <FieldGroup>
        <FieldLabel htmlFor="equipe-coordenador">
          Coordenador<Required>*</Required>
        </FieldLabel>
        <FieldSelect
          id="equipe-coordenador"
          value={coordenadorId ? String(coordenadorId) : ""}
          disabled={desabilitado}
          onChange={(e) => trocarCoordenador(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">
            {elegiveisCoordenador.length === 0 ? "Nenhum coordenador cadastrado" : "Selecione…"}
          </option>
          {elegiveisCoordenador.map((usuario) => (
            <option key={usuario.id} value={usuario.id}>
              {rotulo(usuario)}
            </option>
          ))}
        </FieldSelect>
        <CountHint $ok>
          Só quem tem a posição Coordenador(a) aparece aqui, com os projetos em que já está
          alocado(a). A mesma pessoa pode coordenar vários.
        </CountHint>
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="equipe-consultor">Consultores</FieldLabel>
        <ChipRow>
          {consultorIds.length === 0 && (
            <CountHint $ok>Nenhum consultor escolhido ainda.</CountHint>
          )}
          {consultorIds.map((id) => (
            <Chip key={id}>
              {nomePorId.get(id) ?? `Usuário ${id}`}
              <ChipRemove
                type="button"
                aria-label={`Remover ${nomePorId.get(id) ?? id}`}
                disabled={desabilitado}
                onClick={() => removerConsultor(id)}
              >
                <X size={14} />
              </ChipRemove>
            </Chip>
          ))}
        </ChipRow>

        <AddRow>
          <FieldSelect
            id="equipe-consultor"
            value={consultorPendente}
            disabled={desabilitado || disponiveisParaConsultor.length === 0}
            onChange={(e) => setConsultorPendente(e.target.value)}
          >
            <option value="">
              {disponiveisParaConsultor.length === 0
                ? "Nenhum consultor disponível"
                : "Adicionar consultor…"}
            </option>
            {disponiveisParaConsultor.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {rotulo(usuario)}
              </option>
            ))}
          </FieldSelect>
          <PageButtonSm
            type="button"
            $variant="outline"
            disabled={desabilitado || !consultorPendente}
            onClick={adicionarConsultor}
          >
            Adicionar
          </PageButtonSm>
        </AddRow>

        <CountHint $ok>
          {consultorIds.length > 0 && (
            <>
              {consultorIds.length} consultor{consultorIds.length > 1 ? "es" : ""} selecionado
              {consultorIds.length > 1 ? "s" : ""} ·{" "}
            </>
          )}
          Só quem tem a posição Consultor(a) aparece aqui, com os projetos em que já está
          alocado(a). A mesma pessoa pode atuar em vários.
        </CountHint>
      </FieldGroup>
    </PickerStack>
  );
}
