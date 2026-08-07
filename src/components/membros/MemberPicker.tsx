import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";
import type { Posicao, UsuarioFrente, UsuarioResumo } from "@/types/auth";
import type { MembroEquipePayload } from "@/types/projeto";
import type { Frente } from "@/types/banca";
import { ROTULO_POSICAO } from "@/utils/permissoes";
import { normalizarTexto } from "@/lib/nucleo";
import { FieldGroup, FieldLabel, Required } from "@/pages/Bancas.styled";
import {
  AddRow,
  Chip,
  ChipRemove,
  ChipRow,
  CountHint,
  DropdownBusca,
  DropdownFiltroFrentes,
  DropdownItem,
  DropdownItemMeta,
  DropdownLimpar,
  DropdownLista,
  DropdownPanel,
  DropdownTrigger,
  DropdownVazio,
  DropdownWrap,
  FrentePill,
  PickerStack,
} from "./MemberPicker.styled";

export interface EquipeSelecionada {
  coordenadorId: number | null;
  consultorIds: number[];
}

/**
 * Cada papel do projeto (§6.3) exige posição igual ou acima na hierarquia
 * ATÉ gerente (gerente > coordenador > consultor): um gerente que também
 * coordena projeto na prática pode ocupar a vaga de coordenador sem virar
 * "coordenador" de posição de verdade (2026-08-07). Diretor fica de fora das
 * duas — só supervisiona, não é alocado na equipe de execução. O que NUNCA
 * abre, pra ninguém, é o sentido inverso — consultor não vira coordenador
 * sem ser promovido de posição de verdade, isso é o §10. Espelha
 * `POSICOES_ELEGIVEIS_CONSULTOR`/`POSICOES_ELEGIVEIS_COORDENADOR` de
 * `src/utils/validacao_equipe.py`.
 */
export const POSICAO_CONSULTOR: Posicao = "consultor";
export const POSICOES_ELEGIVEIS_CONSULTOR: Posicao[] = ["consultor", "coordenador", "gerente"];
export const POSICOES_ELEGIVEIS_COORDENADOR: Posicao[] = ["coordenador", "gerente"];

/**
 * A regra do coordenador e do mínimo de consultor (§6.3) numa função só,
 * para o formulário de criação e o modal de editar equipe dizerem exatamente
 * a mesma coisa. O backend revalida em `create_projeto.py` e
 * `update_equipe_projeto.py`. Consultor não tem máximo, só o mínimo de 1.
 *
 * Ninguém tem limite de projetos: a mesma pessoa pode coordenar (ou consultar)
 * vários ao mesmo tempo, por isso não há checagem contra outros projetos.
 */
