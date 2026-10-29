// Co-op UI: the "Play together" room dialog, the lobby's room bar, and in a run the partners'
// frames and nameplates, the downed state and the revive prompt.
import { G } from '../state';
import { COOP } from '../data/balance';
import { session, hostRoom, joinRoom, leaveRoom, inviteLink, partners } from '../net/session';
import { whenWarm } from '../game/warm';
import { READYING } from './readying';
import { serverUp, SERVER_DOWN } from '../net/transport';
import { isCoop } from '../net/role';
import { anchorLabel, removeLabel, project, onLayout } from './floaters';
import { Label, ORDER } from './overlay/layer';
import { ALLY_BAR, ALLY_NAME, barArt, barStep } from './overlay/bars';
import { drawText, measure, OUTLINE, type TextStyle } from './overlay/paint';
import { renderLobbyOptions } from './menus';
import { openSaves } from './saves';
import { isTouch } from './touch';
import { uiScales } from './scale';
import { sfx } from '../core/audio';
import { reportLinks, bindReportLinks } from './netHud';
import type { Player } from '../entities/player';

const $ = <T extends Element = HTMLElement>(s: string, root: ParentNode = document): T => root.querySelector<T>(s)!;
const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

const who = (p: Player): string => `${p.slot === 0 ? '호스트' : '파트너'} · ${p.cls.name}`;

let touchRevive = false;
/** a room hosted or joined: before the programs are warm, once they are (a partner's hero is any class) */
const host = whenWarm(['fight', 'heroes'], () => void hostRoom(), READYING.coop);
const join = whenWarm(['fight', 'heroes'], (code: string) => void joinRoom(code), READYING.coop);
/** Whether the touch revive button is held. */
export const touchReviving = (): boolean => touchRevive;

export function initCoop(): void {
  $('#btn-coop').onclick = () => { sfx.click(); openCoop(true); };
  $('#btn-coop-close').onclick = () => { sfx.click(); openCoop(false); };
  $('#coop').onclick = (e) => { if (e.target === $('#coop')) openCoop(false); };
  const rv = $('#btn-revive');
  const hold = (on: boolean) => (e: Event) => { e.preventDefault(); touchRevive = on; };
  rv.addEventListener('pointerdown', hold(true));
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) rv.addEventListener(ev, hold(false));
  renderCoop();
}

/** the co-op server as last checked: asked each time the dialog opens with no room */
let server: 'checking' | 'up' | 'down' = 'checking';
let checkNo = 0;
async function checkServer(): Promise<void> {
  const n = ++checkNo;
  server = 'checking';
  renderCoop();
  const up = await serverUp();
  if (n !== checkNo) return;
  server = up ? 'up' : 'down';
  renderCoop();
}

function openCoop(open: boolean): void {
  $('#coop').classList.toggle('hidden', !open);
  if (!open) return;
  if (session.status === 'off' || session.status === 'failed') void checkServer();
  else renderCoop();
}

