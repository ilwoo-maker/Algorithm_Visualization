// @vitest-environment jsdom
import { StrictMode, useRef } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { gsap } from 'gsap'
import App from '../App'
import { useAlgorithmPlayback } from './useEdgeTransition'
import { GraphView } from '../components/GraphView'
import { kruskal } from '../algorithms/kruskal'
import { ASSIGNMENT_GRAPH } from '../algorithms/fixtures'

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks() })
function preference(initial = false) {
  const events = new EventTarget()
  const media = { matches: initial, addEventListener: events.addEventListener.bind(events), removeEventListener: events.removeEventListener.bind(events) }
  vi.stubGlobal('matchMedia', () => media)
  return (value: boolean) => { media.matches = value; act(() => { events.dispatchEvent(new Event('change')) }) }
}
function panel(name = 'Kruskal') { return within(screen.getByRole('region', { name })) }
function scene(scope = panel()) {
  const tweens = [...scope.getByRole('img').querySelectorAll('.edge-effect')].flatMap(el => gsap.getTweensOf(el))
  expect(tweens.length).toBeGreaterThan(0)
  return tweens[0].parent as gsap.core.Timeline
}
function finishEntrance() {
  for (const svg of screen.getAllByRole('img')) {
    const tween = gsap.getTweensOf(svg.querySelector('.vertex')!)[0]
    if (tween) act(() => { (tween.parent as gsap.core.Timeline).progress(1) })
  }
}
function next(scope = panel()) { fireEvent.click(scope.getByRole('button', { name: '다음' })) }
function jump(index: number, scope = panel()) { fireEvent.change(scope.getByRole('combobox', { name: '단계 선택' }), { target: { value: String(index) } }) }
function weight(scope = panel()) { return scope.getByLabelText('현재 활성 간선 가중치 합').textContent }
function click(name: string, scope = panel()) { fireEvent.click(scope.getByRole('button', { name })) }
function index(scope = panel()) { return scope.getByRole<HTMLSelectElement>('combobox', { name: '단계 선택' }).value }
function reducedScene(scope = panel()) { return gsap.getTweensOf(scope.getByRole('img'))[0].parent as gsap.core.Timeline }

it('keeps the confirmed graph, explanation and weight through Focus Decision Settle, then commits together', () => {
  preference(); render(<App />); finishEntrance()
  const scope = panel()
  const before = scope.getByText(/무엇을 했나요/).parentElement!.textContent
  next(scope)
  expect(weight(scope)).toBe('0')
  expect(scope.getByRole('row', { name: /^BC 1 미검사/ })).toBeDefined()
  const motion = scene(scope)
  expect(motion.labels.focus).toBeLessThan(motion.labels.decision)
  expect(motion.labels.decision).toBeLessThan(motion.labels.settle)
  for (const label of ['focus', 'decision', 'settle']) {
    act(() => { motion.pause().time(motion.labels[label] + 0.01) })
    expect(weight(scope)).toBe('0')
    expect(scope.getByText(/무엇을 했나요/).parentElement!.textContent).toBe(before)
    expect(scope.getByRole('group', { name: '간선 BC, 가중치 1, 미검사' })).toBeDefined()
    expect(scope.getByText(new RegExp(label === 'focus' ? '^검사 중' : label === 'decision' ? '^판정 연출 중' : '^확정 준비 중'))).toBeDefined()
  }
  act(() => { motion.progress(1) })
  expect(weight(scope)).toBe('1')
  expect(scope.getByRole('row', { name: /^BC 1 선택/ })).toBeDefined()
  expect([...scope.getByRole('img').querySelectorAll('[style]:not([style=""])')].map(el => el.outerHTML)).toEqual([])
})

it.each([['Kruskal', 3, 'AC', '사이클 기각'], ['Reverse-Delete', 0, 'DE', '임시 제거'], ['Reverse-Delete', 1, 'DE', '삭제 확정'], ['Reverse-Delete', 5, 'BE', '복구·유지']] as const)
  ('commits %s step %i only after its decision, including %s %s', (name, from, edge, status) => {
    preference(); render(<App />); finishEntrance()
    const scope = panel(name); jump(from, scope)
    const old = weight(scope); next(scope)
    expect(weight(scope)).toBe(old)
    const motion = scene(scope)
    act(() => { motion.pause().time(motion.labels.settle + 0.01) })
    expect(scope.queryByRole('row', { name: new RegExp(`^${edge} \\d ${status}`) })).toBeNull()
    act(() => { motion.progress(1) })
    expect(scope.getByRole('row', { name: new RegExp(`^${edge} \\d ${status}`) })).toBeDefined()
  })

