import React, { useMemo, useState } from 'react';
import { Input, Segmented, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import deathJson from '../data/zh-CN/instant_death_data.json';
import type { InstantDeathData, InstantDeathEnemyRow, InstantDeathProbabilityRow } from '../types';
import CustomPagination from '../components/CustomPagination';
import styles from '../styles/instantDeath.module.css';

const DATA = deathJson as unknown as InstantDeathData;

const PROBABILITY_KEYS = ['普通即死', '高级即死'] as const;

const probClass = (v: number) => {
  if (v <= 0) return styles.probZero;
  if (v < 10) return styles.probLow;
  if (v < 20) return styles.probMid;
  return styles.probHigh;
};

const probColumns: TableColumnsType<InstantDeathProbabilityRow> = [
  { title: '敌方血量百分比', dataIndex: 'hp', key: 'hp', width: '22%' },
  {
    title: '① 1 档',
    dataIndex: 't1',
    key: 't1',
    align: 'center',
    render: (v: number) => <span className={probClass(v)}>{v}%</span>,
  },
  {
    title: '② 2 档',
    dataIndex: 't2',
    key: 't2',
    align: 'center',
    render: (v: number) => <span className={probClass(v)}>{v}%</span>,
  },
  {
    title: '③ 3 档',
    dataIndex: 't3',
    key: 't3',
    align: 'center',
    render: (v: number) => <span className={probClass(v)}>{v}%</span>,
  },
  {
    title: '④ 4 档',
    dataIndex: 't4',
    key: 't4',
    align: 'center',
    render: (v: number) => <span className={probClass(v)}>{v}%</span>,
  },
];

const tierColor = (tier: string) => {
  if (tier.startsWith('X')) return 'default';
  if (tier.startsWith('1')) return 'green';
  if (tier.startsWith('2')) return 'blue';
  if (tier.startsWith('3')) return 'orange';
  if (tier.startsWith('4')) return 'red';
  return 'purple';
};

const buildEnemyColumns = (spans: Record<number, number>): TableColumnsType<InstantDeathEnemyRow> => [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 110,
    onCell: (_, index) => ({ rowSpan: spans[index ?? 0] ?? 0 }),
    render: (v: string) => <span className={styles.mono}>{v}</span>,
  },
  {
    title: '地点',
    dataIndex: 'place',
    key: 'place',
    width: '18%',
    onCell: (_, index) => ({ rowSpan: spans[index ?? 0] ?? 0 }),
  },
  { title: '敌人', dataIndex: 'enemy', key: 'enemy' },
  {
    title: '档位',
    dataIndex: 'tier',
    key: 'tier',
    width: 110,
    align: 'center',
    render: (v: string) =>
      v.startsWith('X') ? <Tag color="default">不可即死</Tag> : <Tag color={tierColor(v)}>{v}</Tag>,
  },
  { title: '备注', dataIndex: 'note', key: 'note', width: '20%', render: (v?: string) => v ?? '' },
];

const InstantDeathView: React.FC = () => {
  const [probTab, setProbTab] = useState<(typeof PROBABILITY_KEYS)[number]>('普通即死');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const prob = DATA.probability[probTab];

  const filteredRows = useMemo(() => {
    const kw = keyword.trim();
    if (!kw) return DATA.enemyRows;
    return DATA.enemyRows.filter(
      (row) => row.id.includes(kw) || row.place.includes(kw) || row.enemy.includes(kw) || (row.note ?? '').includes(kw),
    );
  }, [keyword]);

  const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);

  // 同一 ID / 地点的连续行合并单元格
  const spans = useMemo(() => {
    const map: Record<number, number> = {};
    let i = 0;
    while (i < pageRows.length) {
      let j = i;
      while (
        j + 1 < pageRows.length &&
        pageRows[j + 1].id === pageRows[i].id &&
        pageRows[j + 1].place === pageRows[i].place
      ) {
        j += 1;
      }
      map[i] = j - i + 1;
      i = j + 1;
    }
    return map;
  }, [pageRows]);

  const enemyColumns = useMemo(() => buildEnemyColumns(spans), [spans]);

  return (
    <div className={styles.wrap} id="instant-death-mechanics">
      <div className={styles.notes}>
        {DATA.notes.map((note) => (
          <p key={note} className={styles.noteItem}>
            {note}
          </p>
        ))}
      </div>

      <h4 className={styles.heading}>即死概率</h4>
      <div className={styles.probHeader}>
        <Segmented
          options={PROBABILITY_KEYS.map((key) => ({ label: key, value: key }))}
          value={probTab}
          onChange={(v) => setProbTab(v as (typeof PROBABILITY_KEYS)[number])}
        />
        <span className={styles.probDesc}>{prob.desc}</span>
      </div>
      <Table
        columns={probColumns}
        dataSource={prob.rows.map((row) => ({ ...row, key: row.hp }))}
        rowKey="key"
        size="small"
        bordered
        pagination={false}
      />
      <p className={styles.note}>
        命中时读取敌方<strong>当前</strong>生命值百分比，按上表分档取值。①~④ 对应敌人 1~4
        档，普通即死与高级即死分开计算。
      </p>

      <h4 className={styles.heading}>敌人档位</h4>
      <div className={styles.toolbar}>
        <span className={styles.count}>共 {filteredRows.length} 条</span>
        <Input
          allowClear
          placeholder="搜索地点 / 敌人 / ID"
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPage(1);
          }}
          style={{ width: 240 }}
        />
      </div>
      <Table
        columns={enemyColumns}
        dataSource={pageRows}
        rowKey={(row) => `${row.id}-${row.enemy}`}
        size="small"
        bordered
        pagination={false}
      />
      {filteredRows.length >= 20 ? (
        <CustomPagination
          currentPage={page}
          pageSize={pageSize}
          totalItems={filteredRows.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      ) : null}
      <p className={styles.note}>
        「不可即死」表示该敌人不带可即死标志；小怪未全部列出，但基本都可即死。同名多敌人表示该据点会从中随机出现。
      </p>

      <div className={styles.source}>
        资料整理：{DATA.meta.author}
        <a href={DATA.meta.url} target="_blank" rel="noreferrer">
          《{DATA.meta.title}》
        </a>
        。
      </div>
    </div>
  );
};

export default InstantDeathView;