/** The room dialog and the lobby's room bar, for the session as it stands. */
export function renderCoop(): void {
  renderLobbyOptions();
  renderBar();
  const body = $('#coop .coop-body');
  const others = partners();
  const s = session.status;
  if (s === 'off' || s === 'failed') {
    body.innerHTML = `
      <p class="coop-intro">인터넷으로 최대 ${COOP.maxPlayers}명의 영웅이 나란히 싸웁니다. 각자 자기 영웅과 장비를 가져오고 전리품도 각자 챙깁니다.</p>
      <p class="coop-intro">함께 새로 시작하나요? 먼저 <button class="link coop-saves">빈 저장 슬롯을 고르세요</button>: 저장된 영웅들은 그대로 유지됩니다.</p>
      ${server === 'down' ? `<div class="coop-offline" role="status"><p>${esc(SERVER_DOWN)}</p><button class="btn" id="btn-coop-retry">다시 시도</button></div>`
        : server === 'checking' ? '<p class="coop-checking" role="status">협동 서버를 확인하는 중…</p>'
        : s === 'failed' ? `<p class="coop-error">${esc(session.error)}</p>` : ''}
      <div class="coop-choice${server === 'up' ? '' : ' off'}">
        <div class="coop-col"><div class="coop-h">방 만들기</div><p>방을 열고 친구에게 링크를 보내세요.</p>
          <button class="btn primary" id="btn-coop-host"${server === 'up' ? '' : ' disabled'}>방 열기</button></div>
        <div class="coop-col"><div class="coop-h">참가하기</div><p>친구가 보낸 코드를 입력하세요.</p>
          <form class="coop-join"><input id="coop-code" maxlength="8" placeholder="CODE" autocomplete="off" spellcheck="false" aria-label="방 코드"${server === 'up' ? '' : ' disabled'}><button class="btn" type="submit"${server === 'up' ? '' : ' disabled'}>참가</button></form></div>
      </div>
      ${reportLinks()}`;
    bindReportLinks(body);
    $('#btn-coop-host', body).onclick = () => { if (server !== 'up') return; sfx.click(); host(); };
    const retry = $('#btn-coop-retry', body) as HTMLElement | null;
    if (retry) retry.onclick = () => { sfx.click(); void checkServer(); };
    $('.coop-saves', body).onclick = () => { sfx.click(); openCoop(false); openSaves(true); };
    $<HTMLFormElement>('.coop-join', body).onsubmit = (e) => {
      e.preventDefault();
      const code = $<HTMLInputElement>('#coop-code', body).value.trim();
      if (code.length >= 4 && server === 'up') { sfx.click(); join(code); }
    };
    return;
  }
  if (s === 'joining') {
    body.innerHTML = `<p class="coop-wait">방 <b class="coop-code">${esc(session.code)}</b>에 참가하는 중…</p>
      <p class="coop-intro">협동 서버에서 호스트를 찾는 중입니다.</p>
      <button class="btn" id="btn-coop-leave">취소</button>
      ${reportLinks()}`;
  } else {
    const list = others.length
      ? others.map((p) => `<li><span class="coop-dot"></span>${esc(who(p))}</li>`).join('')
      : `<li class="coop-wait">친구가 참가하기를 기다리는 중…</li>`;
    body.innerHTML = `
      <div class="coop-room">방 <b class="coop-code">${esc(session.code)}</b></div>
      ${s === 'hosting' ? `<div class="coop-link"><input readonly value="${esc(inviteLink())}" aria-label="초대 링크"><button class="btn" id="btn-coop-copy">링크 복사</button></div>` : ''}
      <ul class="coop-list">${list}</ul>
      <p class="coop-intro">${s === 'hosting' ? '당신이 전장을 고르고 런을 시작하면 친구들이 함께합니다.' : '호스트가 전장을 고르고 런을 시작합니다.'}
        웨이브가 끝날 때마다 모두가 결정합니다: 보관하고 나갈지, 함께 계속할지.</p>
      <button class="btn danger" id="btn-coop-leave">방 나가기</button>
      ${reportLinks()}`;
    const copy = $('#btn-coop-copy', body) as HTMLElement | null;
    if (copy) copy.onclick = () => {
      sfx.click();
      navigator.clipboard?.writeText(inviteLink()).then(() => { copy.textContent = '복사됨'; }, () => $<HTMLInputElement>('.coop-link input', body).select());
    };
  }
  bindReportLinks(body);
  $('#btn-coop-leave', body).onclick = () => { sfx.click(); leaveRoom(); };
}

/** The lobby's line about the room (hidden solo). */
function renderBar(): void {
  const bar = $('#coop-bar');
  bar.classList.toggle('hidden', session.status === 'off' || session.status === 'failed');
  const others = partners();
  const text = session.status === 'joining' ? `방 ${session.code}에 참가하는 중…`
    : others.length ? `${others.map((p) => p.cls.name).join(', ')}와 함께` : '친구를 기다리는 중…';
  bar.innerHTML = `<span class="cb-room">방 <b>${esc(session.code)}</b></span><span class="cb-who">${esc(text)}</span>`;
  bar.onclick = () => { sfx.click(); openCoop(true); };
  $('#btn-coop').textContent = isCoop() ? '방' : '함께 하기';
}

