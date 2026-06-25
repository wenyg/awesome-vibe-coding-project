import { defineConfig } from 'astro/config';

// 部署目标：deploy.yml 会把 PUBLIC_DEPLOY_TARGET 设为 'github-pages'。
// GitHub Pages 是项目子路径，需要 base；Cloudflare Pages + 自有域名走根路径。
const isGhPages = process.env.PUBLIC_DEPLOY_TARGET === 'github-pages';

export default defineConfig({
  site: isGhPages
    ? 'https://wenyg.github.io'
    : 'https://wenyg.github.io/awesome-vibe-coding-project',
  base: isGhPages ? '/awesome-vibe-coding-project' : '/',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
});
