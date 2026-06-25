import { defineConfig } from 'astro/config';

// 站点地址：部署到 Cloudflare Pages / GitHub Pages 后改成正式域名。
// 若用 GitHub Pages 且仓库非 <user>.github.io，需要设置 base 为 "/仓库名"。
export default defineConfig({
  // 部署到 Cloudflare Pages 后改成你的自有域名（用于 SEO / og / sitemap）
  site: 'https://wenyg.github.io/awesome-vibe-coding-project',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
});
