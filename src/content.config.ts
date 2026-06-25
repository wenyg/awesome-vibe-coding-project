import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 项目数据集合：每个项目是 src/content/projects/ 下的一个 JSON 文件。
// 投稿 Action 会自动在该目录生成 JSON；维护者 merge PR 后即上线。
const projects = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/projects' }),
  schema: z.object({
    // 基本信息
    title: z.string(),
    summary: z.string(),
    category: z.enum(['weapp', 'minigame', 'website', 'tool', 'other']),
    tags: z.array(z.string()).default([]),

    // 展示资源（封面必备，其余可选）
    cover: z.string(),
    liveUrl: z.string().url().optional(),
    qrcode: z.string().optional(),
    repoUrl: z.string().url().optional(),
    downloadUrl: z.string().url().optional(),

    // 作者信息
    author: z.string(),
    authorUrl: z.string().url().optional(),

    // 运营/排序字段
    votes: z.number().default(0),
    issueNumber: z.number().optional(),
    featured: z.boolean().default(false),
    date: z.coerce.date(),
  }),
});

export const collections = { projects };
