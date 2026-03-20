import {
  apiRequest,
  requireSession,
  appendAppNav,
  showMessage,
  clearMessage,
  formatError,
} from './common.js';

const root = document.querySelector('#app');
const message = document.querySelector('#message');
const dateInput = document.querySelector('#memo-date');
const colorSelect = document.querySelector('#memo-color');
const intensityInput = document.querySelector('#memo-intensity');
const intensityLabel = document.querySelector('#memo-intensity-label');
const contentInput = document.querySelector('#memo-content');
const saveForm = document.querySelector('#memo-form');

const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'navy', 'purple', 'white', 'black'];

const todayDateString = () => {
  const now = new Date();
  return now.toISOString().slice(0, 10);
};

const resetForm = () => {
  contentInput.value = '';
  colorSelect.value = 'blue';
  intensityInput.value = '3';
  intensityLabel.textContent = '3';
};

const loadMemo = async () => {
  const selectedDate = dateInput.value;
  if (!selectedDate) return;

  try {
    const memo = await apiRequest(`/api/daily-memos?date=${encodeURIComponent(selectedDate)}`);
    if (!memo) {
      resetForm();
      showMessage(message, '해당 날짜 메모가 없습니다. 새로 작성할 수 있습니다.');
      return;
    }

    contentInput.value = memo.content || '';
    colorSelect.value = colors.includes(memo.color) ? memo.color : 'blue';
    intensityInput.value = String(memo.intensity ?? 3);
    intensityLabel.textContent = String(memo.intensity ?? 3);
    showMessage(message, '메모를 불러왔습니다.');
  } catch (error) {
    if (error.status === 404) {
      resetForm();
      showMessage(message, '메모가 없습니다.');
      return;
    }
    throw error;
  }
};

const init = async () => {
  await requireSession();
  appendAppNav(root);

  dateInput.value = todayDateString();
  colorSelect.innerHTML = colors.map((color) => `<option value="${color}">${color}</option>`).join('');
  await loadMemo();

  dateInput.addEventListener('change', async () => {
    clearMessage(message);
    await loadMemo();
  });

  intensityInput.addEventListener('input', () => {
    intensityLabel.textContent = intensityInput.value;
  });

  saveForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(message);

    const payload = {
      date: dateInput.value,
      content: contentInput.value.trim(),
      color: colorSelect.value,
      intensity: Number(intensityInput.value),
    };

    if (!payload.date || !payload.content) {
      showMessage(message, '날짜와 메모 내용은 필수입니다.', 'error');
      return;
    }

    try {
      await apiRequest('/api/daily-memos', {
        method: 'POST',
        body: payload,
      });
      showMessage(message, '메모를 저장했습니다.');
    } catch (error) {
      showMessage(message, formatError(error), 'error');
    }
  });
};

init().catch((error) => {
  showMessage(message, formatError(error), 'error');
});
