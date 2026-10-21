'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import { createTower } from './Tower'

// Seconds of idle at the very end before the page scrolls back to the start (0 = never auto-reset).
const AUTO_RESET_MS = 7000

const Hero = () => {
  const section = useRef<HTMLElement>(null)
  const pin = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const resetBtn = useRef<HTMLButtonElement>(null)

  // scroll the page back to the top of this section; the animation rewinds with it
  const reset = useCallback(() => {
    const top = section.current!.getBoundingClientRect().top + window.scrollY
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' })
  }, [])

  useEffect(() => {
    // keep the scene clear of the fixed site header (matches your header height)
    const tower = createTower(stage.current!, () => (window.innerWidth >= 1024 ? 130 : 100))
    let cur = 0, raf = 0, idle: number | undefined

    const loop = () => {
      const r = section.current!.getBoundingClientRect()
      const pinEl = pin.current!
      const stickyTop = Number.parseFloat(getComputedStyle(pinEl).top) || 0
      const travel = Math.max(1, r.height - pinEl.offsetHeight - stickyTop)
      const target = Math.min(1, Math.max(0, -r.top / travel))

      cur += (target - cur) * 0.12
      if (Math.abs(target - cur) < 0.0004) cur = target
      tower.update(cur)

      if (bar.current) bar.current.style.height = `${cur * 100}%`
      const end = cur > 0.985
      if (resetBtn.current) {
        resetBtn.current.style.opacity = end ? '1' : '0'
        resetBtn.current.style.pointerEvents = end ? 'auto' : 'none'
      }
      if (AUTO_RESET_MS > 0) {
        if (end && idle === undefined) idle = window.setTimeout(reset, AUTO_RESET_MS)
        if (!end && idle !== undefined) { clearTimeout(idle); idle = undefined }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const ro = new ResizeObserver(() => tower.resize())
    ro.observe(stage.current!)
    return () => { cancelAnimationFrame(raf); clearTimeout(idle); ro.disconnect(); tower.dispose() }
  }, [reset])

  return (
    // tall track; the inner stage stays pinned while you scroll through it
    <section ref={section} className='relative h-[560vh] w-full bg-white text-neutral-900 lg:h-[640vh]'>
      <div ref={pin} className='sticky top-0 h-svh w-full overflow-hidden bg-white'>
        {/* scene: full height, pinned to the right side */}
        <div ref={stage} className='absolute inset-y-0 right-0 w-full lg:w-[62%]' />

        {/* progress */}
        <div className='pointer-events-none absolute right-3 top-1/2 z-10 h-[120px] w-[3px] -translate-y-1/2 rounded bg-neutral-300 lg:right-8'>
          <div ref={bar} className='w-full rounded bg-purple-900' style={{ height: 0 }} />
        </div>
      </div>
    </section>
  )
}

export default Hero