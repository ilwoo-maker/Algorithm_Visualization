import { useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { Snapshot } from '../algorithms/types'
import { createEdgeTransition } from './edgeTransition'

/** A separate owner for each GraphView; there are no global selectors or clocks. */
export function useEdgeTransition(
  svg: RefObject<SVGSVGElement | null>,
  snapshot: Snapshot,
  animateForward: boolean,
) {
  const previous = useRef(snapshot)
  const [transitioning, setTransitioning] = useState(false)

  useLayoutEffect(() => {
    const from = previous.current
    previous.current = snapshot
    const media = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
    const current = snapshot.edges.find((edge) => edge.id === snapshot.edgeId)
    const oldEdge = from.edges.find((edge) => edge.id === snapshot.edgeId)
    const base = svg.current?.querySelector<SVGLineElement>('g[aria-current="true"] .graph-edge')
    const effect = svg.current?.querySelector<SVGLineElement>('g[aria-current="true"] .edge-effect')

    if (!animateForward || snapshot.algorithm !== from.algorithm || snapshot.index !== from.index + 1
      || media?.matches || !current || !oldEdge || !base || !effect) {
      setTransitioning(false)
      return
    }

    let active = true
    setTransitioning(true)
    const animation = createEdgeTransition(base, effect, oldEdge, current, () => {
      if (active) setTransitioning(false)
    })
    const onPreferenceChange = () => {
      if (media?.matches) {
        animation.cancel()
        if (active) setTransitioning(false)
      }
    }
    media?.addEventListener('change', onPreferenceChange)
    return () => {
      active = false
      media?.removeEventListener('change', onPreferenceChange)
      animation.cancel()
    }
  }, [svg, snapshot, animateForward])

  return transitioning
}
