'use client'

import React, { useEffect, useRef } from 'react'
import { animate, stagger } from 'animejs'
import { createTower, LABELS, FLOOR_TAG, ASSETS } from './Tower'

// Left-hand copy: each step fades in and out with scroll progress (0 → 1).
const STEPS = [
  { from: -0.1, to: 0.34, tag: '01 · Building', title: 'India’s first operational digital-twin', body: 'Visitors, help desk, attendance, AMC, checklists, space mapping and asset health, all connected to one living model of your building.' },
  { from: 0.36, to: 0.46, tag: '02 · Wireframe', title: 'Strip it back to its structure.', body: 'Every wall becomes a precise wireframe, the foundation of your digital twin.' },
  { from: 0.48, to: 0.73, tag: '03 · Sections', title: 'Divide it into sections.', body: 'Floor by floor, each level becomes its own layer you can open, inspect and manage.' },
  { from: 0.74, to: 0.85, tag: '05 · Floor', title: 'Open any floor.', body: 'Common area management shows every zone on the floor, with live status for each one.' },
  { from: 0.86, to: 0.98, tag: '06 · Asset', title: 'Every critical asset.', body: 'The split AC, lift and main panel — live health for the assets that keep the building running.' },
  { from: 0.99, to: 1.2, tag: '07 · Complete', title: 'One building. Complete operational visibility.', body: 'From the first asset to the last audit, every action is tracked.' },
]
// CTA buttons shown under the copy
const CTAS = [
  { label: 'Book a demo', href: '#demo' },
  { label: 'Explore modules', href: '#modules' },
]
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

