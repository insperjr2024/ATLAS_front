import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getConfiguracao, updateConfiguracao } from "@/lib/configuracao";
import type { Configuracao } from "@/types/banca";
import { PageCard, PageCardHeader, PageCardTitle, PageCardContent, PageButton, EmptyText } from "@/styles/page.styled";
import { FieldGroup, FieldLabel, FieldInput, FormErrorText } from "../Config.styled";

/**
 * O teto de pessoas por banca (§8) — hoje já é usado de verdade (bloqueia
 * candidatura acima do valor), mas não tinha tela nenhuma pra editar.
 */
export function ConfiguracaoBancaCard() {
  const { token } = useAuth();
  const [configuracao, setConfiguracao] = useState<Configuracao | null>(null);
  const [vagas, setVagas] = useState("");
  const [lideranca, setLideranca] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  async function carregar() {
    if (!token) return;
    setErro("");
    try {
      const resp = await getConfiguracao(token);
      setConfiguracao(resp);
      setVagas(String(resp.vagas_por_banca));
      setLideranca(String(resp.lideranca_minima_por_frente));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar configurações de banca");
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function salvar() {
    if (!token) return;
    const numero = Number(vagas);
    if (!Number.isFinite(numero) || numero <= 0) {
      setErro("Informe um número de vagas válido.");
      return;
    }
    const numeroLideranca = Number(lideranca);
    if (!Number.isFinite(numeroLideranca) || numeroLideranca < 0) {
      setErro("Informe um mínimo de liderança válido.");
      return;
    }
    setSalvando(true);
    setErro("");
    setAviso("");
    try {
      await updateConfiguracao(
        { vagas_por_banca: numero, lideranca_minima_por_frente: numeroLideranca },
        token,
      );
      setAviso("Salvo.");
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <PageCard>
      <PageCardHeader>
        <PageCardTitle>Configurações de banca</PageCardTitle>
      </PageCardHeader>
      <PageCardContent>
        {!configuracao ? (
          <EmptyText>Carregando...</EmptyText>
        ) : (
          <>
            <FieldGroup>
              <FieldLabel htmlFor="vagas-por-banca">Teto de vagas por banca</FieldLabel>
              <FieldInput
                id="vagas-por-banca"
                type="number"
                min={1}
                value={vagas}
                onChange={(e) => setVagas(e.target.value)}
              />
            </FieldGroup>
            <EmptyText style={{ fontSize: "0.7rem", marginTop: "0.5rem" }}>
              O mínimo por frente é configurado em cada frente, em "Frentes", no grupo "Ciclo e
              estrutura" acima.
            </EmptyText>
            <FieldGroup style={{ marginTop: "0.75rem" }}>
              <FieldLabel htmlFor="lideranca-minima">Mínimo de liderança por frente</FieldLabel>
              <FieldInput
                id="lideranca-minima"
                type="number"
                min={0}
                value={lideranca}
                onChange={(e) => setLideranca(e.target.value)}
              />
            </FieldGroup>
            <EmptyText style={{ fontSize: "0.7rem", marginTop: "0.5rem" }}>
              Quantas lideranças (gerente da frente, ou diretor) cada frente vinculada precisa ter
              na banca, à parte do piso de membros comuns. Se ninguém estiver alocado, a alocação
              automática puxa alguém para cobrir.
            </EmptyText>
            {erro && <FormErrorText>{erro}</FormErrorText>}
            {aviso && <EmptyText style={{ color: "green" }}>{aviso}</EmptyText>}
            <div style={{ marginTop: "0.75rem" }}>
              <PageButton type="button" disabled={salvando} onClick={salvar}>
                {salvando ? "Salvando..." : "Salvar"}
              </PageButton>
            </div>
          </>
        )}
      </PageCardContent>
    </PageCard>
  );
}
