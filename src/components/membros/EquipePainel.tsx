import { useEffect, useMemo, useState } from "react";
import { UserPlus, X } from "lucide-react";
import type { UsuarioFrente, UsuarioResumo } from "@/types/auth";
import type { Frente } from "@/types/banca";
import { ROTULO_POSICAO } from "@/utils/permissoes";
import { normalizarTexto } from "@/lib/nucleo";
import { EmptyText, PageButton } from "@/styles/page.styled";
import { FieldLabel, FieldSelect } from "@/pages/Bancas.styled";
import {
  CandidatoInfo,
  CandidatoLinha,
  CandidatoLista,
  CandidatoMeta,
  CandidatoNome,
  CandidatoTopo,
  PainelCabecalho,
  PainelCorpo,
  PainelFechar,
  PainelFiltros,
  PainelGrupo,
  PainelGrupoTitulo,
  PainelLateral,
  PainelOverlay,
  PainelRodape,
  PainelTitulo,
} from "@/styles/painel.styled";
import {
  AbrirPainel,
  EquipeGrade,
  LinhaAcao,
  PainelBusca,
  PapelBloco,
  PapelCabecalho,
  PapelContagem,
  PapelNome,
  PessoaCard,
  PessoaIniciais,
  PessoaLista,
  PessoaMeta,
  PessoaNome,
  PessoaRemover,
  PessoaTexto,
  RodapeContagem,
} from "./EquipePainel.styled";
import {
  POSICOES_ELEGIVEIS_CONSULTOR,
  POSICOES_ELEGIVEIS_COORDENADOR,
  type EquipeSelecionada,
} from "./MemberPicker";

type Papel = "coordenador" | "consultor";

/** Sem frente cadastrada. Vai por último e não some: quem não tem vínculo
 *  continua alocável, e escondê-lo deixaria quem monta sem entender a falta. */
const SEM_FRENTE = "Sem frente";
const TODAS = "__todas__";
/** O padrão: só quem já atua nas frentes marcadas no formulário. */
const DO_PROJETO = "__do_projeto__";

/** "Ana Souza" -> "AS". Duas letras no máximo — três já não cabem no círculo. */
function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return (primeira + ultima).toUpperCase();
}

/**
 * A carga entra no rótulo para a alocação ser decidida sem sair da tela —
 * 3+ projetos é o limiar de gargalo do §7.3.
 */
function metaDe(usuario: UsuarioResumo) {
  const total = usuario.projetos_alocados;
  const carga =
    total === 0 ? "livre" : `${total} projeto${total > 1 ? "s" : ""}${total >= 3 ? " (carga alta)" : ""}`;
  return `${ROTULO_POSICAO[usuario.posicao]} · ${carga}`;
}

/**
 * Menos carregado primeiro, empate por nome.
 *
 * Mesma régua do painel de Vagas: a decisão que se quer favorecer é
 * distribuir, e uma lista alfabética obriga a varrer tudo para achar quem
 * está livre. O empate por nome existe para a ordem não variar entre
 * renderizações de quem tem a mesma carga.
 */
function porCargaCrescente(a: UsuarioResumo, b: UsuarioResumo) {
  return a.projetos_alocados - b.projetos_alocados || a.nome.localeCompare(b.nome, "pt-BR");
}

/**
 * Distribui a lista por frente, da frente com mais gente para a com menos.
 *
 * Quem tem duas frentes aparece nos dois grupos, de propósito: quem procura
 * gente da própria frente precisa encontrá-la ali, e não num grupo combinado
 * que não pensaria em abrir.
 */
function agruparPorFrente(
  lista: UsuarioResumo[],
  frentesDe: (id: number) => string[],
): [string, UsuarioResumo[]][] {
  const mapa = new Map<string, UsuarioResumo[]>();
  for (const pessoa of lista) {
    const nomes = frentesDe(pessoa.id);
    for (const chave of nomes.length > 0 ? nomes : [SEM_FRENTE]) {
      mapa.set(chave, [...(mapa.get(chave) ?? []), pessoa]);
    }
  }
  return [...mapa.entries()].sort((a, b) =>
    a[0] === SEM_FRENTE ? 1 : b[0] === SEM_FRENTE ? -1 : b[1].length - a[1].length,
  );
}

/* ------------------------------------------------------------------ */

interface PainelProps {
  papel: Papel;
  /** Já elegíveis por posição — o painel não reimplementa a regra do §6.3. */
  opcoes: UsuarioResumo[];
  frentes: Frente[];
  frenteIdsProjeto: number[];
  frentesPorUsuario: Map<number, number[]>;
  escolhidos: number[];
  onAlternar: (usuarioId: number) => void;
  onFechar: () => void;
}

