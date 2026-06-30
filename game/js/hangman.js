// hangman.js — self-contained hangman widget for Lisa Man's puzzle

export function initHangman(container, answer, onSolve) {
  const norm    = answer.toUpperCase();
  const guessed = new Set();
  let wrong     = 0;
  const MAX     = 6;

  function render() {
    const won  = [...norm].every(c => c === ' ' || guessed.has(c));
    const lost = wrong >= MAX;

    container.innerHTML = `
      <div class="hangman-widget">
        ${gallows(wrong)}
        <div class="hangman-word">${renderWord()}</div>
        ${!won && !lost ? renderKeys() : ''}
        ${won  ? '<p class="hangman-result hangman-won">Correct.</p>'           : ''}
        ${lost ? '<p class="hangman-result hangman-lost">[ ENTRY REDACTED ]</p>' : ''}
      </div>`;

    if (won)  { setTimeout(onSolve, 900); return; }
    if (lost) { setTimeout(() => { wrong = 0; guessed.clear(); render(); }, 1800); return; }

    container.querySelectorAll('.hangman-letter').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = btn.dataset.letter;
        if (guessed.has(c)) return;
        guessed.add(c);
        if (!norm.includes(c)) wrong++;
        render();
      });
    });
  }

  function renderWord() {
    return [...norm].map(c =>
      c === ' '
        ? '<span class="hangman-space">&nbsp;&nbsp;</span>'
        : `<span class="hangman-char">${guessed.has(c) ? c : '_'}</span>`
    ).join('');
  }

  function renderKeys() {
    return `<div class="hangman-keys">${
      [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(c => {
        const used = guessed.has(c);
        const miss = used && !norm.includes(c);
        return `<button class="hangman-letter${used ? ' used' : ''}${miss ? ' miss' : ''}"
          data-letter="${c}"${used ? ' disabled' : ''}>${c}</button>`;
      }).join('')
    }</div>`;
  }

  render();
}

function gallows(wrong) {
  const head = wrong >= 1 ? `<circle cx="140" cy="54" r="13" stroke="#202122" stroke-width="2" fill="none"/>` : '';
  const body = wrong >= 2 ? `<line x1="140" y1="67" x2="140" y2="108" stroke="#202122" stroke-width="2"/>` : '';
  const larm = wrong >= 3 ? `<line x1="140" y1="78" x2="118" y2="97" stroke="#202122" stroke-width="2"/>` : '';
  const rarm = wrong >= 4 ? `<line x1="140" y1="78" x2="162" y2="97" stroke="#202122" stroke-width="2"/>` : '';
  const lleg = wrong >= 5 ? `<line x1="140" y1="108" x2="118" y2="130" stroke="#202122" stroke-width="2"/>` : '';
  const rleg = wrong >= 6 ? `<line x1="140" y1="108" x2="162" y2="130" stroke="#202122" stroke-width="2"/>` : '';

  return `<svg class="hangman-gallows" viewBox="0 0 200 150" width="200" height="150">
    <line x1="20" y1="145" x2="180" y2="145" stroke="#a2a9b1" stroke-width="2"/>
    <line x1="60" y1="145" x2="60" y2="8"   stroke="#a2a9b1" stroke-width="2"/>
    <line x1="60" y1="8"   x2="140" y2="8"  stroke="#a2a9b1" stroke-width="2"/>
    <line x1="140" y1="8"  x2="140" y2="41" stroke="#a2a9b1" stroke-width="2"/>
    ${head}${body}${larm}${rarm}${lleg}${rleg}
  </svg>`;
}
