import { useEffect, useMemo, useState } from "react";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/context/AuthContext";
import { getBancas } from "@/lib/bancas";
import { getUsuarios } from "@/lib/usuarios";
import type { Banca } from "@/types/banca";
import type { UsuarioResumo } from "@/types/auth";
import { nomeUsuario } from "@/lib/nucleo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  PageStack,
  EmptyText,
  PageLoadingSkeleton,
  ErrorState,
  ErrorMessage,
  TopGrid,
  ListCardContent,
  ListRow,
  RowGroup,
  RowDot,
  RowLabel,
  RowMeta,
} from "@/styles/shared.styled";
import { CalendarWrapper } from "./Calendario.styled";

function chaveData(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

export function Calendario() {
  const { token } = useAuth();
  const [bancas, setBancas] = useState<Banca[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioResumo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [diaSelecionado, setDiaSelecionado] = useState<Date | undefined>(new Date());

  async function buscar() {
    if (!token) return;
    setCarregando(true);
    setErro("");
    try {
      const [bancasResp, usuariosResp] = await Promise.all([getBancas(token), getUsuarios(token)]);
      setBancas(bancasResp);
      setUsuarios(usuariosResp);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar calendário");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const bancasPorDia = useMemo(() => {
    const mapa = new Map<string, Banca[]>();
    for (const banca of bancas) {
      const chave = chaveData(new Date(banca.data_hora));
      const lista = mapa.get(chave) ?? [];
      lista.push(banca);
      mapa.set(chave, lista);
    }
    return mapa;
  }, [bancas]);

  const diasComBanca = useMemo(() => bancas.map((b) => new Date(b.data_hora)), [bancas]);

  if (erro) {
    return (
      <ErrorState>
        <ErrorMessage>Não foi possível carregar o calendário: {erro}</ErrorMessage>
        <Button variant="outline" onClick={buscar}>
          Tentar novamente
        </Button>
      </ErrorState>
    );
  }

  if (carregando) return <PageLoadingSkeleton />;

  const bancasDoDia = diaSelecionado ? (bancasPorDia.get(chaveData(diaSelecionado)) ?? []) : [];

  return (
    <PageStack>
      <TopGrid>
        <Card>
          <CardHeader>
            <CardTitle>Calendário de bancas</CardTitle>
          </CardHeader>
          <CardContent>
            <CalendarWrapper>
              <Calendar
                mode="single"
                locale={ptBR}
                selected={diaSelecionado}
                onSelect={setDiaSelecionado}
                modifiers={{ temBanca: diasComBanca }}
                modifiersClassNames={{ temBanca: "tem-banca" }}
              />
            </CalendarWrapper>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {diaSelecionado ? `Bancas em ${diaSelecionado.toLocaleDateString("pt-BR")}` : "Selecione um dia"}
            </CardTitle>
          </CardHeader>
          <ListCardContent>
            {bancasDoDia.length === 0 && <EmptyText>Nenhuma banca nesse dia.</EmptyText>}
            {bancasDoDia.map((banca) => (
              <ListRow key={banca.id}>
                <RowGroup>
                  <RowDot aria-hidden />
                  <RowLabel>{banca.nome_projeto}</RowLabel>
                </RowGroup>
                <RowMeta>
                  {new Date(banca.data_hora).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} ·{" "}
                  {nomeUsuario(usuarios, banca.coordenador_id)}
                </RowMeta>
              </ListRow>
            ))}
          </ListCardContent>
        </Card>
      </TopGrid>
    </PageStack>
  );
}
