import {
  apiRequest,
  requireSession,
  appendAppNav,
  showMessage,
  clearMessage,
  formatError,
  logout,
} from './common.js';

const root = document.querySelector('#app');
const message = document.querySelector('#message');
const storageModeInput = document.querySelector('#storage-mode');
const fontFamilyInput = document.querySelector('#font-family');
const fontFileUrlInput = document.querySelector('#font-file-url');
const saveForm = document.querySelector('#settings-form');
const fontsList = document.querySelector('#font-list');
const logoutButton = document.querySelector('#logout-button');

const renderFonts = (fonts) => {
  fontsList.innerHTML = '';

  if (!Array.isArray(fonts) || fonts.length === 0) {
    fontsList.innerHTML = '<p class="muted">기본 폰트 목록이 없습니다.</p>';
    return;
  }

  for (const font of fonts) {
    const item = document.createElement('article');
    item.className = 'list-item';
    item.innerHTML = `
      <h3>${font.family}</h3>
      <p>source: ${font.source}</p>
    `;
    fontsList.append(item);
  }
};

const ensureSyncOnly = async (settings) => {
  if (settings?.storageMode === 'sync') return settings;

  const updated = await apiRequest('/api/settings', {
    method: 'PATCH',
    body: { storageMode: 'sync' },
  });

  return updated;
};

const loadSettings = async () => {
  const settingsResponse = await apiRequest('/api/settings');
  const settings = await ensureSyncOnly(settingsResponse);

  storageModeInput.value = settings.storageMode || 'sync';
  fontFamilyInput.value = settings.fontFamily || '';
  fontFileUrlInput.value = settings.fontFileUrl || '';

  const fonts = await apiRequest('/api/settings/fonts');
  renderFonts(fonts);
};

const init = async () => {
  await requireSession();
  appendAppNav(root);
  await loadSettings();

  saveForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(message);

    try {
      await apiRequest('/api/settings', {
        method: 'PATCH',
        body: {
          storageMode: 'sync',
          fontFamily: fontFamilyInput.value.trim() || null,
          fontFileUrl: fontFileUrlInput.value.trim() || null,
        },
      });

      showMessage(message, '설정을 저장했습니다. (로컬 저장 비활성화, 서버 저장만 사용)');
    } catch (error) {
      showMessage(message, formatError(error), 'error');
    }
  });

  logoutButton.addEventListener('click', async () => {
    await logout();
  });
};

init().catch((error) => {
  showMessage(message, formatError(error), 'error');
});
