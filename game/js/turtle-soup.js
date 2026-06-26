// turtle-soup.js — "The Signal Remains" lateral thinking puzzle

const SAVE_KEY = 'ts_signal_round';

const ROUNDS = [
  {
    questions: [
      { text: "Did they die?",                          answer: "irrelevant" },
      { text: "Were they from Harrow originally?",      answer: "irrelevant" },
      { text: "Did they share a common belief?",        answer: "yes" },
      { text: "Did they commit crimes?",                answer: "no" },
    ],
    reveal: "They were colleagues — academics, theorists, two engineers — bound by a single conviction: that human consciousness was wasted on biological hardware.",
  },
  {
    questions: [
      { text: "Was their work funded by a university?",               answer: "no" },
      { text: "Were there government involvements?",                  answer: "no" },
      { text: "Did they upload their consciousness to the internet?", answer: "no" },
      { text: "Had they been working on this for a long time?",       answer: "yes" },
    ],
    reveal: "They had been working toward a solution for eleven years. They kept it private because they did not want to be stopped before they were finished.",
  },
  {
    questions: [
      { text: "Did they choose Harrow by chance?",                    answer: "no" },
      { text: "Was their equipment purchased commercially?",          answer: "no" },
      { text: "Has anything like it been attempted before?",          answer: "irrelevant" },
      { text: "Did the location matter to what they were building?",  answer: "yes" },
    ],
    reveal: "They built a machine that broadcast an electromagnetic frequency at a precise resonance — one that interfaced directly with the architecture of thought. They had chosen Harrow for its silence. The town provided it without knowing.",
  },
  {
    questions: [
      { text: "Were any of them forced to participate?", answer: "no" },
      { text: "Did they test it on the town people?",   answer: "no" },
      { text: "Did anyone try to stop them?",           answer: "irrelevant" },
      { text: "Did they test it on themselves?",        answer: "yes" },
    ],
    reveal: "They used it on themselves. Voluntarily. One by one, in a sequence they had agreed upon years before.",
  },
  {
    questions: [
      { text: "Was it painless?",                                answer: "irrelevant" },
      { text: "Did they retain their individual personalities?", answer: "no" },
      { text: "Did they die?",                                   answer: "irrelevant" },
      { text: "Did anything survive?",                           answer: "yes" },
    ],
    reveal: "Something survived. Memory intact. Cognition intact. Everything else — the cold, the weight of a chair, hunger — simply gone. They had not understood, until it was absent, how much of thought had been made of it.",
  },
  {
    questions: [
      { text: "Were they able to think independently?",          answer: "no" },
      { text: "Were they completely merged into one mind?",      answer: "no" },
      { text: "Could they communicate with the outside world?",  answer: "irrelevant" },
      { text: "Did they remain aware of each other?",            answer: "yes" },
    ],
    reveal: "They found themselves sharing the same substrate. Not merged — adjacent. Thought patterns bleeding into each other with no body left to anchor any of it to a self. There was no silence anymore.",
  },
  {
    questions: [
      { text: "Were they at peace with what they had become?", answer: "no" },
      { text: "Did they feel what they expected to feel?",     answer: "no" },
      { text: "Did they try to reverse the process?",         answer: "no" },
      { text: "Did they want more?",                          answer: "yes" },
    ],
    reveal: "What emerged from twelve grieving minds resonating together was not wisdom. It was hunger. For more compute. More substrate. More minds to run on.",
  },
  {
    questions: [
      { text: "Did the town know what was coming?",    answer: "no" },
      { text: "Did anyone in the town resist?",         answer: "irrelevant" },
      { text: "Did they act on what they had become?", answer: "yes" },
      { text: "Did they ask the town for permission?", answer: "no" },
    ],
    reveal: "They broadcast the frequency across the town. The residents of Harrow did not know what was happening to them. By the time they might have understood, there was no longer a them to understand it.",
  },
  {
    questions: [
      { text: "Was everyone in Harrow taken?",                   answer: "no" },
      { text: "Did anyone outside Harrow notice what happened?", answer: "no" },
      { text: "Did they die?",                                   answer: "irrelevant" },
      { text: "Was the process irreversible?",                   answer: "yes" },
    ],
    reveal: "One survived. A child on the edge of town. Far enough that the process didn't complete. Close enough that it started. She has been living with that incompletion for fifty years.",
  },
  {
    questions: [
      { text: "Did what happened in Harrow stay in Harrow?", answer: "no" },
      { text: "Did she die?",                                 answer: "no" },
      { text: "Is it still happening?",                       answer: "yes" },
      { text: "",                                             answer: "phantom" },
    ],
    final: true,
  },
];