it('plays every Kruskal snapshot in order, waits for completion and stops at the end', () => {
  preference(); render(<App />); finishEntrance(); click('재생')
  for (let step = 1; step <= 5; step++) {
    const motion = scene()
    expect(index()).toBe(String(step - 1))
    act(() => { motion.pause().time(motion.labels.reading + 0.01) })
    expect(index()).toBe(String(step))
    expect(scene()).toBe(motion)
    act(() => { motion.progress(1) })
  }
  expect(weight()).toBe('8'); expect(panel().getByText(/^재생 완료/)).toBeDefined()
  expect(panel().getByRole('row', { name: /^CD 5 미검사/ })).toBeDefined()
  expect(panel().getByRole('row', { name: /^DE 7 미검사/ })).toBeDefined()
  expect(panel().getByRole('img').querySelectorAll('[style]:not([style=""])')).toHaveLength(0)
})

it('pauses and resumes the same edge timeline at the same position without duplicate Play loops', () => {
  preference(); render(<App />); finishEntrance()
  const play = panel().getByRole('button', { name: '재생' })
  fireEvent.click(play)
  const motion = scene()
  act(() => { motion.time(0.18) })
  click('일시정지')
  const position = motion.time()
  expect(motion.paused()).toBe(true); expect(index()).toBe('0')
  click('계속 재생')
  expect(scene()).toBe(motion); expect(motion.time()).toBe(position); expect(motion.paused()).toBe(false)
  act(() => { motion.progress(1) })
  expect(index()).toBe('1'); expect(scene()).not.toBe(motion)
})

it.each([0.5, 1, 2])('applies %sx to the existing timeline including its reading interval', speed => {
  preference(); render(<App />); finishEntrance(); click('재생')
  const motion = scene(); click('일시정지')
  click(`${speed}배속`)
  expect(scene()).toBe(motion); expect(motion.timeScale()).toBe(speed); expect(motion.paused()).toBe(true)
  expect(motion.duration() - motion.labels.reading).toBeCloseTo(0.7)
  click('계속 재생'); act(() => { motion.time(motion.labels.reading + 0.2) }); click('일시정지')
  expect(index()).toBe('1'); expect(motion.paused()).toBe(true)
  const position = motion.time(); click('계속 재생')
  expect(scene()).toBe(motion); expect(motion.time()).toBe(position)
})

it('Restart while paused clears the scene and waits at zero; Play at the end starts at zero', () => {
  preference(); render(<App />); finishEntrance(); click('재생'); const old = scene()
  click('일시정지'); click('다시 시작')
  expect(old.parent).toBeNull(); expect(index()).toBe('0'); expect(weight()).toBe('0')
  expect(panel().getByRole('button', { name: '재생' })).toBeDefined()
  jump(5); click('재생')
  expect(index()).toBe('0'); expect(scene()).not.toBe(old)
  act(() => { scene().progress(1) }); expect(index()).toBe('1')
})

it.each(['이전', '처음으로', '직접 선택', '선택창 열기'])('cancels playback and stale completion on %s', action => {
  preference(); render(<App />); finishEntrance(); jump(2); click('재생')
  const old = scene(); const stale = old.eventCallback('onComplete')!
  if (action === '직접 선택') jump(4)
  else if (action === '선택창 열기') fireEvent.pointerDown(panel().getByRole('combobox'))
  else click(action)
  const expected = action === '직접 선택' ? '4' : action === '처음으로' ? '0' : '2'
  expect(old.parent).toBeNull(); expect(index()).toBe(expected)
  act(() => { stale() })
  expect(index()).toBe(expected); expect(panel().getByRole('button', { name: '재생' })).toBeDefined()
})

