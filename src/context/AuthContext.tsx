import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiFetch } from "@/lib/api";
import type { Usuario, Cargo, Posicao, StatusUsuario } from "@/types/auth";

// A API devolve `cargo_id` solto em /auth/me e /usuarios/{id}, não o objeto
// `cargo` aninhado que o resto do front espera — por isso buscamos o cargo
// à parte e montamos o Usuario completo aqui.
interface UsuarioResponse {
  id: number;
  nome: string;
  email_insper: string;
  cargo_id: number;
  posicao: Posicao;
  status: StatusUsuario;
  ativo: boolean;
}

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  carregando: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * ⭐ Estende a sessão: pede um token novo, com o prazo cheio, e guarda no
 * lugar do atual. Quem abre o ATLAS toda semana nunca precisa relogar.
 *
 * Grava só no `localStorage`, sem `setToken`: mexer no estado dispararia de
 * novo o efeito que carrega o usuário (o `token` é a dependência dele) e a
 * renovação viraria um laço. O token em memória continua válido nesta sessão
 * — o novo entra em vigor no próximo load, que é quando ele é lido.
 *
 * Falha em silêncio de propósito: renovar é conforto, não requisito. Se a
 * rede cair aqui, a sessão segue valendo pelo prazo que já tinha.
 */
function renovarSessao(token: string) {
  apiFetch<{ access_token: string }>("/auth/renovar", { method: "POST", token })
    .then((resposta) => localStorage.setItem("token", resposta.access_token))
    .catch(() => {});
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarUsuario() {
      if (!token) {
        setCarregando(false);
        return;
      }
      try {
        const dados = await apiFetch<UsuarioResponse>("/auth/me", { token });
        const cargo = await apiFetch<Cargo>(`/cargos/${dados.cargo_id}`, { token });
        setUsuario({ ...dados, cargo });
        renovarSessao(token);
      } catch {
        setToken(null);
        localStorage.removeItem("token");
      } finally {
        setCarregando(false);
      }
    }
    carregarUsuario();
  }, [token]);

  async function login(email: string, senha: string) {
    const resposta = await apiFetch<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email_insper: email, senha }),
    });
    localStorage.setItem("token", resposta.access_token);
    setToken(resposta.access_token);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, token, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa estar dentro de um AuthProvider");
  return context;
}