// --- in a run ------------------------------------------------------------------------------
/** A partner's nameplate over their head, and their frame in the corner. */
interface Tag { label: Label; shown: number; frame: HTMLElement; frameFill: HTMLElement; state: HTMLElement }
const tags = new Map<Player, Tag>();
/** the marker on a downed partner (over them, or at the screen's edge pointing the way to them), and in reach of
 *  them, the prompt to raise them */
let downMark: Label | null = null;
let raisePrompt: HTMLElement | null = null;
/** the downed partner the marker is placed for this frame, and whether we're in reach of them */
let marked: { downed: Player; near: boolean } | null = null;
/** the whole seconds the marker last showed, so it beats as each one goes */
let shownSecond = -1;
/** how high over a downed body its marker floats, m (lower, it hid the body from the top-down view) */
const MARK_HEIGHT = 2.1;
/** the seconds left from which the marker beats harder */
const HURRY = 8;

/** how far in from the screen's edges a downed partner's marker's ring stays (px, at the HUD's scale): its arrow clear
 *  of the hotbar and the wave's badge */
const EDGE = { side: 80, top: 120, bottom: 185 };
/** the ring's radius (px, at the HUD's scale): the marker is placed by its ring's middle */
const RING = 38;

function markFor(): Label {
  if (downMark) return downMark;
  downMark = new Label(ORDER.marker);
  downMark.shown = false;
  // (placed after the camera has moved, with the rest of the labels)
  onLayout(placeMark);
  return downMark;
}

function promptFor(): HTMLElement {
  if (raisePrompt) return raisePrompt;
  const el = document.createElement('div');
  el.className = 'rvprompt hidden';
  el.innerHTML = '<div class="rp-line"><kbd>E</kbd><span>길게 눌러 부활</span></div><div class="rp-bar"><div></div></div>';
  $('#hud').appendChild(el);
  raisePrompt = el;
  return el;
}

/** In reach of a downed partner (keyboard and mouse: touch has its button), the prompt to hold E, and the revive. */
function promptRaise(downed: Player | undefined, near: boolean): void {
  const el = promptFor();
  const shown = !!downed && near && !isTouch();
  el.classList.toggle('hidden', !shown);
  if (!shown) return;
  $('span', el).textContent = downed.revive > 0 ? `${downed.cls.name} 부활 중…` : `길게 눌러 ${downed.cls.name} 부활`;
  $('.rp-bar div', el).style.width = `${(downed.revive * 100).toFixed(0)}%`;
}

/** when the marker last beat (s, the page's clock: CSS's animation ran on it), and whether that beat was a hurried one */
let beatAt = -Infinity, hurried = false;
/** a beat's length (s) */
const BEAT = 0.8;
const reduceMotion = typeof matchMedia !== 'undefined' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

/** The marker beats once as each second of a downed partner's clock goes, harder near its end (a heartbeat). */
function beat(second: number): void {
  if (second === shownSecond) return;
  const first = shownSecond < 0;
  shownSecond = second;
  if (first) return;
  beatAt = performance.now() / 1000;
  hurried = second <= HURRY;
}

/** A heartbeat's swell at `k` (0 to 1) through it, peaking at `big`: two pulses, the second smaller. */
function heartbeat(k: number, big: number): number {
  const keys: [number, number][] = [[0, 1], [0.12, big], [0.26, 1], [0.4, 1 + (big - 1) * 0.6], [0.6, 1], [1, 1]];
  for (let i = 1; i < keys.length; i++) {
    const [k0, s0] = keys[i - 1], [k1, s1] = keys[i];
    if (k <= k1) {
      const t = (k - k0) / (k1 - k0), eased = 1 - (1 - t) * (1 - t);
      return s0 + (s1 - s0) * eased;
    }
  }
  return 1;
}

/** Which partner is down for the marker, and whether we're in reach (its look and place are set with the labels). */
function markDowned(downed: Player | undefined, near: boolean): void {
  markFor();
  marked = downed ? { downed, near } : null;
  if (!downed) shownSecond = -1;
}

