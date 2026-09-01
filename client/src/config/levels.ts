export interface LevelConfig {
  level: number
  name: string
  xpRequired: number
  cashbackPercent: number
  commissionPercent: number
}

export const LEVELS: LevelConfig[] = [
  { level: 1, name: 'Новичок', xpRequired: 0, cashbackPercent: 1, commissionPercent: 15 },
  { level: 2, name: 'Игрок', xpRequired: 100, cashbackPercent: 2, commissionPercent: 14 },
  { level: 3, name: 'Опытный', xpRequired: 250, cashbackPercent: 3, commissionPercent: 13 },
  { level: 4, name: 'Профи', xpRequired: 500, cashbackPercent: 4, commissionPercent: 11 },
  { level: 5, name: 'Ветеран', xpRequired: 800, cashbackPercent: 5, commissionPercent: 10 },
  { level: 6, name: 'Эксперт', xpRequired: 1200, cashbackPercent: 6, commissionPercent: 9 },
  { level: 7, name: 'Мастер', xpRequired: 1800, cashbackPercent: 7, commissionPercent: 8 },
  { level: 8, name: 'Элита', xpRequired: 2500, cashbackPercent: 8, commissionPercent: 7 },
  { level: 9, name: 'Легенда', xpRequired: 3500, cashbackPercent: 9, commissionPercent: 6 },
  { level: 10, name: 'VIP', xpRequired: 5000, cashbackPercent: 10, commissionPercent: 5 },
]

export function getLevelConfig(level: number): LevelConfig {
  return LEVELS.find(l => l.level === level) || LEVELS[0]
}

export function getNextLevelConfig(level: number): LevelConfig | null {
  return LEVELS.find(l => l.level === level + 1) || null
}

export function calculateLevel(xp: number): { level: number; currentXp: number; nextXp: number } {
  let level = 1
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) {
      level = LEVELS[i].level
      break
    }
  }
  const current = getLevelConfig(level)
  const next = getNextLevelConfig(level)
  return {
    level,
    currentXp: xp - current.xpRequired,
    nextXp: next ? next.xpRequired - current.xpRequired : 0,
  }
}
