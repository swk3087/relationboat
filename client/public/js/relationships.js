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
const fromSelect = document.querySelector('#from-person-id');
const toSelect = document.querySelector('#to-person-id');
const sourceSelect = document.querySelector('#source-id');
const targetSelect = document.querySelector('#target-id');
const createForm = document.querySelector('#create-relationship-form');
const searchForm = document.querySelector('#relationship-search-form');
const pathwayForm = document.querySelector('#pathway-form');
const relationshipList = document.querySelector('#relationship-list');
const pathwayOutput = document.querySelector('#pathway-output');

let currentFolderId = null;
let peopleInFolder = [];

const readFolderQuery = () => new URLSearchParams(window.location.search).get('folderId');

const syncFolderQuery = (folderId) => {
  const url = new URL(window.location.href);
  url.searchParams.set('folderId', folderId);
  window.history.replaceState({}, '', url);
};

const optionFromPeople = (select) => {
  select.innerHTML = '';
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = '선택';
  select.append(empty);

  for (const person of sortByName(peopleInFolder)) {
    const option = document.createElement('option');
    option.value = person.id;
    option.textContent = `${person.name} (${person.id.slice(0, 6)})`;
    select.append(option);
  }
};

const ensureFolder = async () => {
  const folders = await apiRequest('/api/folders');
  folderSelect.innerHTML = '';

  if (!Array.isArray(folders) || folders.length === 0) {
    folderSelect.innerHTML = '<option value="">폴더 없음</option>';
    currentFolderId = null;
    peopleInFolder = [];
    optionFromPeople(fromSelect);
    optionFromPeople(toSelect);
    optionFromPeople(sourceSelect);
    optionFromPeople(targetSelect);
    relationshipList.innerHTML = '<p class="muted">폴더를 먼저 생성해주세요.</p>';
    return;
  }

  const sortedFolders = sortByName(folders);
  for (const folder of sortedFolders) {
    const option = document.createElement('option');
    option.value = folder.id;
    option.textContent = folder.name;
    folderSelect.append(option);
  }

  const queryFolderId = readFolderQuery();
  currentFolderId = sortedFolders.some((folder) => folder.id === queryFolderId)
    ? queryFolderId
    : sortedFolders[0].id;

  folderSelect.value = currentFolderId;
  syncFolderQuery(currentFolderId);
};

const loadPeople = async () => {
  if (!currentFolderId) return;
  peopleInFolder = await apiRequest(`/api/folders/${encodeURIComponent(currentFolderId)}/people`);
  optionFromPeople(fromSelect);
  optionFromPeople(toSelect);
  optionFromPeople(sourceSelect);
  optionFromPeople(targetSelect);
};

const renderRelationships = (items) => {
  relationshipList.innerHTML = '';

  if (!items || items.length === 0) {
    relationshipList.innerHTML = '<p class="muted">관계 데이터가 없습니다.</p>';
    return;
  }

  for (const edge of items) {
    const item = document.createElement('article');
    item.className = 'list-item';
    const categories = edge.categories?.map((entry) => entry.category).join(', ') || '-';
    item.innerHTML = `
      <h3>${edge.title}</h3>
      <p>${edge.fromPerson?.name ?? edge.fromPersonId} -> ${edge.toPerson?.name ?? edge.toPersonId}</p>
      <p>카테고리: ${categories}</p>
      <p>메모: ${edge.memo || '없음'}</p>
    `;
    relationshipList.append(item);
  }
};

const loadRelationshipSearch = async () => {
  if (!currentFolderId) return;

  const params = new URLSearchParams();
  const formData = new FormData(searchForm);

  ['q', 'category', 'fromPersonId', 'toPersonId'].forEach((key) => {
    const value = (formData.get(key) || '').toString().trim();
    if (value) params.set(key, value);
  });

  const query = params.toString();
  const result = await apiRequest(
    `/api/folders/${encodeURIComponent(currentFolderId)}/relationships/search${query ? `?${query}` : ''}`,
  );

  renderRelationships(result);
};

const renderPathway = (payload) => {
  if (!payload) {
    pathwayOutput.textContent = '';
    return;
  }

  const lines = [];
  lines.push(`검색 깊이: ${payload.depth}`);
  lines.push(`경로 수: ${(payload.pathways || []).length}`);

  (payload.pathways || []).forEach((pathway, index) => {
    lines.push(`--- Path ${index + 1} ---`);
    lines.push(`노드: ${pathway.nodes.map((node) => `${node.name}(${node.id.slice(0, 6)})`).join(' -> ')}`);
    lines.push(`엣지: ${pathway.edges.map((edge) => `${edge.title}[${edge.fromPersonId.slice(0, 6)}->${edge.toPersonId.slice(0, 6)}]`).join(' | ')}`);
  });

  pathwayOutput.textContent = lines.join('\n');
};

const init = async () => {
  await requireSession();
  appendAppNav(root);
  await ensureFolder();
  await loadPeople();
  await loadRelationshipSearch();

  folderSelect.addEventListener('change', async () => {
    currentFolderId = folderSelect.value || null;
    if (currentFolderId) syncFolderQuery(currentFolderId);
    clearMessage(message);
    await loadPeople();
    await loadRelationshipSearch();
  });

  searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(message);
    await loadRelationshipSearch();
  });

  createForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(message);

    if (!currentFolderId) {
      showMessage(message, '폴더를 먼저 선택해주세요.', 'error');
      return;
    }

    const formData = new FormData(createForm);
    const title = (formData.get('title') || '').toString().trim();
    const fromPersonId = (formData.get('fromPersonId') || '').toString().trim();
    const toPersonId = (formData.get('toPersonId') || '').toString().trim();
    const memo = (formData.get('memo') || '').toString().trim();
    const categories = (formData.get('categories') || '')
      .toString()
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (!title || !fromPersonId || !toPersonId) {
      showMessage(message, 'from/to/제목을 모두 입력해주세요.', 'error');
      return;
    }

    try {
      await apiRequest(`/api/folders/${encodeURIComponent(currentFolderId)}/relationships`, {
        method: 'POST',
        body: {
          fromPersonId,
          toPersonId,
          title,
          memo: memo || null,
          categories,
        },
      });

      createForm.reset();
      showMessage(message, '관계를 생성했습니다.');
      await loadRelationshipSearch();
    } catch (error) {
      showMessage(message, formatError(error), 'error');
    }
  });

  pathwayForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(message);

    if (!currentFolderId) {
      showMessage(message, '폴더를 먼저 선택해주세요.', 'error');
      return;
    }

    const formData = new FormData(pathwayForm);
    const sourceId = (formData.get('sourceId') || '').toString().trim();
    const targetId = (formData.get('targetId') || '').toString().trim();
    const depth = Number((formData.get('depth') || '').toString().trim() || '3');

    if (!sourceId || !targetId) {
      showMessage(message, 'source/target를 선택해주세요.', 'error');
      return;
    }

    try {
      const params = new URLSearchParams({
        sourceId,
        targetId,
        depth: String(depth),
      });

      const payload = await apiRequest(
        `/api/folders/${encodeURIComponent(currentFolderId)}/pathways?${params.toString()}`,
      );

      renderPathway(payload);
    } catch (error) {
      showMessage(message, formatError(error), 'error');
    }
  });
};

init().catch((error) => {
  showMessage(message, formatError(error), 'error');
});
