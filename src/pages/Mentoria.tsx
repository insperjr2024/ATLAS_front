import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { createMentoria, deleteMentoria, getMentorias } from "@/lib/desempenho-mentorias";
import { getUsuarios } from "@/lib/usuarios";
import { FotoCircular } from "@/components/Avatar";
import type { DesempenhoMentoria } from "@/types/desempenho";
import type { UsuarioResumo } from "@/types/auth";
import {
  EmptyText,
  ErrorBlock,
  ErrorText,
  PageButton,
  PageButtonSm,
  PageCard,
  PageCardContent,
  PageCardHeader,
  PageCardTitle,
  PageHeader,
  PageHeaderText,
  PageLoadingBlock,
  PageStack,
  PageSubtitle,
  PageTitle,
} from "@/styles/page.styled";
import { FieldGroup, FieldLabel, FieldSelect, FormStack } from "@/pages/Bancas.styled";
import { ConfirmarModal } from "@/components/ConfirmarModal";
import {
  Iniciais,
  MentoradosLista,
  MentoriaCabecalho,
  MentoriaGrupo,
  MentoriaGrupoTitulo,
  MentoriaLinha,
  MentorPapel,
} from "@/pages/avaliacao-desempenho/painel/Painel.styled";

/** "Ana Souza" -> "AS". Duas letras bastam e cabem no círculo. */
function iniciais(nome: string | null | undefined): string {
  const partes = (nome ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

/**
 * Alocação de mentorias — quem mentora quem. Página administrativa própria,
 * fora de "Avaliação de Desempenho": mentoria não é processo de avaliação,
 * é um vínculo de acompanhamento escolhido pela diretoria, independente do
 * projeto (ver discussão de design — a única ligação com PDI é a permissão
 * de quem pode enviar um "encontro", não um dado compartilhado).
 *
 * Vive ao lado de "Membros" porque é o mesmo tipo de decisão: atribuir um
 * atributo relacional a uma pessoa, pela mesma diretoria que edita posição
 * e frente.
 */
export function Mentoria() {
  const { token } = useAuth();
  const [mentorias, setMentorias] = useState<DesempenhoMentoria[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [mentorId, setMentorId] = useState("");
  const [mentoradoId, setMentoradoId] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState("");
  const [paraRemover, setParaRemover] = useState<DesempenhoMentoria | null>(null);

  // Recolhida por padrão: uma lista de mentores/mentorados não é o tipo de
  // coisa que se quer ver toda vez que se entra na aba, e nomes juntam
  // rápido (um mentor por posição elegível, todo consultor alocado).
  const [mentoriasExpandidas, setMentoriasExpandidas] = useState(false);

  async function buscar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      const [m, u] = await Promise.all([getMentorias(token), getUsuarios(token)]);
      setMentorias(m);
      setUsuarios(u);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar mentorias");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Mentor pode ser coordenador, gerente ou diretor (2026-08-06), não só coordenador.
  const mentoresElegiveis = useMemo(
    () => usuarios.filter((u) => u.posicao === "coordenador" || u.posicao === "gerente" || u.posicao === "diretor"),
    [usuarios],
  );
  const mentoradosJaAlocados = useMemo(() => new Set(mentorias.map((m) => m.mentorado_id)), [mentorias]);
  const candidatosMentorado = useMemo(
    () => usuarios.filter((u) => u.posicao === "consultor" && !mentoradosJaAlocados.has(u.id)),
    [usuarios, mentoradosJaAlocados],
  );

  const porMentor = useMemo(() => {
    const grupos = new Map<number, DesempenhoMentoria[]>();
    for (const m of mentorias) {
      const lista = grupos.get(m.mentor_id) ?? [];
      lista.push(m);
      grupos.set(m.mentor_id, lista);
    }
    return Array.from(grupos.values());
  }, [mentorias]);

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !mentorId || !mentoradoId) {
      setErroForm("Escolha o mentor e o mentorado.");
      return;
    }
    setSalvando(true);
    setErroForm("");
    try {
      const nova = await createMentoria({ mentor_id: Number(mentorId), mentorado_id: Number(mentoradoId) }, token);
      setMentorias((atual) => [...atual, nova]);
      setMentorId("");
      setMentoradoId("");
    } catch (err) {
      setErroForm(err instanceof Error ? err.message : "Erro ao criar vínculo de mentoria");
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarRemocao() {
    if (!token || !paraRemover) return;
    await deleteMentoria(paraRemover.id, token);
    setMentorias((atual) => atual.filter((m) => m.id !== paraRemover.id));
    setParaRemover(null);
  }

  if (erro) {
    return (
      <ErrorBlock>
        <ErrorText>{erro}</ErrorText>
        <PageButton $variant="outline" onClick={buscar}>
          Tentar novamente
        </PageButton>
      </ErrorBlock>
    );
  }

  if (carregando) return <PageLoadingBlock />;

  return (
    <PageStack>
      <PageHeader>
        <PageHeaderText>
          <PageTitle>Alocação de Mentorias</PageTitle>
          <PageSubtitle>Escolha quem acompanha quem — independente de projeto ou avaliação.</PageSubtitle>
        </PageHeaderText>
      </PageHeader>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>Alocar mentoria</PageCardTitle>
        </PageCardHeader>
        <PageCardContent>
          <FormStack onSubmit={handleCriar}>
            <FieldGroup>
              <FieldLabel htmlFor="mentor">Mentor</FieldLabel>
              <FieldSelect id="mentor" value={mentorId} onChange={(e) => setMentorId(e.target.value)} required pesquisavel>
                <option value="">Selecione...</option>
                {mentoresElegiveis.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </FieldSelect>
            </FieldGroup>
            <FieldGroup>
              <FieldLabel htmlFor="mentorado">Mentorado (consultor)</FieldLabel>
              <FieldSelect id="mentorado" value={mentoradoId} onChange={(e) => setMentoradoId(e.target.value)} required pesquisavel>
                <option value="">Selecione...</option>
                {candidatosMentorado.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </FieldSelect>
            </FieldGroup>
            {erroForm && <ErrorText>{erroForm}</ErrorText>}
            <PageButton type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Criar vínculo"}
            </PageButton>
          </FormStack>
        </PageCardContent>
      </PageCard>

      <PageCard>
        <PageCardHeader>
          <PageCardTitle>
            Mentorias ativas{mentorias.length > 0 && ` (${mentorias.length})`}
          </PageCardTitle>
          {mentorias.length > 0 && (
            <PageButtonSm
              type="button"
              $variant="outline"
              onClick={() => setMentoriasExpandidas((v) => !v)}
            >
              {mentoriasExpandidas ? (
                <>
                  <ChevronUp size={14} />
                  Recolher
                </>
              ) : (
                <>
                  <ChevronDown size={14} />
                  Expandir
                </>
              )}
            </PageButtonSm>
          )}
        </PageCardHeader>
        {mentorias.length === 0 ? (
          <PageCardContent>
            <EmptyText>Nenhuma mentoria cadastrada ainda.</EmptyText>
          </PageCardContent>
        ) : (
          mentoriasExpandidas && (
            <PageCardContent>
              {porMentor.map((lista) => (
                <MentoriaGrupo key={lista[0].mentor_id}>
                  <MentoriaCabecalho>
                    <Iniciais $mentor aria-hidden>
                      {lista[0].mentor_foto ? (
                        <FotoCircular src={lista[0].mentor_foto} />
                      ) : (
                        iniciais(lista[0].mentor_nome)
                      )}
                    </Iniciais>
                    <div>
                      <MentoriaGrupoTitulo>{lista[0].mentor_nome}</MentoriaGrupoTitulo>
                      <MentorPapel>
                        Mentor de {lista.length}{" "}
                        {lista.length === 1 ? "pessoa" : "pessoas"}
                      </MentorPapel>
                    </div>
                  </MentoriaCabecalho>
                  <MentoradosLista>
                    {lista.map((m) => (
                      <MentoriaLinha key={m.id}>
                        <Iniciais aria-hidden>
                          {m.mentorado_foto ? (
                            <FotoCircular src={m.mentorado_foto} />
                          ) : (
                            iniciais(m.mentorado_nome)
                          )}
                        </Iniciais>
                        <span>{m.mentorado_nome}</span>
                        <PageButtonSm $variant="outline" type="button" onClick={() => setParaRemover(m)}>
                          Remover
                        </PageButtonSm>
                      </MentoriaLinha>
                    ))}
                  </MentoradosLista>
                </MentoriaGrupo>
              ))}
            </PageCardContent>
          )
        )}
      </PageCard>

      {paraRemover && (
        <ConfirmarModal
          titulo="Remover mentoria"
          mensagem={`Remover o vínculo de mentoria com ${paraRemover.mentorado_nome}? Esta ação não pode ser desfeita.`}
          rotuloConfirmar="Remover"
          onCancelar={() => setParaRemover(null)}
          onConfirmar={confirmarRemocao}
        />
      )}
    </PageStack>
  );
}
