import * as THREE from 'three'

// Module labels that appear on the building facade
export const LABELS = ['Visitor Management', 'Help Desk', 'Attendance', 'Asset AMC', 'Digital Checklist', 'Space Mapping', 'Asset Health']
export const FLOOR_TAG = 'Common Area Management'
// Each critical asset gets the same treatment as the AC: a close-up and its own detail card.
export const ASSETS: { title: string; floor: number; x: number; z: number; y: number; rows: [string, string][] }[] = [
  { title: 'Split AC · Floor 18', floor: 18, x: -3, z: -8, y: 1.2, rows: [['Cooling', '18 °C · 92% efficiency'], ['Electricity used', '4.2 kWh today'], ['Panel', 'Working'], ['PPM', 'Due in 6 days'], ['Tickets raised', '2 open']] },
  { title: 'Passenger lift · Floor 8', floor: 8, x: -5, z: -5, y: 1.6, rows: [['Status', 'Working'], ['Trips today', '146'], ['Door', 'Closing normally'], ['PPM', 'Due in 12 days'], ['Tickets raised', 'None']] },
  { title: 'Main panel · Floor 14', floor: 14, x: 1, z: -6, y: 1.3, rows: [['Load', '64% of capacity'], ['Voltage', '415 V'], ['Breakers', 'All closed'], ['PPM', 'Due in 18 days'], ['Tickets raised', 'None']] },
]
// facade anchors on the hero tower's +x face: [floor, z]
const FAC: [number, number][] = [[6, -9], [9, 1], [12, -12], [15, -4], [18, -10], [20, 1], [23, -6]]

const FH = 3.4, NF = 26, PF = 5, FM = 20, SEL = 11
const SPLIT = 0.3 // extra gap added between floors in the exploded view
const PURPLE = 0x5d1f72, LILAC = 0xc9a9d8

const S = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const KF = (p: number, k: number[][]) => {
  if (p <= k[0][0]) return k[0][1]
  for (let i = 1; i < k.length; i++) if (p <= k[i][0]) return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * S(k[i - 1][0], k[i][0], p)
  return k[k.length - 1][1]
}

export interface Ui {
  labels: HTMLElement[]
  lines: SVGPolylineElement[]
  dots: SVGCircleElement[]
  floorTag: HTMLElement
  cards: HTMLElement[]
}

