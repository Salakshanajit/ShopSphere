// Small wrapper around fetch(): adds the JWT, parses JSON and turns failures into ApiError.
const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'shopsphere_token';

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable - the user simply has to log in again next time */
  }
};

export class ApiError extends Error {
  constructor(message, status = 0, errors = null, code = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors; // field-by-field messages from the server validation
    this.code = code;
  }
}

// AuthContext registers a function here that logs the user out when the token is rejected.
let onUnauthorized = null;
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

export async function request(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Make sure the backend is running (npm run dev in the server folder).');
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    /* response was not JSON */
  }

  if (!response.ok || (payload && payload.success === false)) {
    const message =
      (payload && payload.message) ||
      (response.status >= 500
        ? 'The server is not responding. Make sure the backend and MySQL are running.'
        : `Request failed (${response.status}).`);
    const error = new ApiError(message, response.status, payload && payload.errors, payload && payload.code);
    // A rejected token means the session ended: log the user out (except on the login form itself).
    if (response.status === 401 && token && onUnauthorized && !path.startsWith('/auth/login')) {
      onUnauthorized(error);
    }
    throw error;
  }

  return payload ? payload.data : null;
}
