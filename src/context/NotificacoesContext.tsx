import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { getContagemNotificacoes } from "@/lib/notificacoes";

/** ~60s, como o  pede, sem websocket. Curto o bastante para o aviso
 *  chegar na mesma sessão, longo o bastante para não pesar no backend. */
const INTERVALO_MS = 60_000;

interface NotificacoesContextType {
  naoLidas: number;
  /** Chamado pela página depois de marcar algo como lido: sem isto o badge
   *  ficaria com o número velho por até um minuto, e o usuário acharia que o
   *  clique não funcionou. */
  recarregar: () => void;
}

const NotificacoesContext = createContext<NotificacoesContextType | null>(null);

export function NotificacoesProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [naoLidas, setNaoLidas] = useState(0);

  const recarregar = useCallback(() => {
    if (!token) return;
    getContagemNotificacoes(token)
      .then(({ nao_lidas }) => setNaoLidas(nao_lidas))
      // Falha em silêncio: o sino é conforto, não requisito. Um erro de rede
      // aqui não pode encher a tela de mensagem a cada minuto.
      .catch(() => undefined);
  }, [token]);

  useEffect(() => {
    recarregar();
    const id = window.setInterval(recarregar, INTERVALO_MS);
    return () => window.clearInterval(id);
  }, [recarregar]);

  return (
    <NotificacoesContext.Provider value={{ naoLidas, recarregar }}>
      {children}
    </NotificacoesContext.Provider>
  );
}

export function useNotificacoes() {
  const contexto = useContext(NotificacoesContext);
  if (!contexto) {
    throw new Error("useNotificacoes precisa estar dentro de NotificacoesProvider");
  }
  return contexto;
}
