'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
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
    const tower = createTower(stage.current!)
    let cur = 0, raf = 0, idle: number | undefined, last = performance.now()
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let stickyTop = Number.parseFloat(getComputedStyle(pin.current!).top) || 0

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const r = section.current!.getBoundingClientRect()
      const pinEl = pin.current!
      const travel = Math.max(1, r.height - pinEl.offsetHeight - stickyTop)
      const target = Math.min(1, Math.max(0, -r.top / travel))

      if (reduce) cur = target
      else cur += (target - cur) * (1 - Math.exp(-dt / 0.22))
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
    const nav = document.querySelector('nav')
    if (nav) ro.observe(nav)
    const onResize = () => { stickyTop = Number.parseFloat(getComputedStyle(pin.current!).top) || 0; tower.resize() }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); clearTimeout(idle); ro.disconnect(); window.removeEventListener('resize', onResize); tower.dispose() }
  }, [reset])

  return (
    // tall track; the inner stage stays pinned while you scroll through it
    <section ref={section} className='relative h-[560vh] w-full bg-white text-neutral-900 lg:h-[640vh]'>
      <div ref={pin} className='sticky top-0 flex h-svh w-full flex-col overflow-hidden bg-white lg:flex-row [@media(max-height:520px)_and_(min-width:720px)_and_(max-width:1023px)]:flex-row'>
        <div className='z-20 flex min-h-0 shrink-0 flex-col justify-end px-6 pb-6 pt-24 lg:w-[42%] lg:justify-center lg:px-10 lg:pb-0 xl:px-16 [@media(max-height:520px)_and_(min-width:720px)_and_(max-width:1023px)]:w-[46%] [@media(max-height:520px)_and_(min-width:720px)_and_(max-width:1023px)]:justify-center [@media(max-height:520px)_and_(min-width:720px)_and_(max-width:1023px)]:pb-0'>
          <div className='max-w-xl'>
            <h1 className='text-neutral-900'>
              <span className='block whitespace-nowrap text-[clamp(1rem,3.2vw,2.75rem)] font-semibold leading-tight tracking-tight'>
                India's first operational
              </span>
              <span className='block text-[clamp(2rem,3.2vw,3.5rem)] font-semibold uppercase leading-none'>
                Digital Twin
              </span>
            </h1>
            <p className='text-neutral-900 mt-4 text-lg'>
            A real-time view of everything that keeps you moving
            </p>
            <div className='mt-6 flex flex-wrap gap-3 lg:mt-24'>
              <Link
                href='/contact'
                className='inline-flex items-center justify-center bg-[#5D1F73] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4a185c]'
              >
                Contact Us
              </Link>
              <Link
                href='/blogs'
                className='inline-flex items-center justify-center  border border-[#5D1F73] px-6 py-2.5 text-sm font-semibold text-[#5D1F73] transition hover:bg-purple-50'
              >
                Blogs
              </Link>
            </div>
          </div>
        </div>

        <div className='relative min-h-0 w-full flex-1'>
          <div ref={stage} className='absolute inset-0' />
          <div className='pointer-events-none absolute right-3 top-1/2 z-10 h-[120px] w-[3px] -translate-y-1/2 rounded bg-neutral-300 lg:right-8'>
            <div ref={bar} className='w-full rounded bg-purple-900' style={{ height: 0 }} />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero