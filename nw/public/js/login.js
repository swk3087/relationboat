import { apiRequest, showMessage, clearMessage } from './common.js';

const form = document.querySelector('#login-form');
const passwordInput = document.querySelector('#password');
const submitButton = document.querySelector('#login-button');
const message = document.querySelector('#message');

const goToAppIfLoggedIn = async () => {
  try {
    await apiRequest('/api/auth/session');
    window.location.href = '/folders';
    return true;
  } catch {
    return false;
  }
};

const setup = async () => {
  if (await goToAppIfLoggedIn()) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage(message);
    submitButton.disabled = true;

    try {
      await apiRequest('/api/auth/login', {
        method: 'POST',
        body: { password: passwordInput.value },
      });

      window.location.href = '/folders';
    } catch (error) {
      showMessage(message, error.message || '비밀번호 인증에 실패했습니다.', 'error');
      submitButton.disabled = false;
      passwordInput.focus();
      passwordInput.select();
    }
  });
};

setup().catch((error) => {
  showMessage(message, error.message || '로그인 초기화 중 오류가 발생했습니다.', 'error');
});
