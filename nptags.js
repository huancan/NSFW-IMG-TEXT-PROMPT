/* ================================================================
 * nptags.js — 负面提示词分类标签库（Negative Prompt Tag Library）
 *
 * 与 tags.js 的 T() / 正向标签格式保持一致：{ t, nsfw, zh, w }
 * 这里 nsfw 字段保留以保持数据形状一致，但负面词一律为 0（不参与正向强度过滤）。
 *
 * 数据形状：
 *   NEGATIVE_TAG_CATEGORIES = [
 *     { key, label, tags: [ { t, nsfw, zh, w?, preview? }, ... ], preview? },
 *     ...
 *   ]
 *   - preview（分类预览）: 一键选用整类时插入到 #negOutput 的字符串模板
 *   - 每个 tag 自带的 preview?: 单条插入到 #negOutput 的字符串模板，缺省时直接用 t
 *
 * 加载顺序：tags.js → anime.js → nptags.js → app.js
 * 该文件仅提供数据，不修改现有 NEGATIVE_DEFAULT / MODEL_PRESETS，
 * 保证向后兼容（smoke / validate / count / idcheck 测试不受影响）。
 *
 * 男同 / 女同共用「通用」分类；性器官/身体特定部位的负面词严格按模式分开。
 * ================================================================ */
'use strict';

function N(t, zh, recW, preview) {
  const o = { t, nsfw: 0, zh, w: recW };
  if (preview) o.preview = preview;
  return o;
}

/* ---------- 📉 画质与伪影（通用） ---------- */
const NEG_QUALITY_ARTIFACTS = [
  N('lowres', '低分辨率'),
  N('worst quality', '最差质量'),
  N('low quality', '低质量'),
  N('normal quality', '普通质量'),
  N('bad quality', '低劣质量'),
  N('jpeg artifacts', 'JPEG 压缩伪影'),
  N('blurry', '模糊'),
  N('motion blur', '动态模糊'),
  N('out of focus', '失焦'),
  N('noise', '噪点'),
  N('film grain', '胶片颗粒（不想保留时禁用）'),
  N('compression artifacts', '压缩失真'),
  N('aliasing', '锯齿'),
  N('pixelated', '像素化'),
  N('grainy', '颗粒感重'),
  N('washed out', '褪色'),
  N('dull colors', '色彩暗淡'),
  N('flat colors', '色彩扁平'),
  N('harsh lighting', '刺眼光照'),
  N('poor lighting', '糟糕打光'),
  N('flat shading', '平面着色'),
  N('unrealistic lighting', '不真实打光'),
  N('oversaturated', '过饱和'),
  N('undersaturated', '欠饱和'),
  N('overexposed', '过曝'),
  N('underexposed', '欠曝'),
  N('low contrast', '低对比度'),
  N('high contrast', '高对比度（过强）'),
  N('color banding', '色带'),
  N('chromatic aberration', '色差'),
];

/* ---------- 🦴 人体结构（通用） ---------- */
const NEG_BODY_STRUCTURE = [
  N('bad anatomy', '人体结构错误'),
  N('bad proportions', '比例失调'),
  N('anatomical error', '解剖错误'),
  N('deformed', '畸形'),
  N('disfigured', '毁容'),
  N('malformed', '形态异常'),
  N('mutated', '突变'),
  N('mutated hands', '手部突变'),
  N('mutated fingers', '手指突变'),
  N('deformed limbs', '四肢畸形'),
  N('malformed limbs', '四肢异常'),
  N('extra limbs', '多余四肢'),
  N('missing limbs', '缺失四肢'),
  N('long neck', '脖子过长'),
  N('short neck', '脖子过短'),
  N('elongated torso', '躯干拉长'),
  N('fused body', '身体融合'),
  N('duplicate', '重复元素'),
  N('conjoined', '连体'),
  N('poorly drawn body', '身体绘制粗糙'),
  N('poorly drawn figure', '人物绘制粗糙'),
  N('cloned face', '克隆脸'),
  N('extra heads', '多头'),
  N('two heads', '双头'),
  N('extra body parts', '多余身体部位'),
  N('gross proportions', '比例怪异'),
  N('body horror', '肉体恐怖'),
  N('asymmetric body', '身体不对称'),
  N('twisted torso', '躯干扭曲'),
  N('broken pose', '姿势崩坏'),
];