export function createTower(host: HTMLElement, ui: Ui) {
  let seed = 11
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647

  const scene = new THREE.Scene()
  const cam = new THREE.PerspectiveCamera(38, 1, 0.1, 600)
  const rend = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  rend.setClearColor(0x000000, 0)
  rend.shadowMap.enabled = true
  rend.toneMapping = THREE.ACESFilmicToneMapping
  rend.toneMappingExposure = 1.15
  rend.outputColorSpace = THREE.SRGBColorSpace
  rend.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  host.appendChild(rend.domElement)

  // lighting + soft sky reflections
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc8cad2, 1.4))
  {
    const sky = new THREE.Scene()
    const sg = new THREE.SphereGeometry(50, 24, 16)
    const pa = sg.attributes.position, cs: number[] = []
    for (let i = 0; i < pa.count; i++) { const y = (pa.getY(i) / 50 + 1) / 2; cs.push(0.5 + 0.5 * y, 0.6 + 0.4 * y, 0.75 + 0.25 * y) }
    sg.setAttribute('color', new THREE.Float32BufferAttribute(cs, 3))
    sky.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })))
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(40, 25), new THREE.MeshBasicMaterial({ color: 0xffffff }))
    panel.material.color.multiplyScalar(6)
    panel.position.set(25, 35, 25); panel.lookAt(0, 0, 0); sky.add(panel)
    const pg = new THREE.PMREMGenerator(rend)
    scene.environment = pg.fromScene(sky, 0.02).texture
    pg.dispose()
  }
  const sun = new THREE.DirectionalLight(0xfff4e6, 4.5)
  sun.position.set(60, 120, 70); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096)
  Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 160, bottom: -110, near: 1, far: 420 })
  sun.shadow.bias = -0.0004
  scene.add(sun)
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.ShadowMaterial({ opacity: 0.2 }))
  ground.rotation.x = -Math.PI / 2; ground.position.y = -1.06; ground.receiveShadow = true; scene.add(ground)
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(190, 1, 130), new THREE.MeshStandardMaterial({ color: 0xe6e8ee, roughness: 0.6 }))
  plinth.position.set(-6, -0.55, -8); plinth.receiveShadow = true; scene.add(plinth)

  // footprints: podium (rounded corner), main tower, set-back top tower
  const ps = new THREE.Shape()
  ps.moveTo(-16, 14); ps.lineTo(20, 14); ps.lineTo(20, -6); ps.quadraticCurveTo(20, -12, 14, -12); ps.lineTo(-16, -12); ps.closePath()
  const podPts = ps.getSpacedPoints(150).map((p) => [p.x, -p.y])
  const rect = (x0: number, x1: number, z0: number, z1: number, st: number) => {
    const a: number[][] = []
    for (let x = x0; x <= x1; x += st) a.push([x, z0], [x, z1])
    for (let z = z0; z <= z1; z += st) a.push([x0, z], [x1, z])
    return a
  }
  const towPts = rect(-16, 6, -14, 4, 0.6), topPts = rect(-9, 6, -12, 2, 0.6)
  const podG = new THREE.ExtrudeGeometry(ps, { depth: 0.45, bevelEnabled: false }); podG.rotateX(-Math.PI / 2)
  const towG = new THREE.BoxGeometry(22.8, 0.4, 18.8); towG.translate(-5, 0.2, -5)
  const topG = new THREE.BoxGeometry(15.8, 0.4, 14.8); topG.translate(-1.5, 0.2, -5)
  const postG = new THREE.BoxGeometry(0.11, 1, 0.11)
  const postBase = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.25, transparent: true })

  const groups: THREE.Group[] = [], slabMats: THREE.MeshStandardMaterial[] = [], postMats: THREE.MeshStandardMaterial[] = [], glassMats: THREE.MeshPhysicalMaterial[] = []
  for (let f = 0; f < NF; f++) {
    const g = new THREE.Group(), pod = f < PF
    const mat = new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.7, transparent: true }); slabMats.push(mat)
    const slab = new THREE.Mesh(pod ? podG : f < FM ? towG : topG, mat)
    slab.position.y = f * FH; slab.castShadow = slab.receiveShadow = true; g.add(slab)
    if (f === PF || f === FM) { const r = new THREE.Mesh(f === PF ? podG : towG, mat); r.position.y = f * FH; g.add(r) }
    if (f === NF - 1) {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(17, 0.9, 16), mat); cap.position.set(-1.5, (f + 1) * FH + 0.5, -5); cap.castShadow = true; g.add(cap)
      for (const q of [[-4, 2, 4, 2.2, 3], [2, -3, 3, 1.6, 3], [-6, -1, 2, 1, 2]]) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(q[2], q[3], q[4]), mat); b.position.set(q[0], (f + 1) * FH + 1 + q[3] / 2, q[1] - 5); b.castShadow = true; g.add(b)
      }
    }
    const src = pod ? podPts : f < FM ? towPts : topPts
    const keep = src.filter((_, i) => { if (f === 0 && i % 3) return false; if (f >= 2 && f < PF && i % 2) return false; return rnd() > 0.03 })
    const pm = postBase.clone(); postMats.push(pm)
    const im = new THREE.InstancedMesh(postG, pm, keep.length), m = new THREE.Matrix4(), h = FH - 0.45
    keep.forEach((p, i) => { m.compose(new THREE.Vector3(p[0], f * FH + 0.4 + h / 2, p[1]), new THREE.Quaternion(), new THREE.Vector3(1, h, 1)); im.setMatrixAt(i, m) })
    im.castShadow = true; g.add(im)
    const gm = new THREE.MeshPhysicalMaterial({ color: 0xb79ccb, metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.55, envMapIntensity: 1.6, clearcoat: 1 }); glassMats.push(gm)
    const gg = pod ? new THREE.ExtrudeGeometry(ps, { depth: FH - 0.45, bevelEnabled: false }) : new THREE.BoxGeometry(f < FM ? 21.8 : 14.8, FH - 0.45, f < FM ? 17.8 : 13.8)
    if (pod) gg.rotateX(-Math.PI / 2)
    const gl = new THREE.Mesh(gg, gm)
    if (pod) { gl.scale.set(0.985, 1, 0.985); gl.position.set(0.03, f * FH + 0.4, -0.015) } else gl.position.set(f < FM ? -5 : -1.5, f * FH + 0.4 + (FH - 0.45) / 2, -5)
    g.add(gl); groups.push(g); scene.add(g)
  }

  const meta: { f: number; k: number }[] = groups.map((_, f) => ({ f, k: 0 })) // k: 0 hero, 1 left, 2 right, 3 connectors

  // ---- extra towers + low connectors, so it reads as a campus rather than a single building ----
  const gCache = new Map<string, THREE.BufferGeometry>()
  const boxG = (w: number, h: number, d: number, ox = 0, oy = 0, oz = 0) => {
    const k = [w, h, d, ox, oy, oz].join()
    if (!gCache.has(k)) { const b = new THREE.BoxGeometry(w, h, d); b.translate(ox, oy, oz); gCache.set(k, b) }
    return gCache.get(k)!
  }
  type Stage = { from: number; to: number; w: number; d: number; dx?: number; dz?: number }
  const addTower = (k: number, cx: number, cz: number, stages: Stage[]) => {
    const N = stages[stages.length - 1].to
    for (let f = 0; f < N; f++) {
      const st = stages.find((s) => f >= s.from && f < s.to)!
      const x = cx + (st.dx ?? 0), z = cz + (st.dz ?? 0), w = st.w, d = st.d, g = new THREE.Group()
      const mat = new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.7, transparent: true }); slabMats.push(mat)
      const slab = new THREE.Mesh(boxG(w + 0.8, 0.4, d + 0.8, x, 0.2, z), mat)
      slab.position.y = f * FH; slab.castShadow = slab.receiveShadow = true; g.add(slab)
      if (f === N - 1) {
        const cap = new THREE.Mesh(boxG(w - 2, 0.9, d - 2, x, FH + 0.5, z), mat); cap.position.y = f * FH; cap.castShadow = true; g.add(cap)
        const eq = new THREE.Mesh(boxG(w / 3, 1.8, d / 3, x + w / 6, FH + 1.9, z - d / 6), mat); eq.position.y = f * FH; eq.castShadow = true; g.add(eq)
      }
      const keep = rect(x - w / 2, x + w / 2, z - d / 2, z + d / 2, 0.7).filter(() => rnd() > 0.03)
      const pm = postBase.clone(); postMats.push(pm)
      const im = new THREE.InstancedMesh(postG, pm, keep.length), m = new THREE.Matrix4(), h = FH - 0.45
      keep.forEach((p, i) => { m.compose(new THREE.Vector3(p[0], f * FH + 0.4 + h / 2, p[1]), new THREE.Quaternion(), new THREE.Vector3(1, h, 1)); im.setMatrixAt(i, m) })
      im.castShadow = true; g.add(im)
      const gm = new THREE.MeshPhysicalMaterial({ color: 0xb79ccb, metalness: 0.2, roughness: 0.05, transparent: true, opacity: 0.55, envMapIntensity: 1.6, clearcoat: 1 }); glassMats.push(gm)
      const gl = new THREE.Mesh(boxG(w - 0.2, FH - 0.45, d - 0.2, x, 0.4 + (FH - 0.45) / 2, z), gm); gl.position.y = f * FH; g.add(gl)
      groups.push(g); meta.push({ f, k }); scene.add(g)
    }
  }
  addTower(1, -52, -22, [{ from: 0, to: 24, w: 14, d: 14 }, { from: 24, to: 31, w: 10, d: 10 }]) // tall tower, left
  addTower(2, 38, -10, [{ from: 0, to: 19, w: 15, d: 15 }, { from: 19, to: 25, w: 10, d: 11, dx: 1 }]) // setback tower, right
  addTower(3, -31, -14, [{ from: 0, to: 4, w: 30, d: 10 }]) // low connector, left
  addTower(3, 26, -8, [{ from: 0, to: 3, w: 11, d: 10 }]) // low connector, right

  // grey context massing around the campus (fades out in the section view)
  const ctx = new THREE.Group()
  const cMat = new THREE.MeshStandardMaterial({ color: 0xe9eaee, roughness: 0.9, transparent: true })
  const eMat = new THREE.LineBasicMaterial({ color: 0xb4b6be, transparent: true })
  for (let gx = -112; gx < 100; gx += 15) for (let gz = -75; gz < 62; gz += 15) {
    const px = gx + 7.5, pz = gz + 7.5
    if (px > -68 && px < 53 && pz > -37 && pz < 22) continue // keep the campus clear
    if (rnd() < 0.22) continue
    const w = 8 + rnd() * 5, d = 8 + rnd() * 5, h = 5 + rnd() * rnd() * 45
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cMat)
    b.position.set(px + (rnd() - 0.5) * 2, h / 2, pz + (rnd() - 0.5) * 2); b.castShadow = b.receiveShadow = true; ctx.add(b)
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(b.geometry), eMat); e.position.copy(b.position); ctx.add(e)
  }
  scene.add(ctx)

  // common-area floor: several named spaces, then the AC unit
  const planMats: [THREE.Material, number][] = [], plan = new THREE.Group(), PY = SEL * FH + 0.6
  const xs = [-15, -8.5, -2, 5], zs = [-13, -6, 3]
  const SPACES = ['Lobby', 'Reception', 'Waiting', 'Corridor', 'Lounge', 'Pantry']
  const spaceLabel = (name: string) => {
    const c = document.createElement('canvas'); c.width = 512; c.height = 160
    const g = c.getContext('2d')!
    g.font = '600 72px "Segoe UI", sans-serif'
    const tw = Math.min(460, g.measureText(name).width + 72), x = (512 - tw) / 2
    g.fillStyle = 'rgba(255,255,255,0.94)'
    g.beginPath(); g.roundRect(x, 28, tw, 104, 28); g.fill()
    g.fillStyle = '#5d1f72'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(name, 256, 80)
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false })
    const sp = new THREE.Sprite(mat); sp.scale.set(4.2, 1.3, 1)
    return { sp, mat }
  }
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
    const x0 = xs[c], x1 = xs[c + 1], z0 = zs[r], z1 = zs[r + 1]
    const fm = new THREE.MeshBasicMaterial({ color: (r + c) % 2 ? 0xf6eef9 : 0xe6d4f2, transparent: true, opacity: 0, depthWrite: false })
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 - 0.35, z1 - z0 - 0.35), fm)
    fl.rotation.x = -Math.PI / 2; fl.position.set((x0 + x1) / 2, PY, (z0 + z1) / 2); plan.add(fl)
    const lm = new THREE.LineBasicMaterial({ color: PURPLE, transparent: true, opacity: 0 })
    plan.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map((q) => new THREE.Vector3(q[0], PY + 0.05, q[1]))), lm))
    const { sp, mat } = spaceLabel(SPACES[r * 3 + c])
    sp.position.set((x0 + x1) / 2, PY + 1.5, (z0 + z1) / 2); plan.add(sp)
    planMats.push([fm, 0.9], [lm, 1], [mat, 1])
  }
  const assetMats: [THREE.Material, number][] = []
  const assetFloors = new Set(ASSETS.map((a) => a.floor))
  const solid = () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, transparent: true, opacity: 0 })
  const dark = () => new THREE.MeshBasicMaterial({ color: 0x3a3f4b, transparent: true, opacity: 0 })
  const place = (group: THREE.Group, index: number) => {
    const a = ASSETS[index]
    group.position.set(a.x, a.floor * FH + a.y, a.z)
    groups[a.floor].add(group)
  }
  {
    const bodyM = solid(), grilM = dark()
    const ac = new THREE.Group()
    ac.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 3.2), bodyM))
    const gr = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 2.6), grilM); gr.position.set(0.83, -0.1, 0); ac.add(gr)
    place(ac, 0); assetMats.push([bodyM, 1], [grilM, 1])
  }
  {
    const cabM = solid(), doorM = dark()
    const lift = new THREE.Group()
    lift.add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.8, 2.2), cabM))
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.06), doorM); door.position.set(0, -0.1, 1.12); lift.add(door)
    place(lift, 1); assetMats.push([cabM, 1], [doorM, 1])
  }
  {
    const panelM = solid(), faceM = dark()
    const panel = new THREE.Group()
    panel.add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.2, 1.5), panelM))
    const face = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.6, 1.1), faceM); face.position.x = 0.22; panel.add(face)
    place(panel, 2); assetMats.push([panelM, 1], [faceM, 1])
  }
  groups[SEL].add(plan)

  const cW = new THREE.Color(0xf4f4f4), cC = new THREE.Color(PURPLE), cL = new THREE.Color(LILAC), pW = new THREE.Color(PURPLE)
  const rise = groups.map(() => ({ v: 0 })) // animated on load (stagger)
  const v3 = new THREE.Vector3()

  function update(p: number, scroll = p) {
    const wire = S(0.36, 0.5, p)
    const exp = S(0.44, 0.62, p) * (1 - S(0.985, 1, p))
    const sec = S(0.72, 0.78, p) * (1 - S(0.985, 1, p))
    const gone = S(0.6, 0.68, p) * (1 - S(0.985, 1, p)) // other towers + context fade out
    const showingAssets = p >= 0.84
    const dm = meta.map((q) => {
      if (q.k > 0) return 1 - gone
      if (showingAssets && assetFloors.has(q.f)) return 1
      return q.f === SEL ? 1 : q.f > SEL ? 1 - S(0, 0.3, sec) : q.f < SEL - 2 ? 1 - sec : 1 - 0.85 * sec
    })
    slabMats.forEach((m, i) => { m.wireframe = wire > 0.5; m.color.copy(cW).lerp(i % 2 ? cL : cC, wire); m.opacity = rise[i].v * dm[i] })
    postMats.forEach((m, i) => { m.opacity = rise[i].v * (1 - 0.5 * wire) * dm[i]; m.color.copy(pW).lerp(i % 2 ? cL : cC, wire) })
    glassMats.forEach((m, i) => { m.opacity = rise[i].v * 0.55 * (1 - wire); m.visible = wire < 0.98 })
    groups.forEach((g, i) => { g.position.y = (1 - rise[i].v) * -26 + meta[i].f * exp * SPLIT; g.visible = rise[i].v > 0.01 && dm[i] > 0.01 })
    const co = rise[0].v * (1 - gone); cMat.opacity = co; eMat.opacity = co; ctx.visible = co > 0.01
    planMats.forEach(([m, o]) => { m.opacity = o * sec })
    const assetK = S(0.84, 0.87, p) * (1 - S(0.985, 1, p))
    assetMats.forEach(([m, o]) => { m.opacity = o * assetK })

    // camera: campus orbit -> facade -> floor -> each critical asset -> back out
    const h = FH + SPLIT * exp, fy = SEL * h + 0.6
    const wy = (asset: (typeof ASSETS)[number]) => asset.floor * h + asset.y
    const span = (0.98 - 0.86) / ASSETS.length
    const shots = ASSETS.map((asset, i) => ({ t: 0.86 + (i + 0.5) * span, asset }))
    const last = shots[shots.length - 1]
    const a = 0.6 + S(0, 0.5, p) * 1.1 + p * 0.15
    const R = KF(p, [[0, 200], [0.44, 200], [0.62, 235], [0.64, 235], [0.7, 150], [0.73, 150], [0.82, 105], [0.85, 105], ...shots.map(({ t }) => [t, 34]), [0.985, 34], [1, 215]])
    const dy = KF(p, [[0, 56], [0.44, 56], [0.62, 49], [0.64, 49], [0.7, 30], [0.73, 30], [0.82, 58], [0.85, 58], ...shots.map(({ t }) => [t, 14]), [0.985, 14], [1, 56]])
    const ty = KF(p, [[0, 44], [0.44, 44], [0.62, 66], [0.64, 66], [0.7, 50], [0.73, 50], [0.82, fy], [0.85, fy], ...shots.map(({ t, asset }) => [t, wy(asset)]), [0.985, wy(last.asset)], [1, 44]])
    const lx = KF(p, [[0, -8], [0.6, -8], [0.7, -5], [0.85, -5], ...shots.map(({ t, asset }) => [t, asset.x]), [0.985, last.asset.x], [1, -8]])
    const lz = KF(p, [[0, -10], [0.6, -10], [0.7, -5], [0.85, -5], ...shots.map(({ t, asset }) => [t, asset.z]), [0.985, last.asset.z], [1, -10]])
    cam.position.set(lx + Math.sin(a) * R, ty + dy, lz + Math.cos(a) * R)
    cam.lookAt(lx, ty, lz)
    cam.updateMatrixWorld()
    rend.render(scene, cam)

    const W = host.clientWidth, H = host.clientHeight, hr = host.getBoundingClientRect()
    const proj = (x: number, y: number, z: number) => { v3.set(x, y, z).project(cam); return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H] }
    const setLine = (i: number, pts: string, k: number, ax: number, ay: number) => {
      ui.lines[i].setAttribute('points', pts); ui.lines[i].style.strokeDashoffset = String(1 - k)
      ui.dots[i].setAttribute('cx', String(ax)); ui.dots[i].setAttribute('cy', String(ay)); ui.dots[i].style.opacity = String(k)
    }

    // 1) module labels, each tied to its own stretch of scroll
    FAC.forEach(([f, z], i) => {
      const [ax, ay] = proj(6.5, f * h + 1, z)
      const t0 = 0.02 + i * 0.042
      const k = S(t0, t0 + 0.03, scroll) * (1 - S(0.34, 0.37, scroll))
      const s = i % 2 ? -1 : 1, ex = ax + s * 46, ey = ay - 14
      const el = ui.labels[i]
      el.style.opacity = String(k)
      el.style.transform = `translate(${ex + s * 4}px,${ey}px) translate(${s < 0 ? '-100%' : '0'},-50%)`
      setLine(i, `${ax},${ay} ${ax + s * 22},${ey} ${ex},${ey}`, k, ax, ay)
    })

    // 2) floor tag
    {
      const [ax, ay] = proj(-5, fy, -13)
      ui.floorTag.style.opacity = String(S(0.77, 0.8, p) * (1 - S(0.84, 0.86, p)))
      ui.floorTag.style.transform = `translate(${ax}px,${ay}px) translate(-50%,-130%)`
    }

    // 3) one detail card per critical asset, advancing with scroll
    ASSETS.forEach((asset, i) => {
      const a0 = 0.86 + i * span, b = a0 + span
      const k = S(a0, a0 + span * 0.28, scroll) * (1 - S(b - span * 0.16, b, scroll))
      const [ax, ay] = proj(asset.x, wy(asset), asset.z)
      const card = ui.cards[i]
      card.style.opacity = String(k)
      const cr = card.getBoundingClientRect()
      setLine(LABELS.length + i, `${cr.left - hr.left},${cr.top - hr.top + 22} ${ax},${ay}`, k, ax, ay)
    })
  }

  function resize() {
    const w = host.clientWidth, h = host.clientHeight
    const aspect = w / h
    // widen the vertical FOV on portrait/narrow stages so the building and labels still fit
    cam.fov = aspect >= 1.3 ? 38 : Math.min(70, 38 * Math.pow(1.3 / aspect, 0.8))
    rend.setSize(w, h)
    cam.aspect = aspect
    cam.updateProjectionMatrix()
  }
  resize()

  function dispose() {
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      m.geometry?.dispose()
      const mt = m.material
      if (mt) (Array.isArray(mt) ? mt : [mt]).forEach((x) => x.dispose())
    })
    rend.dispose(); rend.domElement.remove()
  }
  return { update, resize, dispose, rise }
}