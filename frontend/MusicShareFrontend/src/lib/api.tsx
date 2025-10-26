import { getToken } from "./auth";

const API_BASE = "http://localhost:8002";

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(opts.headers || {});
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
    credentials: "include", // si usas cookies de sesión
  });

  // manejo básico: si 401 -> opcional redirigir a login o intentar refresh
  if (res.status === 401) {
    // lógica de refresh o logout centralizada aquí
  }

  return res;
}