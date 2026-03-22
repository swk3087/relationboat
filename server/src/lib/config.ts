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
  appOrigin: process.env.APP_ORIGIN ?? ((process.env.NODE_ENV ?? 'development') === 'production' ? 'https://app.relationboat.kro.kr' : 'http://localhost:5000'),
  apiPrefix: process.env.API_PREFIX ?? '/api/v1',
  serviceDomain: process.env.SERVICE_DOMAIN ?? ((process.env.NODE_ENV ?? 'development') === 'production' ? 'relationboat.kro.kr' : 'relationboat.kro.kr:4000'),
  databaseUrl: required('DATABASE_URL', 'postgresql://relationboat:relationboat@localhost:5432/relationboat?schema=public'),
  singleUserEmail: required('SINGLE_USER_EMAIL', 'owner@relationboat.local'),
  singleUserName: process.env.SINGLE_USER_NAME ?? 'RelationBoat Owner',
  fileStorageRoot: path.resolve(root, process.env.FILE_STORAGE_ROOT ?? './uploads'),
  fontBaseUrl: process.env.FONT_BASE_URL ?? ((process.env.NODE_ENV ?? 'development') === 'production' ? 'https://relationboat.kro.kr/uploads/fonts' : 'http://localhost:4000/uploads/fonts'),
  defaultStorageMode: (process.env.DEFAULT_STORAGE_MODE ?? 'sync') as 'local_only' | 'sync',
};
