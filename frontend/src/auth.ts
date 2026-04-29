export const TOKEN_STORAGE_KEY = 'applytrack_token';

export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
}

export function buildApiUrl(path: string) {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Prevent duplicated prefix when both base and path include /api
  if (base.endsWith('/api') && normalizedPath.startsWith('/api/')) {
    return `${base}${normalizedPath.slice(4)}`;
  }

  if (!base) {
    return normalizedPath;
  }

  return `${base}${normalizedPath}`;
}

export function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const isFormDataBody = typeof FormData !== 'undefined' && init?.body instanceof FormData;

  const headers = new Headers(init?.headers ?? {});
  if (!isFormDataBody) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error ?? 'Request failed.');
  }

  return payload as T;
}