/**
 * O painel lateral de escolher gente — o mesmo de Vagas (§7.3), agora também
 * na criação do projeto.
 *
 * O que ele tem e o `<select>` anterior não tinha: ordem por carga, grupos
 * por frente e busca por nome. Numa lista de quarenta pessoas em ordem
 * alfabética, "quem está livre na Business?" só se responde abrindo outra
 * tela — que é exatamente o que fazia a equipe ser preenchida no chute.
 */
function PainelEscolherPessoa({
  papel,
  opcoes,
  frentes,
  frenteIdsProjeto,
  frentesPorUsuario,
  escolhidos,
  onAlternar,
  onFechar,
}: PainelProps) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState(frenteIdsProjeto.length > 0 ? DO_PROJETO : TODAS);

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onFechar();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  const nomePorFrenteId = useMemo(
    () => new Map(frentes.map((f) => [f.id, f.nome])),
    [frentes],
  );

  const nomesDasFrentesDe = useMemo(
    () => (usuarioId: number) =>
      (frentesPorUsuario.get(usuarioId) ?? [])
        .map((id) => nomePorFrenteId.get(id))
        .filter((nome): nome is string => !!nome),
    [frentesPorUsuario, nomePorFrenteId],
  );

  const termo = normalizarTexto(busca.trim());

  const visiveis = useMemo(() => {
    const idsDoProjeto = new Set(frenteIdsProjeto);
    return opcoes
      .filter((pessoa) => {
        const idsDaPessoa = frentesPorUsuario.get(pessoa.id) ?? [];
        // Quem não tem frente cadastrada nenhuma passa em qualquer filtro por
        // frente: o filtro barra quem TEM frente e nenhuma delas serve, nunca
        // por falta de dado.
        if (filtro === DO_PROJETO) {
          if (idsDaPessoa.length > 0 && !idsDaPessoa.some((id) => idsDoProjeto.has(id))) return false;
        } else if (filtro === SEM_FRENTE) {
          if (idsDaPessoa.length > 0) return false;
        } else if (filtro !== TODAS) {
          if (idsDaPessoa.length > 0 && !idsDaPessoa.includes(Number(filtro))) return false;
        }
        return !termo || normalizarTexto(pessoa.nome).includes(termo);
      })
      .sort(porCargaCrescente);
  }, [opcoes, filtro, termo, frentesPorUsuario, frenteIdsProjeto]);

  const grupos = useMemo(
    () => agruparPorFrente(visiveis, nomesDasFrentesDe),
    [visiveis, nomesDasFrentesDe],
  );

  const ehCoordenador = papel === "coordenador";
  const titulo = ehCoordenador ? "Escolher coordenador" : "Adicionar consultores";
  const idBusca = `painel-busca-${papel}`;
  const idFiltro = `painel-frente-${papel}`;

  return (
    <>
      <PainelOverlay onClick={onFechar} />
      <PainelLateral role="dialog" aria-modal="true" aria-label={titulo}>
        <PainelCabecalho>
          <PainelTitulo>
            <CandidatoNome as="h3">{titulo}</CandidatoNome>
            <CandidatoMeta>
              {visiveis.length} {visiveis.length === 1 ? "pessoa elegível" : "pessoas elegíveis"}
              {escolhidos.length > 0 && !ehCoordenador && ` · ${escolhidos.length} no time`}
            </CandidatoMeta>
          </PainelTitulo>
          <PainelFechar type="button" aria-label="Fechar painel" onClick={onFechar}>
            <X size={18} />
          </PainelFechar>
        </PainelCabecalho>

        <PainelFiltros>
          <PainelBusca
            id={idBusca}
            type="search"
            autoFocus
            placeholder="Buscar por nome…"
            aria-label="Buscar por nome"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          {frentes.length > 0 && (
            <>
              <FieldLabel htmlFor={idFiltro}>Frente</FieldLabel>
              <FieldSelect id={idFiltro} value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                {frenteIdsProjeto.length > 0 && (
                  <option value={DO_PROJETO}>Frentes do projeto</option>
                )}
                <option value={TODAS}>Todas as frentes</option>
                {frentes.map((f) => (
                  <option key={f.id} value={String(f.id)}>
                    {f.nome}
                  </option>
                ))}
                <option value={SEM_FRENTE}>{SEM_FRENTE}</option>
              </FieldSelect>
            </>
          )}
        </PainelFiltros>

        <PainelCorpo>
          {visiveis.length === 0 ? (
            <EmptyText>
              {termo
                ? "Ninguém encontrado com esse nome."
                : filtro === DO_PROJETO
                  ? "Ninguém das frentes do projeto está disponível. Troque o filtro para ver o resto."
                  : "Ninguém disponível para este papel."}
            </EmptyText>
          ) : (
            grupos.map(([nomeGrupo, doGrupo]) => (
              <PainelGrupo key={nomeGrupo}>
                <PainelGrupoTitulo>
                  {nomeGrupo} · {doGrupo.length}
                </PainelGrupoTitulo>
                <CandidatoLista>
                  {doGrupo.map((pessoa) => {
                    const escolhido = escolhidos.includes(pessoa.id);
                    return (
                      <CandidatoLinha key={pessoa.id}>
                        <CandidatoTopo>
                          <CandidatoInfo>
                            <CandidatoNome>{pessoa.nome}</CandidatoNome>
                            <CandidatoMeta>{metaDe(pessoa)}</CandidatoMeta>
                          </CandidatoInfo>
                          <LinhaAcao
                            type="button"
                            $escolhido={escolhido}
                            aria-label={`${escolhido ? "Remover" : ehCoordenador ? "Escolher" : "Adicionar"} ${pessoa.nome}`}
                            onClick={() => {
                              onAlternar(pessoa.id);
                              // Coordenador é um só: escolhido, não há mais
                              // nada a fazer aqui. Consultor é lista — o
                              // painel fica aberto para montar o time inteiro
                              // numa passada só.
                              if (ehCoordenador && !escolhido) onFechar();
                            }}
                          >
                            {escolhido ? "Remover" : ehCoordenador ? "Escolher" : "Adicionar"}
                          </LinhaAcao>
                        </CandidatoTopo>
                      </CandidatoLinha>
                    );
                  })}
                </CandidatoLista>
              </PainelGrupo>
            ))
          )}
        </PainelCorpo>

        <PainelRodape>
          <RodapeContagem>
            {ehCoordenador
              ? escolhidos.length > 0
                ? "Coordenador escolhido"
                : "Nenhum coordenador ainda"
              : `${escolhidos.length} ${escolhidos.length === 1 ? "consultor" : "consultores"} no time`}
          </RodapeContagem>
          <PageButton type="button" onClick={onFechar}>
            Concluir
          </PageButton>
        </PainelRodape>
      </PainelLateral>
    </>
  );
}

