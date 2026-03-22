import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config();

const root = process.cwd();
const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';

const required = (name: string, fallback?: string): string => {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
};

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const appDomain = process.env.APP_DOMAIN ?? (isProduction ? 'app.relationboat.kro.kr' : 'localhost:5000');
const appProtocol = isProduction ? 'https' : 'http';

export const config = {
  nodeEnv,
  isProduction,
  port: parseNumber(process.env.PORT, 5000),
  appDomain,
  appOrigin: process.env.APP_ORIGIN ?? `${appProtocol}://${appDomain}`,
  apiPrefix: process.env.API_PREFIX ?? '/api/v1',
  serviceDomain: process.env.SERVICE_DOMAIN ?? appDomain,
  databaseUrl: required('DATABASE_URL', 'postgresql://relationboat:relationboat@localhost:5432/relationboat?schema=public'),
  singleUserEmail: required('SINGLE_USER_EMAIL', 'owner@relationboat.local'),
  singleUserName: process.env.SINGLE_USER_NAME ?? 'RelationBoat Owner',
  fileStorageRoot: path.resolve(root, process.env.FILE_STORAGE_ROOT ?? './uploads'),
  publicRoot: path.resolve(root, process.env.PUBLIC_ROOT ?? './public'),
  fontBaseUrl: process.env.FONT_BASE_URL ?? `${appProtocol}://${appDomain}/uploads/fonts`,
  defaultStorageMode: (process.env.DEFAULT_STORAGE_MODE ?? 'sync') as 'local_only' | 'sync',
  appPassword: required('APP_PASSWORD', 'change-me'),
  cookieName: process.env.COOKIE_NAME ?? 'rb.sid',
  cookieSecure: (process.env.COOKIE_SECURE ?? (isProduction ? 'true' : 'false')) === 'true',
  sessionTtlMs: parseNumber(process.env.SESSION_TTL_MS, 1000 * 60 * 60 * 24 * 14),
};
