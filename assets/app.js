const root = document.documentElement;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const save = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
const toast = message => { const el = $('.toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('visible'), 2200); };
const themeButton = $('#theme-toggle');
function syncTheme() { const dark = root.dataset.theme === 'dark'; themeButton.querySelector('span').textContent = dark ? '亮色' : '暗色'; themeButton.setAttribute('aria-label', `切换为${dark ? '亮色' : '暗色'}模式`); }
syncTheme();
themeButton.addEventListener('click', () => { root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'; save('interview-color-mode', root.dataset.theme); syncTheme(); });
const design = $('#design-select');
design.value = root.dataset.design;
design.addEventListener('change', () => { root.dataset.design = design.value; save('interview-design', design.value); });

const menu = $('#sidebar'), menuButton = $('#menu-toggle'), backdrop = $('#menu-backdrop');
const narrowScreen = matchMedia('(max-width: 900px)');
function syncMenuAccessibility() { menu.inert = narrowScreen.matches && !document.body.classList.contains('menu-open'); }
syncMenuAccessibility();
narrowScreen.addEventListener('change', () => { if (!narrowScreen.matches) { document.body.classList.remove('menu-open'); backdrop.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); } syncMenuAccessibility(); });
function toggleMenu(open) { document.body.classList.toggle('menu-open', open); menuButton.setAttribute('aria-expanded', String(open)); backdrop.hidden = !open; syncMenuAccessibility(); if (open) $('#search-input').focus(); else menuButton.focus({ preventScroll: true }); }
menuButton.addEventListener('click', () => toggleMenu(!document.body.classList.contains('menu-open')));
$('#close-menu').addEventListener('click', () => toggleMenu(false));
backdrop.addEventListener('click', () => toggleMenu(false));
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape' && document.body.classList.contains('menu-open')) toggleMenu(false);
  if (ev.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) { ev.preventDefault(); if (matchMedia('(max-width: 900px)').matches) toggleMenu(true); $('#search-input').focus(); }
  if (ev.key === 'Tab' && document.body.classList.contains('menu-open')) { const focusable = [...menu.querySelectorAll('a,button,input,select,summary')].filter(el => el.offsetParent); const first = focusable[0], last = focusable.at(-1); if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); } else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); } }
});

function setMode(mode) {
  root.dataset.mode = mode;
  $$('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  const notes = $('#notes'); if (notes) notes.open = mode === 'study';
  const label = $('.mode-description'); if (label) label.textContent = mode === 'study' ? '展开笔记，理解原理' : '聚焦回答，练习表达';
  save('interview-reading-mode', mode);
}
$$('[data-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
try { setMode(localStorage.getItem('interview-reading-mode') === 'recite' ? 'recite' : 'study'); } catch { setMode('study'); }
$$('.toc-sidebar a').forEach(a => a.addEventListener('click', () => { if (a.hash === '#notes') { const notes = $('#notes'); if (notes) notes.open = true; } }));
$$('.copy-code').forEach(button => button.addEventListener('click', async () => {
  const code = button.closest('.code-block').querySelector('code').textContent;
  try { await navigator.clipboard.writeText(code); button.textContent = '已复制'; toast('代码已复制'); setTimeout(() => button.textContent = '复制代码', 1600); }
  catch { const area = document.createElement('textarea'); area.value = code; area.style.position = 'fixed'; area.style.opacity = '0'; document.body.append(area); area.select(); const ok = document.execCommand('copy'); area.remove(); toast(ok ? '代码已复制' : '请选中代码后复制'); }
}));

// Only the compact search index is loaded globally; each question body is a separate static page.
let index = [];
const search = $('#search-input'), role = $('#role-filter'), priority = $('#priority-filter');
const sortSelect = $('#catalog-sort'), sortedCatalog = $('#sorted-questions');
const cards = $$('.question-card');
const cardHomes = new Map(cards.map(card => [card, card.parentElement]));
function sortCatalog() {
  if (!sortSelect) return;
  const mode = sortSelect.value;
  const importance = { highest: 0, high: 1, normal: 2, low: 3 };
  const byId = new Map(index.map(q => [q.id, q]));
  if (mode === 'priority') cards.forEach(card => cardHomes.get(card).append(card));
  else {
    const ordered = [...cards].sort((a, b) => {
      const qa = byId.get(a.dataset.questionId), qb = byId.get(b.dataset.questionId);
      if (!qa || !qb) return 0;
      const primary = mode === 'sample' ? qb.sampleCount - qa.sampleCount : qb.updated.localeCompare(qa.updated);
      return primary || (importance[qa.importance] ?? 2) - (importance[qb.importance] ?? 2) || qa.title.localeCompare(qb.title, 'zh-CN');
    });
    sortedCatalog.append(...ordered);
  }
  sortedCatalog.hidden = mode === 'priority';
  $('#sort-explainer').textContent = { priority: '按专题组织，专题内先展示个人重点复习题目。', sample: '跨专题按当前有效样本出现次数降序；次数相同按个人复习优先级排列。', updated: '跨专题按最近更新日期降序；日期相同按个人复习优先级排列。' }[mode];
  filter();
}
if (sortSelect) sortSelect.addEventListener('change', sortCatalog);
function filter() {
  const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const matches = new Set(index.filter(q => terms.every(term => q.text.includes(term)) && (!role.value || q.roles.includes(role.value)) && (!priority.value || ['high', 'highest'].includes(q.importance))).map(q => q.id));
  let visible = 0;
  $$('[data-question-id]').forEach(el => { const show = !index.length ? !terms.length || terms.every(t => el.textContent.toLowerCase().includes(t)) : matches.has(el.dataset.questionId); el.hidden = !show; if (show && el.classList.contains('question-card')) visible++; });
  $$('.topic-group').forEach(group => { group.hidden = !group.querySelector('.question-link:not([hidden])'); if (terms.length || role.value || priority.value) group.open = true; });
  $$('.catalog-topic').forEach(group => group.hidden = !group.querySelector('.question-card:not([hidden])'));
  const resultCount = index.length ? matches.size : $$('.question-link:not([hidden])').length;
  $('.search-feedback').textContent = terms.length || role.value || priority.value ? `找到 ${resultCount} 道题目` : '';
  $('#no-results').hidden = resultCount > 0;
  const count = $('#catalog-count'); if (count) count.textContent = `${visible} 道公开题目`;
  const empty = $('.filter-empty'); if (empty) empty.hidden = visible > 0 || !index.length;
}
fetch(root.dataset.root + 'assets/search-index.json').then(response => { if (!response.ok) throw new Error('Search unavailable'); return response.json(); }).then(data => { index = data; if (sortSelect) { sortSelect.disabled = false; sortCatalog(); } else filter(); }).catch(() => { search.placeholder = '搜索题目标题'; role.disabled = true; priority.disabled = true; $('.search-feedback').textContent = '全文搜索加载失败，仍可按标题搜索。'; });
let filterTimer;
search.addEventListener('input', () => { clearTimeout(filterTimer); filterTimer = setTimeout(filter, 80); });
role.addEventListener('change', filter); priority.addEventListener('change', filter);
$('#reset-filters').addEventListener('click', () => { search.value = ''; role.value = ''; priority.value = ''; filter(); });
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => { for (const entry of entries) if (entry.isIntersecting) { $$('.toc-sidebar a').forEach(a => a.classList.toggle('active', a.hash === '#' + entry.target.id)); } }, { rootMargin: '-12% 0px -70% 0px' });
  $$('.article-section, .knowledge-section').forEach(el => observer.observe(el));
}
