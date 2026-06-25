// 全站基础配置，集中管理便于后续替换正式信息。
export const SITE = {
  name: 'AI 造物馆',
  tagline: '为热爱而造',
  description:
    '一个想法 + AI，人人都能做出自己的作品。来逛逛别人的造物，也来晒晒你的。',
  // 正式域名（Cloudflare Pages 绑定）
  url: 'https://zaowuguan.com',
  // GitHub 仓库信息：用于生成投稿入口与投票链接
  github: {
    owner: 'wenyg',
    repo: 'awesome-vibe-coding-project',
  },
  // Cloudflare Web Analytics token，部署后填入即可启用埋点
  cfAnalyticsToken: '',
} as const;

export function repoUrl(): string {
  return `https://github.com/${SITE.github.owner}/${SITE.github.repo}`;
}

// 投稿入口：跳转到 Issue Forms 投稿模板
export function submitUrl(): string {
  return `${repoUrl()}/issues/new?template=submit.yml&labels=submission`;
}

// 某个项目对应投稿 Issue 的链接（用于"点赞投票"）
export function issueUrl(issueNumber?: number): string {
  if (!issueNumber) return `${repoUrl()}/issues`;
  return `${repoUrl()}/issues/${issueNumber}`;
}

// ---- base 自适应：兼容 GitHub Pages 子路径与 Cloudflare 根路径 ----
function basePrefix(): string {
  // import.meta.env.BASE_URL 形如 '/' 或 '/awesome-vibe-coding-project/'
  return import.meta.env.BASE_URL.replace(/\/$/, '');
}

// 站内页面链接：link('/ranking') -> '/awesome-vibe-coding-project/ranking'
export function link(path: string): string {
  const p = `${basePrefix()}/${path.replace(/^\//, '')}`.replace(/\/{2,}/g, '/');
  return p || '/';
}

// 本地静态资源（public 下）：远程 http(s) 链接原样返回，本地路径加 base
export function asset(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return link(path);
}
