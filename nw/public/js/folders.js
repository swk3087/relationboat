import {
  apiRequest,
  requireSession,
  appendAppNav,
  showMessage,
  clearMessage,
  formatError,
  logout,
  sortByName,
} from './common.js';

const root = document.querySelector('#app');
const logoutButton = document.querySelector('#logout-button');
const message = document.querySelector('#message');
const list = document.querySelector('#folder-list');
const createForm = document.querySelector('#create-folder-form');

const renderFolders = (folders) => {
  list.innerHTML = '';
  if (folders.length === 0) {
    list.innerHTML = '<p class="muted">폴더가 없습니다. 아래에서 새 폴더를 만드세요.</p>';
    return;
  }

  const sorted = sortByName(folders);
  for (const folder of sorted) {
    const item = document.createElement('article');
    item.className = 'list-item';
    item.innerHTML = `
      <h3>${folder.name}</h3>
      <p>ID: ${folder.id}</p>
      <p><a href="/people?folderId=${encodeURIComponent(folder.id)}">사람 화면으로 이동</a></p>
    `;
    list.append(item);
  }
};

const loadFolders = async () => {
  const folders = await apiRequest('/api/v1/folders');
  renderFolders(Array.isArray(folders) ? folders : []);
};

const init = async () => {
  await requireSession();
  appendAppNav(root);
  await loadFolders();

  createForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(message);

    const formData = new FormData(createForm);
    const name = (formData.get('name') || '').toString().trim();
    if (!name) {
      showMessage(message, '폴더 이름을 입력해주세요.', 'error');
      return;
    }

    try {
      await apiRequest('/api/v1/folders', {
        method: 'POST',
        body: { name },
      });
      createForm.reset();
      showMessage(message, '폴더를 생성했습니다.');
      await loadFolders();
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
