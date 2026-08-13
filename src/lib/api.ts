import { API_URL } from "@/config/config";

interface ApiOptions extends RequestInit {
  token?: string | null;
}

function formatApiDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) return String((item as { msg: string }).msg);
        return JSON.stringify(item);
      })
      .join("; ");
  }
  if (detail && typeof detail === "object" && "msg" in detail) return String((detail as { msg: string }).msg);
  if (detail != null) return String(detail);
  return "";
}

export async function apiFetch<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  // FormData define seu próprio Content-Type (com o boundary do multipart) —
  // se a gente fixar "application/json" aqui, o navegador não sobrescreve e o
  // backend não consegue parsear o corpo.
  const isFormData = rest.body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...rest,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    // ⚠ **A requisição não chegou a sair.** O `fetch` só rejeita quando o
    // navegador não conseguiu falar com o servidor: sem internet, servidor
    // fora do ar, ou CORS.
    //
    // A mensagem nativa é "Failed to fetch", que vazava direto para a tela.
    // Ela não diz nada a quem está usando a plataforma e ainda parece defeito
    // do que a pessoa acabou de preencher — em vez de problema de conexão.
    throw new Error(
      "Não foi possível falar com o servidor. Verifique sua conexão e tente de novo; " +
        "se continuar, avise a diretoria.",
    );
  }

  if (!response.ok) {
    const erro = await response.json().catch(() => null);
    const mensagem = formatApiDetail(erro?.detail);

    // O JWT tem prazo (ACCESS_TOKEN_EXPIRE_MINUTES, hoje 7 dias) e o
    // AuthContext só revalida no mount — sem isto, uma sessão que expira no
    // meio do uso deixa a pessoa presa numa página mostrando "Token inválido
    // ou expirado" em vez de voltar pro login pra entrar de novo. O caminho
    // normal é este 401 nunca acontecer: `/auth/renovar` estende o prazo a
    // cada abertura da plataforma.
    if (response.status === 401 && token) {
      localStorage.removeItem("token");
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    // ⭐ **Duas famílias de falha, dois textos.**
    //
    // 4xx com mensagem é a plataforma RECUSANDO algo com um motivo escrito
    // para a pessoa — é o texto do backend que manda, e o front nunca o
    // reescreve. É o caso do "esta banca tem 0 de 2 pessoas alocadas".
    //
    // Sem mensagem, sobra o erro técnico. `Erro 500 ao chamar
    // /bancas/7/realizar` diz à pessoa exatamente nada, e ainda sugere que ela
    // errou o preenchimento. O endpoint continua no console, para quem vai
    // depurar; na tela vai o que dá para fazer a respeito.
    if (mensagem) throw new Error(mensagem);

    console.error(`Erro ${response.status} em ${endpoint}`);
    throw new Error(
      response.status >= 500
        ? "O servidor não conseguiu concluir esta ação. Tente de novo em instantes; " +
          "se continuar, avise a diretoria."
        : "Não foi possível concluir esta ação. Recarregue a página e tente de novo.",
    );
  }

  if (response.status === 204) return null as T;
  return response.json();
}