// 冒烟测试：用 vm + 轻量 DOM 桩执行 app.js，验证核心逻辑不抛错且行为正确
const fs = require('fs');
const vm = require('vm');

function makeEl(tag = 'div') {
  const listeners = {};
  const el = {
    tagName: String(tag).toUpperCase(),
    dataset: {},
    style: {},
    attrs: {},
    classSet: new Set(),
    _value: '', _text: '', _inner: '',
    get value() { return this._value; },
    set value(v) { this._value = v; },
    get textContent() { return this._text; },
    set textContent(v) { this._text = v; },
    get innerHTML() { return this._inner; },
    set innerHTML(v) { this._inner = v; },
    classList: {
      add: (...c) => c.forEach(x => el.classSet.add(x)),
      remove: (...c) => c.forEach(x => el.classSet.delete(x)),
      contains: (c) => el.classSet.has(c),
      toggle: (c, force) => {
        const on = force === undefined ? !el.classSet.has(c) : !!force;
        if (on) el.classSet.add(c); else el.classSet.delete(c);
      },
    },
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    setAttribute(k, v) { el.attrs[k] = String(v); },
    getAttribute(k) { return el.attrs[k]; },
    select() {},
    appendChild() {},
    removeChild() {},
    __fire(type, evt) { (listeners[type] || []).forEach(fn => fn(evt || { target: el })); },
  };
  return el;
}

const byId = {};
function reg(id, tag) { const e = makeEl(tag); byId[id] = e; return e; }
['ageGate', 'ageConfirm', 'ageDeny', 'tagSearch', 'tagCategories', 'intensity',
 'btnRandom', 'btnShuffle', 'btnClear', 'btnCopyPos', 'btnCopyNeg', 'btnResetNeg',
 'negOutput', 'btnCopyParams', 'pSteps', 'pSampler', 'pCfg', 'pSize', 'pClip',
 'templates', 'chipArea', 'posOutput', 'posCount', 'btnSaveFav', 'btnClearHist',
 'favList', 'histList', 'toast', 'modelSelect', 'modelDesc', 'paramsAdvice',
 'pbtnTags', 'pbtnChars', 'tagPanel', 'charPanel', 'areaJp', 'areaCn', 'charSearch',
 'btnRandomChar', 'charList', 'charStats', 'pbtnNeg', 'negPanel', 'negSearch',
 'negCategories'].forEach(id => reg(id, id === 'posOutput' || id === 'negOutput' ? 'textarea' : 'div'));
const modeGay = makeEl('button'), modeLes = makeEl('button');
modeGay.dataset.mode = 'gay'; modeLes.dataset.mode = 'lesbian';
const tabFav = makeEl('button'); tabFav.dataset.tab = 'fav';
const tabHist = makeEl('button'); tabHist.dataset.tab = 'hist';
const tabFavC = makeEl('div'), tabHistC = makeEl('div');

const docListeners = {};
const doc = {
  body: makeEl('body'),
  addEventListener(type, fn) { (docListeners[type] = docListeners[type] || []).push(fn); },
  querySelector(sel) { return sel[0] === '#' ? (byId[sel.slice(1)] || null) : null; },
  querySelectorAll(sel) {
    if (sel === '.mode-btn') return [modeGay, modeLes];
    if (sel === '.tab') return [tabFav, tabHist];
    if (sel === '.tab-content') return [tabFavC, tabHistC];
    return [];
  },
  createElement(tag) { return makeEl(tag); },
};

const mkStorage = () => {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: k => m.delete(k),
    __dump: () => Object.fromEntries(m),
  };
};

const ctx = vm.createContext({
  document: doc,
  localStorage: mkStorage(),
  sessionStorage: mkStorage(),
  navigator: {},
  console,
  setTimeout, clearTimeout,
  Math, JSON, Date,
});

const srcTags = fs.readFileSync('tags.js', 'utf8');
const srcAnime = fs.readFileSync('anime.js', 'utf8');
const srcNpTags = fs.readFileSync('nptags.js', 'utf8');
const src = fs.readFileSync('app.js', 'utf8');
vm.runInContext(srcTags, ctx);
vm.runInContext(srcAnime, ctx);
vm.runInContext(srcNpTags, ctx);
vm.runInContext(src, ctx);
(docListeners['DOMContentLoaded'] || []).forEach(fn => fn());

let pass = 0, fail = 0;
function assert(cond, name) {
  if (cond) { pass++; console.log('  PASS', name); }
  else { fail++; console.log('  FAIL', name); }
}
const run = (code) => vm.runInContext(code, ctx);

