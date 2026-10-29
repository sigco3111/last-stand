// Optional network overlay (pause menu, persisted in a cookie): the room, the link to the relay server and the
// partners as they stand, and the network report (net/netlog) to copy or share when a partner can't connect. The co-op
// dialog offers the report too.
import { readCookie, writeCookie } from '../core/cookies';
import { netReport, netSummary } from '../net/netlog';
import { session } from '../net/session';
import { role } from '../net/role';
import { copyText } from './clipboard';

declare const __BUILD__: { ref: string; time: string };

const COOKIE = 'last-stand-net-hud';
const REDRAW_MS = 500;

let enabled = false;
let el: HTMLElement;
let body: HTMLElement;
let timer: ReturnType<typeof setInterval> | undefined;

const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const canShare = (): boolean => typeof navigator.share === 'function';

export function initNetHud(): void {
  el = document.querySelector<HTMLElement>('#net')!;
  // the buttons stay put while the rest redraws, so what they say after a click is seen
  el.innerHTML = `<div class="nt-body"></div>
    <div class="nt-acts"><button class="link" data-net="copy">로그 복사</button>${canShare() ? '<button class="link" data-net="share">로그 보내기</button>' : ''}</div>`;
  body = el.querySelector<HTMLElement>('.nt-body')!;
  bindReportLinks(el);
  setNetHud(readCookie(COOKIE) === '1', false);
}

export const netHudEnabled = (): boolean => enabled;

export function setNetHud(on: boolean, persist = true): void {
  enabled = on;
  el.classList.toggle('hidden', !on);
  clearInterval(timer);
  if (on) { draw(); timer = setInterval(draw, REDRAW_MS); }
  if (persist) writeCookie(COOKIE, on ? '1' : '0');
}

const STATE_CLASS: Record<string, string> = { open: 'ok', connecting: 'wait', closed: 'bad' };

function draw(): void {
  const s = netSummary();
  const room = session.status === 'off' ? '방 없음' : `방 <b>${esc(session.code)}</b> · ${esc(session.status)}`;
  const sv = s.server, peers = [...session.peers.values()];
  body.innerHTML = `
    <div class="nt-head">${room}</div>
    <div class="nt-sec">서버</div>
    <ul class="nt-links">${sv ? `<li class="${STATE_CLASS[sv.state] ?? ''}"><b>${esc(sv.host)}</b> ${esc(sv.state)}${sv.rtt !== null ? ` · ${sv.rtt.toFixed(0)} ms` : ''}${sv.dropped ? `<small>dropped ${sv.dropped}x</small>` : ''}</li>` : '<li>–</li>'}</ul>
    <div class="nt-sec">파트너</div>
    <ul class="nt-links">${peers.length ? peers.map((p) => `<li class="ok"><b>${esc(p.id.slice(0, 6))}</b> 슬롯 ${p.slot}${p.inRun ? ' · 런 중' : ''}</li>`).join('') : '<li>아직 없음</li>'}</ul>
    <div class="nt-sub">메시지 수신 ${s.msgs.in} · 송신 ${s.msgs.out}</div>`;
}

const report = (): string => netReport([
  `Time ${new Date().toISOString()} | build ${__BUILD__.ref} (${__BUILD__.time})`,
  `Page ${location.origin}${location.pathname}${location.search}`,
  `Session ${session.status}${session.code ? ` room ${session.code}` : ''} | role ${role.current}${session.error ? ` | error: ${session.error}` : ''}`,
  `Partners ${[...session.peers.values()].map((p) => `${p.id.slice(0, 6)} slot ${p.slot}${p.inRun ? ' in run' : ''}`).join(', ') || 'none'}`,
]);

/** Copy the network report to the clipboard, or hand it to the system's share sheet (a chat app). */
export async function sendReport(how: 'copy' | 'share', btn: HTMLElement): Promise<void> {
  const text = report();
  const label = btn.textContent;
  let done: string | null = null;
  if (how === 'share' && canShare()) {
    try {
      await navigator.share({ title: 'Last Stand 네트워크 로그', text });
      done = '보냄';
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  done ??= await copyText(text) ? '복사됨' : '복사 실패';
  btn.textContent = done;
  setTimeout(() => { btn.textContent = label; }, 1600);
}

/** The co-op dialog's links to the report. */
export const reportLinks = (): string =>
  `<p class="coop-netlog">연결에 문제가 있나요? <button class="link" data-net="copy">네트워크 로그를 복사</button>${canShare() ? '하거나 <button class="link" data-net="share">보내서</button>' : '해서'} 게임 운영자에게 전해 주세요.</p>`;

export function bindReportLinks(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-net]').forEach((b) => {
    b.onclick = () => void sendReport(b.dataset.net as 'copy' | 'share', b);
  });
}
