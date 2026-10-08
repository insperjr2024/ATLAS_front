import { useEffect, useState, type FormEvent } from "react";
import styled from "styled-components";
import { theme } from "@/styles/theme";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { CorSelo } from "@/components/health-track/CorSelo";
import { getConfiguracao, updateConfiguracao } from "@/lib/configuracao";
import { zerarHealthTrack } from "@/lib/health-track";
import { ConfirmarModal } from "@/components/ConfirmarModal";
import { ehDiretoriaDeProjetos } from "@/utils/permissoes";
import {
  EmptyText,
  ErrorText,
  PageButton,
  PageCard,
  PageCardContent,
  PageCardHeader,
  PageCardTitle,
} from "@/styles/page.styled";

const Linhas = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.md};
`;

const Linha = styled.label`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: ${theme.fontSize.sm};

  input {
    width: 4.5rem;
    text-align: center;
  }
`;

const Descricao = styled.p`
  margin: 0;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.mutedForeground};
`;

const Rodape = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  margin-top: ${theme.spacing.md};
`;

/**
 * Health Track §7: "cronograma amarelo há 3 avaliações". A partir de quantas
 * avaliações seguidas na mesma cor o pilar vira alerta de persistência. Os
 * dois números moram na linha única de `configuracao`.
 */
export function HealthTrackPersistenciaCard() {
  const { token, usuario } = useAuth();
  const podeEditar = ehDiretoriaDeProjetos(usuario);
  const [form, setForm] = useState<{ amarelo: number; vermelho: number } | null>(null);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [zerando, setZerando] = useState(false);
  const [zerado, setZerado] = useState("");

  useEffect(() => {
    if (!token) return;
    let vivo = true;
    getConfiguracao(token)
      .then((c) => {
        if (vivo)
          setForm({ amarelo: c.health_track_persistencia_amarelo, vermelho: c.health_track_persistencia_vermelho });
      })
      .catch((err) => vivo && setErro(err instanceof Error ? err.message : "Erro ao carregar"));
    return () => {
      vivo = false;
    };
  }, [token]);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!token || !form) return;
    setSalvando(true);
    setErro("");
    setSalvo(false);
    try {
      const c = await updateConfiguracao(
        { health_track_persistencia_amarelo: form.amarelo, health_track_persistencia_vermelho: form.vermelho },
        token,
      );
      setForm({ amarelo: c.health_track_persistencia_amarelo, vermelho: c.health_track_persistencia_vermelho });
      setSalvo(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>Persistência no Health Track</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        <Descricao>
          Um pilar que repete a mesma cor avaliação após avaliação vira alerta de persistência no mapa ("amarelo há 3
          avaliações"). Aqui se define a partir de quantas.
        </Descricao>
        {erro && <ErrorText>{erro}</ErrorText>}
        {!form ? (
          <EmptyText>Carregando…</EmptyText>
        ) : (
          <form onSubmit={salvar}>
            <Linhas>
              <Linha>
                <CorSelo cor="amarelo" />
                persistente a partir de
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={form.amarelo}
                  onChange={(e) => setForm({ ...form, amarelo: Number(e.target.value) })}
                  disabled={!podeEditar || salvando}
                />
                avaliações seguidas
              </Linha>
              <Linha>
                <CorSelo cor="vermelho" />
                persistente a partir de
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={form.vermelho}
                  onChange={(e) => setForm({ ...form, vermelho: Number(e.target.value) })}
                  disabled={!podeEditar || salvando}
                />
                avaliações seguidas
              </Linha>
            </Linhas>
            {podeEditar && (
              <Rodape>
                <PageButton type="submit" disabled={salvando || form.amarelo < 1 || form.vermelho < 1}>
                  {salvando ? "Salvando…" : "Salvar"}
                </PageButton>
                {salvo && <Descricao role="status">Salvo.</Descricao>}
              </Rodape>
            )}
          </form>
        )}
        {podeEditar && (
          <Rodape style={{ marginTop: theme.spacing.lg }}>
            <PageButton type="button" $variant="outline" onClick={() => setZerando(true)}>
              Zerar Health Track
            </PageButton>
            <Descricao>
              {zerado || "Apaga todas as avaliações, rodadas e ações da carteira. Pilares e regra ficam. Pra testes."}
            </Descricao>
          </Rodape>
        )}
      </PageCardContent>
      {zerando && (
        <ConfirmarModal
          titulo="Zerar o Health Track"
          mensagem="Apaga TODAS as avaliações de todos os projetos, todas as rodadas e todas as ações. Pilares, regra e limites ficam. Não tem volta."
          confirmacaoTexto="ZERAR"
          rotuloConfirmar="Zerar tudo"
          rotuloProcessando="Zerando…"
          onConfirmar={async () => {
            if (!token) return;
            const r = await zerarHealthTrack(token);
            setZerado(`Zerado: ${r.avaliacoes} avaliações, ${r.rodadas} rodadas e ${r.acoes} ações apagadas.`);
            setZerando(false);
          }}
          onCancelar={() => setZerando(false)}
        />
      )}
    </PageCard>
  );
}
