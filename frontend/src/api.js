const BASE = (import.meta.env.VITE_API_URL || '') + '/api';

const getToken = () => localStorage.getItem('hf_token');

const buildHeaders = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: buildHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    localStorage.removeItem('hf_token');
    localStorage.removeItem('hf_user');
    if (!window.location.pathname.includes('/login')) window.location.href = '/login';
  }

  if (!res.ok) {
    const error = new Error(data.message || `Error ${res.status}`);
    error.status = res.status;
    throw error;
  }
  return data;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};
