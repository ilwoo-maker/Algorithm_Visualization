import { describe, expect, it } from 'vitest'
import { kruskal } from './kruskal'
import { reverseDelete } from './reverseDelete'
import type { Edge, Graph, MstRun, Snapshot } from './types'

const algorithms = [kruskal, reverseDelete] as const

/** Independent small-graph oracle: transitive closure, not production BFS or Union-Find. */
function reachability(vertices: readonly string[], edges: readonly Edge[]): boolean[][] {
  const matrix = vertices.map((_, i) => vertices.map((__, j) => i === j))
  for (const edge of edges) {
    const a = vertices.indexOf(edge.source)
    const b = vertices.indexOf(edge.target)
    matrix[a][b] = matrix[b][a] = true
  }
  for (let k = 0; k < vertices.length; k++) {
    for (let i = 0; i < vertices.length; i++) {
      for (let j = 0; j < vertices.length; j++) {
        matrix[i][j] ||= matrix[i][k] && matrix[k][j]
      }
    }
  }
  return matrix
}

function isTree(vertices: readonly string[], edges: readonly Edge[]): boolean {
  return edges.length === vertices.length - 1
    && reachability(vertices, edges).every((row) => row.every(Boolean))
}

function exhaustiveMinimum(graph: Graph): number {
  let minimum = Infinity
  for (let mask = 0; mask < 2 ** graph.edges.length; mask++) {
    const candidate = graph.edges.filter((_, index) => (mask & (1 << index)) !== 0)
    if (isTree(graph.vertices, candidate)) {
      minimum = Math.min(minimum, candidate.reduce((sum, edge) => sum + edge.weight, 0))
    }
  }
  return minimum
}

function activeEdges(step: Snapshot): Edge[] {
  const ids = new Set(step.activeEdgeIds)
  return step.edges.filter(({ id }) => ids.has(id))
}

function verifyTrace(graph: Graph, run: MstRun): void {
  const expectedVertices = [...graph.vertices].sort()
  for (const [index, step] of run.snapshots.entries()) {
    expect(step.index).toBe(index)
    expect(step.algorithm).toBe(run.algorithm)
    expect(step.what).toMatch(/[가-힣]/)
    expect(step.why).toMatch(/[가-힣]/)
    expect(step.edges).toHaveLength(graph.edges.length)
    expect(new Set(step.activeEdgeIds).size).toBe(step.activeEdgeIds.length)
    const active = activeEdges(step)
    expect(active).toHaveLength(step.activeEdgeIds.length)
    expect(step.totalWeight).toBe(active.reduce((sum, edge) => sum + edge.weight, 0))
    expect([...step.components.flat()].sort()).toEqual(expectedVertices)
    const connected = reachability(graph.vertices, active)
    for (let a = 0; a < graph.vertices.length; a++) {
      for (let b = 0; b < graph.vertices.length; b++) {
        expect(step.components.some((group) => group.includes(graph.vertices[a]) && group.includes(graph.vertices[b])))
          .toBe(connected[a][b])
      }
    }
    for (const edge of step.edges) {
      const original = graph.edges.find((input) =>
        (input.source === edge.source && input.target === edge.target)
        || (input.source === edge.target && input.target === edge.source))
      expect(original?.weight).toBe(edge.weight)
      const activeStatus = ['selected', 'present', 'kept'].includes(edge.status)
      expect(step.activeEdgeIds.includes(edge.id)).toBe(activeStatus)
    }

    if (index === 0) {
      expect(step.action).toBe('initialize')
      expect(step.reason).toBe('initial')
      expect(step.edgeId).toBeNull()
      continue
    }
    const previous = run.snapshots[index - 1]
    const edge = step.edges.find(({ id }) => id === step.edgeId)!
    expect(edge).toBeDefined()
    expect(step.what).toContain(edge.name)
    const a = graph.vertices.indexOf(edge.source)
    const b = graph.vertices.indexOf(edge.target)
    const previouslyConnected = reachability(graph.vertices, activeEdges(previous))[a][b]
    const without = previous.activeEdgeIds.filter((id) => id !== edge.id)
    const withEdge = [...previous.activeEdgeIds, edge.id].sort()
    if (step.action === 'accept') {
      expect(previouslyConnected).toBe(false)
      expect(step.reason).toBe('different-components')
      expect([...step.activeEdgeIds].sort()).toEqual(withEdge)
    } else if (step.action === 'reject') {
      expect(previouslyConnected).toBe(true)
      expect(step.reason).toBe('cycle')
      expect(step.why).toContain('사이클')
      expect(step.activeEdgeIds).toEqual(previous.activeEdgeIds)
    } else if (step.action === 'try-remove') {
      expect(previous.activeEdgeIds).toContain(edge.id)
      expect(step.reason).toBe('connectivity-check')
      expect(step.activeEdgeIds).toEqual(without)
      expect(edge.status).toBe('temporarily-removed')
    } else if (step.action === 'remove') {
      expect(previous.action).toBe('try-remove')
      expect(previous.components).toHaveLength(1)
      expect(step.reason).toBe('still-connected')
      expect(step.activeEdgeIds).toEqual(previous.activeEdgeIds)
      expect(edge.status).toBe('removed')
    } else if (step.action === 'restore') {
      expect(previous.action).toBe('try-remove')
      expect(previous.components.length).toBeGreaterThan(1)
      expect(step.reason).toBe('disconnects')
      expect(step.why).toContain('임시 제거')
      expect(step.why).toContain('연결 요소')
      for (const component of previous.components) {
        expect(step.why).toContain(`[${component.join(', ')}]`)
      }
      expect([...step.activeEdgeIds].sort()).toEqual(withEdge)
      expect(step.components).toHaveLength(1)
      expect(edge.status).toBe('kept')
    } else {
      throw new Error(`Unexpected action: ${step.action}`)
    }
  }
  const last = run.snapshots[run.snapshots.length - 1]
  expect(last.activeEdgeIds).toEqual(run.mst.map(({ id }) => id))
  expect(last.totalWeight).toBe(run.totalWeight)
  expect(last.components).toHaveLength(1)
}

