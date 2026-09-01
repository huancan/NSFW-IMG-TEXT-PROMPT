/* ================================================================
 * app.js — NSFW Prompt Studio 逻辑
 * 数据（标签库/模型预设）见 tags.js，需先于本文件加载。
 * 所有标签仅面向 18+ 成年角色，请遵守当地法律。
 * ================================================================ */
'use strict';

/* ---------- 工具 ---------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));
const shuffle = (arr) => arr.map(a => [Math.random(), a]).sort((a, b) => a[0] - b[0]).map(a => a[1]);
const rand = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const pick = (arr, n) => shuffle(arr).slice(0, n);
const dedupe = (arr) => [...new Set(arr)];

const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
};

/* ---------- 状态 ---------- */
const state = {
  mode: LS.get('nps_mode', 'gay'),
  model: LS.get('nps_model', 'generic'),
  intensity: 2,
  selected: LS.get('nps_selected', { gay: [], lesbian: [] }),
  favs: LS.get('nps_favs', []),
  hist: LS.get('nps_hist', []),
  collapsed: new Set(),
  // 角色库状态
  panel: 'tags',      // tags | chars
  area: 'jp',         // jp | cn
  charSearch: '',
  expandedAnime: new Set(),
};

/* 角色映射表：danbooru 标签 → {中文名, 出自作品, 地区} */
function buildCharMap() {
  const map = {};
  for (const [area, list] of Object.entries(ANIME_DB)) {
    for (const a of list) {
      for (const c of a.male.concat(a.female)) {
        if (!map[c.t]) map[c.t] = { zh: c.zh, anime: a.zh, area };
      }
    }
  }
  return map;
}
const CHAR_MAP = buildCharMap();

const preset = () => MODEL_PRESETS[state.model] || MODEL_PRESETS.generic;
const modeCats = () => {
  // 返回当前模式分类，并把「模型专属」分类替换为当前模型的标签
  const cats = MODES[state.mode].categories.map(c => ({ ...c }));
  const mcat = cats.find(c => c.key === 'model');
  if (mcat) mcat.tags = preset().specialTags || [];
  return cats;
};
const selectedNow = () => state.selected[state.mode];
const fmtTag = (c) => (c.w && c.w !== 1) ? `(${c.t}:${c.w})` : c.t;
const compose = () => selectedNow().map(fmtTag).join(', ');

function findDef(text) {
  for (const cat of modeCats()) {
    const hit = cat.tags.find(x => x.t === text);
    if (hit) return hit;
  }
  return null;
}
const lookupNsfw = (text) => { const d = findDef(text); return d ? d.nsfw : 0; };
const lookupZh = (text) => { const d = findDef(text) || CHAR_MAP[text]; return d ? d.zh || '' : ''; };

function saveState() {
  LS.set('nps_mode', state.mode);
  LS.set('nps_model', state.model);
  LS.set('nps_selected', state.selected);
  LS.set('nps_favs', state.favs);
  LS.set('nps_hist', state.hist);
}

/* ---------- Toast ---------- */
let toastTimer = null;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1700);
}

/* ---------- 复制 ---------- */
function copyText(text, tip = '已复制到剪贴板') {
  if (!text) { toast('内容为空'); return; }
  const done = () => toast(tip);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else {
    fallbackCopy(text, done);
  }
}
function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); done(); } catch (e) { toast('复制失败，请手动选择复制'); }
  document.body.removeChild(ta);
}

