import dotenv from 'dotenv';

dotenv.config();

const LOCAL_APP_DOMAIN = 'localhost:5000';
const PUBLIC_APP_DOMAIN = 'app.relationboat.kro.kr';
const LOCAL_BACKEND_BASE_URL = 'http://localhost:4000/api/v1';
const PUBLIC_BACKEND_BASE_URL = 'https://relationboat.kro.kr/api/v1';

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';
const isLocalHost = (value) => {
  if (!value) return false;
  return /(^|:\/\/)(localhost|127\.0\.0\.1)(:\d+)?($|\/)/i.test(value);
};

const normalizeForwardedValue = (value) => value?.split(',')[0]?.trim() ?? '';
const parseUrlSafely = (value) => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const toPublicBackendHost = (requestHost) => {
  if (!requestHost || isLocalHost(requestHost)) {
    return '';
  }

  const hostname = requestHost.replace(/:\d+$/, '');
  return hostname === PUBLIC_APP_DOMAIN ? 'relationboat.kro.kr' : hostname.startsWith('app.') ? hostname.slice(4) : hostname;
};

const shouldUseConfiguredBackendBaseUrl = (backendBaseUrl, requestHost) => {
  if (!backendBaseUrl) return false;

  if (!requestHost || isLocalHost(requestHost)) {
    return true;
  }

  const parsed = parseUrlSafely(backendBaseUrl);
  if (!parsed) {
    return true;
  }

  const publicBackendHost = toPublicBackendHost(requestHost);
  return !(parsed.port === '4000' && parsed.hostname === publicBackendHost);
};

export const inferBackendBaseUrl = (req) => {
  const forwardedHost = normalizeForwardedValue(req?.get?.('x-forwarded-host'));
  const hostHeader = normalizeForwardedValue(req?.get?.('host'));
  const host = (forwardedHost || hostHeader).toLowerCase();

  if (shouldUseConfiguredBackendBaseUrl(process.env.BACKEND_BASE_URL, host)) {
    return process.env.BACKEND_BASE_URL;
  }

  if (!host || isLocalHost(host)) {
    return LOCAL_BACKEND_BASE_URL;
  }

  const forwardedProto = normalizeForwardedValue(req?.get?.('x-forwarded-proto')).toLowerCase();
  const protocol = forwardedProto || 'https';
  const backendHost = toPublicBackendHost(host);
  return `${protocol}://${backendHost}/api/v1`;
};

export const config = {
  nodeEnv,
  port: parseNumber(process.env.PORT, 5000),
  appDomain: process.env.APP_DOMAIN ?? (isProduction ? PUBLIC_APP_DOMAIN : LOCAL_APP_DOMAIN),
  backendBaseUrl: process.env.BACKEND_BASE_URL ?? (isProduction ? PUBLIC_BACKEND_BASE_URL : LOCAL_BACKEND_BASE_URL),
  cookieName: 'rb.sid',
  cookieSecure: (process.env.COOKIE_SECURE ?? (nodeEnv === 'production' ? 'true' : 'false')) === 'true',
  sessionTtlMs: parseNumber(process.env.SESSION_TTL_MS, 1000 * 60 * 60 * 24 * 14),
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY ?? '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN ?? '',
    projectId: process.env.FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.FIREBASE_APP_ID ?? '',
  },
};
