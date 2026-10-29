// Mage: arcane + elemental caster.
// A class = base stats + a skill loadout + a model id + starter gear.
// Each skill's `impl` names a behavior registered in src/combat/skills/index.ts;
// every other field is tuning data read by that behavior.
import type { ClassDef } from '../../types';

const mage: ClassDef = {
  id: 'mage',
  name: '마법사',
  tagline: '순수한 아르카나와 하늘의 분노를 휘두르는 자.',
  model: 'mage',
  accent: '#9fffd0',
  book: '주문서',
  hall: {
    role: '비전술사 · 원거리 주문',
    traits: [{ label: '강인함', value: 1 }, { label: '피해', value: 5 }, { label: '사거리', value: 4 }, { label: '편의성', value: 3 }],
    // (a beam across the frame: Starfall's crystals fell from above the hall's camera, unseen; "can he do a void
    // lance attack instead")
    showcase: { skill: 'voidLance', at: [2, 4], hold: 2.2 },
    banner: [16, 62, 92],
  },
  // (the staff's light in its crystal's colour, the bolts')
  // (no motes: his free hand's outline glows instead, models/mage.ts)
  aura: { light: 0xff4fd8, intensity: 1.8, hand: { light: 0x5dffa8, intensity: 0.5 } },

  base: {
    life: 800,
    energy: 480,
    lifeRegen: 4,        // per second
    energyRegen: 22,     // per second
    moveSpeed: 6.4,      // units per second
    crit: 5,             // %
    critDmg: 50,         // bonus %
    armor: 0,            // % damage reduction vs physical
    resist: 0,           // % damage reduction vs elemental / arcane
  },

  // Key bindings: 'mouse0', 'mouse2', '1'..'4', 'q'
  skills: [
    {
      key: 'mouse0', impl: 'splinterBolt', name: '분열 탄환',
      desc: '적을 추적하는 비전 탄환을 발사합니다. 적중 시 두 개의 작은 탄환으로 갈라져 다른 적을 추적합니다. 기력을 소모하지 않습니다.',
      tags: ['arcane'], cost: 0, cooldown: 0, castTime: 0.34,
      damage: 36, missiles: 1, spread: 0.22, speed: 24, splitCount: 2, splitDamage: 0.6, range: 22,
      color: 0xff4fd8, trailEnd: 0x6a1cff,   // VFX colors
      icon: { glyph: '✧', color: '#ff6fe0' },
    },
    {
      key: 'mouse2', impl: 'starfall', name: '별똥별',
      desc: '목표 지역에 하늘에서 비전 수정 세 개를 불러내립니다. 떨어진 지점에서 가장 강한 피해를 주고, 살아남은 적을 얼립니다.',
      tags: ['arcane', 'cold'], cost: 38, cooldown: 3, castTime: 0.75,
      damage: 150, shards: 3, radius: 2.5, edge: 0.35, scatter: 1.9, chill: 2.0, aimed: true,
      icon: { glyph: '☄', color: '#8fd8ff' },
    },
    {
      key: '1', impl: 'voidLance', name: '공허의 창',
      desc: '공중에 차원문을 그린 뒤 순수한 아르카나의 창을 통과시켜 직선상의 모든 적을 꿰뚫습니다. 유지하는 동안 이동이 느려지고 기력이 소모됩니다.',
      tags: ['arcane'], cost: 34, cooldown: 0, castTime: 0, channel: true, opening: 0.75,
      damage: 210, length: 17, width: 0.75, moveMult: 0.35,
      icon: { glyph: '⟿', color: '#5dffa8' },
    },
    {
      key: '2', impl: 'glacialNova', name: '빙하 신성',
      desc: '주위에 절대 영도의 파동을 일으켜 근처의 모든 적을 2.4초 동안 꽁꽁 얼립니다. 보스는 더 빨리 풀려납니다.',
      tags: ['cold'], cost: 55, cooldown: 7, castTime: 0.6,
      damage: 150, radius: 7, freeze: 2.4,
      icon: { glyph: '❄', color: '#8fd8ff' },
    },
    {
      key: '3', impl: 'maelstrom', name: '소용돌이',
      desc: '4.5초 동안 조준점을 향해 천천히 굴러가는 화염 폭풍을 소환하여 적들을 끌어당기고 번개로 후려칩니다.',
      tags: ['lightning', 'fire'], cost: 60, cooldown: 5, castTime: 0.75,
      damage: 95, radius: 3.6, duration: 4.5, speed: 3.5, pull: 5,
      icon: { glyph: '༄', color: '#ff8f3a' },
    },
    {
      key: '4', impl: 'blink', name: '장막 걷기',
      desc: '길게 눌러 최대 15미터 떨어진 곳까지 목적지를 고르고, 놓으면 그 사이에 무엇이 있든 비전 빛줄기가 되어 그곳으로 건너갑니다. 이동 중에는 어떤 공격도 맞지 않으며, 사라진 자리 주변의 적들은 1초 동안 멍해집니다.',
      tags: ['movement'], cost: 30, cooldown: 7, castTime: 0, aimed: true,
      // (radius: the foes it dazes round where he vanishes, for duration s)
      range: 15, radius: 5, duration: 1,
      icon: { glyph: '⤳', color: '#c9b8ff' },
    },
    {
      key: 'q', impl: 'potion', name: '치유 물약',
      desc: '생명력을 190, 그리고 최대 생명력의 30%를 회복합니다.',
      tags: ['consumable'], cost: 0, cooldown: 25, castTime: 1.4, fireAt: 0.5, freeMove: true,
      heal: 190, healPct: 0.3,
      icon: { glyph: '⚗', color: '#ff5b5b' },
    },
  ],

  // Common items granted to a brand-new profile (see loot/items.ts makeItem).
  // the block stats only come on warrior shields
  excludeStats: ['block', 'blockAmount'],

  starterGear: [
    { slot: 'weapon', rarity: 'common', ilvl: 1 },
    { slot: 'chest', rarity: 'common', ilvl: 1 },
  ],
};

export default mage;
