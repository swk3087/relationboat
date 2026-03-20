import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config();

const root = process.cwd();

const required = (name: string, fallback?: string): string => {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
};

export const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  appOrigin: process.env.APP_ORIGIN ?? 'http://localhost:5000',
  apiPrefix: process.env.API_PREFIX ?? '/api/v1',
  serviceDomain: process.env.SERVICE_DOMAIN ?? 'relationboat.kro.kr:4000',
  databaseUrl: required('DATABASE_URL', 'postgresql://relationboat:relationboat@localhost:5432/relationboat?schema=public'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET', 'dev-access-secret'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET', 'dev-refresh-secret'),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  googleClientId: required('GOOGLE_CLIENT_ID', 'dev-google-client-id'),
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  googleRedirectUriDev: process.env.GOOGLE_REDIRECT_URI_DEV ?? 'http://localhost:4000/api/v1/auth/google/callback',
  googleRedirectUriProd: process.env.GOOGLE_REDIRECT_URI_PROD ?? 'https://relationboat.kro.kr:4000/api/v1/auth/google/callback',
  fileStorageRoot: path.resolve(root, process.env.FILE_STORAGE_ROOT ?? './uploads'),
  fontBaseUrl: process.env.FONT_BASE_URL ?? 'http://localhost:4000/uploads/fonts',
  defaultStorageMode: (process.env.DEFAULT_STORAGE_MODE ?? 'local_only') as 'local_only' | 'sync',
};
