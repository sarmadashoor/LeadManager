const BASE_URL = import.meta.env.VITE_CHAT_API || "http://localhost:3001";

/**
 * Generic GET helper
 */
export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `GET ${path} failed`);
  }

  return res.json() as Promise<T>;
}

/**
 * Generic POST helper
 */
export async function apiPost<T = any>(path: string, body: any): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `POST ${path} failed`);
  }

  return res.json() as Promise<T>;
}
