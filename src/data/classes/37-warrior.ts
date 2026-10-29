// Warrior: armoured blade and shield, fighting up close.
// Same shape as mage.ts: base stats, a skill loadout, a model id and starter gear.
import type { ClassDef } from '../../types';

const warrior: ClassDef = {
  id: 'warrior',
  name: '전사',
  tagline: '강철과 판금 갑옷, 그리고 타인이 쓰러진 자리에 서겠다는 의지.',
  model: 'warrior',
  accent: '#ffc27a',
  book: '무기고',
  hall: {
    role: '선봉 · 근접 전투',
    traits: [{ label: '강인함', value: 5 }, { label: '피해', value: 4 }, { label: '사거리', value: 1 }, { label: '편의성', value: 5 }],
    showcase: { skill: 'powerStrike', at: [2.6, 0] },
    banner: [112, 22, 18],
  },
  aura: { light: 0xff9a4a, intensity: 0.8 },

  base: {
    life: 1300,
    energy: 320,
    lifeRegen: 6,
    energyRegen: 16,
    moveSpeed: 6.2,
    crit: 5,
    critDmg: 60,
    armor: 12,
    resist: 6,
  },

  // Right click raises the shield; with a two-hander instead it spins (Steel Tempest), with a weapon in
  // each hand it strikes with both (Twin Fangs), and with a lone one-hander it is empty until the player
  // binds something. The crescent takes a two-handed weapon. A key's default is the last skill listing it.
  skills: [
    {
      key: 'mouse0', impl: 'cleave', name: '난도질',
      desc: '눈앞의 모든 적을 베는 넓은 휘두르기. 적중할 때마다 기력을 회복합니다. 양손 무기는 더 느리지만 더 강하게 휘두르고, 쌍수 무기는 더 빠르고 가볍게 벱니다.',
      tags: ['physical'], cost: 0, cooldown: 0, castTime: 0.42,
      damage: 62, range: 3.3, arc: 2.2, knock: 2.2, gain: 4,
      // (each about as much damage and energy a second: a great weapon's weight in each blow, two blades' pace)
      styles: { twoHanded: { castTime: 0.6, damage: 92, gain: 6 }, dual: { castTime: 0.3, damage: 45, gain: 3 } },
      color: 0xffd9a0,
      icon: { glyph: '⚔', color: '#ffd9a0' },
    },
    {
      key: 'mouse2', impl: 'crescent', name: '천둥 초승달',
      desc: '무기를 지면에 내리꽂아 그 자리를 따라 번개의 초승달을 쏟아내어 경로상의 모든 적을 찢어버립니다.',
      tags: ['lightning'], cost: 24, cooldown: 4, castTime: 0.6, fireAt: 0.55,
      damage: 280, speed: 17, range: 15, width: 2.1,
      needs: 'twoHanded',   // a swing of a great weapon
      color: 0x5a8cff,   // a deep blue: pale colours bloom to white
      icon: { glyph: '☾', color: '#9fc8ff' },
    },
    {
      key: 'mouse2', impl: 'twinFangs', name: '쌍송곳니',
      desc: '조준 지점을 향해 돌진하며 양쪽 검으로 오른쪽, 왼쪽 순서로 재빨리 찌릅니다. 즉시 발동합니다.',
      tags: ['physical'], cost: 24, cooldown: 3, castTime: 0,
      damage: 150, range: 3.2, arc: 1.3,
      needs: 'dual',
      color: 0xbfe0ff,
      icon: { glyph: '✕', color: '#bfe0ff' },
    },
    {
      key: 'mouse2', impl: 'raiseShield', name: '방패 들기',
      desc: '방패를 들어 올립니다: 정면의 모든 공격을 막아내며, 막기 수치의 세 배까지 버팁니다. 그보다 큰 타격은 방어를 무너뜨리고 잠시 비틀거리게 하며, 그동안에는 움직이기만 할 수 있습니다. 유지하는 동안 기력을 소모합니다.',
      tags: ['defense'], cost: 6, cooldown: 0, castTime: 0, channel: true,
      block: 3, moveMult: 0.45,
      needs: 'shield', fallback: { twoHanded: 'tempest', dual: 'twinFangs' },
      icon: { glyph: '⛉', color: '#e8d2a0' },
    },
    {
      key: '1', impl: 'tempest', name: '강철 폭풍',
      desc: '무기를 뻗은 채 회전하며 주변의 모든 것을 갈아냅니다. 유지하는 동안 기력을 소모합니다. 양손 무기는 더 느리게 회전하지만 더 강하게 때립니다.',
      tags: ['physical'], cost: 30, cooldown: 0, castTime: 0, channel: true,
      damage: 150, radius: 2.9, moveMult: 0.8, spin: 15,
      // (as Rending Cleave's swings: a great weapon's weight slows it as much, the same damage a second)
      styles: { twoHanded: { spin: 10.5 } },
      icon: { glyph: '✺', color: '#e8eef8' },
    },
    {
      key: '2', impl: 'bullRush', name: '들이받기',
      desc: '앞으로 돌진하며 길을 막는 모든 것을 휩쓸어 멈추면서 전방으로 내던집니다. 정예와 보스는 대신 밀려납니다. 돌진 중에도 다른 스킬을 사용할 수 있고, 다른 스킬을 준비하거나 유지하는 중에도 돌진할 수 있습니다.',
      tags: ['physical'], cost: 28, cooldown: 5, castTime: 0, overCast: true,
      damage: 120, range: 9, speed: 26,
      icon: { glyph: '➹', color: '#ffb46a' },
    },
    {
      key: '3', impl: 'powerStrike', name: '강타',
      desc: '잠시 힘을 모은 뒤, 무기를 머리 위에서 내리치는 분쇄의 일격을 가합니다.',
      tags: ['physical'], cost: 35, cooldown: 5, castTime: 1.5, fireAt: 0.9,
      damage: 520, range: 3.9, arc: 1.2, knock: 9,
      color: 0xffc070,
      icon: { glyph: '⚒', color: '#ffc070' },
    },
    {
      key: '4', impl: 'ironBellow', name: '강철 포효',
      desc: '근처의 적들을 날려 버리고 6초 동안 주위에 환영 방패를 세우는 전투 함성. 방패는 받는 피해를 최대 생명력의 30%까지 흡수합니다.',
      tags: ['defense'], cost: 30, cooldown: 14, castTime: 0.65,
      damage: 40, radius: 6, knock: 8, absorbPct: 0.3, duration: 6,
      icon: { glyph: '⛨', color: '#ffd36a' },
    },
    {
      key: 'q', impl: 'potion', name: '치유 물약',
      desc: '생명력을 190, 그리고 최대 생명력의 30%를 회복합니다.',
      tags: ['consumable'], cost: 0, cooldown: 25, castTime: 1.4, fireAt: 0.5, freeMove: true,
      heal: 190, healPct: 0.3,
      icon: { glyph: '⚗', color: '#ff5b5b' },
    },
  ],

  starterGear: [
    { slot: 'weapon', rarity: 'common', ilvl: 1 },
    { slot: 'offhand', rarity: 'common', ilvl: 1 },
  ],

  // Health, cast speed, cooldowns and so on still roll; arcane damage has no warrior skill to feed
  bases: {
    weapon: ['Sword', 'Axe', 'Mace', 'Greatsword', 'Greataxe', 'Maul'],
    offhand: ['Shield', 'Buckler'],
    head: ['Helm', 'Greathelm'],
    chest: ['Cuirass', 'Hauberk'],
    hands: ['Gauntlets', 'Grips', 'Handguards'],
  },
  excludeStats: ['arcanePct'],
  twoHanded: ['Greatsword', 'Greataxe', 'Maul'],
  dualWield: true,   // a one-hander in each hand
  // shields block (see Player.tryBlock) instead of feeding energy
  implicits: { offhand: [['block', 1], ['blockAmount', 1], ['armor', 0.5]] },
  // (the most Health from gear, as he has the most of his own)
  gearLife: 1.6,
};

export default warrior;
