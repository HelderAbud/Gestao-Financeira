const base = () => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8090";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hh_access_token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("hh_access_token", token);
  else localStorage.removeItem("hh_access_token");
}

/** Erro HTTP da API com corpo JSON padronizado (`ApiErrorResponse`). */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { json?: unknown }
): Promise<T> {
  const headers: HeadersInit = {
    ...(init?.json !== undefined
      ? { "Content-Type": "application/json" }
      : {}),
    ...(init?.headers ?? {}),
  };
  const token = getToken();
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text || res.statusText;
    let code: string | undefined;
    try {
      const j = JSON.parse(text) as {
        message?: string;
        error?: string;
      };
      if (typeof j.message === "string") message = j.message;
      if (typeof j.error === "string") code = j.error;
    } catch {
      /* corpo não JSON */
    }
    throw new ApiError(message, res.status, code);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
