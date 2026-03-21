import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { apiRequest, showMessage, clearMessage } from './common.js';

const message = document.querySelector('#message');
const loginButton = document.querySelector('#google-login-button');

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

  const firebaseConfigResponse = await apiRequest('/api/firebase/config');
  if (!firebaseConfigResponse.enabled) {
    loginButton.disabled = true;
    showMessage(
      message,
      'Firebase 설정값이 비어 있습니다. /client/.env 에 FIREBASE_* 값을 입력 후 서버를 재시작하세요.',
      'error',
    );
    return;
  }

  const app = initializeApp(firebaseConfigResponse.firebase);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  loginButton.addEventListener('click', async () => {
    clearMessage(message);
    loginButton.disabled = true;

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const idToken = credential?.idToken;

      if (!idToken) {
        throw new Error('Google ID 토큰을 가져오지 못했습니다. 다시 시도해주세요.');
      }

      await apiRequest('/api/auth/google', {
        method: 'POST',
        body: { idToken },
      });

      window.location.href = '/folders';
    } catch (error) {
      showMessage(message, error.message || 'Google 로그인에 실패했습니다.', 'error');
      loginButton.disabled = false;
    }
  });
};

setup().catch((error) => {
  showMessage(message, error.message || '로그인 초기화 중 오류가 발생했습니다.', 'error');
});
