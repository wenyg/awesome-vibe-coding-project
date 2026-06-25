// 项目分类定义。key 与 content schema 的 category 枚举保持一致。
export type CategoryKey = 'weapp' | 'minigame' | 'website' | 'tool' | 'other';

export interface Category {
  key: CategoryKey;
  label: string;
  emoji: string;
}

export const CATEGORIES: Category[] = [
  { key: 'weapp', label: '小程序', emoji: '📱' },
  { key: 'minigame', label: '小游戏', emoji: '🎮' },
  { key: 'website', label: '网站', emoji: '🌐' },
  { key: 'tool', label: '工具', emoji: '🛠️' },
  { key: 'other', label: '其他', emoji: '✨' },
];

const MAP = new Map(CATEGORIES.map((c) => [c.key, c]));

export function categoryLabel(key: string): string {
  return MAP.get(key as CategoryKey)?.label ?? '其他';
}

export function categoryEmoji(key: string): string {
  return MAP.get(key as CategoryKey)?.emoji ?? '✨';
}