const vertices = ['A', 'B', 'C', 'D']
const pairs = [['A', 'B'], ['A', 'C'], ['A', 'D'], ['B', 'C'], ['B', 'D'], ['C', 'D']]

describe('independent MST and execution-state verification', () => {
  it.each(Array.from({ length: 64 }, (_, mask) => mask))('checks every 4-vertex edge subset (mask %i)', (mask) => {
    const graph: Graph = {
      vertices,
      edges: pairs.flatMap(([source, target], index) =>
        (mask & (1 << index)) !== 0 ? [{ source, target, weight: ((index + mask) % 5) - 2 }] : []),
    }
    const expected = exhaustiveMinimum(graph)
    const savedInput = structuredClone(graph)
    for (const algorithm of algorithms) {
      const result = algorithm(graph)
      if (!Number.isFinite(expected)) {
        expect(result).toMatchObject({ ok: false, error: { code: 'DISCONNECTED_GRAPH' } })
      } else {
        if (result.ok === false) throw new Error(result.error.message)
        expect(isTree(graph.vertices, result.value.mst)).toBe(true)
        expect(result.value.totalWeight).toBe(expected)
        verifyTrace(graph, result.value)
        const permuted = {
          vertices: [...graph.vertices].reverse(),
          edges: [...graph.edges].reverse().map(({ source, target, weight }) => ({
            source: target, target: source, weight,
          })),
        }
        expect(algorithm(permuted)).toEqual(result)
      }
      expect(graph).toEqual(savedInput)
    }
  })

  it('finds the minimum for all 729 negative/zero/positive weightings of K4', () => {
    const weights = [-2, 0, 3]
    for (let assignment = 0; assignment < 3 ** pairs.length; assignment++) {
      const graph: Graph = {
        vertices,
        edges: pairs.map(([source, target], index) => ({
          source, target, weight: weights[Math.floor(assignment / 3 ** index) % 3],
        })),
      }
      const expected = exhaustiveMinimum(graph)
      for (const algorithm of algorithms) {
        const result = algorithm(graph)
        if (result.ok === false) throw new Error(result.error.message)
        expect(isTree(vertices, result.value.mst)).toBe(true)
        expect(result.value.totalWeight).toBe(expected)
      }
    }
  })

  it('supports zero, negative fractional weights and already-tree inputs', () => {
    const graph: Graph = {
      vertices: ['A', 'B', 'C'],
      edges: [
        { source: 'A', target: 'B', weight: -1.5 },
        { source: 'B', target: 'C', weight: 0 },
        { source: 'A', target: 'C', weight: 0.25 },
      ],
    }
    for (const algorithm of algorithms) {
      for (const input of [graph, { ...graph, edges: graph.edges.slice(0, 2) }]) {
        const result = algorithm(input)
        if (result.ok === false) throw new Error(result.error.message)
        expect(result.value.mst.map(({ name }) => name)).toEqual(['AB', 'BC'])
        expect(result.value.totalWeight).toBe(-1.5)
        verifyTrace(input, result.value)
      }
    }
  })

  it('keeps each algorithm deterministic when equal weights allow different optimal trees', () => {
    const graph: Graph = {
      vertices: ['A', 'B', 'C'],
      edges: [
        { source: 'B', target: 'C', weight: 1 },
        { source: 'A', target: 'C', weight: 1 },
        { source: 'A', target: 'B', weight: 1 },
      ],
    }
    const k = kruskal(graph)
    const r = reverseDelete(graph)
    if (k.ok === false || r.ok === false) throw new Error('Expected valid trees')
    expect(k.value.mst.map(({ name }) => name)).toEqual(['AB', 'AC'])
    expect(r.value.mst.map(({ name }) => name)).toEqual(['AC', 'BC'])
    expect(k.value.totalWeight).toBe(2)
    expect(r.value.totalWeight).toBe(2)
    verifyTrace(graph, k.value)
    verifyTrace(graph, r.value)
  })

  it('accepts arbitrary names without delimiter collisions or object-prototype interference', () => {
    const graph: Graph = {
      vertices: ['__proto__', 'constructor', 'A,B', '[C]'],
      edges: [
        { source: '__proto__', target: 'constructor', weight: 1 },
        { source: 'constructor', target: 'A,B', weight: 2 },
        { source: 'A,B', target: '[C]', weight: 3 },
        { source: '[C]', target: '__proto__', weight: 10 },
      ],
    }
    for (const algorithm of algorithms) {
      const result = algorithm(graph)
      if (result.ok === false) throw new Error(result.error.message)
      expect(result.value.totalWeight).toBe(6)
      expect(isTree(graph.vertices, result.value.mst)).toBe(true)
      verifyTrace(graph, result.value)
    }
  })

  it.each(algorithms)('never returns an infinite snapshot after rounding hides input-order overflow (%#)', (algorithm) => {
    const graph: Graph = {
      vertices: ['A', 'B', 'C'],
      edges: [
        { source: 'B', target: 'C', weight: Number.MAX_VALUE },
        { source: 'A', target: 'B', weight: 2 ** 969 },
        { source: 'A', target: 'C', weight: 2 ** 969 },
      ],
    }
    const result = algorithm(graph)
    expect(result).toMatchObject({ ok: false, error: { code: 'WEIGHT_OVERFLOW' } })
    expect(algorithm({ ...graph, edges: [...graph.edges].reverse() })).toEqual(result)
  })

  it.each([
    [null, 'INVALID_GRAPH'],
    [{ vertices: ['A', 'A'], edges: [] }, 'DUPLICATE_VERTEX'],
    [{ vertices: ['A'], edges: [{ source: 'A', target: 'A', weight: 1 }] }, 'SELF_LOOP'],
    [{ vertices: ['A'], edges: [{ source: 'A', target: 'B', weight: 1 }] }, 'UNKNOWN_VERTEX'],
    [{ vertices: ['A', 'B'], edges: [{ source: 'A', target: 'B', weight: Infinity }] }, 'INVALID_WEIGHT'],
    [{ vertices: ['A', 'B'], edges: [] }, 'DISCONNECTED_GRAPH'],
  ])('uses the common error contract for invalid input %#', (input, code) => {
    for (const algorithm of algorithms) {
      const result = algorithm(input)
      expect(result).toMatchObject({ ok: false, error: { code } })
      if (result.ok === false) expect(result.error.message).toMatch(/[가-힣]/)
    }
  })
})
