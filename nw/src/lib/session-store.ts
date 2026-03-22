import crypto from 'node:crypto';

type SessionPayload = {
  authenticated: true;
};

export type SessionRecord = SessionPayload & {
  createdAt: number;
  expiresAt: number;
};

class SessionStore {
  private readonly ttlMs: number;
  private readonly sessions = new Map<string, SessionRecord>();

  constructor(ttlMs: number) {
    this.ttlMs = ttlMs;
  }

  create(payload: SessionPayload): string {
    const id = crypto.randomUUID();
    const now = Date.now();
    this.sessions.set(id, {
      ...payload,
      createdAt: now,
      expiresAt: now + this.ttlMs,
    });
    return id;
  }

  get(id: string): SessionRecord | null {
    const session = this.sessions.get(id);
    if (!session) return null;
    if (session.expiresAt <= Date.now()) {
      this.sessions.delete(id);
      return null;
    }
    return session;
  }

  touch(id: string): void {
    const session = this.get(id);
    if (!session) return;
    session.expiresAt = Date.now() + this.ttlMs;
    this.sessions.set(id, session);
  }

  delete(id: string): void {
    this.sessions.delete(id);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt <= now) {
        this.sessions.delete(id);
      }
    }
  }
}

export const createSessionStore = (ttlMs: number): SessionStore => {
  const store = new SessionStore(ttlMs);
  setInterval(() => store.cleanup(), 60_000).unref();
  return store;
};
