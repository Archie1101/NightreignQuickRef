import { Button } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import skillsJson from '../../data/zh-CN/night_lord_lipula_skills.json';
import type { LipulaSkillsData } from '../../types';
import styles from '../../styles/bossDataView.module.css';

const DATA = skillsJson as unknown as LipulaSkillsData;

const LipulaSkills: React.FC<{ onOpenSinners?: () => void }> = ({ onOpenSinners }) => (
  <div id="lipula-skills">
    <p className={styles.skillHint}>永夜形态追加的诅咒技能；数值来自 Smithbox 解包，技能提示保留原文。</p>

    <div className={styles.skillList}>
      {DATA.skills.map((skill, index) => (
        <section className={styles.skillCard} key={skill.key}>
          <div className={styles.skillIndex}>{index + 1}</div>
          <div className={styles.skillBody}>
            <h4 className={styles.skillTitle}>{skill.title}</h4>
            <p className={styles.skillDesc}>{skill.desc}</p>
            {skill.values ? (
              <div className={styles.skillValues}>
                {skill.values.map((value) => (
                  <span className={styles.skillValue} key={value}>
                    {value}
                  </span>
                ))}
              </div>
            ) : null}
            {skill.link === 'sinner-data' && onOpenSinners ? (
              <Button
                type="link"
                size="small"
                className={styles.skillLink}
                icon={<ArrowRightOutlined />}
                onClick={onOpenSinners}
              >
                查看罪人详情
              </Button>
            ) : null}
          </div>
        </section>
      ))}
    </div>

    <h4 className={styles.heading}>补充说明</h4>
    <div className={styles.skillNotes}>
      {DATA.notes.map((note) => (
        <div className={styles.skillNote} key={note.title}>
          <div className={styles.skillNoteTitle}>{note.title}</div>
          <div>{note.desc}</div>
        </div>
      ))}
    </div>
  </div>
);

export default LipulaSkills;
