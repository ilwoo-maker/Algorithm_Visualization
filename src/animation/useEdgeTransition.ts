import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { flushSync } from 'react-dom'
import type { MstRun } from '../algorithms/types'
import { createEdgeTransition } from './edgeTransition'
import { createGraphEntrance } from './graphEntrance'
import { scopedTimeline } from './scopedTimeline'
import { PLAYBACK_TIMING } from './playbackTiming'
import type { PlaybackSpeed, PlaybackStatus, TransitionPhase } from './playbackTiming'

type Scene = ReturnType<typeof scopedTimeline>
interface Presentation {
  index: number
  targetIndex: number | null
  revision: number
  phase: TransitionPhase
  status: PlaybackStatus
  speed: PlaybackSpeed
}

/** One presentation/clock owner per panel. Algorithm records are only read. */
export function useAlgorithmPlayback(run: MstRun, svg: RefObject<SVGSVGElement | null>, weightRef: RefObject<HTMLOutputElement | null>, noticeRef?: RefObject<HTMLParagraphElement | null>) {
  const [view, setView] = useState<Presentation>({ index: 0, targetIndex: null, revision: 0, phase: 'idle', status: 'idle', speed: 1 })
  const state = useRef(view)
  const owner = useRef<Scene | null>(null)
  const generation = useRef(0)
  const entered = useRef(false)
  const pendingReducedCommit = useRef<number | null>(null)
  const last = run.snapshots.length - 1
  const publish = useCallback((update: Partial<Presentation>) => {
    state.current = { ...state.current, ...update }
    setView(state.current)
  }, [])
  const cancel = useCallback(() => {
    generation.current++
    owner.current?.cancel()
    owner.current = null
    pendingReducedCommit.current = null
  }, [])
  const jump = useCallback((index: number) => {
    cancel(); entered.current = true
    const bounded = Math.max(0, Math.min(last, index))
    publish({ index: bounded, targetIndex: null, phase: 'idle', status: bounded === last ? 'finished' : 'idle', revision: state.current.revision + 1 })
  }, [cancel, last, publish])
  const next = () => {
    const from = state.current.targetIndex ?? state.current.index
    if (!entered.current) { jump(Math.min(last, from + 1)); return }
    cancel()
    if (from >= last) { jump(last); return }
    publish({ index: from, targetIndex: from + 1, phase: 'focus', status: 'idle', revision: state.current.revision + 1 })
  }
  const request = (from: number) => {
    cancel(); entered.current = true
    publish({ index: from, targetIndex: from + 1, phase: 'focus', status: 'playing', revision: state.current.revision + 1 })
  }
  const pause = useCallback(() => {
    if (state.current.status !== 'playing') return
    owner.current?.timeline.pause()
    publish({ status: 'paused' })
  }, [publish])
  const play = () => {
    if (state.current.status === 'playing') return
    if (document.hidden) { publish({ status: 'paused' }); return }
    if (state.current.index === last && state.current.status !== 'paused') { request(0); return }
    if (owner.current && state.current.phase !== 'entrance') {
      const timeline = owner.current.timeline
      const token = generation.current
      if (state.current.status !== 'paused') {
        timeline.addLabel('reading', timeline.duration())
          .call(() => { if (token === generation.current) publish({ phase: 'reading' }) }, [], 'reading')
          .to(svg.current!, { duration: PLAYBACK_TIMING.reading })
      }
      if (pendingReducedCommit.current !== null) {
        publish({ index: pendingReducedCommit.current, phase: 'reading' })
        pendingReducedCommit.current = null
      }
      publish({ status: 'playing' })
      timeline.resume()
      return
    }
    request(state.current.index === last ? 0 : state.current.index)
  }
  const setSpeed = (speed: PlaybackSpeed) => {
    publish({ speed })
    owner.current?.timeline.timeScale(speed)
  }

  useLayoutEffect(() => {
    const root = svg.current
    if (!root) return
    const token = ++generation.current
    const valid = () => token === generation.current
    const phase = (value: TransitionPhase) => { if (valid()) {
      if (value === 'announcement') flushSync(() => publish({ phase: value }))
      else publish({ phase: value })
    } }
    const target = state.current.targetIndex
    const finish = () => {
      if (!valid()) return
      owner.current = null
      if (target !== null && state.current.status === 'playing' && target < last) {
        publish({ index: target, targetIndex: target + 1, phase: 'focus', revision: state.current.revision + 1 })
      } else publish({ index: target ?? state.current.index, targetIndex: null, phase: 'idle', status: target === last ? 'finished' : 'idle' })
    }
    const reduced = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (target === null) {
      if (!entered.current && state.current.revision === 0 && !reduced) {
        phase('entrance')
        owner.current = createGraphEntrance(root, () => { if (valid()) { entered.current = true; owner.current = null; phase('idle') } })
      } else entered.current = true
    } else {
      entered.current = true
      const snapshot = run.snapshots[target]
      const to = snapshot.edges.find(edge => edge.id === snapshot.edgeId)!
      const from = run.snapshots[state.current.index].edges.find(edge => edge.id === snapshot.edgeId)!
      const group = [...root.querySelectorAll<SVGGElement>('g[data-edge-id]')].find(el => el.getAttribute('data-edge-id') === to.id)!
      if (reduced) {
        if (state.current.status === 'playing' || state.current.status === 'paused') {
          const paused = state.current.status === 'paused'
          if (paused) pendingReducedCommit.current = target
          else publish({ index: target, phase: 'reading' })
          owner.current = scopedTimeline(root, timeline => {
            timeline.addLabel('reading', 0).to(root, { duration: PLAYBACK_TIMING.reading })
          }, finish, paused)
        } else publish({ index: target, targetIndex: null, phase: 'idle', status: target === last ? 'finished' : 'idle' })
      } else owner.current = createEdgeTransition(group.querySelector('.graph-edge')!, group.querySelector('.edge-effect')!, from, to,
        finish,
        target === last ? { run, weightRef, noticeRef } : undefined,
        { onPhase: phase, onCommit: () => { if (valid()) {
          flushSync(() => publish({ index: target }))
          owner.current?.restorePresentation()
        } },
          onVisualComplete: () => { if (valid()) owner.current?.restorePresentation() },
          readingSeconds: state.current.status === 'playing' ? PLAYBACK_TIMING.reading : 0 })
      owner.current?.timeline.timeScale(state.current.speed)
      if (state.current.status === 'paused' || (document.hidden && state.current.status === 'playing')) {
        owner.current?.timeline.pause()
        publish({ status: 'paused' })
      }
    }
    return cancel
    // A revision is a new user/sequence request. Commit/phase updates keep the same owner.
  }, [view.revision, run, svg, weightRef, noticeRef, last, cancel, publish])

  useLayoutEffect(() => {
    const media = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
    const change = () => {
      if (!media?.matches) return
      if (state.current.status === 'playing' || state.current.status === 'paused') {
        const target = state.current.targetIndex ?? state.current.index
        cancel(); entered.current = true
        publish({ targetIndex: target, phase: state.current.status === 'paused' ? 'idle' : 'reading', revision: state.current.revision + 1 })
      } else jump(state.current.targetIndex ?? state.current.index)
    }
    const visibility = () => { if (document.hidden) pause() }
    media?.addEventListener('change', change)
    document.addEventListener('visibilitychange', visibility)
    return () => { media?.removeEventListener('change', change); document.removeEventListener('visibilitychange', visibility) }
  }, [cancel, jump, pause, publish])

  return { ...view, snapshot: run.snapshots[view.index], target: view.targetIndex === null ? undefined : run.snapshots[view.targetIndex], next,
    previous: () => jump((state.current.targetIndex ?? state.current.index) - 1), jump, play, pause, restart: () => jump(0), setSpeed }
}
