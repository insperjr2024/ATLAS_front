import { useState } from "react";
import { X } from "lucide-react";
import type { Posicao, UsuarioFrente, UsuarioResumo } from "@/types/auth";
import type { MembroEquipePayload } from "@/types/projeto";
import type { Frente } from "@/types/banca";
import { ROTULO_POSICAO } from "@/utils/permissoes";
import { PageButtonSm } from "@/styles/page.styled";
import { CheckboxLabel, FieldGroup, FieldLabel, Required, FieldSelect } from "@/pages/Bancas.styled";
import {
  AddRow,
  Chip,
  ChipRemove,
  ChipRow,
  CountHint,
  FiltroFrentesRow,
  PickerStack,
} from "./MemberPicker.styled";

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
  /** Vínculos usuário↔frente — junto com `frentes`/`frenteIdsProjeto`, é o
   *  que filtra as duas listas pra só quem já atua nas frentes marcadas. */
  usuariosFrentes?: UsuarioFrente[];
  /** Catálogo completo — as opções do filtro (nem toda frente do catálogo
   *  precisa ser a do projeto: dá pra somar outras manualmente). */
  frentes?: Frente[];
  frenteIdsProjeto?: number[];
}

export function MemberPicker({
  usuarios,
  valor,
  onChange,
  desabilitado,
  usuariosFrentes = [],
  frentes = [],
  frenteIdsProjeto = [],
}: MemberPickerProps) {
  const [consultorPendente, setConsultorPendente] = useState("");
  // `null` = segue as frentes do projeto automaticamente (o normal). No
  // instante em que a pessoa mexe num checkbox, vira um conjunto próprio —
  // paralisa de seguir o formulário e passa a valer só o que foi marcado.
  const [filtroManual, setFiltroManual] = useState<Set<number> | null>(null);
  const frentesFiltro = filtroManual ?? new Set(frenteIdsProjeto);

  function alternarFrenteFiltro(frenteId: number) {
    const proximo = new Set(frentesFiltro);
    if (proximo.has(frenteId)) proximo.delete(frenteId);
    else proximo.add(frenteId);
    setFiltroManual(proximo);
  }

  const nomePorId = new Map(usuarios.map((u) => [u.id, u.nome]));
  const { coordenadorId, consultorIds } = valor;

  const frenteIdsPorUsuario = new Map<number, Set<number>>();
  for (const uf of usuariosFrentes) {
    const atual = frenteIdsPorUsuario.get(uf.usuario_id) ?? new Set<number>();
    atual.add(uf.frente_id);
    frenteIdsPorUsuario.set(uf.usuario_id, atual);
  }

  const filtroPorFrenteAtivo = frentesFiltro.size > 0;

  // Quem não tem frente cadastrada nenhuma passa direto — o filtro só barra
  // quem TEM frente e nenhuma delas está marcada no filtro, nunca por falta
  // de dado.
  function atendeFiltroFrente(usuario: UsuarioResumo): boolean {
    if (!filtroPorFrenteAtivo) return true;
    const frentesDoUsuario = frenteIdsPorUsuario.get(usuario.id);
    if (!frentesDoUsuario || frentesDoUsuario.size === 0) return true;
    return [...frentesFiltro].some((id) => frentesDoUsuario.has(id));
  }

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
  const elegiveisCoordenador = usuarios.filter(
    (u) => u.posicao === POSICAO_COORDENADOR && atendeFiltroFrente(u),
  );

  // Menos carregado primeiro: quem tem menos projetos abre a lista, para a
  // alocação distribuir a carga em vez de cair sempre em quem já está no
  // limiar de gargalo do §7.3. Empate desempata por nome — sem isso a ordem
  // dos que têm a mesma carga varia conforme a API responde.
  const porCargaCrescente = (a: UsuarioResumo, b: UsuarioResumo) =>
    a.projetos_alocados - b.projetos_alocados || a.nome.localeCompare(b.nome, "pt-BR");

  // Ninguém aparece duas vezes: quem já foi escolhido como consultor sai da
  // lista de opções. O `.filter` já devolve array novo, então o `.sort` não
  // mexe na prop `usuarios`.
  const disponiveisParaConsultor = usuarios
    .filter(
      (u) => u.posicao === POSICAO_CONSULTOR && !consultorIds.includes(u.id) && atendeFiltroFrente(u),
    )
    .sort(porCargaCrescente);

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
      {frentes.length > 0 && (
        <FieldGroup>
          <FieldLabel>Filtrar por frente</FieldLabel>
          <FiltroFrentesRow>
            {frentes.map((f) => (
              <CheckboxLabel key={f.id}>
                <input
                  type="checkbox"
                  checked={frentesFiltro.has(f.id)}
                  disabled={desabilitado}
                  onChange={() => alternarFrenteFiltro(f.id)}
                />
                {f.nome}
              </CheckboxLabel>
            ))}
          </FiltroFrentesRow>
          <CountHint $ok>
            Já vem marcada a frente deste projeto — marque outras se quiser gente de fora dela
            também, ou desmarque tudo pra ver todo mundo.
          </CountHint>
        </FieldGroup>
      )}

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
          {filtroPorFrenteAtivo && " Filtrado pelas frentes deste projeto."}
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
          Só quem tem a posição Consultor(a) aparece aqui, do menos alocado para o mais alocado.
          A mesma pessoa pode atuar em vários.
          {filtroPorFrenteAtivo && " Filtrado pelas frentes deste projeto."}
        </CountHint>
      </FieldGroup>
    </PickerStack>
  );
}
