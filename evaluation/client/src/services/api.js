// All HTTP calls go through here so components never touch fetch directly.

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function requestJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, {
      // include so the session cookie is sent even when the client and API
      // are served from different origins.
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    // fetch only rejects on a transport failure; give callers an ApiError
    // like every other path instead of a raw TypeError.
    throw new ApiError(0, 'Network error. Please check your connection and try again.');
  }

  // 204 has no body to parse
  const body =
    response.status === 204 ? {} : await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, body.error || 'Request failed.');
  }
  return body;
}

export function login(loginName, password) {
  return requestJson('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ loginName, password }),
  });
}

export function logout() {
  return requestJson('/api/auth/logout', { method: 'POST' });
}

export function getCurrentUser() {
  return requestJson('/api/auth/me');
}

export function getBasket() {
  return requestJson('/api/basket');
}

export function addToBasket(name, type, quantity) {
  return requestJson('/api/basket', {
    method: 'POST',
    body: JSON.stringify({ name, type, quantity }),
  });
}

export function removeFromBasket(basketId) {
  return requestJson(`/api/basket/${basketId}`, { method: 'DELETE' });
}

export function suggestProducts(name, type) {
  const params = new URLSearchParams({ name });
  if (type) {
    params.set('type', type);
  }
  return requestJson(`/api/products/suggestions?${params}`);
}
