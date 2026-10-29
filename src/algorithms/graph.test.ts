import { describe, expect, it } from 'vitest'
import { connectedComponents, prepareGraph, sortEdges } from './graph'

describe('graph preparation', () => {
  it('normalizes endpoints and input order without changing the input', () => {
    const input = {
      vertices: ['C', 'A', 'B'],
      edges: [
        { source: 'C', target: 'A', weight: 3 },
        { source: 'C', target: 'B', weight: 1 },
        { source: 'B', target: 'A', weight: 2 },
      ],
    }
    const before = structuredClone(input)
    const result = prepareGraph(input)
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('Expected a valid graph')
    expect(result.value.vertices).toEqual(['A', 'B', 'C'])
    expect(result.value.edges.map(({ name }) => name)).toEqual(['AB', 'AC', 'BC'])
    expect(result.value.edges[0]).toMatchObject({ source: 'A', target: 'B', weight: 2 })
    expect(input).toEqual(before)
    input.edges[0].weight = 999
    expect(result.value.edges.find(({ name }) => name === 'AC')?.weight).toBe(3)
    expect(Object.isFrozen(result.value.edges[0])).toBe(true)
  })

  it('uses collision-free identities for multi-character vertex labels', () => {
    const result = prepareGraph({
      vertices: ['A', 'AB', 'BC', 'C'],
      edges: [
        { source: 'A', target: 'BC', weight: 1 },
        { source: 'AB', target: 'C', weight: 2 },
        { source: 'A', target: 'C', weight: 3 },
      ],
    })
    expect(result.ok).toBe(true)
    if (!result.ok) throw new Error('Expected a valid graph')
    expect(new Set(result.value.edges.map(({ id }) => id)).size).toBe(3)
    expect(new Set(result.value.edges.map(({ name }) => name)).size).toBe(3)
  })

  it('sorts equal weights by normalized name in both weight directions', () => {
    const result = prepareGraph({
      vertices: ['D', 'C', 'B'],
      edges: [
        { source: 'D', target: 'B', weight: 1 },
        { source: 'C', target: 'B', weight: 1 },
        { source: 'D', target: 'C', weight: 5 },
      ],
    })
    if (!result.ok) throw new Error('Expected a valid graph')
    expect(sortEdges(result.value.edges, 'ascending').map(({ name }) => name))
      .toEqual(['BC', 'BD', 'CD'])
    expect(sortEdges(result.value.edges, 'descending').map(({ name }) => name))
      .toEqual(['CD', 'BC', 'BD'])
    expect(result.value.edges.map(({ name }) => name)).toEqual(['BC', 'BD', 'CD'])
  })

  const invalidInputs: readonly [string, unknown, string][] = [
    ['null', null, 'INVALID_GRAPH'],
    ['missing fields', {}, 'INVALID_GRAPH'],
    ['non-array vertices', { vertices: 'A', edges: [] }, 'INVALID_GRAPH'],
    ['non-array edges', { vertices: ['A'], edges: null }, 'INVALID_GRAPH'],
    ['empty graph', { vertices: [], edges: [] }, 'INVALID_GRAPH'],
    ['empty vertex', { vertices: [''], edges: [] }, 'INVALID_VERTEX'],
    ['non-string vertex', { vertices: [1], edges: [] }, 'INVALID_VERTEX'],
    ['duplicate vertex', { vertices: ['A', 'A'], edges: [] }, 'DUPLICATE_VERTEX'],
    ['null edge', { vertices: ['A'], edges: [null] }, 'INVALID_EDGE'],
    ['missing endpoint', { vertices: ['A'], edges: [{ weight: 1 }] }, 'INVALID_EDGE'],
    ['unknown vertex', { vertices: ['A'], edges: [{ source: 'A', target: 'B', weight: 1 }] }, 'UNKNOWN_VERTEX'],
    ['self loop', { vertices: ['A'], edges: [{ source: 'A', target: 'A', weight: 1 }] }, 'SELF_LOOP'],
    ['NaN weight', { vertices: ['A', 'B'], edges: [{ source: 'A', target: 'B', weight: NaN }] }, 'INVALID_WEIGHT'],
    ['infinite weight', { vertices: ['A', 'B'], edges: [{ source: 'A', target: 'B', weight: Infinity }] }, 'INVALID_WEIGHT'],
    ['string weight', { vertices: ['A', 'B'], edges: [{ source: 'A', target: 'B', weight: '1' }] }, 'INVALID_WEIGHT'],
    ['reversed duplicate', {
      vertices: ['A', 'B'],
      edges: [{ source: 'A', target: 'B', weight: 1 }, { source: 'B', target: 'A', weight: 2 }],
    }, 'DUPLICATE_EDGE'],
    ['disconnected graph', { vertices: ['A', 'B'], edges: [] }, 'DISCONNECTED_GRAPH'],
    ['overflowing weight sums', {
      vertices: ['A', 'B', 'C'],
      edges: [{ source: 'A', target: 'B', weight: Number.MAX_VALUE }, { source: 'B', target: 'C', weight: Number.MAX_VALUE }],
    }, 'WEIGHT_OVERFLOW'],
  ]

  it.each(invalidInputs)('returns an explicit Korean error for %s', (_name, input, code) => {
    const result = prepareGraph(input)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('Expected invalid input')
    expect(result.error.code).toBe(code)
    expect(result.error.message).toMatch(/[가-힣]/)
  })

  it('accepts a singleton graph and finite zero, negative and fractional weights', () => {
    expect(prepareGraph({ vertices: ['A'], edges: [] }).ok).toBe(true)
    expect(prepareGraph({
      vertices: ['A', 'B', 'C'],
      edges: [
        { source: 'A', target: 'B', weight: -1.5 },
        { source: 'A', target: 'C', weight: 0 },
      ],
    }).ok).toBe(true)
  })

  it('rejects overflowing canonical sums regardless of input order near MAX_VALUE', () => {
    const edges = [
      { source: 'B', target: 'C', weight: Number.MAX_VALUE },
      { source: 'A', target: 'B', weight: 2 ** 969 },
      { source: 'A', target: 'C', weight: 2 ** 969 },
    ]
    const original = prepareGraph({ vertices: ['A', 'B', 'C'], edges })
    const reversed = prepareGraph({ vertices: ['A', 'B', 'C'], edges: [...edges].reverse() })
    expect(original).toMatchObject({ ok: false, error: { code: 'WEIGHT_OVERFLOW' } })
    expect(reversed).toEqual(original)
  })
})

describe('shared BFS connectivity', () => {
  it('includes isolated vertices and respects undirected edges', () => {
    expect(connectedComponents(['A', 'B', 'C', 'D', 'E'], [
      { source: 'B', target: 'A', weight: 1 },
      { source: 'C', target: 'B', weight: 2 },
      { source: 'D', target: 'E', weight: 3 },
    ])).toEqual([['A', 'B', 'C'], ['D', 'E']])
    expect(connectedComponents(['A', 'B'], [])).toEqual([['A'], ['B']])
    expect(connectedComponents(['A'], [])).toEqual([['A']])
  })
})
