// Attributes tab: one table drives both the rows and the hover breakdown that
// lists the class base value and every equipped item contributing to a stat.
import { G } from '../state';
import { SLOTS, STATS } from '../data/items';
import { rarityOf } from '../loot/items';
import { itemIconSVG } from './itemIcons';
import { bindTooltip, type TooltipContent } from './tooltip';
import type { Player } from '../entities/player';
import type { BaseStats, DerivedStats, Profile, StatKey } from '../types';

interface AttributeDef {
  label: string;
  /** derived value shown in the row */
  value: keyof DerivedStats;
  /** item stat that feeds it (if any) */
  stat?: StatKey;
  /** class base stat that feeds it (if any) */
  base?: keyof BaseStats;
  /** item contributions are a % bonus on the base (movement speed) */
  percentOfBase?: boolean;
  cap?: number;
  fmt: (v: number) => string;
  note?: string;
}

const pct = (v: number) => `${Math.round(v)}%`;
const plusPct = (v: number) => `+${Math.round(v)}%`;
const perSec = (v: number) => `초당 ${v.toFixed(1)}`;

export const ATTRIBUTE_GROUPS: [string, AttributeDef[]][] = [
  ['생존', [
    { label: '생명력', value: 'maxLife', stat: 'life', base: 'life', fmt: (v) => String(Math.round(v)) },
    { label: '생명력 재생', value: 'lifeRegen', stat: 'lifeRegen', base: 'lifeRegen', percentOfBase: true, fmt: perSec,
      note: '아이템은 기본 재생량의 일정 비율만큼 더해 줍니다.' },
    { label: '기력', value: 'maxEnergy', stat: 'energy', base: 'energy', fmt: (v) => String(Math.round(v)) },
    { label: '기력 재생', value: 'energyRegen', stat: 'energyRegen', base: 'energyRegen', fmt: perSec },
    { label: '이동 속도', value: 'moveSpeed', stat: 'moveSpeed', base: 'moveSpeed', percentOfBase: true, cap: 40, fmt: (v) => v.toFixed(1),
      note: '아이템은 기본 속도의 일정 비율만큼 더해 줍니다(보너스 상한 40%).' },
  ]],
  ['공격', [
    { label: '모든 피해', value: 'damagePct', stat: 'damagePct', fmt: plusPct, note: '모든 스킬에 적용됩니다.' },
    { label: '비전 피해', value: 'arcanePct', stat: 'arcanePct', fmt: plusPct, note: '비전 스킬에 적용됩니다.' },
    { label: '원소 피해', value: 'elementalPct', stat: 'elementalPct', fmt: plusPct, note: '냉기, 화염, 번개 스킬에 적용됩니다.' },
    { label: '치명타 확률', value: 'crit', stat: 'crit', base: 'crit', cap: 75, fmt: (v) => `${v.toFixed(1)}%` },
    { label: '치명타 피해', value: 'critDmg', stat: 'critDmg', base: 'critDmg', fmt: plusPct },
    { label: '시전 속도', value: 'castSpeed', stat: 'castSpeed', cap: 60, fmt: plusPct },
    { label: '재사용 대기 감소', value: 'cdr', stat: 'cdr', cap: 40, fmt: pct },
    { label: '생명력 흡수', value: 'leech', stat: 'leech', cap: 15, fmt: (v) => `${v.toFixed(1)}%`, note: '준 피해의 일부를 생명력으로 돌려받습니다.' },
  ]],
  ['방어', [
    { label: '물리 피해 감소', value: 'armor', stat: 'armor', base: 'armor', cap: 70, fmt: pct },
    { label: '마법 저항', value: 'resist', stat: 'resist', base: 'resist', cap: 75, fmt: pct },
    { label: '막기 확률', value: 'block', stat: 'block', cap: 60, fmt: pct, note: '방패 전용. 막은 뒤에는 방패가 회복될 때까지 잠시 기다려야 합니다.' },
    { label: '막기 수치', value: 'blockAmount', stat: 'blockAmount', fmt: (v) => String(Math.round(v)), note: '막기가 흡수하는 피해량입니다. 들어 올린 방패는 정면의 모든 공격을 더 많이 막아냅니다.' },
  ]],
];

function breakdown(def: AttributeDef, p: Player, profile: Profile): TooltipContent {
  const derived = p.stats[def.value];
  let html = `<div class="tt-card attr-card"><div class="tt-name">${def.label}</div>`;
  html += `<div class="attr-total">${def.fmt(derived)}</div>`;
  const rows: string[] = [];
  if (def.base) {
    rows.push(`<div class="attr-row"><span class="attr-src base">${p.cls.name} 기본</span><b>${formatBase(def, p.cls.base[def.base])}</b></div>`);
  }
  let itemTotal = 0;
  if (def.stat) {
    for (const slot of SLOTS) {
      const it = profile.equipped[slot];
      const v = it?.stats[def.stat!];
      if (!it || !v) continue;
      itemTotal += v;
      rows.push(`<div class="attr-row"><span class="attr-src">${itemIconSVG(it)}<span style="color:${rarityOf(it.rarity).color}">${it.name}</span></span><b class="up">+${v}${STATS[def.stat!].fmt.includes('%') ? '%' : ''}</b></div>`);
    }
  }
  if (!def.base && itemTotal === 0) rows.push('<div class="attr-empty">장착한 아이템 중 이 능력치를 주는 것이 없습니다.</div>');
  else if (def.stat && itemTotal === 0) rows.push('<div class="attr-empty">장착한 아이템 중 이 능력치를 올려 주는 것이 없습니다.</div>');
  html += `<div class="attr-rows">${rows.join('')}</div>`;
  if (def.cap !== undefined) {
    const raw = def.percentOfBase ? itemTotal : (def.base ? p.cls.base[def.base] : 0) + itemTotal;
    const capped = raw > def.cap;
    html += `<div class="tt-foot${capped ? ' capped' : ''}">Maximum ${def.cap}%${capped ? ` — capped (you have ${Math.round(raw)}%)` : ''}</div>`;
  }
  if (def.note) html += `<div class="tt-foot">${def.note}</div>`;
  return { html: html + '</div>', color: '#a07c46' };
}

/** Format the class base value like the row does. */
function formatBase(def: AttributeDef, v: number): string {
  return def.percentOfBase ? v.toFixed(1) : def.fmt(v);
}

/** Render the attributes list into `el` and bind the breakdown tooltips: the lobby's hero's, or `player`'s in the gear
 *  `profile` wears (the hall of heroes'). */
export function renderAttributes(el: HTMLElement, player = G.player, profile = G.profile): void {
  const s = player.stats, unused = player.cls.excludeStats ?? [];
  // stats the class can never roll are left out
  el.innerHTML = ATTRIBUTE_GROUPS.map(([title, defs], gi) =>
    `<div class="grp">${title}</div>` + defs.map((d, di) => (d.stat && unused.includes(d.stat) ? '' :
      `<div class="row" data-attr="${gi}:${di}"><span>${d.label}</span><b>${d.fmt(s[d.value])}</b></div>`)).join('')).join('');
  el.querySelectorAll<HTMLElement>('[data-attr]').forEach((row) => {
    const [gi, di] = row.dataset.attr!.split(':').map(Number);
    bindTooltip(row, () => breakdown(ATTRIBUTE_GROUPS[gi][1][di], player, profile));
  });
}
