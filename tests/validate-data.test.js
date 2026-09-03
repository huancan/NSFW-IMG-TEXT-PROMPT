// 数据一致性校验：标签中文注释、推荐权重范围、重复检查、模板引用完整性、模型预设
const fs = require('fs');
const src = fs.readFileSync('tags.js', 'utf8');
const T = (t, nsfw, zh, recW) => ({ t, nsfw, zh, w: recW });

const extract = (name) => {
  const start = src.indexOf(`const ${name} = `);
  if (start < 0) throw new Error(`${name} not found`);
  let i = start + `const ${name} = `.length;
  const open = src[i];
  const close = open === '{' ? '}' : ']';
  let depth = 0, inStr = false, esc = false;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === "'") inStr = false;
      continue;
    }
    if (ch === "'") { inStr = true; continue; }
    if (ch === open) depth++;
    else if (ch === close) { depth--; if (depth === 0) break; }
  }
  if (i >= src.length) throw new Error(`${name} 未闭合`);
  return src.slice(start + `const ${name} = `.length, i + 1).trim();
};
const QUALITY_TAGS = eval('(' + extract('QUALITY_TAGS') + ')');
const HAIR_STYLES = eval('(' + extract('HAIR_STYLES') + ')');
const HAIR_COLORS = eval('(' + extract('HAIR_COLORS') + ')');
const VIEW_TAGS = eval('(' + extract('VIEW_TAGS') + ')');
const CENSOR_TAGS = eval('(' + extract('CENSOR_TAGS') + ')');
const NATURE_TAGS = eval('(' + extract('NATURE_TAGS') + ')');
const NEGATIVE_DEFAULT = eval('(' + extract('NEGATIVE_DEFAULT') + ')').join(', ');
const MODEL_PRESETS = eval('(' + extract('MODEL_PRESETS') + ')');
const MODES = eval('(' + extract('MODES') + ')');
const TEMPLATES = eval('(' + extract('TEMPLATES') + ')');

let pass = 0, fail = 0;
const assert = (cond, name) => { if (cond) { pass++; } else { fail++; console.log('  FAIL', name); } };

const checkTags = (list, where) => {
  let bad = 0;
  for (const x of list) {
    if (!x.t || typeof x.t !== 'string') { console.log('   无标签名 @', where); bad++; continue; }
    if (!x.zh || !x.zh.trim()) { console.log('   缺中文注释:', x.t, '@', where); bad++; }
    if (x.w !== undefined && (typeof x.w !== 'number' || x.w < 0.5 || x.w > 2)) {
      console.log('   权重越界:', x.t, 'w=', x.w, '@', where); bad++;
    }
    if (![0, 1, 2, 3].includes(x.nsfw)) { console.log('   nsfw 越界:', x.t, '@', where); bad++; }
  }
  return bad === 0;
};

try {
  console.log('== 基础列表 ==');
  assert(checkTags(QUALITY_TAGS, 'QUALITY_TAGS'), '质量词全部有注释/合法');
  assert(QUALITY_TAGS.length >= 30, '质量词数量 >= 30');
  assert(checkTags(CENSOR_TAGS, 'CENSOR_TAGS'), '审查/码标签全部有注释/合法');
  assert(CENSOR_TAGS.some(x => x.t === 'uncensored'), '含 uncensored（步兵）');
  assert(CENSOR_TAGS.some(x => x.t === 'censored'), '含 censored（骑兵）');
  assert(CENSOR_TAGS.some(x => x.t === 'partial censoring'), '含局部打码');
  assert(CENSOR_TAGS.some(x => x.t === 'partially uncensored'), '含局部无码');
  assert(checkTags(NATURE_TAGS, 'NATURE_TAGS'), '攻受性标签全部有注释/合法');
  assert(NATURE_TAGS.some(x => x.t === 'seme') && NATURE_TAGS.some(x => x.t === 'uke'), '含 seme/uke（攻/受）');

  console.log('== 模型预设 ==');
  for (const [k, p] of Object.entries(MODEL_PRESETS)) {
    assert(p.label && p.desc, `${k}: 有 label/desc`);
    assert(p.params && p.params.sampler && p.params.steps && p.params.size && p.params.clip !== undefined, `${k}: 参数完整`);
    assert(typeof p.negative === 'string' && p.negative.length > 30, `${k}: 负面词非空`);
    assert(checkTags(p.specialTags || [], `${k}.specialTags`), `${k}: 专属标签合法`);
  }
  assert(Object.keys(MODEL_PRESETS).length >= 4, '至少 4 个模型预设');

  console.log('== 模式标签 ==');
  for (const [k, mode] of Object.entries(MODES)) {
    const keys = mode.categories.map(c => c.key);
    assert(keys.includes('model'), `${k}: 含 model 分类占位`);
    assert(keys.includes('hair') && keys.includes('haircolor') && keys.includes('view') && keys.includes('quality'),
      `${k}: 含发型/发色/视角/质量词分类`);
    assert(keys.includes('censor'), `${k}: 含审查与码分类`);
    assert(keys.includes('nature'), `${k}: 含攻受性分类`);
    // 逐预设注入专属标签后查重
    for (const [pk, p] of Object.entries(MODEL_PRESETS)) {
      const seen = new Set();
      let dup = false;
      for (const cat of mode.categories) {
        const list = cat.key === 'model' ? p.specialTags : cat.tags;
        for (const x of list) {
          if (seen.has(x.t)) { console.log(`   DUP ${k}+${pk}: ${x.t}`); dup = true; }
          seen.add(x.t);
        }
      }
      assert(!dup, `${k} + ${pk}: 无重复标签`);
      assert(checkTags([].concat(...mode.categories.map(c => c.key === 'model' ? p.specialTags : c.tags)), `${k}+${pk}`),
        `${k} + ${pk}: 全部标签有注释/合法`);
    }
    const total = mode.categories.reduce((s, c) => s + c.tags.length, 0);
    assert(total >= 200, `${k}: 标签总数 >= 200（实际 ${total}）`);
  }

  console.log('== 模板完整性 ==');
  for (const [k, list] of Object.entries(TEMPLATES)) {
    const all = new Set();
    for (const cat of MODES[k].categories) for (const x of cat.tags) all.add(x.t);
    for (const [pk, p] of Object.entries(MODEL_PRESETS)) for (const x of p.specialTags) all.add(x.t);
    for (const tpl of list) {
      for (const t of tpl.tags) {
        if (!all.has(t)) { console.log(`   MISSING ${k} 模板「${tpl.name}」: ${t}`); fail++; }
      }
    }
  }

  console.log('== 负面词引用 ==');
  assert(NEGATIVE_DEFAULT.split(',').length >= 40, '通用负面词 >= 40 项');

  console.log(`\n结果: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
} catch (e) {
  console.error('运行时异常:', e);
  process.exit(1);
}