const DOWN_RED = '#ff2a1e';
const WHAT: TextStyle = { face: 'display', size: 18, color: '#ff6a5a', spacing: 0.5, shadows: OUTLINE };
const FAR: TextStyle = { face: 'body', size: 15, color: '#ffd8d0', shadows: OUTLINE };
const SECONDS: TextStyle = { face: 'display', size: 32, color: '#fff0ec', shadows: OUTLINE };

/**
 * A downed partner's marker, every frame: over them where the view shows them, else at the screen's edge on the way to
 * them with an arrow pointing there; their clock running out round its ring, the revive filling it, how far they are.
 * (A small ring over the body alone was lost from sight as soon as the body was off screen.)
 */
function placeMark(): void {
  const mark = downMark!;
  mark.shown = !!marked;
  if (!marked) return;
  const { downed, near } = marked;
  const me = G.player;
  // (its edges' margins are px of the UI's reference layout, at the HUD's scale)
  const ui = uiScales.hud;
  const w = window.innerWidth, h = window.innerHeight;
  const p = project(downed.pos.x, downed.obj.position.y + MARK_HEIGHT, downed.pos.z);
  const left = EDGE.side * ui, right = w - EDGE.side * ui, top = EDGE.top * ui, bottom = h - EDGE.bottom * ui;
  const inView = !p.behind && p.x >= left && p.x <= right && p.y >= top && p.y <= bottom;
  let x = p.x, y = p.y, turn = 0;
  if (!inView) {
    // along the way from the middle of the screen to them (behind the camera, the projection points the other way)
    const cx = w / 2, cy = (top + bottom) / 2;
    let dx = (p.x - cx) * (p.behind ? -1 : 1), dy = (p.y - cy) * (p.behind ? -1 : 1);
    if (Math.abs(dx) < 1e-3 && Math.abs(dy) < 1e-3) dy = 1;
    const reach = Math.min(Math.abs(dx) > 1e-3 ? (right - cx) / Math.abs(dx) : Infinity, Math.abs(dy) > 1e-3 ? (bottom - cy) / Math.abs(dy) : Infinity);
    x = cx + dx * reach;
    y = cy + dy * reach;
    turn = Math.atan2(dy, dx);
  }
  // (pointing down, its words go above the ring, out of the arrow's way)
  const above = !inView && Math.abs(y - bottom) < 1;
  const bleedLeft = Math.max(0, downed.bleed);
  const second = Math.ceil(bleedLeft);
  // (while someone raises them their clock stops, and so does the beat)
  if (downed.revive <= 0) beat(second);
  const what = near ? (isTouch() ? '부활 길게 누르기' : 'E 길게 누르기') : downed.revive > 0 ? '부활되는 중' : `${downed.cls.name} 쓰러짐`;
  const far = `${Math.round(Math.hypot(downed.pos.x - me.pos.x, downed.pos.z - me.pos.z))} m`;
  const since = performance.now() / 1000 - beatAt;
  const beating = downed.revive <= 0 && since < BEAT;
  const big = hurried ? 1.3 : 1.16, swell = beating ? heartbeat(since / BEAT, big) : 1;
  const art = markArt({
    left: bleedLeft / COOP.bleedOut, raised: downed.revive, second, what, far, above, edge: !inView, turn,
    // (with reduced motion, the glow alone beats)
    scale: reduceMotion?.matches ? 1 : swell, glow: (swell - 1) / (big - 1),
  });
  mark.show(art);
  mark.x = x;
  mark.y = y;
  mark.ax = 0.5;
  mark.ay = art.ringY / art.h;
}

/** What the marker shows: the share of the clock left and of the revive done, its words, and how it's placed
 *  (`above`: its words over the ring; `edge`: the arrow turned `turn` towards them), its beat's swell. */
interface MarkLook {
  left: number; raised: number; second: number; what: string; far: string;
  above: boolean; edge: boolean; turn: number; scale: number; glow: number;
}

/** The marker's art, and where its ring's middle is down it (px of the UI's reference layout: the labels are drawn
 *  at the HUD's scale). */
