import fs from 'node:fs';
import path from 'node:path';
import { FastifyReply, FastifyRequest } from 'fastify';
import { buildApp } from './app.js';
import { config } from './lib/config.js';

const pageNames = ['login', 'folders', 'people', 'relationships', 'memos', 'settings', 'contacts'] as const;

const start = async () => {
  fs.mkdirSync(config.fileStorageRoot, { recursive: true });
  fs.mkdirSync(path.join(config.fileStorageRoot, 'fonts'), { recursive: true });

  const app = buildApp();
  app.register(import('@fastify/static'), {
    root: config.fileStorageRoot,
    prefix: '/uploads/',
    decorateReply: false,
    maxAge: config.isProduction ? '1h' : 0,
    immutable: false,
  });

  app.register(import('@fastify/static'), {
    root: config.publicRoot,
    prefix: '/',
    index: false,
    maxAge: config.isProduction ? '1h' : 0,
    immutable: false,
  });

  app.get('/', async (request, reply) => {
    if (request.session?.authenticated) {
      return reply.redirect('/folders');
    }
    return reply.redirect('/login');
  });

  const sendPage = (name: (typeof pageNames)[number]) =>
    async (_request: FastifyRequest, reply: FastifyReply) =>
      reply.type('text/html; charset=utf-8').sendFile(`pages/${name}.html`);

  app.get('/login', sendPage('login'));
  app.get('/folders', sendPage('folders'));
  app.get('/people', sendPage('people'));
  app.get('/relationships', sendPage('relationships'));
  app.get('/memos', sendPage('memos'));
  app.get('/settings', sendPage('settings'));
  app.get('/contacts', sendPage('contacts'));

  await app.listen({ port: config.port, host: '0.0.0.0' });
};

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
