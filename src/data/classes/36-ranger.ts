// Ranger: physical bow shots, a hunter's tricks (a mark on his quarry, a scarecrow to draw foes off), a separate gear pool.
import type { ClassDef } from '../../types';

const ranger: ClassDef = {
  id: 'ranger', name: '레인저', model: 'ranger',
  tagline: '사냥감에 표적을 새기고 무리에게 화살 비를 쏟아붓는 인내심 깊은 사냥꾼.',
  accent: '#c9d993', book: '야영술',
  hall: {
    role: '명사수 · 원거리 활',
    traits: [{ label: '강인함', value: 3 }, { label: '피해', value: 4 }, { label: '사거리', value: 5 }, { label: '편의성', value: 2 }],
    // (loosed off to his right, past the camera's side, not at it)
    showcase: { skill: 'fanShot', at: [8, 6] },
    banner: [44, 64, 22],
  },
  // (lit at full draw alone: lit always, his bow shone at rest, "why ranger emits light from bow on idle")
  aura: { light: 0xc9d993, intensity: 0.45, drawn: true },
  // (an arrow nocked between shots, back in the quiver after 3 s without one; the next shot takes one out first)
  quiver: { fetch: 0.8, idle: 3 },
  base: { life: 1050, energy: 360, lifeRegen: 5, energyRegen: 20, moveSpeed: 7, crit: 8, critDmg: 60, armor: 6, resist: 0 },
  skills: [
    {
      key: 'mouse0', impl: 'nockShot', name: '화살 당기기',
      desc: '길게 눌러 화살을 당기고 놓아서 쏩니다: 더 많이 당길수록 더 빠르고 강하게 날아갑니다. 기력을 소모하지 않습니다.', tags: ['physical'],
      // (drawn to full in `draw` s, loosed no sooner than `minDraw` of that; then the follow-through and the next arrow, `castTime`:
      // an archer's pace, about a second each; drawn in 0.7 s and reloaded in 0.45, it was a blur)
      cost: 0, cooldown: 0, castTime: 0.9, draw: 1.1, minDraw: 0.5,
      damage: 340, missiles: 1, spread: 0, speed: 60, range: 26, knock: 0.8,
      icon: { glyph: '➶', color: '#dfce99' },
    },
    {
      key: 'mouse2', impl: 'fanShot', name: '가시 화살',
      desc: '길게 눌러 다섯 화살을 한꺼번에 당기고 놓아서 넓은 부채꼴로 쏩니다. 각 화살은 적 하나를 맞힐 수 있습니다.', tags: ['physical'],
      cost: 32, cooldown: 3, castTime: 0.95, draw: 1.3, minDraw: 0.5,
      damage: 150, missiles: 5, spread: 0.1, speed: 55, range: 24, knock: 1.2,
      icon: { glyph: '⋔', color: '#c9d993' },
    },
    {
      key: '1', impl: 'piercingShot', name: '창나무 관통 사격',
      desc: '길게 눌러 무거운 창나무 화살을 당기고 놓아서 직선상의 모든 적을 관통합니다. 관통할 때마다 피해가 줄어듭니다(100%, 80%, 60%, 이후 40%). 최대로 당기면 1.5배의 피해를 줍니다.', tags: ['physical'],
      cost: 30, cooldown: 4, castTime: 0.95, draw: 1.5, minDraw: 0.4,
      damage: 410, missiles: 1, spread: 0, speed: 80, range: 30, knock: 1.2, falloff: [1, 0.8, 0.6, 0.4], fullBonus: 0.5,
      icon: { glyph: '➳', color: '#ff6a55' },
    },
    {
      key: '2', impl: 'arrowRain', name: '화살 폭풍',
      desc: '길게 눌러 목표 지역 상공으로 화살을 계속 쏘아 올립니다. 각 화살은 24개의 화살비로 갈라져 지역 내에 무작위로 떨어지며, 떨어진 자리의 적을 맞힙니다. 지역은 조준점을 따라 천천히 움직입니다. 쏘는 동안에는 움직일 수 없습니다.', tags: ['physical'],
      // (energy a second, and damage an arrow; the volleys are an archer's, drawn, loosed and the next taken from the quiver)
      cost: 22, cooldown: 0, castTime: 0, channel: true, moveMult: 0,
      damage: 170, missiles: 24, radius: 4.2, range: 18,
      icon: { glyph: '⇊', color: '#6f9bff' },
    },
    {
      key: '3', impl: 'quarryMark', name: '사냥감 표적',
      desc: '조준점에서 가장 가까운 적을 12초 동안 사냥감으로 표적합니다: 표적은 모든 대상에게 25% 더 많은 피해를 받습니다. 표적이 새겨진 채로 쓰러지면 물약을 제외한 모든 재사용 대기가 초기화됩니다.', tags: ['physical'],
      cost: 15, cooldown: 8, castTime: 0.35, amp: 0.25, duration: 12, range: 26, aimed: true,
      icon: { glyph: '⌖', color: '#ff9a6c' },
    },
    {
      key: '4', impl: 'strawman', name: '허수아비',
      desc: '목표 지점에 허수아비를 세웁니다. 3초 동안 정예와 보스를 제외한 근처의 모든 적이 당신을 떠나 허수아비 주위에 모여 공격합니다. 허수아비는 피해를 받지도 입히지도 않습니다.', tags: ['physical'],
      cost: 35, cooldown: 12, castTime: 0.45, duration: 3, radius: 9, range: 14, aimed: true,
      icon: { glyph: 'ᛉ', color: '#d9b878' },
    },
    {
      key: 'q', impl: 'potion', name: '치유 물약',
      desc: '생명력을 190, 그리고 최대 생명력의 30%를 회복합니다.', tags: ['consumable'],
      cost: 0, cooldown: 25, castTime: 1.4, fireAt: 0.5, freeMove: true, heal: 190, healPct: 0.3,
      icon: { glyph: '⚗', color: '#ff5b5b' },
    },
  ],
  bases: {
    weapon: ['Hunting Bow', 'Recurve Bow', 'Longbow'],
    offhand: ['Trail Charm'], head: ['Scout Cap'], chest: ['Trailcoat'], hands: ['Bowguards'],
  },
  twoHanded: ['Hunting Bow', 'Recurve Bow', 'Longbow'],
  excludeStats: ['arcanePct', 'elementalPct', 'block', 'blockAmount'],
  excludeSlots: ['offhand'],
  implicits: { weapon: [['damagePct', 1]], offhand: [['crit', 1]], chest: [['life', 1], ['armor', 1]] },
  // (Health from gear between the mage's and the warrior's, as his own is: more than his own's share, as he has no off-hand
  // and his coat is light)
  gearLife: 1.45,
  starterGear: [{ slot: 'weapon', rarity: 'common', ilvl: 1 }, { slot: 'chest', rarity: 'common', ilvl: 1 }],
};

export default ranger;