function markArt(m: MarkLook): { w: number; h: number; ringY: number; paint(c: CanvasRenderingContext2D, s: number): void } {
  const R = RING, reach = 68 + 8;
  const what = measure(m.what, WHAT), far = measure(m.far, FAR);
  const gap = 2, words = what.h + far.h + gap, pad = 8;
  const box = reach * 2, w = Math.max(box, what.w + pad * 2, far.w + pad * 2);
  const h = box + words + pad;
  const ringY = m.above ? h - box / 2 : box / 2;
  return {
    w, h, ringY,
    paint(c, s) {
      const cx = w / 2, cy = ringY;
      if (m.edge) {
        // the arrow: out past the ring towards them
        c.save();
        c.translate(cx, cy);
        c.rotate(m.turn);
        c.shadowColor = 'rgba(0,0,0,.85)';
        c.shadowBlur = 5 * s;
        c.fillStyle = DOWN_RED;
        c.beginPath();
        c.moveTo(46, -14);
        c.lineTo(68, 0);
        c.lineTo(46, 14);
        c.closePath();
        c.fill();
        c.restore();
      }
      c.save();
      c.translate(cx, cy);
      c.scale(m.scale, m.scale);
      // its glow, stronger at the beat's peak, and a dark rim round it
      c.fillStyle = 'rgba(40,0,0,.6)';
      c.shadowColor = `rgba(255,42,30,${0.7 + 0.3 * m.glow})`;
      c.shadowBlur = (18 + 12 * m.glow) * s;
      c.beginPath();
      c.arc(0, 0, R, 0, Math.PI * 2);
      c.fill();
      c.shadowColor = '#000';
      c.shadowBlur = 4 * s;
      c.fill();
      c.shadowColor = 'transparent';
      c.shadowBlur = 0;
      // the clock: red from the top round as much as is left
      if (m.left > 0) {
        c.fillStyle = DOWN_RED;
        c.beginPath();
        c.moveTo(0, 0);
        c.arc(0, 0, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, m.left));
        c.closePath();
        c.fill();
      }
      // the dark face inside it
      const r = R - 7, face = c.createRadialGradient(0, 0, 0, 0, 0, r * Math.SQRT2);
      face.addColorStop(0, '#5a0a06');
      face.addColorStop(0.75, '#1c0403');
      c.fillStyle = face;
      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI * 2);
      c.fill();
      // the revive filling a gold band round the face's edge
      if (m.raised > 0) {
        const inner = r * 0.86;
        c.strokeStyle = '#ffe6a0';
        c.lineWidth = r - inner;
        c.beginPath();
        c.arc(0, 0, (r + inner) / 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, m.raised));
        c.stroke();
      }
      c.restore();
      // the seconds in the middle, and the words under the ring (over it at the bottom edge)
      const sec = measure(String(m.second), SECONDS);
      drawText(c, sec, cx - sec.w / 2, cy - sec.h / 2, SECONDS, s);
      // (over it, the column turned round as the page's was: the distance on top, the words next to the ring)
      const top = m.above ? cy - R - gap - words : cy + R + gap;
      const whatY = m.above ? top + far.h + gap : top, farY = m.above ? top : top + what.h + gap;
      drawText(c, what, cx - what.w / 2, whatY, WHAT, s);
      drawText(c, far, cx - far.w / 2, farY, FAR, s);
    },
  };
}

function tagFor(p: Player): Tag {
  let t = tags.get(p);
  if (t) return t;
  const frame = document.createElement('div');
  frame.className = 'pf';
  frame.innerHTML = `<div class="pf-name">${esc(who(p))}</div><div class="pf-bar"><div class="pf-fill"></div></div><div class="pf-state"></div>`;
  $('#party').appendChild(frame);
  // over the head (a downed partner has the revive prompt instead)
  const label = anchorLabel(ORDER.tag, () => (G.players.includes(p) && !p.away && p.obj.visible && G.mode === 'run' && p.alive
    ? { x: p.pos.x, y: p.obj.position.y + p.model.height + 0.45, z: p.pos.z } : null));
  t = { label, shown: -1, frame, frameFill: $('.pf-fill', frame), state: $('.pf-state', frame) };
  tags.set(p, t);
  return t;
}

