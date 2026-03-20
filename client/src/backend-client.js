import { config } from './config.js';

export class BackendHttpError extends Error {
  constructor(status, message, payload) {
    super(message);
    this.name = 'BackendHttpError';
    this.status = status;
    this.payload = payload;
  }
}

const toUrl = (path) => {
  const normalizedBase = config.backendBaseUrl.endsWith('/') ? config.backendBaseUrl : `${config.backendBaseUrl}/`;
  const safePath = path.startsWith('/') ? path.slice(1) : path;
  return new URL(safePath, normalizedBase).toString();
};

const parseJsonSafely = async (response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const hasContentType = (headers) =>
  Object.keys(headers).some((key) => key.toLowerCase() === 'content-type');

const buildRequestInit = ({ method, session, headers = {}, body }) => {
  const mergedHeaders = { ...headers };
  if (session?.accessToken) {
    mergedHeaders.Authorization = `Bearer ${session.accessToken}`;
  }

  const requestInit = {
    method,
    headers: mergedHeaders,
  };

  if (body === undefined || body === null) {
    return requestInit;
  }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (isFormData) {
    requestInit.body = body;
    return requestInit;
  }

  const isNodeReadableStream =
    typeof body === 'object' &&
    body !== null &&
    typeof body.pipe === 'function';
  if (isNodeReadableStream) {
    requestInit.body = body;
    requestInit.duplex = 'half';
    return requestInit;
  }

  if (typeof body === 'string' || body instanceof Uint8Array || body instanceof ArrayBuffer) {
    requestInit.body = body;
    return requestInit;
  }

  if (!hasContentType(mergedHeaders)) {
    mergedHeaders['Content-Type'] = 'application/json';
  }
  requestInit.body = JSON.stringify(body);
  return requestInit;
};

export const refreshAccessToken = async (session) => {
  if (!session?.refreshToken) return false;

  const response = await fetch(toUrl('auth/refresh'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.refreshToken}`,
    },
  });

  if (!response.ok) return false;

  const payload = await parseJsonSafely(response);
  if (!payload?.accessToken || !payload?.refreshToken) return false;

  session.accessToken = payload.accessToken;
  session.refreshToken = payload.refreshToken;
  return true;
};

export const requestBackend = async ({ method = 'GET', path, session, body, headers, tryRefresh = true }) => {
  const response = await fetch(toUrl(path), buildRequestInit({ method, session, headers, body }));

  if (response.status === 401 && tryRefresh && session) {
    const refreshed = await refreshAccessToken(session);
    if (refreshed) {
      return requestBackend({ method, path, session, body, headers, tryRefresh: false });
    }
  }

  const payload = await parseJsonSafely(response);
  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error ||
      `${method} ${path} failed with status ${response.status}`;
    throw new BackendHttpError(response.status, message, payload);
  }

  return payload;
};

export const loginWithGoogleIdToken = async (idToken) => {
  const payload = await requestBackend({
    method: 'POST',
    path: 'auth/google',
    body: { idToken },
    session: null,
    tryRefresh: false,
  });

  if (!payload?.tokens?.accessToken || !payload?.tokens?.refreshToken) {
    throw new BackendHttpError(502, 'Invalid auth response from backend', payload);
  }

  return payload;
};