/* ------------------------------------------------------------------ */

interface EquipeCampoProps {
  usuarios: UsuarioResumo[];
  usuariosFrentes: UsuarioFrente[];
  frentes: Frente[];
  frenteIdsProjeto: number[];
  /** O teto de consultores do projeto — vira "2 de 3" no cabeçalho do bloco. */
  maxConsultores?: number;
  valor: EquipeSelecionada;
  onChange: (valor: EquipeSelecionada) => void;
  desabilitado?: boolean;
}

/**
 * A equipe no formulário de criar projeto — **opcional** (2026-08-13).
 *
 * Antes o cadastro exigia coordenador e pelo menos um consultor, e isso
 * invertia a ordem real: o projeto é vendido antes de o time existir. Quem
 * cadastrava punha nomes de mentira para o formulário passar, e esses nomes
 * ficavam no histórico de participação, que o §10 não deixa reescrever.
 * Agora os dois blocos podem ficar vazios e o time é montado depois, em
 * Vagas ou na Visão geral do projeto.
 */
export function EquipeCampo({
  usuarios,
  usuariosFrentes,
  frentes,
  frenteIdsProjeto,
  maxConsultores,
  valor,
  onChange,
  desabilitado,
}: EquipeCampoProps) {
  const [painelAberto, setPainelAberto] = useState<Papel | null>(null);
  const { coordenadorId, consultorIds } = valor;

  const frentesPorUsuario = useMemo(() => {
    const mapa = new Map<number, number[]>();
    for (const vinculo of usuariosFrentes) {
      mapa.set(vinculo.usuario_id, [...(mapa.get(vinculo.usuario_id) ?? []), vinculo.frente_id]);
    }
    return mapa;
  }, [usuariosFrentes]);

  const porId = useMemo(() => new Map(usuarios.map((u) => [u.id, u])), [usuarios]);

  // O backend recusa quem não tem a posição do papel, então nem oferecemos.
  // Quem já ocupa o outro papel também sai: a mesma pessoa nas duas cadeiras
  // do mesmo projeto é recusada lá (`validar_equipe`).
  const elegiveisCoordenador = useMemo(
    () =>
      usuarios.filter(
        (u) => POSICOES_ELEGIVEIS_COORDENADOR.includes(u.posicao) && !consultorIds.includes(u.id),
      ),
    [usuarios, consultorIds],
  );

  const elegiveisConsultor = useMemo(
    () =>
      usuarios.filter(
        (u) => POSICOES_ELEGIVEIS_CONSULTOR.includes(u.posicao) && u.id !== coordenadorId,
      ),
    [usuarios, coordenadorId],
  );

  function alternarCoordenador(id: number) {
    onChange({
      coordenadorId: coordenadorId === id ? null : id,
      consultorIds: consultorIds.filter((x) => x !== id),
    });
  }

  function alternarConsultor(id: number) {
    onChange({
      coordenadorId: coordenadorId === id ? null : coordenadorId,
      consultorIds: consultorIds.includes(id)
        ? consultorIds.filter((x) => x !== id)
        : [...consultorIds, id],
    });
  }

  function pessoaCard(id: number, aoRemover: () => void) {
    const pessoa = porId.get(id);
    const nome = pessoa?.nome ?? `Usuário ${id}`;
    return (
      <PessoaCard key={id}>
        <PessoaIniciais aria-hidden="true">{iniciais(nome)}</PessoaIniciais>
        <PessoaTexto>
          <PessoaNome>{nome}</PessoaNome>
          {pessoa && <PessoaMeta>{metaDe(pessoa)}</PessoaMeta>}
        </PessoaTexto>
        <PessoaRemover
          type="button"
          aria-label={`Remover ${nome} da equipe`}
          disabled={desabilitado}
          onClick={aoRemover}
        >
          <X size={16} />
        </PessoaRemover>
      </PessoaCard>
    );
  }

  // O teto conta só consultor (o coordenador entra por fora, §6.2), e é o
  // mesmo campo "Máximo de consultores" logo acima no formulário — mostrar
  // "2 de 3" aqui é o que liga um ao outro sem texto explicativo.
  const acimaDoTeto = maxConsultores !== undefined && consultorIds.length > maxConsultores;

  return (
    <>
      <EquipeGrade>
        <PapelBloco>
          <PapelCabecalho>
            <PapelNome>Coordenador</PapelNome>
            <PapelContagem>{coordenadorId ? "definido" : "opcional"}</PapelContagem>
          </PapelCabecalho>
          {coordenadorId ? (
            <PessoaLista>{pessoaCard(coordenadorId, () => alternarCoordenador(coordenadorId))}</PessoaLista>
          ) : (
            <AbrirPainel
              type="button"
              $vazio
              disabled={desabilitado}
              onClick={() => setPainelAberto("coordenador")}
            >
              <UserPlus size={16} />
              Escolher coordenador
            </AbrirPainel>
          )}
          {coordenadorId && (
            <AbrirPainel
              type="button"
              disabled={desabilitado}
              onClick={() => setPainelAberto("coordenador")}
            >
              Trocar
            </AbrirPainel>
          )}
        </PapelBloco>

        <PapelBloco>
          <PapelCabecalho>
            <PapelNome>Consultores</PapelNome>
            <PapelContagem>
              {consultorIds.length === 0
                ? "opcional"
                : maxConsultores !== undefined
                  ? `${consultorIds.length} de ${maxConsultores}`
                  : `${consultorIds.length} escolhidos`}
            </PapelContagem>
          </PapelCabecalho>
          {consultorIds.length > 0 && (
            <PessoaLista>
              {consultorIds.map((id) => pessoaCard(id, () => alternarConsultor(id)))}
            </PessoaLista>
          )}
          <AbrirPainel
            type="button"
            $vazio={consultorIds.length === 0}
            disabled={desabilitado}
            onClick={() => setPainelAberto("consultor")}
          >
            <UserPlus size={16} />
            {consultorIds.length === 0 ? "Adicionar consultores" : "Adicionar mais"}
          </AbrirPainel>
          {acimaDoTeto && (
            <PessoaMeta>
              Acima do máximo de consultores definido acima. O projeto nasce sem vaga em aberto.
            </PessoaMeta>
          )}
        </PapelBloco>
      </EquipeGrade>

      {painelAberto === "coordenador" && (
        <PainelEscolherPessoa
          papel="coordenador"
          opcoes={elegiveisCoordenador}
          frentes={frentes}
          frenteIdsProjeto={frenteIdsProjeto}
          frentesPorUsuario={frentesPorUsuario}
          escolhidos={coordenadorId ? [coordenadorId] : []}
          onAlternar={alternarCoordenador}
          onFechar={() => setPainelAberto(null)}
        />
      )}
      {painelAberto === "consultor" && (
        <PainelEscolherPessoa
          papel="consultor"
          opcoes={elegiveisConsultor}
          frentes={frentes}
          frenteIdsProjeto={frenteIdsProjeto}
          frentesPorUsuario={frentesPorUsuario}
          escolhidos={consultorIds}
          onAlternar={alternarConsultor}
          onFechar={() => setPainelAberto(null)}
        />
      )}
    </>
  );
}

export type { EquipeSelecionada };
