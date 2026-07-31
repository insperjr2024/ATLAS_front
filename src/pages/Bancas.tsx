import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getBancas, getCandidaturas, getBancasParaAvaliar, alocar, desalocar } from "@/lib/bancas";
import type { Banca, Candidatura } from "@/types/banca";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function Bancas() {
  const { usuario, token } = useAuth();
  const [bancas, setBancas] = useState<Banca[]>([]);
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [paraAvaliar, setParaAvaliar] = useState<Banca[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function recarregar() {
    if (!token || !usuario) return;
    const [bancasResp, candidaturasResp, avaliarResp] = await Promise.all([
      getBancas(token),
      getCandidaturas(token),
      getBancasParaAvaliar(usuario.id, token),
    ]);
    setBancas(bancasResp);
    setCandidaturas(candidaturasResp);
    setParaAvaliar(avaliarResp);
    setCarregando(false);
  }

  useEffect(() => {
    recarregar();
  }, [token, usuario]);

  if (carregando) return <Skeleton className="h-64 w-full" />;

  // candidatura do usuário atual pra cada banca (se existir)
  function candidaturaDe(bancaId: number) {
    return candidaturas.find((c) => c.banca_id === bancaId && c.usuario_id === usuario?.id);
  }

  const jaAlocado = bancas.filter((b) => b.status === "aberta para inscrições" && candidaturaDe(b.id));
  const disponiveis = bancas.filter((b) => b.status === "aberta para inscrições" && !candidaturaDe(b.id));

  async function handleAlocar(bancaId: number) {
    if (!token) return;
    await alocar(bancaId, token);
    recarregar();
  }

  async function handleDesalocar(bancaId: number) {
    const candidatura = candidaturaDe(bancaId);
    if (!token || !candidatura) return;
    await desalocar(candidatura.id, token);
    recarregar();
  }

  return (
    <div className="flex flex-col gap-6">
      <SecaoBancas titulo="Bancas futuras já alocado" bancas={jaAlocado} acao="deslocar" onAcao={handleDesalocar} />
      <SecaoBancas titulo="Bancas futuras disponíveis" bancas={disponiveis} acao="alocar" onAcao={handleAlocar} />
      <SecaoBancas titulo="Bancas passadas — avaliar" bancas={paraAvaliar} acao="avaliar" onAcao={(id) => console.log("ir pro formulário da banca", id)} />
    </div>
  );
}

function SecaoBancas({
  titulo,
  bancas,
  acao,
  onAcao,
}: {
  titulo: string;
  bancas: Banca[];
  acao: "alocar" | "deslocar" | "avaliar";
  onAcao: (bancaId: number) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {bancas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma banca aqui.</p>}
        {bancas.map((banca) => {
          const lotada = acao === "alocar" && banca.alocados >= banca.vagas;
          return (
            <div key={banca.id} className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-medium">{banca.nome_projeto}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(banca.data_hora).toLocaleString("pt-BR")} — {banca.semestre_nome}
                </p>
              </div>
              <Button
                variant={acao === "deslocar" ? "outline" : "default"}
                disabled={lotada}
                onClick={() => onAcao(banca.id)}
              >
                {lotada ? "Lotada" : acao === "alocar" ? "Alocar-se" : acao === "deslocar" ? "Deslocar-se" : "Avaliar"}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}