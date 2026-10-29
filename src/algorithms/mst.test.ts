import { describe, expect, it } from 'vitest'
import { ASSIGNMENT_GRAPH } from './fixtures'
import { kruskal } from './kruskal'
import { reverseDelete } from './reverseDelete'
import type { MstRun, Result, Snapshot } from './types'

function requireRun(result: Result<MstRun>): MstRun {
  if (result.ok === false) throw new Error(result.error.message)
  return result.value
}

function activeNames(snapshot: Snapshot): string[] {
  return snapshot.edges.filter(({ id }) => snapshot.activeEdgeIds.includes(id)).map(({ name }) => name)
}

function currentName(snapshot: Snapshot): string | null {
  return snapshot.edges.find(({ id }) => id === snapshot.edgeId)?.name ?? null
}

function expectDeepFrozen(value: unknown): void {
  if (value === null || typeof value !== 'object') return
  expect(Object.isFrozen(value)).toBe(true)
  for (const child of Object.values(value)) expectDeepFrozen(child)
}

describe('Kruskal', () => {
  it('chooses BC, BD, AB, rejects AC, then chooses BE for weight 8', () => {
    const run = requireRun(kruskal(ASSIGNMENT_GRAPH))
    expect(run.algorithm).toBe('kruskal')
    expect(run.mst.map(({ name }) => name)).toEqual(['AB', 'BC', 'BD', 'BE'])
    expect(run.mst).toHaveLength(4)
    expect(run.totalWeight).toBe(8)
    expect(run.snapshots.map(currentName)).toEqual([null, 'BC', 'BD', 'AB', 'AC', 'BE'])
    expect(run.snapshots.map(({ action }) => action))
      .toEqual(['initialize', 'accept', 'accept', 'accept', 'reject', 'accept'])
  })

  it('records the exact active graph, weight and component partition at every step', () => {
    const run = requireRun(kruskal(ASSIGNMENT_GRAPH))
    expect(run.snapshots.map(activeNames)).toEqual([
      [], ['BC'], ['BC', 'BD'], ['AB', 'BC', 'BD'], ['AB', 'BC', 'BD'], ['AB', 'BC', 'BD', 'BE'],
    ])
    expect(run.snapshots.map(({ totalWeight }) => totalWeight)).toEqual([0, 1, 2, 4, 4, 8])
    expect(run.snapshots.map(({ components }) => components)).toEqual([
      [['A'], ['B'], ['C'], ['D'], ['E']],
      [['A'], ['B', 'C'], ['D'], ['E']],
      [['A'], ['B', 'C', 'D'], ['E']],
      [['A', 'B', 'C', 'D'], ['E']],
      [['A', 'B', 'C', 'D'], ['E']],
      [['A', 'B', 'C', 'D', 'E']],
    ])
    run.snapshots.forEach((step, index) => {
      expect(step.index).toBe(index)
      expect(step.algorithm).toBe('kruskal')
      expect(step.what).toMatch(/[가-힣]/)
      expect(step.why).toMatch(/[가-힣]/)
      expect(step.edges).toHaveLength(7)
      expect(step.edges.filter(({ status }) => status === 'selected').map(({ name }) => name))
        .toEqual(activeNames(step))
      expect(step.edges.filter(({ status }) => status === 'rejected').map(({ name }) => name))
        .toEqual(index >= 4 ? ['AC'] : [])
      expect(step.edges.filter(({ name }) => name === 'CD' || name === 'DE').map(({ status }) => status))
        .toEqual(['pending', 'pending'])
      if (step.action === 'accept') expect(step.reason).toBe('different-components')
    })
  })

  it('explains AC rejection as a cycle within the existing A-B-C component', () => {
    const run = requireRun(kruskal(ASSIGNMENT_GRAPH))
    const rejected = run.snapshots[4]
    expect(rejected.reason).toBe('cycle')
    expect(rejected.what).toContain('AC')
    expect(rejected.why).toContain('사이클')
    expect(rejected.why).toContain('같은 연결 요소')
    expect(rejected.components.some((group) => group.includes('A') && group.includes('C'))).toBe(true)
    expect(rejected.activeEdgeIds).toEqual(run.snapshots[3].activeEdgeIds)
  })

  it('keeps early snapshots unchanged after later unions and caller mutation', () => {
    const input = {
      vertices: [...ASSIGNMENT_GRAPH.vertices],
      edges: ASSIGNMENT_GRAPH.edges.map((edge) => ({ ...edge })),
    }
    const before = structuredClone(input)
    const result = kruskal(input)
    const run = requireRun(result)
    expect(input).toEqual(before)
    const saved = structuredClone(run)
    input.vertices[0] = 'Z'
    input.edges[0].weight = 999
    expect(run).toEqual(saved)
    expectDeepFrozen(result)
    expect(Reflect.set(run.snapshots[0], 'totalWeight', 999)).toBe(false)
    expect(Reflect.set(run.snapshots[1].edges[0], 'weight', 999)).toBe(false)
    expect(Reflect.set(run.snapshots[2].components[0], '0', 'Z')).toBe(false)
    expect(run.snapshots[0].edges.every(({ status }) => status === 'pending')).toBe(true)
    expect(run.snapshots[1].edges.find(({ name }) => name === 'BD')?.status).toBe('pending')
    expect(run.snapshots.at(-1)?.edges.find(({ name }) => name === 'BD')?.status).toBe('selected')
  })

  it('replays exactly when vertex order, edge order and endpoint directions change', () => {
    const variant = {
      vertices: [...ASSIGNMENT_GRAPH.vertices].reverse(),
      edges: [...ASSIGNMENT_GRAPH.edges].reverse().map(({ source, target, weight }) => ({
        source: target, target: source, weight,
      })),
    }
    expect(kruskal(variant)).toEqual(kruskal(ASSIGNMENT_GRAPH))
    expect(kruskal(ASSIGNMENT_GRAPH)).toEqual(kruskal(ASSIGNMENT_GRAPH))
  })

  it('returns the initial empty tree for a singleton and errors for disconnected input', () => {
    const run = requireRun(kruskal({ vertices: ['A'], edges: [] }))
    expect(run.mst).toEqual([])
    expect(run.totalWeight).toBe(0)
    expect(run.snapshots).toHaveLength(1)
    expect(run.snapshots[0].components).toEqual([['A']])
    expect(kruskal({ vertices: ['A', 'B'], edges: [] })).toMatchObject({
      ok: false, error: { code: 'DISCONNECTED_GRAPH' },
    })
  })
})

