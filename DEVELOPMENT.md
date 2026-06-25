# 开发 & 自建文档

AI 造物馆是一个**纯静态站**，零服务器成本，用 GitHub 当「后端」：Issue 投稿、Issue 表情投票、Actions 全自动化。

## 技术栈

- [Astro](https://astro.build/) 静态站点生成
- 项目数据：`src/content/projects/` 下的 JSON 文件（Content Collections 校验 schema）
- 投稿处理：GitHub Actions + GitHub Models（AI 审核 / 润色 / 打标签）
- 部署：Cloudflare Pages（主）/ GitHub Pages（备）

## 本地开发

```bash
npm install
npm run dev      # 本地预览 http://localhost:4321
npm run build    # 生成静态文件到 dist/
npm run preview  # 预览构建产物
```

## 目录结构

```
src/
  content/projects/   # 每个项目一个 JSON（投稿 Action 自动生成）
  content.config.ts   # 项目数据 schema
  data/site.ts        # 站点名/域名/GitHub 仓库/分析 token 等配置
  data/categories.ts  # 分类定义
  components/          # Header / Footer / ProjectCard
  layouts/Base.astro   # 页面骨架 + SEO + 分析
  pages/               # 首页 / 详情页 / 排行榜
public/covers/        # 占位封面（真实封面来自投稿图片链接）
scripts/              # parse-issue（解析投稿）/ update-votes（抓表情）
.github/
  ISSUE_TEMPLATE/submit.yml   # 投稿表单
  workflows/                  # 部署 / 解析投稿 / 更新热度
```

## 投稿处理流水线

```
作者填 Issue 表单(可拖拽上传封面/二维码)
        │
        ▼  带 submission 标签触发
parse-submission Action：解析 Issue → GitHub Models 审核/润色/打标签 → 生成 JSON → 自动开 PR
        │
        ▼  管理员审核 merge
deploy Action 自动重建并部署站点
        │
        ▼  访客在 Issue 上点 👍 投票
update-votes 定时 Action 抓取表情数 → 更新 votes → 驱动排行榜
```

- 图片无需图床：作者在 Issue 里拖拽上传，GitHub 自动托管，解析脚本提取链接。
- AI 处理用的是 GitHub Models（`GITHUB_TOKEN` 即可调用），无需额外 API key。
- 老手快捷通道：也可直接提 PR 在 `src/content/projects/` 加 JSON 文件。

## 自建配置

编辑 [`src/data/site.ts`](src/data/site.ts)：

- `github.owner` / `github.repo`：改成你的真实仓库（决定投稿入口与投票链接）
- `url`：正式域名
- `cfAnalyticsToken`：Cloudflare Web Analytics 的 token（填入后自动启用埋点）

编辑 [`astro.config.mjs`](astro.config.mjs) 的 `site`。
若用 GitHub Pages 且仓库非 `<user>.github.io`，需额外设置 `base: '/仓库名'`。

同时把 `.github/ISSUE_TEMPLATE/config.yml` 里的仓库地址改成你的。

## 部署

### 方案 A：Cloudflare Pages（推荐，国内访问相对更稳）

1. Cloudflare Dashboard → Pages → 连接 GitHub 仓库
2. 构建命令 `npm run build`，输出目录 `dist`
3. 绑定你的自有域名（Custom domains）
4. 开启 Web Analytics，拿到 token 填进 `site.ts`

### 方案 B：GitHub Pages（已内置 workflow）

仓库 Settings → Pages → Source 选 “GitHub Actions”。
推送到 `main` 即触发 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 自动部署。

> 说明：两种免费托管都未做 ICP 备案，国内访问速度不稳定。预留了切换国内静态托管/CDN 的空间，前期先用免费方案跑通。
