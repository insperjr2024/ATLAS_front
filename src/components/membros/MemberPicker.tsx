import { useState } from "react";
import { X } from "lucide-react";
import type { UsuarioResumo } from "@/types/auth";
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
 * A regra do coordenador (§6.3) numa função só, para o formulário de criação
 * e o modal de editar equipe dizerem exatamente a mesma coisa. O backend
 * revalida em `create_projeto.py` e `update_equipe_projeto.py`. Consultores
 * não têm mínimo nem máximo — o projeto pode até não ter nenhum.
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

  // A posição não restringe a escolha (o backend também não restringe), mas
  // mostrá-la evita colocar um consultor como coordenador por engano.
  const rotulo = (usuario: UsuarioResumo) =>
    `${usuario.nome} · ${ROTULO_POSICAO[usuario.posicao]}`;

  // Ninguém aparece duas vezes: quem já é coordenador ou já foi escolhido
  // como consultor sai da lista de opções.
  const disponiveisParaConsultor = usuarios.filter(
    (u) => u.id !== coordenadorId && !consultorIds.includes(u.id),
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
    // Promover alguém que já era consultor tira a pessoa da lista de baixo,
    // em vez de deixá-la nos dois lugares.
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
          <option value="">Selecione…</option>
          {usuarios.map((usuario) => (
            <option key={usuario.id} value={usuario.id}>
              {rotulo(usuario)}
            </option>
          ))}
        </FieldSelect>
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
              {disponiveisParaConsultor.length === 0 ? "Nenhum usuário disponível" : "Adicionar consultor…"}
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

        {consultorIds.length > 0 && (
          <CountHint $ok>
            {consultorIds.length} consultor{consultorIds.length > 1 ? "es" : ""} selecionado
            {consultorIds.length > 1 ? "s" : ""}
          </CountHint>
        )}
      </FieldGroup>
    </PickerStack>
  );
}