/* ---------- 🧬 手指与四肢（通用） ---------- */
const NEG_HANDS_LIMBS = [
  N('bad hands', '手部崩坏'),
  N('bad fingers', '手指崩坏'),
  N('extra fingers', '多指'),
  N('fewer fingers', '少指'),
  N('missing fingers', '缺指'),
  N('extra digit', '多余指头'),
  N('fewer digits', '指头偏少'),
  N('fused fingers', '手指融合'),
  N('too many fingers', '手指过多'),
  N('three hands', '三只手'),
  N('four arms', '四条手臂'),
  N('extra arms', '多余手臂'),
  N('missing arms', '缺臂'),
  N('extra legs', '多余腿'),
  N('missing legs', '缺腿'),
  N('extra feet', '多余脚'),
  N('bad feet', '脚部崩坏'),
  N('too many toes', '脚趾过多'),
  N('deformed hands', '手部畸形'),
  N('poorly drawn hands', '手部绘制粗糙'),
  N('poorly drawn fingers', '手指绘制粗糙'),
];

/* ---------- 👁 面部与五官（通用） ---------- */
const NEG_FACE_FEATURES = [
  N('bad face', '面部崩坏'),
  N('deformed face', '面部畸形'),
  N('bad eyes', '眼部崩坏'),
  N('cross-eyed', '斗鸡眼'),
  N('asymmetric eyes', '眼睛不对称'),
  N('extra eyes', '多眼'),
  N('missing eyes', '缺眼'),
  N('bad eyebrows', '眉部崩坏'),
  N('bad nose', '鼻子崩坏'),
  N('bad mouth', '嘴部崩坏'),
  N('bad ears', '耳朵崩坏'),
  N('extra ears', '多耳'),
  N('poorly drawn face', '面部绘制粗糙'),
  N('poorly drawn eyes', '眼部绘制粗糙'),
  N('unnatural skin texture', '皮肤质感不自然'),
  N('plastic skin', '塑料皮肤'),
  N('waxy skin', '蜡质皮肤'),
  N('ugly', '丑陋'),
  N('disgusting', '恶心'),
  N('grotesque', '怪诞'),
];

/* ---------- 🚫 水印与文字（通用） ---------- */
const NEG_WATERMARK_TEXT = [
  N('watermark', '水印'),
  N('signature', '签名'),
  N('artist name', '画师名'),
  N('username', '用户名'),
  N('text', '文字'),
  N('logo', '标志'),
  N('copyright', '版权标识'),
  N('subtitle', '字幕'),
  N('caption', '标题文字'),
  N('speech bubble', '对话框'),
  N('english text', '英文字（要无字画面时）'),
  N('chinese text', '中文字（要无字画面时）'),
  N('japanese text', '日文字（要无字画面时）'),
  N('letters', '字母'),
  N('numbers', '数字'),
];

/* ---------- 🎨 风格与维度（通用） ---------- */
const NEG_STYLE_3D = [
  N('3d', '3D 渲染风'),
  N('cgi', 'CGI 渲染'),
  N('3d render', '3D 渲染'),
  N('sketch', '草图风'),
  N('pencil sketch', '铅笔草图'),
  N('line art', '线稿'),
  N('wireframe', '线框'),
  N('unfinished', '未完成'),
  N('cropped', '截断/裁切'),
  N('out of frame', '出框'),
  N('border', '边框'),
  N('multiple views', '多视图'),
  N('reference sheet', '参考资料表'),
  N('color guide', '色板'),
  N('monochrome', '单色'),
  N('grayscale', '灰度'),
  N('greyscale', '灰度（英式拼写）'),
  N('sepia', '褐色调'),
];