export function validarEquipe({ coordenadorId, consultorIds }: EquipeSelecionada): string | null {
  if (!coordenadorId) return "Escolha o coordenador do projeto.";
  if (consultorIds.includes(coordenadorId)) {
    return "O coordenador não pode ser também consultor do mesmo projeto.";
  }
  if (consultorIds.length === 0) return "Escolha pelo menos um consultor.";
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
  // `null` = segue as frentes do projeto automaticamente (o normal). No
  // instante em que a pessoa mexe num pill, vira um conjunto próprio —
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
  const metaTexto = (usuario: UsuarioResumo) => {
    const total = usuario.projetos_alocados;
    const carga =
      total === 0 ? "livre" : `${total} projeto${total > 1 ? "s" : ""}${total >= 3 ? " ⚠" : ""}`;
    return `${ROTULO_POSICAO[usuario.posicao]} · ${carga}`;
  };

  // O backend recusa quem não tem a posição do papel, então nem oferecemos.
  const elegiveisCoordenador = usuarios.filter(
    (u) => POSICOES_ELEGIVEIS_COORDENADOR.includes(u.posicao) && atendeFiltroFrente(u),
  );

  // Menos carregado primeiro: quem tem menos projetos abre a lista, para a
  // alocação distribuir a carga em vez de cair sempre em quem já está no
  // limiar de gargalo do §7.3. Empate desempata por nome — sem isso a ordem
  // dos que têm a mesma carga varia conforme a API responde.
  const porCargaCrescente = (a: UsuarioResumo, b: UsuarioResumo) =>
    a.projetos_alocados - b.projetos_alocados || a.nome.localeCompare(b.nome, "pt-BR");

  // Consultor aceita posição igual ou acima na hierarquia (coordenador,
  // gerente e diretor também entram — nunca o contrário). Ninguém aparece
  // duas vezes: quem já foi escolhido sai da lista de opções. O `.filter` já
  // devolve array novo, então o `.sort` não mexe na prop `usuarios`.
  const disponiveisParaConsultor = usuarios
    .filter(
      (u) =>
        POSICOES_ELEGIVEIS_CONSULTOR.includes(u.posicao) &&
        !consultorIds.includes(u.id) &&
        atendeFiltroFrente(u),
    )
    .sort(porCargaCrescente);

  function adicionarConsultor(id: number) {
    if (consultorIds.includes(id)) return;
    onChange({ coordenadorId, consultorIds: [...consultorIds, id] });
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
        <PessoaDropdown
          id="equipe-coordenador"
          opcoes={elegiveisCoordenador}
          meta={metaTexto}
          desabilitado={desabilitado}
          gatilho={coordenadorId ? (nomePorId.get(coordenadorId) ?? `Usuário ${coordenadorId}`) : "Selecione…"}
          gatilhoVazio={!coordenadorId}
          vazio={elegiveisCoordenador.length === 0 ? "Nenhum coordenador cadastrado" : "Nenhum coordenador com essa frente"}
          onSelecionar={(id) => trocarCoordenador(id)}
          onLimpar={coordenadorId ? () => trocarCoordenador(null) : undefined}
          frentes={frentes}
          frentesFiltro={frentesFiltro}
          onToggleFrente={alternarFrenteFiltro}
        />
      </FieldGroup>

      <FieldGroup>
        <FieldLabel htmlFor="equipe-consultor">
          Consultores<Required>*</Required>
        </FieldLabel>
        <ChipRow>
          {consultorIds.length === 0 && (
            <CountHint $ok={false}>Escolha pelo menos um consultor.</CountHint>
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
          <PessoaDropdown
            id="equipe-consultor"
            opcoes={disponiveisParaConsultor}
            meta={metaTexto}
            desabilitado={desabilitado}
            gatilho="Adicionar consultor…"
            gatilhoVazio
            vazio={disponiveisParaConsultor.length === 0 ? "Ninguém disponível" : "Nenhum consultor com essa frente"}
            onSelecionar={adicionarConsultor}
            frentes={frentes}
            frentesFiltro={frentesFiltro}
            onToggleFrente={alternarFrenteFiltro}
          />
        </AddRow>
      </FieldGroup>
    </PickerStack>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Dropdown único pra coordenador (troca) e consultor (adiciona) — nem select
 * nativo do navegador, nem checkboxes soltas: o filtro de frente mora dentro
 * do próprio painel, bem ao lado de quem está sendo escolhido.
 */
function PessoaDropdown({
  id,
  opcoes,
  meta,
  desabilitado,
  gatilho,
  gatilhoVazio,
  vazio,
  onSelecionar,
  onLimpar,
  frentes,
  frentesFiltro,
  onToggleFrente,
}: {
  id: string;
  opcoes: UsuarioResumo[];
  meta: (usuario: UsuarioResumo) => string;
  desabilitado?: boolean;
  gatilho: string;
  gatilhoVazio: boolean;
  vazio: string;
  onSelecionar: (usuarioId: number) => void;
  onLimpar?: () => void;
  frentes: Frente[];
  frentesFiltro: Set<number>;
  onToggleFrente: (frenteId: number) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [posicao, setPosicao] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function aoClicarFora(evento: MouseEvent) {
      const alvo = evento.target as Node;
      if (ref.current?.contains(alvo) || painelRef.current?.contains(alvo)) return;
      setAberto(false);
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  // Zera a busca a cada abertura — senão o filtro da vez anterior continua
  // escondendo gente na próxima vez que a lista é aberta.
  useEffect(() => {
    if (aberto) setBusca("");
  }, [aberto]);

  // O painel vive num portal em `document.body` (ver comentário do
  // `DropdownPanel`), então precisa recalcular a própria posição — não
  // segue o layout do gatilho sozinho. Mesma lógica do `SelectCustom`: abre
  // pro lado com mais espaço e ancora por `bottom` quando é pra cima, pra
  // não sobrar vão entre o painel e o gatilho quando a lista é curta.
  useLayoutEffect(() => {
    if (!aberto) return;
    function posicionar() {
      const retangulo = ref.current?.getBoundingClientRect();
      if (!retangulo) return;
      const margem = 8;
      const alturaPreferida = 320; // mesmo valor do `max-height: 20rem` de antes
      const espacoAbaixo = window.innerHeight - retangulo.bottom - margem;
      const espacoAcima = retangulo.top - margem;
      const abrePraCima = espacoAbaixo < alturaPreferida && espacoAcima > espacoAbaixo;
      const alturaDisponivel = Math.max(
        Math.min(alturaPreferida, abrePraCima ? espacoAcima : espacoAbaixo),
        120,
      );
      setPosicao(
        abrePraCima
          ? {
              bottom: window.innerHeight - retangulo.top + 4,
              left: retangulo.left,
              width: retangulo.width,
              maxHeight: alturaDisponivel,
            }
          : {
              top: retangulo.bottom + 4,
              left: retangulo.left,
              width: retangulo.width,
              maxHeight: alturaDisponivel,
            },
      );
    }
    posicionar();
    window.addEventListener("scroll", posicionar, true);
    window.addEventListener("resize", posicionar);
    return () => {
      window.removeEventListener("scroll", posicionar, true);
      window.removeEventListener("resize", posicionar);
    };
  }, [aberto]);

  const termo = normalizarTexto(busca.trim());
  const opcoesFiltradas = termo
    ? opcoes.filter((u) => normalizarTexto(u.nome).includes(termo))
    : opcoes;

  return (
    <DropdownWrap ref={ref}>
      <DropdownTrigger
        id={id}
        type="button"
        $vazio={gatilhoVazio}
        disabled={desabilitado}
        aria-expanded={aberto}
        aria-haspopup="listbox"
        onClick={() => setAberto((v) => !v)}
      >
        <span>{gatilho}</span>
        <ChevronDown size={16} />
      </DropdownTrigger>
      {aberto &&
        posicao &&
        createPortal(
        <DropdownPanel
          ref={painelRef}
          role="listbox"
          style={{
            top: posicao.top,
            bottom: posicao.bottom,
            left: posicao.left,
            width: posicao.width,
            maxHeight: posicao.maxHeight,
          }}
        >
          <DropdownBusca
            type="text"
            autoFocus
            placeholder="Buscar por nome…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          {frentes.length > 0 && (
            <DropdownFiltroFrentes>
              {frentes.map((f) => (
                <FrentePill
                  key={f.id}
                  type="button"
                  $ativo={frentesFiltro.has(f.id)}
                  onClick={() => onToggleFrente(f.id)}
                >
                  {f.nome}
                </FrentePill>
              ))}
            </DropdownFiltroFrentes>
          )}
          <DropdownLista>
            {onLimpar && (
              <DropdownLimpar type="button" onClick={() => { onLimpar(); setAberto(false); }}>
                Remover coordenador
              </DropdownLimpar>
            )}
            {opcoesFiltradas.length === 0 ? (
              <DropdownVazio>{termo ? "Ninguém encontrado" : vazio}</DropdownVazio>
            ) : (
              opcoesFiltradas.map((usuario) => (
                <DropdownItem
                  key={usuario.id}
                  type="button"
                  role="option"
                  onClick={() => {
                    onSelecionar(usuario.id);
                    setAberto(false);
                  }}
                >
                  {usuario.nome}
                  <DropdownItemMeta>{meta(usuario)}</DropdownItemMeta>
                </DropdownItem>
              ))
            )}
          </DropdownLista>
        </DropdownPanel>,
        document.body,
      )}
    </DropdownWrap>
  );
}
