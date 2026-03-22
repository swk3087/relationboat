import { config } from './config.js';

export class BackendHttpError extends Error {
  constructor(status, message, payload) {
    super(message);
    this.name = 'BackendHttpError';
    this.status = status;
    this.payload = payload;
  }
}

const toUrl = (path, baseUrl = config.backendBaseUrl) => {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
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

const fetchBackend = async (url, init) => {
  try {
    return await fetch(url, init);
  } catch (error) {
    throw new BackendHttpError(502, 'Backend service is unavailable', {
      message: '백엔드 서버에 연결할 수 없습니다.',
      detail: error instanceof Error ? error.message : String(error),
      url,
    });
  }
};

const hasContentType = (headers) =>
  Object.keys(headers).some((key) => key.toLowerCase() === 'content-type');

const buildRequestInit = ({ method, headers = {}, body }) => {
  const mergedHeaders = { ...headers };
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

export const requestBackend = async ({ method = 'GET', path, body, headers, baseUrl }) => {
  const response = await fetchBackend(toUrl(path, baseUrl), buildRequestInit({ method, headers, body }));

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