/** Every frame of a co-op run: the party frame, nameplates, the downed note and the revive prompt. */
export function updateCoopHud(): void {
  // partners gone from the room take their nameplate and frame with them
  for (const [p, t] of tags) if (!G.players.includes(p)) { removeLabel(t.label); t.frame.remove(); tags.delete(p); }
  if (!isCoop()) { hideRunBits(); return; }
  // out of the run and watching: our bars, skills and spoils have nothing more to show
  $('#hud').classList.toggle('watching', !!G.player.out);
  const others = G.players.filter((p) => !p.local);
  for (const p of others) {
    const t = tagFor(p);
    const share = Math.max(0, p.life / p.stats.maxLife);
    t.frameFill.style.width = `${(share * 100).toFixed(1)}%`;
    const look = { ...ALLY_BAR, name: p.cls.name, nameStyle: ALLY_NAME }, step = barStep(look, share);
    if (step !== t.shown) { t.shown = step; t.label.show(barArt(look, share)); }
    const state = p.away ? '로비에 있음' : p.out === 'banked' ? '보관함' : p.out === 'dead' ? '쓰러짐'
      : p.downed ? (p.revive > 0 ? '부활되는 중…' : `쓰러짐 · ${Math.ceil(p.bleed)}초`) : '';
    if (t.state.textContent !== state) t.state.textContent = state;
    t.frame.classList.toggle('down', p.downed);
    t.frame.classList.toggle('out', !!p.out || p.away);
  }


  // down: how long is left, and that a teammate can help
  const me = G.player;
  const note = $('#down-note');
  note.classList.toggle('hidden', !me.downed);
  if (me.downed) {
    note.innerHTML = `<b>쓰러졌습니다</b><span>${me.revive > 0 ? '파트너가 부활시키는 중…' : `${Math.ceil(me.bleed)}초 후 출혈 과다. 팀원이 부활시킬 수 있습니다.`}</span>
      <div class="dn-bar"><div style="width:${(me.revive * 100).toFixed(0)}%"></div></div>`;
  }

  // watching the rest of the run
  const watching = me.out && G.run && G.run.phase !== 'over' ? others.find((p) => p.inRun) : undefined;
  const spec = $('#spectate');
  spec.classList.toggle('hidden', !watching || !$('#summary').classList.contains('hidden'));
  if (watching) spec.textContent = `${watching.cls.name} 관전 중`;

  // a downed partner: the marker on them (or at the screen's edge), and on touch the button to hold
  const downed = me.active ? others.find((p) => p.downed && p.inRun) : undefined;
  const near = !!downed && Math.hypot(downed.pos.x - me.pos.x, downed.pos.z - me.pos.z) < COOP.reviveRange;
  markDowned(downed, near);
  promptRaise(downed, near);
  const rv = $('#btn-revive');
  rv.classList.toggle('hidden', !(near && isTouch()));
  if (!near) touchRevive = false;
}

function hideRunBits(): void {
  $('#hud').classList.remove('watching');

  $('#down-note').classList.add('hidden');
  $('#spectate').classList.add('hidden');
  $('#btn-revive').classList.add('hidden');
  marked = null;
  raisePrompt?.classList.add('hidden');
  shownSecond = -1;
}

/** The decision panel's line about the partners: who is still deciding, who continues, who left. */
export function partyDecision(): string {
  if (!isCoop() || !G.run) return '';
  const r = G.run;
  const rows = G.players.filter((p) => !p.local && !p.away).map((p) => {
    const s = p.out === 'banked' ? '보관하고 나감' : p.out === 'dead' ? '쓰러짐' : r.votes.has(p.slot) ? '계속하기로 함' : '결정 중…';
    return `${p.slot === 0 ? '호스트' : '파트너'} (${p.cls.name}) ${s}`;
  });
  return rows.join(' · ');
}

/** Waiting on the others after choosing Continue. */
export const waitingForParty = (): boolean => !!G.run && isCoop() && G.run.votes.has(G.player.slot);