/* ---------- 🏗 背景与构图（通用） ---------- */
const NEG_BG_COMPOSITION = [
  N('plain background', '纯色背景'),
  N('empty background', '空背景'),
  N('boring background', '单调背景'),
  N('simple background', '简单背景'),
  N('white background', '白底'),
  N('black background', '黑底'),
  N('cut off', '切边'),
  N('cutoff', '裁切'),
  N('off-screen', '出画'),
  N('partial view', '半截画面'),
  N('split image', '画面割裂'),
  N('double image', '双重图像'),
  N('doubled', '重复'),
  N('split screen', '分屏'),
  N('tiled', '平铺'),
  N('collage', '拼贴'),
  N('panels', '分格漫画'),
  N('comic', '漫画格'),
];

/* ---------- 🧠 内容主题排除（通用） ---------- */
const NEG_THEMES = [
  N('violence', '暴力'),
  N('gore', '血腥'),
  N('blood', '流血'),
  N('wound', '伤口'),
  N('injury', '外伤'),
  N('scars', '疤痕'),
  N('bruises', '淤青'),
  N('weapons', '武器'),
  N('gun', '枪支'),
  N('sword', '刀剑'),
  N('knife', '刀具'),
  N('smoking', '吸烟'),
  N('drugs', '毒品'),
  N('alcohol', '酒精'),
  N('drunk', '醉酒'),
  N('pregnant', '怀孕'),
  N('pregnancy', '怀孕状态'),
  N('loli', '萝莉（未成年）'),
  N('shota', '正太（未成年）'),
  N('underage', '未成年'),
  N('child', '儿童'),
  N('baby', '婴儿'),
  N('old person', '老年人'),
  N('elderly', '老人'),
];

/* ---------- 🏆 模型专属负面词（通用） ---------- */
const NEG_MODEL_SPECIFIC = [
  // Illustrious / Nova / Pony 体系：屏蔽低分图
  N('score_4', '屏蔽 4 分（Illustrious/Nova）', 1, 'score_4'),
  N('score_5', '屏蔽 5 分（Illustrious/Nova）', 1, 'score_5'),
  N('score_6', '屏蔽 6 分（Illustrious/Nova）', 1, 'score_6'),
  N('source_cartoon', '卡通来源（Pony 体系）', 1, 'source_cartoon'),
  N('source_pony', 'Pony 来源', 1, 'source_pony'),
  N('source_furry', '兽人来源（Pony 体系）', 1, 'source_furry'),
  // SDXL 通用：low quality family
  N('lowres', '低分辨率（SDXL 体系）', 1, 'lowres'),
  N('error', '错误图（SDXL 体系）', 1, 'error'),
];

/* ---------- 🔞 男同 NSFW 身体部位负面（男同性器官专属） ----------
 * 仅包含男性生殖器相关负面词（丁丁 / 肛门），不含女性部位 */
const NEG_GAY_BODY = [
  N('bad cock', '丁丁崩坏'),
  N('bad penis', '丁丁崩坏（备选词）'),
  N('bad anus', '肛门崩坏'),
  N('bad pubic hair', '阴毛崩坏'),
  N('fused anus', '肛门融合'),
  N('poorly drawn cock', '丁丁绘制粗糙'),
  N('poorly drawn penis', '丁丁绘制粗糙（备选词）'),
  N('poorly drawn anus', '肛门绘制粗糙'),
  N('poorly drawn genitals', '生殖器绘制粗糙（男）'),
  N('extra penis', '多丁丁'),
  N('extra cock', '多丁丁（备用词）'),
  N('mutated cock', '丁丁突变'),
  N('mutated penis', '丁丁突变（备选词）'),
  N('deformed penis', '丁丁畸形'),
  N('misshapen cock', '丁丁畸形（备选词）'),
  N('fused cock', '丁丁融合'),
  N('extra anus', '多余肛门'),
  N('bad testicles', '睾丸崩坏'),
  N('bad scrotum', '阴囊崩坏'),
  // male nipples are less problematic; no dedicated nipple tags for gay mode
];