const Hero = () => {
  const section = useRef<HTMLElement>(null)
  const pin = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const steps = useRef<HTMLDivElement[]>([])
  const labels = useRef<HTMLDivElement[]>([])
  const lines = useRef<SVGPolylineElement[]>([])
  const dots = useRef<SVGCircleElement[]>([])
  const floorTag = useRef<HTMLDivElement>(null)
  const cards = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    const tower = createTower(stage.current!, {
      labels: labels.current, lines: lines.current, dots: dots.current,
      floorTag: floorTag.current!, cards: cards.current,
    })
    // floors stack up one after another on load
    animate(tower.rise, { v: 1, duration: 1700, delay: stagger(30), ease: 'outExpo' })

    let cur = 0, raf = 0
    const loop = () => {
      const r = section.current!.getBoundingClientRect()
      const pinEl = pin.current!
      const stickyTop = Number.parseFloat(getComputedStyle(pinEl).top) || 0
      const travel = Math.max(1, r.height - pinEl.offsetHeight - stickyTop)
      const raw = Math.min(1, Math.max(0, -r.top / travel))
      // First half of the pin plays the building story. The next stretch is the assets, one floor per scroll.
      const pre = 0.46, assetEnd = 0.92
      const target = raw <= pre ? (raw / pre) * 0.86
        : raw <= assetEnd ? 0.86 + ((raw - pre) / (assetEnd - pre)) * 0.12
        : 0.98 + ((raw - assetEnd) / (1 - assetEnd)) * 0.02
      cur += (target - cur) * 0.18
      if (Math.abs(target - cur) < 0.001) cur = target
      tower.update(cur, target)
      STEPS.forEach((s, i) => {
        const k = Math.min(smooth(s.from, s.from + 0.03, cur), 1 - smooth(s.to - 0.03, s.to, cur))
        const el = steps.current[i]
        if (el) el.style.opacity = String(k)
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const ro = new ResizeObserver(() => tower.resize())
    ro.observe(stage.current!)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); tower.dispose() }
  }, [])

  return (
    // shorter scroll track; the inner stage stays pinned while you scroll
    <section ref={section} className='relative h-[460vh] w-full bg-[#f3f4f7] text-neutral-900 lg:h-[560vh]'>
      <div ref={pin} className='sticky top-[96px] h-[calc(100svh-120px)] w-full overflow-hidden lg:top-[150px] lg:h-[calc(100svh-180px)]'>
        {/* text: top 40% on mobile, left column on desktop */}
        <div className='pointer-events-none absolute inset-x-0 top-0 z-10 flex h-[40%] flex-col justify-start gap-3 px-5 pt-3 sm:px-8 lg:inset-y-0 lg:left-0 lg:right-auto lg:h-full lg:w-[38%] lg:justify-center lg:gap-8 lg:px-14 lg:pt-0'>
          <div className='grid'>
            {STEPS.map((s, i) => (
              <div key={s.tag} ref={(el) => { if (el) steps.current[i] = el }} className='col-start-1 row-start-1 opacity-0'>
                <h2 className='text-[clamp(22px,3.6vw,56px)] font-bold leading-[1.05]'>{s.title}</h2>
                <p className='mt-2 max-w-md text-sm text-neutral-600 sm:text-base lg:mt-4 lg:text-lg'>{s.body}</p>
              </div>
            ))}
          </div>

          {/* CTAs: always visible, clickable even though the column ignores pointer events */}
          <div className='pointer-events-auto flex flex-wrap gap-2 lg:gap-3'>
            {CTAS.map((c) => (
              <a
                key={c.label}
                href={c.href}
                className='rounded-md bg-purple-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-purple-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-900 sm:px-4 sm:py-2 sm:text-sm lg:px-6 lg:py-3'
              >
                {c.label}
              </a>
            ))}
          </div>
        </div>

        {/* building: bottom 60% on mobile, right column on desktop */}
        <div className='absolute overflow-hidden inset-x-0 bottom-0 h-[60%] lg:inset-y-0 lg:left-auto lg:right-0 lg:h-full lg:w-[62%]'>
          <div ref={stage} className='absolute inset-0' />

          <svg className='pointer-events-none absolute inset-0 h-full w-full'>
            {Array.from({ length: LABELS.length + ASSETS.length }).map((_, i) => ( // labels, then one leader line per asset card
              <g key={i}>
                <polyline
                  ref={(el) => { if (el) lines.current[i] = el }}
                  fill='none' stroke='#6b2c8a' strokeWidth={1} pathLength={1}
                  style={{ strokeDasharray: 1, strokeDashoffset: 1 }}
                />
                <circle ref={(el) => { if (el) dots.current[i] = el }} r={3} fill='#5d1f72' style={{ opacity: 0 }} />
              </g>
            ))}
          </svg>

          {LABELS.map((name, i) => (
            <div
              key={name}
              ref={(el) => { if (el) labels.current[i] = el }}
              className='pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded bg-white/90 px-1.5 py-0.5 font-mono text-[9px] text-neutral-800 opacity-0 shadow-sm sm:text-xs lg:text-[14px]'
            >
              {name}
            </div>
          ))}

          <div
            ref={floorTag}
            className='pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded-full bg-purple-900 px-3 py-1 text-[10px] font-medium text-white opacity-0 sm:text-xs lg:text-sm'
          >
            {FLOOR_TAG}
          </div>

          <div className='pointer-events-none absolute right-3 top-[14%] grid w-[170px] sm:w-56 lg:right-8 lg:w-64'>
            {ASSETS.map((asset, i) => (
              <div
                key={asset.title}
                ref={(el) => { if (el) cards.current[i] = el }}
                className='col-start-1 row-start-1 rounded-lg bg-white/95 p-3 opacity-0 shadow-lg'
              >
                <div className='mb-2 text-[11px] font-semibold text-purple-900 sm:text-sm'>{asset.title}</div>
                {asset.rows.map(([k, v]) => (
                  <div key={k} className='flex justify-between gap-2 py-0.5 text-[10px] sm:text-xs'>
                    <span className='text-neutral-500'>{k}</span>
                    <span className='font-medium text-neutral-900'>{v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero