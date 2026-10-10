import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { baixarFotoExMembro } from "@/lib/institucional";
import { iniciais } from "@/lib/avatar";
import { FotoCircular } from "@/components/Avatar";
import { Circulo } from "./Institucional.styled";

interface Props {
  id: number;
  nome: string;
  temFoto: boolean;
  versao: number;
  tamanho?: number;
  /** Preview local (arquivo recém-escolhido no modal) tem prioridade sobre a do servidor. */
  previewUrl?: string | null;
}

/**
 * O círculo do ex-membro: a foto quando existe, as iniciais quando não.
 *
 * A foto vem pela rota autenticada como blob (ver `baixarFotoExMembro`), e o
 * object URL é revogado quando o componente sai ou a versão muda — senão
 * cada abertura da aba deixaria uma imagem presa na memória.
 */
export function FotoExMembro({ id, nome, temFoto, versao, tamanho = 44, previewUrl }: Props) {
  const { token } = useAuth();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !temFoto || previewUrl) return;
    let ativo = true;
    let objectUrl: string | null = null;
    baixarFotoExMembro(id, token, versao)
      .then((u) => {
        if (!ativo) {
          URL.revokeObjectURL(u);
          return;
        }
        objectUrl = u;
        setUrl(u);
      })
      .catch(() => {
        if (ativo) setUrl(null);
      });
    return () => {
      ativo = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, token, temFoto, versao, previewUrl]);

  const src = previewUrl ?? (temFoto ? url : null);
  return <Circulo $tamanho={tamanho}>{src ? <FotoCircular src={src} /> : iniciais(nome)}</Circulo>;
}
