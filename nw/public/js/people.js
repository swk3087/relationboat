import {
  apiRequest,
  requireSession,
  appendAppNav,
  showMessage,
  clearMessage,
  formatError,
  toText,
  sortByName,
} from './common.js';

const root = document.querySelector('#app');
const message = document.querySelector('#message');
const folderSelect = document.querySelector('#folder-select');
const list = document.querySelector('#people-list');
const createForm = document.querySelector('#create-person-form');
const searchForm = document.querySelector('#search-form');

let currentFolderId = null;
let allPeople = [];

const queryParamFolderId = () => new URLSearchParams(window.location.search).get('folderId');

const syncFolderQuery = (folderId) => {
  const url = new URL(window.location.href);
  url.searchParams.set('folderId', folderId);
  window.history.replaceState({}, '', url);
};

const renderPeople = (people) => {
  list.innerHTML = '';

  if (people.length === 0) {
    list.innerHTML = '<p class="muted">조건에 맞는 사람이 없습니다.</p>';
    return;
  }

  for (const person of sortByName(people)) {
    const item = document.createElement('article');
    item.className = 'list-item';
    item.innerHTML = `
      <h3>${person.name}</h3>
      <p>전화번호: ${toText(person.phone) || '없음'}</p>
      <p>메모: ${toText(person.memo) || '없음'}</p>
    `;
    list.append(item);
  }
};

const filterLocally = () => {
  const formData = new FormData(searchForm);
  const q = (formData.get('q') || '').toString().trim().toLowerCase();
  const phone = (formData.get('phone') || '').toString().trim().toLowerCase();
  const memo = (formData.get('memo') || '').toString().trim().toLowerCase();

  const filtered = allPeople.filter((person) => {
    if (q && !person.name.toLowerCase().includes(q)) return false;
    if (phone && !toText(person.phone).toLowerCase().includes(phone)) return false;
    if (memo && !toText(person.memo).toLowerCase().includes(memo)) return false;
    return true;
  });

  renderPeople(filtered);
};

const loadPeople = async () => {
  if (!currentFolderId) return;

  const formData = new FormData(searchForm);
  const q = (formData.get('q') || '').toString().trim();
  const category = (formData.get('category') || '').toString().trim();

  if (q || category) {
    const query = new URLSearchParams();
    if (q) query.set('q', q);
    if (category) query.set('category', category);
    allPeople = await apiRequest(`/api/v1/folders/${encodeURIComponent(currentFolderId)}/search/people?${query.toString()}`);
    filterLocally();
    return;
  }

  allPeople = await apiRequest(`/api/v1/folders/${encodeURIComponent(currentFolderId)}/people`);
  filterLocally();
};

const loadFolders = async () => {
  const folders = await apiRequest('/api/v1/folders');
  folderSelect.innerHTML = '';

  if (!Array.isArray(folders) || folders.length === 0) {
    folderSelect.innerHTML = '<option value="">폴더 없음</option>';
    currentFolderId = null;
    allPeople = [];
    renderPeople([]);
    return;
  }

  for (const folder of sortByName(folders)) {
    const option = document.createElement('option');
    option.value = folder.id;
    option.textContent = folder.name;
    folderSelect.append(option);
  }

  const initialId = queryParamFolderId();
  currentFolderId = folders.some((folder) => folder.id === initialId) ? initialId : folders[0].id;
  folderSelect.value = currentFolderId;
  syncFolderQuery(currentFolderId);
  await loadPeople();
};

const init = async () => {
  await requireSession();
  appendAppNav(root);
  await loadFolders();

  folderSelect.addEventListener('change', async () => {
    currentFolderId = folderSelect.value || null;
    if (currentFolderId) syncFolderQuery(currentFolderId);
    clearMessage(message);
    await loadPeople();
  });

  searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(message);
    await loadPeople();
  });

  searchForm.addEventListener('input', () => {
    filterLocally();
  });

  createForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(message);

    if (!currentFolderId) {
      showMessage(message, '먼저 폴더를 생성해주세요.', 'error');
      return;
    }

    const formData = new FormData(createForm);
    const name = (formData.get('name') || '').toString().trim();
    const phone = (formData.get('phone') || '').toString().trim();
    const memo = (formData.get('memo') || '').toString().trim();

    if (!name) {
      showMessage(message, '이름은 필수입니다.', 'error');
      return;
    }

    try {
      await apiRequest(`/api/v1/folders/${encodeURIComponent(currentFolderId)}/people`, {
        method: 'POST',
        body: {
          name,
          phone: phone || null,
          memo: memo || null,
        },
      });
      createForm.reset();
      showMessage(message, '사람을 추가했습니다.');
      await loadPeople();
    } catch (error) {
      showMessage(message, formatError(error), 'error');
    }
  });
};

init().catch((error) => {
  showMessage(message, formatError(error), 'error');
});
