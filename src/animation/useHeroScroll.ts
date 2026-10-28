import { useLayoutEffect } from 'react'
import type { RefObject } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function useHeroScroll(root: RefObject<HTMLElement | null>, figure: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    if (!window.matchMedia || !root.current || !figure.current) return
    const desktop = window.matchMedia('(min-width: 1200px)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let context: gsap.Context | undefined
    const update = () => {
      context?.revert(); context = undefined
      if (!desktop.matches || reduced.matches) return
      gsap.registerPlugin(ScrollTrigger)
      context = gsap.context(() => {
        gsap.to(figure.current, { scale: 0.65, y: -48, ease: 'none', scrollTrigger: {
          trigger: root.current!, start: 'top top', end: 'bottom top', scrub: 0.5, invalidateOnRefresh: true,
        } })
      }, root.current!)
    }
    update()
    desktop.addEventListener('change', update); reduced.addEventListener('change', update)
    return () => { desktop.removeEventListener('change', update); reduced.removeEventListener('change', update); context?.revert() }
  }, [root, figure])
}
