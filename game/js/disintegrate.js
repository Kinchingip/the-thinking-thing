// disintegrate.js — page text corruption that worsens with each revisit
// Level = visitCount - 1 (first visit is always clean)

const SKIP_PAGES = new Set(['list-of-residents', 'player-page', 'ally']);

// Corruption probability per level
const RATES = [0, 0.04, 0.11, 0.24, 0.40];

export function applyDisintegration(pageId, visitCount) {
  if (SKIP_PAGES.has(pageId) || pageId.startsWith('talk:')) return;

  const level = Math.min(Math.ceil((visitCount - 1) / 2), 4);
  if (level <= 0) return;

  const content = document.getElementById('wiki-content');
  if (!content) return;

  // Cumulative CSS classes (dis-3 also gets dis-1 and dis-2)
  for (let i = 1; i <= level; i++) content.classList.add(`dis-${i}`);

  corruptContent(content, level);
}

function corruptContent(root, level) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName.toLowerCase();
      if (['button', 'input', 'textarea', 'script', 'style'].includes(tag)) {
        return NodeFilter.FILTER_REJECT;
      }
      // Protect headings until level 3
      if (level < 3 && ['h1', 'h2', 'h3', 'h4'].includes(tag)) {
        return NodeFilter.FILTER_REJECT;
      }
      if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  nodes.forEach(node => corruptNode(node, level));
}

function corruptNode(textNode, level) {
  const text = textNode.textContent;
  const parts = text.split(/(\s+)/); // preserve whitespace tokens
  const result = parts.map(part =>
    /^\s+$/.test(part) || part.length <= 2 ? part : maybeCorrupt(part, level)
  ).join('');
  if (result !== text) textNode.textContent = result;
}

function maybeCorrupt(word, level) {
  if (Math.random() > RATES[level]) return word;

  if (level === 1) return transposeTwo(word);
  if (level === 2) return scrambleMiddle(word);
  if (level === 3) {
    return Math.random() < 0.22 ? reverseWord(word) : scrambleMiddle(word);
  }
  // level 4+
  const r = Math.random();
  if (r < 0.28) return blockOut(word);
  if (r < 0.55) return reverseWord(word);
  return scrambleMiddle(word);
}

function transposeTwo(word) {
  if (word.length < 3) return word;
  const i = 1 + Math.floor(Math.random() * (word.length - 2));
  return word.slice(0, i) + word[i + 1] + word[i] + word.slice(i + 2);
}

function scrambleMiddle(word) {
  if (word.length < 4) return word;
  const mid = word.slice(1, -1).split('');
  for (let i = mid.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mid[i], mid[j]] = [mid[j], mid[i]];
  }
  return word[0] + mid.join('') + word[word.length - 1];
}

function reverseWord(word) {
  return word.split('').reverse().join('');
}

function blockOut(word) {
  return '░'.repeat(word.length);
}