/* ---------- 🔞 男同：禁止女性化私处（性别翻转禁止） ----------
 * 男同角色不应出现的女性体征：阴部/阴道/胸部/乳晕等 */
const NEG_GAY_FORBID_FEMALE = [
  N('female pubic hair', '女性阴毛（男角色不应有）'),
  N('pussy', '阴部（禁止女性化）'),
  N('vagina', '阴道（禁止女性化）'),
  N('female genitalia', '女性生殖器（禁止）'),
  N('labia', '阴唇（禁止女性化）'),
  N('clitoris', '阴蒂（禁止女性化）'),
  N('breasts', '胸部（男角色不应有）'),
  N('female breasts', '女性胸部（禁止）'),
  N('cleavage', '乳沟（禁止女性化）'),
  N('female body', '女性身体（禁止）'),
  N('feminized', '女性化（禁止）'),
  N('genderbend', '性转（禁止）'),
  N('futanari', '扶她（禁止，男同不想要）'),
  N('feminization', '女性化改造（禁止）'),
  N('wide hips', '宽胯（女性化暗示，男角避免）'),
  N('feminine figure', '女性化身材（禁止）'),
];

/* ---------- 🔞 女同 NSFW 身体部位负面（女同性器官专属） ----------
 * 仅包含女性生殖器相关负面词（阴部 / 胸部 / 乳头），不含男性部位 */
const NEG_LESBIAN_BODY = [
  N('bad pussy', '阴部崩坏'),
  N('bad nipples', '乳头崩坏'),
  N('bad breasts', '胸部崩坏'),
  N('bad small breasts', '小胸崩坏'),
  N('bad pubic hair', '阴毛崩坏'),
  N('fused pussy', '阴部融合'),
  N('poorly drawn pussy', '阴部绘制粗糙'),
  N('poorly drawn breasts', '胸部绘制粗糙'),
  N('poorly drawn nipples', '乳头绘制粗糙'),
  N('poorly drawn genitals', '生殖器绘制粗糙（女）'),
  N('extra nipples', '多乳头'),
  N('extra pussy', '多阴部'),
  N('mutated pussy', '阴部突变'),
  N('mutated breasts', '胸部突变'),
  N('deformed breasts', '胸部畸形'),
  N('misshapen pussy', '阴部畸形'),
  N('bad vagina', '阴道崩坏'),
  N('extra breasts', '多乳房'),
  N('fused breasts', '胸部融合'),
];

/* ---------- 🔞 女同：禁止男性化私处（性别翻转禁止） ----------
 * 女同角色不应出现的男性体征：丁丁/睾丸/喉结等 */
const NEG_LESBIAN_FORBID_MALE = [
  N('male pubic hair', '男性阴毛（女角色不应有）'),
  N('penis', '丁丁（禁止男性化）'),
  N('cock', '丁丁（禁止男性化，备用词）'),
  N('male genitalia', '男性生殖器（禁止）'),
  N('testicles', '睾丸（禁止男性化）'),
  N('scrotum', '阴囊（禁止男性化）'),
  N('adams apple', '喉结（男性化暗示，女角避免）'),
  N('male body', '男性身体（禁止）'),
  N('masculinized', '男性化（禁止）'),
  N('genderbend', '性转（禁止）'),
  N('futanari', '扶她（禁止，女同不想要）'),
  N('masculinization', '男性化改造（禁止）'),
  N('broad shoulders', '宽肩（男性化暗示，女角避免）'),
  N('masculine figure', '男性化身材（禁止）'),
  N('male chest', '男性胸膛（禁止女性化）'),
];

