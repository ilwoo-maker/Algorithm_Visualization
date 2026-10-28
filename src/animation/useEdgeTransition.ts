import { useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { Snapshot } from '../algorithms/types'
import { createEdgeTransition } from './edgeTransition'
import type { CompletionScene } from './edgeTransition'
import { createGraphEntrance } from './graphEntrance'

/** A separate owner for each GraphView; there are no global selectors or clocks. */
export function useEdgeTransition(
  svg: RefObject<SVGSVGElement | null>,
  snapshot: Snapshot,
  animateForward: boolean,
  revision = 0,
  finalScene?: CompletionScene,
) {
  const previous = useRef({ snapshot, revision })
  const entered = useRef(false)
  const [phase, setPhase] = useState<'idle' | 'entrance' | 'edge'>('idle')

  useLayoutEffect(() => {
    const from = previous.current.snapshot
    const navigated = revision !== previous.current.revision || snapshot !== from
    previous.current = { snapshot, revision }
    const interruptedEntrance = !entered.current && navigated
    if (navigated) entered.current = true
    const media = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
    const current = snapshot.edges.find((edge) => edge.id === snapshot.edgeId)
    const oldEdge = from.edges.find((edge) => edge.id === snapshot.edgeId)
    const base = svg.current?.querySelector<SVGLineElement>('g[aria-current="true"] .graph-edge')
    const effect = svg.current?.querySelector<SVGLineElement>('g[aria-current="true"] .edge-effect')
    const entrance = !entered.current && !navigated && revision === 0

    if (media?.matches || !svg.current || (!entrance && (interruptedEntrance || !animateForward
      || snapshot.algorithm !== from.algorithm || snapshot.index !== from.index + 1
      || !current || !oldEdge || !base || !effect))) {
      entered.current = true
      setPhase('idle')
      return
    }

    let active = true
    setPhase(entrance ? 'entrance' : 'edge')
    const finish = () => { entered.current = true; if (active) setPhase('idle') }
    const animation = entrance ? createGraphEntrance(svg.current, finish)
      : createEdgeTransition(base!, effect!, oldEdge!, current!, finish, finalScene)
    const onPreferenceChange = () => {
      if (media?.matches) {
        animation.cancel()
        entered.current = true
        if (active) setPhase('idle')
      }
    }
    media?.addEventListener('change', onPreferenceChange)
    return () => {
      active = false
      media?.removeEventListener('change', onPreferenceChange)
      animation.cancel()
    }
  }, [svg, snapshot, animateForward, revision, finalScene])

  return phase
}
