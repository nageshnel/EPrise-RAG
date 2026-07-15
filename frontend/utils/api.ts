export function getGatewayUrl(): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('eprise_gatewayUrl');
      if (saved) return saved.trim();
    }
  } catch { /* ignore */ }
  return 'http://localhost:8080';
}

export function getAuthToken(): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('eprise_auth_token');
    }
  } catch { /* ignore */ }
  return null;
}

export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const gatewayUrl = getGatewayUrl();
  const token = getAuthToken();

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${gatewayUrl}${path.startsWith('/') ? path : '/' + path}`;
  return fetch(url, {
    ...options,
    headers,
  });
}
