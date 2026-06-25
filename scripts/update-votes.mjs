// 抓取每个项目对应投稿 Issue 上的「点赞类」表情数，写回项目 JSON 的 votes 字段。
// 在定时 GitHub Action 中运行，依赖环境变量：GITHUB_TOKEN、GITHUB_REPOSITORY (owner/repo)。
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'src', 'content', 'projects');

const repo = process.env.GITHUB_REPOSITORY; // "owner/repo"
const token = process.env.GITHUB_TOKEN;

if (!repo || !token) {
  console.error('缺少 GITHUB_REPOSITORY 或 GITHUB_TOKEN 环境变量。');
  process.exit(1);
}

// 计入热度的正向表情
const POSITIVE = new Set(['+1', 'heart', 'hooray', 'rocket', 'laugh']);

async function fetchReactionCount(issueNumber) {
  let total = 0;
  let page = 1;
  // 表情接口分页，每页最多 100
  while (true) {
    const url = `https://api.github.com/repos/${repo}/issues/${issueNumber}/reactions?per_page=100&page=${page}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (!res.ok) {
      console.warn(`Issue #${issueNumber} 表情拉取失败：${res.status}`);
      break;
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    total += data.filter((r) => POSITIVE.has(r.content)).length;
    if (data.length < 100) break;
    page++;
  }
  return total;
}

async function main() {
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  let changed = 0;

  for (const file of files) {
    const path = join(dir, file);
    const data = JSON.parse(readFileSync(path, 'utf8'));
    if (!data.issueNumber) continue;

    const votes = await fetchReactionCount(data.issueNumber);
    if (votes !== data.votes) {
      data.votes = votes;
      writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
      changed++;
      console.log(`更新 ${file}: votes -> ${votes}`);
    }
  }

  console.log(`完成，共更新 ${changed} 个项目。`);
}

main();
