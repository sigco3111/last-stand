// Item generation data: slots, rarities, stats and affixes.
import type { RarityId, Slot, StatKey } from '../types';

export const SLOTS: Slot[] = ['weapon', 'offhand', 'head', 'chest', 'hands', 'amulet', 'ring'];

export interface SlotInfo { label: string; bases: string[]; implicit: [StatKey, number][]; glyph: string }
export interface RarityInfo { id: RarityId; name: string; color: string; affixes: [number, number]; power: number }
/** implicitOnly: never rolls as an affix, only as an item's implicit (shield block stats) */
export interface StatInfo { base: number; grow: number; fmt: string; cap?: number; dec?: number; implicitOnly?: boolean }

export const SLOT_INFO: Record<Slot, SlotInfo> = {
  weapon:  { label: '무기',  bases: ['Staff', 'Scepter', 'Wand', 'Rod', 'Spire'],        implicit: [['damagePct', 1.4]], glyph: '/' },
  offhand: { label: '보조 장비', bases: ['Tome', 'Orb', 'Focus', 'Codex', 'Lantern'],       implicit: [['energy', 1], ['energyRegen', 0.6]], glyph: '◉' },
  head:    { label: '머리',    bases: ['Hood', 'Circlet', 'Cowl', 'Crown', 'Mask'],         implicit: [['life', 0.8]], glyph: '⌓' },
  chest:   { label: '가슴',   bases: ['Robes', 'Vestments', 'Mantle', 'Raiment', 'Garb'],  implicit: [['life', 1.2], ['armor', 0.8]], glyph: '♜' },
  hands:   { label: '손',   bases: ['Gloves', 'Wraps', 'Grips', 'Handguards'],           implicit: [['castSpeed', 0.8]], glyph: '✋' },
  amulet:  { label: '목걸이',  bases: ['Amulet', 'Pendant', 'Talisman', 'Choker'],          implicit: [['energy', 0.8]], glyph: '♁' },
  ring:    { label: '반지',    bases: ['Ring', 'Band', 'Signet', 'Loop'],                   implicit: [['crit', 0.8]], glyph: '○' },
};

export const RARITIES: RarityInfo[] = [
  { id: 'common',    name: '일반',    color: '#d8d4cc', affixes: [0, 1], power: 1.0 },
  { id: 'magic',     name: '마법',     color: '#f2da55', affixes: [1, 2], power: 1.2 },
  { id: 'rare',      name: '희귀',      color: '#46de5c', affixes: [2, 3], power: 1.45 },
  { id: 'epic',      name: '영웅',      color: '#3f9fff', affixes: [3, 4], power: 1.75 },
  { id: 'legendary', name: '전설', color: '#b35cff', affixes: [4, 5], power: 2.1 },
];

// base: value at item level 1 (before rarity), grow: fractional growth per ilvl,
// fmt: display template, cap: hard cap per item.
export const STATS: Record<StatKey, StatInfo> = {
  damagePct:   { base: 8,   grow: 0.10, fmt: '+{v}% 모든 피해', cap: 250 },
  arcanePct:   { base: 10,  grow: 0.10, fmt: '+{v}% 비전 피해', cap: 250 },
  elementalPct:{ base: 10,  grow: 0.10, fmt: '+{v}% 원소 피해', cap: 250 },
  life:        { base: 60,  grow: 0.12, fmt: '+{v} 생명력' },
  energy:      { base: 40,  grow: 0.10, fmt: '+{v} 기력' },
  // (a share of the class's own regeneration, so the classes that regenerate most gain most: a roll gives the
  // warrior what the flat Health a second it replaced did)
  lifeRegen:   { base: 50,  grow: 0.10, fmt: '+{v}% 생명력 재생' },
  energyRegen: { base: 3,   grow: 0.08, fmt: '초당 기력 재생 +{v}', dec: 1 },
  castSpeed:   { base: 5,   grow: 0.04, fmt: '+{v}% 시전 속도', cap: 30 },
  cdr:         { base: 4,   grow: 0.03, fmt: '-{v}% 스킬 재사용 대기', cap: 25 },
  crit:        { base: 2,   grow: 0.04, fmt: '+{v}% 치명타 확률', cap: 15, dec: 1 },
  critDmg:     { base: 8,   grow: 0.06, fmt: '+{v}% 치명타 피해', cap: 100 },
  moveSpeed:   { base: 4,   grow: 0.03, fmt: '+{v}% 이동 속도', cap: 20 },
  leech:       { base: 1,   grow: 0.03, fmt: '피해의 {v}%를 생명력으로 흡수', cap: 8, dec: 1 },
  armor:       { base: 3,   grow: 0.04, fmt: '+{v}% 물리 피해 감소', cap: 30 },
  resist:      { base: 4,   grow: 0.04, fmt: '+{v}% 마법 저항', cap: 35 },
  block:       { base: 12,  grow: 0.02, fmt: '{v}% 막기 확률', cap: 30, implicitOnly: true },
  blockAmount: { base: 45,  grow: 0.12, fmt: '{v} 피해 막기', implicitOnly: true },
};

