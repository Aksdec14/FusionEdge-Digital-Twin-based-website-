// Isometric digital-twin scene: city -> tower -> floor-by-floor split -> floor plan
// -> workspace / lift / meeting-room faults with raised tickets.
// Framework-agnostic: createTower(host) builds everything inside `host` and returns update(progress 0..1).
// `host` must be a positioned element (absolute/relative) that you size and place yourself.

// ───────────────────────── DATA (edit these) ─────────────────────────
export const LABELS = ['Visitor Management', 'Help Desk', 'Attendance', 'Asset AMC', 'Digital Checklist', 'Space Mapping', 'Asset Health']
// floor each label points at on the tower facade
export const FACADE_FLOORS = [6, 9, 12, 15, 18, 20, 23]
export const FLOOR_TAG = 'Common Area Management'

// floor plan rooms: [x, y, w, h, label, color]  (plan canvas is 560 x 560)
export const ROOMS: [number, number, number, number, string, string][] = [
  [40, 40, 240, 150, 'Open workspace', '#bcd3dd'], [40, 190, 160, 210, 'Open workspace', '#bcd3dd'],
  [290, 40, 75, 90, 'Meeting', '#f1c9b0'], [365, 40, 75, 90, 'Meeting', '#f1c9b0'], [440, 40, 80, 90, 'Meeting', '#f1c9b0'],
  [370, 140, 150, 115, 'Boardroom', '#e8a47d'], [370, 265, 150, 125, 'Pantry', '#d9d29a'],
  [210, 200, 70, 70, 'Lifts', '#aab4ba'], [280, 200, 70, 70, 'Stairs', '#aab4ba'], [210, 270, 140, 70, 'Restrooms', '#c2c9cd'],
  [210, 345, 140, 60, 'Hot desks', '#bcd3dd'], [40, 410, 160, 110, 'Focus booths', '#c9bfdc'],
  [210, 410, 150, 110, 'Lobby', '#d8dcdf'], [370, 400, 150, 120, 'Lounge', '#b9d6b5'],
]
// room indexes used by the zoom steps
const R_WORKSPACE = 0, R_MEETING = [2, 3, 4], R_LIFT_CORE = [7, 8, 9]

// asset marker: x,y on the plan; bad = not working; box = [x, y, width] of the ticket tag
export interface Issue { x: number; y: number; bad: boolean; box?: [number, number, number]; l1: string; l2?: string }
export const WORKSPACE_ISSUES: Issue[] = [
  { x: 58, y: 56, bad: true, box: [68, 46, 100], l1: 'Split AC · not cooling', l2: '2 tickets raised' },
  { x: 182, y: 56, bad: true, box: [190, 46, 84], l1: 'Printer · paper jam', l2: '1 ticket raised' },
  { x: 204, y: 151, bad: true, box: [178, 166, 94], l1: 'Workstation 07 · no power', l2: '1 ticket raised' },
  { x: 58, y: 172, bad: false, l1: 'Main panel · working' },
]
export const LIFT_ISSUE: Issue = { x: 255, y: 231, bad: true, box: [214, 284, 132], l1: 'Lift 2 · not working', l2: '1 ticket raised' }
export const LIFT_OK = { x: 229, y: 231, label: 'Lift 1 · working' }
export const MEETING_ISSUE: Issue = { x: 402, y: 100, bad: true, box: [352, 148, 150], l1: 'Meeting room 2 · chair broken', l2: '1 ticket raised' }

export const PLAN_TAGS = { plan: FLOOR_TAG, workspace: 'Open workspace · Floor 12', lift: 'Lift lobby · Floor 12', meeting: 'Meeting rooms · Floor 12' }

