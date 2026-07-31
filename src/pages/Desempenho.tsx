import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import type { Desempenho } from "@/types/banca";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function Desempenho() {
  const { usuario, token } = useAuth();
  const [dados, setDados] = useState<Desempenho | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function buscar() {
      if (!usuario || !token) return;
      const resultado = await apiFetch<Desempenho>(`/usuarios/${usuario.id}/desempenho`, { token });
      setDados(resultado);
      setCarregando(false);
    }
    buscar();
  }, [usuario, token]);

  if (carregando) return <Skeleton className="h-40 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Porcentagem de bancas atendidas — {dados?.semestre_nome}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-bold">{dados?.percentual}%</p>
        <p className="text-sm text-muted-foreground mt-2">
          {dados?.bancas_atendidas} de {dados?.total_bancas_realizadas} bancas no semestre
        </p>
      </CardContent>
    </Card>
  );
}