import crypto from 'node:crypto';

class SessionStore {
  constructor(ttlMs) {
    this.ttlMs = ttlMs;
    this.sessions = new Map();
  }

  create(payload) {
    const id = crypto.randomUUID();
    const now = Date.now();
    this.sessions.set(id, {
      ...payload,
      createdAt: now,
      expiresAt: now + this.ttlMs,
    });
    return id;
  }

  get(id) {
    const session = this.sessions.get(id);
    if (!session) return null;
    if (session.expiresAt <= Date.now()) {
      this.sessions.delete(id);
      return null;
    }
    return session;
  }

  touch(id) {
    const session = this.get(id);
    if (!session) return;
    session.expiresAt = Date.now() + this.ttlMs;
    this.sessions.set(id, session);
  }

  update(id, update) {
    const session = this.get(id);
    if (!session) return null;
    const next = { ...session, ...update, expiresAt: Date.now() + this.ttlMs };
    this.sessions.set(id, next);
    return next;
  }

  delete(id) {
    this.sessions.delete(id);
  }

  cleanup() {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt <= now) {
        this.sessions.delete(id);
      }
    }
  }
}

export const createSessionStore = (ttlMs) => {
  const store = new SessionStore(ttlMs);
  setInterval(() => store.cleanup(), 60_000).unref();
  return store;
};
