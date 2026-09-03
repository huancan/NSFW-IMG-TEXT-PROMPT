// 统计标签总数
const fs = require('fs');
const src = fs.readFileSync('tags.js', 'utf8');
const T = (t, n, zh, w) => ({ t, n, zh, w });
const ex = (name) => {
  const s = src.indexOf('const ' + name + ' = ');
  let i = s + ('const ' + name + ' = ').length;
  const o = src[i], c = o === '{' ? '}' : ']';
  let d = 0, q = false, e = false;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (q) { if (e) e = false; else if (ch === '\\') e = true; else if (ch === "'") q = false; continue; }
    if (ch === "'") { q = true; continue; }
    if (ch === o) d++;
    else if (ch === c) { d--; if (d === 0) break; }
  }
  return src.slice(s + ('const ' + name + ' = ').length, i + 1).trim();
};
const QUALITY_TAGS = eval('(' + ex('QUALITY_TAGS') + ')');
const HAIR_STYLES = eval('(' + ex('HAIR_STYLES') + ')');
const HAIR_COLORS = eval('(' + ex('HAIR_COLORS') + ')');
const VIEW_TAGS = eval('(' + ex('VIEW_TAGS') + ')');
const CENSOR_TAGS = eval('(' + ex('CENSOR_TAGS') + ')');
const NATURE_TAGS = eval('(' + ex('NATURE_TAGS') + ')');
const MODES = eval('(' + ex('MODES') + ')');
const NEGATIVE_DEFAULT = eval('(' + ex('NEGATIVE_DEFAULT') + ')').join(', ');
const MODEL_PRESETS = eval('(' + ex('MODEL_PRESETS') + ')');

let total = 0;
for (const [k, m] of Object.entries(MODES)) {
  let t = 0; const seen = new Set();
  for (const c of m.categories) { t += c.tags.length; for (const x of c.tags) seen.add(x.t); }
  total += t;
  console.log(k + ': ' + t + ' 条（唯一 ' + seen.size + '）');
}
let spec = 0;
for (const p of Object.values(MODEL_PRESETS)) spec += p.specialTags.length;
console.log('模型专属标签合计: ' + spec + ' 条');
console.log('质量词: ' + QUALITY_TAGS.length + ' 条');
console.log('两个模式标签总量: ' + total + '（含共享分类重复计数）');
