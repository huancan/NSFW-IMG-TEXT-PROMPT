const vm = require('vm');
const fs = require('fs');
const g = { window: {} };
vm.createContext(g);
vm.runInContext(fs.readFileSync('nptags.js', 'utf8'), g);

const nc = g.negativeCategories;
if (!nc) { console.error('negativeCategories 未定义'); process.exit(1); }

const gay = nc('gay');
const les = nc('lesbian');

console.log('=== 男同 (gay) ===');
console.log('分类数:', gay.length);
gay.forEach(c => console.log('  ' + c.key.padEnd(18), c.label, '=>', c.tags.length + '条'));

console.log('\n=== 女同 (lesbian) ===');
console.log('分类数:', les.length);
les.forEach(c => console.log('  ' + c.key.padEnd(18), c.label, '=>', c.tags.length + '条'));

// 排除 forbid 分类（这些分类故意包含异性词汇），只检查 body 分类
console.log('\n=== 性器官分离检查（仅 body 分类，排除 forbid） ===');
let leak = 0;
const femaleWords = ['pussy', 'breast', 'nipple', 'vagina'];
const maleWords = ['cock', 'penis', 'testicle', 'scrotum'];

for (const c of gay) {
  if (c.key.startsWith('forbid')) continue; // forbid 分类故意包含异性词
  for (const t of c.tags) {
    if (femaleWords.some(w => t.t.includes(w))) {
      console.log('  ERR 男同' + c.key + '出现女词:', t.t);
      leak++;
    }
  }
}
for (const c of les) {
  if (c.key.startsWith('forbid')) continue;
  for (const t of c.tags) {
    if (maleWords.some(w => t.t.includes(w))) {
      console.log('  ERR 女同' + c.key + '出现男词:', t.t);
      leak++;
    }
  }
}

console.log('错误数:', leak);
console.log('检查完成');