it('counts rapid Next clicks as one target step each, cancelling old effects and clamping at the final step', () => {
  preference(); render(<App />); finishEntrance(); click('재생'); const old = scene()
  next(); expect(index()).toBe('1'); const second = scene()
  expect(old.parent).toBeNull()
  next(); expect(index()).toBe('2'); expect(second.parent).toBeNull()
  next(); next(); next()
  expect(panel().getByRole<HTMLButtonElement>('button', { name: '다음' }).disabled).toBe(true)
  act(() => { scene().progress(1) })
  expect(index()).toBe('5'); expect(weight()).toBe('8')
  expect(panel().getByRole('button', { name: '재생' })).toBeDefined()
})

it('keeps the two playback owners independent through Pause and Restart', () => {
  preference(); render(<App />); finishEntrance()
  const right = panel('Reverse-Delete'); click('재생'); click('재생', right)
  const leftScene = scene(), rightScene = scene(right)
  click('일시정지'); expect(leftScene.paused()).toBe(true); expect(rightScene.paused()).toBe(false)
  click('다시 시작'); expect(leftScene.parent).toBeNull(); expect(scene(right)).toBe(rightScene)
  act(() => { rightScene.progress(1) }); expect(index(right)).toBe('1'); expect(index()).toBe('0')
})

it('pauses on a hidden tab and requires explicit Resume after becoming visible', () => {
  preference(); render(<App />); finishEntrance(); click('재생'); const motion = scene()
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
  act(() => { document.dispatchEvent(new Event('visibilitychange')) })
  expect(motion.paused()).toBe(true); expect(index()).toBe('0')
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  act(() => { document.dispatchEvent(new Event('visibilitychange')) })
  expect(motion.paused()).toBe(true)
  click('계속 재생'); expect(motion.paused()).toBe(false)
  vi.restoreAllMocks()
})

it('Reduced Motion visits every snapshot with a pausable reading interval and no decorative scene', () => {
  preference(true); render(<App />); click('재생')
  for (let step = 1; step <= 5; step++) {
    expect(index()).toBe(String(step))
    const motion = reducedScene()
    expect(gsap.getTweensOf(panel().getByRole('img').querySelector('.edge-effect')!)).toHaveLength(0)
    click('일시정지'); expect(motion.paused()).toBe(true)
    click('계속 재생'); act(() => { motion.progress(1) })
  }
  expect(weight()).toBe('8'); expect(panel().getByText(/^재생 완료/)).toBeDefined()
})

it('a runtime Reduced Motion change settles the target but retains Pause and sequential playback', () => {
  const change = preference(); render(<App />); finishEntrance(); click('재생')
  const old = scene(); click('일시정지'); change(true)
  expect(old.parent).toBeNull(); expect(index()).toBe('0')
  const wait = reducedScene(); expect(wait.paused()).toBe(true)
  click('계속 재생'); expect(index()).toBe('1')
  act(() => { wait.progress(1) }); expect(index()).toBe('2')
})

it('cleans active StrictMode playback on unmount and ignores its saved completion', () => {
  preference(); const view = render(<StrictMode><App /></StrictMode>); finishEntrance(); click('재생')
  const motion = scene(), stale = motion.eventCallback('onComplete')!
  const elements = [...panel().getByRole('img').querySelectorAll('*')]
  view.unmount(); expect(motion.parent).toBeNull()
  act(() => { stale() })
  for (const element of elements) expect(gsap.getTweensOf(element)).toHaveLength(0)
})

it('Reverse-Delete autoplay preserves temporary 7 / two components, restored 11 and final 8', () => {
  preference(); render(<App />); finishEntrance(); const scope = panel('Reverse-Delete'); click('재생', scope)
  for (let step = 1; step <= 14; step++) {
    const motion = scene(scope)
    act(() => { motion.pause().time(motion.labels.reading + 0.01) })
    expect(index(scope)).toBe(String(step))
    if (step === 5) { expect(weight(scope)).toBe('7'); expect(scope.getByRole('list', { name: '연결 요소' }).children).toHaveLength(2) }
    if (step === 6) expect(weight(scope)).toBe('11')
    act(() => { motion.progress(1) })
  }
  expect(weight(scope)).toBe('8'); expect(scope.getByText(/^재생 완료/)).toBeDefined()
})

