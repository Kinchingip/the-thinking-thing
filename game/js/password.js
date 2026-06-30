// password.js — handles password-gated content on wiki pages.
// Call initPasswordGates() after injecting any page HTML.
// Gates use data attributes: data-password="X" data-flag="flag_name"
// The element immediately after .password-gate must be .gated-content.

import { setFlag, getFlag } from './state.js';

export function initPasswordGates() {
  document.querySelectorAll('.password-gate').forEach(gate => {
    const flagName = gate.dataset.flag;
    if (flagName && getFlag(flagName)) {
      skipGate(gate);
      return;
    }

    const input  = gate.querySelector('.password-input');
    const btn    = gate.querySelector('.password-submit');
    const error  = gate.querySelector('.password-error');
    const correct = gate.dataset.password;

    if (!input || !btn) return;

    const attempt = () => {
      if (input.value.trim().toLowerCase() === correct.toLowerCase()) {
        if (flagName) setFlag(flagName);
        skipGate(gate);
      } else {
        if (error) error.style.display = '';
        input.value = '';
        input.focus();
        gate.classList.add('password-gate--shake');
        setTimeout(() => gate.classList.remove('password-gate--shake'), 500);
      }
    };

    btn.addEventListener('click', attempt);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
    input.focus();
  });
}

function skipGate(gate) {
  gate.style.display = 'none';
  const gated = gate.nextElementSibling;
  if (gated && gated.classList.contains('gated-content')) {
    gated.style.display = 'block';
  }
}
