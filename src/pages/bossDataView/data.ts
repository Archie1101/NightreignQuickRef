// 夜王Boss数据页的静态数据、类型与纯函数。
// 原先全部堆在 BossDataView 组件函数体内（每次渲染都会重新创建），
// 抽到模块级后只创建一次，同时让组件文件专注在有状态的部分。

import { typeColorMap } from '../../types';
import sinnerList from '../../data/zh-CN/sinner_list.json';
import lipulaTradesJson from '../../data/zh-CN/lipula_trades.json';
import styles from '../../styles/bossDataView.module.css';

export interface SinnerData {
  key: string;
  characterName: string;
  buildIndex: number;
  leftHand: string;
  rightHand: string;
  consumable: string;
}

export interface LipulaStats {
  level: number; // 等级
  hp: number; // 血
  fp: number; // 蓝
  stamina: number; // 绿
  str: number; // 力
  dex: number; // 敏
  intl: number; // 智
  fth: number; // 信
  arc: number; // 感
}

export interface LipulaBuff {
  name: string;
  effects: string[];
}

export interface LipulaTrade {
  key: string;
  desire: string;
  effect: string;
  stats?: LipulaStats;
  buff?: LipulaBuff;
}

export const curseData = [
  { rune: '0', damageIncrease: 0 },
  { rune: '1000', damageIncrease: 0.4 },
  { rune: '2000', damageIncrease: 0.8 },
  { rune: '5000', damageIncrease: 2 },
  { rune: '10000', damageIncrease: 4 },
  { rune: '20000', damageIncrease: 8 },
  { rune: '30000', damageIncrease: 12 },
  { rune: '50000', damageIncrease: 20 },
  { rune: '60000', damageIncrease: 22 },
  { rune: '80000', damageIncrease: 26 },
  { rune: '100000', damageIncrease: 30 },
  { rune: '150000', damageIncrease: 33.75 },
  { rune: '200000', damageIncrease: 37.5 },
  { rune: '300000', damageIncrease: 45 },
  { rune: '500000', damageIncrease: 60 },
  { rune: '700000', damageIncrease: 75 },
  { rune: '900000', damageIncrease: 90 },
  { rune: '1000000', damageIncrease: 91.2 },
  { rune: '1100000', damageIncrease: 92.42 },
  { rune: '1500000', damageIncrease: 97.26 },
];

export const locationColorMap: Record<string, string> = {
  要塞: 'cyan',
  监牢: 'volcano',
  大教堂: 'orange',
  // DLC 新增据点
  湖沼: 'cyan',
  锻造村: 'volcano',
  大空洞主城: 'purple',
  神殿塔: 'geekblue',
  大空洞大教堂: 'orange',
  大空洞遗迹: 'magenta',
  大空洞异变: 'red',
  遗迹: 'magenta',
  营地: 'green',
  矿洞: 'magenta',
  主城: 'gold',
  主城地下: 'gold',
  主城楼顶: 'gold',
  野外蓝名: 'blue',
  野外红名: 'red',
  火山口: 'purple',
  山顶: 'purple',
  隐城: 'purple',
  腐败森林: 'purple',
  第一夜: 'geekblue',
  第二夜: 'cyan',
  突发事件: 'yellow',
  // 圆桌厅堂人物位置颜色
  训练场: 'green',
  可选角色: 'blue',
  执行者绝招: 'magenta',
  复仇者家人: 'cyan',
};

export const lipulaTradesData = lipulaTradesJson.trades as LipulaTrade[];
export const lipulaNotes = lipulaTradesJson.notes;

// 位置 → Tag 颜色
export const getLocationColor = (location: string | null | undefined): string => {
  if (!location) return 'default';
  return locationColorMap[location] || 'default';
};

// 词条类型 → Tag 颜色
export const getTypeColor = (type: string | null | undefined): string => {
  if (!type) return 'default';
  return typeColorMap[type] || 'default';
};

// 抗性数值 → 颜色类名
export const getResistanceClass = (value: number | string): string => {
  if (value === '-' || value === null || value === undefined) {
    return '';
  }

  const numValue = typeof value === 'string' ? parseInt(value) : value;

  if (numValue <= 154) {
    return styles.resistanceLow;
  } else if (numValue <= 252) {
    return styles.resistanceMedium;
  } else if (numValue <= 542) {
    return styles.resistanceHigh;
  }
  return '';
};

// 吸收率 → 颜色类名
export const getAbsorptionClass = (value: number | string): string => {
  if (value === null || value === undefined || typeof value !== 'number') {
    return '';
  }

  if (value > 1) {
    return styles.absorption1;
  } else if (value < 1) {
    if (value <= 0.3) {
      return styles.absorption4;
    } else if (value <= 0.7) {
      return styles.absorption3;
    } else {
      return styles.absorption2;
    }
  }
  return '';
};

// 罪人数据 → 表格行
export const processSinnerData = (): SinnerData[] => {
  const sinnerTableData: SinnerData[] = [];

  Object.entries(sinnerList).forEach(([characterName, builds]) => {
    builds.forEach((build: { 左手: string | string[]; 右手: string | string[]; 消耗品: string }, index: number) => {
      sinnerTableData.push({
        key: `${characterName}-${index}`,
        characterName,
        buildIndex: index + 1,
        leftHand: Array.isArray(build.左手) ? build.左手.join(' + ') : build.左手,
        rightHand: Array.isArray(build.右手) ? build.右手.join(' + ') : build.右手,
        consumable: build.消耗品,
      });
    });
  });

  return sinnerTableData;
};