/* ---------- 渲染：标签库 ---------- */
let searchText = '';
function renderCategories() {
  const wrap = $('#tagCategories');
  const q = searchText.trim().toLowerCase();
  let html = '';
  for (const cat of modeCats()) {
    let list = cat.tags;
    if (q) list = list.filter(x => x.t.toLowerCase().includes(q) || (x.zh && x.zh.includes(q)));
    if (!list.length && !q) continue; // 模型专属为空时整类隐藏
    const open = state.collapsed.has(cat.key) ? '' : 'open';
    const chips = list.map(x => {
      const sel = selectedNow().some(c => c.t === x.t) ? ' sel' : '';
      const badge = x.nsfw >= 2 ? `<span class="nsfw-badge">${x.nsfw >= 3 ? '🔞' : '·'}</span>` : '';
      const rw = x.w && x.w !== 1 ? `<span class="rw">×${x.w}</span>` : '';
      const tip = `${x.zh || ''}${x.w && x.w !== 1 ? `（推荐权重 ×${x.w}）` : ''}`;
      return `<button class="tag-chip${sel} nsfw-${x.nsfw}" data-tag="${escapeHtml(x.t)}" title="${escapeHtml(tip)}">
        <span class="tg">${escapeHtml(x.t)}</span><span class="zh">${escapeHtml(x.zh || '')}</span>${rw}${badge}
      </button>`;
    }).join('');
    html += `
      <div class="cat ${open}">
        <button class="cat-head" data-cat="${cat.key}">
          <span>${cat.label}</span>
          <span class="cat-count">${list.length}/${cat.tags.length}</span>
          <span class="cat-arrow">▶</span>
        </button>
        <div class="cat-body">${chips || '<span style="color:var(--text2);font-size:12px;padding:4px 0">无匹配标签</span>'}</div>
      </div>`;
  }
  wrap.innerHTML = html;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ---------- 渲染：已选 chips ---------- */
function renderChips() {
  const area = $('#chipArea');
  const chips = selectedNow();
  area.innerHTML = chips.map(c => `
    <span class="sel-chip" title="${escapeHtml(c.zh || '')}">
      ${escapeHtml(c.t)}
      ${c.zh ? `<span class="zh2">${escapeHtml(c.zh)}</span>` : ''}
      ${c.w && c.w !== 1 ? `<span class="w">×${c.w}</span>` : ''}
      <button class="wminus" title="降低权重" data-tag="${escapeHtml(c.t)}">−</button>
      <button class="wplus" title="提高权重" data-tag="${escapeHtml(c.t)}">+</button>
      <button class="rm" title="移除" data-tag="${escapeHtml(c.t)}">✕</button>
    </span>`).join('');
  updateOutput();
}

function updateOutput() {
  const chips = selectedNow();
  $('#posOutput').value = compose();
  $('#posCount').textContent = `${chips.length} 词`;
}

/* ---------- 渲染：模板 ---------- */
function renderTemplates() {
  const wrap = $('#templates');
  wrap.innerHTML = TEMPLATES[state.mode].map(t =>
    `<button class="tpl-btn" data-tpl="${escapeHtml(t.name)}">${escapeHtml(t.name)}</button>`).join('');
}

/* ---------- 渲染：收藏 / 历史 ---------- */
function renderFavs() {
  const ul = $('#favList');
  if (!state.favs.length) { ul.innerHTML = '<li class="empty-tip">还没有收藏，点击上方按钮保存当前提示词</li>'; return; }
  ul.innerHTML = state.favs.map((f, i) => `
    <li data-idx="${i}">
      <span class="save-name">⭐ ${escapeHtml(f.name)}</span>
      <span class="save-meta">${f.mode === 'gay' ? '男同' : '女同'} · ${f.chips.length} 词 · ${new Date(f.time).toLocaleString()}</span>
      <span class="save-preview">${escapeHtml(f.chips.map(fmtTag).join(', ').slice(0, 90))}</span>
      <button class="save-del" data-del="${i}" title="删除">✕</button>
    </li>`).join('');
}

function renderHist() {
  const ul = $('#histList');
  if (!state.hist.length) { ul.innerHTML = '<li class="empty-tip">暂无历史记录</li>'; return; }
  ul.innerHTML = state.hist.map((h, i) => `
    <li data-idx="${i}">
      <span class="save-name">🕘 ${h.mode === 'gay' ? '男同' : '女同'} · ${h.chips.length} 词</span>
      <span class="save-meta">${new Date(h.time).toLocaleString()}</span>
      <span class="save-preview">${escapeHtml(h.chips.map(fmtTag).join(', ').slice(0, 90))}</span>
    </li>`).join('');
}

/* ---------- 交互：标签 ---------- */
function toggleTag(text) {
  const sel = selectedNow();
  const idx = sel.findIndex(c => c.t === text);
  if (idx >= 0) { sel.splice(idx, 1); }
  else {
    const def = findDef(text) || CHAR_MAP[text];
    sel.push({ t: text, w: (def && def.w) || 1, nsfw: def ? (def.nsfw || 0) : 0, zh: def ? (def.zh || '') : '' });
  }
  saveState();
  renderChips();
  renderCategories();
  if (state.panel === 'chars') renderAnimeList();
}

function adjustWeight(text, delta) {
  const c = selectedNow().find(x => x.t === text);
  if (!c) return;
  c.w = Math.round((c.w + delta) * 10) / 10;
  c.w = Math.min(2, Math.max(0.5, c.w));
  if (c.w === 1 && delta > 0) c.w = 1.1; // 从 1 上调时直接到 1.1
  saveState();
  renderChips();
}

/* ---------- 交互：随机生成 ---------- */
function randomWeight() { return Math.random() < 0.35 ? 1 + rand(1, 3) / 10 : 1; }

function randomGenerate() {
  const inten = +$('#intensity').value;
  state.intensity = inten;
  const p = preset();
  const chips = [];
  const push = (text, nsfw) => chips.push({ t: text, w: randomWeight(), nsfw, zh: lookupZh(text) });

  // 质量词：模型特色词 + 通用质量词（去重）
  const qPool = dedupe([...QUALITY_TAGS.map(x => x.t), ...(p.extraQuality || [])]);
  for (const q of pick(qPool, rand(4, 6))) push(q, 0);
  // 模型专属标签（如 rating:explicit）
  const special = (p.specialTags || []).filter(x => x.nsfw <= inten);
  if (special.length && Math.random() < 0.7) {
    for (const s of pick(special, rand(1, 2))) push(s.t, s.nsfw);
  }

  const cats = {};
  for (const cat of modeCats()) {
    if (cat.key === 'model') continue;
    cats[cat.key] = cat.tags.filter(x => x.nsfw <= inten);
  }
  const from = (key, n) => { for (const t of pick(cats[key] || [], n)) push(t.t, t.nsfw); };

  // 角色基础
  from('base', rand(1, 2));
  // 身体：强度越高越多
  if (inten >= 1) from('body', inten === 1 ? 0 : inten === 2 ? rand(1, 2) : rand(2, 3));
  // 服装
  from('clothing', inten === 1 ? 1 : inten === 2 ? 1 : rand(0, 1));
  // 发型 / 发色 / 视角
  if (Math.random() < 0.8) from('hair', 1);
  if (Math.random() < 0.8) from('haircolor', 1);
  if (Math.random() < 0.6) from('view', 1);
  // 动作
  if (inten === 1) { if (Math.random() < 0.5) from('action', 1); }
  else from('action', inten === 2 ? rand(1, 2) : rand(2, 3));
  // 表情
  from('expression', inten === 1 ? 1 : inten === 2 ? rand(1, 2) : 2);
  // 场景
  if (Math.random() < (inten === 1 ? 0.5 : 0.9)) from('env', 1);
  // 道具
  if (inten === 3 && Math.random() < 0.5) from('props', 1);
  else if (inten === 2 && Math.random() < 0.3) from('props', 1);
  // 审查：中/重强度 60% 默认「无码（步兵）」，想要骑兵手动加 censored 类标签
  if (inten >= 2 && Math.random() < 0.6) push('uncensored', 0);

  state.selected[state.mode] = chips;
  pushHistory(chips);
  saveState();
  renderChips();
  renderCategories();
  toast('🎲 已生成新提示词');
}

/* ---------- 交互：模板 ---------- */
function applyTemplate(name) {
  const tpl = TEMPLATES[state.mode].find(t => t.name === name);
  if (!tpl) return;
  const sel = selectedNow();
  for (const t of tpl.tags) {
    if (!sel.some(c => c.t === t)) {
      const def = findDef(t);
      sel.push({ t, w: (def && def.w) || 1, nsfw: def ? def.nsfw : 0, zh: def ? def.zh : '' });
    }
  }
  saveState();
  renderChips();
  renderCategories();
  toast(`📦 已应用模板：${name}`);
}

/* ---------- 交互：历史 / 收藏 ---------- */
function pushHistory(chips) {
  state.hist.unshift({ mode: state.mode, chips: chips.map(c => ({ ...c })), time: Date.now() });
  if (state.hist.length > 30) state.hist.length = 30;
}

function saveFav() {
  const chips = selectedNow();
  if (!chips.length) { toast('当前没有标签可收藏'); return; }
  const name = prompt('给这个收藏起个名字：', chips.slice(0, 3).map(c => c.t).join(' + '));
  if (name === null) return;
  state.favs.unshift({ name: name.trim() || '未命名收藏', mode: state.mode, chips: chips.map(c => ({ ...c })), time: Date.now() });
  saveState();
  renderFavs();
  toast('💾 已收藏');
}

function loadChips(chips, mode) {
  if (mode && mode !== state.mode) setMode(mode, true);
  state.selected[state.mode] = chips.map(c => ({ ...c }));
  saveState();
  renderChips();
  renderCategories();
}

/* ---------- 模式切换 ---------- */
function setMode(mode, silent) {
  state.mode = mode;
  document.body.dataset.mode = mode;
  $$('.mode-btn').forEach(b => {
    const on = b.dataset.mode === mode;
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  searchText = '';
  $('#tagSearch').value = '';
  renderCategories();
  renderTemplates();
  renderChips();
  if (state.panel === 'chars') renderAnimeList(); // 角色库按性别分流
  if (!silent) toast(`已切换到${mode === 'gay' ? '男同' : '女同'}模式`);
  saveState();
}

/* ---------- 模型切换 ---------- */
function setModel(key, silent) {
  const old = preset();
  state.model = MODEL_PRESETS[key] ? key : 'generic';
  const p = preset();
  $('#modelSelect').value = state.model;

  // 负面词：若用户未改过（等于旧模型默认），则跟随新模型默认
  const negEl = $('#negOutput');
  const untouched = negEl.value === old.negative || (silent && LS.get('nps_neg', null) === null);
  if (untouched) {
    negEl.value = p.negative;
    saveNeg();
  }
  // 应用推荐参数
  $('#pSampler').value = p.params.sampler;
  $('#pSteps').value = String(p.params.steps);
  $('#pCfg').value = String(p.params.cfg);
  $('#pSize').value = p.params.size;
  $('#pClip').value = String(p.params.clip);
  // 模型说明与参数建议
  $('#modelDesc').textContent = p.desc;
  $('#paramsAdvice').textContent = `📌 ${state.model === 'generic' ? '通用' : '本模型'}建议：${p.params.sampler} · ${p.params.steps}步 · CFG ${p.params.cfg} · ${p.params.size} · Clip skip ${p.params.clip}`;

  renderCategories();
  if (!silent) toast(`已切换到 ${MODEL_PRESETS[state.model].label}`);
  saveState();
}

/* ---------- 角色库 ---------- */
function animeList() {
  return ANIME_DB[state.area] || [];
}

function setPanel(panel) {
  state.panel = panel;
  $('#pbtnTags').classList.toggle('active', panel === 'tags');
  $('#pbtnChars').classList.toggle('active', panel === 'chars');
  $('#tagPanel').classList.toggle('hidden', panel !== 'tags');
  $('#charPanel').classList.toggle('hidden', panel !== 'chars');
  if (panel === 'chars') renderAnimeList();
}

function renderAreas() {
  $('#areaJp').classList.toggle('active', state.area === 'jp');
  $('#areaCn').classList.toggle('active', state.area === 'cn');
}

function renderAnimeList() {
  const q = state.charSearch.trim().toLowerCase();
  const isGay = state.mode === 'gay';
  const genderKey = isGay ? 'male' : 'female';
  const genderLabel = isGay ? '♂ 男性角色 → 男同区' : '♀ 女性角色 → 女同区';
  const list = animeList();
  let maleChars = 0, femaleChars = 0;
  const html = list.map(a => {
    maleChars += a.male.length;
    femaleChars += a.female.length;
    const chars = a[genderKey];
    const matched = !q
      || a.zh.toLowerCase().includes(q)
      || a.en.toLowerCase().includes(q)
      || a.male.some(c => c.t.includes(q) || c.zh.includes(q))
      || a.female.some(c => c.t.includes(q) || c.zh.includes(q));
    if (q && !matched) return '';
    const open = state.expandedAnime.has(a.zh) || !!q;
    const chips = chars.map(c => {
      const sel = selectedNow().some(x => x.t === c.t) ? ' sel' : '';
      return `<button class="tag-chip char-chip${sel}" data-tag="${escapeHtml(c.t)}" title="${escapeHtml(c.zh)}（出自《${escapeHtml(a.zh)}》· ${a.year}）">
        <span class="tg">${escapeHtml(c.t)}</span><span class="zh">${escapeHtml(c.zh)}</span>
      </button>`;
    }).join('');
    return `
      <div class="anime-item ${open ? 'open' : ''}">
        <button class="anime-head" data-anime="${escapeHtml(a.zh)}">
          <span class="anime-name">${escapeHtml(a.zh)}<em>${escapeHtml(a.en)} · ${a.year}</em></span>
          <span class="anime-meta">♂${a.male.length} ♀${a.female.length}</span>
          <span class="anime-arrow">▶</span>
        </button>
        <div class="anime-body">
          <div class="char-row">
            <span class="char-label"><span class="cl">${genderLabel}</span> · 点击加入提示词</span>
            <div class="char-chips">${chips || '<span class="anime-empty">本作没有该性别角色</span>'}</div>
          </div>
        </div>
      </div>`;
  }).join('');
  $('#charList').innerHTML = html || '<div class="empty-tip">没有匹配的动漫或角色</div>';
  $('#charStats').innerHTML = `共 <b>${list.length}</b> 部 · 男角色 <b>${maleChars}</b> · 女角色 <b>${femaleChars}</b> · ${state.area === 'jp' ? '🇯🇵 日本动漫' : '🇨🇳 中国动漫'}`;
}

function randomChar() {
  const genderKey = state.mode === 'gay' ? 'male' : 'female';
  const pool = animeList().filter(a => a[genderKey].length);
  if (!pool.length) { toast('当前地区没有可用角色'); return; }
  const a = pool[rand(0, pool.length - 1)];
  const c = a[genderKey][rand(0, a[genderKey].length - 1)];
  toggleTag(c.t);
  toast(`🎲 随机到《${a.zh}》的「${c.zh}」`);
}

/* ---------- 初始化 ---------- */
function init() {
  // 年龄确认
  let aged = false;
  try { aged = sessionStorage.getItem('nps_age') === '1'; } catch (e) {}
  if (aged) $('#ageGate').classList.add('hidden');
  $('#ageConfirm').addEventListener('click', () => {
    try { sessionStorage.setItem('nps_age', '1'); } catch (e) {}
    $('#ageGate').classList.add('hidden');
  });
  $('#ageDeny').addEventListener('click', () => {
    $('#ageGate .age-gate-notice p:first-child').innerHTML =
      '<b style="color:var(--danger)">你未满 18 岁，本站内容不适合你浏览。</b>';
  });

  // 模型选择器选项
  $('#modelSelect').innerHTML = Object.entries(MODEL_PRESETS)
    .map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('');

  // 负面词
  const savedNeg = LS.get('nps_neg', null);
  if (savedNeg !== null) $('#negOutput').value = savedNeg;

  // 模式按钮
  $$('.mode-btn').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

  // 搜索（匹配标签原文或中文注释）
  $('#tagSearch').addEventListener('input', (e) => {
    searchText = e.target.value;
    renderCategories();
  });

  // 标签库事件（事件委托）
  $('#tagCategories').addEventListener('click', (e) => {
    const head = e.target.closest('.cat-head');
    if (head) {
      const key = head.dataset.cat;
      if (state.collapsed.has(key)) state.collapsed.delete(key); else state.collapsed.add(key);
      renderCategories();
      return;
    }
    const chip = e.target.closest('.tag-chip');
    if (chip) toggleTag(chip.dataset.tag);
  });

  // 已选 chips 事件
  $('#chipArea').addEventListener('click', (e) => {
    const tag = e.target.dataset.tag;
    if (!tag) return;
    if (e.target.classList.contains('wplus')) adjustWeight(tag, 0.1);
    else if (e.target.classList.contains('wminus')) adjustWeight(tag, -0.1);
    else if (e.target.classList.contains('rm')) toggleTag(tag);
  });

  // 工具按钮
  $('#btnRandom').addEventListener('click', randomGenerate);
  $('#btnShuffle').addEventListener('click', () => {
    state.selected[state.mode] = shuffle(selectedNow());
    saveState(); renderChips(); toast('🔀 已打乱顺序');
  });
  $('#btnClear').addEventListener('click', () => {
    if (!selectedNow().length) { toast('已经是空的啦'); return; }
    state.selected[state.mode] = [];
    saveState(); renderChips(); renderCategories(); toast('🗑 已清空');
  });
  $('#btnCopyPos').addEventListener('click', () => copyText($('#posOutput').value, '📋 正向提示词已复制'));
  $('#btnCopyNeg').addEventListener('click', () => copyText($('#negOutput').value, '📋 负面提示词已复制'));
  $('#btnResetNeg').addEventListener('click', () => {
    $('#negOutput').value = preset().negative;
    saveNeg();
    toast('↺ 已恢复当前模型默认负面词');
  });
  $('#negOutput').addEventListener('input', saveNeg);

  // 参数
  $('#btnCopyParams').addEventListener('click', () => {
    const line = `Steps: ${$('#pSteps').value}, Sampler: ${$('#pSampler').value}, CFG scale: ${$('#pCfg').value}, Size: ${$('#pSize').value}, Clip skip: ${$('#pClip').value}`;
    copyText(line, '📋 参数行已复制');
  });

  // 模型切换
  $('#modelSelect').addEventListener('change', (e) => setModel(e.target.value));

  // 模板
  $('#templates').addEventListener('click', (e) => {
    const btn = e.target.closest('.tpl-btn');
    if (btn) applyTemplate(btn.dataset.tpl);
  });

  // 角色库
  $('#pbtnTags').addEventListener('click', () => setPanel('tags'));
  $('#pbtnChars').addEventListener('click', () => setPanel('chars'));
  $('#areaJp').addEventListener('click', () => { state.area = 'jp'; renderAreas(); renderAnimeList(); });
  $('#areaCn').addEventListener('click', () => { state.area = 'cn'; renderAreas(); renderAnimeList(); });
  $('#charSearch').addEventListener('input', (e) => { state.charSearch = e.target.value; renderAnimeList(); });
  $('#btnRandomChar').addEventListener('click', randomChar);
  $('#charList').addEventListener('click', (e) => {
    const head = e.target.closest('.anime-head');
    if (head) {
      const key = head.dataset.anime;
      if (state.expandedAnime.has(key)) state.expandedAnime.delete(key); else state.expandedAnime.add(key);
      renderAnimeList();
      return;
    }
    const chip = e.target.closest('.char-chip');
    if (chip) toggleTag(chip.dataset.tag);
  });

  // 收藏 / 历史
  $('#btnSaveFav').addEventListener('click', saveFav);
  $('#btnClearHist').addEventListener('click', () => {
    if (!state.hist.length) { toast('历史本来就是空的'); return; }
    state.hist = [];
    saveState(); renderHist(); toast('🗑 历史已清空');
  });
  $('#favList').addEventListener('click', (e) => {
    if (e.target.classList.contains('save-del')) {
      const i = +e.target.dataset.del;
      state.favs.splice(i, 1);
      saveState(); renderFavs(); toast('已删除收藏');
      return;
    }
    const li = e.target.closest('li');
    if (li) { const f = state.favs[+li.dataset.idx]; if (f) loadChips(f.chips, f.mode); toast('⭐ 已载入收藏'); }
  });
  $('#histList').addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (li) { const h = state.hist[+li.dataset.idx]; if (h) loadChips(h.chips, h.mode); toast('🕘 已载入历史'); }
  });

  // Tab 切换
  $$('.tab').forEach(t => t.addEventListener('click', () => {
    $$('.tab').forEach(x => x.classList.remove('active'));
    $$('.tab-content').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    $(`#tab${t.dataset.tab === 'fav' ? 'Fav' : 'Hist'}`).classList.add('active');
  }));

  // 强度 select 变更
  $('#intensity').addEventListener('change', (e) => { state.intensity = +e.target.value; });

  // 初始渲染
  setMode(state.mode, true);
  setModel(state.model, true);
  renderFavs();
  renderHist();
}

function saveNeg() {
  LS.set('nps_neg', $('#negOutput').value);
}

document.addEventListener('DOMContentLoaded', init);
