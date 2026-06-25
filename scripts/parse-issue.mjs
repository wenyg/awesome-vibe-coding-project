// 解析「投稿」Issue（GitHub Issue Forms 生成的正文），输出项目 JSON 到 src/content/projects/。
// 在 GitHub Action 中运行；本地调试可设置 ISSUE_BODY / ISSUE_NUMBER / ISSUE_TITLE 环境变量。
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src', 'content', 'projects');
const coverDir = join(root, 'public', 'covers');

// 分类 -> emoji，用于自动生成封面
const CATEGORY_EMOJI = {
  weapp: '📱',
  minigame: '🎮',
  website: '🌐',
  tool: '🛠️',
  other: '✨',
};

// 渐变配色池，按 slug 哈希挑选，保证同一项目封面稳定
const PALETTE = [
  ['#7c5cff', '#4dd0ff'],
  ['#ff7a59', '#ff5470'],
  ['#00b894', '#4dd0ff'],
  ['#ff9f43', '#ee5253'],
  ['#5b6cff', '#9b5cff'],
  ['#0abde3', '#7c5cff'],
];

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// 没有封面时，按 项目名 + 分类 自动生成一张渐变封面 SVG
function generateCover(slug, title, category) {
  mkdirSync(coverDir, { recursive: true });
  const emoji = CATEGORY_EMOJI[category] ?? '✨';
  const [c1, c2] = PALETTE[hash(slug) % PALETTE.length];
  const safe = title.replace(/[<>&]/g, '').slice(0, 12);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#g)"/>
  <text x="400" y="240" font-size="150" text-anchor="middle" font-family="Segoe UI,Arial">${emoji}</text>
  <text x="400" y="360" font-size="56" font-weight="800" fill="#ffffff" text-anchor="middle" font-family="PingFang SC,Microsoft YaHei,Arial">${safe}</text>
</svg>`;
  writeFileSync(join(coverDir, `${slug}.svg`), svg);
  return `/covers/${slug}.svg`;
}

// ---- 读取 Issue 数据 ----
function loadIssue() {
  if (process.env.GITHUB_EVENT_PATH) {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    const issue = event.issue ?? {};
    return { body: issue.body ?? '', number: issue.number, title: issue.title ?? '' };
  }
  return {
    body: process.env.ISSUE_BODY ?? '',
    number: Number(process.env.ISSUE_NUMBER ?? 0),
    title: process.env.ISSUE_TITLE ?? '',
  };
}

// ---- 把 Issue Forms 正文解析成 字段标签 -> 文本 的映射 ----
// Issue Forms 渲染格式为：### 标签\n\n内容\n\n### 下一个标签 ...
function parseFields(body) {
  const map = {};
  const parts = body.split(/^###\s+/m).slice(1);
  for (const part of parts) {
    const nl = part.indexOf('\n');
    const label = part.slice(0, nl === -1 ? undefined : nl).trim().replace(/\s*\*$/, '');
    const value = nl === -1 ? '' : part.slice(nl + 1).trim();
    map[label] = value;
  }
  return map;
}

function isEmpty(v) {
  return !v || /^_no response_$/i.test(v.trim());
}

// 从一段文本里抽取第一张图片 URL（markdown ![..](url)、html <img src> 或裸链接）
function extractImage(text) {
  if (isEmpty(text)) return undefined;
  const md = text.match(/!\[[^\]]*\]\((https?:\/\/[^)]+)\)/);
  if (md) return md[1];
  const html = text.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
  if (html) return html[1];
  const bare = text.match(/https?:\/\/\S+\.(?:png|jpe?g|gif|webp|svg)\b/i);
  if (bare) return bare[0];
  return undefined;
}

function extractUrl(text) {
  if (isEmpty(text)) return undefined;
  const m = text.match(/https?:\/\/\S+/);
  return m ? m[0].replace(/[).,]+$/, '') : undefined;
}

function clean(text) {
  return isEmpty(text) ? undefined : text.trim();
}

const CATEGORY_MAP = {
  小程序: 'weapp',
  小游戏: 'minigame',
  网站: 'website',
  工具: 'tool',
  其他: 'other',
};

function slugify(title, number) {
  const ascii = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return ascii ? `${ascii}-${number}` : `project-${number}`;
}

function main() {
  const { body, number, title } = loadIssue();
  if (!body) {
    console.error('空的 Issue 正文，跳过。');
    process.exit(1);
  }
  const f = parseFields(body);

  const categoryCn = clean(f['项目分类']);
  const category = CATEGORY_MAP[categoryCn] ?? 'other';

  const titleVal = clean(f['项目名称']) ?? title.replace(/^\[投稿\]\s*/, '');
  const slug = slugify(titleVal, number);

  // 作者上传了封面就用，否则按 项目名 + 分类 自动生成
  const cover = extractImage(f['封面图']) ?? generateCover(slug, titleVal, category);

  const tagsRaw = clean(f['标签']) ?? '';
  const tags = tagsRaw
    .split(/[,，、]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 4);

  const project = {
    title: titleVal,
    summary: clean(f['一句话简介']) ?? '',
    category,
    tags,
    cover,
    liveUrl: extractUrl(f['在线体验链接']),
    qrcode: extractImage(f['体验二维码']),
    repoUrl: extractUrl(f['源码 / GitHub 链接']),
    downloadUrl: extractUrl(f['下载链接']),
    author: clean(f['你的昵称']) ?? '匿名作者',
    authorUrl: extractUrl(f['你的主页 / 联系方式']),
    votes: 0,
    issueNumber: number,
    featured: false,
    date: new Date().toISOString().slice(0, 10),
  };

  // 去掉值为 undefined 的可选字段
  for (const k of Object.keys(project)) {
    if (project[k] === undefined) delete project[k];
  }

  mkdirSync(outDir, { recursive: true });
  const file = join(outDir, `${slug}.json`);
  writeFileSync(file, JSON.stringify(project, null, 2) + '\n');

  console.log(`生成项目文件：src/content/projects/${slug}.json`);
  // 把 slug 暴露给后续 workflow 步骤
  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(process.env.GITHUB_OUTPUT, `slug=${slug}\ntitle=${project.title}\n`, {
      flag: 'a',
    });
  }
}

main();
