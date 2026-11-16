import React, { useEffect, useState } from 'react';
import { Tabs } from 'antd';
import GreatShieldView from './GreatShieldView';
import BlackFlameView from './BlackFlameView';
import InstantDeathView from './InstantDeathView';
import styles from '../styles/weaponMechanicsView.module.css';

const TAB_KEYS = ['mechanics-shield', 'mechanics-blackflame', 'mechanics-instant-death'];

/**
 * 「武器 → 机制」页：大盾与防御强度、黑焰烧血、即死与骤死三个机制共用页签容器，
 * 顶部导航仍然只占一个位置（否则武器组会多出一格、换行）。
 */
const WeaponMechanicsView: React.FC<{ activeSubTab?: string }> = ({ activeSubTab }) => {
  const [tab, setTab] = useState(activeSubTab && TAB_KEYS.includes(activeSubTab) ? activeSubTab : 'mechanics-shield');

  useEffect(() => {
    if (activeSubTab && TAB_KEYS.includes(activeSubTab)) setTab(activeSubTab);
  }, [activeSubTab]);

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <Tabs
          type="card"
          activeKey={tab}
          onChange={setTab}
          destroyOnHidden={false}
          items={[
            {
              key: 'mechanics-shield',
              label: '🛡️ 大盾与防御强度',
              children: <GreatShieldView />,
            },
            {
              key: 'mechanics-blackflame',
              label: '🔥 黑焰烧血',
              children: <BlackFlameView />,
            },
            {
              key: 'mechanics-instant-death',
              label: '💀 即死与骤死',
              children: <InstantDeathView />,
            },
          ]}
        />
      </div>
    </div>
  );
};

export default WeaponMechanicsView;