// General stats that also count toward a specific one when filtering the stash
// (All Damage applies to arcane and elemental skills too).
export const STAT_INCLUDES: Partial<Record<StatKey, StatKey[]>> = {
  arcanePct: ['damagePct'],
  elementalPct: ['damagePct'],
};

// Affix name parts per stat (prefix or suffix is chosen at random).
export const AFFIX_NAMES: Record<StatKey, [prefix: string, suffix: string]> = {
  damagePct:    ['파멸의', '대재앙의'],
  arcanePct:    ['비전의', '공허의'],
  elementalPct: ['폭풍의', '원소의'],
  life:         ['불굴의', '활력의'],
  energy:       ['학자의', '정신의'],
  lifeRegen:    ['치유의', '재생의'],
  energyRegen:  ['평온의', '명징의'],
  castSpeed:    ['날쌘', '신속의'],
  cdr:          ['영원한', '회귀의'],
  crit:         ['예리한', '정밀의'],
  critDmg:      ['야만의', '파괴의'],
  moveSpeed:    ['질주의', '바람의'],
  leech:        ['흡혈의', '거머리의'],
  armor:        ['수호의', '보루의'],
  resist:       ['룬의', '결계의'],
  block:        ['철벽의', '성벽의'],
  blockAmount:  ['철벽의', '성벽의'],
};

// Display names for base types (stable identifier stays English for saves, icons and model lookup).
export const BASE_NAMES: Record<string, string> = {
  Staff: '지팡이', Scepter: '홀', Wand: '마법봉', Rod: '막대', Spire: '첨탑',
  Tome: '고서', Orb: '오브', Focus: '매개체', Codex: '전서', Lantern: '등불',
  Hood: '두건', Circlet: '관', Cowl: '수도두건', Crown: '왕관', Mask: '가면',
  Robes: '로브', Vestments: '예복', Mantle: '망토', Raiment: '의복', Garb: '옷',
  Gloves: '장갑', Wraps: '붕대', Grips: '손아귀', Handguards: '손보호대',
  Amulet: '부적', Pendant: '펜던트', Talisman: '호부', Choker: '초커',
  Ring: '반지', Band: '밴드', Signet: '인장', Loop: '고리',
  Sword: '검', Axe: '도끼', Mace: '메이스', Greatsword: '대검', 'Greataxe': '대형 도끼', Maul: '철퇴',
  Shield: '방패', Buckler: '버클러', Helm: '투구', Greathelm: '대형 투구',
  Cuirass: '흉갑', Hauberk: '사슬갑옷', Gauntlets: '건틀릿',
  'Hunting Bow': '사냥활', 'Recurve Bow': '리커브 보우', Longbow: '장궁',
  'Trail Charm': '오솔길 부적', 'Scout Cap': '정찰병 모자', Trailcoat: '행군 외투', Bowguards: '활 팔보호대',
};
export const baseName = (base: string): string => BASE_NAMES[base] ?? base;

export const LEGENDARY_NAMES = [
  '별똥별의 서약', '균열의 속삭임', '잿불 심장', '마지막 촛불', '서약 파괴자',
  '아홉 달의 베일', '폭풍소환사의 몫', '공허한 왕관', '재의 진혼곡', '해방된 눈',
];
