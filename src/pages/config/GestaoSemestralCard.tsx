import { useEffect, useState } from "react";
import { Archive, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  createSemestre,
  getSemestres,
  updateSemestre,
  type Semestre,
} from "@/lib/calendario-academico";
import { ConfirmarModal } from "@/components/ConfirmarModal";
import { NovoSemestreModal } from "../NovoSemestreModal";
import {
  PageCard,
  PageCardHeader,
  PageCardTitle,
  PageCardContent,
  PageBadge,
  PageButtonSm,
  EmptyText,
  ErrorText,
} from "@/styles/page.styled";

/**
 * A gestão semestral, de onde vem o semestre que Calendários base,
 * Bancas e Avaliação de Desempenho todos assumem que já existe. Fica aqui, e
 * não espalhada por essas telas, porque abrir/arquivar uma gestão é uma
 * decisão administrativa só, não uma ação de cada funcionalidade que usa o
 * semestre.
 */
export function GestaoSemestralCard() {
  const { token } = useAuth();
  const [semestre, setSemestre] = useState<Semestre | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [criando, setCriando] = useState(false);
  const [confirmandoArquivamento, setConfirmandoArquivamento] = useState(false);

  async function buscar() {
    if (!token) return;
    try {
      const semestres = await getSemestres(token);
      setSemestre(semestres.find((s) => s.status === "ativa") ?? semestres[0] ?? null);
      setErro("");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function arquivar() {
    if (!token || !semestre) return;
    await updateSemestre(semestre.id, { status: "arquivada" }, token);
    setConfirmandoArquivamento(false);
    await buscar();
  }

  // Abrir uma gestão nova arquiva a anterior sozinho (regra do backend, ver
  // `CreateSemestreUseCase`), aqui só cria e recarrega.
  async function criar(dados: { nome: string; inicio: string; fim: string }) {
    if (!token) return;
    await createSemestre(dados, token);
    setCriando(false);
    await buscar();
  }

  return (
    <PageCard>
      <PageCardHeader style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <PageCardTitle>Gestão semestral</PageCardTitle>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {semestre && (
            <PageBadge $tone={semestre.status === "ativa" ? "success" : "muted"}>
              {semestre.status === "ativa" ? "gestão ativa" : "arquivada"}
            </PageBadge>
          )}
          {semestre?.status === "ativa" && (
            <PageButtonSm type="button" $variant="outline" onClick={() => setConfirmandoArquivamento(true)}>
              <Archive size={14} />
              Arquivar gestão
            </PageButtonSm>
          )}
          <PageButtonSm type="button" onClick={() => setCriando(true)}>
            <Plus size={14} />
            Novo semestre
          </PageButtonSm>
        </div>
      </PageCardHeader>
      <PageCardContent>
        {erro && <ErrorText>{erro}</ErrorText>}
        {carregando ? (
          <EmptyText>Carregando...</EmptyText>
        ) : semestre ? (
          <EmptyText>
            <strong>{semestre.nome}</strong> · {semestre.inicio} a {semestre.fim}. É o semestre que
            Calendários base, Bancas e Avaliação de Desempenho usam por padrão.
          </EmptyText>
        ) : (
          <EmptyText>Nenhum semestre cadastrado ainda, crie um para liberar o resto da plataforma.</EmptyText>
        )}
      </PageCardContent>

      {confirmandoArquivamento && semestre && (
        <ConfirmarModal
          titulo="Arquivar gestão"
          mensagem={`Arquivar a gestão ${semestre.nome}? Os indicadores reiniciam na próxima.`}
          rotuloConfirmar="Arquivar"
          onCancelar={() => setConfirmandoArquivamento(false)}
          onConfirmar={arquivar}
        />
      )}

      {criando && <NovoSemestreModal onCancelar={() => setCriando(false)} onSalvar={criar} />}
    </PageCard>
  );
}