describe('Reverse-Delete', () => {
  it('deletes DE, CD, AC and keeps BE, AB, BC, BD for weight 8', () => {
    const run = requireRun(reverseDelete(ASSIGNMENT_GRAPH))
    expect(run.algorithm).toBe('reverse-delete')
    expect(run.mst.map(({ name }) => name)).toEqual(['AB', 'BC', 'BD', 'BE'])
    expect(run.mst).toHaveLength(4)
    expect(run.totalWeight).toBe(8)
    expect(run.mst).toEqual(requireRun(kruskal(ASSIGNMENT_GRAPH)).mst)
    expect(run.snapshots).toHaveLength(15)
    expect(run.snapshots.filter(({ action }) => action === 'try-remove').map(currentName))
      .toEqual(['DE', 'CD', 'BE', 'AC', 'AB', 'BC', 'BD'])
    expect(run.snapshots.filter(({ action }) => action === 'remove').map(currentName))
      .toEqual(['DE', 'CD', 'AC'])
    expect(run.snapshots.filter(({ action }) => action === 'restore').map(currentName))
      .toEqual(['BE', 'AB', 'BC', 'BD'])
  })

  it('records each temporary removal and its decision with the exact active graph', () => {
    const run = requireRun(reverseDelete(ASSIGNMENT_GRAPH))
    const all = ['AB', 'AC', 'BC', 'BD', 'BE', 'CD', 'DE']
    expect(run.snapshots.map(activeNames)).toEqual([
      all,
      ['AB', 'AC', 'BC', 'BD', 'BE', 'CD'], ['AB', 'AC', 'BC', 'BD', 'BE', 'CD'],
      ['AB', 'AC', 'BC', 'BD', 'BE'], ['AB', 'AC', 'BC', 'BD', 'BE'],
      ['AB', 'AC', 'BC', 'BD'], ['AB', 'AC', 'BC', 'BD', 'BE'],
      ['AB', 'BC', 'BD', 'BE'], ['AB', 'BC', 'BD', 'BE'],
      ['BC', 'BD', 'BE'], ['AB', 'BC', 'BD', 'BE'],
      ['AB', 'BD', 'BE'], ['AB', 'BC', 'BD', 'BE'],
      ['AB', 'BC', 'BE'], ['AB', 'BC', 'BD', 'BE'],
    ])
    expect(run.snapshots.map(({ totalWeight }) => totalWeight))
      .toEqual([23, 16, 16, 11, 11, 7, 11, 8, 8, 6, 8, 7, 8, 7, 8])
    expect(run.snapshots.map(({ components }) => components)).toEqual([
      [['A', 'B', 'C', 'D', 'E']],
      [['A', 'B', 'C', 'D', 'E']], [['A', 'B', 'C', 'D', 'E']],
      [['A', 'B', 'C', 'D', 'E']], [['A', 'B', 'C', 'D', 'E']],
      [['A', 'B', 'C', 'D'], ['E']], [['A', 'B', 'C', 'D', 'E']],
      [['A', 'B', 'C', 'D', 'E']], [['A', 'B', 'C', 'D', 'E']],
      [['A'], ['B', 'C', 'D', 'E']], [['A', 'B', 'C', 'D', 'E']],
      [['A', 'B', 'D', 'E'], ['C']], [['A', 'B', 'C', 'D', 'E']],
      [['A', 'B', 'C', 'E'], ['D']], [['A', 'B', 'C', 'D', 'E']],
    ])

    const removed: string[] = []
    const kept: string[] = []
    run.snapshots.forEach((step, index) => {
      expect(step.index).toBe(index)
      expect(step.algorithm).toBe('reverse-delete')
      expect(step.what).toMatch(/[가-힣]/)
      expect(step.why).toMatch(/[가-힣]/)
      expect(step.edges).toHaveLength(7)
      if (index === 0) {
        expect(step.edges.every(({ status }) => status === 'present')).toBe(true)
        return
      }
      const name = currentName(step)!
      expect(step.what).toContain(name)
      if (index % 2 === 1) {
        expect(step.action).toBe('try-remove')
        expect(step.reason).toBe('connectivity-check')
        expect(step.edges.filter(({ status }) => status === 'temporarily-removed').map(({ name: label }) => label))
          .toEqual([name])
      } else {
        const attempt = run.snapshots[index - 1]
        expect(step.reason).toBe(attempt.components.length === 1 ? 'still-connected' : 'disconnects')
        expect(step.action).toBe(attempt.components.length === 1 ? 'remove' : 'restore')
        expect(step.components).toHaveLength(1)
        if (step.action === 'remove') removed.push(name)
        else kept.push(name)
        expect(step.edges.some(({ status }) => status === 'temporarily-removed')).toBe(false)
      }
      expect(step.edges.filter(({ status }) => status === 'removed').map(({ name: label }) => label).sort())
        .toEqual([...removed].sort())
      expect(step.edges.filter(({ status }) => status === 'kept').map(({ name: label }) => label).sort())
        .toEqual([...kept].sort())
    })
  })

  it('cancels BE deletion because temporarily removing it isolates E', () => {
    const run = requireRun(reverseDelete(ASSIGNMENT_GRAPH))
    const attempt = run.snapshots[5]
    const restored = run.snapshots[6]
    expect(currentName(attempt)).toBe('BE')
    expect(attempt.components).toEqual([['A', 'B', 'C', 'D'], ['E']])
    expect(restored.action).toBe('restore')
    expect(restored.reason).toBe('disconnects')
    expect(restored.what).toContain('복구')
    expect(restored.why).toContain('임시 제거')
    expect(restored.why).toContain('연결 요소')
    expect(restored.why).toContain('[E]')
    expect(restored.activeEdgeIds).toEqual(run.snapshots[4].activeEdgeIds)
  })

  it('does not mutate input or earlier temporary-removal states when restoring an edge', () => {
    const input = {
      vertices: [...ASSIGNMENT_GRAPH.vertices],
      edges: ASSIGNMENT_GRAPH.edges.map((edge) => ({ ...edge })),
    }
    const before = structuredClone(input)
    const result = reverseDelete(input)
    const run = requireRun(result)
    expect(input).toEqual(before)
    const saved = structuredClone(run)
    input.edges[0].weight = -999
    input.vertices.push('Z')
    expect(run).toEqual(saved)
    expectDeepFrozen(result)
    expect(Reflect.set(run.snapshots[5].edges, '0', {})).toBe(false)
    expect(Reflect.set(run.snapshots[5].activeEdgeIds, '0', 'fake')).toBe(false)
    expect(run.snapshots[5].edges.find(({ name }) => name === 'BE')?.status).toBe('temporarily-removed')
    expect(run.snapshots[6].edges.find(({ name }) => name === 'BE')?.status).toBe('kept')
    expect(run.snapshots[0].edges.find(({ name }) => name === 'DE')?.status).toBe('present')
    expect(run.snapshots.at(-1)?.edges.find(({ name }) => name === 'DE')?.status).toBe('removed')
  })

  it('replays exactly after input permutation and returns a singleton without attempts', () => {
    const variant = {
      vertices: [...ASSIGNMENT_GRAPH.vertices].reverse(),
      edges: [...ASSIGNMENT_GRAPH.edges].reverse().map(({ source, target, weight }) => ({
        source: target, target: source, weight,
      })),
    }
    expect(reverseDelete(variant)).toEqual(reverseDelete(ASSIGNMENT_GRAPH))
    expect(reverseDelete(ASSIGNMENT_GRAPH)).toEqual(reverseDelete(ASSIGNMENT_GRAPH))
    const single = requireRun(reverseDelete({ vertices: ['A'], edges: [] }))
    expect(single.mst).toEqual([])
    expect(single.totalWeight).toBe(0)
    expect(single.snapshots).toHaveLength(1)
    expect(reverseDelete({ vertices: ['A', 'B'], edges: [] })).toMatchObject({
      ok: false, error: { code: 'DISCONNECTED_GRAPH' },
    })
  })
})
