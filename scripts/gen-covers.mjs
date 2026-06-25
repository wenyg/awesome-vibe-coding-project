// 一次性脚本：为种子项目生成占位封面 SVG。
// 真实投稿的封面来自作者在 GitHub Issue 上传的图片，无需此脚本。
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'covers');

const covers = [
  { name: 'recipe-helper', emoji: '🍳', title: '今天吃什么', c1: '#ff7a59', c2: '#ff5470' },
  { name: 'pixel-pet', emoji: '🐱', title: '像素宠物', c1: '#7c5cff', c2: '#4dd0ff' },
  { name: 'mood-diary', emoji: '🌙', title: '心情日记', c1: '#5b6cff', c2: '#9b5cff' },
  { name: 'invoice-ocr', emoji: '🧾', title: '发票识别', c1: '#00b894', c2: '#4dd0ff' },
  { name: 'flashcard', emoji: '📚', title: 'AI 单词卡', c1: '#ff9f43', c2: '#ee5253' },
  { name: 'fitness-coach', emoji: '💪', title: '健身打卡', c1: '#0abde3', c2: '#7c5cff' },
];

for (const { name, emoji, title, c1, c2 } of covers) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#g)"/>
  <text x="400" y="240" font-size="150" text-anchor="middle" font-family="Segoe UI,Arial">${emoji}</text>
  <text x="400" y="360" font-size="56" font-weight="800" fill="#ffffff" text-anchor="middle" font-family="PingFang SC,Microsoft YaHei,Arial">${title}</text>
</svg>`;
  writeFileSync(join(dir, `${name}.svg`), svg);
  console.log('generated', name);
}
