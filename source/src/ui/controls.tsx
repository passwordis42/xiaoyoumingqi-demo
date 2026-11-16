import type { SkillLevel } from "../sim/rules";

export function Controls({
  seed,
  setSeed,
  skill,
  tool,
  onApply,
  onTool,
  instruction,
}: {
  seed: string;
  setSeed: (v: string) => void;
  skill: SkillLevel;
  tool: boolean;
  onApply: (skill: SkillLevel, seed: string) => void;
  onTool: (v: boolean) => void;
  instruction: string;
}) {
  return (
    <aside className="rail">
      <details open>
        <summary>这一台怎么玩</summary>
        <p>{instruction}</p>
      </details>
      <label className="field">
        种子
        <input value={seed} onChange={(e) => setSeed(e.target.value)} data-testid="seed" />
      </label>
      <fieldset>
        <legend>技能（重开后生效）</legend>
        <label>
          <input type="radio" name="skill" checked={skill === 0} onChange={() => onApply(0, seed)} data-testid="skill-low" />
          技能 0
        </label>
        <label>
          <input type="radio" name="skill" checked={skill === 1} onChange={() => onApply(1, seed)} data-testid="skill-high" />
          技能 1
        </label>
      </fieldset>
      <label className="check">
        <input type="checkbox" checked={tool} onChange={(e) => onTool(e.target.checked)} data-testid="tool" />
        对照工具：只多看信息，不改结算
      </label>
      <button type="button" onClick={() => onApply(skill, seed)} data-testid="restart">
        按此重开
      </button>
      <p className="hint">同一颗种子、同样的决定，手牌、风向和风险会再来一遍。技能只在重开或进入下一轮时变。</p>
    </aside>
  );
}
