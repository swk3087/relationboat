import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cookieParser from 'cookie-parser';
import {
  requestBackend,
  loginWithGoogleIdToken,
  refreshAccessToken,
  BackendHttpError,
} from './backend-client.js';
import { config, inferBackendBaseUrl } from './config.js';
import { createSessionStore } from './session-store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '..', 'public');
const pagesDir = path.join(publicDir, 'pages');

const app = express();
const sessionStore = createSessionStore(config.sessionTtlMs);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  const sessionId = req.cookies[config.cookieName];
  if (!sessionId) {
    req.session = null;
    req.sessionId = null;
    return next();
  }

  const session = sessionStore.get(sessionId);
  if (!session) {
    res.clearCookie(config.cookieName);
    req.session = null;
    req.sessionId = null;
    return next();
  }

  sessionStore.touch(sessionId);
  req.sessionId = sessionId;
  req.session = session;
  return next();
});

const asyncRoute = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const requireSession = (req, res, next) => {
  if (!req.session) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }
  return next();
};

const toQueryString = (query) => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry !== undefined && entry !== null && entry !== '') {
          params.append(key, String(entry));
        }
      });
      continue;
    }
    params.set(key, String(value));
  }

  const encoded = params.toString();
  return encoded ? `?${encoded}` : '';
};

const sendPage = (name) => (req, res) => {
  res.sendFile(path.join(pagesDir, `${name}.html`));
};

const proxyJson = async ({ req, res, method, path: backendPath, body }) => {
  const baseUrl = inferBackendBaseUrl(req);
  const payload = await requestBackend({
    method,
    path: backendPath,
    session: req.session,
    body,
    baseUrl,
  });

  if (payload === null) {
    res.status(204).end();
    return;
  }

  res.json(payload);
};

app.post('/api/auth/google', asyncRoute(async (req, res) => {
  const { idToken } = req.body ?? {};
  if (!idToken || typeof idToken !== 'string') {
    return res.status(400).json({ message: 'idToken is required' });
  }

  const payload = await loginWithGoogleIdToken(idToken, inferBackendBaseUrl(req));
  const sessionId = sessionStore.create({
    accessToken: payload.tokens.accessToken,
    refreshToken: payload.tokens.refreshToken,
    user: payload.user,
  });

  res.cookie(config.cookieName, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: config.sessionTtlMs,
  });

  return res.json({ user: payload.user });
}));

app.get('/api/auth/session', (req, res) => {
  if (!req.session) {
    return res.status(401).json({ message: '로그인 세션이 없습니다.' });
  }

  return res.json({ user: req.session.user });
});

app.post('/api/auth/logout', (req, res) => {
  if (req.sessionId) {
    sessionStore.delete(req.sessionId);
  }

  res.clearCookie(config.cookieName);
  return res.status(204).end();
});

app.get('/api/firebase/config', (req, res) => {
  const firebase = { ...config.firebase };
  const enabled = Object.values(firebase).every((value) => Boolean(value));
  res.json({ enabled, firebase });
});

app.get('/api/folders', requireSession, asyncRoute(async (req, res) => {
  await proxyJson({ req, res, method: 'GET', path: 'folders' });
}));

app.post('/api/folders', requireSession, asyncRoute(async (req, res) => {
  await proxyJson({ req, res, method: 'POST', path: 'folders', body: req.body });
}));

app.get('/api/folders/:folderId/people', requireSession, asyncRoute(async (req, res) => {
  await proxyJson({ req, res, method: 'GET', path: `folders/${req.params.folderId}/people` });
}));

app.post('/api/folders/:folderId/people', requireSession, asyncRoute(async (req, res) => {
  await proxyJson({ req, res, method: 'POST', path: `folders/${req.params.folderId}/people`, body: req.body });
}));

app.get('/api/folders/:folderId/search/people', requireSession, asyncRoute(async (req, res) => {
  const query = toQueryString(req.query);
  await proxyJson({ req, res, method: 'GET', path: `folders/${req.params.folderId}/search/people${query}` });
}));

app.post('/api/folders/:folderId/relationships', requireSession, asyncRoute(async (req, res) => {
  await proxyJson({ req, res, method: 'POST', path: `folders/${req.params.folderId}/relationships`, body: req.body });
}));

app.get('/api/folders/:folderId/relationships/search', requireSession, asyncRoute(async (req, res) => {
  const query = toQueryString(req.query);
  await proxyJson({ req, res, method: 'GET', path: `folders/${req.params.folderId}/relationships/search${query}` });
}));

app.get('/api/folders/:folderId/pathways', requireSession, asyncRoute(async (req, res) => {
  const query = toQueryString(req.query);
  await proxyJson({ req, res, method: 'GET', path: `folders/${req.params.folderId}/pathways${query}` });
}));

app.get('/api/daily-memos', requireSession, asyncRoute(async (req, res) => {
  const query = toQueryString(req.query);
  await proxyJson({ req, res, method: 'GET', path: `daily-memos${query}` });
}));

app.post('/api/daily-memos', requireSession, asyncRoute(async (req, res) => {
  await proxyJson({ req, res, method: 'POST', path: 'daily-memos', body: req.body });
}));

app.get('/api/settings', requireSession, asyncRoute(async (req, res) => {
  await proxyJson({ req, res, method: 'GET', path: 'settings' });
}));

app.patch('/api/settings', requireSession, asyncRoute(async (req, res) => {
  await proxyJson({ req, res, method: 'PATCH', path: 'settings', body: req.body });
}));

app.get('/api/settings/fonts', requireSession, asyncRoute(async (req, res) => {
  await proxyJson({ req, res, method: 'GET', path: 'settings/fonts' });
}));

app.post('/api/folders/:folderId/contacts/import', requireSession, asyncRoute(async (req, res) => {
  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('multipart/form-data')) {
    return res.status(400).json({ message: 'multipart/form-data 형식의 VCF 파일이 필요합니다.' });
  }

  const baseUrl = inferBackendBaseUrl(req);
  await refreshAccessToken(req.session, baseUrl);

  const payload = await requestBackend({
    method: 'POST',
    path: `folders/${req.params.folderId}/contacts/import`,
    session: req.session,
    headers: { 'Content-Type': contentType },
    body: req,
    tryRefresh: false,
    baseUrl,
  });

  return res.json(payload);
}));

app.get('/', (req, res) => {
  if (req.session) {
    return res.redirect('/folders');
  }
  return res.redirect('/login');
});

app.get('/login', sendPage('login'));
app.get('/folders', sendPage('folders'));
app.get('/people', sendPage('people'));
app.get('/relationships', sendPage('relationships'));
app.get('/memos', sendPage('memos'));
app.get('/settings', sendPage('settings'));
app.get('/contacts', sendPage('contacts'));

app.use(express.static(publicDir));

app.use((error, req, res, next) => {
  if (error instanceof BackendHttpError) {
    return res.status(error.status).json(
      error.payload ?? {
        statusCode: error.status,
        message: error.message,
      },
    );
  }

  console.error(error);
  return res.status(500).json({ message: '클라이언트 서버 내부 오류' });
});

app.listen(config.port, '0.0.0.0', () => {
  console.log(`RelationBoat client is running on port ${config.port} (${config.appDomain})`);
});
