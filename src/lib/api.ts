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

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => null);
    const mensagem = formatApiDetail(erro?.detail);

    // O JWT expira em 30min (ACCESS_TOKEN_EXPIRE_MINUTES) e o AuthContext só
    // revalida no mount — sem isto, uma sessão que expira no meio do uso
    // deixa a pessoa presa numa página mostrando "Token inválido ou
    // expirado" em vez de voltar pro login pra entrar de novo.
    if (response.status === 401 && token) {
      localStorage.removeItem("token");
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    throw new Error(mensagem || `Erro ${response.status} ao chamar ${endpoint}`);
  }

  if (response.status === 204) return null as T;
  return response.json();
}