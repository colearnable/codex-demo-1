const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const experienceCards = document.querySelectorAll('.timeline article');
experienceCards.forEach((card) => {
  const toggle = () => {
    const isActive = card.classList.toggle('active');
    card.setAttribute('aria-expanded', isActive ? 'true' : 'false');
  };

  card.addEventListener('click', toggle);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
    }
  });
});

(function setupCoinSlot() {
  const STORAGE_KEY = 'coin-slot-unlocked';
  const PROMPT_PATH = 'prompt.html';
  const TAP_TARGET = 5;
  const TAP_WINDOW_MS = 6000;
  const TOAST_AUTO_MS = 6000;
  const COIN_SFX = 'assets/coin.mp3';
  const SUCCESS_SFX = 'assets/success.mp3';
  const MAX_VOLUME = 0.75;
  const COIN_VOLUME = 0.5;
  const SUCCESS_VOLUME = 0.55;
  const safeVolume = (v) => Math.min(MAX_VOLUME, Math.max(0, v));

  const coinSeed = new Audio(COIN_SFX);
  coinSeed.preload = 'auto';
  const successSeed = new Audio(SUCCESS_SFX);
  successSeed.preload = 'auto';

  function playCoin() {
    try {
      const sfx = coinSeed.cloneNode(true);
      sfx.volume = safeVolume(COIN_VOLUME);
      sfx.play().catch(() => {});
    } catch (e) {}
  }
  function playSuccess(delayMs) {
    setTimeout(() => {
      try {
        const sfx = successSeed.cloneNode(true);
        sfx.volume = safeVolume(SUCCESS_VOLUME);
        sfx.play().catch(() => {});
      } catch (e) {}
    }, delayMs || 0);
  }

  const avatar = document.getElementById('avatar');
  const slot = document.getElementById('coin-slot');
  const toast = document.getElementById('toast');
  if (!slot) return;

  const toastCloseBtn = toast ? toast.querySelector('.toast-close') : null;
  const toastActionBtn = toast ? toast.querySelector('.toast-action') : null;
  let toastTimer = null;

  function unlockSlot() {
    slot.classList.add('unlocked');
    slot.setAttribute('href', PROMPT_PATH);
    slot.setAttribute('tabindex', '0');
    slot.removeAttribute('aria-disabled');
    slot.removeAttribute('role');
    slot.setAttribute('aria-label', 'Open the unlocked build prompt');
  }

  function showToast() {
    if (!toast) return;
    toast.hidden = false;
    requestAnimationFrame(() => toast.classList.add('show'));
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, TOAST_AUTO_MS);
  }

  function hideToast() {
    if (!toast) return;
    toast.classList.remove('show');
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    setTimeout(() => { if (!toast.classList.contains('show')) toast.hidden = true; }, 300);
  }

  if (toastCloseBtn) toastCloseBtn.addEventListener('click', hideToast);

  if (toastActionBtn) {
    toastActionBtn.addEventListener('click', () => {
      slot.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        if (slot.classList.contains('unlocked')) slot.focus({ preventScroll: true });
      }, 450);
      hideToast();
    });
  }

  try {
    if (sessionStorage.getItem(STORAGE_KEY) === '1') {
      unlockSlot();
    }
  } catch (e) {
    // sessionStorage may be unavailable (private mode in some browsers); fail silent
  }

  let taps = [];
  function registerTap() {
    if (slot.classList.contains('unlocked')) return;
    const now = Date.now();
    taps = taps.filter((t) => now - t < TAP_WINDOW_MS);
    taps.push(now);
    playCoin();
    if (taps.length >= TAP_TARGET) {
      taps = [];
      unlockSlot();
      try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
      showToast();
      playSuccess(280);
    }
  }

  if (avatar) {
    avatar.addEventListener('click', registerTap);
  }

  // Keyboard / SR alternative: press Enter or Space on the locked coin-slot itself.
  slot.addEventListener('keydown', (event) => {
    if (slot.classList.contains('unlocked')) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      registerTap();
    }
  });
})();