/* ---------- 🔞 共用的审查/码负面词（两个模式都能用） ---------- */
const NEG_CENSOR = [
  N('censored', '有马赛克（想出步兵时加）'),
  N('mosaic', '马赛克（想出步兵时加）'),
  N('mosaic censoring', '马赛克打码'),
  N('bar censor', '黑条打码'),
  N('blur censor', '模糊打码'),
  N('mosaic over genitals', '阴部马赛克'),
  N('censor bar over genitals', '阴部黑条'),
  N('pixelated nipples', '乳头像素化'),
];

/* ---------- 共用分类总表（两个模式都显示） ---------- */
const NEG_SHARED_CATEGORIES = [
  {
    key: 'quality',
    label: '📉 画质与伪影',
    tags: NEG_QUALITY_ARTIFACTS,
    preview: 'lowres, worst quality, low quality, jpeg artifacts, blurry, noise, overexposed, underexposed, oversaturated, low contrast, aliasing',
  },
  {
    key: 'body',
    label: '🦴 人体结构',
    tags: NEG_BODY_STRUCTURE,
    preview: 'bad anatomy, bad proportions, deformed, disfigured, mutated, extra limbs, long neck, cloned face, gross proportions, malformed limbs',
  },
  {
    key: 'hands',
    label: '🧬 手指与四肢',
    tags: NEG_HANDS_LIMBS,
    preview: 'bad hands, bad fingers, extra fingers, fewer fingers, fused fingers, extra arms, extra legs, missing arms, poorly drawn hands, three hands',
  },
  {
    key: 'face',
    label: '👁 面部与五官',
    tags: NEG_FACE_FEATURES,
    preview: 'bad face, bad eyes, cross-eyed, asymmetric eyes, ugly, poorly drawn face, deformed face, plastic skin, bad mouth, bad nose',
  },
  {
    key: 'wm',
    label: '🚫 水印与文字',
    tags: NEG_WATERMARK_TEXT,
    preview: 'watermark, signature, text, logo, username, artist name, english text, japanese text, copyright, speech bubble',
  },
  {
    key: 'style',
    label: '🎨 风格与维度',
    tags: NEG_STYLE_3D,
    preview: '3d, cgi, sketch, line art, monochrome, grayscale, unfinished, cropped, out of frame, multiple views',
  },
  {
    key: 'bg',
    label: '🏗 背景与构图',
    tags: NEG_BG_COMPOSITION,
    preview: 'plain background, simple background, white background, out of frame, cropped, split image, comic, panels, collage, boring background',
  },
  {
    key: 'themes',
    label: '🧠 主题排除（暴力/未成年/特定题材）',
    tags: NEG_THEMES,
    preview: 'violence, gore, blood, weapons, pregnant, underage, loli, shota, child, smoking',
  },
  {
    key: 'model',
    label: '🏆 模型专属负面词（Illustrious/Nova/Pony）',
    tags: NEG_MODEL_SPECIFIC,
    preview: 'score_4, score_5, score_6, source_cartoon, source_pony',
  },
];

/* ---------- 模式专属分类 ---------- */
const NEG_GAY_EXCLUSIVE_CATEGORIES = [
  {
    key: 'nsfw_gay',
    label: '🔞 男同身体部位负面（丁丁/肛门）',
    tags: NEG_GAY_BODY,
    preview: 'bad cock, bad penis, bad anus, poorly drawn cock, extra penis, fused anus, bad testicles',
  },
  {
    key: 'forbid_female',
    label: '🚫 男同禁止女性化私处（禁止性别翻转）',
    tags: NEG_GAY_FORBID_FEMALE,
    preview: 'female pubic hair, pussy, vagina, female genitalia, breasts, feminized, genderbend, futanari, wide hips',
  },
];

