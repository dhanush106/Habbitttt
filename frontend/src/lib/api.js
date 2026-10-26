const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export async function apiRequest(path, { token, method = 'GET', body, signal } = {}) {
  const requestUrl = `${API_BASE}${path}`;
  const headers = new Headers();
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response;
  try {
    response = await fetch(requestUrl, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    console.error(`[API] ${method} ${requestUrl} failed before receiving a response: ${error.message}`, error);
    throw new Error(`Could not reach ${API_BASE}. Check that the backend is running and CORS allows this frontend origin.`, { cause: error });
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || 'The request could not be completed.');
    error.status = response.status;
    console.error(`[API] ${method} ${requestUrl} returned ${response.status}: ${error.message}`);
    throw error;
  }
  return payload;
}