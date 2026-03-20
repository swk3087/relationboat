import dotenv from 'dotenv';

dotenv.config();

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const nodeEnv = process.env.NODE_ENV ?? 'development';

export const config = {
  nodeEnv,
  port: parseNumber(process.env.PORT, 5000),
  appDomain: process.env.APP_DOMAIN ?? 'app.relationboat.kro.kr:5000',
  backendBaseUrl: process.env.BACKEND_BASE_URL ?? 'http://relationboat.kro.kr:4000/api/v1',
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
