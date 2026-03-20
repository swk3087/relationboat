import {
  apiRequest,
  requireSession,
  appendAppNav,
  showMessage,
  clearMessage,
  formatError,
  sortByName,
} from './common.js';

const root = document.querySelector('#app');
const message = document.querySelector('#message');
const folderSelect = document.querySelector('#folder-select');
const uploadForm = document.querySelector('#upload-form');
const previewList = document.querySelector('#import-preview');

const readFolderQuery = () => new URLSearchParams(window.location.search).get('folderId');

const syncFolderQuery = (folderId) => {
  const url = new URL(window.location.href);
  url.searchParams.set('folderId', folderId);
  window.history.replaceState({}, '', url);
};

const loadFolders = async () => {
  const folders = await apiRequest('/api/folders');
  folderSelect.innerHTML = '';

  if (!Array.isArray(folders) || folders.length === 0) {
    folderSelect.innerHTML = '<option value="">폴더 없음</option>';
    return null;
  }

  const sorted = sortByName(folders);
  for (const folder of sorted) {
    const option = document.createElement('option');
    option.value = folder.id;
    option.textContent = folder.name;
    folderSelect.append(option);
  }

  const queryFolder = readFolderQuery();
  const folderId = sorted.some((folder) => folder.id === queryFolder)
    ? queryFolder
    : sorted[0].id;

  folderSelect.value = folderId;
  syncFolderQuery(folderId);
  return folderId;
};

const renderPreview = (preview) => {
  previewList.innerHTML = '';

  if (!Array.isArray(preview) || preview.length === 0) {
    previewList.innerHTML = '<p class="muted">새로 추가된 연락처가 없습니다.</p>';
    return;
  }

  for (const person of preview) {
    const item = document.createElement('article');
    item.className = 'list-item';
    item.innerHTML = `
      <h3>${person.name}</h3>
      <p>전화번호: ${person.phone || '없음'}</p>
      <p>메모: ${person.memo || '없음'}</p>
    `;
    previewList.append(item);
  }
};

const init = async () => {
  await requireSession();
  appendAppNav(root);
  await loadFolders();

  folderSelect.addEventListener('change', () => {
    if (folderSelect.value) {
      syncFolderQuery(folderSelect.value);
    }
  });

  uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(message);

    const folderId = folderSelect.value;
    const formData = new FormData(uploadForm);
    const file = formData.get('file');

    if (!folderId) {
      showMessage(message, '폴더를 먼저 선택해주세요.', 'error');
      return;
    }

    if (!(file instanceof File) || file.size === 0) {
      showMessage(message, 'VCF 파일을 선택해주세요.', 'error');
      return;
    }

    const body = new FormData();
    body.append('file', file);

    try {
      const response = await apiRequest(`/api/folders/${encodeURIComponent(folderId)}/contacts/import`, {
        method: 'POST',
        body,
      });

      renderPreview(response.preview || []);
      showMessage(
        message,
        `감지 ${response.detected}건 / 추가 ${response.imported}건 / 중복 건너뜀 ${response.skippedDuplicates}건`,
      );
    } catch (error) {
      showMessage(message, formatError(error), 'error');
    }
  });
};

init().catch((error) => {
  showMessage(message, formatError(error), 'error');
});
