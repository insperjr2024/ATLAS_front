import { API_URL } from "@/config/config";

interface ApiOptions extends RequestInit {
  token?: string | null;
}

export async function apiFetch<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => null);
    throw new Error(erro?.detail || `Erro ${response.status} ao chamar ${endpoint}`);
  }

  if (response.status === 204) return null as T;
  return response.json();
}