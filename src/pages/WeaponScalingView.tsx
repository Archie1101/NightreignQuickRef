import React, { useMemo, useState } from 'react';
import { Checkbox, Segmented, Select, Statistic, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import scalingJson from '../data/zh-CN/weapon_scaling_data.json';
import uniqueWeaponArts from '../data/zh-CN/unique_weapon_arts.json';
import weaponArtCategoryHints from '../data/zh-CN/weapon_art_category_hints.json';
import type { WeaponScalingData, WeaponScalingRow } from '../types';
import styles from '../styles/weaponScalingView.module.css';

import trackerIcon from '../assets/icons/char/Wylder.svg';
import guardianIcon from '../assets/icons/char/Guardian.svg';
import ironeyeIcon from '../assets/icons/char/Ironeye.svg';
import duchessIcon from '../assets/icons/char/Duchess.svg';
import revenantIcon from '../assets/icons/char/Revenant.svg';
import recluseIcon from '../assets/icons/char/Recluse.svg';
import raiderIcon from '../assets/icons/char/Raider.svg';
import executorIcon from '../assets/icons/char/Executor.svg';
import scholarIcon from '../assets/icons/char/Scholar.svg';
import undertakerIcon from '../assets/icons/char/Undertaker.svg';

const DATA = scalingJson as unknown as WeaponScalingData;

const CHARACTER_ICONS: Record<string, string> = {
  追踪者: trackerIcon,
  守护者: guardianIcon,
  铁之眼: ironeyeIcon,
  女爵: duchessIcon,
  复仇者: revenantIcon,
  隐士: recluseIcon,
  无赖: raiderIcon,
  执行者: executorIcon,
  学者: scholarIcon,
  送葬者: undertakerIcon,
};

const STAT_KEYS = ['力气', '敏捷', '智力', '信仰', '感应'] as const;
const STAT_LABELS = ['力', '敏', '智', '信', '感'] as const;

const CHARACTER_MODULES = import.meta.glob('../data/character-info/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Record<string, Array<Record<string, number | string>>>>;

interface CharacterRow {
  key: string;
  name: string;
  stats: number[];
}

const CHARACTERS: CharacterRow[] = Object.entries(CHARACTER_MODULES)
  .filter(([path]) => !path.includes('character_data'))
  .map(([, data]) => {
    const name = Object.keys(data)[0];
    const levels = data[name];
    const last = levels[levels.length - 1];
    return {
      key: name,
      name,
      stats: STAT_KEYS.map((key) => Number(last[key])),
    };
  });

/** 成长曲线：分段线性插值，结果按百分比处理 */
const curveValue = (curveKey: 'physical' | 'elemental', stat: number) => {
  const curve = DATA.curves[curveKey];
  const { stages, growth } = curve;
  if (stat <= stages[0]) return growth[0];
  for (let i = 1; i < stages.length; i += 1) {
    if (stat <= stages[i]) {
      const ratio = (stat - stages[i - 1]) / (stages[i] - stages[i - 1]);
      return growth[i - 1] + ratio * (growth[i] - growth[i - 1]);
    }
  }
  return growth[growth.length - 1];
};

const adaptation = (weights: number[], curveKey: 'physical' | 'elemental', stats: number[]) =>
  1 +
  weights.reduce((sum, weight, index) => {
    const coefficient = curveValue(curveKey, stats[index]) / 100;
    return sum + (weight / 100) * coefficient;
  }, 0);

/** 把「力敏智12/63/26」「B类补正：力25」「信80」解析成 5 维补正占比 */
const parseScaling = (text: string): number[] => {
  const body = text.replace(/\n/g, '').split('（')[0].trim();
  const payload = body.includes('：') ? body.slice(body.lastIndexOf('：') + 1) : body;
  const statChars = payload.match(/^[力敏智信感]+/)?.[0] ?? '';
  const numeric = payload.slice(statChars.length).match(/\d+(?:\s*\/\s*\d+)*/)?.[0] ?? '';
  const values = numeric.replace(/\s/g, '').split('/').filter(Boolean).map(Number);
  const weights = [0, 0, 0, 0, 0];
  [...statChars].forEach((char, index) => {
    const statIndex = '力敏智信感'.indexOf(char);
    if (statIndex >= 0) weights[statIndex] += values[index] ?? 0;
  });
  return weights;
};

interface ArtOption {
  value: string;
  label: string;
  desc?: string;
  weights: number[];
  installed: boolean;
}

const UNIVERSAL_OPTIONS: ArtOption[] = Object.entries(weaponArtCategoryHints as Record<string, string>).map(
  ([name, hint]) => ({
    value: `universal:${name}`,
    label: name,
    desc: hint,
    weights: parseScaling(hint),
    installed: true,
  }),
);

const UNIQUE_OPTIONS: ArtOption[] = (() => {
  const map = new Map<string, ArtOption>();
  for (const row of uniqueWeaponArts as Array<Record<string, string>>) {
    if (!row['战技']) continue;
    const key = `${row['战技']}|${row['武器']}`;
    if (map.has(key)) continue;
    const correction = (row['补正'] ?? '').replace(/\s+/g, ' ').trim();
    map.set(key, {
      value: `unique:${key}`,
      label: `${row['战技']}（${row['武器']}）`,
      desc: `${row['分类']} · 补正 ${correction || '未标注'}`,
      weights: parseScaling(correction),
      installed: Boolean(correction),
    });
  }
  return [...map.values()];
})();

const weaponColumns: TableColumnsType<WeaponScalingRow> = [
  { title: '武器', dataIndex: 'name', key: 'name', width: '17%' },
  { title: '基础削韧', dataIndex: 'poise', key: 'poise', width: 90, align: 'center' },
  {
    title: (
      <div>
        <div>力/敏</div>
        <div className={styles.colSub}>无质变 / 火焰 / 雷电质变</div>
      </div>
    ),
    dataIndex: 'physical',
    key: 'physical',
    align: 'center',
  },
  {
    title: (
      <div>
        <div>力/敏/智or信</div>
        <div className={styles.colSub}>力/敏/智：魔力 / 寒冷质变</div>
        <div className={styles.colSub}>力/敏/信：神圣质变</div>
      </div>
    ),
    dataIndex: 'elemental',
    key: 'elemental',
    align: 'center',
  },
  {
    title: (
      <div>
        <div>力/敏/感</div>
        <div className={styles.colSub}>血 / 毒质变</div>
      </div>
    ),
    dataIndex: 'status',
    key: 'status',
    align: 'center',
  },
  { title: '备注', dataIndex: 'note', key: 'note', width: '22%', render: (v?: string) => v ?? '' },
];

const WeaponScalingView: React.FC = () => {
  const [curveKey, setCurveKey] = useState<'physical' | 'elemental'>('physical');
  const [selectedKey, setSelectedKey] = useState('universal:厚重');
  const [showUnreleased, setShowUnreleased] = useState(false);

  const availableUnique = useMemo(
    () => UNIQUE_OPTIONS.filter((option) => showUnreleased || option.installed),
    [showUnreleased],
  );

  const availableOptions = useMemo(() => [...UNIVERSAL_OPTIONS, ...availableUnique], [availableUnique]);

  const selected = useMemo(
    () => availableOptions.find((option) => option.value === selectedKey) ?? availableOptions[0],
    [availableOptions, selectedKey],
  );

  const artGroups = useMemo(
    () => [
      { label: '通用战技（质变）', options: UNIVERSAL_OPTIONS },
      { label: `专用战技（${availableUnique.length}）`, options: availableUnique },
    ],
    [availableUnique],
  );

  const rankings = useMemo(
    () =>
      CHARACTERS.map((character) => ({
        ...character,
        value: adaptation(selected.weights, curveKey, character.stats),
      })).sort((a, b) => b.value - a.value),
    [selected, curveKey],
  );

  const best = rankings[0];

  const rankingColumns: TableColumnsType<(typeof rankings)[number]> = [
    {
      title: '角色',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, _, index) => (
        <span className={styles.nameCell}>
          <img src={CHARACTER_ICONS[name]} alt="" className={styles.charIcon} />
          <span>{name}</span>
          {index === 0 ? <Tag color="gold">最适配</Tag> : null}
        </span>
      ),
    },
    ...STAT_LABELS.map((label, index) => ({
      title: label,
      key: `stat-${label}`,
      width: 58,
      align: 'center' as const,
      render: (_: unknown, record: (typeof rankings)[number]) => record.stats[index],
    })),
    {
      title: '适配度',
      dataIndex: 'value',
      key: 'value',
      width: 120,
      align: 'right' as const,
      sorter: (a: (typeof rankings)[number], b: (typeof rankings)[number]) => a.value - b.value,
      render: (value: number) => <span className={styles.value}>×{value.toFixed(3)}</span>,
    },
  ];

  return (
    <div className={styles.wrap} id="weapon-scaling">
      <div className={styles.formulaCard}>
        <p className={styles.formulaTitle}>适配度 = 1 + Σ（该属性补正占比 × 成长曲线系数）</p>
        <p className={styles.formulaText}>
          成长曲线系数 = 角色属性在成长曲线上的取值 ÷ 100；角色属性取站内 15 级数据，因此无需写死旧表数值。 1.00
          为基准，越高表示该角色越吃这把武器的补正。
        </p>
        <p className={styles.formulaText}>
          物理类用 0 号曲线（物里面板），元素类用 4 号曲线（魔火雷圣面板）；可在下方切换曲线后查看对应结果。
        </p>
      </div>

      <h4 className={styles.heading}>战技适配度</h4>
      <p className={styles.hint}>
        选项分两组：通用战技（{UNIVERSAL_OPTIONS.length}）、专用战技（已实装{' '}
        {UNIQUE_OPTIONS.filter((option) => option.installed).length} / 全部 {UNIQUE_OPTIONS.length}，当前可选{' '}
        {availableUnique.length}）；支持搜索，未标注补正的专用战技需勾选「显示未实装」。
      </p>
      <div className={styles.toolbar}>
        <Segmented
          value={curveKey}
          onChange={(value) => setCurveKey(value as 'physical' | 'elemental')}
          options={[
            { label: '0 号曲线 · 物理', value: 'physical' },
            { label: '4 号曲线 · 元素', value: 'elemental' },
          ]}
        />
        <Select
          value={selected.value}
          onChange={setSelectedKey}
          options={artGroups}
          showSearch={{ optionFilterProp: 'label' }}
          optionRender={(option) => {
            const data = option.data as unknown as ArtOption;
            return (
              <div className={styles.optionRow}>
                <span>{option.label}</span>
                {data.desc ? <span className={styles.optionDesc}>{data.desc}</span> : null}
              </div>
            );
          }}
          style={{ minWidth: 340 }}
          popupMatchSelectWidth={420}
        />
        <Checkbox checked={showUnreleased} onChange={(e) => setShowUnreleased(e.target.checked)}>
          显示未实装
        </Checkbox>
      </div>

      <div className={styles.summary}>
        <Statistic title={selected.label} value={best.value} precision={3} prefix="×" />
        <span className={styles.summaryText}>
          最适配：{best.name}（{STAT_LABELS.map((label, i) => `${label}${best.stats[i]}`).join(' / ')}）
        </span>
        {selected.desc ? <span className={styles.summaryText}>{selected.desc}</span> : null}
      </div>

      <Table columns={rankingColumns} dataSource={rankings} rowKey="key" size="small" bordered pagination={false} />

      <p className={styles.note}>
        专用战技的补正取自 「战技与魔法祷告」，同一战技多段动作只取第一条补正； 勾选「显示未实装」时会列出未标注补正（按
        1.000 计算）的专用战技。
      </p>

      <h4 className={styles.heading}>武器补正与基础削韧</h4>
      <p className={styles.hint}>
        补正分布按「力/敏（无质变、火焰、雷电）」「力/敏/智（魔力、寒冷）或
        力/敏/信（神圣）」「力/敏/感（血、毒）」排列； 特殊武器单独列出。
      </p>
      <Table
        columns={weaponColumns}
        dataSource={DATA.weapons.map((row) => ({ ...row, key: row.name }))}
        rowKey="key"
        size="small"
        bordered
        pagination={false}
        scroll={{ x: 900 }}
      />

      <div className={styles.source}>
        资料整理：{DATA.meta.author}《{DATA.meta.title}》；{DATA.meta.note}
      </div>
    </div>
  );
};

export default WeaponScalingView;
