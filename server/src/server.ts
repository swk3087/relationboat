import fs from 'node:fs';
import path from 'node:path';
import { buildApp } from './app.js';
import { config } from './lib/config.js';

const start = async () => {
  fs.mkdirSync(config.fileStorageRoot, { recursive: true });
  fs.mkdirSync(path.join(config.fileStorageRoot, 'fonts'), { recursive: true });

  const app = buildApp();
  app.register(import('@fastify/static'), {
    root: config.fileStorageRoot,
    prefix: '/uploads/',
  });

  await app.listen({ port: config.port, host: '0.0.0.0' });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