// ───────────────────────── helpers ─────────────────────────
const NS = 'http://www.w3.org/2000/svg'
type Pt = [number, number]
const K = 0.866
const P = (x: number, y: number, z: number): Pt => [(x - y) * K, (x + y) * 0.5 - z]
const pts = (a: Pt[]) => a.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')
const sm = (a: number, b: number, p: number) => { const t = Math.min(1, Math.max(0, (p - a) / (b - a))); return t * t * (3 - 2 * t) }
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
function el(n: string, a: Record<string, string | number>, par: Element) {
  const e = document.createElementNS(NS, n)
  for (const k in a) e.setAttribute(k, String(a[k]))
  par.appendChild(e)
  return e as SVGElement
}

const FH = 5, GAP = 9, NF = 26, FOC = 12, PITCH = 50
type Col = [string, string, string, string] // top, left, right, stroke
const GREY: Col = ['#f3f4f5', '#d8dbde', '#c3c7ca', '#8e969c']
const GLASS: Col = ['#e2d3ec', '#b79ccb', '#9a78b3', '#6f4a88']
const BAD = '#d64545', OK = '#2e9d5b'

const CSS = `
.tw-host{overflow:hidden;background:#fff;--tw-ink:#1d2a31;--tw-line:#9aa3a9;--tw-panel:#f6f7f8;--tw-bg:#fff;--tw-accent:#5d1f72;font-family:inherit}
.tw-scene{position:absolute;inset:0;width:100%;height:100%}
.tw-lab{position:absolute;left:0;top:0;white-space:nowrap;z-index:3;pointer-events:none;opacity:0}
.tw-lab i{position:absolute;left:-4px;top:-4px;width:8px;height:8px;border-radius:50%;background:var(--tw-accent)}
.tw-lab span{position:absolute;top:0;left:14px;transform:translateY(-50%);background:var(--tw-panel);color:var(--tw-ink);padding:3px 8px;border-radius:4px;font-size:clamp(11px,1.5vw,14px);font-weight:600;box-shadow:0 1px 3px rgba(0,0,0,.2)}
.tw-lab.tw-l span{left:auto;right:14px}
.tw-tag{position:absolute;top:clamp(16px,7%,64px);left:50%;transform:translateX(-50%);background:var(--tw-accent);color:#fff;padding:6px 16px;border-radius:999px;font-weight:600;font-size:clamp(12px,2vw,15px);opacity:0;z-index:3;max-width:calc(100% - 32px);white-space:normal;text-align:center;pointer-events:none}
.tw-plan{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:clamp(12px,3%,40px);padding:16px;box-sizing:border-box;overflow:hidden;opacity:0;pointer-events:none;z-index:2}
.tw-plan svg{width:min(560px,100%);max-height:100%;height:auto;flex:1 1 auto;min-width:0}
.tw-legend{list-style:none;margin:0;padding:0;width:min(210px,34%);font-size:clamp(12px,1.6vw,15px);display:none;color:var(--tw-ink);flex:none}
.tw-wide .tw-legend{display:block}
.tw-legend li{display:flex;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid var(--tw-line)}
.tw-legend b{width:14px;height:14px;border-radius:3px;flex:none}
.tw-room{opacity:0}
.tw-room text{font-size:13px;fill:var(--tw-ink);text-anchor:middle;font-family:inherit;font-weight:600}
`