try {
  console.log('== 初始化 ==');
  assert(run('$("#negOutput").value.length > 50'), '负面词已填充默认值');
  assert(run('document.body.dataset.mode') === 'gay', '默认模式为 gay');
  assert(run('$("#tagCategories").innerHTML.includes("1boy")'), '标签库渲染出男同标签');
  assert(run('$("#templates").innerHTML.includes("温泉之夜")'), '模板渲染');
  assert(run('$("#tagCategories").innerHTML.includes("审查与码")'), '审查与码分类渲染');
  assert(run('$("#tagCategories").innerHTML.includes("攻受性")'), '攻受性分类渲染');
  assert(!run('$("#tagCategories").innerHTML.includes("模型专属")'), '通用模型下「模型专属」分类隐藏');
  assert(run('$("#modelSelect").innerHTML.includes("Illustrious")'), '模型选择器选项已生成');
  assert(run('$("#modelDesc").textContent.length > 10'), '模型说明已显示');
  assert(run('$("#paramsAdvice").textContent.includes("建议")'), '参数建议已显示');

  console.log('== 中文注释与推荐权重 ==');
  assert(run('$("#tagCategories").innerHTML.includes("口交")'), '标签库 chip 显示中文注释');
  assert(run('$("#tagCategories").innerHTML.includes("×1.2")'), '标签库 chip 显示推荐权重');
  run('toggleTag("blowjob")');
  assert(run('$("#posOutput").value') === '(blowjob:1.2)', '点击带推荐权重的标签默认带上权重');
  run('toggleTag("blowjob")');

  console.log('== 审查与码（步兵/骑兵） ==');
  assert(run('$("#tagCategories").innerHTML.includes("uncensored")'), '审查分类含 uncensored 标签');
  run('toggleTag("uncensored")');
  assert(run('$("#posOutput").value') === '(uncensored:1.2)', '步兵标签默认权重 1.2');
  run('toggleTag("censor bar over genitals")');
  assert(run('$("#posOutput").value.includes("(censor bar over genitals:1.2)")'), '审查条标签默认权重 1.2');
  run('toggleTag("censored")');
  assert(run('$("#posOutput").value.endsWith("censored")'), '骑兵标签为普通权重 1');
  run('toggleTag("uncensored"); toggleTag("censor bar over genitals"); toggleTag("censored")');

  console.log('== 攻受性 ==');
  run('toggleTag("seme")');
  assert(run('$("#posOutput").value.includes("(seme:1.1)")'), '攻标签默认权重 1.1');
  run('toggleTag("tomboy")');
  assert(run('$("#posOutput").value.includes("tomboy")'), 'T 系标签可加入（女同向）');
  run('toggleTag("seme"); toggleTag("tomboy")');

  console.log('== 标签增删与权重 ==');
  run('toggleTag("kissing")');
  assert(run('$("#posOutput").value') === 'kissing', '添加标签后输出为 kissing');
  assert(run('$("#chipArea").innerHTML.includes("kissing")'), 'chip 区显示标签');
  assert(run('$("#chipArea").innerHTML.includes("接吻")'), '已选 chip 显示中文注释');
  run('toggleTag("kissing")');
  assert(run('$("#posOutput").value') === '', '再次点击移除标签');
  run('toggleTag("kissing"); adjustWeight("kissing", 0.1)');
  assert(run('$("#posOutput").value') === '(kissing:1.1)', '权重 1.1 输出 (kissing:1.1)');
  run('adjustWeight("kissing", -0.1)');
  assert(run('$("#posOutput").value') === 'kissing', '权重减回 1.0 恢复无括号格式');
  run('adjustWeight("kissing", -0.1)');
  assert(run('$("#posOutput").value') === '(kissing:0.9)', '继续减到 0.9 输出 (kissing:0.9)');
  run('adjustWeight("kissing", 0.1); adjustWeight("kissing", 0.1)');
  assert(run('$("#posOutput").value') === '(kissing:1.2)', '0.9 按 + 跳 1.1 再按 + 到 1.2（设计：按 + 权重必然生效）');

  console.log('== 随机生成（中强度） ==');
  run('$("#intensity").value = "2"; randomGenerate()');
  const out2 = run('$("#posOutput").value');
  assert(out2.length > 20 && out2.includes(','), '随机生成非空且为多标签');
  assert(run('state.selected.gay.length') >= 8, '中强度标签数量 >= 8');
  const ok2 = run('state.selected.gay.every(c => c.nsfw <= 2)');
  assert(ok2, '中强度不含 nsfw=3 标签');
  assert(run('state.hist.length') === 1, '历史记录 +1');

  console.log('== 随机生成（重强度） ==');
  run('$("#intensity").value = "3"; randomGenerate()');
  assert(run('state.selected.gay.some(c => c.nsfw === 3)'), '重强度包含 nsfw=3 标签');
  assert(run('state.hist.length') === 2, '历史记录 +2');

  console.log('== 模式切换 ==');
  run('setMode("lesbian", true)');
  assert(run('document.body.dataset.mode') === 'lesbian', 'body data-mode 切换');
  assert(run('$("#tagCategories").innerHTML.includes("1girl")'), '标签库切换为女同');
  assert(run('$("#templates").innerHTML.includes("温泉之旅")'), '模板切换为女同');
  assert(run('state.selected.lesbian.length') === 0, '女同模式独立空状态');

  console.log('== 模板应用 ==');
  run('applyTemplate("💜 百合新婚夜")');
  assert(run('$("#posOutput").value.includes("candlelight")'), '模板标签已加入输出');

  console.log('== 收藏 / 载入 ==');
  run('state.favs.push({name:"t", mode:"lesbian", chips:[{t:"kissing",w:1,nsfw:1}], time:Date.now()}); renderFavs()');
  assert(run('$("#favList").innerHTML.includes("kissing")'), '收藏列表渲染');
  run('loadChips([{t:"69",w:1,nsfw:3}], "lesbian")');
  assert(run('$("#posOutput").value') === '69', '载入收藏后输出更新');

  console.log('== 模型切换 ==');
  run('setMode("gay", true)');
  run('setModel("illustrious")');
  assert(run('$("#modelSelect").value') === 'illustrious', '模型选择器值更新');
  assert(run('$("#tagCategories").innerHTML.includes("score_9")'), '模型专属分类出现 score_9');
  assert(run('$("#tagCategories").innerHTML.includes("模型专属")'), '模型专属分类标题显示');
  assert(run('$("#negOutput").value.startsWith("score_4")'), '负面词切换为 Illustrious 默认');
  assert(run('$("#pSampler").value') === 'DPM++ 2M Karras', '采样器应用推荐值');
  assert(run('$("#pCfg").value') === '7', 'CFG 应用推荐值');
  run('setModel("janima")');
  assert(run('$("#tagCategories").innerHTML.includes("BREAK")'), 'JANIMA 专属标签 BREAK 出现');
  assert(run('$("#tagCategories").innerHTML.includes("审查与码")'), 'JANIMA 下审查分类仍存在（所有模型通用）');
  run('setModel("nova")');
  assert(run('$("#pCfg").value') === '6.5', 'Nova 推荐 CFG 6.5');
  assert(run('$("#negOutput").value.startsWith("score_4")'), 'Nova 负面词同为 score 体系');

  console.log('== 负面词用户保护 ==');
  run('$("#negOutput").value = "custom user neg"');
  run('setModel("generic")');
  assert(run('$("#negOutput").value') === 'custom user neg', '用户自定义负面词不被覆盖');
  run('$("#negOutput").value = MODEL_PRESETS.generic.negative');
  run('setModel("illustrious")');
  assert(run('$("#negOutput").value.startsWith("score_4")'), '未修改时跟随新模型默认负面词');

  console.log('== 模型随机生成 ==');
  run('Math.random = () => 0.5; randomGenerate()');
  const outM = run('$("#posOutput").value');
  assert(outM.includes('score_9'), 'Illustrious 随机生成包含评分词 score_9');
  assert(outM.includes('uncensored'), '重强度随机生成默认带步兵 uncensored');
  const natureHit = run('["seme","uke","switch","dominant","submissive"].some(w => state.selected.gay.some(c => c.t === w))');
  assert(natureHit, '随机生成带攻受性标签（seed 0.5 → switch）');
  assert(run('state.hist.length') === 3, '历史记录 +3');
  const hasZh = run('state.selected.gay.every(c => typeof c.zh === "string")');
  assert(hasZh, '随机生成的每个标签都带中文注释');

  console.log('== 角色库 ==');
  run('setPanel("chars")');
  assert(run('!$("#charPanel").classList.contains("hidden")'), '角色库面板显示');
  assert(run('$("#charList").innerHTML.includes("刀剑神域")'), '角色库渲染出日漫列表');
  assert(run('$("#charStats").innerHTML.includes("部")'), '统计信息显示');
  run('setMode("gay", true)');
  run('state.expandedAnime.add("刀剑神域"); renderAnimeList()');
  assert(run('$("#charList").innerHTML.includes("kirito")'), '男同区显示男性角色 kirito');
  assert(!run('$("#charList").innerHTML.includes("asuna")'), '男同区不显示女性角色 asuna');
  run('setMode("lesbian", true)');
  run('state.expandedAnime.add("刀剑神域"); renderAnimeList()');
  assert(run('$("#charList").innerHTML.includes("asuna")'), '女同区显示女性角色 asuna');
  assert(!run('$("#charList").innerHTML.includes("kirito")'), '女同区不显示男性角色 kirito');
  run('toggleTag("asuna")');
  assert(run('$("#posOutput").value.includes("asuna")'), '角色标签加入提示词');
  assert(run('$("#chipArea").innerHTML.includes("亚丝娜")'), '角色 chip 显示中文名');
  run('toggleTag("asuna")');
  run('setMode("gay", true)');
  run('state.area = "cn"; renderAreas(); renderAnimeList()');
  assert(run('$("#charList").innerHTML.includes("魔道祖师")'), '中国动漫分区渲染国漫');
  run('state.expandedAnime.add("魔道祖师"); renderAnimeList()');
  assert(run('$("#charList").innerHTML.includes("wei_wuxian")'), '国漫男角色可加入（魏无羡）');
  run('state.area = "jp"; renderAreas(); renderAnimeList()');
  run('state.charSearch = "桐人"; renderAnimeList()');
  assert(run('$("#charList").innerHTML.includes("刀剑神域")'), '按中文角色名搜索命中作品');
  run('state.charSearch = ""; renderAnimeList()');
  run('Math.random = () => 0.5; const before = state.selected.gay.length; randomChar()');
  assert(run('state.selected.gay.length') === run('before + 1'), '随机角色加入一个标签');

  console.log('== 复制参数行 ==');
  run('$("#pSteps").value = "28"; $("#pSampler").value = "Euler a"; $("#pCfg").value = "7"; $("#pSize").value = "832x1216"; $("#pClip").value = "2"');
  const paramsSrc = run('`Steps: ${$("#pSteps").value}, Sampler: ${$("#pSampler").value}, CFG scale: ${$("#pCfg").value}, Size: ${$("#pSize").value}, Clip skip: ${$("#pClip").value}`');
  assert(paramsSrc.includes('Steps: 28') && paramsSrc.includes('Euler a'), '参数行拼接正确');

  console.log('== 持久化 ==');
  assert(run('localStorage.getItem("nps_selected") !== null'), '选中状态已写入 localStorage');
  assert(run('localStorage.getItem("nps_model")') === '"illustrious"', '模型选择已持久化');

  console.log('== 负面词面板 ==');
  run('setMode("gay", true)');
  run('setPanel("neg")');
  assert(run('state.panel') === 'neg', '面板切换到 neg');
  assert(run('!$("#negPanel").classList.contains("hidden")'), '负面词面板显示');
  assert(run('$("#tagPanel").classList.contains("hidden")'), '标签库面板隐藏');
  run('renderNegCategories()');
  assert(run('$("#negCategories").innerHTML.includes("bad anatomy")'), '负面词分类渲染：画质类');
  assert(run('$("#negCategories").innerHTML.includes("bad cock")'), '男同模式出现男同性器官负面词');
  assert(run('$("#negCategories").innerHTML.includes("禁止女性化")'), '男同模式出现禁止女性化分类');
  assert(!run('$("#negCategories").innerHTML.includes("bad pussy")'), '男同模式不出现女性性器官负面词');
  run('setMode("lesbian", true)');
  run('renderNegCategories()');
  assert(run('$("#negCategories").innerHTML.includes("bad pussy")'), '女同模式出现女性性器官负面词');
  assert(run('$("#negCategories").innerHTML.includes("bad breasts")'), '女同模式出现胸部负面词');
  assert(run('$("#negCategories").innerHTML.includes("禁止男性化")'), '女同模式出现禁止男性化分类');
  assert(!run('$("#negCategories").innerHTML.includes("bad cock")'), '女同模式不出现男性性器官负面词');
  assert(!run('$("#negCategories").innerHTML.includes("bad penis")'), '女同模式不出现男性性器官负面词');
  run('toggleNegTag("bad pussy")');
  assert(run('state.negSelected').includes('bad pussy'), '点击负面词加入 negSelected');
  assert(run('$("#negOutput").value').includes('bad pussy'), 'negSelected 同步到 negOutput');
  run('toggleNegTag("bad pussy")');
  assert(!run('state.negSelected').includes('bad pussy'), '再次点击移除负面词');
  run('setPanel("tags")');
  assert(run('state.panel') === 'tags', '切回标签库面板');
  assert(run('$("#tagPanel").classList.contains("hidden")') === false, '标签库面板恢复');
  assert(run('$("#negPanel").classList.contains("hidden")'), '负面词面板已隐藏');

  console.log(`\n结果: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
} catch (e) {
  console.error('运行时异常:', e);
  process.exit(1);
}
