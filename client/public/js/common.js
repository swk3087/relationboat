const activeRoute = window.location.pathname;

const navItems = [
  { path: '/folders', label: '폴더' },
  { path: '/people', label: '사람' },
  { path: '/relationships', label: '관계' },
  { path: '/memos', label: '메모' },
  { path: '/settings', label: '설정' },
  { path: '/contacts', label: '연락처' },
];

export const createBottomNav = () => {
  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';

  for (const item of navItems) {
    const link = document.createElement('a');
    link.href = item.path;
    link.textContent = item.label;
    if (activeRoute === item.path) {
      link.classList.add('active');
    }
    nav.append(link);
  }

  return nav;
};

export const formatError = (error) => {
  if (!error) return '알 수 없는 오류';
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return '알 수 없는 오류';
};

export const showMessage = (element, text, type = 'info') => {
  element.className = type === 'error' ? 'alert error' : 'alert';
  element.textContent = text;
  element.classList.remove('hidden');
};

export const clearMessage = (element) => {
  element.textContent = '';
  element.classList.add('hidden');
};

export const apiRequest = async (path, options = {}) => {
  const response = await fetch(path, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers ?? {}),
    },
    body:
      options.body === undefined
        ? undefined
        : options.body instanceof FormData
          ? options.body
          : JSON.stringify(options.body),
  });

  if (response.status === 204) return null;

  const text = await response.text();
  let payload = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const message = payload?.message || payload?.error || `요청 실패 (${response.status})`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
};

export const requireSession = async () => {
  try {
    const session = await apiRequest('/api/auth/session');
    return session;
  } catch (error) {
    if (error?.status === 401) {
      window.location.href = '/login';
      return null;
    }
    throw error;
  }
};

export const logout = async () => {
  await apiRequest('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login';
};

export const appendAppNav = (rootElement) => {
  rootElement.append(createBottomNav());
};

export const toText = (value) => (value === null || value === undefined ? '' : String(value));

export const sortByName = (items) => [...items].sort((a, b) => a.name.localeCompare(b.name, 'ko'));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