const NEG_LESBIAN_EXCLUSIVE_CATEGORIES = [
  {
    key: 'nsfw_lesbian',
    label: '🔞 女同身体部位负面（阴部/胸部/乳头）',
    tags: NEG_LESBIAN_BODY,
    preview: 'bad pussy, bad nipples, bad breasts, poorly drawn pussy, extra nipples, fused breasts',
  },
  {
    key: 'forbid_male',
    label: '🚫 女同禁止男性化私处（禁止性别翻转）',
    tags: NEG_LESBIAN_FORBID_MALE,
    preview: 'male pubic hair, penis, cock, male genitalia, testicles, adams apple, masculinized, genderbend, futanari',
  },
];

/* ---------- 审查/码分类（两个模式都用，单独挂到共用表末尾） ---------- */
const NEG_CENSOR_CATEGORY = {
  key: 'censor',
  label: '🚫 审查/码（步兵/骑兵）',
  tags: NEG_CENSOR,
  preview: 'censored, mosaic, mosaic censoring, bar censor, blur censor, pixelated nipples',
};

/* ---------- 模式感知的负面词分类总表 ---------- */

/**
 * 返回当前模式应显示的负面词分类数组。
 * 男同（gay）：共用分类 + 男同性器官负面 + 禁止女性化 + 审查/码
 * 女同（lesbian）：共用分类 + 女同性器官负面 + 禁止男性化 + 审查/码
 * @param {'gay'|'lesbian'} mode
 * @returns {Array<{key:string, label:string, tags:Array, preview?:string}>}
 */
function negativeCategories(mode) {
  const exclusive = mode === 'gay'
    ? NEG_GAY_EXCLUSIVE_CATEGORIES
    : mode === 'lesbian'
      ? NEG_LESBIAN_EXCLUSIVE_CATEGORIES
      : [];
  return [...NEG_SHARED_CATEGORIES, ...exclusive, NEG_CENSOR_CATEGORY];
}

/* ---------- 默认全量（兼容旧引用） ---------- */
const NEGATIVE_TAG_CATEGORIES = negativeCategories('gay');

/* ---------- 便捷工具 ---------- */

/** 拍平指定模式的所有分类里的负面词（去重） */
function allNegativeTags(mode) {
  const cats = mode ? negativeCategories(mode) : NEGATIVE_TAG_CATEGORIES;
  const seen = new Set();
  const out = [];
  for (const cat of cats) {
    for (const tag of cat.tags) {
      if (seen.has(tag.t)) continue;
      seen.add(tag.t);
      out.push(tag);
    }
  }
  return out;
}

/** 按模式 + 分类键合并成一段负面提示词字符串（默认逗号分隔） */
function negativeTextByCategory(catKey, joiner = ', ', mode) {
  const cats = mode ? negativeCategories(mode) : NEGATIVE_TAG_CATEGORIES;
  const cat = cats.find(c => c.key === catKey);
  if (!cat) return '';
  return cat.tags.map(t => t.preview || t.t).join(joiner);
}

/** 一键"全部分类"汇总（带 preview 优先） */
function allNegativeText(joiner = ', ', mode) {
  const cats = mode ? negativeCategories(mode) : NEGATIVE_TAG_CATEGORIES;
  const seen = new Set();
  const out = [];
  for (const cat of cats) {
    for (const tag of cat.tags) {
      const k = tag.preview || tag.t;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(k);
    }
  }
  return out.join(joiner);
}

/* 暴露到全局（与 tags.js / anime.js 风格一致：无 module，纯脚本） */
if (typeof window !== 'undefined') {
  window.NEGATIVE_TAG_CATEGORIES = NEGATIVE_TAG_CATEGORIES;
  window.NEG_SHARED_CATEGORIES = NEG_SHARED_CATEGORIES;
  window.NEG_GAY_EXCLUSIVE_CATEGORIES = NEG_GAY_EXCLUSIVE_CATEGORIES;
  window.NEG_LESBIAN_EXCLUSIVE_CATEGORIES = NEG_LESBIAN_EXCLUSIVE_CATEGORIES;
  window.negativeCategories = negativeCategories;
  window.allNegativeTags = allNegativeTags;
  window.negativeTextByCategory = negativeTextByCategory;
  window.allNegativeText = allNegativeText;
}