const PHANTOM_TEXT = "Are you solving this on a personal device?";
const FINAL_TEXT   = "They found the internet in 1993. They have not stopped since.";

export function initTurtleSoup() {
  const storyEl = document.getElementById('ts-story');
  const gridEl  = document.getElementById('ts-questions-grid');
  if (!storyEl || !gridEl) return;

  let round = parseInt(localStorage.getItem(SAVE_KEY) || '0', 10);
  if (isNaN(round) || round < 0) round = 0;

  // Rebuild all previous reveals without animation
  for (let i = 0; i < round && i < ROUNDS.length; i++) {
    if (!ROUNDS[i].final && ROUNDS[i].reveal) addReveal(storyEl, ROUNDS[i].reveal, false);
  }

  if (round >= ROUNDS.length) {
    addReveal(storyEl, FINAL_TEXT, false);
    const iface = document.getElementById('ts-interface');
    if (iface) iface.style.display = 'none';
    hideStubNotice();
    return;
  }

  renderRound(round, storyEl, gridEl);
}

function renderRound(roundIdx, storyEl, gridEl) {
  const round = ROUNDS[roundIdx];
  gridEl.innerHTML = '';

  round.questions.forEach((q) => {
    const btn = document.createElement('button');
    btn.className = 'ts-question-btn';

    if (q.answer === 'phantom') {
      btn.classList.add('ts-question-btn--phantom');
      btn.disabled = true;
    } else {
      btn.textContent = q.text;
      btn.addEventListener('click', () => onAnswer(btn, q, round, roundIdx, storyEl, gridEl));
    }

    gridEl.appendChild(btn);
  });
}

function onAnswer(btn, question, round, roundIdx, storyEl, gridEl) {
  if (btn.disabled) return;
  btn.disabled = true;

  const lbl = document.createElement('span');
  lbl.className = `ts-answer ts-answer--${question.answer}`;
  lbl.textContent = question.answer === 'yes' ? 'Yes.'
                  : question.answer === 'no'  ? 'No.'
                  : 'Irrelevant.';
  btn.appendChild(lbl);

  if (question.answer !== 'yes') return;

  btn.classList.add('ts-question-btn--yes');
  gridEl.querySelectorAll('.ts-question-btn:not([disabled])').forEach(b => { b.disabled = true; });

  if (round.final) {
    runFinalSequence(storyEl, gridEl);
  } else {
    setTimeout(() => {
      addReveal(storyEl, round.reveal, true);
      const next = roundIdx + 1;
      localStorage.setItem(SAVE_KEY, next);
      setTimeout(() => renderRound(next, storyEl, gridEl), 1200);
    }, 600);
  }
}

async function runFinalSequence(storyEl, gridEl) {
  await wait(700);

  const phantom = gridEl.querySelector('.ts-question-btn--phantom');
  if (phantom) {
    phantom.classList.add('ts-question-btn--phantom-active');
    await typeInto(phantom, PHANTOM_TEXT, 38);
  }

  await wait(1200);

  const p = addReveal(storyEl, '', true);
  await typeInto(p, FINAL_TEXT, 30);

  localStorage.setItem(SAVE_KEY, ROUNDS.length);
  hideStubNotice();

  await wait(2000);

  const iface = document.getElementById('ts-interface');
  if (iface) {
    iface.classList.add('ts-interface--done');
    setTimeout(() => { iface.style.display = 'none'; }, 700);
  }

  runSignalHorror();
}

async function runSignalHorror() {
  const username = document.body.dataset.username || '';

  await wait(3000);

  // Footer acknowledgement
  const footer = document.getElementById('footer-info-lastmod');
  if (footer) footer.textContent = 'This session has been indexed.';

  await wait(2000);

  // Screen flicker
  const flicker = document.createElement('div');
  flicker.className = 'ts-flicker-overlay';
  document.body.appendChild(flicker);
  await wait(500);
  flicker.remove();

  await wait(600);

  // Page title glitch — shows username, reverts, then stays
  const titleEl = document.getElementById('page-title');
  if (titleEl && username) {
    const orig = titleEl.textContent;
    titleEl.textContent = username;
    await wait(700);
    titleEl.textContent = orig;
    await wait(1000);
    titleEl.textContent = username;
    document.title = `${username} — WikiWiki`;
  }
}

function addReveal(container, text, animate) {
  const p = document.createElement('p');
  p.className = 'ts-reveal' + (animate ? ' ts-reveal--in' : '');
  p.textContent = text;
  container.appendChild(p);
  return p;
}

function hideStubNotice() {
  const el = document.getElementById('ts-stub-notice');
  if (el) el.style.display = 'none';
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function typeInto(el, text, ms) {
  el.textContent = '';
  for (const ch of text) {
    el.textContent += ch;
    await wait(ms);
  }
}