it('opens a central cut with two endpoint halves while retaining the previous confirmed graph until commit', () => {
  preference(); render(<App />); finishEntrance(); const scope = panel('Reverse-Delete'); next(scope)
  const motion = scene(scope), svg = scope.getByRole('img')
  act(() => { motion.pause().time(motion.labels.decision + 0.2) })
  const halves = [...svg.querySelectorAll<SVGLineElement>('.edge-cut')]
  expect(halves).toHaveLength(2)
  for (const half of halves) {
    expect(half.getAttribute('x2')).toBe('440'); expect(half.getAttribute('y2')).toBe('170')
    expect(Number(half.style.strokeDashoffset)).toBeGreaterThan(0)
    expect(Number(half.style.strokeDashoffset)).toBeLessThan(105)
  }
  expect(weight(scope)).toBe('23')
  act(() => { motion.progress(1) }); expect(weight(scope)).toBe('16')
  for (const half of halves) { expect(half.style.cssText).toBe(''); expect(half.getAttribute('opacity')).toBe('0') }
})

it('does not expose final completion or weight before settling, then emphasizes only the actual MST', () => {
  preference(); render(<App />); finishEntrance(); jump(4); next()
  const motion = scene()
  expect(weight()).toBe('4'); expect(panel().queryByText(/MST 구성 완료/)).toBeNull()
  act(() => { motion.pause().time(motion.labels.settle + 0.1) })
  expect(weight()).toBe('4')
  act(() => { motion.time(motion.labels.completion + 0.35) })
  expect(weight()).toBe('8'); expect(panel().getByText('MST 구성 완료 · 총 가중치 8')).toBeDefined()
  const effects = [...panel().getByRole('img').querySelectorAll<SVGLineElement>('.edge-effect')]
  expect(effects.filter(el => Number(el.style.opacity) > 0).map(el => el.parentElement!.getAttribute('data-edge-name')).sort()).toEqual(['AB', 'BC', 'BD', 'BE'])
  act(() => { motion.progress(1) })
  expect(panel().getByRole('img').querySelectorAll('[style]:not([style=""])')).toHaveLength(0)
})

it('Play during entrance cancels it and runs exactly one edge scene', () => {
  preference(); render(<App />)
  const vertex = panel().getByRole('img').querySelector('.vertex')!
  const intro = gsap.getTweensOf(vertex)[0].parent!
  click('재생'); expect(intro.parent).toBeNull()
  expect(index()).toBe('0'); expect(scene()).toBeDefined()
  expect(gsap.getTweensOf(vertex)).toHaveLength(0)
  click('다시 시작'); expect(index()).toBe('0')
})

it('duplicate Play commands in the same event create only one playback owner', () => {
  const result = kruskal(ASSIGNMENT_GRAPH)
  if (!result.ok) throw new Error('fixture')
  const run = result.value
  function Probe() {
    const svg = useRef<SVGSVGElement>(null), output = useRef<HTMLOutputElement>(null)
    const playback = useAlgorithmPlayback(run, svg, output)
    return <section aria-label="Kruskal"><button onClick={() => { playback.play(); playback.play() }}>두 번 재생 요청</button>
      <GraphView snapshot={playback.snapshot} target={playback.target} svgRef={svg} phase={playback.phase} name="Kruskal" />
      <output ref={output} aria-label="확정 단계">{playback.index}</output></section>
  }
  preference(); render(<Probe />); finishEntrance(); click('두 번 재생 요청')
  const motion = scene()
  const owners = [...panel().getByRole('img').querySelectorAll('.edge-effect')].flatMap(el => gsap.getTweensOf(el).map(t => t.parent))
  expect(new Set(owners).size).toBe(1)
  act(() => { motion.progress(1) })
  expect(panel().getByLabelText('확정 단계').textContent).toBe('1')
  expect(scene()).not.toBe(motion)
})

it('Play on a manually confirmed final step restarts even while completion emphasis is still running', () => {
  preference(); render(<App />); finishEntrance(); jump(4); next()
  const old = scene()
  act(() => { old.pause().time(old.labels.completion + 0.1) })
  expect(index()).toBe('5'); click('재생')
  expect(old.parent).toBeNull(); expect(index()).toBe('0')
  act(() => { scene().progress(1) }); expect(index()).toBe('1')
})