// ───────────────────────── scene ─────────────────────────
export function createTower(host: HTMLElement, getTop: () => number = () => 0) {
  let seed = 7
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }

  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style)
  host.classList.add('tw-host')
  const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'tw-scene'); host.appendChild(svg)

  const box = (g: Element, x: number, y: number, w: number, d: number, h: number, z: number, c: Col, sw = 0.6) => {
    el('polygon', { points: pts([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)]), fill: c[1], stroke: c[3], 'stroke-width': sw }, g)
    el('polygon', { points: pts([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)]), fill: c[2], stroke: c[3], 'stroke-width': sw }, g)
    el('polygon', { points: pts([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)]), fill: c[0], stroke: c[3], 'stroke-width': sw }, g)
  }
  // grey context buildings: visible, non-glowing windows
  const greyWindows = (g: Element, x: number, y: number, w: number, d: number, h: number) => {
    const rows = Math.floor((h - 3) / FH), n = Math.max(3, Math.round(w / 7)), a = (w - 3) / n, b = (d - 3) / n
    for (let r = 0; r < rows; r++) {
      const z0 = r * FH + 1.5, z1 = z0 + 2.8
      for (let i = 0; i < n; i++) {
        const yy = y + 1.5 + i * b, xx = x + 1.5 + i * a
        el('polygon', { points: pts([P(x + w, yy, z0), P(x + w, yy + b - 1.2, z0), P(x + w, yy + b - 1.2, z1), P(x + w, yy, z1)]), fill: '#9aa4ad' }, g)
        el('polygon', { points: pts([P(xx, y + d, z0), P(xx + a - 1.2, y + d, z0), P(xx + a - 1.2, y + d, z1), P(xx, y + d, z1)]), fill: '#aab3bb' }, g)
      }
    }
  }
  // purple towers: dark glass panes, none lit
  const towerWindows = (g: Element, x: number, y: number, w: number, d: number, z: number, fh: number) => {
    const n = 7, z0 = z + 1, z1 = z + fh - 0.9, a = (w - 3) / n, b = (d - 3) / n
    for (let i = 0; i < n; i++) {
      const yy = y + 1.5 + i * b, xx = x + 1.5 + i * a
      el('polygon', { points: pts([P(x + w, yy, z0), P(x + w, yy + b - 1.2, z0), P(x + w, yy + b - 1.2, z1), P(x + w, yy, z1)]), fill: '#4d3363' }, g)
      el('polygon', { points: pts([P(xx, y + d, z0), P(xx + a - 1.2, y + d, z0), P(xx + a - 1.2, y + d, z1), P(xx, y + d, z1)]), fill: '#6b4c85' }, g)
    }
  }

  // city
  const cam = el('g', {}, svg)
  type Item = { d: number; t?: { gx: number; gy: number; f: number; main?: number }; gx?: number; gy?: number; h?: number; w?: number }
  const items: Item[] = []
  const T = [{ gx: 4, gy: 4, f: 26, main: 1 }, { gx: 2, gy: 5, f: 20 }, { gx: 5, gy: 2, f: 22 }]
  for (let gx = 0; gx < 9; gx++) for (let gy = 0; gy < 9; gy++) {
    const t = T.find((q) => q.gx === gx && q.gy === gy)
    if (t) { items.push({ d: gx + gy, t }); continue }
    if (rnd() < 0.12) continue
    items.push({ d: gx + gy, gx, gy, h: 12 + rnd() * rnd() * 80, w: 30 + rnd() * 10 })
  }
  items.sort((a, b) => a.d - b.d)
  const cityG: Element[] = [], floors: Element[] = []
  let mainXY: Pt = [0, 0]
  items.forEach((it) => {
    const g = el('g', {}, cam)
    if (it.t) {
      const x = it.t.gx * PITCH, y = it.t.gy * PITCH
      if (it.t.main) {
        mainXY = [x + 20, y + 20]
        for (let i = 0; i < NF; i++) {
          const fg = el('g', {}, g)
          box(fg, x, y, 40, 40, FH - 0.8, 0, GLASS, 0.5)
          towerWindows(fg, x, y, 40, 40, 0, FH - 0.8)
          floors.push(fg)
        }
      } else {
        box(g, x + 2, y + 2, 36, 36, it.t.f * FH, 0, GLASS, 0.5)
        for (let wf = 0; wf < it.t.f; wf++) towerWindows(g, x + 2, y + 2, 36, 36, wf * FH, FH - 0.8)
        cityG.push(g)
      }
    } else {
      const x2 = it.gx! * PITCH + (PITCH - it.w!) / 2, y2 = it.gy! * PITCH + (PITCH - it.w!) / 2
      box(g, x2, y2, it.w!, it.w!, it.h!, 0, GREY)
      greyWindows(g, x2, y2, it.w!, it.w!, it.h!)
      cityG.push(g)
    }
  })
  const ctr = P(mainXY[0], mainXY[1], 0), cc = P(225, 225, 0)

  // facade labels
  const labEls = LABELS.map((n, i) => {
    const d = document.createElement('div'); d.className = 'tw-lab' + (i % 2 ? ' tw-l' : '')
    d.innerHTML = `<i></i><span>${n}</span>`; host.appendChild(d); return d
  })

  // floor plan overlay
  const planEl = document.createElement('div'); planEl.className = 'tw-plan'
  planEl.innerHTML = `<svg viewBox="0 0 560 560" role="img" aria-label="Floor plan"><polygon points="60,30 500,30 530,60 530,500 500,530 60,530 30,500 30,60" fill="var(--tw-panel)" stroke="var(--tw-ink)" stroke-width="3"/><g class="tw-rooms"></g></svg><ul class="tw-legend"></ul>`
  host.appendChild(planEl)
  const psvg = planEl.querySelector('svg') as SVGSVGElement
  const rg = planEl.querySelector('.tw-rooms') as SVGGElement
  const lg = planEl.querySelector('.tw-legend') as HTMLElement
  const seen: Record<string, number> = {}
  ROOMS.forEach((r) => {
    const g = el('g', { class: 'tw-room' }, rg)
    el('rect', { x: r[0] + 3, y: r[1] + 3, width: r[2] - 6, height: r[3] - 6, rx: 4, fill: r[5], stroke: 'var(--tw-ink)', 'stroke-width': 1.5 }, g)
    el('text', { x: r[0] + r[2] / 2, y: r[1] + r[3] / 2 + 4 }, g).textContent = r[2] < 100 ? r[4].split(' ')[0] : r[4]
    if (!seen[r[4]]) { seen[r[4]] = 1; const li = document.createElement('li'); li.innerHTML = `<b style="background:${r[5]}"></b>${r[4]}`; lg.appendChild(li) }
  })
  const rooms = Array.from(rg.children) as SVGElement[]
  const roomText = (i: number) => rooms[i].querySelector('text') as SVGElement

  // overlays that live inside the zoomable plan
  const ig = el('g', {}, psvg), desks = el('g', {}, ig)
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) el('rect', { x: 60 + c * 36, y: 80 + r * 32, width: 24, height: 14, rx: 2, fill: 'var(--tw-bg)', stroke: 'var(--tw-line)', 'stroke-width': 1 }, desks)
  const dot = (g: Element, x: number, y: number, c: string) => el('circle', { cx: x, cy: y, r: 6, fill: c, stroke: '#fff', 'stroke-width': 1.5 }, g)
  const tag = (g: Element, bx: number, by: number, w: number, l1: string, l2: string, mx: number, my: number) => {
    if (by > my + 10) el('line', { x1: mx, y1: my, x2: mx, y2: by, stroke: BAD, 'stroke-width': 1 }, g)
    el('rect', { x: bx, y: by, width: w, height: 22, rx: 3, fill: 'var(--tw-panel)', stroke: BAD, 'stroke-width': 1.2 }, g)
    el('text', { x: bx + 5, y: by + 9, 'font-size': 7, 'font-weight': 600, fill: 'var(--tw-ink)' }, g).textContent = l1
    el('text', { x: bx + 5, y: by + 18, 'font-size': 7, 'font-weight': 700, fill: BAD }, g).textContent = l2
  }
  const issue = (g: Element, d: Issue) => {
    if (d.bad && d.box) tag(g, d.box[0], d.box[1], d.box[2], d.l1, d.l2 || '', d.x, d.y)
    else el('text', { x: d.x + 10, y: d.y + 3, 'font-size': 7, 'font-weight': 600, fill: OK }, g).textContent = d.l1
    dot(g, d.x, d.y, d.bad ? BAD : OK)
  }
  const WG = WORKSPACE_ISSUES.map((d) => { const g = el('g', {}, ig); issue(g, d); return g })
  const LG = el('g', {}, ig), MG = el('g', {}, ig)
  el('rect', { x: 218, y: 212, width: 22, height: 38, rx: 2, fill: 'var(--tw-bg)', stroke: 'var(--tw-line)' }, LG)
  el('rect', { x: 244, y: 212, width: 22, height: 38, rx: 2, fill: 'var(--tw-bg)', stroke: 'var(--tw-line)' }, LG)
  tag(LG, LIFT_ISSUE.box![0], LIFT_ISSUE.box![1], LIFT_ISSUE.box![2], LIFT_ISSUE.l1, LIFT_ISSUE.l2!, LIFT_ISSUE.x, LIFT_ISSUE.y)
  dot(LG, LIFT_ISSUE.x, LIFT_ISSUE.y, BAD); dot(LG, LIFT_OK.x, LIFT_OK.y, OK)
  el('text', { x: 216, y: 263, 'font-size': 7, 'font-weight': 600, fill: OK }, LG).textContent = LIFT_OK.label
  ;[327, 402, 480].forEach((cx) => {
    el('rect', { x: cx - 16, y: 66, width: 32, height: 28, rx: 3, fill: 'var(--tw-bg)', stroke: 'var(--tw-line)' }, MG)
    ;[[cx, 60], [cx, 100], [cx - 22, 80], [cx + 22, 80]].forEach((q) => el('circle', { cx: q[0], cy: q[1], r: 3.5, fill: 'var(--tw-line)' }, MG))
  })
  tag(MG, MEETING_ISSUE.box![0], MEETING_ISSUE.box![1], MEETING_ISSUE.box![2], MEETING_ISSUE.l1, MEETING_ISSUE.l2!, MEETING_ISSUE.x, MEETING_ISSUE.y)
  dot(MG, MEETING_ISSUE.x, MEETING_ISSUE.y, BAD)

  const ftag = document.createElement('div'); ftag.className = 'tw-tag'; ftag.textContent = PLAN_TAGS.plan; host.appendChild(ftag)

  // sizing
  let W = host.clientWidth || 1, H = host.clientHeight || 1, U = 1, TOP = 0, CY = 0
  let labelWidths = labEls.map(() => 120)
  function resize() {
    W = host.clientWidth || 1; H = host.clientHeight || 1
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
    const nav = document.querySelector('nav')
    const overlap = nav ? nav.getBoundingClientRect().bottom - host.getBoundingClientRect().top + 12 : getTop()
    TOP = Math.max(0, overlap)
    const availH = Math.max(1, H - TOP)
    CY = TOP + availH / 2
    // 960 x 600 is the opening city (camera scale 1.2) plus a margin, so the block stays inside the stage
    U = Math.min(W / 960, availH / 600)
    host.style.setProperty('--tw-h', availH + 'px')
    planEl.style.paddingTop = TOP + 16 + 'px'; ftag.style.top = TOP + 12 + 'px'
    host.classList.toggle('tw-wide', W >= 880)
    labelWidths = labEls.map((d) => d.querySelector('span')?.getBoundingClientRect().width || 120)
  }
  resize()

  // p: 0..1
  function update(p: number) {
    const a = sm(0, 0.2, p), e = sm(0.24, 0.44, p), f = sm(0.46, 0.66, p), g = sm(0.62, 0.72, p)
    const z = sm(0.72, 0.82, p), a2 = sm(0.84, 0.92, p), a3 = sm(0.93, 0.995, p)

    // 3D-ish camera on the city
    const gap = GAP * e, tz = (NF * (FH + gap)) / 2, fz = FOC * (FH + gap) + FH / 2
    const t1 = lerp(cc[0], ctr[0], a), y1 = lerp(cc[1] - 30, ctr[1] - 40, a)
    let s = lerp(1.2, 2.6, a); s = lerp(s, 1.3, e)
    const ty1 = lerp(y1, ctr[1] - tz + 25, e)
    s = lerp(s, 8, f)
    const ty2 = lerp(ty1, ctr[1] - fz, f)
    cam.setAttribute('transform', `translate(${W / 2},${CY}) scale(${s * U}) translate(${-t1},${-ty2})`)
    cityG.forEach((c) => ((c as SVGElement).style.opacity = String(1 - 0.7 * a - 0.3 * e)))
    floors.forEach((fl, i) => {
      fl.setAttribute('transform', `translate(0,${(-(i * (FH + gap))).toFixed(2)})`)
      ;(fl as SVGElement).style.opacity = String(i === FOC ? 1 : 1 - f)
    })
    svg.style.opacity = String(1 - g)
    planEl.style.opacity = String(g)

    // facade labels (one by one, gone before the split)
    labEls.forEach((d, i) => {
      const q = P(mainXY[0] + 20, mainXY[1] - 20 + ((i * 11) % 34) + 3, 0)
      const k = sm(0.04 + i * 0.022, 0.07 + i * 0.022, p) * (1 - sm(0.19, 0.23, p))
      const X = (q[0] - t1) * s * U + W / 2, Y = (q[1] - FACADE_FLOORS[i] * (FH + gap) - ty2) * s * U + CY
      const labelW = labelWidths[i]
      const leftSide = i % 2 === 1
      const minX = leftSide ? labelW + 16 : 8
      const maxX = leftSide ? W - 8 : W - labelW - 16
      const inView = W >= 520 && Y > TOP + 8 && Y < H - 8 && minX <= maxX
      const x = Math.min(maxX, Math.max(minX, X))
      d.style.opacity = String(inView ? k : 0)
      d.style.transform = `translate(${x.toFixed(1)}px,${Y.toFixed(1)}px)`
    })

    // floor plan rooms fade in, then dim around whichever area is in focus
    rooms.forEach((r, i) => {
      const focus = (1 - a2) * (i === R_WORKSPACE ? 1 : 0) + a2 * (1 - a3) * (R_LIFT_CORE.includes(i) ? 1 : 0) + a3 * (R_MEETING.includes(i) ? 1 : 0)
      r.style.opacity = String(sm(0.63 + i * 0.004, 0.68 + i * 0.004, p) * (1 - 0.65 * z * (1 - focus)))
    })
    ftag.style.opacity = String(sm(0.63, 0.68, p))
    ftag.textContent = a3 > 0.5 ? PLAN_TAGS.meeting : a2 > 0.5 ? PLAN_TAGS.lift : z > 0.5 ? PLAN_TAGS.workspace : PLAN_TAGS.plan
    lg.style.opacity = String(1 - z)

    // plan camera: overview -> workspace -> lifts -> meeting rooms
    const cx = lerp(lerp(lerp(280, 160, z), 280, a2), 405, a3)
    const cy = lerp(lerp(lerp(280, 115, z), 235, a2), 95, a3)
    const cs = lerp(lerp(lerp(1, 2.25, z), 3.2, a2), 2.6, a3)
    psvg.style.transformOrigin = '50% 50%'
    psvg.style.transform = `translateX(${z * (W > 880 ? W * 0.1 : 0)}px) scale(${cs}) translate(${-(cx - 280) / 5.6}%,${-(cy - 280) / 5.6}%)`
    roomText(R_WORKSPACE).style.opacity = String(1 - z)
    roomText(7).style.opacity = String(1 - a2); roomText(9).style.opacity = String(1 - a2)
    R_MEETING.forEach((i) => (roomText(i).style.opacity = String(1 - a3)))

    desks.style.opacity = String(sm(0.77, 0.8, p))
    WG.forEach((n, i) => ((n as SVGElement).style.opacity = String(sm(0.78 + i * 0.02, 0.8 + i * 0.02, p) * (1 - 0.6 * a2))))
    ;(LG as SVGElement).style.opacity = String(sm(0.88, 0.9, p) * (1 - 0.6 * a3))
    ;(MG as SVGElement).style.opacity = String(sm(0.95, 0.97, p))
  }

  function dispose() {
    style.remove(); svg.remove(); planEl.remove(); ftag.remove(); labEls.forEach((d) => d.remove())
    host.classList.remove('tw-host', 'tw-wide')
  }
  return { update, resize, dispose }
}