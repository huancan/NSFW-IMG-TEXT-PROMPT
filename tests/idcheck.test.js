// 交叉核对 app.js 引用的元素 ID 是否都存在于 index.html
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('app.js', 'utf8');

const ids = [...new Set([...js.matchAll(/\$\(['"]#([a-zA-Z0-9]+)['"]\)/g)].map(m => m[1]))];
const missing = ids.filter(id => !html.includes('id="' + id + '"'));
console.log('app.js 引用的 ID 数:', ids.length);
console.log(missing.length ? '缺失: ' + missing.join(', ') : '所有 ID 均存在于 index.html OK');

const modeBtns = (html.match(/data-mode="(gay|lesbian)"/g) || []).length;
console.log('data-mode 按钮:', modeBtns);
console.log('data-tab 按钮:', (html.match(/data-tab="(fav|hist)"/g) || []).length);
