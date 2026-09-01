// 动漫角色库数据校验：结构、字段、标签格式、性别拆分、数量
const fs = require('fs');
const src = fs.readFileSync('anime.js', 'utf8');
const A = (zh, en, year, male, female) => {
  const parse = (arr) => (arr || []).map(s => {
    const i = s.lastIndexOf(':');
    return i > 0 ? { t: s.slice(0, i), zh: s.slice(i + 1) } : { t: s, zh: s };
  });
  return { zh, en, year, male: parse(male), female: parse(female) };
};

const start = src.indexOf('const ANIME_DB = ');
const i0 = start + 'const ANIME_DB = '.length;
let i = i0, depth = 0, inStr = false, esc = false;
for (; i < src.length; i++) {
  const ch = src[i];
  if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === "'") inStr = false; continue; }
  if (ch === "'") { inStr = true; continue; }
  if (ch === '{') depth++;
  else if (ch === '}') { depth--; if (depth === 0) break; }
}
const DB = eval('(' + src.slice(i0, i + 1) + ')');

let pass = 0, fail = 0;
const assert = (cond, name) => { if (cond) { pass++; } else { fail++; console.log('  FAIL', name); } };
const TAG_RE = /^[a-z0-9_\-\.\(\)]+$/;

let totalChars = 0;
for (const [area, list] of Object.entries(DB)) {
  console.log(`== ${area === 'jp' ? '日本动漫' : '中国动漫'} ==`);
  assert(Array.isArray(list) && list.length > 0, `${area}: 有数据`);
  assert(list.length >= (area === 'jp' ? 100 : 40), `${area}: 数量达标（${list.length} 部）`);
  const seenTitles = new Set(), seenChars = new Set();
  let areaChars = 0;
  for (const a of list) {
    if (!a.zh || !a.zh.trim()) { console.log('   缺中文名 @', area); fail++; }
    if (!a.en || !a.en.trim()) { console.log('   缺英文名:', a.zh, '@', area); fail++; }
    if (typeof a.year !== 'number') { console.log('   年份非法:', a.zh, '@', area); fail++; }
    if (seenTitles.has(a.zh)) { console.log('   作品名重复:', a.zh, '@', area); fail++; }
    seenTitles.add(a.zh);
    for (const g of ['male', 'female']) {
      const list2 = a[g] || [];
      const seen = new Set();
      for (const c of list2) {
        areaChars++;
        if (!c.t || !TAG_RE.test(c.t)) { console.log(`   角色标签非法: "${c.t}" @ ${a.zh}(${g})`, '@', area); fail++; }
        if (!c.zh || !c.zh.trim()) { console.log('   角色缺中文名:', c.t, '@', a.zh, '@', area); fail++; }
        if (seen.has(c.t)) { console.log('   同作内角色重复:', c.t, '@', a.zh, '@', area); fail++; }
        seen.add(c.t);
      }
    }
  }
  totalChars += areaChars;
  console.log(`  ${list.length} 部 · ${areaChars} 个角色`);
}
console.log('== 汇总 ==');
assert(totalChars >= 500, `角色总量 >= 500（实际 ${totalChars}）`);
assert(DB.jp.some(a => a.male.length && a.female.length), '存在男女角色都有的作品（验证性别拆分有效性）');
assert(DB.cn.some(a => a.male.length), '国漫存在男性角色（男同区可用）');
assert(DB.cn.some(a => a.female.length), '国漫存在女性角色（女同区可用）');

console.log(`\n结果: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
